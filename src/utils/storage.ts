export interface LocalStorage {
    isLogin?: boolean,
    userAuthData?: UserAuthData,
    selectedCredentialsIndex?: number,
    credentialsList?: CredentialsData[]
}

export interface UserAuthData {
    uid: string,
    email: string
}

export interface CredentialsData {
    id: string
    password: string,
    created_on: string,
    title: string,
    url: string,
    user_email: string,
    username: string,
    last_modified_on: string
}

export type LocalStorageKeys = keyof LocalStorage

export function getIsLoggin(): Promise<boolean> {
    const keys: LocalStorageKeys[] = ['isLogin']

    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (res: LocalStorage) => {
            resolve(res.isLogin)
        })
    })
}

export function setIsLoggin(isLogin: boolean): Promise<void> {
    const vals: LocalStorage = {
        isLogin,
    }

    return new Promise((resolve) => {
        chrome.storage.local.set(vals, () => {
            resolve()
        })
    })
}

export function getUserAuthData(): Promise<UserAuthData> {
    const keys: LocalStorageKeys[] = ['userAuthData']
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (res: LocalStorage) => {
            resolve(res.userAuthData)
        })
    })
}

export function setUserAuthData(userAuthData: UserAuthData): Promise<void> {
    const vals: LocalStorage = {
        userAuthData,
    }

    return new Promise((resolve) => {
        chrome.storage.local.set(vals, () => {
            resolve()
        })
    })
}

export function getCredentialsListStorage(): Promise<CredentialsData[]> {
    const keys: LocalStorageKeys[] = ['credentialsList']
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (res: LocalStorage) => {
            resolve(res.credentialsList)
        })
    })
}

export function setCredentialsListStorage(credentialsList: CredentialsData[]): Promise<void> {
    const vals: LocalStorage = {
        credentialsList
    }
    return new Promise((resolve) => {
        chrome.storage.local.set(vals, () => {
            resolve()
        })
    })
}

export function getSelectedCredentialsIndex(): Promise<number> {
    const keys: LocalStorageKeys[] = ['selectedCredentialsIndex']
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (res: LocalStorage) => {
            resolve(res.selectedCredentialsIndex)
        })
    })
}

export function setSelectedCredentialsIndex(selectedCredentialsIndex: number): Promise<void> {
    const vals: LocalStorage = {
        selectedCredentialsIndex
    }
    return new Promise((resolve) => {
        chrome.storage.local.set(vals, () => {
            resolve()
        })
    })

}


