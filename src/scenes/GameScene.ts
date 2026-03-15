import Phaser from "phaser"
import { Player } from "../Player"
import { Ball } from "../Ball"
import { Goal } from "../Goal"
import { GameUI } from "../GameUI"
import { AIController } from "../AIController"
import { PowerUpManager, PowerUp } from "../PowerUp"
import { ComboSystem } from "../ComboSystem"
import { EffectsManager } from "../EffectsManager"
import GameManager from "../GameManager"
import { MobileControls } from "../MobileControls"
import { screenSize, fieldConfig, gameConfig, audioConfig } from "../gameConfig.json"

export default class GameScene extends Phaser.Scene {
  // Game objects
  private background!: Phaser.GameObjects.Image
  private field!: Phaser.GameObjects.Graphics
  private player1!: Player
  private player2!: Player
  private ball!: Ball
  private leftGoal!: Goal
  private rightGoal!: Goal
  private gameUI!: GameUI
  private goalText!: Phaser.GameObjects.Text
  private aiController!: AIController
  
  // New systems
  private powerUpManager!: PowerUpManager
  private comboSystem!: ComboSystem
  private effectsManager!: EffectsManager
  private gameManager: GameManager
  
  // Game state
  private gameMode: "1v1" | "1vAI" | "tournament" = "1v1"
  private isGameActive = false
  private player1Score = 0
  private player2Score = 0
  
  // Manual collision cooldowns
  private lastManualCollisionP1 = 0
  private lastManualCollisionP2 = 0
  private lastGoalTime = 0
  
  // Ground positioning - consistent across all methods
  private groundTopY = 0
  
  // Input handling
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key, A: Phaser.Input.Keyboard.Key, S: Phaser.Input.Keyboard.Key, D: Phaser.Input.Keyboard.Key }
  private spaceKey!: Phaser.Input.Keyboard.Key
  private shiftKey!: Phaser.Input.Keyboard.Key
  private pKey!: Phaser.Input.Keyboard.Key
  
  // Mobile controls
  private mobileControls!: MobileControls
  private isMobile = false
  
  // Sounds
  private backgroundMusic!: Phaser.Sound.BaseSound
  private goalCheerSound!: Phaser.Sound.BaseSound
  private whistleSound!: Phaser.Sound.BaseSound
  private matchEndSound!: Phaser.Sound.BaseSound
  
  // Stun effects
  private stunStars1!: Phaser.GameObjects.Image
  private stunStars2!: Phaser.GameObjects.Image

  constructor() {
    super({ key: "GameScene" })
    this.gameManager = GameManager.getInstance()
  }

  private resetGameState(): void {
    // Reset scores
    this.player1Score = 0
    this.player2Score = 0
    
    // Reset game state
    this.isGameActive = true
    this.lastGoalTime = 0
    this.lastManualCollisionP1 = 0
    this.lastManualCollisionP2 = 0
    
    // Get settings from GameManager
    const settings = this.gameManager.getSettings()
    this.gameMode = settings.gameMode
    
    console.log("🔄 Game state reset: scores cleared, game ready to start")
    console.log(`🎮 Game Mode: ${this.gameMode}, Match Type: ${settings.matchType}`)
  }

  preload(): void {
    console.log("=== PRELOAD STARTED ===")
    // All assets are now loaded in LoadingScene via asset-pack.json
  }

  create(): void {
    console.log("=== CREATE STARTED ===")
    
    // Reset game state for restart
    this.resetGameState()
    
    // Initialize game - CRITICAL: Ground setup first, then everything else!
    this.setupBackground()
    this.setupField()
    this.setupGroundSystem() // NEW: Setup ground first to calculate groundTopY
    this.setupGoals()         // NOW: Can use groundTopY
    this.setupPlayers()
    this.setupBall()
    this.setupPhysics()       // FINAL: Setup physics and collisions
    this.setupUI()
    this.setupInput()
    this.setupAudio()
    this.setupStunEffects()
    this.setupGoalText()
    this.setupNewSystems()
    
    // Start game
    this.startGame()
  }

  private setupNewSystems(): void {
    // Initialize PowerUp Manager
    this.powerUpManager = new PowerUpManager(this, this.groundTopY)
    
    // Initialize Combo System
    this.comboSystem = new ComboSystem(this)
    
    // Initialize Effects Manager
    this.effectsManager = new EffectsManager(this)
    
    // Setup power-up collisions
    this.setupPowerUpCollisions()
    
    console.log("✨ New game systems initialized (PowerUps, Combos, Effects)")
  }

  private setupPowerUpCollisions(): void {
    // Player 1 collecting power-ups
    this.physics.add.overlap(
      this.player1,
      this.powerUpManager.getPowerUps(),
      (_player, powerUp) => {
        const pu = powerUp as PowerUp
        pu.collect(this.player1)
        this.effectsManager.showPowerAura(this.player1.x, this.player1.y)
      }
    )
    
    // Player 2 collecting power-ups
    this.physics.add.overlap(
      this.player2,
      this.powerUpManager.getPowerUps(),
      (_player, powerUp) => {
        const pu = powerUp as PowerUp
        pu.collect(this.player2)
        this.effectsManager.showPowerAura(this.player2.x, this.player2.y)
      }
    )
  }
  



  private setupBackground(): void {
    // Create background
    this.background = this.add.image(screenSize.width.value / 2, screenSize.height.value / 2, "soccer_field_background")
    
    // Scale to fit screen
    const scaleX = screenSize.width.value / this.background.width
    const scaleY = screenSize.height.value / this.background.height
    const scale = Math.max(scaleX, scaleY)
    this.background.setScale(scale)
    
    this.background.setDepth(-2)
  }

  private setupField(): void {
    // Create field lines for 2D side-view soccer field
    this.field = this.add.graphics()
    this.field.lineStyle(4, 0xffffff, 1)
    
    const fieldWidth = fieldConfig.width.value
    const centerX = screenSize.width.value / 2
    const groundY = screenSize.height.value - 100 // Ground level
    
    // Side view field - only horizontal ground line and center circle
    // Main field line (horizontal baseline where players run)
    this.field.moveTo(centerX - fieldWidth / 2, groundY)
    this.field.lineTo(centerX + fieldWidth / 2, groundY)
    this.field.strokePath()
    
    // Center mark (small vertical line at field center)  
    this.field.moveTo(centerX, groundY - 5)
    this.field.lineTo(centerX, groundY + 5)
    this.field.strokePath()
    
    // Center circle (on the ground)
    this.field.strokeCircle(centerX, groundY, 40)
    
    this.field.setDepth(-1)
  }

  private setupGroundSystem(): void {
    // **CALCULATE GROUND POSITION** - this must be done early for other components to use
    const groundCenterY = screenSize.height.value - 100 // Ground rectangle center (668)
    const groundHeight = 40
    this.groundTopY = groundCenterY - groundHeight / 2 // Top of ground = 648 - store as class property
    
    console.log(`🏗️ GROUND SYSTEM SETUP:`)
    console.log(`   Ground center Y: ${groundCenterY}`)
    console.log(`   Ground height: ${groundHeight}`)
    console.log(`   Ground top Y (where objects stand): ${this.groundTopY}`)
  }

  private setupGoals(): void {
    // **BIGGER GOALS MOVED TOWARD CENTER** - larger goals positioned closer to field center
    const goalMargin = 80 // Increased distance from screen edges, moving goals toward center
    const leftGoalX = goalMargin  // Left goal closer to center = 80
    const rightGoalX = screenSize.width.value - goalMargin  // Right goal closer to center = 1072
    
    console.log(`🥅 GOAL POSITIONS CALCULATION:`)
    console.log(`   Screen width: ${screenSize.width.value}`)
    console.log(`   Field width: ${fieldConfig.width.value}`)
    console.log(`   Goal margin: ${goalMargin}`)
    console.log(`   Left goal X: ${leftGoalX}`)
    console.log(`   Right goal X: ${rightGoalX}`)
    console.log(`   Goal Y (ground top): ${this.groundTopY}`)
    
    this.leftGoal = new Goal(this, leftGoalX, this.groundTopY, "left")
    this.rightGoal = new Goal(this, rightGoalX, this.groundTopY, "right")
    
    console.log(`🥅 GOALS CREATED:`)
    console.log(`   Left goal actual position: (${this.leftGoal.x}, ${this.leftGoal.y})`)
    console.log(`   Right goal actual position: (${this.rightGoal.x}, ${this.rightGoal.y})`)
    
    // Goal detection areas are now handled internally by Goal objects
    console.log(`🎯 GOAL AREAS: Using internal Goal collision zones`)
  }

  private setupPlayers(): void {
    const centerX = screenSize.width.value / 2
    
    // Create players positioned between goals and center, balanced for bigger goals moved inward
    const player1X = centerX - 200 // Left side player, positioned between goal and center
    const player2X = centerX + 200 // Right side player, positioned between goal and center
    
    // Position players exactly on ground line for perfect alignment
    const playerY = this.groundTopY // Players exactly on ground line
    console.log(`👥 CREATING PLAYERS AT Y: ${playerY} (on ground line)`)
    this.player1 = new Player(this, player1X, playerY, "left")
    this.player2 = new Player(this, player2X, playerY, "right")
  }

  private setupBall(): void {
    const centerX = screenSize.width.value / 2
    
    // Position ball so its BOTTOM sits ON TOP of the ground surface
    const ballRadius = 25 // Ball radius
    const ballBottomY = this.groundTopY - 1 // Ball bottom 1px ABOVE ground to prevent penetration
    const ballCenterY = ballBottomY - ballRadius // Ball center position
    
    console.log(`⚽ CREATING BALL: bottom at Y=${ballBottomY}, center at Y=${ballCenterY}`)
    console.log(`🏗️ GROUND surface at Y=${this.groundTopY}, ball sits ON TOP`)
    console.log(`👥 PLAYERS at Y=${this.groundTopY} - ON ground surface`)
    this.ball = new Ball(this, centerX, ballCenterY) // Ball sitting on ground surface
  }

  private setupUI(): void {
    this.gameUI = new GameUI(this)
    
    // Listen for game end event
    this.events.on("gameEnd", this.handleGameEnd, this)
  }

  private setupInput(): void {
    // Check if mobile device
    this.isMobile = MobileControls.isMobileDevice()
    console.log(`📱 Mobile device detected: ${this.isMobile}`)
    
    // Create keyboard input keys (always available)
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasdKeys = this.input.keyboard!.addKeys("W,A,S,D") as any
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
    this.pKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P)
    
    // Create mobile controls (for touch devices)
    this.mobileControls = new MobileControls(this)
    
    // Show mobile controls based on device type (or always show for testing)
    // For production, you may want: this.mobileControls.setVisible(this.isMobile)
    this.mobileControls.setVisible(true) // Always show for testing
    
    // Pause/resume functionality
    this.pKey.on("down", () => {
      if (this.gameUI.isPaused()) {
        this.resumeGame()
      } else {
        this.pauseGame()
      }
    })
    
    // ESC to go back to main menu
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    escKey.on("down", () => {
      if (this.isGameActive) {
        this.backgroundMusic.stop()
        this.scene.start("StartScene")
      }
    })
  }

  private setupAudio(): void {
    this.backgroundMusic = this.sound.add("soccer_match_theme", {
      volume: audioConfig.musicVolume.value,
      loop: true
    })
    
    this.goalCheerSound = this.sound.add("goal_cheer", {
      volume: audioConfig.sfxVolume.value
    })
    
    this.whistleSound = this.sound.add("whistle", {
      volume: audioConfig.sfxVolume.value
    })
    
    this.matchEndSound = this.sound.add("match_end", {
      volume: audioConfig.sfxVolume.value
    })
    
    // Start background music
    this.backgroundMusic.play()
  }

  private setupPhysics(): void {
    // Set world bounds - ENABLE bottom boundary to catch falling players
    this.physics.world.setBounds(0, 0, screenSize.width.value, screenSize.height.value, true, true, true, true)
    
    // Enable gravity for arcade physics
    this.physics.world.gravity.y = 0 // No world gravity, players/ball set their own
    
    // **CREATE GROUND PLATFORMS** - using the SAME calculation as setupGroundSystem
    const groundCenterY = screenSize.height.value - 100 // 668 - MUST match setupGroundSystem
    const groundHeight = 40 // MUST match setupGroundSystem
    
    // Verify our groundTopY calculation is correct
    const calculatedGroundTopY = groundCenterY - groundHeight / 2
    console.log(`🔍 GROUND VERIFICATION: groundTopY=${this.groundTopY}, calculated=${calculatedGroundTopY}`)
    
    // Primary ground platform (invisible collision body)
    const ground = this.add.rectangle(screenSize.width.value / 2, groundCenterY, screenSize.width.value, groundHeight, 0x00ff00, 0) // Invisible collision platform
    this.physics.add.existing(ground, true) // Static body - automatically immovable
    
    // **VERIFY GROUND BODY** - ensure physics body is correct
    const groundBody = ground.body as Phaser.Physics.Arcade.StaticBody
    console.log(`🏗️ GROUND BODY VERIFICATION:`)
    console.log(`   Ground rectangle: center=(${ground.x}, ${ground.y}), size=${ground.width}x${ground.height}`)
    console.log(`   Ground body: x=${groundBody.x}, y=${groundBody.y}, width=${groundBody.width}, height=${groundBody.height}`)
    console.log(`   Ground top edge Y: ${groundBody.y}`)
    console.log(`   Ground bottom edge Y: ${groundBody.y + groundBody.height}`)
    console.log(`   Expected player Y (groundTopY): ${this.groundTopY}`)
    
    // BACKUP ground platform (slightly lower, invisible collision body)
    const backupGroundCenterY = groundCenterY + 30
    const backupGround = this.add.rectangle(screenSize.width.value / 2, backupGroundCenterY, screenSize.width.value, 20, 0xff0000, 0) // Invisible backup collision
    this.physics.add.existing(backupGround, true) // Static body - automatically immovable
    
    console.log(`🏁 PHYSICS - GROUND PLATFORMS CREATED:`)
    console.log(`   Primary Ground center: Y=${groundCenterY}, Height=${groundHeight}`)
    console.log(`   Backup Ground center: Y=${backupGroundCenterY}, Height=20`)
    console.log(`   Using groundTopY: ${this.groundTopY}`)
    console.log(`👤 PLAYER1 position: (${this.player1.x}, ${this.player1.y})`)
    console.log(`👤 PLAYER2 position: (${this.player2.x}, ${this.player2.y})`)
    
    // Add collisions with BOTH grounds - NO CALLBACKS to eliminate jitter
    this.physics.add.collider(this.ball, ground)
    this.physics.add.collider(this.ball, backupGround)
    
    const p1Collider = this.physics.add.collider(this.player1, ground)
    const p2Collider = this.physics.add.collider(this.player2, ground) 
    const p1BackupCollider = this.physics.add.collider(this.player1, backupGround)
    const p2BackupCollider = this.physics.add.collider(this.player2, backupGround)
    
    console.log(`🤝 COLLIDERS CREATED:`)
    console.log(`   Player1 ↔ Primary Ground: ${p1Collider ? '✅' : '❌'}`)
    console.log(`   Player2 ↔ Primary Ground: ${p2Collider ? '✅' : '❌'}`)
    console.log(`   Player1 ↔ Backup Ground: ${p1BackupCollider ? '✅' : '❌'}`)
    console.log(`   Player2 ↔ Backup Ground: ${p2BackupCollider ? '✅' : '❌'}`)
    
    // Ball collision with goals - add debugging
    this.physics.add.overlap(this.ball, this.leftGoal.getGoalZone(), () => {
      console.log(`🥅 GOAL! Ball entered LEFT goal zone`)
      this.handleGoal(2) // Player 2 scores
    })
    
    this.physics.add.overlap(this.ball, this.rightGoal.getGoalZone(), () => {
      console.log(`🥅 GOAL! Ball entered RIGHT goal zone`)
      this.handleGoal(1) // Player 1 scores
    })
    
    // Ball collision with goal posts
    const leftGoalBodies = this.leftGoal.getCollisionBodies()
    const rightGoalBodies = this.rightGoal.getCollisionBodies()
    
    leftGoalBodies.forEach(body => {
      this.physics.add.collider(this.ball, body.gameObject, () => {
        this.ball.onGoalPostHit()
      })
    })
    
    rightGoalBodies.forEach(body => {
      this.physics.add.collider(this.ball, body.gameObject, () => {
        this.ball.onGoalPostHit()
      })
    })
    
    // Ball collision with players - Use overlap for more reliable detection
    this.physics.add.overlap(this.ball, this.player1, () => {
      this.handlePlayerBallContact(this.player1)
    })
    
    this.physics.add.overlap(this.ball, this.player2, () => {
      this.handlePlayerBallContact(this.player2)
    })
    
    // Player collision (slide tackles)
    this.physics.add.overlap(this.player1, this.player2, () => {
      this.handlePlayerCollision()
    })
    
    // Remove world bounds callback to eliminate jitter
    // Ball bouncing is now purely physical without sound/callback interference
  }

  private setupStunEffects(): void {
    this.stunStars1 = this.add.image(0, 0, "stun_stars")
    this.stunStars1.setVisible(false)
    this.stunStars1.setScale(0.15) // Much smaller
    
    this.stunStars2 = this.add.image(0, 0, "stun_stars")
    this.stunStars2.setVisible(false)
    this.stunStars2.setScale(0.15) // Much smaller
  }

  private setupGoalText(): void {
    // Create explosive GOAL text that completely covers the ball
    this.goalText = this.add.text(0, 0, "GOAL!", {
      fontSize: "72px",
      color: "#FFD700",
      fontStyle: "bold",
      stroke: "#FF0000",
      strokeThickness: 8,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: "#000000",
        blur: 8,
        fill: true
      }
    })
    this.goalText.setOrigin(0.5, 0.5)
    this.goalText.setVisible(false)
    this.goalText.setDepth(1000) // Very high depth to appear above everything
  }

  private showGoalTextOnBall(): void {
    // Position the GOAL text EXACTLY on the ball to completely cover it
    this.goalText.setPosition(this.ball.x, this.ball.y) // Directly on ball center
    this.goalText.setVisible(true)
    
    // Hide the ball completely during goal celebration
    this.ball.setVisible(false)
    
    // Explosive entrance animation
    this.goalText.setScale(0.1)
    this.goalText.setRotation(-0.5) // Start tilted
    
    // Stage 1: Explosive entrance
    this.tweens.add({
      targets: this.goalText,
      scale: 2.0, // Much larger explosion
      rotation: 0.2, // Rotate to create impact
      duration: 200,
      ease: 'Back.easeOut'
    })
    
    // Stage 2: Settle and pulse
    this.tweens.add({
      targets: this.goalText,
      scale: 1.5, // Settle to large size
      rotation: 0,
      duration: 200,
      delay: 200,
      ease: 'Elastic.easeOut'
    })
    
    // Stage 3: Continuous dramatic pulsing
    this.tweens.add({
      targets: this.goalText,
      scaleX: 1.7,
      scaleY: 1.3,
      duration: 300,
      delay: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // Color flash effect
    this.tweens.add({
      targets: this.goalText,
      alpha: 0.8,
      duration: 150,
      delay: 100,
      yoyo: true,
      repeat: -1,
      ease: 'Power2'
    })
  }

  private hideGoalTextOnBall(): void {
    // Show the ball again and hide the goal text
    this.ball.setVisible(true)
    this.goalText.setVisible(false)
    
    // Stop all animations and reset properties
    this.tweens.killTweensOf(this.goalText)
    this.goalText.setAlpha(1) // Reset alpha
    this.goalText.setScale(1) // Reset scale
    this.goalText.setRotation(0) // Reset rotation
  }

  private setupAI(): void {
    if (this.gameMode === "1vAI") {
      const settings = this.gameManager.getSettings()
      this.aiController = new AIController(this, this.player2, this.ball, this.player1, settings.aiDifficulty)
      console.log(`🤖 AI initialized with difficulty: ${settings.aiDifficulty}`)
    }
  }

  private startGame(): void {
    this.isGameActive = true
    this.setupAI()
    this.whistleSound.play()
    
    // Start power-up spawning
    this.powerUpManager.startSpawning()
    
    // Show match start effect
    this.effectsManager.showMatchStart()
    
    // Initial kickoff
    this.resetToKickoff()
  }

  private resetToKickoff(): void {
    const centerX = screenSize.width.value / 2 // 576
    
    // **STOP ALL MOVEMENT FIRST**
    this.isGameActive = false
    
    console.log(`🏁 STARTING KICKOFF RESET`)
    
    // **CLEAR ALL SCENE TWEENS** - Stop any ongoing animations
    this.tweens.killAll()
    
    // **HIDE STUN EFFECTS**
    if (this.stunStars1) {
      this.stunStars1.setVisible(false)
      this.tweens.killTweensOf(this.stunStars1)
      this.stunStars1.setAngle(0)
    }
    if (this.stunStars2) {
      this.stunStars2.setVisible(false)
      this.tweens.killTweensOf(this.stunStars2)
      this.stunStars2.setAngle(0)
    }
    
    // Reset ball position (center of field, sitting ON TOP of ground surface)
    const ballRadius = 25 // Ball radius
    const ballBottomY = this.groundTopY - 1 // Ball bottom 1px ABOVE ground surface
    const ballCenterY = ballBottomY - ballRadius // Ball center position
    
    console.log(`🏁 RESETTING BALL: bottom at Y=${ballBottomY}, center at Y=${ballCenterY}`)
    console.log(`🏗️ GROUND surface at Y=${this.groundTopY}, ball sits ON TOP`)
    console.log(`👥 PLAYERS at Y=${this.groundTopY} - ON ground surface`)
    
    // **USE ENHANCED RESET METHODS**
    this.ball.resetPosition(centerX, ballCenterY)
    
    // Reset player positions to their sides (consistent with setup)
    const player1X = centerX - 200 // Left side, positioned between goal and center
    const player2X = centerX + 200 // Right side, positioned between goal and center
    const playerY = this.groundTopY // Players exactly on ground line
    
    console.log(`🏁 RESETTING PLAYERS TO Y: ${playerY} (on ground line)`)
    
    // **SET POSITIONS FIRST, THEN RESET STATES**
    this.player1.setPosition(player1X, playerY)
    this.player2.setPosition(player2X, playerY)
    
    // **CALL ENHANCED RESET METHODS**
    this.player1.resetToKickoff()
    this.player2.resetToKickoff()
    
    console.log(`🏁 KICKOFF RESET:`)
    console.log(`   Player 1: (${this.player1.x}, ${this.player1.y})`)
    console.log(`   Player 2: (${this.player2.x}, ${this.player2.y})`)
    console.log(`   Ball: (${this.ball.x}, ${this.ball.y})`)
    
    // Brief delay before allowing movement
    this.time.delayedCall(gameConfig.kickoffDelay.value * 1000, () => {
      this.isGameActive = true
      console.log(`✅ Game reactivated after kickoff delay`)
    })
  }

  private handlePlayerBallContact(player: Player): void {
    console.log(`🚨 COLLISION DETECTED! ${player.getPlayerSide().toUpperCase()} PLAYER HIT BALL!`)
    
    if (!this.isGameActive || this.gameUI.isPaused()) {
      console.log("❌ Game not active, ignoring collision")
      return
    }
    
    const ballBody = this.ball.body as Phaser.Physics.Arcade.Body
    console.log(`⚽ Ball velocity BEFORE: (${ballBody.velocity.x.toFixed(1)}, ${ballBody.velocity.y.toFixed(1)})`)
    
    // **DIRECTIONAL CONTACT DETECTION** - Check if player is facing the ball
    const playerFacing = player.getFacingDirection() // "left" or "right"
    const ballRelativeToPlayer = this.ball.x - player.x // Positive = ball is to the right
    
    let isProperKick = false
    
    if (playerFacing === "right" && ballRelativeToPlayer > 0) {
      // Player facing right, ball is to the right = PROPER KICK
      isProperKick = true
      console.log(`✅ PROPER KICK: Player facing RIGHT, ball is to the RIGHT`)
    } else if (playerFacing === "left" && ballRelativeToPlayer < 0) {
      // Player facing left, ball is to the left = PROPER KICK  
      isProperKick = true
      console.log(`✅ PROPER KICK: Player facing LEFT, ball is to the LEFT`)
    } else {
      // Wrong direction = BODY BOUNCE
      isProperKick = false
      console.log(`❌ BODY BOUNCE: Player facing ${playerFacing.toUpperCase()}, ball relative position: ${ballRelativeToPlayer > 0 ? 'RIGHT' : 'LEFT'}`)
    }
    
    if (isProperKick) {
      // **PROPER KICK** - Use enhanced kick system
      const kickInfo = player.getKickInfo()
      const ballDistance = Phaser.Math.Distance.Between(player.x, player.y, this.ball.x, this.ball.y)
      
      // Determine kick type for combo and effects
      const playerNum = player.getPlayerSide() === "left" ? 1 : 2
      let comboAction: "kick" | "header" | "slide_kick" | "jump_kick" | "super_kick" = "kick"
      
      // Check for header
      if (player.isInHeaderPosition(this.ball.y)) {
        comboAction = "header"
        player.performHeader()
        this.effectsManager.showHeaderEffect(this.ball.x, this.ball.y)
      } else if (kickInfo.type === "slide") {
        comboAction = "slide_kick"
        this.effectsManager.showSlideDust(player.x, player.y, player.getFacingRight() ? 1 : -1)
      } else if (kickInfo.type === "jump") {
        comboAction = "jump_kick"
      }
      
      // Check for super kick
      let finalForce = kickInfo.force
      if (player.canSuperKick()) {
        comboAction = "super_kick"
        finalForce = player.useSuperKick()
        this.effectsManager.showSuperKickEffect(this.ball.x, this.ball.y, player.getFacingRight() ? 1 : -1)
      }
      
      // Register combo action and get multiplier
      const comboMultiplier = this.comboSystem.registerAction(playerNum as 1 | 2, comboAction)
      this.effectsManager.showComboEffect(this.ball.x, this.ball.y, this.comboSystem.getComboState(playerNum as 1 | 2).count)
      
      // Apply combo multiplier to kick force
      const boostedForce = new Phaser.Math.Vector2(
        finalForce.x * comboMultiplier * player.getPowerMultiplier(),
        finalForce.y
      )
      
      console.log(`💥 Enhanced kick: type=${kickInfo.type}, combo=${comboAction}, multiplier=${comboMultiplier.toFixed(2)}x`)
      
      // Apply enhanced kick to ball with all parameters
      this.ball.kick(boostedForce, player.y, kickInfo.type, ballDistance)
      
      // Add super kick charge
      player.addSuperKickCharge(10)
      
      // **ONLY TRIGGER KICK ANIMATION IF NOT SLIDING**
      if (!player.isSliding() && !player.isKicking()) {
        player.triggerKick()
        console.log(`🦵 Kick animation triggered for ${player.getPlayerSide()}`)
      } else if (player.isSliding()) {
        console.log(`🏃 ${player.getPlayerSide()} sliding - no kick animation switch`)
      }
      
      // Play kick sound
      this.sound.play("ball_kick", { volume: 0.3 })
      console.log("🔊 Ball kick sound played!")
      
    } else {
      // **BODY BOUNCE** - Ball bounces off player's back/side
      const bounceForceX = ballRelativeToPlayer > 0 ? 200 : -200 // Bounce away from player
      const bounceForceY = -100 // Small upward bounce
      
      console.log(`🏃‍♂️ BODY BOUNCE: Applying bounce force (${bounceForceX}, ${bounceForceY})`)
      
      // Apply gentle bounce
      ballBody.setVelocity(bounceForceX, bounceForceY)
      
      // Play different sound for bounce
      this.sound.play("ball_bounce", { volume: 0.2 })
      console.log("🔊 Ball bounce sound played!")
      
      // No kick animation for body bounces
    }
    
    console.log(`⚽ Ball velocity AFTER: (${ballBody.velocity.x.toFixed(1)}, ${ballBody.velocity.y.toFixed(1)})`)
    console.log(`✅ BALL CONTACT COMPLETED!`)
  }

  private handlePlayerCollision(): void {
    if (!this.isGameActive || this.gameUI.isPaused()) return
    
    // Check if either player is sliding
    if (this.player1.isSliding() && !this.player2.isSliding()) {
      this.player2.stun()
      this.showStunEffect(this.player2, this.stunStars2)
    } else if (this.player2.isSliding() && !this.player1.isSliding()) {
      this.player1.stun()
      this.showStunEffect(this.player1, this.stunStars1)
    }
  }

  private showStunEffect(player: Player, stunStars: Phaser.GameObjects.Image): void {
    stunStars.setPosition(player.x, player.y - 30) // Closer to player head
    stunStars.setVisible(true)
    
    // Rotate stars - slower and less dramatic
    this.tweens.add({
      targets: stunStars,
      angle: 360,
      duration: 800, // Much faster rotation
      repeat: -1
    })
    
    // Hide after shorter stun duration
    this.time.delayedCall(800, () => { // Much shorter duration
      stunStars.setVisible(false)
      this.tweens.killTweensOf(stunStars)
      stunStars.setAngle(0)
    })
  }

  private handleGoal(scoringPlayer: 1 | 2): void {
    console.log(`🎯 GOAL SCORED! Player ${scoringPlayer} scores!`)
    console.log(`⚽ Ball position: (${this.ball.x.toFixed(1)}, ${this.ball.y.toFixed(1)})`)
    console.log(`🥅 Left goal: (${this.leftGoal.x.toFixed(1)}, ${this.leftGoal.y.toFixed(1)})`)
    console.log(`🥅 Right goal: (${this.rightGoal.x.toFixed(1)}, ${this.rightGoal.y.toFixed(1)})`)
    
    if (!this.isGameActive) {
      console.log(`❌ Game not active, ignoring goal`)
      return
    }
    
    // **PREVENT DUPLICATE GOALS** - check if goal was already scored recently
    const now = this.time.now
    if (this.lastGoalTime && now - this.lastGoalTime < 1000) {
      console.log(`❌ Goal already scored recently, ignoring duplicate`)
      return
    }
    this.lastGoalTime = now
    
    // **IMMEDIATELY STOP ALL MOVEMENT TO PREVENT POST-GOAL DRIFT**
    this.isGameActive = false
    const p1Body = this.player1.body as Phaser.Physics.Arcade.Body
    const p2Body = this.player2.body as Phaser.Physics.Arcade.Body
    const ballBody = this.ball.body as Phaser.Physics.Arcade.Body
    if (p1Body) p1Body.setVelocity(0, 0)
    if (p2Body) p2Body.setVelocity(0, 0)
    if (ballBody) ballBody.setVelocity(0, 0)
    
    // Show GOAL text on the ball
    this.showGoalTextOnBall()
    
    // Update scores and trigger goal celebration
    if (scoringPlayer === 1) {
      this.player1Score++
      console.log(`🔵 Player 1 score: ${this.player1Score}`)
      this.rightGoal.celebrateGoal() // Ball went into right goal
    } else {
      this.player2Score++
      console.log(`🔴 Player 2 score: ${this.player2Score}`)
      this.leftGoal.celebrateGoal() // Ball went into left goal
    }
    
    // Update UI (only score, no center screen goal text)
    this.gameUI.updateScore(this.player1Score, this.player2Score)
    
    // Play celebration sounds
    this.goalCheerSound.play()
    this.whistleSound.play()
    
    // Show celebration effects
    this.effectsManager.showGoalCelebration(scoringPlayer === 1 ? "right" : "left")
    
    // Celebrate goal animation
    const scoringGoal = scoringPlayer === 1 ? this.rightGoal : this.leftGoal
    scoringGoal.celebrateGoal()
    
    // Check for match end conditions (first_to_goals mode)
    if (this.gameManager.shouldMatchEnd(this.player1Score, this.player2Score)) {
      console.log(`🏆 Match ended! Goal limit reached.`)
      this.time.delayedCall(gameConfig.goalCelebrationTime.value * 1000, () => {
        this.hideGoalTextOnBall()
        this.endMatch()
      })
      return
    }
    
    // Reset after celebration (game already stopped above)
    this.time.delayedCall(gameConfig.goalCelebrationTime.value * 1000, () => {
      this.hideGoalTextOnBall()
      this.resetToKickoff()
    })
  }

  private endMatch(): void {
    // Determine winner
    const winner = this.player1Score > this.player2Score ? 1 : 
                   (this.player2Score > this.player1Score ? 2 : 0)
    
    // Play match end sound
    this.matchEndSound.play()
    this.effectsManager.showMatchEnd()
    
    // Record tournament result if applicable
    if (this.gameMode === "tournament") {
      this.gameManager.recordMatchResult(this.player1Score, this.player2Score)
    }
    
    // Stop power-ups
    this.powerUpManager.stopSpawning()
    
    // Trigger game end
    this.events.emit("gameEnd", {
      player1Score: this.player1Score,
      player2Score: this.player2Score,
      winner: winner
    })
  }

  private handleGameEnd(data: { player1Score: number, player2Score: number, winner: number }): void {
    console.log("🏁 GameScene: handleGameEnd called with data:", data)
    
    this.isGameActive = false
    this.backgroundMusic.stop()
    
    // Prepare victory data
    const victoryData = {
      winner: data.winner,
      player1Score: data.player1Score,
      player2Score: data.player2Score,
      gameMode: this.gameMode
    }
    
    console.log("🏆 Transitioning to VictoryScene with data:", victoryData)
    
    // Add transition effect
    const transitionRect = this.add.rectangle(
      screenSize.width.value / 2,
      screenSize.height.value / 2,
      screenSize.width.value,
      screenSize.height.value,
      0x000000,
      0
    )
    transitionRect.setDepth(1001)
    
    // Fade to black then go to victory scene
    this.tweens.add({
      targets: transitionRect,
      alpha: 1,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        console.log("🎬 Starting VictoryScene...")
        this.scene.start("VictoryScene", victoryData)
      }
    })
  }

  private pauseGame(): void {
    this.gameUI.pauseGame()
    this.physics.pause()
    this.backgroundMusic.pause()
  }

  private resumeGame(): void {
    this.gameUI.resumeGame()
    this.physics.resume()
    this.backgroundMusic.resume()
  }

  update(time: number, delta: number): void {
    if (!this.isGameActive || this.gameUI.isPaused()) return
    
    // Update combo system
    this.comboSystem.update()
    
    // Get mobile input state
    const mobileInput = this.mobileControls.inputState
    
    // Update players
    if (this.gameMode === "1v1" || this.gameMode === "tournament") {
      // Player 1 (WASD + Space + Mobile controls)
      this.player1.update(delta, 
        this.wasdKeys.A.isDown || mobileInput.left, 
        this.wasdKeys.D.isDown || mobileInput.right, 
        this.wasdKeys.W.isDown || mobileInput.up, 
        this.wasdKeys.S.isDown || mobileInput.down, 
        this.spaceKey.isDown || mobileInput.kick
      )
      
      // Player 2 (Arrow keys + Shift) - No mobile controls for player 2 in 1v1
      this.player2.update(delta, 
        this.cursors.left!.isDown, 
        this.cursors.right!.isDown, 
        this.cursors.up!.isDown, 
        this.cursors.down!.isDown, 
        this.shiftKey.isDown
      )
    } else {
      // Player 1 vs AI (Mobile controls + Keyboard)
      this.player1.update(delta, 
        this.wasdKeys.A.isDown || mobileInput.left, 
        this.wasdKeys.D.isDown || mobileInput.right, 
        this.wasdKeys.W.isDown || mobileInput.up, 
        this.wasdKeys.S.isDown || mobileInput.down, 
        this.spaceKey.isDown || mobileInput.kick
      )
      
      // AI controls player 2
      if (this.aiController) {
        this.aiController.update(delta)
      }
    }
    
    // Update ball for stability checks
    this.ball.update()
    
    // MANUAL COLLISION DETECTION as backup
    this.checkManualCollisions()
    
    // Debug: Log positions and distances every few seconds
    if (Math.floor(time / 1000) % 2 === 0 && time % 1000 < 50) {
      const distToP1 = Phaser.Math.Distance.Between(this.ball.x, this.ball.y, this.player1.x, this.player1.y)
      const distToP2 = Phaser.Math.Distance.Between(this.ball.x, this.ball.y, this.player2.x, this.player2.y)
      const distToLeftGoal = Phaser.Math.Distance.Between(this.ball.x, this.ball.y, this.leftGoal.x, this.leftGoal.y)
      const distToRightGoal = Phaser.Math.Distance.Between(this.ball.x, this.ball.y, this.rightGoal.x, this.rightGoal.y)
      
      console.log(`⚽ Ball:(${Math.round(this.ball.x)},${Math.round(this.ball.y)}) | P1:(${Math.round(this.player1.x)},${Math.round(this.player1.y)}) | P2:(${Math.round(this.player2.x)},${Math.round(this.player2.y)})`)
      console.log(`📏 Player distances: P1=${Math.round(distToP1)}, P2=${Math.round(distToP2)} | Collision threshold: 70`)
      console.log(`🥅 Goal distances: Left=${Math.round(distToLeftGoal)}, Right=${Math.round(distToRightGoal)}`)
    }
    
    // **FIXED CAMERA** - no longer follows ball, stay centered on field
    const fixedCameraX = screenSize.width.value / 2 // Center of screen
    const fixedCameraY = screenSize.height.value / 2 // Center of screen
    
    this.cameras.main.centerOn(fixedCameraX, fixedCameraY)
  }

  private checkManualCollisions(): void {
    if (!this.isGameActive || this.gameUI.isPaused()) return

    const now = this.time.now
    
    // BRUTE FORCE: Simple distance detection
    const ballX = this.ball.x
    const ballY = this.ball.y
    const player1X = this.player1.x
    const player1Y = this.player1.y  
    const player2X = this.player2.x
    const player2Y = this.player2.y

    // Simple distance threshold
    const collisionDistance = 70
    
    const distToP1 = Math.sqrt((ballX - player1X) ** 2 + (ballY - player1Y) ** 2)
    const distToP2 = Math.sqrt((ballX - player2X) ** 2 + (ballY - player2Y) ** 2)

    // Player 1 collision check
    if (distToP1 < collisionDistance && now - this.lastManualCollisionP1 > 200) {
      console.log(`🔥 BRUTE FORCE COLLISION P1! Distance: ${Math.round(distToP1)}`)
      this.lastManualCollisionP1 = now
      this.handlePlayerBallContact(this.player1)
    }

    // Player 2 collision check
    if (distToP2 < collisionDistance && now - this.lastManualCollisionP2 > 200) {
      console.log(`🔥 BRUTE FORCE COLLISION P2! Distance: ${Math.round(distToP2)}`)
      this.lastManualCollisionP2 = now
      this.handlePlayerBallContact(this.player2)
    }
    
    // **SIMPLIFIED GOAL DETECTION** - direct position check
    const leftGoalX = this.leftGoal.x    // Should be ~76
    const rightGoalX = this.rightGoal.x  // Should be ~1076
    const goalY = this.leftGoal.y        // Should be groundTopY (~648)
    
    // **VERY GENEROUS GOAL DETECTION**
    const goalHeight = fieldConfig.goalHeight.value // 80
    
    // Left goal detection - ball passes the goal line
    if (ballX <= leftGoalX + 20 && // Ball crosses goal line (with buffer)
        ballY >= goalY - goalHeight - 20 && // Ball is high enough
        ballY <= goalY + 20) { // Ball is low enough
      console.log(`🥅 LEFT GOAL! Ball: (${ballX.toFixed(1)}, ${ballY.toFixed(1)}) | Goal line: ${leftGoalX + 20}`)
      if (now - this.lastGoalTime > 1000) { // Prevent spam
        this.handleGoal(2) // Player 2 scores
      }
    }
    
    // Right goal detection - ball passes the goal line
    if (ballX >= rightGoalX - 20 && // Ball crosses goal line (with buffer)
        ballY >= goalY - goalHeight - 20 && // Ball is high enough  
        ballY <= goalY + 20) { // Ball is low enough
      console.log(`🥅 RIGHT GOAL! Ball: (${ballX.toFixed(1)}, ${ballY.toFixed(1)}) | Goal line: ${rightGoalX - 20}`)
      if (now - this.lastGoalTime > 1000) { // Prevent spam
        this.handleGoal(1) // Player 1 scores
      }
    }
  }
}