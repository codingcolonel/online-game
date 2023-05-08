// Set up canvas and 2d graphics content
// Change size to fullscreen
let cnv = document.querySelector('canvas');
let ctx = cnv.getContext('2d');
let scale = window.devicePixelRatio;
let trueHeight = Math.floor(screen.height * scale);
let trueWidth = Math.floor(screen.width * scale);
let centerWidth = trueWidth / 2;
let centerHeight = trueHeight / 2;
cnv.height = trueHeight;
cnv.width = trueWidth;

// Draw Backround
ctx.fillStyle = 'Navy';
ctx.fillRect(0, 0, trueWidth, trueHeight);

// Draw defending board
ctx.fillStyle = 'White';
ctx.fillRect(
  centerWidth - 150 - trueWidth * 0.4,
  centerHeight - trueHeight * 0.25,
  trueWidth * 0.33,
  trueHeight * 0.85
);

// Draw attacking board
ctx.fillStyle = 'White';
ctx.fillRect(
  centerWidth + 150,
  centerHeight - trueHeight * 0.25,
  trueWidth * 0.33,
  trueHeight * 0.85
);

// Draw boxes
// ctx.strokeStyle = 'skyblue';
// ctx.lineWidth = 2;
// for (let i = 180; i < 470; i += 30) {
//   for (let j = 30; j <= 600; j += 30) {
//     ctx.strokeRect(i, j, 30, 30);
//   }
// }

// http://en.battleship-game.org/
