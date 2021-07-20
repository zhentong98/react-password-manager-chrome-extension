import * as React from "react";
import {useEffect, useReducer, useState} from "react";

import {Grid} from "@material-ui/core";
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import {FixedSizeList} from 'react-window';
import {ToastContainer, toast} from 'react-toastify';
import {Add as AddIcon} from '@material-ui/icons'

import LoginComponent from "../auth/login";
import {
    getSelectedCredentialsIndex,
    getUserAuthData, setCredentialsListStorage,
    setIsLoggin,
    setSelectedCredentialsIndex,
    setUserAuthData
} from "../../utils/storage";
import {
    credentialInterface,
    fetchCredentials,
    onAddCredentials,
    onDeleteCredentials,
    onUpdateCredentials
} from "../../utils/firebase";
import {Decrypt, Encrypt} from "../../utils/aes";
import * as moment from 'moment';

import 'react-toastify/dist/ReactToastify.css';
import './dashboard.css'

type state = "loading" | "error" | "ready"


const DashboardComponent: React.FC<{}> = () => {

    const [addCredentials, setAddCredentials] = useState<boolean>(false)

    const [email, setEmail] = useState<string>(null)
    const [uid, setUid] = useState<string>(null)


    const [selectedId, setSelectedId] = useState<string>(null)
    const [selectedIndex, setSelectedIndex] = React.useState<number>(null);
    const [backupCredentialsList, setBackupCredentialsList] = useState<credentialInterface[] | null>([])
    const [credentialsList, setCredentialsList] = useState<credentialInterface[] | null>([])
    const [isLogout, setIsLogout] = useState<boolean>(false)
    const [state, setState] = useState<state>('loading')

    // Add field
    const [newTitle, setNewTitle] = useState<string>(null)
    const [newUsername, setNewUsername] = useState<string>(null)
    const [newPassword, setNewPassword] = useState<string>(null)
    const [newUrl, setNewUrl] = useState<string>(null)

    // Update field
    const [updatedTitle, setUpdatedTitle] = useState<string>(null)
    const [updatedUsername, setUpdatedUsername] = useState<string>(null)
    const [updatedPassword, setUpdatedPassword] = useState<string>(null)
    const [updatedUrl, setUpdatedUrl] = useState<string>(null)

    const [, forceUpdate] = useReducer(x => x + 1, 0);

    useEffect(() => {
        getUserAuthData().then((userAuthData) => {
            setEmail(userAuthData.email)
            setUid(userAuthData.uid)

            const credentialsPromise = fetchCredentials(userAuthData.email)
            const selectedCredentialsIndexPromise = getSelectedCredentialsIndex()

            Promise.all([credentialsPromise, selectedCredentialsIndexPromise])
                .then((values) => {

                    const credentials = values[0] as credentialInterface[]
                    credentials.forEach((value) => {
                        value.title = Decrypt(value.title, userAuthData.uid)
                        value.username = Decrypt(value.username, userAuthData.uid)
                        value.password = Decrypt(value.password, userAuthData.uid)
                        value.url = value.url != null ? Decrypt(value.url, userAuthData.uid) : null
                    })

                    // Sorting by the alphabet
                    credentials.sort(function (a, b) {
                        if (a.title.toLowerCase() < b.title.toLowerCase()) {
                            return -1
                        }
                        if (a.title.toLowerCase() > b.title.toLowerCase()) {
                            return 1
                        }
                        return 0
                    })

                    setBackupCredentialsList(credentials)
                    setCredentialsList(credentials)
                    setCredentialsListStorage(credentials)

                    const index = values[1] as number

                    if (credentials.length > 0) {
                        setSelectedIndex(index)
                        const selectedCredentials = credentials[index]

                        setSelectedId(selectedCredentials.id)
                        setUpdatedTitle(selectedCredentials.title)
                        setUpdatedUsername(selectedCredentials.username)
                        setUpdatedPassword(selectedCredentials.password)
                        setUpdatedUrl(selectedCredentials.url)
                    }

                    setState('ready')
                })
        })
    }, [])

    if (state === 'loading') {
        return (
            <div className="text-center loading-spinner ">
                <div className="spinner-border text-light" role="status">
                    <span className="sr-only"></span>
                </div>
                <p className={'text-light'}>
                    Loading...
                </p>
            </div>
        )
    }

    const handleLogoutButtonClick = () => {
        setIsLoggin(false)
        setUserAuthData({uid: '', email: ''})
            .then(() => {
                setCredentialsListStorage([])
                setIsLogout(true)
            })
    }

    const Row = ({index, style}) => (
        <ListItem button
                  selected={selectedIndex === index}
                  style={style}
                  onClick={(event) => handleListItemClick(event, index)}>
            <ListItemText className={'text-light'}>
                <p className={'mb-0 title'}>
                    {credentialsList[index].title}
                </p>
                <p className={'mb-0 username'}>
                    {credentialsList[index].username}
                </p>
                <a href={credentialsList[index].url} target={'_blank'}>{credentialsList[index].url}</a>
            </ListItemText>
        </ListItem>
    )

    const handleListItemClick = (
        event: any,
        index: number,
    ) => {

        setSelectedCredentialsIndex(index)
        setAddCredentials(false)

        // Set the selected document id
        setSelectedId(credentialsList[index].id)
        setUpdatedTitle(credentialsList[index].title)
        setUpdatedUsername(credentialsList[index].username)
        setUpdatedPassword(credentialsList[index].password)
        setUpdatedUrl(credentialsList[index].url ? credentialsList[index].url : '')

        setSelectedIndex(index);
    };

    function onSave() {

        const update_on = moment().format('D MMM YYYY hh:mm A')
        let updatedDocument = {
            title: Encrypt(updatedTitle, uid),
            username: Encrypt(updatedUsername, uid),
            password: Encrypt(updatedPassword, uid),
            url: updatedUrl ? Encrypt(updatedUrl, uid) : null,
            last_modified_on: update_on
        }
        onUpdateCredentials(updatedDocument, selectedId)
            .then(() => {
                const index = credentialsList.findIndex(e => e.id === selectedId)
                credentialsList[index].title = updatedTitle
                credentialsList[index].username = updatedUsername
                credentialsList[index].password = updatedPassword
                credentialsList[index].url = updatedUrl
                credentialsList[index].last_modified_on = update_on

                setCredentialsListStorage(credentialsList)

                forceUpdate()
                toast.dark('Credentials was updated!', {
                    position: "bottom-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            })
    }

    function onDelete() {
        onDeleteCredentials(selectedId)
            .then(() => {

                const index = credentialsList.findIndex(e => e.id === selectedId)
                credentialsList.splice(index, 1)
                setSelectedId(null)
                setSelectedIndex(null)

                setCredentialsListStorage(credentialsList)
                forceUpdate()
                toast.dark('Credentials has been deleted!', {
                    position: "bottom-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            })
    }

    function onCopyUsername() {

        if (addCredentials === true) {
            if (!newUsername) {
                return
            }
        } else {
            if (!updatedUsername) {
                return
            }
        }

        navigator.clipboard.writeText(addCredentials ? newUsername : updatedUsername).then(() => {
            toast.dark('Copied to clipboard!', {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        })
    }

    function onCopyPassword() {
        if (addCredentials === true) {
            if (!newPassword) {
                return
            }
        } else {
            if (!updatedPassword) {
                return
            }
        }
        navigator.clipboard.writeText(addCredentials ? newPassword : updatedPassword).then(() => {
            toast.dark('Copied to clipboard!', {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        })
    }

    function onOpenUrl() {

        if (addCredentials === true) {
            if (!newUrl) {
                return
            }
        } else {
            if (!updatedUrl) {
                return
            }
        }

        window.open(addCredentials ? newUrl : updatedUrl, '_blank')
    }

    function onSearch(text: string) {
        const filterText = text.toLowerCase();
        let filterList = backupCredentialsList.filter(function (currentElement) {
            currentElement.url = currentElement.url == null ? currentElement.url = '' : currentElement.url;
            return currentElement.title.toLowerCase().indexOf(filterText) > -1 || currentElement.username.toLowerCase().indexOf(filterText) > -1 || currentElement.url.toLowerCase().indexOf(filterText) > -1;
        })
        setCredentialsList(filterList)
    }

    // Render the add credentials layout
    const onRenderAddCredentials = () => {
        setAddCredentials(true)
        setSelectedIndex(null)
    }

    function addNewCredentials() {
        if (!newTitle || !newPassword || !newUsername) {
            return
        }

        const created_on = moment().format('D MMM YYYY h:m A')

        let document = {
            title: Encrypt(newTitle, uid),
            username: Encrypt(newUsername, uid),
            password: Encrypt(newPassword, uid),
            url: newUrl ? Encrypt(newUrl, uid) : null,
            user_email: email,
            created_on: created_on
        }

        onAddCredentials(document)
            .then((returnId) => {

                let newDocument = {
                    id: returnId,
                    title: newTitle,
                    username: newUsername,
                    password: newPassword,
                    url: newUrl ? newUrl : null,
                    user_email: email,
                    created_on: created_on
                } as credentialInterface

                const newList = credentialsList
                newList.push(newDocument)

                setCredentialsListStorage(newList)

                setCredentialsList(newList)

                // Reorder by alphabet
                credentialsList.sort(function (a, b) {
                    if (a.title.toLowerCase() < b.title.toLowerCase()) {
                        return -1
                    }
                    if (a.title.toLowerCase() > b.title.toLowerCase()) {
                        return 1
                    }
                    return 0
                })

                const index = credentialsList.findIndex(e => e.id === returnId)

                setAddCredentials(false)
                setSelectedIndex(index)
                setSelectedId(returnId)

                setUpdatedTitle(newTitle)
                setUpdatedUsername(newUsername)
                setUpdatedPassword(newPassword)
                setUpdatedUrl(newUrl)

                setNewTitle(null)
                setNewUsername(null)
                setNewPassword(null)
                setNewUrl(null)

                forceUpdate()

                toast.dark('Credentials has been added.', {
                    position: "bottom-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            })

    }

    if (isLogout) {
        return <LoginComponent></LoginComponent>
    }

    return (
        <>
            <Grid container>
                <Grid item xs={12}>
                    <div className="input-group">
                        <input type="text" className="form-control bg-dark text-light border-dark search-input"
                               placeholder="Search by username, password or Website URL" onChange={(event) => {
                            onSearch(event.target.value)
                        }}/>
                        <div className="input-group-append">
                            <button className="btn btn-dark text-light bg-dark border-0" type="button"
                                    onClick={onRenderAddCredentials}>
                                <AddIcon/>
                            </button>
                            <button className="btn btn-dark text-light bg-dark border-0 logout-button"
                                    onClick={handleLogoutButtonClick}>Logout
                            </button>
                        </div>
                    </div>
                </Grid>

                <Grid item xs={6}>
                    <FixedSizeList height={450} width={'100%'} itemSize={90} itemCount={credentialsList.length}>
                        {Row}
                    </FixedSizeList>
                </Grid>
                <Grid item xs={6}>
                    {
                        ((selectedIndex == 0 || selectedIndex) && addCredentials === false) &&
                        <>
                            <div className="container-fluid">
                                <div className="row mt-3">
                                    <div className="col">
                                        <button className="btn text-light border-dark btn-sm" onClick={() => {
                                            setSelectedIndex(null)
                                        }}>Cancel
                                        </button>
                                        <button className="btn text-light border-dark btn-sm ml-2"
                                                onClick={onSave}>Save
                                        </button>
                                        <button className="btn text-light border-dark btn-sm ml-2"
                                                onClick={onDelete}>Delete
                                        </button>
                                    </div>
                                </div>

                                <div className="row mt-3">
                                    <div className="col">
                                        <div className="form-group">
                                            <label className="text-light" htmlFor="title">Title</label>
                                            <input type="text" id="title" className="form-control bg-dark text-light"
                                                   value={updatedTitle}
                                                   onChange={(event) => setUpdatedTitle(event.target.value)}/>

                                            {/*<div className="text-danger pt-2">*/}
                                            {/*    * This field is required.*/}
                                            {/*</div>*/}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="username" className="text-light"> Username / E-Mail</label>
                                            <div className="input-group">
                                                <input type="text" id="username"
                                                       className="form-control bg-dark text-light"
                                                       value={updatedUsername}
                                                       onChange={(event) => setUpdatedUsername(event.target.value)}/>
                                                <span className="input-group-btn">
                                                <button className="btn btn-dark text-light bg-dark border-0"
                                                        type="button"
                                                        disabled={!updatedUsername}
                                                        onClick={onCopyUsername}>
                                                    Copy
                                                </button>
                                            </span>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="password" className="text-light"> Password </label>
                                            <div className="input-group">
                                                <input type="text" id="password"
                                                       className="form-control bg-dark text-light"
                                                       value={updatedPassword}
                                                       onChange={(event) => setUpdatedPassword(event.target.value)}/>
                                                <span className="input-group-btn">
                                     <button className="btn btn-dark text-light bg-dark border-0" type="button"
                                             disabled={!updatedPassword}
                                             onClick={onCopyPassword}>
                                         Copy
                                     </button>
                                </span>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="url" className="text-light"> Website URL </label>
                                            <div className="input-group">
                                                <input type="text" id="url" className="form-control bg-dark text-light"
                                                       value={updatedUrl}
                                                       onChange={(event) => setUpdatedUrl(event.target.value)}/>
                                                <span className="input-group-btn">
                                    <button className="btn btn-dark text-light bg-dark border-0" type="button"
                                            disabled={!updatedUrl}
                                            onClick={onOpenUrl}>
                                        Open
                                    </button>
                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    }

                    {
                        (selectedIndex === null && addCredentials) &&
                        <>
                            <div className="container-fluid">
                                <div className="row mt-3">
                                    <div className="col">
                                        <button className="btn text-light border-dark btn-sm" onClick={() => {
                                            setSelectedIndex(null)
                                            setAddCredentials(false)
                                        }}>Cancel
                                        </button>
                                        <button className="btn text-light border-dark btn-sm ml-2"
                                                disabled={!newTitle || !newUsername || !newPassword}
                                                onClick={addNewCredentials}>Save
                                        </button>
                                    </div>
                                </div>

                                <div className="row mt-3">
                                    <div className="col">
                                        <div className="form-group">
                                            <label className="text-light" htmlFor="title">Title</label>
                                            <input type="text" id="title" className="form-control bg-dark text-light"

                                                   onChange={(event) => setNewTitle(event.target.value)}/>

                                            {/*<div className="text-danger pt-2">*/}
                                            {/*    * This field is required.*/}
                                            {/*</div>*/}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="username" className="text-light"> Username / E-Mail</label>
                                            <div className="input-group">
                                                <input type="text" id="username"
                                                       className="form-control bg-dark text-light"
                                                       onChange={(event) => setNewUsername(event.target.value)}/>
                                                <span className="input-group-btn">
                                                <button className="btn btn-dark text-light bg-dark border-0"
                                                        type="button"
                                                        onClick={onCopyUsername} disabled={!newUsername}>
                                                    Copy
                                                </button>
                                            </span>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="password" className="text-light"> Password </label>
                                            <div className="input-group">
                                                <input type="text" id="password"
                                                       className="form-control bg-dark text-light"
                                                       onChange={(event) => setNewPassword(event.target.value)}/>
                                                <span className="input-group-btn">
                                     <button className="btn btn-dark text-light bg-dark border-0" type="button"
                                             disabled={!newPassword}
                                             onClick={onCopyPassword}>
                                         Copy
                                     </button>
                                </span>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="url" className="text-light"> Website URL </label>
                                            <div className="input-group">
                                                <input type="text" id="url"
                                                       className="form-control bg-dark text-light"
                                                       onChange={(event) => setNewUrl(event.target.value)}/>
                                                <span className="input-group-btn">
                                    <button className="btn btn-dark text-light bg-dark border-0" type="button"
                                            disabled={!newUrl}
                                            onClick={onOpenUrl}>
                                        Open
                                    </button>
                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    }
                    <ToastContainer/>
                </Grid>

            </Grid>
        </>
    )
}

export default DashboardComponent
