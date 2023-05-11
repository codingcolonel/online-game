// -- Imports --
import { CodeCrypt } from "./codecrypt.js";

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

// HTML elements
const codeOut = document.getElementById("codeOut");
const codeIn = document.getElementById("codeIn");

const msgOut = document.getElementById("out");
const msgIn = document.getElementById("in");

const connectBtn = document.getElementById("connect");
const sendBtn = document.getElementById("send");

// Global Variables

let decryptedRemoteSDP;

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

let channel;

const codecrypt = new CodeCrypt();

const servers = await (
  await fetch(`${location.origin}/.netlify/functions/creds`)
).json();

// -- Ably Setup --
if (typeof ably !== "undefined") {
  channel = ably.channels.get("requests");
  connection.status = "enabled";
}

// -- Status change handlers --
connection.onwaiting = async function () {
  await channel.subscribe("offer", async function (msg) {
    const data = msg.data;

    try {
      decryptedRemoteSDP = await codecrypt.decrypt(data, "offer");
      // TODO: Add user request
      console.log(decryptedRemoteSDP);
      connection.status = "answering";
    } catch (error) {
      newMessage("Invalid Message Recieved");
    }
  });

  codecrypt.generateAuthenticator();
  codeOut.innerHTML = codecrypt.authenticator;
};

connection.onoffering = async function () {
  // TODO: Display connecting screen here

  if (typeof channel.subscriptions.events.offer !== "undefined")
    channel.unsubscribe("offer");

  let iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    servers[2],
    servers[4],
  ];

  connection.session = new RTCPeerConnection({
    iceServers: iceServers,
  });

  connection.session.channel = connection.session.createDataChannel("gameInfo");
  connection.session.channel.addEventListener("open", function () {
    console.log("Channel Opened");
  });
  connection.session.channel.addEventListener("close", function () {
    console.log("Channel Closed");
  });
  connection.session.channel.addEventListener("message", function ({ data }) {
    console.log(data);
  });

  connection.session.onicegatheringstatechange = async function () {
    if (connection.session.iceGatheringState !== "complete") return;

    const sdp = JSON.stringify(connection.session.localDescription);

    let encryptedSDP = await codecrypt.encrypt(sdp, "offer");

    await channel.subscribe("answer", async (msg) => {
      const data = msg.data;

      try {
        decryptedRemoteSDP = await codecrypt.decrypt(data, "answer");
        // TODO: Add user request
        console.log(decryptedRemoteSDP);
        connection.session.setRemoteDescription(JSON.parse(decryptedRemoteSDP));
      } catch (error) {
        newMessage("Invalid Message Recieved");
      }
    });
    await channel.publish("offer", encryptedSDP);
  };

  await connection.session.setLocalDescription(
    await connection.session.createOffer()
  );
};

connection.onanswering = async function () {
  // TODO: Display connecting screen here

  if (typeof channel.subscriptions.events.answer !== "undefined")
    channel.unsubscribe("answer");

  let iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    servers[2],
    servers[4],
  ];

  connection.session = new RTCPeerConnection({
    iceServers: iceServers,
  });

  connection.session.ondatachannel = function ({ channel }) {
    const recieve = channel;
    recieve.addEventListener("open", function () {
      console.log("Channel Opened");
    });
    recieve.addEventListener("close", function () {
      console.log("Channel Closed");
    });
    recieve.addEventListener("message", function ({ data }) {
      console.log(data);
    });
    remote.channel = recieve;
  };

  connection.session.onicegatheringstatechange = async function () {
    if (connection.session.iceGatheringState !== "complete") return;

    const sdp = JSON.stringify(connection.session.localDescription);

    let encryptedSDP = await codecrypt.encrypt(sdp, "answer");

    await channel.publish("answer", encryptedSDP);
  };

  await connection.session.setRemoteDescription(JSON.parse(decryptedRemoteSDP));

  await connection.session.setLocalDescription(
    await connection.session.createAnswer()
  );
};

if (connection.status === "enabled" && typeof servers !== "undefined") {
  // -- Add Event Listeners --
  connectBtn.addEventListener("click", clickHandler);
  sendBtn.addEventListener("click", clickHandler);

  // -- Check Query String --
  let query = new URLSearchParams(location.search).get("g");
  if (validateCode(query)) {
    codecrypt.setAuthenticator(query);
    connection.status = "offering";
  } else {
    connection.status = "waiting";
  }
} else {
  newMessage(new Error("Unable to connect"));
}

// -- Functions --

function clickHandler(event) {
  let id = event.target.id;

  switch (id) {
    case "connect":
      if (connection.status !== "waiting") return;

      let value = codeIn.value;
      if (!validateCode(value)) return;

      codecrypt.setAuthenticator(value);

      codeIn.value = "";
      connection.status = "offering";
      break;
    case "send":
      break;
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

function newMessage(msg) {
  msgOut.innerHTML += msg + "\r\n";
  msgOut.scrollTop = msgOut.scrollHeight;
}

window.connection = connection;
window.channel = channel;
window.ably = ably;
