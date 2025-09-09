import { useNavigate } from "react-router-dom";

function LogoutButton(){
    const navigate = useNavigate();
    const handleLogout = () => {
        navigate("/");
    }
    return(
        <button className="logout-button" onClick={handleLogout}>Logout</button> 
    )
}
 export default LogoutButton;