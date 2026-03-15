import Phaser from "phaser"
import LoadingScene from "./scenes/LoadingScene"
import StartScene from "./scenes/StartScene"
import GameScene from "./scenes/GameScene"
import VictoryScene from "./scenes/VictoryScene"
import TutorialScene from "./scenes/TutorialScene"
import { screenSize, debugConfig, renderConfig } from "./gameConfig.json"

// Global error handler for debugging mobile issues
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Global error:", message, source, lineno, colno, error)
  // Show error on screen for mobile debugging
  const errorDiv = document.createElement('div')
  errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;padding:10px;z-index:9999;font-size:12px;'
  errorDiv.textContent = `Error: ${message} at ${source}:${lineno}`
  document.body.appendChild(errorDiv)
  return false
}

// Unhandled promise rejection handler
window.onunhandledrejection = function(event) {
  console.error("Unhandled promise rejection:", event.reason)
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: screenSize.width.value,
  height: screenSize.height.value,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  loader: {
    // Disable Phaser's default loading screen to avoid delays
    crossOrigin: "anonymous",
  },
  dom: {
    createContainer: true,
  },
  input: {
    activePointers: 3, // Support multi-touch
    touch: {
      capture: true
    }
  },
  physics: {
    default: "arcade",
    arcade: {
      fps: 60, // Standard 60 FPS to match display refresh rate
      debug: debugConfig.debug.value,
      debugShowBody: debugConfig.debugShowBody.value,
      debugShowStaticBody: debugConfig.debugShowStaticBody.value,
      debugShowVelocity: debugConfig.debugShowVelocity.value,
      gravity: { x: 0, y: 0 }, // No world gravity - players handle their own
      timeScale: 1.0, // Ensure consistent time scaling
      overlapBias: 4, // Reduce overlap detection sensitivity
      tileBias: 16, // Improve tile collision stability
    },
  },
  pixelArt: renderConfig.pixelArt.value,
  scene: [LoadingScene, StartScene, GameScene, VictoryScene, TutorialScene],
  backgroundColor: "#000000", // Black background to avoid blue flash
}

export default new Phaser.Game(config)