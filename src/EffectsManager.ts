import Phaser from "phaser"

export class EffectsManager {
  private scene: Phaser.Scene
  private confettiEmitter!: Phaser.GameObjects.Particles.ParticleEmitter
  private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter
  private screenWidth: number
  private screenHeight: number

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.screenWidth = 1152
    this.screenHeight = 768
    
    this.setupParticles()
  }

  private setupParticles(): void {
    // Confetti particle system for celebrations
    this.confettiEmitter = this.scene.add.particles(0, 0, "particle_confetti", {
      speed: { min: 200, max: 400 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.05, end: 0.02 },
      lifespan: 3000,
      gravityY: 300,
      rotate: { min: 0, max: 360 },
      frequency: -1, // Manual emit only
      emitting: false
    })
    this.confettiEmitter.setDepth(200)
    
    // Dust particles for ground effects
    this.dustEmitter = this.scene.add.particles(0, 0, "particle_dust", {
      speed: { min: 50, max: 100 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.03, end: 0.01 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 500,
      gravityY: -50,
      frequency: -1,
      emitting: false
    })
    this.dustEmitter.setDepth(10)
  }

  // Goal celebration effects
  public showGoalCelebration(goalSide: "left" | "right"): void {
    const goalX = goalSide === "left" ? 80 : this.screenWidth - 80
    
    // Confetti burst from goal
    this.confettiEmitter.setPosition(goalX, 200)
    this.confettiEmitter.explode(50)
    
    // Additional confetti from top of screen
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const x = Phaser.Math.Between(200, this.screenWidth - 200)
        this.confettiEmitter.setPosition(x, 0)
        this.confettiEmitter.explode(30)
      })
    }
    
    // Screen flash
    this.screenFlash(0xFFD700, 0.3, 200)
    
    // Camera shake
    this.scene.cameras.main.shake(500, 0.02)
    
    console.log(`🎉 Goal celebration effect triggered!`)
  }

  // Super kick effect
  public showSuperKickEffect(x: number, y: number, direction: number): void {
    const effect = this.scene.add.image(x, y, "super_kick_effect")
    effect.setScale(0.1)
    effect.setDepth(50)
    effect.setFlipX(direction < 0)
    effect.setAlpha(0.9)
    
    // Animate the effect
    this.scene.tweens.add({
      targets: effect,
      scaleX: 0.2,
      scaleY: 0.15,
      alpha: 0,
      x: x + (direction * 150),
      duration: 400,
      ease: 'Power2',
      onComplete: () => effect.destroy()
    })
    
    // Screen shake
    this.scene.cameras.main.shake(200, 0.015)
    
    // Flash effect
    this.screenFlash(0xFF6600, 0.2, 100)
  }

  // Header effect
  public showHeaderEffect(x: number, y: number): void {
    const effect = this.scene.add.image(x, y, "header_effect")
    effect.setScale(0.05)
    effect.setDepth(50)
    effect.setAlpha(0.9)
    
    // Burst animation
    this.scene.tweens.add({
      targets: effect,
      scaleX: 0.12,
      scaleY: 0.12,
      alpha: 0,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => effect.destroy()
    })
  }

  // Slide dust effect
  public showSlideDust(x: number, y: number, direction: number): void {
    const dustX = x - (direction * 20)
    this.dustEmitter.setPosition(dustX, y)
    this.dustEmitter.explode(8)
  }

  // Landing dust effect
  public showLandingDust(x: number, y: number): void {
    this.dustEmitter.setPosition(x, y)
    this.dustEmitter.explode(5)
  }

  // Speed boost trail effect
  public showSpeedTrail(x: number, y: number): Phaser.GameObjects.Image {
    const trail = this.scene.add.image(x, y, "power_up_speed")
    trail.setScale(0.03)
    trail.setAlpha(0.5)
    trail.setTint(0x4488ff)
    trail.setDepth(5)
    
    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      scaleX: 0.01,
      scaleY: 0.01,
      duration: 300,
      onComplete: () => trail.destroy()
    })
    
    return trail
  }

  // Power boost aura effect
  public showPowerAura(x: number, y: number): void {
    const aura = this.scene.add.image(x, y, "power_up_power")
    aura.setScale(0.06)
    aura.setAlpha(0.6)
    aura.setTint(0xff4444)
    aura.setDepth(4)
    
    this.scene.tweens.add({
      targets: aura,
      scaleX: 0.12,
      scaleY: 0.12,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => aura.destroy()
    })
  }

  // Shield activation effect
  public showShieldEffect(x: number, y: number): void {
    const shield = this.scene.add.image(x, y, "power_up_shield")
    shield.setScale(0.08)
    shield.setAlpha(0.7)
    shield.setTint(0xffdd44)
    shield.setDepth(4)
    
    this.scene.tweens.add({
      targets: shield,
      scaleX: 0.15,
      scaleY: 0.15,
      alpha: 0,
      angle: 360,
      duration: 600,
      ease: 'Power2',
      onComplete: () => shield.destroy()
    })
  }

  // Screen flash effect
  public screenFlash(color: number, alpha: number, duration: number): void {
    const flash = this.scene.add.rectangle(
      this.screenWidth / 2,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
      color,
      alpha
    )
    flash.setDepth(1000)
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: duration,
      onComplete: () => flash.destroy()
    })
  }

  // Victory celebration
  public showVictoryCelebration(): void {
    // Multiple confetti bursts
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 300, () => {
        const x = Phaser.Math.Between(100, this.screenWidth - 100)
        this.confettiEmitter.setPosition(x, 0)
        this.confettiEmitter.explode(40)
      })
    }
    
    // Screen effects
    this.screenFlash(0xFFD700, 0.4, 500)
    this.scene.cameras.main.shake(1000, 0.015)
  }

  // Combo visual effect
  public showComboEffect(x: number, y: number, comboCount: number): void {
    // Create expanding ring
    const ring = this.scene.add.graphics()
    ring.setDepth(50)
    
    let ringRadius = 20
    const maxRadius = 50 + comboCount * 5
    
    // Color based on combo level
    let color = 0xFFFFFF
    if (comboCount >= 8) {
      color = 0xFF0000
    } else if (comboCount >= 5) {
      color = 0xFFA500
    } else if (comboCount >= 3) {
      color = 0xFFD700
    }
    
    const expandRing = () => {
      ring.clear()
      ring.lineStyle(3, color, 1 - (ringRadius / maxRadius))
      ring.strokeCircle(x, y, ringRadius)
      ringRadius += 3
      
      if (ringRadius < maxRadius) {
        this.scene.time.delayedCall(16, expandRing)
      } else {
        ring.destroy()
      }
    }
    
    expandRing()
  }

  // Countdown flash
  public showCountdownFlash(): void {
    this.screenFlash(0xFFFFFF, 0.3, 100)
  }

  // Match start effect
  public showMatchStart(): void {
    this.screenFlash(0x00FF00, 0.3, 300)
    this.scene.cameras.main.shake(200, 0.01)
  }

  // Match end effect
  public showMatchEnd(): void {
    this.screenFlash(0xFF0000, 0.2, 500)
  }

  public destroy(): void {
    this.confettiEmitter.destroy()
    this.dustEmitter.destroy()
  }
}
