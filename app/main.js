// Weblships - Code by Timothy V & Ethan V

// -- Imports --
import { registerErrorLogger } from "./js/errorLog.js";
import { CodeCrypt } from "./js/codecrypt.js";

// -- Classes --

class connectionManager {
  #status;
  onwaiting;
  onoffering;
  onanswering;
  onconnected;
  ondisconnected;
  /** @type {RTCPeerConnection} */
  session;
  constructor() {
    this.#status = "disabled";
  }
  get status() {
    return this.#status;
  }

  set status(newStatus) {
    if (this["on" + newStatus]) this["on" + newStatus]();
    this.#status = newStatus;
  }
}

class displayManager {
  references = {};

  add(reference, name, callback, sub) {
    this.references[name] = { root: reference, callback };
    if (!sub) return;
    this.references[name].sub = new displayManager();
  }

  display(name) {
    for (const [key, value] of Object.entries(this.references)) {
      if (key === name) {
        if (value.root.classList.contains("reveal")) continue;
        value.root.classList.add("reveal");
        value.root.classList.remove("hide");

        if (typeof value.callback !== "function") continue;
        value.callback.bind(value.sub, true)();
      } else {
        if (value.root.classList.contains("hide")) continue;
        value.root.classList.add("hide");
        value.root.classList.remove("reveal");

        if (typeof value.callback !== "function") continue;
        value.callback.bind(value.sub, false)();
      }
    }
  }

  hideAll() {
    for (const [key, value] of Object.entries(this.references)) {
      if (value.root.classList.contains("hide")) continue;
      value.root.classList.add("hide");
      value.root.classList.remove("reveal");

      if (typeof value.callback !== "function") continue;
      value.callback.bind(value.sub, false)();
    }
  }
}

// -- Initialize Variables --

// Global Variables
let decryptedRemoteSDP;

let connection = new connectionManager();

const logger = registerErrorLogger();
window.addEventListener("error", (err) => logger.error(err.message));

const ably = new Ably.Realtime.Promise({
  authCallback: async (_, callback) => {
    const token = await tryCatchFetch(
      `${location.origin}/.netlify/functions/token?}`
    );

    if (token instanceof Error) {
      callback(token, null);
    } else {
      connection.status = "enabled";
      callback(null, token);
    }
  },
});

let channel;

const codecrypt = new CodeCrypt();

const servers = tryCatchFetch(`${location.origin}/.netlify/functions/creds`);

if (servers instanceof Error) {
  connection.status = "disabled";
}

let mainManager = new displayManager();

const user = { name: undefined };

// HTML References

const queryBoxContain = document.getElementById("queryBoxContain");
const loaderContain = document.getElementById("loaderContain");

const userBox = document.getElementById("userBox");
const connectionBox = document.getElementById("connectionBox");

const nameIn = document.getElementById("userIn");
const confirmBtn = document.getElementById("confirmBtn");

const codeIn = document.getElementById("codeIn");
const codeOut = document.getElementById("codeOut");
const connectBtn = document.getElementById("connectBtn");

const cancelBtn = document.getElementById("cancelBtn");

mainManager.add(
  queryBoxContain,
  "query",
  async function (state) {
    if (!state) return;
    await codecrypt.generateAuthenticator();
    codeOut.innerText = codecrypt.authenticator;
  },
  true
);
mainManager.add(
  loaderContain,
  "loader",
  async function (state) {
    if (!state) {
      this.hideAll();
      return;
    }
    await timer(5000);
    this.display("button");
  },
  true
);

mainManager.references.query.sub.add(userBox, "user", null, false);
mainManager.references.query.sub.add(connectionBox, "connect", null, false);

mainManager.references.loader.sub.add(cancelBtn, "button", null, false);

mainManager.display("query");

// -- Ably Setup --
if (connection.status === "enabled") {
  channel = ably.channels.get("requests");
}

// -- Event Listeners --
confirmBtn.addEventListener("click", function () {
  const input = nameIn.value;

  if (input.length > 1 && input.length <= 20) {
    user.name = input;
    Object.freeze(user);
    mainManager.references.query.sub.display("connect");
  } else {
    logger.generic("Username must be from 2 to 20 characters long.");
  }
});

connectBtn.addEventListener("click", function () {
  mainManager.display("loader");
});

cancelBtn.addEventListener("click", function () {
  mainManager.display("query");
});

// -- Functions --

// Utility

function timer(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

async function tryCatchFetch(url) {
  try {
    const request = await fetch(url);
    if (!request.ok) throw new TypeError("Cannot fetch " + url);
    const result = await request.json();
    return result;
  } catch (error) {
    logger.warn(error);
    console.warn(error);
    return error;
  }
}

/**
 * Test inputted code for validity
 *
 * @param {string} code
 * @returns True if code is hex & six digits long, else returns false
 */
function validateCode(code) {
  if (typeof code !== "string") return false;
  if (code.match(/([^0-9A-Fa-f])+/gm)) return false;
  if (code.length === 6) return true;
  return false;
}
