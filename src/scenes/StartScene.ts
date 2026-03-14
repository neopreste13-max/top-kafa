import Phaser from "phaser"
import { screenSize, audioConfig } from "../gameConfig.json"
import GameManager from "../GameManager"

export default class StartScene extends Phaser.Scene {
  private backgroundMusic!: Phaser.Sound.BaseSound
  private buttonClickSound!: Phaser.Sound.BaseSound
  private gameStartSound!: Phaser.Sound.BaseSound
  private gameTitle!: Phaser.GameObjects.Image
  private background!: Phaser.GameObjects.Image
  private gameManager: GameManager
  
  // Menu state
  private currentMenu: "main" | "mode_select" | "settings" | "difficulty" | "match_type" = "main"
  private menuContainer!: Phaser.GameObjects.Container
  
  constructor() {
    super({ key: "StartScene" })
    this.gameManager = GameManager.getInstance()
  }

  preload(): void {
    console.log("🔄 START SCENE: Assets already loaded")
  }

  create(): void {
    this.createBackground()
    this.createTitle()
    this.setupAudio()
    this.setupInput()
    this.showMainMenu()
    
    console.log("🎮 START SCENE: Created successfully")
  }

  private createBackground(): void {
    const centerX = screenSize.width.value / 2
    const centerY = screenSize.height.value / 2
    
    this.background = this.add.image(centerX, centerY, "clean_soccer_field_background")
    const scaleX = screenSize.width.value / this.background.width
    const scaleY = screenSize.height.value / this.background.height
    const scale = Math.max(scaleX, scaleY)
    this.background.setScale(scale)
    this.background.setDepth(-10)
    
    const overlay = this.add.rectangle(centerX, centerY, screenSize.width.value, screenSize.height.value, 0x000000, 0.4)
    overlay.setDepth(-5)
  }

  private createTitle(): void {
    const centerX = screenSize.width.value / 2
    
    this.gameTitle = this.add.image(centerX, 120, "game_title")
    const maxTitleWidth = screenSize.width.value * 0.9
    const maxTitleHeight = 200
    const scaleByWidth = maxTitleWidth / this.gameTitle.width
    const scaleByHeight = maxTitleHeight / this.gameTitle.height
    const finalScale = Math.min(scaleByWidth, scaleByHeight)
    this.gameTitle.setScale(finalScale)
    this.gameTitle.setDepth(10)
    
    this.tweens.add({
      targets: this.gameTitle,
      scaleX: this.gameTitle.scaleX * 1.05,
      scaleY: this.gameTitle.scaleY * 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private showMainMenu(): void {
    this.clearMenu()
    this.currentMenu = "main"
    
    const centerX = screenSize.width.value / 2
    const startY = 280
    const spacing = 70
    
    this.menuContainer = this.add.container(0, 0)
    this.menuContainer.setDepth(20)
    
    // VS Player button
    const vsPlayerBtn = this.createMenuButton(centerX, startY, "⚔️  VS PLAYER", () => {
      this.gameManager.setGameMode("1v1")
      this.showMatchTypeMenu()
    })
    
    // VS AI button
    const vsAIBtn = this.createMenuButton(centerX, startY + spacing, "🤖  VS AI", () => {
      this.gameManager.setGameMode("1vAI")
      this.showDifficultyMenu()
    })
    
    // Tournament button
    const tournamentBtn = this.createMenuButton(centerX, startY + spacing * 2, "🏆  TOURNAMENT", () => {
      this.showTournamentSetup()
    })
    
    // Settings button
    const settingsBtn = this.createMenuButton(centerX, startY + spacing * 3, "⚙️  SETTINGS", () => {
      this.showSettingsMenu()
    })
    
    // Tutorial button
    const tutorialBtn = this.createMenuButton(centerX, startY + spacing * 4, "📖  TUTORIAL", () => {
      this.startTutorial()
    })
    
    this.menuContainer.add([vsPlayerBtn, vsAIBtn, tournamentBtn, settingsBtn, tutorialBtn])
    
    // Instructions at bottom
    this.createInstructions()
    
    // Animated decorations
    this.createAnimatedElements()
  }

  private showDifficultyMenu(): void {
    this.clearMenu()
    this.currentMenu = "difficulty"
    
    const centerX = screenSize.width.value / 2
    const startY = 300
    const spacing = 70
    
    this.menuContainer = this.add.container(0, 0)
    this.menuContainer.setDepth(20)
    
    const title = this.add.text(centerX, startY - 60, "SELECT DIFFICULTY", {
      fontSize: "32px",
      fontFamily: "RetroPixel",
      color: "#FFD700",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5)
    
    const easyBtn = this.createMenuButton(centerX, startY, "😊  EASY", () => {
      this.gameManager.setAIDifficulty("easy")
      this.showMatchTypeMenu()
    }, 0x44ff44)
    
    const mediumBtn = this.createMenuButton(centerX, startY + spacing, "😐  MEDIUM", () => {
      this.gameManager.setAIDifficulty("medium")
      this.showMatchTypeMenu()
    }, 0xffaa44)
    
    const hardBtn = this.createMenuButton(centerX, startY + spacing * 2, "😈  HARD", () => {
      this.gameManager.setAIDifficulty("hard")
      this.showMatchTypeMenu()
    }, 0xff4444)
    
    const backBtn = this.createMenuButton(centerX, startY + spacing * 3 + 20, "← BACK", () => {
      this.showMainMenu()
    }, 0x888888)
    
    this.menuContainer.add([title, easyBtn, mediumBtn, hardBtn, backBtn])
  }

  private showMatchTypeMenu(): void {
    this.clearMenu()
    this.currentMenu = "match_type"
    
    const centerX = screenSize.width.value / 2
    const startY = 300
    const spacing = 70
    
    this.menuContainer = this.add.container(0, 0)
    this.menuContainer.setDepth(20)
    
    const title = this.add.text(centerX, startY - 60, "SELECT MATCH TYPE", {
      fontSize: "32px",
      fontFamily: "RetroPixel",
      color: "#FFD700",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5)
    
    const timedBtn = this.createMenuButton(centerX, startY, "⏱️  90 SECONDS", () => {
      this.gameManager.setMatchType("timed")
      this.gameManager.setMatchTime(90)
      this.startGame()
    })
    
    const timed60Btn = this.createMenuButton(centerX, startY + spacing, "⏱️  60 SECONDS", () => {
      this.gameManager.setMatchType("timed")
      this.gameManager.setMatchTime(60)
      this.startGame()
    })
    
    const firstTo3Btn = this.createMenuButton(centerX, startY + spacing * 2, "🥅  FIRST TO 3", () => {
      this.gameManager.setMatchType("first_to_goals")
      this.gameManager.setGoalLimit(3)
      this.startGame()
    })
    
    const firstTo5Btn = this.createMenuButton(centerX, startY + spacing * 3, "🥅  FIRST TO 5", () => {
      this.gameManager.setMatchType("first_to_goals")
      this.gameManager.setGoalLimit(5)
      this.startGame()
    })
    
    const backBtn = this.createMenuButton(centerX, startY + spacing * 4 + 20, "← BACK", () => {
      if (this.gameManager.getSettings().gameMode === "1vAI") {
        this.showDifficultyMenu()
      } else {
        this.showMainMenu()
      }
    }, 0x888888)
    
    this.menuContainer.add([title, timedBtn, timed60Btn, firstTo3Btn, firstTo5Btn, backBtn])
  }

  private showTournamentSetup(): void {
    this.clearMenu()
    this.currentMenu = "mode_select"
    
    const centerX = screenSize.width.value / 2
    const startY = 300
    const spacing = 70
    
    this.menuContainer = this.add.container(0, 0)
    this.menuContainer.setDepth(20)
    
    const title = this.add.text(centerX, startY - 60, "🏆 TOURNAMENT MODE", {
      fontSize: "32px",
      fontFamily: "RetroPixel",
      color: "#FFD700",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5)
    
    const bo3Btn = this.createMenuButton(centerX, startY, "BEST OF 3", () => {
      this.gameManager.startTournament(3)
      this.showMatchTypeMenu()
    })
    
    const bo5Btn = this.createMenuButton(centerX, startY + spacing, "BEST OF 5", () => {
      this.gameManager.startTournament(5)
      this.showMatchTypeMenu()
    })
    
    const bo7Btn = this.createMenuButton(centerX, startY + spacing * 2, "BEST OF 7", () => {
      this.gameManager.startTournament(7)
      this.showMatchTypeMenu()
    })
    
    const backBtn = this.createMenuButton(centerX, startY + spacing * 3 + 20, "← BACK", () => {
      this.showMainMenu()
    }, 0x888888)
    
    this.menuContainer.add([title, bo3Btn, bo5Btn, bo7Btn, backBtn])
  }

  private showSettingsMenu(): void {
    this.clearMenu()
    this.currentMenu = "settings"
    
    const centerX = screenSize.width.value / 2
    const startY = 280
    const spacing = 80
    
    this.menuContainer = this.add.container(0, 0)
    this.menuContainer.setDepth(20)
    
    const title = this.add.text(centerX, startY - 60, "⚙️ SETTINGS", {
      fontSize: "32px",
      fontFamily: "RetroPixel",
      color: "#FFD700",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5)
    
    // Music Volume
    const musicLabel = this.add.text(centerX - 150, startY, "Music Volume:", {
      fontSize: "20px",
      fontFamily: "RetroPixel",
      color: "#FFFFFF"
    }).setOrigin(0, 0.5)
    
    const musicValue = this.add.text(centerX + 150, startY, `${Math.round(audioConfig.musicVolume.value * 100)}%`, {
      fontSize: "20px",
      fontFamily: "RetroPixel",
      color: "#FFD700"
    }).setOrigin(1, 0.5)
    
    // SFX Volume
    const sfxLabel = this.add.text(centerX - 150, startY + spacing, "SFX Volume:", {
      fontSize: "20px",
      fontFamily: "RetroPixel",
      color: "#FFFFFF"
    }).setOrigin(0, 0.5)
    
    const sfxValue = this.add.text(centerX + 150, startY + spacing, `${Math.round(audioConfig.sfxVolume.value * 100)}%`, {
      fontSize: "20px",
      fontFamily: "RetroPixel",
      color: "#FFD700"
    }).setOrigin(1, 0.5)
    
    // Controls info
    const controlsTitle = this.add.text(centerX, startY + spacing * 2, "CONTROLS", {
      fontSize: "24px",
      fontFamily: "RetroPixel",
      color: "#FFD700"
    }).setOrigin(0.5)
    
    const controlsP1 = this.add.text(centerX, startY + spacing * 2 + 40, "Player 1: WASD + SPACE", {
      fontSize: "16px",
      fontFamily: "RetroPixel",
      color: "#4488ff"
    }).setOrigin(0.5)
    
    const controlsP2 = this.add.text(centerX, startY + spacing * 2 + 70, "Player 2: Arrows + SHIFT", {
      fontSize: "16px",
      fontFamily: "RetroPixel",
      color: "#ff4444"
    }).setOrigin(0.5)
    
    const backBtn = this.createMenuButton(centerX, startY + spacing * 3 + 60, "← BACK", () => {
      this.showMainMenu()
    }, 0x888888)
    
    this.menuContainer.add([title, musicLabel, musicValue, sfxLabel, sfxValue, controlsTitle, controlsP1, controlsP2, backBtn])
  }

  private createMenuButton(x: number, y: number, text: string, callback: () => void, color: number = 0x4488ff): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    
    // Button background
    const bg = this.add.rectangle(0, 0, 300, 50, color, 0.8)
    bg.setStrokeStyle(3, 0xffffff)
    
    // Button text
    const btnText = this.add.text(0, 0, text, {
      fontSize: "22px",
      fontFamily: "RetroPixel",
      color: "#FFFFFF",
      stroke: "#000000",
      strokeThickness: 2
    }).setOrigin(0.5)
    
    container.add([bg, btnText])
    container.setSize(300, 50)
    container.setInteractive({ useHandCursor: true })
    
    // Hover effects
    container.on('pointerover', () => {
      bg.setScale(1.08)
      btnText.setScale(1.08)
      this.buttonClickSound.play()
    })
    
    container.on('pointerout', () => {
      bg.setScale(1)
      btnText.setScale(1)
    })
    
    container.on('pointerdown', () => {
      bg.setScale(0.95)
      btnText.setScale(0.95)
    })
    
    container.on('pointerup', () => {
      bg.setScale(1.08)
      btnText.setScale(1.08)
      callback()
    })
    
    return container
  }

  private clearMenu(): void {
    if (this.menuContainer) {
      this.menuContainer.destroy()
    }
  }

  private createInstructions(): void {
    const centerX = screenSize.width.value / 2
    const bottomY = screenSize.height.value - 50
    
    const instructionsText = this.add.text(centerX, bottomY, 
      "Press SPACE or ENTER to select  |  ESC to go back", {
      fontSize: "14px",
      fontFamily: "RetroPixel",
      color: "#aaaaaa",
      stroke: "#000000",
      strokeThickness: 2
    })
    instructionsText.setOrigin(0.5)
    instructionsText.setDepth(10)
  }

  private createAnimatedElements(): void {
    for (let i = 0; i < 3; i++) {
      const ballX = 100 + (i * 450)
      const ballY = 600 + (i % 2) * 50
      
      const decorBall = this.add.image(ballX, ballY, "soccer_ball")
      decorBall.setScale(0.08 + (i * 0.02))
      decorBall.setDepth(-1)
      decorBall.setAlpha(0.3)
      
      this.tweens.add({
        targets: decorBall,
        angle: 360,
        duration: 4000 + (i * 1000),
        repeat: -1,
        ease: 'Linear'
      })
      
      this.tweens.add({
        targets: decorBall,
        y: ballY - 15,
        duration: 1500 + (i * 300),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }
  }

  private setupAudio(): void {
    this.backgroundMusic = this.sound.add("soccer_theme", {
      volume: audioConfig.musicVolume.value,
      loop: true
    })
    
    this.buttonClickSound = this.sound.add("button_click", {
      volume: audioConfig.sfxVolume.value * 0.5
    })
    
    this.gameStartSound = this.sound.add("game_start", {
      volume: audioConfig.sfxVolume.value
    })
    
    this.backgroundMusic.play()
  }

  private setupInput(): void {
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    escKey.on('down', () => {
      if (this.currentMenu !== "main") {
        this.showMainMenu()
        this.buttonClickSound.play()
      }
    })
  }

  private startGame(): void {
    console.log("🚀 STARTING GAME!")
    console.log("Settings:", this.gameManager.getSettings())
    
    this.gameStartSound.play()
    this.backgroundMusic.stop()
    
    const transitionRect = this.add.rectangle(
      screenSize.width.value / 2, 
      screenSize.height.value / 2, 
      screenSize.width.value, 
      screenSize.height.value, 
      0x000000, 
      0
    )
    transitionRect.setDepth(100)
    
    this.tweens.add({
      targets: transitionRect,
      alpha: 1,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.scene.start("GameScene")
      }
    })
  }

  private startTutorial(): void {
    console.log("📖 STARTING TUTORIAL!")
    
    this.gameStartSound.play()
    this.backgroundMusic.stop()
    
    const transitionRect = this.add.rectangle(
      screenSize.width.value / 2, 
      screenSize.height.value / 2, 
      screenSize.width.value, 
      screenSize.height.value, 
      0x000000, 
      0
    )
    transitionRect.setDepth(100)
    
    this.tweens.add({
      targets: transitionRect,
      alpha: 1,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.scene.start("TutorialScene")
      }
    })
  }
}
