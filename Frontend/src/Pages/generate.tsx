import { useState } from "react"
import LogoutButton from "../Components/logoutButton"
import AppLabel from "../Components/appLabel"  

export function Generate() {
    return (
        <div>
            <AppLabel />
            <LogoutButton /> 
        </div>
        
    )
}