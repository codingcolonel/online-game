/** @type {OffscreenCanvas} */
let cnv;
/** @type {OffscreenCanvasRenderingContext2D} */
let ctx;

let prevTime = +new Date();

let scale;

let TrueWidth;
let TrueHeight;

addEventListener('message', receiveMessage);

function receiveMessage(msg) {
  let data = msg.data;

  switch (data.type) {
    case 'init':
      init(data);
      break;
    case 'dim':
      dimensions(data);
      break;
  }
}

function init(data) {
  cnv = data.canvas;
  ctx = cnv.getContext('2d');
  scale = data.scale;
  requestAnimationFrame(draw);
}

function dimensions(data) {
  cnv.width = Math.floor(data.dim.width);
  cnv.height = Math.floor(data.dim.height);
  TrueWidth = data.dim.width;
  TrueHeight = data.dim.height;
}

function draw() {
  // Calculate DeltaTime
  // let currTime = +new Date();
  // let deltaTime = currTime - prevTime;
  // prevTime = currTime;
  //
  // Not really sure what this is for but it covers the whole defending board so I've commented it out for now
  // drawBoard();
  //
  // Request next frame
  // requestAnimationFrame(draw);
}

function drawBoard() {
  let centerWidth = TrueWidth / 2;
  let centerHeight = TrueHeight / 2;

  board = {
    x:
      Math.round((centerWidth - TrueWidth * 0.025 - TrueWidth * 0.4) * 10) / 10, // x is offset by 2.5% of the width from the center to the left
    y: Math.round((centerHeight - TrueWidth * 0.2) * 10) / 10, // y is offset by 20% of the height from the center upwards
    sideLength: Math.round(TrueWidth * 0.4 * 10) / 10, // length is same as height (40% of screen)
  };
  ctx.fillStyle = 'white';
  ctx.fillRect(board.x, board.y, board.sideLength, board.sideLength);
}
