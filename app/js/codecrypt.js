/**
 * Generate an AES-GCM symmetrical encryption & decryption key using an input
 * @param {ArrayBuffer} rawKey
 * @returns AES-GCM crypto key
 */
async function generateKey(rawKey) {
  return await crypto.subtle.importKey("raw", rawKey, "AES-GCM", true, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Encodes a string to an ArrayBuffer
 * @param {string} message
 * @returns Uint8Array representing the message
 */
function encodeMessage(message) {
  return new TextEncoder().encode(message);
}

/**
 * Convert a Uint8Array to a hexadecimal string
 * @param {Uint8Array} arr
 * @returns Hexadecimal string
 */
function decodeToHex(arr) {
  return arr.reduce((prev, curr) => {
    return prev + curr.toString(16).padStart(2, 0);
  }, "");
}

/**
 * Convert a hexadecimal string to a Uint8Array
 * @param {string} hex
 * @returns Uint8Array
 */
function encodeFromHex(hex) {
  let arrBuff = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < hex.length / 2; i++) {
    arrBuff[i] = parseInt(hex[i * 2] + hex[i * 2 + 1], 16);
  }
  return arrBuff;
}

/**
 * A class used to manage encryption/decryption keys derived from random, human-readable authenticator codes
 */
class CodeCrypt {
  /** @type {ArrayBuffer} */
  #auth;
  /** @type {ArrayBuffer} */
  #keyBuffer;
  /** @type {CryptoKey} */
  #key;
  /**
   * Initialization vector
   * @type {ArrayBuffer}
   * */
  #iv;

  constructor() {
    this.generateAuthenticator();
  }

  /**
   * Creates a CryptoKey and Initialization vector, both of which are derived from the ArrayBuffer representation of a short hexadecimal string
   * @param {Uint8Array} arrBuff Uint8Array of an ArrayBuffer
   * @returns {void}
   */
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

  /**
   * @param {string} message
   * @param {("offer"|"answer")} type
   * @returns Hex string
   */
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

  /**
   * @param {string} message
   * @param {("offer"|"answer")} type
   * @returns String
   */
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
