// Weblships - Code by Timothy V & Ethan V

// -- Imports --
import { registerErrorLogger } from "./js/errorLog.js";
import { CodeCrypt } from "./js/codecrypt.js";
import { Manager } from "./js/gameManager.js";

// -- Classes --
class ConnectionManager {
  #status;
  onwaiting;
  onoffering;
  onanswering;
  onconnected;
  ondisconnected;

  ably = false;
  servers = false;

  /** @type {RTCPeerConnection} */
  session = null;
  constructor() {
    this.#status = "enabled";
  }
  get status() {
    if (!this.ably || !this.servers) return "disabled";
    return this.#status;
  }

  set status(newStatus) {
    if (this["on" + newStatus]) this["on" + newStatus]();
    this.#status = newStatus;
  }
}

class DisplayManager {
  references = {};

  add(reference, name, callback, sub) {
    this.references[name] = { root: reference, callback };
    if (!sub) return;
    this.references[name].sub = new DisplayManager();
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

class AudioManager {
  #soundBuffers = {};
  #context;

  constructor(...params) {
    this.#context = new AudioContext({ latencyHint: "interactive" });

    params.forEach(async (parameter) => {
      if (typeof parameter !== "object") return;
      if (!parameter.hasOwnProperty("soundName")) return;
      if (!parameter.hasOwnProperty("uris")) return;
      let bufferList = new Array();
      parameter.uris.forEach(async (uri) => {
        let response = await this.#getAudio(uri);
        if (!(response instanceof Error)) {
          bufferList.push(response);
        }
      });
      this.#soundBuffers[parameter.soundName] = bufferList;
    });
  }

  async #getAudio(uri) {
    try {
      const request = await fetch(uri);
      if (!request.ok) throw new TypeError("Cannot fetch " + uri);
      const result = await request.arrayBuffer();

      let buffer = await this.#context.decodeAudioData(result);

      return buffer;
    } catch (error) {
      logger.warn(error);
      console.warn(error);
      return error;
    }
  }

  play(soundName) {
    if (this.#context.state === "suspended") this.#context.resume();
    if (!this.#soundBuffers.hasOwnProperty(soundName)) return;

    let source = this.#context.createBufferSource();
    source.connect(this.#context.destination);

    const bufferObj = this.#soundBuffers[soundName];
    const randomIndex = randomInt(0, bufferObj.length);
    console.log(bufferObj[randomIndex]);
    source.buffer = bufferObj[randomIndex];

    source.addEventListener("ended", function () {
      source = null;
    });
    source.start(0);
  }
}

// -- Initialize Variables --

// Global Variables
let decryptedRemoteSDP;

let connection = new ConnectionManager();

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
      connection.ably = true;
      if (!channel) channel = ably.channels.get("requests");
      callback(null, token);
    }
  },
});

let channel;

const codecrypt = new CodeCrypt();

const servers = await tryCatchFetch(
  `${location.origin}/.netlify/functions/creds`
);

if (servers instanceof Error) {
  connection.servers = false;
} else {
  connection.servers = true;
}

let mainManager = new DisplayManager();

const audio = new AudioManager(
  {
    uris: ["./audio/WeblshipsCannonsFireClose.mp3"],
    soundName: "fireClose",
  },
  {
    uris: ["./audio/WeblshipsCannonsFireFar.mp3"],
    soundName: "fireFar",
  },
  {
    uris: [
      "./audio/WeblshipsCannonsHit1.mp3",
      "./audio/WeblshipsCannonsHit2.mp3",
    ],
    soundName: "hit",
  },
  {
    uris: [
      "./audio/WeblshipsCannonsMiss1.mp3",
      "./audio/WeblshipsCannonsMiss2.mp3",
    ],
    soundName: "miss",
  }
);

const user = { name: undefined };

let resolvers = {
  resolve: null,
  reject: null,
};

let gameManager;

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
const inviteBtn = document.getElementById("inviteBtn");

const cancelBtn = document.getElementById("cancelBtn");

/** @type {HTMLDialogElement} */
const dialogBox = document.getElementById("requestBox");
const nameOut = document.getElementById("userOut");
const acceptBtn = document.getElementById("acceptBtn");
const rejectBtn = document.getElementById("rejectBtn");

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

mainManager.references.query.sub.add(
  userBox,
  "user",
  async function (state) {
    if (!state) {
      await timer(1000);
      inviteBtn.classList.add("reveal");
      inviteBtn.classList.remove("hide");
    }
  },
  false
);
mainManager.references.query.sub.add(connectionBox, "connect", null, false);

mainManager.references.loader.sub.add(cancelBtn, "button", null, false);

mainManager.display("query");

// -- Event Listeners --
confirmBtn.addEventListener("click", confirmUser);

connectBtn.addEventListener("click", function () {
  if (connection.status !== "waiting") return;
  const value = codeIn.value;
  if (!validateCode(value)) {
    logger.generic("Code must be a 6 character hexadecimal string");
    return;
  }

  codecrypt.setAuthenticator(value);
  codeIn.value = "";

  connection.status = "offering";
});

cancelBtn.addEventListener("click", function () {
  if (connection.status === "disabled") return;
  if (connection.session !== null) {
    connection.session.close();
    connection.session = null;
  } else {
    connection.status = "disconnected";
  }
});

inviteBtn.addEventListener("click", copyLink);

dialogBox.addEventListener("cancel", function (event) {
  event.preventDefault();
});

rejectBtn.addEventListener("click", function () {
  if (!dialogBox.open || dialogBox.classList.contains("hide")) return;
  resolvers.reject();
  resolvers = {
    resolve: null,
    reject: null,
  };
  closeDialog();
});

acceptBtn.addEventListener("click", function () {
  if (!dialogBox.open || dialogBox.classList.contains("hide")) return;
  resolvers.resolve();
  resolvers = {
    resolve: null,
    reject: null,
  };
  closeDialog();
});

// -- Connection Manager Functions --

connection.onwaiting = async function () {
  if (connection.status === "disabled") return;
  mainManager.display("query");
  mainManager.references.query.sub.display("connect");

  await channel.subscribe("offer", async function (msg) {
    if (resolvers.reject !== null) return;
    const data = JSON.parse(msg.data);

    try {
      decryptedRemoteSDP = await codecrypt.decrypt(data.sdp, "offer");
      try {
        await openDialog(data.user);
        connection.status = "answering";
      } catch {
        console.log("Rejected incoming request");
      }
    } catch (error) {
      console.warn("Could not decrypt incoming request");
    }
  });
};

connection.onoffering = async function () {
  if (connection.status === "disabled") return;
  mainManager.display("loader");

  if (typeof channel.subscriptions.events.offer !== "undefined")
    channel.unsubscribe("offer");

  let iceServers = [
    {
      urls: [
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
      ],
    },
    servers[2],
    servers[4],
  ];

  connection.session = new RTCPeerConnection({
    iceServers: iceServers,
  });
  connection.session.channel = connection.session.createDataChannel("gameInfo");
  connection.session.channel.binaryType = "arraybuffer";
  connection.session.channel.addEventListener("open", function () {
    connection.status = "connected";
  });
  connection.session.channel.addEventListener("close", function () {
    connection.status = "disconnected";
  });
  connection.session.channel.addEventListener("message", messageRecieved);

  connection.session.onicegatheringstatechange = async function (event) {
    if (connection.session.iceGatheringState !== "complete") return;

    const sdp = JSON.stringify(connection.session.localDescription);

    let encryptedSDP = await codecrypt.encrypt(sdp, "offer");

    let message = JSON.stringify({
      user: user.name,
      sdp: encryptedSDP,
    });

    await channel.subscribe("answer", async (msg) => {
      const data = JSON.parse(msg.data);

      try {
        decryptedRemoteSDP = await codecrypt.decrypt(data.sdp, "answer");
        connection.session.setRemoteDescription(JSON.parse(decryptedRemoteSDP));
      } catch (error) {
        console.warn("Could not decrypt incoming answer");
      }
    });
    await channel.publish("offer", message);
  };

  await connection.session.setLocalDescription(
    await connection.session.createOffer()
  );
};

connection.onanswering = async function () {
  if (connection.status === "disabled") return;

  mainManager.display("loader");

  if (typeof channel.subscriptions.events.answer !== "undefined")
    channel.unsubscribe("answer");

  let iceServers = [
    {
      urls: [
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
      ],
    },
    servers[2],
    servers[4],
  ];

  connection.session = new RTCPeerConnection({
    iceServers: iceServers,
  });

  connection.session.ondatachannel = function ({ channel }) {
    const recieve = channel;
    recieve.binaryType = "arraybuffer";
    recieve.addEventListener("open", function () {
      connection.status = "connected";
    });
    recieve.addEventListener("close", function () {
      connection.status = "disconnected";
    });
    recieve.addEventListener("message", messageRecieved);
    connection.session.channel = recieve;
  };

  connection.session.onicegatheringstatechange = async function (event) {
    if (connection.session.iceGatheringState == "complete") return;

    const sdp = JSON.stringify(connection.session.localDescription);

    let encryptedSDP = await codecrypt.encrypt(sdp, "answer");

    let message = JSON.stringify({
      user: user.name,
      sdp: encryptedSDP,
    });

    await channel.publish("answer", message);
  };

  await connection.session.setRemoteDescription(JSON.parse(decryptedRemoteSDP));

  await connection.session.setLocalDescription(
    await connection.session.createAnswer()
  );
};

connection.onconnected = function () {
  if (connection.status === "disabled") return;
  ably.close();
  mainManager.hideAll();
  gameManager = new Manager(connection);
  window.gm = gameManager;
};

connection.ondisconnected = async function () {
  if (connection.status === "disabled") return;

  gameManager = null;

  if (ably.connection.state !== "connected") {
    mainManager.display("loader");
    ably.connect();
    await ably.connection.once("connected");
  }

  connection.status = "waiting";
};

// -- Functions --

// Dialog box
function openDialog(name) {
  return new Promise((resolve, reject) => {
    nameOut.innerText = name;
    dialogBox.showModal();
    dialogBox.classList.add("reveal");
    dialogBox.classList.remove("hide");
    resolvers.resolve = resolve;
    resolvers.reject = reject;
  });
}

async function closeDialog() {
  dialogBox.classList.add("hide");
  dialogBox.classList.remove("reveal");
  await timer(800);
  dialogBox.close();
}

// Listener

function confirmUser() {
  if (Object.isFrozen(user)) return;
  if (connection.status !== "enabled") throw new Error("Not connected");
  const input = nameIn.value;

  if (input.length > 1 && input.length <= 20) {
    user.name = input;
    Object.freeze(user);

    let query = new URLSearchParams(location.search).get("g");
    if (validateCode(query)) {
      codecrypt.setAuthenticator(query);
      connection.status = "offering";
    } else {
      connection.status = "waiting";
    }
  } else {
    logger.generic("Username must be from 2 to 20 characters long.");
  }
}

async function copyLink() {
  let link = `${location.origin}?g=${codecrypt.authenticator}`;
  await navigator.clipboard.writeText(link);
  logger.success("Link copied!");
}

async function messageRecieved(event) {
  console.log(event);
  let view = new Uint8Array(event.data);
  console.log(view);
}

// Utility

/**
 * Use with await to wait a certain number of milliseconds
 *
 * @param {Number} ms Number of milliseconds to wait
 * @returns A promise, which will resolve after inputted time
 */
function timer(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Fetches and returns a resources; Returns the error object in event of an error
 *
 * @param {string} uri URI to try fetching
 * @returns {Object|Error} Either the fetched json object, or the error recieved
 */
async function tryCatchFetch(uri) {
  try {
    const request = await fetch(uri);
    if (!request.ok) throw new TypeError("Cannot fetch " + uri);
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

/**
 * Returns a random value between min and max
 *
 * @param {Number} min Minimum value (Inclusive)
 * @param {Number} max Maximum value (Exclusive)
 * @returns {Number} A random value
 */
function randomInt(min, max) {
  let rand = Math.random() * (max - min) + min;
  return Math.floor(rand);
}
