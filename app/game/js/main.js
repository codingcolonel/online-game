// Main program for battleship game

// Import features from modules
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
import {
  findTileByCoordinates,
  checkArrayPosition,
  updateShips,
  createShip,
  moveShip,
  updateTiles,
} from "./functions.js";

// Initialize effect canvas
const effectCnv = document.getElementById("topCanvas");
effectCnv.width = screen.width;
effectCnv.height = screen.height;
const offCnv = effectCnv.transferControlToOffscreen();
const Drawing = new Worker("./js/drawWorker.js");
Drawing.postMessage({ type: "init", canvas: offCnv, scale }, [offCnv]);

function updateDim() {
  Drawing.postMessage({
    type: "dim",
    dim: { width: trueWidth(), height: trueHeight() },
  });
}

// When message is received set isYourTurn to true here
let isYourTurn = true;
drawBoard(true);
updateDim();

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
    updateDim();
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
  updateDim();
  drawBoard(false);
}

window.addEventListener("resize", function (e) {
  trueHeight(Math.floor(window.innerHeight * scale));
  trueWidth(Math.floor(window.innerWidth * scale));
  cnv.height = trueHeight();
  cnv.width = trueWidth();
  updateDim();
  drawBoard(false);
});

// Variable for function below
let clickedShip;
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
    let clickedDefendingTile = findTileByCoordinates(
      mouseX,
      mouseY,
      defendingTiles
    );
    // Get the index of the selected ship
    let shipElement = checkArrayPosition(
      clickedDefendingTile,
      playerShips,
      true
    );
    // If a ship is clicked for the first time or is being rotated act accordingly
    if (
      shipElement !== false &&
      (clickedShip !== shipElement || e.detail >= 2)
    ) {
      // If ship is clicked for the first time update clickedShip to current ship and update tiles
      if (e.detail === 1) {
        clickedShip = shipElement;
        updateTiles(shipElement, playerShips, defendingTiles);
        console.log(defendingTiles);
      } else {
        // Switch rotation from 1 to 0 and vice versa
        playerShips[shipElement].rotation =
          1 - playerShips[shipElement].rotation;

        // Update tiles after ship is rotated
        updateTiles(shipElement, playerShips, defendingTiles);
        console.log(defendingTiles);
        moveShip(
          shipElement,
          playerShips,
          defendingTiles,
          playerShips[shipElement].position[0]
        );
      }
      // Else move the selected ship to new position
    } else {
      moveShip(clickedShip, playerShips, defendingTiles, clickedDefendingTile);
    }
  } else if (
    mouseX >= attackingBoard.x &&
    mouseX <= attackingBoard.x + attackingBoard.sideLength &&
    mouseY >= attackingBoard.y &&
    mouseY <= attackingBoard.y + attackingBoard.sideLength
  ) {
    if (isYourTurn === true) {
      // Get index of clicked tile on attacking board
      let clickedAttackingTile = findTileByCoordinates(
        mouseX,
        mouseY,
        attackingTiles
      );
      // Change tile state based on outcome
      if (attackingTiles[clickedAttackingTile].state === "none") {
        let hitCheck = checkArrayPosition(clickedAttackingTile, opponentShips);
        console.log(hitCheck);
        if (hitCheck !== false) {
          attackingTiles[clickedAttackingTile].state = "hit";
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
          attackingTiles[clickedAttackingTile].state = "miss";
        }
        // Send message with tile index here
        // isYourTurn = false;
      }
    }
  }
  updateCanvas();
}
