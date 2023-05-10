// Set up canvas and 2d graphics content
let cnv = document.querySelector('canvas');
let ctx = cnv.getContext('2d');
let scale = window.devicePixelRatio;
let trueHeight = Math.floor(window.innerHeight * scale);
let trueWidth = Math.floor(window.innerWidth * scale);
cnv.height = trueHeight;
cnv.width = trueWidth;

// Update center values for drawing
let centerWidth = trueWidth / 2;
let centerHeight = trueHeight / 2;

// Board objects
let defendingBoard = {
  x: centerWidth - trueWidth * 0.025 - trueWidth * 0.45, // x is offset by 2.5% of the width from the center to the left
  y: centerHeight - trueWidth * 0.225, // y is offset by 22.5% of the height from the center upwards
  sideLength: trueWidth * 0.45, // length is same as height (45% of screen)
};
let attackingBoard = {
  x: centerWidth + trueWidth * 0.025, // x is offset by 2.5% of the width from the center to the right
  y: centerHeight - trueWidth * 0.225, // y is offset by 22.5% of the height from the center upwards
  sideLength: trueWidth * 0.45, // length is same as height (45% of screen)
};

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

function drawBoard() {
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
    i < defendingBoard.sideLength + defendingBoard.x;
    i += defendingBoard.sideLength / 10
  ) {
    for (
      let j = defendingBoard.y;
      j <= defendingBoard.sideLength + defendingBoard.y;
      j += defendingBoard.sideLength / 10
    ) {
      ctx.strokeRect(
        i,
        j,
        defendingBoard.sideLength / 10,
        defendingBoard.sideLength / 10
      );
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
    i < attackingBoard.sideLength + attackingBoard.x - 0.00000001; // fix weird rounding error
    i += attackingBoard.sideLength / 10
  ) {
    for (
      let j = attackingBoard.y;
      j <= attackingBoard.sideLength + attackingBoard.y;
      j += attackingBoard.sideLength / 10
    ) {
      ctx.strokeRect(
        i,
        j,
        attackingBoard.sideLength / 10,
        attackingBoard.sideLength / 10
      );
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

// http://en.battleship-game.org/
