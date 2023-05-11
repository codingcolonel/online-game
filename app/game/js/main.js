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
