import * as React from "react";
import * as ReactDOM from 'react-dom'
import {getCredentialsListStorage} from "../utils/storage";
import {useEffect, useState} from "react";
import {credentialInterface} from "../utils/firebase";
import $ from 'jquery';

import './contentScript.css'
import {act} from "react-dom/test-utils";


type state = "loading" | "error" | "ready"


const App: React.FC<{}> = () => {

    let usernameInput: HTMLInputElement = null;
    let passwordInput: HTMLInputElement = null;

    const [credentialsList, setCredentialsList] = useState<credentialInterface[] | null>([])
    const [state, setState] = useState<state>('loading')
    useEffect(() => {

        // Get the activated url
        const activeUrl = new URL((window.location.href))
        let urlFormatted = ''

        // format the url with 'www.example.com' or 'example.com'
        if (activeUrl.hostname.substr(0, 3) != 'www') {
            urlFormatted = 'www.' + activeUrl.hostname
        } else {
            const hostname = activeUrl.hostname
            const length = hostname.length
            urlFormatted = hostname.slice(4, length);
        }

        getCredentialsListStorage()
            .then((responseCredentialsList) => {

                    // If the url is null then declare the empty string
                    responseCredentialsList.forEach(value => {
                        value.url = value.url == null ? '' : value.url
                    })

                    // Filter the array only select the credentials for the activated url
                    const filterArray = responseCredentialsList.filter((element) => {
                        return element.url.indexOf(activeUrl.hostname) > -1 || element.url.indexOf(urlFormatted) > -1
                    })

                    if (filterArray.length > 0) {

                        // Sort by the pathname
                        filterArray.sort((a, b) => {

                            if (a.url.toLowerCase().indexOf(activeUrl.pathname) < b.url.toLowerCase().indexOf(activeUrl.pathname)) {
                                return 1
                            } else if (a.url.toLowerCase().indexOf(activeUrl.pathname) > b.url.toLowerCase().indexOf(activeUrl.pathname)) {
                                return -1
                            }

                            return 0
                        })

                        // Set the credentials array
                        setCredentialsList(filterArray)

                        if (filterArray.length > 0) {

                            // Get the username and password input field.
                            const inputs = document.getElementsByTagName("input");

                            new Promise<void>((resolve) => {
                                for (let i = 0; i < inputs.length; i++) {
                                    var input = inputs[i];     //look at whatever input

                                    if (
                                        ((input.type == "text" &&
                                            (input.name.toLowerCase().indexOf("login") != -1
                                                || input.name.toLowerCase().indexOf("user") != -1
                                                || input.name == "AgentAccount"))
                                            || input.name.toLowerCase() == "loginform:username") || (input.type == 'email' ||
                                        (input.name.toLowerCase().indexOf('login') != -1 || input.name.toLowerCase().indexOf("user") != -1 || input.name == 'email'))) {
                                        usernameInput = input
                                    }

                                    if ((input.type == "password" && (input.name.toLowerCase().indexOf("auth") == -1)) || input.name.toLowerCase() == "loginform:password") {
                                        passwordInput = input
                                    }

                                    if (i === inputs.length - 1) resolve()
                                }
                            }).then(() => {

                                if (usernameInput && passwordInput) {

                                    usernameInput.focus()
                                    usernameInput.parentNode.insertBefore(createPasswordSuggestionElements(), usernameInput.nextSibling)

                                    usernameInput.addEventListener('focus', () => {
                                        usernameInput.parentNode.insertBefore(createPasswordSuggestionElements(), usernameInput.nextSibling)
                                    })

                                    usernameInput.addEventListener('focusout', () => {
                                        removeThePasswordSuggestionMenu()
                                    })

                                    usernameInput.addEventListener('keydown', () => {
                                        removeThePasswordSuggestionMenu()
                                    })

                                    passwordInput.addEventListener('focus', () => {
                                        passwordInput.parentNode.insertBefore(createPasswordSuggestionElements(), passwordInput.nextSibling)
                                    })

                                    passwordInput.addEventListener('focusout', () => {
                                        removeThePasswordSuggestionMenu()
                                    })

                                    passwordInput.addEventListener('keydown', () => {
                                        removeThePasswordSuggestionMenu()
                                    })

                                }

                                setState('ready')
                            })
                        }
                    } else {

                        const inputs = document.getElementsByTagName("input");

                        new Promise<void>((resolve) => {
                            for (let i = 0; i < inputs.length; i++) {
                                var input = inputs[i];     //look at whatever input

                                if ((input.type == "text" && (input.name.toLowerCase().indexOf("login") != -1 || input.name.toLowerCase().indexOf("user") != -1 || input.name == "AgentAccount")) || input.name.toLowerCase() == "loginform:username") {
                                    usernameInput = input
                                }

                                if ((input.type == "password" && (input.name.toLowerCase().indexOf("auth") == -1)) || input.name.toLowerCase() == "loginform:password") {
                                    passwordInput = input
                                }

                                if (i === inputs.length - 1) resolve()
                            }
                        }).then(() => {

                            if (usernameInput && passwordInput) {

                                var wrapper = document.createElement('div')
                                let html = '<div class="password-suggestions"><ul role="menu"><li id="emptyItemList"><div class="emptyItemList"><h3>No items to show.</h3></div></li></ul><p class="text"> Password Suggestions </p></div>'
                                wrapper.innerHTML = html
                                // wrapper.firstChild

                                usernameInput.focus()
                                usernameInput.parentNode.insertBefore(wrapper, usernameInput.nextSibling)


                                usernameInput.addEventListener('focus', () => {
                                    usernameInput.parentNode.insertBefore(wrapper, usernameInput.nextSibling)
                                })

                                usernameInput.addEventListener('keydown', () => {
                                    removeNoItemMenu()
                                })

                                passwordInput.addEventListener('focus', () => {
                                    passwordInput.parentNode.insertBefore(wrapper, passwordInput.nextSibling)
                                })

                            }
                            setState('ready')
                        })
                    }
                }
            )

    }, [state])

    function createPasswordSuggestionElements() {
        var wrapper = document.createElement('div')

        let html = '<div class="password-suggestions"><ul role="menu">';

        credentialsList.forEach((value, index, array) => {

            html += '<li class="onSelectCredentials" id="' + value.id + '" ><div class="details"><h3>' + value.title + '</h3> <p>' + value.username + '</p></div></li>'

            if (index === array.length - 1) {
                html += '</ul><p class="text"> Password Suggestions </p></div>'
            }
        })
        wrapper.innerHTML = html
        wrapper.firstChild

        return wrapper
    }

    // Auto fill the username and password base on the user selection.
    $(document).on("click", ".onSelectCredentials", (e) => {
        // Get the credentials id
        const id = e.currentTarget.id

        // Get the credentials details
        const credentials = credentialsList.find(e => e.id === id)

        if (usernameInput) {

            // fill up the username
            if (credentials) {

                const inputs = document.getElementsByTagName("input");
                for (let i = 0; i < inputs.length; i++) {
                    var input = inputs[i];     //look at whatever input

                    if (
                        ((input.type == "text" &&
                            (input.name.toLowerCase().indexOf("login") != -1
                                || input.name.toLowerCase().indexOf("user") != -1
                                || input.name == "AgentAccount"))
                            || input.name.toLowerCase() == "loginform:username") || (input.type == 'email' ||
                        (input.name.toLowerCase().indexOf('login') != -1 || input.name.toLowerCase().indexOf("user") != -1 || input.name == 'email'))) {
                        input.value = credentials.username
                    }
                }

            }
            removeThePasswordSuggestionMenu()
        }

        if (passwordInput) {
            // fill up the password
            if (credentials) {

                const inputs = document.getElementsByTagName("input");
                for (let i = 0; i < inputs.length; i++) {
                    var input = inputs[i];     //look at whatever input

                    if ((input.type == "password" && (input.name.toLowerCase().indexOf("auth") == -1)) || input.name.toLowerCase() == "loginform:password") {
                        // passwordInput = input
                        input.value = credentials.password
                    }
                }
            }
            removeThePasswordSuggestionMenu()
        }
    })

    $(document).on("click", "#emptyItemList", (e) => {
        removeNoItemMenu()
    })

    function removeNoItemMenu() {
        if (usernameInput !== null && usernameInput.nextElementSibling !== null) {

            if (usernameInput.nextElementSibling.children[0] !== undefined) {
                usernameInput.nextElementSibling.children[0].remove()
                usernameInput.nextElementSibling.nextElementSibling.children[0].remove()
            }
        }

        if (passwordInput !== null && passwordInput.nextElementSibling !== null) {
            if (passwordInput.nextElementSibling.children[0] !== undefined && passwordInput.nextElementSibling.children[0].className === 'password-suggestions') {
                passwordInput.nextElementSibling.children[0].remove()
            }
        }
    }

    function removeThePasswordSuggestionMenu() {
        if (usernameInput.nextElementSibling !== null) {
            if (usernameInput.nextElementSibling.children[0] !== undefined && usernameInput.nextElementSibling.children[0].className === 'password-suggestions') {
                setTimeout(() => {
                    if (usernameInput.nextElementSibling.children[0] !== undefined) {
                        usernameInput.nextElementSibling.children[0].remove()
                    }

                    if (usernameInput.nextElementSibling.nextElementSibling.children[0] !== undefined && usernameInput.nextElementSibling.nextElementSibling.children[0].className === 'password-suggestions') {
                        usernameInput.nextElementSibling.nextElementSibling.children[0].remove()
                    }
                }, 100)
            }
        }

        if (passwordInput.nextElementSibling !== null) {
            if (passwordInput.nextElementSibling.children[0] !== undefined && passwordInput.nextElementSibling.children[0].className === 'password-suggestions') {
                setTimeout(() => {
                    if (passwordInput.nextElementSibling.children[0] !== undefined) {
                        passwordInput.nextElementSibling.children[0].remove()
                    }
                    if (passwordInput.nextElementSibling.nextElementSibling.children[0] !== undefined && passwordInput.nextElementSibling.nextElementSibling.children[0].className === 'password-suggestions') {
                        passwordInput.nextElementSibling.nextElementSibling.children[0].remove()
                    }
                }, 100)
            }
        }


        // if (passwordInput.nextElementSibling !== null) {
        //     console.log(passwordInput.nextElementSibling.children[0])
        //
        //     // passwordInput.nextElementSibling.children[0].remove()
        //     passwordInput.nextElementSibling.nextElementSibling.remove()
        //
        //     // if (passwordInput.nextElementSibling.children[0] !== undefined) {
        //     //     if (passwordInput.nextElementSibling.children[0].className === 'password-suggestions') {
        //     //         setTimeout(() => {
        //     //             if (passwordInput.nextElementSibling.children[0] !== undefined) {
        //     //                 passwordInput.nextElementSibling.children[0].remove()
        //     //                 passwordInput.nextElementSibling.nextElementSibling.remove()
        //     //             }
        //     //         }, 100)
        //     //     }
        //     // } else if (passwordInput.nextElementSibling.children[0] == undefined) {
        //     //     if (passwordInput.nextSibling.nextSibling !== null && passwordInput.nextElementSibling.nextElementSibling.children[0].className === 'password-suggestions') {
        //     //         // Remove for no items to show.
        //     //         passwordInput.nextSibling.nextSibling.remove()
        //     //     }
        //     // }
        //
        // }

    }

    return (
        <>
        </>
    )
}


const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.render(<App/>, root)



