import Phaser from "phaser"
import { Player } from "./Player"
import { audioConfig } from "./gameConfig.json"

export type PowerUpType = "speed" | "power" | "shield"

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  public powerUpType: PowerUpType
  private duration: number = 5000 // 5 seconds effect duration
  private floatTween!: Phaser.Tweens.Tween
  private glowTween!: Phaser.Tweens.Tween
  private collectSound!: Phaser.Sound.BaseSound
  private effectSound!: Phaser.Sound.BaseSound

  constructor(scene: Phaser.Scene, x: number, y: number, type: PowerUpType) {
    const textureKey = `power_up_${type}`
    super(scene, x, y, textureKey)
    
    this.powerUpType = type
    
    scene.add.existing(this)
    scene.physics.add.existing(this)
    
    this.setupPhysics()
    this.setupVisuals()
    this.setupSounds()
    this.startAnimations()
  }

  private setupPhysics(): void {
    if (!this.body) return
    
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setImmovable(true)
    
    // Set circular collision
    const size = 40
    body.setCircle(size / 2)
    body.setOffset(this.width / 2 - size / 2, this.height / 2 - size / 2)
  }

  private setupVisuals(): void {
    // Scale to appropriate size
    const targetSize = 50
    const scale = targetSize / Math.max(this.width, this.height)
    this.setScale(scale)
    this.setDepth(5)
    
    // Add glow effect based on type
    switch (this.powerUpType) {
      case "speed":
        this.setTint(0x4488ff) // Blue tint for speed
        break
      case "power":
        this.setTint(0xff4444) // Red tint for power
        break
      case "shield":
        this.setTint(0xffdd44) // Gold tint for shield
        break
    }
  }

  private setupSounds(): void {
    this.collectSound = this.scene.sound.add("power_up_collect", {
      volume: audioConfig.sfxVolume.value
    })
    
    // Effect-specific sound
    const effectKey = this.powerUpType === "speed" ? "speed_boost" : "power_boost"
    this.effectSound = this.scene.sound.add(effectKey, {
      volume: audioConfig.sfxVolume.value
    })
  }

  private startAnimations(): void {
    // Float up and down
    this.floatTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 15,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // Pulsing glow effect
    this.glowTween = this.scene.tweens.add({
      targets: this,
      alpha: 0.7,
      scaleX: this.scaleX * 1.1,
      scaleY: this.scaleY * 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // Rotation
    this.scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 3000,
      repeat: -1,
      ease: 'Linear'
    })
  }

  public collect(player: Player): void {
    // Play collection sound
    this.collectSound.play()
    
    // Apply effect to player
    this.applyEffect(player)
    
    // Visual collection effect
    this.showCollectEffect()
    
    // Destroy after collection animation
    this.scene.time.delayedCall(100, () => {
      this.destroy()
    })
  }

  private applyEffect(player: Player): void {
    this.effectSound.play()
    
    switch (this.powerUpType) {
      case "speed":
        player.applySpeedBoost(this.duration)
        break
      case "power":
        player.applyPowerBoost(this.duration)
        break
      case "shield":
        player.applyShield(this.duration)
        break
    }
  }

  private showCollectEffect(): void {
    // Stop existing animations
    if (this.floatTween) this.floatTween.stop()
    if (this.glowTween) this.glowTween.stop()
    
    // Burst animation
    this.scene.tweens.add({
      targets: this,
      scaleX: this.scaleX * 2,
      scaleY: this.scaleY * 2,
      alpha: 0,
      duration: 200,
      ease: 'Back.easeIn'
    })
  }

  public getDuration(): number {
    return this.duration
  }

  public destroy(): void {
    if (this.floatTween) this.floatTween.destroy()
    if (this.glowTween) this.glowTween.destroy()
    super.destroy()
  }
}

// PowerUp spawner manager
export class PowerUpManager {
  private scene: Phaser.Scene
  private powerUps: Phaser.GameObjects.Group
  private spawnTimer: Phaser.Time.TimerEvent | null = null
  private spawnInterval: number = 15000 // Spawn every 15 seconds
  private maxPowerUps: number = 2
  private groundTopY: number

  constructor(scene: Phaser.Scene, groundTopY: number) {
    this.scene = scene
    this.groundTopY = groundTopY
    this.powerUps = scene.add.group()
  }

  public startSpawning(): void {
    // Initial delay before first spawn
    this.scene.time.delayedCall(5000, () => {
      this.spawnRandomPowerUp()
      
      // Regular spawning
      this.spawnTimer = this.scene.time.addEvent({
        delay: this.spawnInterval,
        callback: this.spawnRandomPowerUp,
        callbackScope: this,
        loop: true
      })
    })
  }

  public stopSpawning(): void {
    if (this.spawnTimer) {
      this.spawnTimer.destroy()
      this.spawnTimer = null
    }
  }

  private spawnRandomPowerUp(): void {
    // Don't spawn if max reached
    if (this.powerUps.getLength() >= this.maxPowerUps) return
    
    // Random position in the play area
    const x = Phaser.Math.Between(200, 952) // Avoid goal areas
    const y = this.groundTopY - Phaser.Math.Between(100, 200) // Above ground
    
    // Random type
    const types: PowerUpType[] = ["speed", "power", "shield"]
    const randomType = types[Phaser.Math.Between(0, types.length - 1)]
    
    const powerUp = new PowerUp(this.scene, x, y, randomType)
    this.powerUps.add(powerUp)
    
    console.log(`⭐ Power-up spawned: ${randomType} at (${x}, ${y})`)
    
    // Auto-destroy after 10 seconds if not collected
    this.scene.time.delayedCall(10000, () => {
      if (powerUp.active) {
        this.fadeOutPowerUp(powerUp)
      }
    })
  }

  private fadeOutPowerUp(powerUp: PowerUp): void {
    this.scene.tweens.add({
      targets: powerUp,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        powerUp.destroy()
      }
    })
  }

  public getPowerUps(): Phaser.GameObjects.Group {
    return this.powerUps
  }

  public clearAll(): void {
    this.powerUps.clear(true, true)
  }

  public reset(): void {
    this.stopSpawning()
    this.clearAll()
  }
}
