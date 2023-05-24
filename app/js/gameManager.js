/*
  type: "placement"|"guess"

  if it is already your turn, or the object is missing/contains excess entries, or any entries are invalid, terminate the match
  
  if type == "placement":
    Placement must not have already occurred
    The only entries must be type and ships
    ships must be an ArrayBuffer, and must be exactly 5 bytes long
    When converted to ships, all placements must be legal
  if type == "guess":
    It must be not your turn
    
  else
    Terminate the match
*/

/**
 * Manages turn order and verifies incoming turn messages
 */
class Manager {
  /** @type {boolean} */
  #isYourTurn;
  #connectionReference;
  #channelReference;
  #tiles;

  constructor(connection) {
    this.#connectionReference = connection;
    this.#channelReference = connection.session.channel;
  }

  get isYourTurn() {
    return this.#isYourTurn;
  }

  terminate() {
    logger.error("The match was terminated");
    this.#connectionReference.session.close();
  }
}

export { Manager };
