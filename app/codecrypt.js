async function generateKey(rawKey) {
  return await crypto.subtle.importKey("raw", rawKey, "AES-GCM", true, [
    "encrypt",
    "decrypt",
  ]);
}

function encodeMessage(message) {
  return new TextEncoder().encode(message);
}

function decodeToHex(arr) {
  return arr.reduce((prev, curr) => {
    return prev + curr.toString(16).padStart(2, 0);
  }, "");
}

function encodeFromHex(hex) {
  let arrBuff = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < hex.length / 2; i++) {
    arrBuff[i] = parseInt(hex[i * 2] + hex[i * 2 + 1], 16);
  }
  return arrBuff;
}
class CodeCrypt {
  #auth;
  #keyBuffer;
  #key;
  #iv;

  constructor() {
    this.generateAuthenticator();
  }

  async #createKeyIV(arrBuff) {
    let digest = await crypto.subtle.digest("SHA-256", arrBuff);
    this.#keyBuffer = digest.slice(0, 16);
    this.#iv = digest.slice(16, 32);
    this.#key = await generateKey(this.#keyBuffer);
  }

  async generateAuthenticator() {
    let arrBuff = new Uint8Array(new ArrayBuffer(3));
    crypto.getRandomValues(arrBuff);
    this.#auth = arrBuff;

    this.#createKeyIV(arrBuff);

    return this.authenticator;
  }

  async setAuthenticator(auth) {
    this.#auth = encodeFromHex(auth);

    this.#createKeyIV(this.#auth);

    return this.authenticator;
  }

  async encrypt(message, type) {
    if (!this.#key || !this.#iv) throw new Error("No authenticator generated");
    if (type !== "offer" && type !== "answer")
      throw new Error("Incorrect type provided");

    let encodedMsg = encodeMessage(message);
    let additionalData = encodeMessage(type);

    let encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: this.#iv, additionalData },
      this.#key,
      encodedMsg
    );

    return decodeToHex(new Uint8Array(encrypted));
  }

  async decrypt(encrypted, type) {
    if (!this.#key || !this.#iv) throw new Error("No authenticator generated");
    if (type !== "offer" && type !== "answer")
      throw new Error("Incorrect type provided");

    let additionalData = encodeMessage(type);
    let message = encodeFromHex(encrypted);

    let decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: this.#iv, additionalData },
      this.#key,
      message
    );

    return new TextDecoder("utf-8").decode(decrypted);
  }

  get authenticator() {
    let result = decodeToHex(this.#auth);
    result = result.toUpperCase();
    return result;
  }
}

export { CodeCrypt };
