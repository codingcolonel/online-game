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

function createByte(position, leading) {
  return (leading << 7) | position;
}

function parseObject(json) {
  if (!json.hasOwnProperty("type"))
    throw new Error("json object does not contain a type");
  switch (json.type) {
    case "place":
      return encodeShips(json);
    case "guess":
      return encodeGuess(json);
    default:
      throw new Error("type is not valid");
  }
}

function encodeGuess(json) {
  let guessBuffer = new ArrayBuffer(1);
  let guessView = new Uint8Array(guessBuffer);
  guessView[0] = createByte(json.guess.index, json.guess.hit);
  return guessView;
}

function encodeShips(json) {
  let placeBuffer = new ArrayBuffer(5);
  let placeView = new Uint8Array(placeBuffer);
  for (let index = 0; index < 5; index++) {
    const ship = json.ships[index];
    placeView[index] = createByte(ship.position[0], ship.rotation);
  }
  return placeView;
}

function decodeShips(response) {}

function decodeGuess(reponse) {}

/**
 * Manages turn order and verifies incoming turn messages
 */
class Manager {
  #phase;
  #connectionReference;
  /** @type {RTCDataChannel} */
  #channelReference;
  #playerShips;
  #opponentShips;

  constructor(connection) {
    this.#connectionReference = connection;
    this.#channelReference = connection.session.channel;
    this.#phase = "placing";
  }

  send(json) {
    try {
      let arrayBuffer = parseObject(json);
      this.#channelReference.send(arrayBuffer);
    } catch (error) {
      throw error;
    }
  }

  recieve(event) {
    const data = event.data;
    if (!(data instanceof ArrayBuffer))
      throw new Error("Invalid message recieved");

    const view = new Uint8Array(data);
    switch (view.length) {
      case 1:
        decodeGuess(view);
        break;
      case 6:
        decodeShips(view);
        break;
      default:
        throw new Error("Invalid message recieved");
    }
  }

  terminate() {
    logger.error("The match was terminated");
    if (this.#connectionReference.session !== null) {
      this.#connectionReference.session.close();
      this.#connectionReference.session = null;
    } else {
      this.#connectionReference.status = "disconnected";
    }
  }

  get phase() {
    return this.#phase;
  }
}

export { Manager };
