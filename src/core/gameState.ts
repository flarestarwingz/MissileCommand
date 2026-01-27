/**
 * Core game state management
 */

import { Vector2 } from '../utils/math';

export enum GameEra {
  METEORS = 'meteors',
  EIGHTIES_MISSILES = 'eighties_missiles',
  NINETIES_ASTEROIDS = 'nineties_asteroids',
  TWO_THOUSANDS = 'two_thousands',
  FUTURE = 'future',
}

export interface GameStats {
  score: number;
  wave: number;
  level: number;
  era: GameEra;
  citiesDestroyed: number;
  enemiesDestroyed: number;
}

export enum GameStateType {
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
}

export class GameState {
  // Game progress
  score: number = 0;
  wave: number = 0;
  level: number = 0;
  era: GameEra = GameEra.METEORS;
  citiesDestroyed: number = 0;
  enemiesDestroyed: number = 0;
  
  // Game time
  gameTime: number = 0; // in milliseconds
  waveStartTime: number = 0;
  gameOverTime: number = 0;
  
  // State
  state: GameStateType = GameStateType.PLAYING;
  isPaused: boolean = false;
  
  // Viewport
  viewportWidth: number = 0;
  viewportHeight: number = 0;
  
  /**
   * Get current game era based on level
   */
  static getEraFromLevel(level: number): GameEra {
    if (level < 5) return GameEra.METEORS;
    if (level < 10) return GameEra.EIGHTIES_MISSILES;
    if (level < 15) return GameEra.NINETIES_ASTEROIDS;
    if (level < 20) return GameEra.TWO_THOUSANDS;
    return GameEra.FUTURE;
  }

  /**
   * Update game era based on current level
   */
  updateEra(): void {
    this.era = GameState.getEraFromLevel(this.level);
  }

  /**
   * Progress to next wave
   */
  nextWave(): void {
    this.wave++;
    this.level = Math.floor(this.wave / 5) + 1;
    this.updateEra();
    this.waveStartTime = this.gameTime;
  }

  /**
   * Get game over stats
   */
  getGameOverStats(): GameStats {
    return {
      score: this.score,
      wave: this.wave,
      level: this.level,
      era: this.era,
      citiesDestroyed: this.citiesDestroyed,
      enemiesDestroyed: this.enemiesDestroyed,
    };
  }

  /**
   * Reset game state
   */
  reset(): void {
    this.score = 0;
    this.wave = 0;
    this.level = 0;
    this.era = GameEra.METEORS;
    this.citiesDestroyed = 0;
    this.enemiesDestroyed = 0;
    this.gameTime = 0;
    this.waveStartTime = 0;
    this.gameOverTime = 0;
    this.state = GameStateType.PLAYING;
    this.isPaused = false;
  }

  /**
   * Get wave duration in seconds
   */
  getWaveDuration(): number {
    return (this.gameTime - this.waveStartTime) / 1000;
  }
}
