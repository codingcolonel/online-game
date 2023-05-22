// Functions to be used in other files

// Return object of a tile to be added to array
function addTileToArray(x, y, state) {
  return {
    x: x,
    y: y,
    state: state,
  };
}

// Return object of a ship
function addShipToArray(x, y, rotation, index) {
  return {
    x: x,
    y: y,
    data: rotation + intToBin(index),
  };
}

// Convert an integer into binary
function intToBin(num) {
  return ('00000000' + num.toString(2)).slice(-8);
}

// Convert binary into an integer
function binToInt(num) {
  return parseInt(num, 2);
}

// Find the closest tile to provided x and y coordinates
function findTileByCoordinates(x, y, array) {
  let closestIndex = 0;
  for (let i = 0; i < array.length; i++) {
    if (array[i].x < x && array[i].y < y) {
      if (
        array[i].x >= array[closestIndex].x &&
        array[i].y >= array[closestIndex].y
      ) {
        closestIndex = i;
      }
    }
  }
  return closestIndex;
}

// Process response into an object including rotation and position values
function processResponse(response) {
  let rotation = JSON.parse(response[0]);
  let position = binToInt(response.substring(1));

  return {
    rotation: rotation,
    position: [position],
  };
}

// Find the next letter in alphabetical sequence
function nextLetter(letter) {
  let encoded = new TextEncoder().encode(letter);
  if (encoded[0] > 73 || encoded[0] < 65) {
    return 'END';
  } else {
    encoded[0]++;
    let decoded = new TextDecoder('utf-8').decode(encoded);
    return decoded;
  }
}

function checkArrayPosition(index, array, getIndex) {
  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    for (let j = 0; j < element.position.length; j++) {
      const position = element.position[j];
      if (position === index) {
        if (getIndex === true) {
          return i;
        }
        return element;
      }
    }
  }
  return false;
}

function updateShips(tiles, ships) {
  for (let i = 0; i < tiles.length; i++) {
    const shipTile = checkArrayPosition(i, ships);
    if (shipTile !== false) {
      shipTile.position.forEach((element) => {
        tiles[element].state = 'ship';
      });
    } else {
      tiles[i].state = 'none';
    }
  }
}

function createShip(index, shipLength, rotation) {
  let ship = [index];
  if (rotation === 1) {
    for (let j = 1; j < shipLength; j++) {
      // Add the rest of the ship blocks to array depending on length of ship in left-right direction
      ship[j] = ship[j - 1] + 10;
    }
  } else {
    for (let j = 1; j < shipLength; j++) {
      // Add the rest of the ship blocks to array depending on length of ship in up-down direction
      ship[j] = ship[j - 1] + 1;
    }
  }
  return ship;
}

function moveShip(shipIndex, array, newPosition) {
  let oldShip = array[shipIndex];
  let newShip = {
    rotation: oldShip.rotation,
    position: createShip(
      newPosition,
      oldShip.position.length,
      oldShip.rotation
    ),
  };

  let modifiedArray = array.slice();
  modifiedArray.splice(shipIndex, 1);
  let nextMultipleOf10 = Math.ceil((newShip.position[0] + 1) / 10) * 10;
  let invalidPosition = (element) =>
    element > 99 ||
    checkArrayPosition(element, modifiedArray) !== false ||
    (newShip.rotation === 0 &&
      newShip.position[0] + newShip.position.length > nextMultipleOf10);

  if (newShip.position.some(invalidPosition)) {
    return false;
  }
  array.splice(shipIndex, 1, newShip);
}

export {
  processResponse,
  addTileToArray,
  findTileByCoordinates,
  nextLetter,
  checkArrayPosition,
  updateShips,
  createShip,
  moveShip,
};
