// All code for thes ships appearance and functionality

// Ships arrays (off of global scope)
let playerShips = [];
let opponentShips = [];

// When opponents ships are received convert them into useable data
if (opponentShips.length === 0) {
  getOpponentShips();
}

function getOpponentShips() {
  // Get opponent ship locations (test values)
  let response = ['10001110', '00110111', '00011101', '01010010', '11001110'];
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

function isAHit(index) {
  for (let i = 0; i < opponentShips.length; i++) {
    const element = opponentShips[i];
    for (let j = 0; j < element.position.length; j++) {
      const position = element.position[j];
      if (position === index) {
        return element;
      }
    }
  }
  return false;
}

console.log(opponentShips);
