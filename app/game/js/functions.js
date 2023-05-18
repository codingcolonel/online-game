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

function checkArrayPosition(index, array) {
  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    for (let j = 0; j < element.position.length; j++) {
      const position = element.position[j];
      if (position === index) {
        return element;
      }
    }
  }
  return false;
}

export {
  processResponse,
  addTileToArray,
  findTileByCoordinates,
  nextLetter,
  checkArrayPosition,
};
