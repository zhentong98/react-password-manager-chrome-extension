import * as React from 'react'
import * as ReactDOM from 'react-dom'

import './popup.css'

import LoginComponent from "../components/auth/login";
import DashboardComponent from "../components/dashboard";
import {useEffect, useState} from "react";
import {
    getIsLoggin
} from "../utils/storage";

const App: React.FC<{}> = () => {

    const [isLogin, setIsLogin] = useState<boolean>(null)

    useEffect(() => {
        getIsLoggin()
            .then(isLogin => {
                setIsLogin(isLogin)
            })
    }, [])


    if(!isLogin){
        return  <LoginComponent></LoginComponent>
    }


    return (
        <DashboardComponent></DashboardComponent>
    )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.render(<App />, root)


