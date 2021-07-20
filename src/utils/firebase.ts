import firebase from "firebase/app";
import 'firebase/firestore';
import 'firebase/auth'

export interface credentialInterface {
    id: string
    password: string,
    created_on: string,
    title: string,
    url: string,
    user_email: string,
    username: string,
    last_modified_on: string
}


const firebaseConfig = {
// Your firebase information
};

firebase.initializeApp(firebaseConfig);

export function userLogin(email: string, password: string): Promise<firebase.auth.UserCredential> {
    const firebaseAuth = firebase.auth();
    return firebaseAuth.signInWithEmailAndPassword(email.trim(), password)
}

export function fetchCredentials(email: string): Promise<credentialInterface[]> {
    const db = firebase.firestore()
    return new Promise((resolve) => {
        db.collection('credentials').where('user_email', '==', email).get()
            .then((querySnapshot) => {
                const data = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as credentialInterface[]

                resolve(data ?? [])
            })
    })
}

export function onUpdateCredentials(document: { title: string, username: string, password: string, url: string }, id: string): Promise<boolean> {
    const db = firebase.firestore()
    return new Promise((resolve) => {
        db.collection('credentials').doc(id).set(document, {merge: true})
            .then(() => {
                resolve(true)
            })
            .catch((error) => {
                throw 'Failed to update'
            })
    })
}

export function onDeleteCredentials(id: string): Promise<boolean> {
    const db = firebase.firestore()
    return new Promise((resolve) => {
        db.collection('credentials').doc(id).delete()
            .then(() => {
                resolve(true)
            })
            .catch(() => {
                throw 'Unable to delete this document.'
            })
    })
}

export function onAddCredentials(document: { title: string, username: string, password: string, url: string, user_email: string, created_on: string }): Promise<string> {
    const db = firebase.firestore()
    return new Promise((resolve) => {
        db.collection('credentials').add(document)
            .then((response) => {
                resolve(response.id)
            })
            .catch(() => {
                throw 'Unable to add this document.'
            })
    })
}



