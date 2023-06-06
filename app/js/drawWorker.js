// * Web Worker to draw Particles on a secondary canvas *

let defBoard = { x: undefined, y: undefined, sideLength: undefined };
let attBoard = { x: undefined, y: undefined, sideLength: undefined };

// Need to use importScripts instead of import, for Firefox compatability
importScripts("./particles.js");

/** @type {OffscreenCanvas} */
let cnv;
/** @type {OffscreenCanvasRenderingContext2D} */
let ctx;

let prevTime = Date.now();

let TrueWidth;
let TrueHeight;
let scale;

let activeEmitters = new Array();

addEventListener("message", receiveMessage);

/**
 * Event Listener, which listens for messages posted to this worker
 * @param {MessageEvent} msg A message
 * @returns {void}
 */
function receiveMessage(msg) {
  let data = msg.data;

  switch (data.type) {
    case "init":
      init(data);
      break;
    case "dim":
      dimensions(data);
      break;
    case "particle":
      activeEmitters.push(
        new ParticleEmitter(
          data.name,
          data.time,
          data.frequency,
          data.max,
          data.position,
          ctx,
          activeEmitters,
          data.hasOwnProperty("under") ? data.under : false
        )
      );
      break;
    case "killParticle":
      kill(data.name);
      break;
  }
}

function init(data) {
  cnv = data.canvas;
  ctx = cnv.getContext("2d");
  scale = data.scale;
  requestAnimationFrame(draw);
}

function dimensions(data) {
  cnv.width = Math.floor(data.dim.width);
  cnv.height = Math.floor(data.dim.height);
  TrueWidth = data.dim.width;
  TrueHeight = data.dim.height;
  defBoard = getBoard("defending");
  attBoard = getBoard("attacking");
}

function draw() {
  // Calculate DeltaTime
  let currTime = Date.now();
  let deltaTime = currTime - prevTime;
  prevTime = currTime;

  ctx.clearRect(0, 0, cnv.width, cnv.height);

  activeEmitters.forEach((emitter) => {
    emitter.update(deltaTime);
    emitter.draw();
  });
  requestAnimationFrame(draw);
}

function kill(killName) {
  for (let index = activeEmitters.length; index > 0; index--) {
    const emitter = activeEmitters[index - 1];
    if (emitter.name === killName) emitter.kill();
  }
}

/**
 * @param {"defending"|"attacking"} boardName
 * @returns {object}
 */
function getBoard(boardName) {
  let centerWidth = TrueWidth / 2;
  let centerHeight = TrueHeight / 2;

  let board;

  if (boardName === "defending")
    board = {
      x:
        Math.round((centerWidth - TrueWidth * 0.025 - TrueWidth * 0.4) * 10) /
        10, // x is offset by 2.5% of the width from the center to the left
      y: Math.round((centerHeight - TrueWidth * 0.2) * 10) / 10, // y is offset by 20% of the height from the center upwards
      sideLength: Math.round(TrueWidth * 0.4 * 10) / 10, // length is same as height (40% of screen)
    };
  if (boardName === "attacking")
    board = {
      x: Math.round((centerWidth + TrueWidth * 0.05) * 10) / 10, // x is offset by 2.5% of the width from the center to the right
      y: Math.round((centerHeight - TrueWidth * 0.2) * 10) / 10, // y is offset by 20% of the height from the center upwards
      sideLength: Math.round(TrueWidth * 0.4 * 10) / 10, // length is same as height (40% of screen)
    };

  return board;
}
