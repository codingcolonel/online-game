// Main program for battleship game

// Fullscreen event listener
document.addEventListener('keyup', fullscreenToggle);
async function fullscreenToggle(e) {
  if (e.key === 'f') {
    // Change width and height when switching in/out of fullscreen
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      trueHeight = Math.floor(screen.height * scale);
      trueWidth = Math.floor(screen.width * scale);
    } else if (document.exitFullscreen) {
      await document.exitFullscreen();
      trueHeight = Math.floor(window.innerHeight * scale);
      trueWidth = Math.floor(window.innerWidth * scale);
    }
    cnv.height = trueHeight;
    cnv.width = trueWidth;
    drawBoard();
  }
}

document.addEventListener('fullscreenchange', fullscreenHandler);
async function fullscreenHandler() {
  // Update changes to the screen once the screen has transitioned in/out fullscreen
  if (!document.fullscreenElement) {
    trueHeight = Math.floor(window.innerHeight * scale);
    trueWidth = Math.floor(window.innerWidth * scale);
  }
  cnv.height = trueHeight;
  cnv.width = trueWidth;
  drawBoard();
}

// Event Listener
document.addEventListener('click', getMouseCoordinates);
function getMouseCoordinates(e) {
  console.log(e);
  console.log('x' + e.x + ' y' + e.y);

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
  } else if (
    mouseX >= attackingBoard.x &&
    mouseX <= attackingBoard.x + attackingBoard.sideLength &&
    mouseY >= attackingBoard.y &&
    mouseY <= attackingBoard.y + attackingBoard.sideLength
  ) {
    // Get index of clicked tile on attacking board
    console.log(
      attackingTiles[findTileByCoordinates(mouseX, mouseY, attackingTiles)]
    );

    for (let i = 0; i < opponentShips.length; i++) {
      const element = opponentShips[i];
    }
  }
}
