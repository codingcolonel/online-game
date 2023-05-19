// All code for thes ships appearance and functionality
import { processResponse } from './functions.js';

// Ships arrays (off of global scope)
let playerShips = [
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
    rotation: 1,
    position: [40, 41],
  },
];
let opponentShips = [];

// When opponents ships are received convert them into useable data
if (opponentShips.length === 0) {
  getOpponentShips([
    // Get opponent ship locations (test values)
    // ! response[2] (00011101) creates a "Split Ship" where it falls off of the bottom, and reappears on top, one column over
    '10001110',
    '00110111',
    '00011101',
    '01010010',
    '11001110',
  ]);
}

function getOpponentShips(response) {
  let shipLength = 5;
  let counter = 1;

  for (let i = 0; i < response.length; i++) {
    const element = response[i];
    // Add new ship object to array
    opponentShips.push(processResponse(element));
    if (opponentShips[i].rotation === 1) {
      for (let j = 1; j < shipLength; j++) {
        // Add the rest of the ship blocks to array depending on length of ship in left-right direction
        opponentShips[i].position[j] = opponentShips[i].position[j - 1] + 10;
      }
    } else {
      for (let j = 1; j < shipLength; j++) {
        // Add the rest of the ship blocks to array depending on length of ship in up-down direction
        opponentShips[i].position[j] = opponentShips[i].position[j - 1] + 1;
      }
    }
    // If the ship length is 3 and is the first of the two, run again with same length
    if (shipLength === 3 && counter === 1) {
      counter--;
    } else {
      shipLength--;
    }
  }
}
console.log(opponentShips);

export { playerShips, opponentShips, getOpponentShips };
