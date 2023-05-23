/**
 * Game manager
 */
class Manager {
  /** @type {boolean} */
  #isYourTurn;

  get isYourTurn() {
    return this.#isYourTurn;
  }
}

export { Manager };
