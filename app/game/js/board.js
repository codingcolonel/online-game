// Draw the board and update changes to canvas
import {
  nextLetter,
  addTileToArray,
  checkArrayPosition,
  findTileByCoordinates,
  updateShips,
} from './functions.js';
import { playerShips, opponentShips } from './ship.js';

// Set up canvas and 2d graphics content
let cnv = document.getElementById('mainCanvas');
let ctx = cnv.getContext('2d');
let scale = window.devicePixelRatio;
let TrueHeight = Math.floor(window.innerHeight * scale);
let TrueWidth = Math.floor(window.innerWidth * scale);
cnv.height = TrueHeight;
cnv.width = TrueWidth;

// Tile data arrays
let defendingTiles = [];
let attackingTiles = [];

// Board info variables
let defendingBoard, attackingBoard;

// Draw the board on load
window.onload = function () {
  drawBoard(true);
};

function drawBoard(reset) {
  // Reset tile array
  if (reset === true) {
    defendingTiles = [];
    attackingTiles = [];
  }

  // Update center values for drawing
  let centerWidth = TrueWidth / 2;
  let centerHeight = TrueHeight / 2;

  // Update board objects
  defendingBoard = {
    x:
      Math.round((centerWidth - TrueWidth * 0.025 - TrueWidth * 0.4) * 10) / 10, // x is offset by 2.5% of the width from the center to the left
    y: Math.round((centerHeight - TrueWidth * 0.2) * 10) / 10, // y is offset by 20% of the height from the center upwards
    sideLength: Math.round(TrueWidth * 0.4 * 10) / 10, // length is same as height (40% of screen)
  };
  attackingBoard = {
    x: Math.round((centerWidth + TrueWidth * 0.05) * 10) / 10, // x is offset by 2.5% of the width from the center to the right
    y: Math.round((centerHeight - TrueWidth * 0.2) * 10) / 10, // y is offset by 20% of the height from the center upwards
    sideLength: Math.round(TrueWidth * 0.4 * 10) / 10, // length is same as height (40% of screen)
  };

  // Draw Background
  ctx.fillStyle = 'dodgerblue';
  ctx.fillRect(0, 0, TrueWidth, TrueHeight);

  // Draw defending board
  singleBoard(defendingBoard, defendingTiles, 'Navy', reset);

  // Draw attacking board
  singleBoard(attackingBoard, attackingTiles, 'Red', reset);

  // Update canvas
  updateCanvas();
}

/**
 * This is a helper function, which draws either the attacking or the defending board
 *
 * @param {array} board This is the defending/attacking board array
 * @param {array} tiles This is the defending/attacking tiles array
 * @param {"Navy"|"Red"} colour This is either navy or red, the colour of the border
 * @param {boolean} resetArrays
 *
 * @returns {void} Does not return anything
 */
function singleBoard(board, tiles, colour, resetArrays) {
  // Draw board
  ctx.fillStyle = 'white';
  ctx.fillRect(board.x, board.y, board.sideLength, board.sideLength);

  // Variables for drawing letters and numbers
  let counter = 1;
  let letter = 'A';

  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  let currentIndex = 0;
  for (
    let i = board.x;
    i < board.sideLength + board.x - 0.00000000001; // fix weird rounding error;
    i += board.sideLength / 10
  ) {
    // Draw numbers
    ctx.font = '25px Verdana, sans-serif';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${counter}`,
      i + board.sideLength / 20,
      board.y - board.sideLength / 50
    );
    counter++;
    for (
      let j = board.y;
      j <= board.sideLength + board.y - 0.00000000001; // fix weird rounding error;
      j += board.sideLength / 10
    ) {
      // Draw tiles
      ctx.strokeRect(i, j, board.sideLength / 10, board.sideLength / 10);

      // Reset arrays if parameter is true
      if (resetArrays === true) {
        if (tiles.length < 100) {
          tiles.push(addTileToArray(i, j, 'none'));
        }
      } else {
        let state = tiles[currentIndex].state;
        tiles[currentIndex] = addTileToArray(i, j, state);
      }
      currentIndex++;

      if (letter !== 'END') {
        // Draw letters
        ctx.font = '25px Verdana, sans-serif';
        ctx.fillStyle = 'black';
        ctx.fillText(
          `${letter}`,
          board.x - board.sideLength / 25,
          j + board.sideLength / 15
        );
        letter = nextLetter(letter);
      }
    }
  }

  // Draw outline for defending board
  ctx.strokeStyle = colour;
  ctx.lineWidth = 5;
  ctx.strokeRect(board.x, board.y, board.sideLength, board.sideLength);
}

function updateCanvas() {
  // Update status of ship tiles
  updateShips(defendingTiles, playerShips);

  // Update Defending Board for any changes
  for (let i = 0; i < defendingTiles.length; i++) {
    const element = defendingTiles[i];
    const tile = {
      x1: element.x,
      y1: element.y,
      x2: element.x + defendingBoard.sideLength / 10,
      y2: element.y + defendingBoard.sideLength / 10,
      centerX: element.x + defendingBoard.sideLength / 20,
      centerY: element.y + defendingBoard.sideLength / 20,
    };
    if (element.state === 'none') {
      drawBlank(tile);
    } else if (element.state === 'miss') {
      drawMiss(tile);
    } else if (element.state === 'ship') {
      drawShip(tile);
    } else if (element.state === 'shiphit') {
      // drawShip(tile)
      // drawX('red', tile)
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
      centerX: element.x + attackingBoard.sideLength / 20,
      centerY: element.y + attackingBoard.sideLength / 20,
    };
    if (element.state === 'miss') {
      // Draw dot to mark as a miss
      drawMiss(tile);
    } else if (element.state === 'hit') {
      // Draw red x to mark as hit
      drawX('red', tile);
    } else if (element.state === 'sunk') {
      drawX('black', tile);
    }
  }
}

function drawBlank(tile) {
  ctx.fillStyle = 'white';
  ctx.fillRect(
    tile.x1,
    tile.y1,
    attackingBoard.sideLength / 10,
    attackingBoard.sideLength / 10
  );
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.strokeRect(
    tile.x1,
    tile.y1,
    attackingBoard.sideLength / 10,
    attackingBoard.sideLength / 10
  );
}

function drawX(color, tile) {
  // Draw red x to mark as hit
  ctx.strokeStyle = `${color}`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(tile.x1, tile.y1);
  ctx.lineTo(tile.x2, tile.y2);
  ctx.stroke();
  ctx.strokeStyle = `${color}`;
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

function drawMiss(tile) {
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(tile.centerX, tile.centerY, 5, 0, 2 * Math.PI);
  ctx.fill();
}

function drawShip(tile) {
  ctx.fillStyle = 'blue';
  ctx.fillRect(
    tile.x1,
    tile.y1,
    defendingBoard.sideLength / 10,
    defendingBoard.sideLength / 10
  );
  // Add an outline to the blue squares to tell them apart (later)
}

function trueWidth(input) {
  if (input) TrueWidth = input;
  else return TrueWidth;
}

function trueHeight(input) {
  if (input) TrueHeight = input;
  else return TrueHeight;
}

export {
  drawBoard,
  updateCanvas,
  scale,
  defendingBoard,
  attackingBoard,
  defendingTiles,
  attackingTiles,
  cnv,
  trueWidth,
  trueHeight,
};

// http://en.battleship-game.org/
