import Phaser from "phaser"
import { screenSize, audioConfig } from "../gameConfig.json"
import { Player } from "../Player"
import { Ball } from "../Ball"

interface TutorialStep {
  title: string
  description: string
  keys: string
  action: () => void
  checkComplete: () => boolean
}

export default class TutorialScene extends Phaser.Scene {
  private player!: Player
  private ball!: Ball
  private groundTopY = 648
  
  private currentStep = 0
  private tutorialSteps: TutorialStep[] = []
  private isStepComplete = false
  
  // UI Elements
  private titleText!: Phaser.GameObjects.Text
  private descText!: Phaser.GameObjects.Text
  private keysText!: Phaser.GameObjects.Text
  private progressText!: Phaser.GameObjects.Text
  private continueText!: Phaser.GameObjects.Text

  
  // Sounds
  private dingSound!: Phaser.Sound.BaseSound
  private buttonClickSound!: Phaser.Sound.BaseSound
  
  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key, A: Phaser.Input.Keyboard.Key, S: Phaser.Input.Keyboard.Key, D: Phaser.Input.Keyboard.Key }
  private spaceKey!: Phaser.Input.Keyboard.Key

  constructor() {
    super({ key: "TutorialScene" })
  }

  create(): void {
    this.setupBackground()
    this.setupGround()
    this.setupPlayer()
    this.setupBall()
    this.setupUI()
    this.setupInput()
    this.setupSounds()
    this.defineTutorialSteps()
    this.showCurrentStep()
    
    console.log("📖 Tutorial Scene created")
  }

  private setupBackground(): void {
    const bg = this.add.image(screenSize.width.value / 2, screenSize.height.value / 2, "clean_soccer_field_background")
    const scale = Math.max(screenSize.width.value / bg.width, screenSize.height.value / bg.height)
    bg.setScale(scale)
    bg.setDepth(-10)
    
    const overlay = this.add.rectangle(screenSize.width.value / 2, screenSize.height.value / 2, screenSize.width.value, screenSize.height.value, 0x000000, 0.3)
    overlay.setDepth(-5)
  }

  private setupGround(): void {
    const groundCenterY = screenSize.height.value - 100
    const groundHeight = 40
    this.groundTopY = groundCenterY - groundHeight / 2
    
    const ground = this.add.rectangle(screenSize.width.value / 2, groundCenterY, screenSize.width.value, groundHeight, 0x00ff00, 0)
    this.physics.add.existing(ground, true)
  }

  private setupPlayer(): void {
    this.player = new Player(this, screenSize.width.value / 2 - 100, this.groundTopY, "left")
  }

  private setupBall(): void {
    const ballCenterY = this.groundTopY - 26
    this.ball = new Ball(this, screenSize.width.value / 2 + 100, ballCenterY)
    
    // Add collision
    this.physics.add.overlap(this.ball, this.player, () => {
      // Handled in tutorial steps
    })
  }

  private setupUI(): void {
    const centerX = screenSize.width.value / 2
    
    // Tutorial panel background
    const panelBg = this.add.rectangle(centerX, 100, 800, 150, 0x000000, 0.8)
    panelBg.setStrokeStyle(3, 0xFFD700)
    panelBg.setDepth(50)
    
    // Title
    this.titleText = this.add.text(centerX, 50, "", {
      fontSize: "28px",
      fontFamily: "RetroPixel",
      color: "#FFD700",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(51)
    
    // Description
    this.descText = this.add.text(centerX, 95, "", {
      fontSize: "18px",
      fontFamily: "RetroPixel",
      color: "#FFFFFF",
      stroke: "#000000",
      strokeThickness: 2,
      wordWrap: { width: 700 },
      align: "center"
    }).setOrigin(0.5).setDepth(51)
    
    // Keys to press
    this.keysText = this.add.text(centerX, 140, "", {
      fontSize: "22px",
      fontFamily: "RetroPixel",
      color: "#4488ff",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(51)
    
    // Progress indicator
    this.progressText = this.add.text(20, 20, "", {
      fontSize: "16px",
      fontFamily: "RetroPixel",
      color: "#aaaaaa"
    }).setDepth(51)
    
    // Continue prompt
    this.continueText = this.add.text(centerX, screenSize.height.value - 80, "Press ENTER to continue", {
      fontSize: "20px",
      fontFamily: "RetroPixel",
      color: "#44ff44",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(51).setVisible(false)
    
    // Skip tutorial
    this.add.text(screenSize.width.value - 20, 20, "Press ESC to skip", {
      fontSize: "14px",
      fontFamily: "RetroPixel",
      color: "#888888"
    }).setOrigin(1, 0).setDepth(51)
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasdKeys = this.input.keyboard!.addKeys("W,A,S,D") as any
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    enterKey.on("down", () => {
      if (this.isStepComplete) {
        this.nextStep()
      }
    })
    
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    escKey.on("down", () => {
      this.endTutorial()
    })
  }

  private setupSounds(): void {
    this.dingSound = this.sound.add("tutorial_ding", { volume: audioConfig.sfxVolume.value })
    this.buttonClickSound = this.sound.add("button_click", { volume: audioConfig.sfxVolume.value })
  }

  private defineTutorialSteps(): void {
    this.tutorialSteps = [
      {
        title: "WELCOME TO HEAD SOCCER!",
        description: "Let's learn the basics. This tutorial will teach you how to play.",
        keys: "Press ENTER to continue",
        action: () => {},
        checkComplete: () => true
      },
      {
        title: "MOVEMENT",
        description: "Use A and D keys (or Arrow Left/Right) to move your player.",
        keys: "Press A/D or ←/→",
        action: () => {},
        checkComplete: () => {
          return this.wasdKeys.A.isDown || this.wasdKeys.D.isDown || this.cursors.left!.isDown || this.cursors.right!.isDown
        }
      },
      {
        title: "JUMPING",
        description: "Press W (or Arrow Up) to jump. Jumping helps you reach high balls!",
        keys: "Press W or ↑",
        action: () => {},
        checkComplete: () => {
          return this.wasdKeys.W.isDown || this.cursors.up!.isDown
        }
      },
      {
        title: "KICKING",
        description: "Press SPACE to kick the ball. Face the ball for a proper kick!",
        keys: "Press SPACE",
        action: () => {},
        checkComplete: () => {
          return this.spaceKey.isDown
        }
      },
      {
        title: "SLIDE TACKLE",
        description: "Press S (or Arrow Down) to slide tackle. This can stun opponents!",
        keys: "Press S or ↓",
        action: () => {},
        checkComplete: () => {
          return this.wasdKeys.S.isDown || this.cursors.down!.isDown
        }
      },
      {
        title: "SUPER KICK",
        description: "Kick the ball multiple times to charge your SUPER KICK meter. When full, your next kick will be super powerful!",
        keys: "Check the meter below your player",
        action: () => {},
        checkComplete: () => true
      },
      {
        title: "POWER-UPS",
        description: "Collect power-ups that spawn on the field: ⚡ Speed, 💪 Power, 🛡️ Shield",
        keys: "Walk into them to collect",
        action: () => {},
        checkComplete: () => true
      },
      {
        title: "COMBOS",
        description: "Chain multiple kicks together to build combos. Higher combos = more powerful kicks!",
        keys: "Keep kicking the ball!",
        action: () => {},
        checkComplete: () => true
      },
      {
        title: "READY TO PLAY!",
        description: "You've learned all the basics! Now go score some goals!",
        keys: "Press ENTER to start playing",
        action: () => {},
        checkComplete: () => true
      }
    ]
  }

  private showCurrentStep(): void {
    if (this.currentStep >= this.tutorialSteps.length) {
      this.endTutorial()
      return
    }
    
    const step = this.tutorialSteps[this.currentStep]
    this.isStepComplete = false
    
    this.titleText.setText(step.title)
    this.descText.setText(step.description)
    this.keysText.setText(step.keys)
    this.progressText.setText(`Step ${this.currentStep + 1} / ${this.tutorialSteps.length}`)
    
    this.continueText.setVisible(false)
    
    step.action()
  }

  private nextStep(): void {
    this.buttonClickSound.play()
    this.currentStep++
    this.showCurrentStep()
  }

  private completeStep(): void {
    if (!this.isStepComplete) {
      this.isStepComplete = true
      this.dingSound.play()
      this.continueText.setVisible(true)
      
      // Pulse effect on continue text
      this.tweens.add({
        targets: this.continueText,
        alpha: 0.5,
        duration: 500,
        yoyo: true,
        repeat: -1
      })
    }
  }

  private endTutorial(): void {
    this.buttonClickSound.play()
    
    const transition = this.add.rectangle(screenSize.width.value / 2, screenSize.height.value / 2, screenSize.width.value, screenSize.height.value, 0x000000, 0)
    transition.setDepth(100)
    
    this.tweens.add({
      targets: transition,
      alpha: 1,
      duration: 500,
      onComplete: () => {
        this.scene.start("StartScene")
      }
    })
  }

  update(_time: number, delta: number): void {
    // Update player
    this.player.update(
      delta,
      this.wasdKeys.A.isDown,
      this.wasdKeys.D.isDown,
      this.wasdKeys.W.isDown,
      this.wasdKeys.S.isDown,
      this.spaceKey.isDown
    )
    
    // Update ball
    this.ball.update()
    
    // Check if current step is complete
    if (!this.isStepComplete && this.currentStep < this.tutorialSteps.length) {
      const step = this.tutorialSteps[this.currentStep]
      if (step.checkComplete()) {
        this.time.delayedCall(500, () => {
          this.completeStep()
        })
      }
    }
  }
}
