// All code for thes ships appearance and functionality
import {
  processResponse,
  createShip,
  randomInt,
  moveShip,
  updateTiles,
} from "./functions.js";
import { defendingTiles } from "./board.js";

let playerShips = [];
let opponentShips = [];
defaultPosition();

// Ships arrays (off of global scope)
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
      if (element >= 100) return true; // ! Fixed the randomizer by adding this one line, basically some parts of the ships were ending up outside the possible region, causing errors
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

    console.log(playerShips);
    console.log(defendingTiles);
  }
}

// When opponents ships are received convert them into useable data
if (opponentShips.length === 0) {
  getOpponentShips([142, 55, 29, 82, 206]);
}

function getOpponentShips(response) {
  let shipLength = [5, 4, 3, 3, 2];

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

export {
  playerShips,
  opponentShips,
  getOpponentShips,
  defaultPosition,
  randomPosition,
};
