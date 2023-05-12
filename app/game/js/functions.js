// Functions to be used in other files

function addDefendingTileToArray(x, y, state) {
  return {
    x: x,
    y: y,
    state: state,
  };
}

function addAttackingTileToArray(x, y, state) {
  return {
    x: x,
    y: y,
    state: state,
  };
}

function addShipToArray(x, y, rotation, index) {
  return {
    x: x,
    y: y,
    data: rotation + intToBin(index),
  };
}

function intToBin(num) {
  return ('00000000' + num.toString(2)).slice(-8);
}

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
