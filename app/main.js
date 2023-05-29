// Weblships - Code by Timothy V & Ethan V

// -- Imports --
import { registerErrorLogger } from "./js/errorLog.js";
const logger = registerErrorLogger();
window.addEventListener("error", (err) => {
  logger.error(err.message);
});

import { CodeCrypt } from "./js/codecrypt.js";
import { Manager } from "./js/gameManager.js";
import {
  playerShips,
  opponentShips,
  defaultPosition,
  randomPosition,
} from "./js/ship.js";
import {
  drawBoard,
  updateCanvas,
  scale,
  defendingBoard,
  attackingBoard,
  defendingTiles,
  attackingTiles,
  cnv,
  trueWidth,
  trueHeight,
  resetButton,
  randomizeButton,
  confirmationButton,
  buttons,
  nextPhase,
  ctx,
} from "./js/board.js";
import {
  findTileByCoordinates,
  checkArrayPosition,
  updateShips,
  createShip,
  moveShip,
  updateTiles,
  randomInt,
} from "./js/functions.js";

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
    this.playWait(soundName);
  }

  playWait(soundName, ms) {
    return new Promise((resolve, reject) => {
      if (this.#context.state === "suspended") this.#context.resume();
      if (!this.#soundBuffers.hasOwnProperty(soundName)) return;

      let source = this.#context.createBufferSource();
      source.connect(this.#context.destination);

      const bufferObj = this.#soundBuffers[soundName];
      const randomIndex = randomInt(0, bufferObj.length);
      source.buffer = bufferObj[randomIndex];

      source.addEventListener("ended", function () {
        source = null;
      });

      source.start(0);
      setTimeout(resolve, ms);
    });
  }
}

// -- Initialize Variables --

// Global Variables
let decryptedRemoteSDP;

let connection = new ConnectionManager();

let gameManager = new Manager(connection, true);

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

/** @type {Manager} */

// Canvas shenanigans

const effectCnv = document.getElementById("topCanvas");
effectCnv.width = screen.width;
effectCnv.height = screen.height;
const offCnv = effectCnv.transferControlToOffscreen();
const Drawing = new Worker("./js/drawWorker.js");
Drawing.postMessage({ type: "init", canvas: offCnv, scale }, [offCnv]);
// ! Temporary
window.Drawing = Drawing;
window.connection = connection;

drawBoard(true);
updateDim();

let clickedShip;

let isHost;

// HTML References

const favicons =
  document.documentElement.children[0].querySelectorAll("link#icon");

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

const canvasContain = document.getElementById("canvasContain");

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
mainManager.add(canvasContain, "canvas", null, false);

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
  console.log(connection.status);
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

document.addEventListener("keyup", fullscreenToggle);

document.addEventListener("fullscreenchange", fullscreenHandler);

window.addEventListener("resize", windowResize);

cnv.addEventListener("click", getMouseCoordinates);

cnv.addEventListener("mousemove", hoverHandler);

// -- Connection Manager Functions --

connection.onwaiting = async function () {
  console.log("now waiting");
  if (connection.status === "disabled") return;
  isHost = false;
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
  console.log("now offering");
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
    isHost = false;
    connection.status = "connected";
  });
  connection.session.channel.addEventListener("close", function () {
    connection.status = "disconnected";
  });
  connection.session.channel.addEventListener("message", recievedMessage);

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
        if (typeof channel.subscriptions.events.answer !== "undefined")
          channel.unsubscribe("answer");
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
  console.log("now answering");
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
      isHost = true;
      connection.status = "connected";
    });
    recieve.addEventListener("close", function () {
      connection.status = "disconnected";
    });
    recieve.addEventListener("message", recievedMessage);
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
  console.log("now connected");
  if (connection.status === "disabled") return;
  ably.close();
  mainManager.display("canvas");
  drawBoard(true);

  gameManager = new Manager(connection, isHost);
};

connection.ondisconnected = async function () {
  console.log("now disconnected");
  console.trace();
  if (connection.status === "disabled") return;
  connection.session = null;

  console.log(ably.connection.state);
  if (ably.connection.state !== "connected") {
    console.log("connecting");
    mainManager.hideAll();
    ably.connect();
    await ably.connection.once("connected");
  }
  console.log("done");

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

function recievedMessage(event) {
  gameManager.recieve(event);
}

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

function windowResize() {
  trueHeight(Math.floor(window.innerHeight * scale));
  trueWidth(Math.floor(window.innerWidth * scale));
  cnv.height = trueHeight();
  cnv.width = trueWidth();
  updateDim();
  drawBoard(false);
}

async function fullscreenToggle(e) {
  if (e.key === "f") {
    // Change width and height when switching in/out of fullscreen
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      trueHeight(Math.floor(screen.height * scale));
      trueWidth(Math.floor(screen.width * scale));
    } else if (document.exitFullscreen) {
      await document.exitFullscreen();
      trueHeight(Math.floor(window.innerHeight * scale));
      trueWidth(Math.floor(window.innerWidth * scale));
    }
    cnv.height = trueHeight();
    cnv.width = trueWidth();
    updateDim();
    drawBoard(false);
  }
}
async function fullscreenHandler() {
  // Update changes to the screen once the screen has transitioned in/out fullscreen
  if (!document.fullscreenElement) {
    trueHeight(Math.floor(window.innerHeight * scale));
    trueWidth(Math.floor(window.innerWidth * scale));
  }
  cnv.height = trueHeight();
  cnv.width = trueWidth();
  updateDim();
  drawBoard(false);
}

async function getMouseCoordinates(e) {
  // console.log(e);
  // console.log('x' + e.x + ' y' + e.y);

  // Adjust mouse x and y to pixel ratio
  let mouseX = e.x * scale;
  let mouseY = e.y * scale;

  if (
    mouseX >= defendingBoard.x &&
    mouseX <= defendingBoard.x + defendingBoard.sideLength &&
    mouseY >= defendingBoard.y &&
    mouseY <= defendingBoard.y + defendingBoard.sideLength &&
    gameManager.shipPlacing === true
  ) {
    // Get index of clicked tile on defending board
    let clickedDefendingTile = findTileByCoordinates(
      mouseX,
      mouseY,
      defendingTiles
    );
    // Get the index of the selected ship
    let shipElement = checkArrayPosition(
      clickedDefendingTile,
      playerShips,
      true
    );
    // If a ship is clicked for the first time or is being rotated act accordingly
    if (
      shipElement !== false &&
      (clickedShip !== shipElement || e.detail >= 2)
    ) {
      // If ship is clicked for the first time update clickedShip to current ship and update tiles
      if (e.detail === 1) {
        clickedShip = shipElement;
        updateTiles(shipElement, playerShips, defendingTiles);
      } else {
        // Switch rotation from 1 to 0 and vice versa
        playerShips[shipElement].rotation =
          1 - playerShips[shipElement].rotation;

        // Update tiles after ship is rotated
        updateTiles(shipElement, playerShips, defendingTiles);
        moveShip(
          shipElement,
          playerShips,
          defendingTiles,
          playerShips[shipElement].position[0],
          true
        );
        clickedShip = undefined;
      }
      // Else move the selected ship to new position
    } else {
      if (clickedShip === undefined) return;
      moveShip(
        clickedShip,
        playerShips,
        defendingTiles,
        clickedDefendingTile,
        true
      );
      clickedShip = undefined;
    }
  } else if (
    mouseX >= attackingBoard.x &&
    mouseX <= attackingBoard.x + attackingBoard.sideLength &&
    mouseY >= attackingBoard.y &&
    mouseY <= attackingBoard.y + attackingBoard.sideLength &&
    gameManager.shipPlacing === false
  ) {
    if (gameManager.yourTurn === true) {
      // Get index of clicked tile on attacking board
      let clickedAttackingTile = findTileByCoordinates(
        mouseX,
        mouseY,
        attackingTiles
      );
      // Change tile state based on outcome
      if (attackingTiles[clickedAttackingTile].state === "none") {
        let hitCheck = checkArrayPosition(clickedAttackingTile, opponentShips);
        if (hitCheck !== false) {
          attackingTiles[clickedAttackingTile].state = "hit";
          if (
            hitCheck.position.every(
              (index) => attackingTiles[index].state === "hit"
            ) === true
          ) {
            for (let i = 0; i < hitCheck.position.length; i++) {
              const element = hitCheck.position[i];
              attackingTiles[element].state = "sunk";
            }
          }
        } else {
          attackingTiles[clickedAttackingTile].state = "miss";
        }
        // Send message with tile index here
        gameManager.send({
          type: "guess",
          guess: {
            index: clickedAttackingTile,
            hit: hitCheck === false ? false : true,
          },
        });
        await audio.playWait("fireClose", 3000);
      }
    } else {
      return;
    }
  } else if (
    mouseX >= resetButton.x &&
    mouseX <= resetButton.x + buttons.length &&
    mouseY >= resetButton.y &&
    mouseY <= resetButton.y + buttons.height &&
    gameManager.shipPlacing === true
  ) {
    defaultPosition();
  } else if (
    mouseX >= randomizeButton.x &&
    mouseX <= randomizeButton.x + buttons.length &&
    mouseY >= randomizeButton.y &&
    mouseY <= randomizeButton.y + buttons.height &&
    gameManager.shipPlacing === true
  ) {
    randomPosition();
  } else if (
    mouseX >= confirmationButton.x &&
    mouseX <= confirmationButton.x + buttons.length &&
    mouseY >= confirmationButton.y &&
    mouseY <= confirmationButton.y + buttons.height &&
    gameManager.shipPlacing === true
  ) {
    // send off message containing confirmation here
    // document.addEventListener('message', startGame)
    startGame();
  }

  ctx.fillStyle = "white";
  ctx.fillRect(
    defendingBoard.x,
    defendingBoard.y,
    defendingBoard.sideLength,
    defendingBoard.sideLength
  );
  updateCanvas();
}

function hoverHandler(e) {
  // Adjust mouse x and y to pixel ratio
  let mouseX = e.x * scale;
  let mouseY = e.y * scale;

  if (
    mouseX >= defendingBoard.x &&
    mouseX <= defendingBoard.x + defendingBoard.sideLength &&
    mouseY >= defendingBoard.y &&
    mouseY <= defendingBoard.y + defendingBoard.sideLength &&
    clickedShip !== undefined
  ) {
    // Get index of tile on defending board being hovered on
    let hoverDefendingTile = findTileByCoordinates(
      mouseX,
      mouseY,
      defendingTiles
    );
    moveShip(
      clickedShip,
      playerShips,
      defendingTiles,
      hoverDefendingTile,
      false
    );
    // console.log(defendingTiles);

    updateCanvas();
  }
}

function startGame(message) {
  // After both players have confirmed start the game
  // if (message === confirmation message) {
  nextPhase();
  // }
}

function incomingHitOrMiss(message) {
  // Convert message to tile index then update board accordingly
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

function updateDim() {
  Drawing.postMessage({
    type: "dim",
    dim: { width: trueWidth(), height: trueHeight() },
  });
}

function setFavicon(version) {
  favicons.forEach((link) => {
    link.href = `${location.origin}/img/faviconsV${version}/${
      link.href.split(/(^.*(V[1-3]\/))/gm)[3]
    }`;
  });
}

export { gameManager, setFavicon, audio, timer };
