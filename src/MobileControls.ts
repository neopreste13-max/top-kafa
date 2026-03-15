import Phaser from "phaser"

export interface MobileInputState {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  kick: boolean
}

export class MobileControls {
  private scene: Phaser.Scene
  private container!: Phaser.GameObjects.Container
  
  // Input state for player
  public inputState: MobileInputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    kick: false
  }
  
  // Buttons
  private leftBtn!: Phaser.GameObjects.Arc
  private rightBtn!: Phaser.GameObjects.Arc
  private jumpBtn!: Phaser.GameObjects.Arc
  private slideBtn!: Phaser.GameObjects.Arc
  private kickBtn!: Phaser.GameObjects.Arc
  
  // Button labels
  private leftLabel!: Phaser.GameObjects.Text
  private rightLabel!: Phaser.GameObjects.Text
  private jumpLabel!: Phaser.GameObjects.Text
  private slideLabel!: Phaser.GameObjects.Text
  private kickLabel!: Phaser.GameObjects.Text
  
  // Settings
  private buttonSize = 45
  private buttonAlpha = 0.6
  private buttonActiveAlpha = 0.9
  private padding = 20
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.createControls()
  }
  
  private createControls(): void {
    const screenWidth = this.scene.scale.width
    const screenHeight = this.scene.scale.height
    
    this.container = this.scene.add.container(0, 0)
    this.container.setDepth(1000) // Above everything
    this.container.setScrollFactor(0) // Fixed to camera
    
    // ===== LEFT SIDE - Movement Controls =====
    const leftBaseX = this.padding + this.buttonSize
    const leftBaseY = screenHeight - this.padding - this.buttonSize
    
    // Left button
    this.leftBtn = this.createButton(
      leftBaseX - this.buttonSize - 10,
      leftBaseY,
      0x4488ff,
      () => { this.inputState.left = true },
      () => { this.inputState.left = false }
    )
    this.leftLabel = this.createLabel(this.leftBtn.x, this.leftBtn.y, "◀")
    
    // Right button
    this.rightBtn = this.createButton(
      leftBaseX + this.buttonSize + 10,
      leftBaseY,
      0x4488ff,
      () => { this.inputState.right = true },
      () => { this.inputState.right = false }
    )
    this.rightLabel = this.createLabel(this.rightBtn.x, this.rightBtn.y, "▶")
    
    // Jump button (above left/right)
    this.jumpBtn = this.createButton(
      leftBaseX,
      leftBaseY - this.buttonSize - 30,
      0x44ff44,
      () => { this.inputState.up = true },
      () => { this.inputState.up = false }
    )
    this.jumpLabel = this.createLabel(this.jumpBtn.x, this.jumpBtn.y, "▲")
    
    // Slide button (below, between left/right)
    this.slideBtn = this.createButton(
      leftBaseX,
      leftBaseY + this.buttonSize + 10,
      0xffaa00,
      () => { this.inputState.down = true },
      () => { this.inputState.down = false }
    )
    this.slideLabel = this.createLabel(this.slideBtn.x, this.slideBtn.y, "▼")
    
    // ===== RIGHT SIDE - Action Controls =====
    const rightBaseX = screenWidth - this.padding - this.buttonSize
    const rightBaseY = screenHeight - this.padding - this.buttonSize - 20
    
    // Kick button (larger)
    this.kickBtn = this.createButton(
      rightBaseX,
      rightBaseY,
      0xff4444,
      () => { this.inputState.kick = true },
      () => { this.inputState.kick = false },
      this.buttonSize * 1.3 // Larger kick button
    )
    this.kickLabel = this.createLabel(this.kickBtn.x, this.kickBtn.y, "KICK")
    this.kickLabel.setFontSize(16)
    
    // Add all to container
    this.container.add([
      this.leftBtn, this.rightBtn, this.jumpBtn, this.slideBtn, this.kickBtn,
      this.leftLabel, this.rightLabel, this.jumpLabel, this.slideLabel, this.kickLabel
    ])
    
    console.log("📱 Mobile controls created!")
  }
  
  private createButton(
    x: number, 
    y: number, 
    color: number, 
    onDown: () => void, 
    onUp: () => void,
    size: number = this.buttonSize
  ): Phaser.GameObjects.Arc {
    const btn = this.scene.add.circle(x, y, size, color, this.buttonAlpha)
    btn.setStrokeStyle(3, 0xffffff, 0.8)
    btn.setInteractive()
    
    // Touch events
    btn.on('pointerdown', () => {
      btn.setAlpha(this.buttonActiveAlpha)
      btn.setScale(0.9)
      onDown()
    })
    
    btn.on('pointerup', () => {
      btn.setAlpha(this.buttonAlpha)
      btn.setScale(1)
      onUp()
    })
    
    btn.on('pointerout', () => {
      btn.setAlpha(this.buttonAlpha)
      btn.setScale(1)
      onUp()
    })
    
    return btn
  }
  
  private createLabel(x: number, y: number, text: string): Phaser.GameObjects.Text {
    const label = this.scene.add.text(x, y, text, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    label.setOrigin(0.5, 0.5)
    return label
  }
  
  // Check if device is mobile/touch
  public static isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0)
  }
  
  // Show/hide controls
  public setVisible(visible: boolean): void {
    this.container.setVisible(visible)
  }
  
  // Reset all inputs
  public resetInputs(): void {
    this.inputState.left = false
    this.inputState.right = false
    this.inputState.up = false
    this.inputState.down = false
    this.inputState.kick = false
  }
  
  // Destroy controls
  public destroy(): void {
    this.container.destroy()
  }
}
