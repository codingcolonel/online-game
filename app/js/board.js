// Draw the board and update changes to canvas
import {
  nextLetter,
  addTileToArray,
  checkArrayPosition,
  findTileByCoordinates,
  updateShips,
} from "./functions.js";
import { playerShips, opponentShips } from "./ship.js";
import { gameManager } from "../main.js";

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
ctx.translate(0.5, 0.5);

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
  tileLength,
  defendingTransparency,
  attackingTransparency;

// Create ship images
let imageList = new Array(5);
imageList[0] = generateSource("/img/ships/Carrier");
imageList[1] = generateSource("/img/ships/Battleship");
imageList[2] = generateSource("/img/ships/Cruiser");
imageList[3] = generateSource("/img/ships/Submarine");
imageList[4] = generateSource("/img/ships/Destroyer");

// Colours class
class Colours {
  constructor(transparency) {
    this.white = `rgba(255, 255, 255, ${transparency})`;
    this.black = `rgba(0, 0, 0, ${transparency})`;
    this.navy = `rgba(0, 0, 128, ${transparency})`;
    this.red = `rgba(255, 0, 0, ${transparency})`;
    this.green = `rgba(0, 255, 0, ${transparency})`;
  }
}

function generateSource(source) {
  let result = [new Image(), new Image()];
  result[0].src = source + ".png";
  result[1].src = source + "R.png";
  return result;
}

// Draw the board on load
window.onload = function () {
  drawBoard(true);
  logger.generic(
    `Click on a ship to move it to a new location. &nbsp&nbsp&nbsp&nbsp&nbsp&nbspDouble click a ship to rotate it.`
  );
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
  if (gameManager.shipPlacing === true) {
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

  adjustTransparency();

  // Draw defending board
  singleBoard(
    defendingBoard,
    defendingTiles,
    "navy",
    reset,
    defendingTransparency
  );

  // Draw attacking board
  singleBoard(
    attackingBoard,
    attackingTiles,
    "red",
    reset,
    attackingTransparency
  );

  // Update canvas
  updateCanvas();
}

/**
 * This is a helper function, which draws either the attacking or the defending board
 *
 * @param {array} board This is the defending/attacking board array
 * @param {array} tiles This is the defending/attacking tiles array
 * @param {"navy"|"red"} colour This is either navy or red, the colour of the border
 * @param {boolean} resetArrays
 *
 * @returns {void} Does not return anything
 */
function singleBoard(board, tiles, colour, resetArrays, transparency) {
  // Color list
  let colourList = new Colours(transparency);

  // Draw board
  ctx.fillStyle = colourList["white"];
  ctx.fillRect(board.x, board.y, board.sideLength, board.sideLength);

  // Variables for drawing letters and numbers
  let counter = 1;
  let letter = "A";

  ctx.strokeStyle = colourList["black"];
  ctx.lineWidth = 2;
  let currentIndex = 0;
  for (
    let i = board.x;
    i < board.sideLength + board.x - 0.00000000001; // fix weird rounding error;
    i += board.sideLength / 10
  ) {
    // Draw numbers
    ctx.font = `${tileLength * 0.5}px Verdana, sans-serif`;
    ctx.fillStyle = colourList["white"];
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
        ctx.fillStyle = colourList["white"];
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
  ctx.strokeStyle = colourList[colour];
  ctx.lineWidth = 5;
  ctx.strokeRect(board.x, board.y, board.sideLength, board.sideLength);

  if (gameManager.shipPlacing === true) {
    // Draw reset button
    ctx.fillStyle = colourList[resetButton.colour];
    ctx.fillRect(resetButton.x, resetButton.y, buttons.length, buttons.height);

    // Draw reset button
    ctx.fillStyle = colourList[randomizeButton.colour];
    ctx.fillRect(
      randomizeButton.x,
      randomizeButton.y,
      buttons.length,
      buttons.height
    );

    // Draw reset button
    ctx.fillStyle = colourList[confirmationButton.colour];
    ctx.fillRect(
      confirmationButton.x,
      confirmationButton.y,
      buttons.length,
      buttons.height
    );

    // Reset Text
    ctx.font = `${tileLength * 0.5}px Verdana, sans-serif`;
    ctx.fillStyle = colourList["white"];
    ctx.fillText(
      "RESET",
      resetButton.x + buttons.length * 0.5,
      resetButton.y + tileLength * 0.7
    );

    // Random Text
    ctx.font = `${tileLength * 0.5}px Verdana, sans-serif`;
    ctx.fillStyle = colourList["white"];
    ctx.fillText(
      "RANDOM",
      randomizeButton.x + buttons.length * 0.5,
      randomizeButton.y + tileLength * 0.7
    );

    // Confirm Text
    ctx.font = `${tileLength * 0.5}px Verdana, sans-serif`;
    ctx.fillStyle = colourList["white"];
    ctx.fillText(
      "CONFIRM",
      confirmationButton.x + buttons.length * 0.5,
      confirmationButton.y + tileLength * 0.7
    );
  }
}

function updateCanvas() {
  // Get correct transparency
  adjustTransparency();
  let colourListDefending = new Colours(defendingTransparency);
  let colourListAttacking = new Colours(attackingTransparency);

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
        drawBlank(colourListDefending, tile);
        break;
      case "miss":
        drawMiss(colourListDefending, tile);
        break;
      case "ship":
        drawShip(colourListDefending, tile);
        break;
      case "hover":
        drawHover(tile);
        break;
      case "shiphit":
        drawHit(tile);
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
      drawMiss(colourListAttacking, tile);
    } else if (element.state === "hit") {
      // Draw red x to mark as hit
      drawIndicator("red", colourListAttacking, tile);
    } else if (element.state === "sunk") {
      drawIndicator("black", colourListAttacking, tile);
    }
  }

  opponentShips.forEach(({ rotation, position }, index) => {
    const tile = attackingTiles[position[0]];
    if (tile.state === "sunk") {
      const img = imageList[index][rotation];
      const length =
        (attackingBoard.sideLength / 10) * position.length -
        attackingBoard.sideLength / 10;

      ctx.drawImage(
        img,
        tile.x,
        tile.y,
        attackingBoard.sideLength / 10 + length * rotation,
        attackingBoard.sideLength / 10 + length * (1 - rotation)
      );
    }
  });

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

function drawBlank(colourList, tile) {
  ctx.fillStyle = colourList["white"];
  ctx.fillRect(
    tile.x1,
    tile.y1,
    attackingBoard.sideLength / 10,
    attackingBoard.sideLength / 10
  );
  ctx.strokeStyle = colourList["black"];
  ctx.lineWidth = 2;
  ctx.strokeRect(
    tile.x1,
    tile.y1,
    attackingBoard.sideLength / 10,
    attackingBoard.sideLength / 10
  );
}

function drawIndicator(color, colourList, tile) {
  // Draw red x to mark as hit
  ctx.strokeStyle = colourList[color];
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(tile.x1, tile.y1);
  ctx.lineTo(tile.x2, tile.y2);
  ctx.stroke();
  ctx.strokeStyle = colourList[color];
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

function drawMiss(colourList, tile) {
  ctx.fillStyle = colourList["black"];
  ctx.beginPath();
  ctx.arc(tile.centerX, tile.centerY, 5, 0, 2 * Math.PI);
  ctx.fill();
}

function drawShip(colourList, tile) {
  ctx.strokeStyle = colourList["black"];
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

function drawHit(tile) {
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    tile.x1,
    tile.y1,
    attackingBoard.sideLength / 10,
    attackingBoard.sideLength / 10
  );
  ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
  ctx.fillRect(
    tile.x1,
    tile.y1,
    defendingBoard.sideLength / 10,
    defendingBoard.sideLength / 10
  );
  // Add an outline to the blue squares to tell them apart (later)
}

function nextPhase() {
  gameManager.send({ type: "place", ships: playerShips });
}

function adjustTransparency() {
  defendingTransparency = 1;
  attackingTransparency = 1;
  // If it is the player's turn make defending board slightly transparent
  if (gameManager.shipPlacing === false) {
    if (gameManager.yourTurn === true) {
      defendingTransparency = 0.5;
    } else if (gameManager.yourTurn === false) {
      attackingTransparency = 0.5;
    }
  }
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
  nextPhase,
  ctx,
};

// http://en.battleship-game.org/
