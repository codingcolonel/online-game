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

let activeEmitters = new Array();

addEventListener("message", receiveMessage);

/**
 * Event Listener, which listens for messages posted to this worker
 * @param {MessageEvent} msg A message
 * @returns {void} Does not return anything
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
      newParticle(data);
      break;
    case "killParticle":
      kill(data.name);
      break;
  }
}

/**
 * Initializes drawing web worker settings
 * @param {{canvas: OffscreenCanvas}} data Data object
 * @returns {void} Does not return anything
 */
function init(data) {
  cnv = data.canvas;
  ctx = cnv.getContext("2d");
  requestAnimationFrame(draw);
}

/**
 * Alter dimensions of recorded width and height, as well as canvas dimensions
 * @param {Object} data
 * @param {{width:number, height:number}} data.dim Dimensions of the active screen
 * @returns {void} Does not return anything
 */
function dimensions(data) {
  cnv.width = Math.floor(data.dim.width);
  cnv.height = Math.floor(data.dim.height);
  TrueWidth = data.dim.width;
  TrueHeight = data.dim.height;
  defBoard = getBoard("defending");
  attBoard = getBoard("attacking");
}

/**
 * Update and draw particles
 * @returns {void} Does not return anything
 */
function draw() {
  // Calculate DeltaTime
  let currTime = Date.now();
  let deltaTime = currTime - prevTime;
  prevTime = currTime;

  // Clear canvas
  ctx.clearRect(0, 0, cnv.width, cnv.height);

  // Update and draw each emitter
  activeEmitters.forEach((emitter) => {
    emitter.update(deltaTime);
    emitter.draw();
  });

  requestAnimationFrame(draw);
}

/**
 * Create a new particle emitter
 * @param {Object} data Data object
 * @param {string} data.name Particle name
 * @param {number} data.time Particle spawn time (s)
 * @param {number} data.frequency Particle spawn frequency (hz)
 * @param {number} data.max Max number of particles
 * @param {{x:number, y:number}} data.position Particle spawn position
 * @param {boolean} [data.under] Spawn particles under or over existing particles? (Optional)
 * @returns {void} Does not return anything
 */
function newParticle(data) {
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
}

/**
 * Kills ALL particle emitters matching a specific name
 * @param {string} killName Name of particle to kill
 * @returns {void} Does not return anything
 */
function kill(killName) {
  for (let index = activeEmitters.length; index > 0; index--) {
    const emitter = activeEmitters[index - 1];
    if (emitter.name === killName) emitter.kill();
  }
}

/**
 * Get the dimensions of one of the two boards
 * @param {"defending"|"attacking"} boardName Name of board to fetch
 * @returns {{x:number, y:number, sideLength:number}} Returns the x, y, and sidelength of the requested board
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
