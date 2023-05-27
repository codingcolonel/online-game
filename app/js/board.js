// Draw the board and update changes to canvas
import {
  nextLetter,
  addTileToArray,
  checkArrayPosition,
  findTileByCoordinates,
  updateShips,
} from "./functions.js";
import { playerShips, opponentShips } from "./ship.js";

// Set up canvas and 2d graphics content
/** @type {HTMLCanvasElement} */
let cnv = document.getElementById("mainCanvas");
/** @type {CanvasRenderingContext2D} */
let ctx = cnv.getContext("2d");
let scale = window.devicePixelRatio;
let TrueHeight = Math.floor(window.innerHeight * scale);
let TrueWidth = Math.floor(window.innerWidth * scale);
cnv.height = TrueHeight;
cnv.width = TrueWidth;

// Tile data arrays
let defendingTiles = [];
let attackingTiles = [];

// Board info variables
let defendingBoard,
  attackingBoard,
  buttons,
  resetButton,
  randomizeButton,
  confirmationButton,
  tileLength;

// Variable used for determining on the phase of the game
let shipPlacingPhase = true;

// Create ship images
let imageList = new Array(5);
imageList[0] = generateSource("/img/ships/Carrier");
imageList[1] = generateSource("/img/ships/Battleship");
imageList[2] = generateSource("/img/ships/Cruiser");
imageList[3] = generateSource("/img/ships/Submarine");
imageList[4] = generateSource("/img/ships/Destroyer");

function generateSource(source) {
  let result = [new Image(), new Image()];
  result[0].src = source + ".png";
  result[1].src = source + "R.png";
  return result;
}

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

  tileLength = defendingBoard.sideLength / 10;

  // Update button objects
  if (shipPlacingPhase === true) {
    // For all three buttons
    buttons = {
      length: Math.round(tileLength * 3 * 10) / 10, // length is 3 tiles wide
      height: Math.round(tileLength * 10) / 10, // height is 1 tile
    };

    resetButton = {
      x: defendingBoard.x, // x is same as defending board
      y: Math.round((defendingBoard.y + tileLength * 10.5) * 10) / 10, // y is placed half a tile below the board
      colour: "navy",
    };
    randomizeButton = {
      x: Math.round((defendingBoard.x + tileLength * 3.5) * 10) / 10, // x is offset by 3.5 tiles to the right
      y: resetButton.y, // y is is the same as reset button
      colour: "navy",
    };

    confirmationButton = {
      x: Math.round((defendingBoard.x + tileLength * 7) * 10) / 10, // x is offset by 7 tiles to the right
      y: resetButton.y, // y is is the same as reset button
      colour: "green",
    };
  }

  // Draw Background
  ctx.clearRect(0, 0, TrueWidth, TrueHeight);

  // Draw defending board
  singleBoard(defendingBoard, defendingTiles, "Navy", reset);

  // Draw attacking board
  singleBoard(attackingBoard, attackingTiles, "Red", reset);

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
  ctx.fillStyle = "white";
  ctx.fillRect(board.x, board.y, board.sideLength, board.sideLength);

  // Variables for drawing letters and numbers
  let counter = 1;
  let letter = "A";

  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  let currentIndex = 0;
  for (
    let i = board.x;
    i < board.sideLength + board.x - 0.00000000001; // fix weird rounding error;
    i += board.sideLength / 10
  ) {
    // Draw numbers
    ctx.font = `${tileLength * 0.5}px Verdana, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
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
          tiles.push(addTileToArray(i, j, "none"));
        }
      } else {
        let state = tiles[currentIndex].state;
        tiles[currentIndex] = addTileToArray(i, j, state);
      }
      currentIndex++;

      if (letter !== "END") {
        // Draw letters
        ctx.font = `${tileLength * 0.5}px Verdana, sans-serif`;
        ctx.fillStyle = "#ffffff";
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

  if (shipPlacingPhase === true) {
    // Draw reset button
    ctx.fillStyle = resetButton.colour;
    ctx.fillRect(resetButton.x, resetButton.y, buttons.length, buttons.height);

    // Draw reset button
    ctx.fillStyle = randomizeButton.colour;
    ctx.fillRect(
      randomizeButton.x,
      randomizeButton.y,
      buttons.length,
      buttons.height
    );

    // Draw reset button
    ctx.fillStyle = confirmationButton.colour;
    ctx.fillRect(
      confirmationButton.x,
      confirmationButton.y,
      buttons.length,
      buttons.height
    );

    // Reset Text
    ctx.font = `${tileLength * 0.5}px Verdana, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      "RESET",
      resetButton.x + buttons.length * 0.5,
      resetButton.y + tileLength * 0.7
    );

    // Random Text
    ctx.font = `${tileLength * 0.5}px Verdana, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      "RANDOM",
      randomizeButton.x + buttons.length * 0.5,
      randomizeButton.y + tileLength * 0.7
    );

    // Confirm Text
    ctx.font = `${tileLength * 0.5}px Verdana, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      "CONFIRM",
      confirmationButton.x + buttons.length * 0.5,
      confirmationButton.y + tileLength * 0.7
    );
  }
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
    switch (element.state) {
      case "none":
        drawBlank(tile);
        break;
      case "miss":
        drawMiss(tile);
        break;
      case "ship":
        drawShip(tile);
        break;
      case "hover":
        drawHover(tile);
        break;
      case "shiphit":
        // drawShip(tile)
        // drawX('red', tile)
        break;
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
    if (element.state === "miss") {
      // Draw dot to mark as a miss
      drawMiss(tile);
    } else if (element.state === "hit") {
      // Draw red x to mark as hit
      drawX("red", tile);
    } else if (element.state === "sunk") {
      drawX("black", tile);
    }
  }

  playerShips.forEach(({ rotation, position }, index) => {
    const tile = defendingTiles[position[0]];
    const img = imageList[index][rotation];
    const length =
      (defendingBoard.sideLength / 10) * position.length -
      defendingBoard.sideLength / 10;

    ctx.drawImage(
      img,
      tile.x,
      tile.y,
      defendingBoard.sideLength / 10 + length * rotation,
      defendingBoard.sideLength / 10 + length * (1 - rotation)
    );
  });
}

function drawBlank(tile) {
  ctx.fillStyle = "white";
  ctx.fillRect(
    tile.x1,
    tile.y1,
    attackingBoard.sideLength / 10,
    attackingBoard.sideLength / 10
  );
  ctx.strokeStyle = "black";
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
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(tile.centerX, tile.centerY, 5, 0, 2 * Math.PI);
  ctx.fill();
}

function drawShip(tile) {
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    tile.x1,
    tile.y1,
    attackingBoard.sideLength / 10,
    attackingBoard.sideLength / 10
  );
  ctx.fillStyle = "rgba(0, 0, 255, 0.6)";
  ctx.fillRect(
    tile.x1,
    tile.y1,
    defendingBoard.sideLength / 10,
    defendingBoard.sideLength / 10
  );
  // Add an outline to the blue squares to tell them apart (later)
}

function drawHover(tile) {
  ctx.fillStyle = "white";
  ctx.fillRect(
    tile.x1,
    tile.y1,
    defendingBoard.sideLength / 10,
    defendingBoard.sideLength / 10
  );

  ctx.fillStyle = "rgba(0, 0, 255, 0.3)";
  ctx.fillRect(
    tile.x1,
    tile.y1,
    defendingBoard.sideLength / 10,
    defendingBoard.sideLength / 10
  );
}

function nextPhase() {
  shipPlacingPhase = false;
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
  resetButton,
  randomizeButton,
  confirmationButton,
  buttons,
  shipPlacingPhase,
  nextPhase,
  ctx,
};

// http://en.battleship-game.org/
