// Draw the board and update changes to canvas

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

// Board info variables
let defendingBoard, attackingBoard;

// Draw the board on load
window.onload = function () {
  drawBoard();
};

function drawBoard() {
  // Reset tile array
  defendingTiles = [];
  attackingTiles = [];

  // Update center values for drawing
  let centerWidth = trueWidth / 2;
  let centerHeight = trueHeight / 2;

  // Update board objects
  defendingBoard = {
    x:
      Math.round((centerWidth - trueWidth * 0.025 - trueWidth * 0.4) * 10) / 10, // x is offset by 2.5% of the width from the center to the left
    y: Math.round((centerHeight - trueWidth * 0.2) * 10) / 10, // y is offset by 20% of the height from the center upwards
    sideLength: Math.round(trueWidth * 0.4 * 10) / 10, // length is same as height (40% of screen)
  };
  attackingBoard = {
    x: Math.round((centerWidth + trueWidth * 0.025) * 10) / 10, // x is offset by 2.5% of the width from the center to the right
    y: Math.round((centerHeight - trueWidth * 0.2) * 10) / 10, // y is offset by 20% of the height from the center upwards
    sideLength: Math.round(trueWidth * 0.4 * 10) / 10, // length is same as height (40% of screen)
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
      if (defendingTiles.length < 100) {
        defendingTiles.push(addTileToArray(i, j, 'miss'));
      }
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
      if (attackingTiles.length < 100) {
        attackingTiles.push(addTileToArray(i, j, 'none'));
      }
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

  // Update canvas
  updateCanvas();
}

function updateCanvas() {
  // Update Defending Board for any changes
  for (let i = 0; i < defendingTiles.length; i++) {
    const element = defendingTiles[i];
    const center = {
      x: element.x + defendingBoard.sideLength / 20,
      y: element.y + defendingBoard.sideLength / 20,
    };
    if (element.state === 'miss') {
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(center.x, center.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    } else if (element.state === 'ship') {
      // Will make later
    } else if (element.state === 'shipsunk') {
      // Will make later
    }
  }

  // Update Attacking Board for any changes
  for (let i = 0; i < attackingTiles.length; i++) {
    const element = attackingTiles[i];
    const tile = {
      x1: element.x,
      y1: element.y,
      x2: element.x + attackingBoard.sideLength / 10,
      y2: element.y + attackingBoard.sideLength / 10,
      centerx: element.x + attackingBoard.sideLength / 20,
      centery: element.y + attackingBoard.sideLength / 20,
    };
    if (element.state === 'miss') {
      // Draw dot to mark as a miss
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(tile.centerx, tile.centery, 5, 0, 2 * Math.PI);
      ctx.fill();
    } else if (element.state === 'hit') {
      // Draw red x to mark as hit
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(tile.x1, tile.y1);
      ctx.lineTo(tile.x2, tile.y2);
      ctx.stroke();
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(tile.x2, tile.y1);
      ctx.lineTo(tile.x1, tile.y2);
      ctx.stroke();
      // Draw box around the x
      ctx.strokeRect(
        tile.x1,
        tile.y1,
        attackingBoard.sideLength / 10,
        attackingBoard.sideLength / 10
      );
    }
  }
}

// http://en.battleship-game.org/
