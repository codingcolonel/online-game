// -- Imports --
import { CodeCrypt } from "./codecrypt.js";

// -- Classes --
class connectionManager {
  #status;
  onenabled;
  onwaiting;
  onoffering;
  onanswering;
  onconnected;
  ondisconnected;
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

// -- Initialize Variables --

// HTML elements
const codeOut = document.getElementById("codeOut");
const codeIn = document.getElementById("codeIn");

const msgOut = document.getElementById("out");
const msgIn = document.getElementById("in");

const connectBtn = document.getElementById("connect");
const sendBtn = document.getElementById("send");

// Global Variables

let connection = new connectionManager();

const ably = new Ably.Realtime.Promise({
  authCallback: async (_, callback) => {
    try {
      const tokenRequest = await fetch(
        `${location.origin}/.netlify/functions/token?}`
      );
      const token = await tokenRequest.json();
      callback(null, token);
    } catch (error) {
      newMessage(error);
      callback(error, null);
    }
  },
});

if (typeof ably !== "undefined") {
  // -- Ably Setup --
  const channel = ably.channels.get("requests");

  await channel.subscribe("offer", (msg) => {});
  connection.status = "enabled";
}

const servers = fetch(`${location.origin}/.netlify/functions/creds`);

const codecrypt = new CodeCrypt();
codeOut.innerHTML = codecrypt.authenticator;

if (connection.status === "enabled" && typeof servers !== "undefined") {
  // -- Add Event Listeners --
  connectBtn.addEventListener("click", clickHandler);
  sendBtn.addEventListener("click", clickHandler);
} else {
  newMessage(new Error("Unable to connect"));
}

// -- Functions --

/**
 * Test inputted code for validity
 *
 * @param {string} code
 * @returns True if code is hex & six digits long, else returns false
 */
function validateCode(code) {
  if (code.match(/([^0-9A-Fa-f])+/gm)) return false;
  if (code.length === 6) return true;
  return false;
}

function newMessage(msg) {
  msgOut.innerHTML += msg + "\r\n";
  msgOut.scrollTop = msgOut.scrollHeight;
}

window.connection = connection;
