// Set up canvas and 2d graphics content
// Change size to fullscreen
let cnv = document.querySelector('canvas');
let ctx = cnv.getContext('2d');
let scale = window.devicePixelRatio;
let trueHeight = Math.floor(window.innerHeight * scale);
let trueWidth = Math.floor(window.innerWidth * scale);
cnv.height = trueHeight;
cnv.width = trueWidth;

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
  console.log(trueHeight);
  console.log(trueWidth);
  drawBoard();
}

function drawBoard() {
  // Update center values for drawing
  let centerWidth = trueWidth / 2;
  let centerHeight = trueHeight / 2;

  // Draw Background
  ctx.fillStyle = 'Navy';
  ctx.fillRect(0, 0, trueWidth, trueHeight);

  // Draw defending board
  ctx.fillStyle = 'White';
  ctx.fillRect(
    centerWidth - trueWidth * 0.025 - trueWidth * 0.45,
    centerHeight - trueWidth * 0.225,
    trueWidth * 0.45,
    trueWidth * 0.45
  );

  // Draw attacking board
  ctx.fillStyle = 'White';
  ctx.fillRect(
    centerWidth + trueWidth * 0.025,
    centerHeight - trueWidth * 0.225,
    trueWidth * 0.45,
    trueWidth * 0.45
  );

  // Test line
  ctx.fillStyle = 'red';
  ctx.fillRect(0, centerHeight, trueWidth, 1);

  // For later
  // Draw boxes
  // ctx.strokeStyle = 'skyblue';
  // ctx.lineWidth = 2;
  // for (let i = 180; i < 470; i += 30) {
  //   for (let j = 30; j <= 600; j += 30) {
  //     ctx.strokeRect(i, j, 30, 30);
  //   }
  // }
}

// http://en.battleship-game.org/
