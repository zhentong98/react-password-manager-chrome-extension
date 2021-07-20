// import * as CryptoJS from 'crypto-js';
const CryptoJS = require("crypto-js");

export function Encrypt(value: string, password: string): string {
    let aes = new AES()
    let encrypted_value = aes.encrypt(password, value);
    return encrypted_value;
}

export function Decrypt(value: string, password: string): string {
    let aes = new AES()
    let decrypted_value = aes.decrypt(password, value);
    return decrypted_value;
}

class AES {
    private _keySize: number;
    private _ivSize: number;
    private _iterationCount: number;

    constructor() {
        this._keySize = 256;
        this._ivSize = 128;
        this._iterationCount = 1989;
    }

    generateKey(salt, passPhrase): void {
        return CryptoJS.PBKDF2(passPhrase, CryptoJS.enc.Hex.parse(salt), {
            keySize: this._keySize / 32,
            iterations: this._iterationCount
        });
    }

    encryptWithIvSalt(salt, iv, passPhrase, plainText): void {
        let key = this.generateKey(salt, passPhrase);
        let encrypted = CryptoJS.AES.encrypt(plainText, key, {iv: CryptoJS.enc.Hex.parse(iv)});
        return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
    }

    decryptWithIvSalt(salt, iv, passPhrase, cipherText): string {
        let key = this.generateKey(salt, passPhrase);
        let cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: CryptoJS.enc.Base64.parse(cipherText)
        });
        let decrypted = CryptoJS.AES.decrypt(cipherParams, key, {iv: CryptoJS.enc.Hex.parse(iv)});
        return decrypted.toString(CryptoJS.enc.Utf8);
    }

    encrypt(passPhrase, plainText): string {
        let iv = CryptoJS.lib.WordArray.random(this._ivSize / 8).toString(CryptoJS.enc.Hex);
        let salt = CryptoJS.lib.WordArray.random(this._keySize / 8).toString(CryptoJS.enc.Hex);
        let cipherText = this.encryptWithIvSalt(salt, iv, passPhrase, plainText);
        return salt + iv + cipherText;
    }

    decrypt(passPhrase, cipherText): string {
        let ivLength = this._ivSize / 4;
        let saltLength = this._keySize / 4;
        let salt = cipherText.substr(0, saltLength);
        let iv = cipherText.substr(saltLength, ivLength);
        let encrypted = cipherText.substring(ivLength + saltLength);
        let decrypted = this.decryptWithIvSalt(salt, iv, passPhrase, encrypted);
        return decrypted;
    }

    get keySize(): any {
        return this._keySize;
    }

    set keySize(value) {
        this._keySize = value;
    }

    get iterationCount(): any {
        return this._iterationCount;
    }

    set iterationCount(value) {
        this._iterationCount = value;
    }
}

