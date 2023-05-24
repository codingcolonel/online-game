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

function creatreByte(position, leading) {
  return (leading << 7) | position;
}

function parse(json) {
  if (!json.hasOwnProperty("type"))
    throw new Error("json object does not contain a type");
  switch (json.type) {
    case "place":
      let placeBuffer = new ArrayBuffer(5);
      let placeView = new Uint8Array(placeBuffer);
      for (let index = 0; index < 5; index++) {
        const ship = json.ships[index];
        placeView[index] = creatreByte(ship.position, ship.rotation);
      }
      return placeView;
    case "guess":
      let guessBuffer = new ArrayBuffer(1);
      let guessView = new Uint8Array(guessBuffer);
      placeView[index] = creatreByte(json.guess.hit, json.guess.index);
      return guessView;
    default:
      throw new Error("type is not valid");
  }
}

/**
 * Manages turn order and verifies incoming turn messages
 */
class Manager {
  /** @type {boolean} */
  #isYourTurn;
  #connectionReference;
  /** @type {RTCDataChannel} */
  #channelReference;
  #defendingShips;
  #attackingShips;

  constructor(connection) {
    this.#connectionReference = connection;
    this.#channelReference = connection.session.channel;
  }

  send(json) {
    try {
      let arrayBuffer = parse(json);
      this.#channelReference.send(arrayBuffer);
    } catch (error) {
      throw error;
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

  get isYourTurn() {
    return this.#isYourTurn;
  }
}

export { Manager };
