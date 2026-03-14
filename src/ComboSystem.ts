import Phaser from "phaser"
import { audioConfig } from "./gameConfig.json"

export type ComboAction = "kick" | "header" | "slide_kick" | "jump_kick" | "super_kick"

export interface ComboState {
  count: number
  lastAction: ComboAction | null
  lastActionTime: number
  multiplier: number
}

export class ComboSystem {
  private scene: Phaser.Scene
  private player1Combo: ComboState
  private player2Combo: ComboState
  private comboTimeout: number = 3000 // Combo resets after 3 seconds of no action
  private maxCombo: number = 10
  private comboSound!: Phaser.Sound.BaseSound
  
  // Visual elements
  private player1ComboText!: Phaser.GameObjects.Text
  private player2ComboText!: Phaser.GameObjects.Text
  private player1ComboIndicator!: Phaser.GameObjects.Image
  private player2ComboIndicator!: Phaser.GameObjects.Image

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    
    this.player1Combo = this.createInitialComboState()
    this.player2Combo = this.createInitialComboState()
    
    this.setupSounds()
    this.createVisualElements()
  }

  private createInitialComboState(): ComboState {
    return {
      count: 0,
      lastAction: null,
      lastActionTime: 0,
      multiplier: 1.0
    }
  }

  private setupSounds(): void {
    this.comboSound = this.scene.sound.add("combo_hit", {
      volume: audioConfig.sfxVolume.value
    })
  }

  private createVisualElements(): void {
    const screenWidth = 1152
    const screenHeight = 768
    
    // Player 1 combo display (left side)
    this.player1ComboIndicator = this.scene.add.image(150, 100, "combo_indicator")
    this.player1ComboIndicator.setScale(0.08)
    this.player1ComboIndicator.setVisible(false)
    this.player1ComboIndicator.setDepth(100)
    
    this.player1ComboText = this.scene.add.text(150, 100, "", {
      fontSize: "28px",
      fontFamily: "RetroPixel",
      color: "#FFD700",
      stroke: "#000000",
      strokeThickness: 4
    })
    this.player1ComboText.setOrigin(0.5, 0.5)
    this.player1ComboText.setDepth(101)
    
    // Player 2 combo display (right side)
    this.player2ComboIndicator = this.scene.add.image(screenWidth - 150, 100, "combo_indicator")
    this.player2ComboIndicator.setScale(0.08)
    this.player2ComboIndicator.setVisible(false)
    this.player2ComboIndicator.setDepth(100)
    
    this.player2ComboText = this.scene.add.text(screenWidth - 150, 100, "", {
      fontSize: "28px",
      fontFamily: "RetroPixel",
      color: "#FFD700",
      stroke: "#000000",
      strokeThickness: 4
    })
    this.player2ComboText.setOrigin(0.5, 0.5)
    this.player2ComboText.setDepth(101)
  }

  public registerAction(playerNum: 1 | 2, action: ComboAction): number {
    const comboState = playerNum === 1 ? this.player1Combo : this.player2Combo
    const currentTime = this.scene.time.now
    
    // Check if combo should reset (timeout)
    if (currentTime - comboState.lastActionTime > this.comboTimeout) {
      this.resetCombo(playerNum)
    }
    
    // Check if this is a different action (variety bonus)
    const varietyBonus = comboState.lastAction !== action ? 0.2 : 0
    
    // Increment combo
    comboState.count = Math.min(comboState.count + 1, this.maxCombo)
    comboState.lastAction = action
    comboState.lastActionTime = currentTime
    
    // Calculate multiplier
    comboState.multiplier = this.calculateMultiplier(comboState.count, varietyBonus)
    
    // Play combo sound with pitch increase
    this.playComboSound(comboState.count)
    
    // Show visual feedback
    this.showComboFeedback(playerNum, comboState)
    
    console.log(`⚡ Player ${playerNum} COMBO: ${comboState.count}x (${action}) - Multiplier: ${comboState.multiplier.toFixed(2)}x`)
    
    return comboState.multiplier
  }

  private calculateMultiplier(comboCount: number, varietyBonus: number): number {
    // Base multiplier increases with combo count
    // 1x at 0, 1.5x at 5, 2x at 10
    const baseMultiplier = 1.0 + (comboCount * 0.1)
    return Math.min(baseMultiplier + varietyBonus, 2.5) // Cap at 2.5x
  }

  private playComboSound(comboCount: number): void {
    // Increase pitch with combo count
    const rate = 0.8 + (comboCount * 0.1)
    this.comboSound.play({
      rate: Math.min(rate, 1.5),
      volume: audioConfig.sfxVolume.value * Math.min(1, 0.5 + comboCount * 0.1)
    })
  }

  private showComboFeedback(playerNum: 1 | 2, comboState: ComboState): void {
    const indicator = playerNum === 1 ? this.player1ComboIndicator : this.player2ComboIndicator
    const text = playerNum === 1 ? this.player1ComboText : this.player2ComboText
    
    // Show elements
    indicator.setVisible(true)
    text.setVisible(true)
    text.setText(`${comboState.count}x`)
    
    // Color based on combo level
    let color = "#FFFFFF"
    if (comboState.count >= 8) {
      color = "#FF0000" // Red for high combo
    } else if (comboState.count >= 5) {
      color = "#FFA500" // Orange for medium
    } else if (comboState.count >= 3) {
      color = "#FFD700" // Gold for low
    }
    text.setColor(color)
    
    // Pulse animation
    this.scene.tweens.add({
      targets: [indicator, text],
      scaleX: indicator.scaleX * 1.3,
      scaleY: indicator.scaleY * 1.3,
      duration: 100,
      yoyo: true,
      ease: 'Back.easeOut'
    })
    
    // Hide after timeout with fade
    this.scene.time.delayedCall(this.comboTimeout, () => {
      if (comboState.count === 0) {
        this.scene.tweens.add({
          targets: [indicator, text],
          alpha: 0,
          duration: 300,
          onComplete: () => {
            indicator.setVisible(false)
            text.setVisible(false)
            indicator.setAlpha(1)
            text.setAlpha(1)
          }
        })
      }
    })
  }

  public resetCombo(playerNum: 1 | 2): void {
    const comboState = playerNum === 1 ? this.player1Combo : this.player2Combo
    
    if (comboState.count > 0) {
      console.log(`💔 Player ${playerNum} combo broken! Was ${comboState.count}x`)
    }
    
    comboState.count = 0
    comboState.lastAction = null
    comboState.multiplier = 1.0
    
    // Hide visual elements
    const indicator = playerNum === 1 ? this.player1ComboIndicator : this.player2ComboIndicator
    const text = playerNum === 1 ? this.player1ComboText : this.player2ComboText
    indicator.setVisible(false)
    text.setVisible(false)
  }

  public getComboState(playerNum: 1 | 2): ComboState {
    return playerNum === 1 ? { ...this.player1Combo } : { ...this.player2Combo }
  }

  public getMultiplier(playerNum: 1 | 2): number {
    const comboState = playerNum === 1 ? this.player1Combo : this.player2Combo
    
    // Check if combo has timed out
    if (this.scene.time.now - comboState.lastActionTime > this.comboTimeout) {
      return 1.0
    }
    
    return comboState.multiplier
  }

  public update(): void {
    const currentTime = this.scene.time.now
    
    // Auto-reset combos after timeout
    if (this.player1Combo.count > 0 && currentTime - this.player1Combo.lastActionTime > this.comboTimeout) {
      this.resetCombo(1)
    }
    
    if (this.player2Combo.count > 0 && currentTime - this.player2Combo.lastActionTime > this.comboTimeout) {
      this.resetCombo(2)
    }
  }

  public reset(): void {
    this.resetCombo(1)
    this.resetCombo(2)
  }

  public destroy(): void {
    this.player1ComboIndicator.destroy()
    this.player2ComboIndicator.destroy()
    this.player1ComboText.destroy()
    this.player2ComboText.destroy()
  }
}
