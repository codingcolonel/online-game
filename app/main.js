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

// -- Initialize Variables --

// HTML References

// Global Variables
let decryptedRemoteSDP;

let connection = new connectionManager();

const logger = registerErrorLogger();

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

// -- Ably Setup --
if (connection.status === "enabled") {
  channel = ably.channels.get("requests");
}

// -- Event Listeners --

// -- Functions --

// HTML Manipulation

// display function goes here

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
    logger.error(error);
    console.error(error);
    return error;
  }
}
