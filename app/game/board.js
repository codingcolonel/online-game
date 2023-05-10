// Set up canvas and 2d graphics content
let cnv = document.querySelector('canvas');
let ctx = cnv.getContext('2d');
let scale = window.devicePixelRatio;
let trueHeight = Math.floor(window.innerHeight * scale);
let trueWidth = Math.floor(window.innerWidth * scale);
cnv.height = trueHeight;
cnv.width = trueWidth;

// Tile data arrays
let defendingTiles = [];
let attackingTiles = [];

// Ships arrays
let ships = [];

function drawBoard() {
  // Update center values for drawing
  let centerWidth = trueWidth / 2;
  let centerHeight = trueHeight / 2;

  // Board objects
  let defendingBoard = {
    x:
      Math.round((centerWidth - trueWidth * 0.025 - trueWidth * 0.45) * 10) /
      10, // x is offset by 2.5% of the width from the center to the left
    y: Math.round((centerHeight - trueWidth * 0.225) * 10) / 10, // y is offset by 22.5% of the height from the center upwards
    sideLength: Math.round(trueWidth * 0.45 * 10) / 10, // length is same as height (45% of screen)
  };
  let attackingBoard = {
    x: Math.round((centerWidth + trueWidth * 0.025) * 10) / 10, // x is offset by 2.5% of the width from the center to the right
    y: Math.round((centerHeight - trueWidth * 0.225) * 10) / 10, // y is offset by 22.5% of the height from the center upwards
    sideLength: Math.round(trueWidth * 0.45 * 10) / 10, // length is same as height (45% of screen)
  };

  // Draw Background
  ctx.fillStyle = 'dodgerblue';
  ctx.fillRect(0, 0, trueWidth, trueHeight);

  // Draw defending board
  ctx.fillStyle = 'white';
  ctx.fillRect(
    defendingBoard.x,
    defendingBoard.y,
    defendingBoard.sideLength,
    defendingBoard.sideLength
  );

  // Draw defending tiles
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  for (
    let i = defendingBoard.x;
    i < defendingBoard.sideLength + defendingBoard.x - 0.00000000001; // fix weird rounding error;
    i += defendingBoard.sideLength / 10
  ) {
    for (
      let j = defendingBoard.y;
      j <= defendingBoard.sideLength + defendingBoard.y - 0.00000000001; // fix weird rounding error;
      j += defendingBoard.sideLength / 10
    ) {
      ctx.strokeRect(
        i,
        j,
        defendingBoard.sideLength / 10,
        defendingBoard.sideLength / 10
      );
      addDefendingTileToArray(i, j);
    }
  }

  // Draw outline for defending board
  ctx.strokeStyle = 'Navy';
  ctx.lineWidth = 5;
  ctx.strokeRect(
    defendingBoard.x,
    defendingBoard.y,
    defendingBoard.sideLength,
    defendingBoard.sideLength
  );

  // Draw attacking board
  ctx.fillStyle = 'White';
  ctx.fillRect(
    attackingBoard.x,
    attackingBoard.y,
    attackingBoard.sideLength,
    attackingBoard.sideLength
  );

  // Draw attacking tiles
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  for (
    let i = attackingBoard.x;
    i < attackingBoard.sideLength + attackingBoard.x - 0.00000000001; // fix weird rounding error
    i += attackingBoard.sideLength / 10
  ) {
    for (
      let j = attackingBoard.y;
      j <= attackingBoard.sideLength + attackingBoard.y - 0.00000000001; // fix weird rounding error;
      j += attackingBoard.sideLength / 10
    ) {
      ctx.strokeRect(
        i,
        j,
        attackingBoard.sideLength / 10,
        attackingBoard.sideLength / 10
      );
      addAttackingTileToArray(i, j, 'none');
    }
  }

  // Draw outline for attacking board
  ctx.strokeStyle = 'Red';
  ctx.lineWidth = 5;
  ctx.strokeRect(
    attackingBoard.x,
    attackingBoard.y,
    attackingBoard.sideLength,
    attackingBoard.sideLength
  );

  // Test line
  // ctx.fillStyle = 'red';
  // ctx.fillRect(0, centerHeight, trueWidth, 1);
}

// Testing listener
document.addEventListener('click', fullscreenToggle);

function fullscreenToggle() {
  // Change width and height when switching in/out of fullscreen
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    trueHeight = Math.floor(screen.height * scale);
    trueWidth = Math.floor(screen.width * scale);
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
    trueHeight = Math.floor(window.innerHeight * scale);
    trueWidth = Math.floor(window.innerWidth * scale);
  }
  cnv.height = trueHeight;
  cnv.width = trueWidth;
  // console.log(trueHeight);
  // console.log(trueWidth);
  drawBoard();
}

function addDefendingTileToArray(x, y) {
  defendingTiles.push({
    x: x,
    y: y,
  });
}

function addAttackingTileToArray(x, y, state) {
  attackingTiles.push({
    x: x,
    y: y,
    state: state,
  });
}

function addShipToArray(x, y, rotation, index) {
  ships.push({
    x: x,
    y: y,
    data: rotation + intToBin(index),
  });
}

function intToBin(num) {
  return ('00000000' + num.toString(2)).slice(-8);
}

// http://en.battleship-game.org/
