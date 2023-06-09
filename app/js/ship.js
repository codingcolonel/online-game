// All code for the ships appearance and functionality

// Import code from other modules
import {
  processResponse,
  createShip,
  randomInt,
  updateTiles,
} from "./functions.js";
import { defendingTiles } from "./board.js";

let playerShips = [];
let opponentShips = [];
defaultPosition();

/**
 * Sets the ships to the default formation from the start of the game
 * @returns {void} Does not return anything
 */
function defaultPosition() {
  playerShips = [
    {
      rotation: 0,
      position: [0, 1, 2, 3, 4],
    },
    {
      rotation: 0,
      position: [10, 11, 12, 13],
    },
    {
      rotation: 0,
      position: [20, 21, 22],
    },
    {
      rotation: 0,
      position: [30, 31, 32],
    },
    {
      rotation: 0,
      position: [40, 41],
    },
  ];
}

/**
 * Sets the ships to a random valid formation
 * @returns {void} Does not return anything
 */
function randomPosition() {
  playerShips = [];
  let shipLength = [5, 4, 3, 3, 2];

  for (let i = 0; i < 5; i++) {
    let ranPos = randomInt(0, 100);
    let ranRot = randomInt(0, 2);
    // Add new ship object to array
    playerShips.push({
      rotation: ranRot,
      position: [ranPos],
    });
    updateTiles(i, playerShips, defendingTiles);

    // Take the index and rotation and make the rest of the ship
    playerShips[i].position = createShip(
      playerShips[i].position[0],
      shipLength[i],
      playerShips[i].rotation
    );

    let isValidPosition = (element) => {
      // if (element >= 100) return true; // ! Fixed the randomizer by adding this one line, basically some parts of the ships were ending up outside the possible region, causing errors
      // return defendingTiles[element].isValid === false;
      let nextMultipleOf10 = Math.ceil((element + 1) / 10) * 10;
      if (
        element >= 100 ||
        (playerShips[i].rotation === 0 &&
          element + shipLength[i] > nextMultipleOf10)
      )
        return true;
      return defendingTiles[element].isValid === false;
    };

    while (playerShips[i].position.some(isValidPosition) === true) {
      ranPos = randomInt(0, 100);
      ranRot = randomInt(0, 2);

      playerShips.splice(i, 1, {
        rotation: ranRot,
        position: [ranPos],
      });

      updateTiles(i, playerShips, defendingTiles);

      playerShips[i].position = createShip(
        playerShips[i].position[0],
        shipLength[i],
        playerShips[i].rotation
      );
    }
  }
}

// When opponents ships are received convert them into useable data
if (opponentShips.length === 0) {
  getOpponentShips([0, 10, 20, 30, 40]);
}

/**
 * Converts all binary values into useable data then adds them to the array
 *
 * @param {Uint8Array} response An array containing all the ship data received from other player after the ship placing phase
 * @returns {void} Does not return anything
 */
function getOpponentShips(response) {
  let shipLength = [5, 4, 3, 3, 2];

  opponentShips = [];
  for (let i = 0; i < response.length; i++) {
    const element = response[i];
    // Add new ship object to array
    opponentShips.push(processResponse(element));
    // Take the index and rotation and make the rest of the ship
    opponentShips[i].position = createShip(
      opponentShips[i].position[0],
      shipLength[i],
      opponentShips[i].rotation
    );
  }
}

// Export code to other modules
export {
  playerShips,
  opponentShips,
  getOpponentShips,
  defaultPosition,
  randomPosition,
};
