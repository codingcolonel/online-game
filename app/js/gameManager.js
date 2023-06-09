/*
  type: "place"|"guess"

  if it is already your turn, or the object is missing/contains excess entries, or any entries are invalid, terminate the match
  
  if type == "place":
    Placement must not have already occurred
    The only entries must be type and ships
    ships must be an ArrayBuffer, and must be exactly 5 bytes long
    When converted to ships, all placements must be legal
  if type == "guess":
    It must be not your turn
    The only entries must be type and guess
    Guess must be an object containing only the entries location and hit
    location must be a Unsigned 8 bit integer (0-255) (XXXXYYYY)
    location x must be from 0-9
    location y must be from 0-9
    location must not have already been guessed
    hit must be a boolean (true = hit ship, false = did not hit ship)
    hit must match correct value
  else
    Terminate the match
*/

import { Drawing, audio, setFavicon, timer } from "../main.js";
import {
  attackingTiles,
  defendingTiles,
  drawBoard,
  updateCanvas,
} from "./board.js";
import { getOpponentShips, opponentShips } from "./ship.js";

function createByte(position, leading) {
  return (leading << 7) | position;
}

function encodeGuess(json) {
  let guessBuffer = new ArrayBuffer(1);
  let guessView = new Uint8Array(guessBuffer);
  guessView[0] = createByte(json.guess.index, json.guess.hit);
  return guessBuffer;
}

function encodeShips(json) {
  let placeBuffer = new ArrayBuffer(5);
  let placeView = new Uint8Array(placeBuffer);
  for (let index = 0; index < 5; index++) {
    const ship = json.ships[index];
    placeView[index] = createByte(ship.position[0], ship.rotation);
  }
  return placeBuffer;
}

async function decodeGuess(response) {
  let hit = response >> 7;
  let position = response & 127;

  if ((defendingTiles[position].state === "ship") == hit) {
    defendingTiles[position].state = hit ? "shiphit" : "miss";
    await timer(850);
    await audio.playWait("fireFar", 0, 1500);

    if (hit) {
      await audio.playWait("hit", 0.15, 350);
      await audio.playWait("hit", 0.15, 225);
      Drawing.postMessage({
        type: "particle",
        name: "defendSmoke",
        time: Number.MAX_SAFE_INTEGER,
        frequency: 8,
        max: 1000,
        position: {
          x: Math.floor(position / 10),
          y: position % 10,
        },
        under: true,
      });
    } else {
      await audio.playWait("miss", 0.15, 575);
    }
    setFavicon(2);
    return true;
  } else {
    return false;
  }
}

function validateShips() {
  const positionArray = opponentShips.reduce((prev, curr) => {
    prev.push(...curr.position);
    return prev;
  }, []);
  if (positionArray.length !== new Set(positionArray).size) return false;

  for (let index = 0; index < 5; index++) {
    const ship = opponentShips[index];

    let isValidPosition = (element) => {
      let nextMultipleOf10 = Math.ceil((element + 1) / 10) * 10;
      if (
        element >= 100 ||
        (opponentShips[index].rotation === 0 &&
          element + ship.length > nextMultipleOf10)
      )
        return false;

      return attackingTiles[index].isValid;
    };
    if (!ship.position.every(isValidPosition)) return false;
  }
  return true;
}

/**
 * Manages turn order and verifies incoming turn messages
 */
class Manager {
  #yourTurn;
  #shipPlacing;
  #connectionReference;
  /** @type {RTCDataChannel} */
  #channelReference;
  #haveOpponentShips;
  #terminated;
  #gameActive;
  #rematch;
  #initiateRematch;

  constructor(connection, isHost, rematchCallback) {
    this.#connectionReference = connection;
    this.#channelReference =
      this.#connectionReference.session !== null
        ? connection.session.channel
        : {
            send: function (val) {
              console.log(val);
            },
          };
    this.#yourTurn = isHost;
    this.shipPlacing = true;
    this.#haveOpponentShips = false;
    this.#terminated = false;
    this.#gameActive = true;
    this.#rematch = {
      me: false,
      them: false,
    };
    this.#initiateRematch = rematchCallback;
  }

  send(json) {
    if (this.terminated) return;
    if (!this.#gameActive) {
      if (json.type !== "rematchRequest") this.terminate();
      let buffer = new ArrayBuffer(1);
      new Uint8Array(buffer)[0] = 255;
      this.#channelReference.send(buffer);

      this.#rematch.me = true;
      if (this.#rematch.them && this.#rematch.me) this.#initiateRematch();
    } else {
      try {
        let arrayBuffer = this.parseObject(json);
        this.#channelReference.send(arrayBuffer);

        setFavicon(3);
      } catch (error) {
        throw error;
      }
    }
  }

  recieve(event) {
    if (this.terminated) return;
    if (!this.#gameActive) {
      if (!(event.data instanceof ArrayBuffer))
        throw new Error("Invalid message recieved");
      if (event.data[0] !== 255) this.terminate();

      this.#rematch.them = true;
      if (this.#rematch.them && this.#rematch.me) this.#initiateRematch();
    } else {
      const data = event.data;
      this.parseBuffer(data);
    }
  }

  terminate() {
    if (this.terminated || !this.#gameActive) return;
    this.#terminated = true;
    this.#yourTurn = false;
    this.shipPlacing = false;
    this.#haveOpponentShips = false;
    this.#gameActive = false;
    if (this.#connectionReference.session !== null) {
      this.#connectionReference.session.close();
    } else {
      this.#connectionReference.status = "disconnected";
    }
    this.#channelReference = {
      send: function (val) {
        console.log(val);
      },
    };
    throw new Error("The match was terminated");
  }

  parseObject(json) {
    if (this.terminated || !this.#gameActive) return;
    if (!json.hasOwnProperty("type"))
      throw new Error("json object does not contain a type");
    switch (json.type) {
      case "place":
        if (!this.shipPlacing) this.terminate();
        this.shipPlacing = false;
        logger.success("Locked in, and ready to go!");
        return encodeShips(json);
      case "guess":
        if (!this.#yourTurn || !this.#haveOpponentShips) this.terminate();
        this.#yourTurn = false;
        return encodeGuess(json);
      default:
        throw new Error("type is not valid");
    }
  }

  async parseBuffer(data) {
    if (this.terminated) return;
    if (!(data instanceof ArrayBuffer))
      throw new Error("Invalid message recieved");
    const view = new Uint8Array(data);
    switch (view.length) {
      case 1:
        if (this.shipPlacing || !this.#haveOpponentShips || this.#yourTurn)
          this.terminate();

        let validGuess = await decodeGuess(view[0]);

        if (!validGuess) this.terminate();

        this.#yourTurn = true;
        drawBoard(false);
        break;
      case 5:
        if (this.#haveOpponentShips) this.terminate();

        getOpponentShips(view);
        this.#haveOpponentShips = true;

        let validShip = validateShips();
        if (!validShip) this.terminate();

        break;
      default:
        throw new Error("Invalid message recieved");
    }
  }

  gameOver() {
    this.#gameActive = false;
  }

  get gameActive() {
    return this.#gameActive;
  }

  get yourTurn() {
    return this.#yourTurn;
  }

  get shipPlacing() {
    return this.#shipPlacing;
  }

  get haveOpponentShips() {
    return this.#haveOpponentShips;
  }

  get terminated() {
    return this.#terminated;
  }

  set shipPlacing(value) {
    this.#shipPlacing = value;
  }
}

export { Manager };
