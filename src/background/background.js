import {setCredentialsListStorage, setIsLoggin, setSelectedCredentialsIndex, setUserAuthData} from "../utils/storage";

chrome.runtime.onInstalled.addListener(() => {
    setIsLoggin(false)
    setUserAuthData({
        uid: '',
        email: ''
    })
    setSelectedCredentialsIndex(0)
    setCredentialsListStorage()
})

