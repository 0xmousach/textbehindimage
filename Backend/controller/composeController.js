import sharp from "sharp";
import fs from "fs";
import * as ort from "onnxruntime-node";

// ---- U2Net session (CPU) ----
let u2netSessionPromise;
async function getU2NetSession() {
  if (!u2netSessionPromise) {
    const modelPath = "C:/Users/cheem/Documents/Projects/textbehindvideo/Backend/models/u2netp.onnx";
    if (!fs.existsSync(modelPath)) {
      throw new Error(`U²-Net ONNX not found at: ${modelPath}`);
    }
    // CPU is default; do NOT pass "cpuExecutionProvider"
    u2netSessionPromise = ort.InferenceSession.create(modelPath);
    // Or explicitly: ort.InferenceSession.create(modelPath, { executionProviders: ["cpu"] })
  }
  return u2netSessionPromise;
}

function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function createTextLayer(text, width, height, opts = {}) {
  const {
    x = "50%", y = "90%", fontSize = 64,
    fill = "white", stroke = "black", strokeWidth = 2,
    fontFamily = "sans-serif", textAnchor = "middle", opacity = 0.9,
  } = opts;

  const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="none"/>
    <text x="${x}" y="${y}"
          font-size="${fontSize}" font-family="${fontFamily}" text-anchor="${textAnchor}"
          fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}">
      ${escapeXml(text)}
    </text>
  </svg>`.trim();

  // Important: SVG as Buffer
  return Buffer.from(svg, "utf-8");
}

async function createMask(imageBuffer) {
  const preSize = 320;

  // Read & resize to model input
  const { data } = await sharp(imageBuffer)
    .removeAlpha()
    .resize(preSize, preSize, { fit: "cover" })
    .raw()
    .toBuffer({ resolveWithObject: true }); // Uint8 HWC

  // HWC -> CHW, normalize [0,1]
  const floatData = new Float32Array(preSize * preSize * 3);
  let idx = 0;
  for (let c = 0; c < 3; c++) {
    for (let y = 0; y < preSize; y++) {
      for (let x = 0; x < preSize; x++) {
        const i = (y * preSize + x) * 3 + c;
        floatData[idx++] = data[i] / 255.0;
      }
    }
  }

  const session = await getU2NetSession();
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];

  const tensor = new ort.Tensor("float32", floatData, [1, 3, preSize, preSize]);
  const outputs = await session.run({ [inputName]: tensor });
  const sal = outputs[outputName].data; // Float32Array length 320*320

  // Normalize 0..255
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < sal.length; i++) {
    const v = sal[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;

  const gray = Buffer.allocUnsafe(sal.length);
  for (let i = 0; i < sal.length; i++) {
    gray[i] = Math.round(((sal[i] - min) / range) * 255);
  }

  const orig = await sharp(imageBuffer).metadata();
  const mask = await sharp(gray, { raw: { width: preSize, height: preSize, channels: 1 } })
    .resize(orig.width, orig.height, { kernel: sharp.kernel.lanczos3 })
    .toBuffer();

  return { mask, width: orig.width, height: orig.height };
}

export async function composeImage(req, res) {
  try {
    // Exactly two inputs: image (file) and text (string)
    const imageFile = req.file;
    const text = req.body?.text || "";

    if (!imageFile?.buffer) {
      return res.status(400).json({ error: "No image uploaded. Field name should be 'image'." });
    }

    // Quick probe: make sure the image buffer is valid (prevents "unsupported image format")
    await sharp(imageFile.buffer).metadata();

    const { mask, width, height } = await createMask(imageFile.buffer);

    // Foreground with alpha = mask
    const foregroundRGBA = await sharp(imageFile.buffer)
      .ensureAlpha()
      //.joinChannel(mask)
      .png()
      .toBuffer();

    // Transparent background
    const base = sharp({
      create: {
        width, height, channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    }).png();

    const composites = [{ input: foregroundRGBA, blend: "over" }];

    if (text && text.trim().length > 0) {
      const textLayer = await createTextLayer(text, width, height, { fontSize: 48 });
      // optional: validate svg buffer
      await sharp(textLayer).metadata();
      composites.push({ input: textLayer, top: 0, left: 0 });
    }

    const outBuffer = await base.composite(composites).toBuffer();

    res.set("Content-Type", "image/png");
    return res.status(200).send(outBuffer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to compose image", errorDetails: error.message });
  }
}
