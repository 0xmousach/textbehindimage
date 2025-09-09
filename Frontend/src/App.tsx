import { useState } from 'react'

import './App.css'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { Upload } from './Pages/upload'
import { Generate } from './Pages/generate'
import { Login } from './Pages/login'

function App() {
  

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="/upload" element={<Upload/>}/>
        <Route path="/generate" element={<Generate/>}/>
      </Routes>
    </Router>
  )
}

export default App
