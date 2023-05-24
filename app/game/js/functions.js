// Functions to be used in other files

// Return object of a tile to be added to array
function addTileToArray(x, y, state) {
  return {
    x: x,
    y: y,
    state: state,
    isValid: true,
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

// Check if provided index matches a ship tile position
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

// Update tile state after ship position changes
function updateShips(tiles, ships) {
  for (let i = 0; i < tiles.length; i++) {
    const shipTile = checkArrayPosition(i, ships);
    if (shipTile !== false) {
      shipTile.position.forEach((element) => {
        tiles[element].state = 'ship';
      });
    } else if (tiles[i].state !== 'hover') {
      tiles[i].state = 'none';
    }
  }
}

// Create an array representing all the ship positions based on the index and rotation
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

// Update the validity of all the tiles after a ship is selected
function updateTiles(shipIndex, shipArray, tileArray) {
  let oldShip = shipArray[shipIndex];
  // Remove selected ship from checking process
  let modifiedArray = shipArray.slice();
  modifiedArray.splice(shipIndex, 1);

  for (let i = 0; i < tileArray.length; i++) {
    const newShip = {
      rotation: oldShip.rotation,
      position: createShip(i, oldShip.position.length, oldShip.rotation),
    };
    let nextMultipleOf10 = Math.ceil((newShip.position[0] + 1) / 10) * 10;
    let invalidPosition = (element) =>
      element > 99 ||
      checkArrayPosition(element, modifiedArray) !== false ||
      (newShip.rotation === 0 &&
        newShip.position[0] + newShip.position.length > nextMultipleOf10);

    if (newShip.position.some(invalidPosition)) {
      tileArray[i].isValid = false;
    } else {
      tileArray[i].isValid = true;
    }
  }
}

// Move ship to the closest valid position and replace it in the array
function moveShip(shipIndex, shipArray, tileArray, newPosition, moveTheShip) {
  // Get the closest valid position to place the ship
  let validPosition = closestCoordinateInArray(
    tileArray[newPosition].x,
    tileArray[newPosition].y,
    tileArray
  );
  // console.log(validPosition);

  let oldShip = shipArray[shipIndex];
  let newShip = {
    rotation: oldShip.rotation,
    position: createShip(
      validPosition,
      oldShip.position.length,
      oldShip.rotation
    ),
  };
  if (moveTheShip === true) {
    shipArray.splice(shipIndex, 1, newShip);
  } else if (moveTheShip === false) {
    for (let i = 0; i < tileArray.length; i++) {
      const element = tileArray[i];
      if (element.state === 'hover') {
        element.state = 'none';
      }
    }

    for (let j = 0; j < newShip.position.length; j++) {
      const element = newShip.position[j];
      tileArray[element].state = 'hover';
      console.log(tileArray[element]);
    }
  }
}

// Return closest coordinate in an array
function closestCoordinateInArray(x, y, arr) {
  let minDistance = 10000;
  let closestPoint;
  for (let i = 0; i < arr.length; i++) {
    let distance = Math.sqrt(
      (x - arr[i].x) * (x - arr[i].x) + (y - arr[i].y) * (y - arr[i].y)
    );
    if (distance < minDistance && arr[i].isValid === true) {
      minDistance = distance;
      closestPoint = i;
    }
  }
  return closestPoint;
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
  updateTiles,
};
