// Functions to be used in other files

/**
 * Return object of a tile to be added to array
 *
 * @param {number} x X coordinate of tile
 * @param {number} y Y coordinate of tile
 * @param {string} state The state of the tile (ex. none, hit, miss)
 * @returns {object} Tile object
 */
function addTileToArray(x, y, state) {
  return {
    x: x,
    y: y,
    state: state,
    isValid: true,
  };
}

/**
 * Find the closest tile to provided x and y coordinates
 *
 * @param {number} x Provided x value
 * @param {number} y Provided y value
 * @param {array} array Array of tiles
 * @returns {number} Index of closest tile to coordinates
 */
function findTileByCoordinates(x, y, array) {
  let closestIndex = 0;
  for (let i = 0; i < array.length; i++) {
    // If x or y is higher than it is not the closest
    if (array[i].x < x && array[i].y < y) {
      // If tile is closer than the last closest then set it as new closest
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

/**
 * Process response into an object including rotation and position values
 *
 * @param {number} response An 8-bit number composed of an opponent ship location
 * @returns {object} An object containing rotation and position of ship
 */
function processResponse(response) {
  // Process binary data into useable form
  let rotation = response >> 7;
  let position = response & 127;

  return {
    rotation: rotation,
    position: [position],
  };
}

/**
 * Find the next letter in alphabetical sequence
 *
 * @param {string} letter An uppercase letter
 *
 * @returns {string} The next letter in alphebetical order or END if J has been reached
 */
function nextLetter(letter) {
  let encoded = new TextEncoder().encode(letter);
  // If letter is not in between A (inclusive) and J (exclusive) return "END"
  if (encoded[0] > 73 || encoded[0] < 65) {
    return "END";
  } else {
    encoded[0]++;
    let decoded = new TextDecoder("utf-8").decode(encoded);
    return decoded;
  }
}

/**
 * Check if provided index matches a ship tile position
 *
 * @param {number} index Index of tile
 * @param {array} array Array of opponents ships
 * @param {boolean} getIndex Used to return index instead of element if true
 * @returns {element|index|false} Returns ship element or index depending on getIndex if there's a match or false if there's no match
 */
function checkArrayPosition(index, array, getIndex) {
  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    // If invalid break loop
    if (element === -1) {
      break;
    }
    for (let j = 0; j < element.position.length; j++) {
      const position = element.position[j];
      // If one of the ships matches index return requested data
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

/**
 * Update tile state after ship position changes
 *
 * @param {array} tiles Array of tiles
 * @param {array} ships Array of ships
 * @returns {void} Does not return anything
 */
function updateShips(tiles, ships) {
  // Reset all past instances of ship state
  for (let i = 0; i < tiles.length; i++) {
    const element = tiles[i];
    if (element.state === "ship") {
      element.state = "none";
    }
  }

  // Update tile state to ship on all ship tiles
  for (let i = 0; i < tiles.length; i++) {
    const shipTile = checkArrayPosition(i, ships);
    if (shipTile !== false) {
      shipTile.position.forEach((element) => {
        if (tiles[element].state !== "shiphit") tiles[element].state = "ship";
      });
    }
  }
}

/**
 * Create an array representing all the ship positions based on the index and rotation
 *
 * @param {number} index Index of the head of the ship
 * @param {5|4|3|2} shipLength Length of ship
 * @param {0|1} rotation Rotational value (0 = vertical | 1 = horizontal)
 * @returns {array} Array including all the indexes where the ship is located
 */
function createShip(index, shipLength, rotation) {
  let ship = [index];
  for (let j = 1; j < shipLength; j++) {
    // Add the rest of the ship blocks to array depending on length of ship in left-right direction
    ship[j] = ship[j - 1] + 10 ** rotation;
  }

  return ship;
}

/**
 * Update the validity of all the tiles in the event that a ship were to be placed there
 *
 * @param {number} shipIndex Current index of ship
 * @param {array} shipArray Array of ships
 * @param {array} tileArray Array of tiles
 * @returns {void} Does not return anything
 */
function updateTiles(shipIndex, shipArray, tileArray) {
  let oldShip = shipArray[shipIndex];
  // Remove selected ship from checking process
  let modifiedArray = shipArray.slice();
  modifiedArray.splice(shipIndex, 1);

  // If selected ship is the only one push invalid value
  if (modifiedArray.length === 0) {
    modifiedArray.push(-1);
  }

  for (let i = 0; i < tileArray.length; i++) {
    // Temporary non visible ship used to test validity
    const newShip = {
      rotation: oldShip.rotation,
      position: createShip(i, oldShip.position.length, oldShip.rotation),
    };
    // All ship placing criteria
    let nextMultipleOf10 = Math.ceil((newShip.position[0] + 1) / 10) * 10;
    let invalidPosition = (element) =>
      element > 99 /* ship does not go off the side of the board */ ||
      checkArrayPosition(element, modifiedArray) !==
        false /* ship does not go inside another ship */ ||
      (newShip.rotation === 0 &&
        newShip.position[0] + newShip.position.length >
          nextMultipleOf10); /* ship does not go off the bottom of the board and into the next row */

    // If temporary ship passes criteria update tile
    if (newShip.position.some(invalidPosition)) {
      tileArray[i].isValid = false;
    } else {
      tileArray[i].isValid = true;
    }
  }
}

/**
 * Move ship to the closest valid position and replace it in the array
 *
 * @param {number} shipIndex Index of ship in ship array
 * @param {array} shipArray Array of ships
 * @param {array} tileArray Array of tiles
 * @param {number} newPosition Tile index of requested new position
 * @param {boolean} moveTheShip If true will effectuate otherwise will display hover effect in that position
 */
function moveShip(shipIndex, shipArray, tileArray, newPosition, moveTheShip) {
  // Get the closest valid position to place the ship
  let validPosition = closestCoordinateInArray(
    tileArray[newPosition].x,
    tileArray[newPosition].y,
    tileArray
  );
  // Original ship
  let oldShip = shipArray[shipIndex];
  // Ship with new position
  let newShip = {
    rotation: oldShip.rotation,
    position: createShip(
      validPosition,
      oldShip.position.length,
      oldShip.rotation
    ),
  };
  // If ship is being moved replace old ship with new one in array
  if (moveTheShip === true) {
    shipArray.splice(shipIndex, 1, newShip);
  }
  // Otherwise display hover effect in new ship position
  else if (moveTheShip === false) {
    // Reset all past instances of hover state
    for (let i = 0; i < tileArray.length; i++) {
      const element = tileArray[i];
      if (element.state === "hover") {
        element.state = "none";
      }
    }

    // Update tile state to hover on newShip
    for (let j = 0; j < newShip.position.length; j++) {
      const element = newShip.position[j];
      tileArray[element].state = "hover";
    }
  }
}

/**
 * Return closest coordinate in an array
 *
 * @param {number} x Provided x value
 * @param {number} y Provided y value
 * @param {array} arr Array to be searched
 * @returns {number} Index of array object with closest x and y to provided coordinates
 */
function closestCoordinateInArray(x, y, arr) {
  let minDistance = 10000;
  let closestPoint;
  for (let i = 0; i < arr.length; i++) {
    // Do some math to find distance from coordinates
    let distance = Math.sqrt(
      (x - arr[i].x) * (x - arr[i].x) + (y - arr[i].y) * (y - arr[i].y)
    );
    // If distance is less than current closest than set that one as the closest
    if (distance < minDistance && arr[i].isValid === true) {
      minDistance = distance;
      closestPoint = i;
    }
  }
  return closestPoint;
}

/**
 * Returns a random value between min and max
 *
 * @param {number} min Minimum value (Inclusive)
 * @param {number} max Maximum value (Exclusive)
 * @returns {number} A random value
 */
function randomInt(min, max) {
  let rand = Math.random() * (max - min) + min;
  return Math.floor(rand);
}

/**
 *
 * @param {number} min Minimum value (Inclusive)
 * @param {number} max Maximum value (Exclusive)
 * @returns {number} A random value
 */
function randomFloat(min, max) {
  if (typeof min !== "number" || typeof max !== "number") return NaN;
  if (min > max) throw new RangeError("min is larger than max");

  return Math.random() * (max - min) + min;
}

// Export code to other modules
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
  randomInt,
  randomFloat,
};
