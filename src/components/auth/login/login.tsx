import * as React from "react";
import {useState} from "react";
import {userLogin} from "../../../utils/firebase";
import {setIsLoggin, setUserAuthData} from "../../../utils/storage";

import './login.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import DashboardComponent from "../../dashboard";


const LoginComponent: React.FC<{}> = () => {

    const [email, setEmail] = useState<string>('')
    const [emailCheckingStatus, setEmailCheckingStatus] = useState<boolean>(true)
    const [password, setPassword] = useState<string>('')
    const [passwordCheckingStatus, setPasswordCheckingStatus] = useState<boolean>(true)

    const [isLogin, setIsLogin] = useState<boolean>(false)
    const [hasError, setHasError] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState<string>('')

    const handleLoginButtonClick = () => {
        if (!email.trim() || !password.trim()) {
            if (!email.trim()) {
                setEmailCheckingStatus(false)
            }
            if (!password.trim()) {
                setPasswordCheckingStatus(false)
            }
            return
        }

        userLogin(email, password)
            .then(response => {
                // Remove the error
                setHasError(false)
                setErrorMessage('')

                // isLogin for this component
                setIsLogin(true)
                // Set the user login status to true in storage
                setIsLoggin(true)
                // Set the uid and the email in storage
                setUserAuthData({uid: response.user.uid, email: email.toLowerCase()})

            })
            .catch(err => {
                setHasError(true)
                setErrorMessage(err.message)
            })
    }

    function handleOnChange(field: string, value: string) {
        if (field === 'email') {
            if (!value.trim()) {
                setEmailCheckingStatus(false)
            } else {
                setEmailCheckingStatus(true)
            }
            setEmail(value)
        } else if (field === 'password') {
            if (!value.trim()) {
                setPasswordCheckingStatus(false)
            } else {
                setPasswordCheckingStatus(true)
            }
            setPassword(value)
        }
    }

    if(isLogin){
        return <DashboardComponent></DashboardComponent>
    }

    return (
        <div className="container mt-3">
            <h1 className="text-center text-light">Login</h1>
            <form className={'mt-5'}>

                {/* For error message from firebase */}
                <>
                    {
                        hasError &&
                        <div className="alert alert-danger" role="alert">
                            {errorMessage}
                        </div>
                    }
                </>

                <div className={'form-group'}>
                    <input type="email" className="form-control" placeholder="E-Mail" id='email'
                           onChange={(event) => handleOnChange('email', event.target.value)}/>

                    <>
                        {
                            emailCheckingStatus === false &&
                            <div className="text-danger mt-1">
                                * This field is required.
                            </div>
                        }
                    </>
                </div>

                <div className="form-group mt-3">
                    <input type="password" className="form-control" placeholder="Password" id={'password'}
                           onChange={(event) => handleOnChange('password', event.target.value)}/>
                    <>
                        {
                            passwordCheckingStatus === false &&
                            <div className="text-danger mt-1">
                                * This field is required.
                            </div>
                        }
                    </>
                </div>

                <button type="button" className="btn btn-dark btn-lg btn-block mt-3 login-button"
                        onClick={handleLoginButtonClick}>Login
                </button>

                <a className="text-center mt-3 d-block">Register ?</a>
            </form>
        </div>
    )
}

export default LoginComponent
