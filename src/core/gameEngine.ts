/**
 * Main game engine
 */

import { GameState, GameStateType, GameEra } from './gameState';
import { SettingsManager, Settings } from './settingsManager';
import { Vector2 } from '../utils/math';

export class GameEngine {
  private gameState: GameState;
  private settingsManager: SettingsManager;
  private deltaTime: number = 0;
  private lastFrameTime: number = Date.now();
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;

  // Game update callback
  private onUpdate: ((deltaTime: number) => void) | null = null;
  private onGameOver: (() => void) | null = null;
  private onSettingsChanged: ((settings: Settings) => void) | null = null;

  constructor(
    width: number = 800,
    height: number = 600,
    initialSettings?: Partial<Settings>
  ) {
    this.gameState = new GameState();
    this.gameState.viewportWidth = width;
    this.gameState.viewportHeight = height;

    this.settingsManager = new SettingsManager(initialSettings);
    this.settingsManager.onChange(settings => {
      if (this.onSettingsChanged) {
        this.onSettingsChanged(settings);
      }
    });
  }

  /**
   * Get game state
   */
  getGameState(): GameState {
    return this.gameState;
  }

  /**
   * Get settings manager
   */
  getSettings(): SettingsManager {
    return this.settingsManager;
  }

  /**
   * Resize viewport
   */
  resize(width: number, height: number): void {
    this.gameState.viewportWidth = width;
    this.gameState.viewportHeight = height;
  }

  /**
   * Set update callback
   */
  setOnUpdate(callback: (deltaTime: number) => void): void {
    this.onUpdate = callback;
  }

  /**
   * Set game over callback
   */
  setOnGameOver(callback: () => void): void {
    this.onGameOver = callback;
  }

  /**
   * Set settings changed callback
   */
  setOnSettingsChanged(callback: (settings: Settings) => void): void {
    this.onSettingsChanged = callback;
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = Date.now();
    this.gameLoop();
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /**
   * Pause the game
   */
  pause(): void {
    this.gameState.isPaused = true;
  }

  /**
   * Resume the game
   */
  resume(): void {
    this.gameState.isPaused = false;
  }

  /**
   * Handle game over
   */
  gameOver(): void {
    this.gameState.state = GameStateType.GAME_OVER;
    this.gameState.gameOverTime = this.gameState.gameTime;
    if (this.onGameOver) {
      this.onGameOver();
    }
  }

  /**
   * Reset the game
   */
  reset(): void {
    this.gameState.reset();
  }

  /**
   * Set game speed
   */
  setGameSpeed(speed: number): void {
    this.settingsManager.updateSettings({ gameSpeed: speed });
  }

  /**
   * Get current delta time
   */
  getDeltaTime(): number {
    return this.deltaTime;
  }

  /**
   * Game loop
   */
  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const now = Date.now();
    let rawDelta = (now - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = now;

    // Clamp delta time to prevent large jumps
    rawDelta = Math.min(rawDelta, 0.033); // Cap at 33ms (30 FPS minimum)

    // Apply game speed multiplier
    const gameSpeed = this.settingsManager.getSetting('gameSpeed');
    this.deltaTime = rawDelta * gameSpeed;

    if (!this.gameState.isPaused) {
      this.gameState.gameTime += this.deltaTime * 1000; // Convert back to milliseconds
    }

    if (this.onUpdate) {
      this.onUpdate(this.deltaTime);
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };
}
