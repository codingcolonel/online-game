// Main program for battleship game

// Import features from ship module
import { playerShips, opponentShips } from "./ship.js";
import {
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
} from "./board.js";
import { findTileByCoordinates, checkArrayPosition } from "./functions.js";

// When message is received set isYourTurn to true here
let isYourTurn = true;
drawBoard(true);

// Fullscreen event listener
document.addEventListener("keyup", fullscreenToggle);
async function fullscreenToggle(e) {
  if (e.key === "f") {
    // Change width and height when switching in/out of fullscreen
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      trueHeight(Math.floor(screen.height * scale));
      trueWidth(Math.floor(screen.width * scale));
    } else if (document.exitFullscreen) {
      await document.exitFullscreen();
      trueHeight(Math.floor(window.innerHeight * scale));
      trueWidth(Math.floor(window.innerWidth * scale));
    }
    cnv.height = trueHeight();
    cnv.width = trueWidth();
    drawBoard(false);
  }
}

document.addEventListener("fullscreenchange", fullscreenHandler);
async function fullscreenHandler() {
  // Update changes to the screen once the screen has transitioned in/out fullscreen
  if (!document.fullscreenElement) {
    trueHeight(Math.floor(window.innerHeight * scale));
    trueWidth(Math.floor(window.innerWidth * scale));
  }
  cnv.height = trueHeight();
  cnv.width = trueWidth();
  drawBoard(false);
}

window.addEventListener("resize", function (e) {
  if (!document.fullscreenElement) {
    trueHeight(Math.floor(window.innerHeight * scale));
    trueWidth(Math.floor(window.innerWidth * scale));
  }
  cnv.height = trueHeight();
  cnv.width = trueWidth();
  drawBoard(false);
});

// Event Listener
document.addEventListener("click", getMouseCoordinates);
function getMouseCoordinates(e) {
  // console.log(e);
  // console.log('x' + e.x + ' y' + e.y);

  // Adjust mouse x and y to pixel ratio
  let mouseX = e.x * scale;
  let mouseY = e.y * scale;

  if (
    mouseX >= defendingBoard.x &&
    mouseX <= defendingBoard.x + defendingBoard.sideLength &&
    mouseY >= defendingBoard.y &&
    mouseY <= defendingBoard.y + defendingBoard.sideLength
  ) {
    // Get index of clicked tile on defending board
    console.log(
      defendingTiles[findTileByCoordinates(mouseX, mouseY, defendingTiles)]
    );

    // Update status of ship tiles
    for (let i = 0; i < defendingTiles.length; i++) {
      const shipTile = checkArrayPosition(i, playerShips);
      if (shipTile !== false) {
        shipTile.position.forEach((element) => {
          defendingTiles[element].state = "ship";
        });
      }
    }
    console.log(defendingTiles);
  } else if (
    mouseX >= attackingBoard.x &&
    mouseX <= attackingBoard.x + attackingBoard.sideLength &&
    mouseY >= attackingBoard.y &&
    mouseY <= attackingBoard.y + attackingBoard.sideLength
  ) {
    if (isYourTurn === true) {
      // Get index of clicked tile on attacking board
      let clickedTile = findTileByCoordinates(mouseX, mouseY, attackingTiles);
      if (attackingTiles[clickedTile].state === "none") {
        let hitCheck = checkArrayPosition(clickedTile, opponentShips);
        if (hitCheck !== false) {
          attackingTiles[clickedTile].state = "hit";
          if (
            hitCheck.position.every(
              (index) => attackingTiles[index].state === "hit"
            ) === true
          ) {
            for (let i = 0; i < hitCheck.position.length; i++) {
              const element = hitCheck.position[i];
              attackingTiles[element].state = "sunk";
            }
          }
        } else {
          attackingTiles[clickedTile].state = "miss";
        }
        // Send message with tile index here
        // isYourTurn = false;
      }
    }
  }
  updateCanvas();
}
