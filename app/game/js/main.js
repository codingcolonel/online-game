// Main program for battleship game

// Fullscreen event listener
document.addEventListener('keyup', fullscreenToggle);
function fullscreenToggle(e) {
  if (e.key === 'f') {
    // Change width and height when switching in/out of fullscreen
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      trueHeight = Math.floor(screen.height * scale);
      trueWidth = Math.floor(screen.width * scale);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      trueHeight = Math.floor(window.innerHeight * scale);
      trueWidth = Math.floor(window.innerWidth * scale);
    }
    cnv.height = trueHeight;
    cnv.width = trueWidth;
    drawBoard();
  }
}

// Event Listener
// document.addEventListener('click', getMouseCoordinates);
// function getMouseCoordinates(e) {
//   if (
//     e.x >= defendingBoard.x &&
//     e.x <= defendingBoard.x + defendingBoard.sideLength &&
//     e.y >= defendingBoard.y &&
//     e.y <= defendingBoard.y + defendingBoard.sideLength
//   ) {
//     console.log('defend');
//   }
// }
