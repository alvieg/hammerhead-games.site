let is_fullscreen = false;

window.openFullscreen = function() {
  let iframe = document.getElementById("iframe");
  let game = document.getElementById("game-area");
  let Button = document.getElementById("mobile-back-button");

  if (is_fullscreen) {
    // Exit fullscreen
    if (is_mobile_device()) {
      Button.style.display = "none";
      iframe.style.width = ""; // Reset width
      iframe.style.height = ""; // Reset height
      iframe.style.borderRadius = "";
      iframe.style.marginLeft = "";
      iframe.style.marginRight = "";
    }

    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }

    is_fullscreen = false;
  } else {
    // Enter fullscreen
    if (is_mobile_device()) {
      Button.style.display = "flex";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.borderRadius = "0";
      iframe.style.marginLeft = "0";
      iframe.style.marginRight = "0";

      if (game.requestFullscreen) {
        game.requestFullscreen();
      } else if (game.mozRequestFullScreen) {
        game.mozRequestFullScreen();
      } else if (game.webkitRequestFullscreen) {
        game.webkitRequestFullscreen();
      } else if (game.msRequestFullscreen) {
        game.msRequestFullscreen();
      }
    } else {
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      } else if (iframe.mozRequestFullScreen) {
        iframe.mozRequestFullScreen();
      } else if (iframe.webkitRequestFullscreen) {
        iframe.webkitRequestFullscreen();
      } else if (iframe.msRequestFullscreen) {
        iframe.msRequestFullscreen();
      }
    }

    is_fullscreen = true;
  }
};

function is_mobile_device() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
}
