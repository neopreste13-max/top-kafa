import Phaser from "phaser"
import { screenSize, gameConfig } from "./gameConfig.json"
import GameManager from "./GameManager"

export class GameUI {
  private scene: Phaser.Scene
  private scoreText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private goalText!: Phaser.GameObjects.Image
  private pauseText!: Phaser.GameObjects.Text
  
  // Super kick meters
  private player1SuperMeter!: Phaser.GameObjects.Graphics
  private player2SuperMeter!: Phaser.GameObjects.Graphics
  private player1SuperText!: Phaser.GameObjects.Text
  private player2SuperText!: Phaser.GameObjects.Text
  
  private player1Score = 0
  private player2Score = 0
  private gameTime = gameConfig.gameTime.value
  private isGamePaused = false
  private gameManager: GameManager
  
  private gameTimer!: Phaser.Time.TimerEvent

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.gameManager = GameManager.getInstance()
    
    // Get settings from game manager
    const settings = this.gameManager.getSettings()
    if (settings.matchType === "timed") {
      this.gameTime = settings.matchTime
    }
    
    this.createUI()
    this.startGameTimer()
  }

  private createUI(): void {
    // Create score display
    this.createScoreDisplay()
    
    // Create timer display
    this.createTimerDisplay()
    
    // Create match info display
    this.createMatchInfoDisplay()
    
    // Create goal celebration text (hidden initially)
    this.createGoalText()
    
    // Create controls display
    this.createControlsDisplay()
    
    // Create super kick meters
    this.createSuperKickMeters()
    
    // Create pause text (hidden initially)
    this.createPauseText()
  }

  private createMatchInfoDisplay(): void {
    const centerX = screenSize.width.value / 2
    const settings = this.gameManager.getSettings()
    
    let infoText = ""
    if (settings.matchType === "first_to_goals") {
      infoText = `First to ${settings.goalLimit} goals`
    }
    
    // Show tournament info if in tournament mode
    const tournamentState = this.gameManager.getTournamentState()
    if (tournamentState) {
      infoText = `Tournament Round ${tournamentState.currentRound}/${tournamentState.totalRounds} | P1: ${tournamentState.player1Wins} wins - P2: ${tournamentState.player2Wins} wins`
    }
    
    if (infoText) {
      this.scene.add.text(centerX, 155, infoText, {
        fontSize: "14px",
        fontFamily: "RetroPixel",
        color: "#aaaaaa",
        stroke: "#000000",
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(10)
    }
  }

  private createSuperKickMeters(): void {
    const meterY = screenSize.height.value - 80
    
    // Player 1 super meter (left side)
    this.player1SuperMeter = this.scene.add.graphics()
    this.player1SuperMeter.setDepth(50)
    
    this.player1SuperText = this.scene.add.text(150, meterY - 15, "SUPER", {
      fontSize: "10px",
      fontFamily: "RetroPixel",
      color: "#888888"
    }).setOrigin(0.5).setDepth(50)
    
    // Player 2 super meter (right side)
    this.player2SuperMeter = this.scene.add.graphics()
    this.player2SuperMeter.setDepth(50)
    
    this.player2SuperText = this.scene.add.text(screenSize.width.value - 150, meterY - 15, "SUPER", {
      fontSize: "10px",
      fontFamily: "RetroPixel",
      color: "#888888"
    }).setOrigin(0.5).setDepth(50)
    
    // Initial render
    this.updateSuperMeter(1, 0, 100)
    this.updateSuperMeter(2, 0, 100)
  }

  public updateSuperMeter(playerNum: 1 | 2, current: number, max: number): void {
    const meterWidth = 80
    const meterHeight = 8
    const meterY = screenSize.height.value - 80
    const meterX = playerNum === 1 ? 110 : screenSize.width.value - 190
    
    const meter = playerNum === 1 ? this.player1SuperMeter : this.player2SuperMeter
    const text = playerNum === 1 ? this.player1SuperText : this.player2SuperText
    
    meter.clear()
    
    // Background
    meter.fillStyle(0x333333, 0.8)
    meter.fillRoundedRect(meterX, meterY, meterWidth, meterHeight, 3)
    
    // Fill based on charge
    const fillWidth = (current / max) * meterWidth
    
    // Color based on fill level
    let color = 0x4488ff
    if (current >= max) {
      color = 0xff4400 // Ready to fire!
      text.setColor("#ff4400")
      text.setText("READY!")
    } else if (current >= max * 0.75) {
      color = 0xffaa00
      text.setColor("#ffaa00")
      text.setText("SUPER")
    } else {
      text.setColor("#888888")
      text.setText("SUPER")
    }
    
    meter.fillStyle(color, 1)
    meter.fillRoundedRect(meterX, meterY, fillWidth, meterHeight, 3)
    
    // Border
    meter.lineStyle(1, 0xffffff, 0.5)
    meter.strokeRoundedRect(meterX, meterY, meterWidth, meterHeight, 3)
  }

  private createScoreDisplay(): void {
    const centerX = screenSize.width.value / 2
    
    this.scoreText = this.scene.add.text(centerX, 60, "0 - 0", {
      fontSize: "48px",
      fontFamily: "Arial Black",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
      align: "center"
    }).setOrigin(0.5, 0.5)
    
    // Add background panel
    const scoreBg = this.scene.add.graphics()
    scoreBg.fillStyle(0x000066, 0.8)
    scoreBg.fillRoundedRect(centerX - 100, 30, 200, 60, 20)
    scoreBg.setDepth(-1)
    this.scoreText.setDepth(0)
  }

  private createTimerDisplay(): void {
    const centerX = screenSize.width.value / 2
    
    this.timerText = this.scene.add.text(centerX, 120, this.formatTime(this.gameTime), {
      fontSize: "36px",
      fontFamily: "Arial Black",
      color: "#ffff00",
      stroke: "#000000",
      strokeThickness: 3,
      align: "center"
    }).setOrigin(0.5, 0.5)
    
    // Add background panel
    const timerBg = this.scene.add.graphics()
    timerBg.fillStyle(0x006600, 0.8)
    timerBg.fillRoundedRect(centerX - 80, 95, 160, 50, 15)
    timerBg.setDepth(-1)
    this.timerText.setDepth(0)
  }

  private createGoalText(): void {
    const centerX = screenSize.width.value / 2
    const centerY = screenSize.height.value / 2
    
    this.goalText = this.scene.add.image(centerX, centerY, "goal_text")
    this.goalText.setScale(0.8)
    this.goalText.setVisible(false)
    this.goalText.setDepth(1000) // High depth to show above everything
  }

  private createControlsDisplay(): void {
    const leftX = 100
    const rightX = screenSize.width.value - 100
    const topY = 200 // Move controls to top of screen
    
    // Player 1 controls (Left side)
    const p1ControlsBg = this.scene.add.graphics()
    p1ControlsBg.fillStyle(0x004488, 0.7)
    p1ControlsBg.fillRoundedRect(20, topY - 40, 160, 100, 10)
    
    this.scene.add.text(leftX, topY - 40, "Player 1", {
      fontSize: "16px",
      fontFamily: "Arial",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
      align: "center"
    }).setOrigin(0.5, 0.5)
    
    this.scene.add.text(leftX, topY - 15, "W - Jump", {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5, 0.5)
    
    this.scene.add.text(leftX, topY, "A/D - Move", {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5, 0.5)
    
    this.scene.add.text(leftX, topY + 15, "S - Slide", {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5, 0.5)
    
    this.scene.add.text(leftX, topY + 30, "SPACE - Kick", {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5, 0.5)
    
    // Player 2 controls (Right side)
    const p2ControlsBg = this.scene.add.graphics()
    p2ControlsBg.fillStyle(0x884400, 0.7)
    p2ControlsBg.fillRoundedRect(rightX - 80, topY - 40, 160, 100, 10)
    
    this.scene.add.text(rightX, topY - 40, "Player 2", {
      fontSize: "16px",
      fontFamily: "Arial",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
      align: "center"
    }).setOrigin(0.5, 0.5)
    
    this.scene.add.text(rightX, topY - 15, "↑ - Jump", {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5, 0.5)
    
    this.scene.add.text(rightX, topY, "←/→ - Move", {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5, 0.5)
    
    this.scene.add.text(rightX, topY + 15, "↓ - Slide", {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5, 0.5)
    
    this.scene.add.text(rightX, topY + 30, "SHIFT - Kick", {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5, 0.5)
  }

  private createPauseText(): void {
    const centerX = screenSize.width.value / 2
    const centerY = screenSize.height.value / 2
    
    this.pauseText = this.scene.add.text(centerX, centerY - 50, "GAME PAUSED\nPress P to Continue", {
      fontSize: "32px",
      fontFamily: "Arial Black",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
      align: "center"
    }).setOrigin(0.5, 0.5)
    
    this.pauseText.setVisible(false)
    this.pauseText.setDepth(1000)
    
    // Add pause background
    const pauseBg = this.scene.add.graphics()
    pauseBg.fillStyle(0x000000, 0.7)
    pauseBg.fillRect(0, 0, screenSize.width.value, screenSize.height.value)
    pauseBg.setVisible(false)
    pauseBg.setDepth(999)
  }

  private startGameTimer(): void {
    console.log(`🕐 Starting game timer with ${this.gameTime} seconds`)
    this.gameTimer = this.scene.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      repeat: this.gameTime // Will repeat gameTime times, with updateTimer decrementing
    })
  }

  private updateTimer(): void {
    this.gameTime--
    console.log(`⏰ Timer update: ${this.gameTime} seconds remaining`)
    this.timerText.setText(this.formatTime(this.gameTime))
    
    // Change timer color when time is running out
    if (this.gameTime <= 10) {
      this.timerText.setColor("#ff0000")
      
      // Flash timer when very low
      if (this.gameTime <= 5) {
        this.scene.tweens.add({
          targets: this.timerText,
          alpha: 0.3,
          duration: 250,
          yoyo: true,
          repeat: 1
        })
      }
    } else if (this.gameTime <= 30) {
      this.timerText.setColor("#ff8800")
    }
    
    // End game when time reaches 0
    if (this.gameTime <= 0) {
      console.log("🏁 Game time ended! Triggering game end...")
      this.gameTimer.destroy() // Stop the timer
      this.onGameEnd()
    }
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  public updateScore(player1Score: number, player2Score: number): void {
    this.player1Score = player1Score
    this.player2Score = player2Score
    this.scoreText.setText(`${player1Score} - ${player2Score}`)
  }

  public showGoal(_scoringPlayer: 1 | 2): void {
    this.goalText.setVisible(true)
    
    // **SMALLER GOAL CELEBRATION ANIMATION**
    this.goalText.setScale(0.3) // Start bigger to avoid huge scaling
    this.scene.tweens.add({
      targets: this.goalText,
      scaleX: 0.8, // Much smaller final size
      scaleY: 0.8, // Much smaller final size
      duration: 300, // Faster animation
      ease: 'Back.easeOut'
    })
    
    // **REDUCED SCREEN SHAKE**
    this.scene.cameras.main.shake(200, 0.005) // Much smaller shake
    
    // Hide after celebration time
    this.scene.time.delayedCall(gameConfig.goalCelebrationTime.value * 1000, () => {
      this.goalText.setVisible(false)
      this.goalText.setScale(1) // Reset scale for next time
    })
  }

  public pauseGame(): void {
    this.isGamePaused = true
    this.pauseText.setVisible(true)
    this.gameTimer.paused = true
  }

  public resumeGame(): void {
    this.isGamePaused = false
    this.pauseText.setVisible(false)
    this.gameTimer.paused = false
  }

  public isPaused(): boolean {
    return this.isGamePaused
  }

  public getRemainingTime(): number {
    return this.gameTime
  }

  public getScore(): { player1: number, player2: number } {
    return { player1: this.player1Score, player2: this.player2Score }
  }

  private onGameEnd(): void {
    console.log("🏆 GameUI: Game ended!")
    console.log(`📊 Final Score: Player 1: ${this.player1Score}, Player 2: ${this.player2Score}`)
    
    const winner = this.player1Score > this.player2Score ? 1 : (this.player2Score > this.player1Score ? 2 : 0)
    console.log(`🏆 Winner: ${winner === 0 ? 'Draw' : `Player ${winner}`}`)
    
    // Emit game end event or call scene method
    this.scene.events.emit('gameEnd', {
      player1Score: this.player1Score,
      player2Score: this.player2Score,
      winner: winner
    })
  }

  public destroy(): void {
    if (this.gameTimer) {
      this.gameTimer.destroy()
    }
  }
}