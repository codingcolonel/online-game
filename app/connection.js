import { CodeCrypt } from "./codecrypt.js";
// -- Initialize Variables --

// HTML elements
const codeOut = document.getElementById("codeOut");
const codeIn = document.getElementById("codeIn");

const msgOut = document.getElementById("out");
const msgIn = document.getElementById("in");

const connectBtn = document.getElementById("connect");
const sendBtn = document.getElementById("send");

// Global Variables

const ably = new Ably.Realtime.Promise({
  authCallback: async (_, callback) => {
    try {
      const tokenRequest = await fetch(
        `${location.origin}/.netlify/functions/token?}`
      );
      const token = await tokenRequest.json();
      callback(null, token);
    } catch (error) {
      callback(error, null);
    }
  },
});

const servers = fetch(`${location.origin}/.netlify/functions/creds`);

const codecrypt = new CodeCrypt();
codeOut.innerHTML = codecrypt.authenticator;

// -- Ably Setup --

const channel = ably.channels.get("requests");

await channel.subscribe("greeting", (msg) => {
  console.log("Message recieved", msg);
  document.querySelector("body").innerHTML += "<br />" + JSON.stringify(msg);
});

// -- Add Event Listeners --
connectBtn.addEventListener("click", clickHandler);
sendBtn.addEventListener("click", clickHandler);

// -- Functions --

function clickHandler(event) {
  let id = event.target.id;

  switch (id) {
    case "connect":
      let value = codeIn.value;
      if (value.match(/([^0-9A-Fa-f])+/gm)) return;
      console.log(value);
      break;
    case "send":
      break;
  }
}
