// Main program for battleship game

// Import features from modules
import { playerShips, opponentShips } from './ship.js';
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
} from './board.js';
import {
  findTileByCoordinates,
  checkArrayPosition,
  updateShips,
  createShip,
  moveShip,
} from './functions.js';

// Initialize effect canvas
const effectCnv = document.getElementById('topCanvas');
effectCnv.width = screen.width;
effectCnv.height = screen.height;
const offCnv = effectCnv.transferControlToOffscreen();
const Drawing = new Worker('./js/drawWorker.js');
Drawing.postMessage({ type: 'init', canvas: offCnv, scale }, [offCnv]);

function updateDim() {
  Drawing.postMessage({
    type: 'dim',
    dim: { width: trueWidth(), height: trueHeight() },
  });
}

// When message is received set isYourTurn to true here
let isYourTurn = true;
drawBoard(true);
updateDim();

// Fullscreen event listener
document.addEventListener('keyup', fullscreenToggle);
async function fullscreenToggle(e) {
  if (e.key === 'f') {
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

document.addEventListener('fullscreenchange', fullscreenHandler);
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

window.addEventListener('resize', function (e) {
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
document.addEventListener('click', getMouseCoordinates);
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
    let shipElement = checkArrayPosition(
      clickedDefendingTile,
      playerShips,
      true
    );
    if (shipElement !== false) {
      if (e.detail === 1) {
        clickedShip = shipElement;
      } else {
        // Switch rotation from 1 to 0 and vice versa
        playerShips[shipElement].rotation =
          1 - playerShips[shipElement].rotation;
        let isValid = moveShip(
          shipElement,
          playerShips,
          playerShips[shipElement].position[0]
        );
        if (isValid === false) {
          // Switch rotation back on failed attempt
          playerShips[shipElement].rotation =
            1 - playerShips[shipElement].rotation;
        }

        console.log(playerShips[shipElement]);
      }
    } else {
      moveShip(clickedShip, playerShips, clickedDefendingTile);
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
      if (attackingTiles[clickedAttackingTile].state === 'none') {
        let hitCheck = checkArrayPosition(clickedAttackingTile, opponentShips);
        console.log(hitCheck);
        if (hitCheck !== false) {
          attackingTiles[clickedAttackingTile].state = 'hit';
          if (
            hitCheck.position.every(
              (index) => attackingTiles[index].state === 'hit'
            ) === true
          ) {
            for (let i = 0; i < hitCheck.position.length; i++) {
              const element = hitCheck.position[i];
              attackingTiles[element].state = 'sunk';
            }
          }
        } else {
          attackingTiles[clickedAttackingTile].state = 'miss';
        }
        // Send message with tile index here
        // isYourTurn = false;
      }
    }
  }
  updateCanvas();
}
