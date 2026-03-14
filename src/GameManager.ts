// GameManager - Central game state and settings management
export type GameMode = "1v1" | "1vAI" | "tournament"
export type AIDifficulty = "easy" | "medium" | "hard"
export type MatchType = "timed" | "first_to_goals"

export interface GameSettings {
  gameMode: GameMode
  aiDifficulty: AIDifficulty
  matchType: MatchType
  matchTime: number // seconds for timed matches
  goalLimit: number // goals needed for first_to_goals
  player1Character: string
  player2Character: string
}

export interface TournamentState {
  currentRound: number
  totalRounds: number
  player1Wins: number
  player2Wins: number
  matchHistory: Array<{ player1Score: number, player2Score: number, winner: number }>
}

class GameManager {
  private static instance: GameManager
  private settings: GameSettings
  private tournamentState: TournamentState | null = null

  private constructor() {
    // Default settings
    this.settings = {
      gameMode: "1v1",
      aiDifficulty: "medium",
      matchType: "timed",
      matchTime: 90,
      goalLimit: 5,
      player1Character: "messi",
      player2Character: "ronaldo"
    }
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager()
    }
    return GameManager.instance
  }

  // Settings getters and setters
  public getSettings(): GameSettings {
    return { ...this.settings }
  }

  public setGameMode(mode: GameMode): void {
    this.settings.gameMode = mode
    console.log(`🎮 Game mode set to: ${mode}`)
  }

  public setAIDifficulty(difficulty: AIDifficulty): void {
    this.settings.aiDifficulty = difficulty
    console.log(`🤖 AI difficulty set to: ${difficulty}`)
  }

  public setMatchType(type: MatchType): void {
    this.settings.matchType = type
    console.log(`⚽ Match type set to: ${type}`)
  }

  public setMatchTime(time: number): void {
    this.settings.matchTime = time
    console.log(`⏱️ Match time set to: ${time} seconds`)
  }

  public setGoalLimit(goals: number): void {
    this.settings.goalLimit = goals
    console.log(`🥅 Goal limit set to: ${goals}`)
  }

  public setPlayer1Character(character: string): void {
    this.settings.player1Character = character
    console.log(`👤 Player 1 character: ${character}`)
  }

  public setPlayer2Character(character: string): void {
    this.settings.player2Character = character
    console.log(`👤 Player 2 character: ${character}`)
  }

  // Tournament management
  public startTournament(rounds: number = 3): void {
    this.settings.gameMode = "tournament"
    this.tournamentState = {
      currentRound: 1,
      totalRounds: rounds,
      player1Wins: 0,
      player2Wins: 0,
      matchHistory: []
    }
    console.log(`🏆 Tournament started! Best of ${rounds}`)
  }

  public getTournamentState(): TournamentState | null {
    return this.tournamentState ? { ...this.tournamentState } : null
  }

  public recordMatchResult(player1Score: number, player2Score: number): void {
    if (!this.tournamentState) return

    const winner = player1Score > player2Score ? 1 : (player2Score > player1Score ? 2 : 0)
    
    this.tournamentState.matchHistory.push({ player1Score, player2Score, winner })
    
    if (winner === 1) {
      this.tournamentState.player1Wins++
    } else if (winner === 2) {
      this.tournamentState.player2Wins++
    }

    this.tournamentState.currentRound++
    
    console.log(`🏆 Match ${this.tournamentState.currentRound - 1} result: P1 ${player1Score} - ${player2Score} P2`)
    console.log(`📊 Tournament: P1 ${this.tournamentState.player1Wins} wins, P2 ${this.tournamentState.player2Wins} wins`)
  }

  public isTournamentOver(): boolean {
    if (!this.tournamentState) return true
    
    const winsNeeded = Math.ceil(this.tournamentState.totalRounds / 2)
    return this.tournamentState.player1Wins >= winsNeeded || 
           this.tournamentState.player2Wins >= winsNeeded ||
           this.tournamentState.currentRound > this.tournamentState.totalRounds
  }

  public getTournamentWinner(): number {
    if (!this.tournamentState) return 0
    
    if (this.tournamentState.player1Wins > this.tournamentState.player2Wins) return 1
    if (this.tournamentState.player2Wins > this.tournamentState.player1Wins) return 2
    return 0 // Draw
  }

  public resetTournament(): void {
    this.tournamentState = null
    this.settings.gameMode = "1v1"
    console.log("🏆 Tournament reset")
  }

  // Check if match should end (for first_to_goals mode)
  public shouldMatchEnd(player1Score: number, player2Score: number): boolean {
    if (this.settings.matchType === "first_to_goals") {
      return player1Score >= this.settings.goalLimit || player2Score >= this.settings.goalLimit
    }
    return false
  }
}

export default GameManager
