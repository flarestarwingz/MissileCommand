/**
 * HUD and UI rendering
 */

import { RenderContext } from '../rendering/canvas';
import { Settings } from '../core/settingsManager';
import { GameState, GameStats } from '../core/gameState';
import { AIInstance } from '../entities/ai';

export class HUD {
  private visible: boolean = true;
  private expandedSections: Set<string> = new Set();

  constructor() {
    this.expandedSections.add('settings');
  }

  /**
   * Toggle visibility
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  /**
   * Is visible?
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Toggle section expansion
   */
  toggleSection(section: string): void {
    if (this.expandedSections.has(section)) {
      this.expandedSections.delete(section);
    } else {
      this.expandedSections.add(section);
    }
  }

  /**
   * Render HUD
   */
  render(
    ctx: RenderContext,
    gameState: GameState,
    settings: Settings,
    aiInstances: AIInstance[],
    fps: number
  ): void {
    if (!this.visible) return;

    const palette = ctx.palette;
    const padding = 10;
    let yPos = padding;

    // Game info section
    if (settings.showScore) {
      ctx.ctx.fillStyle = palette.uiText;
      ctx.ctx.font = '14px monospace';
      ctx.ctx.textAlign = 'left';
      ctx.ctx.fillText(`Score: ${gameState.score}`, padding, yPos);
      yPos += 20;
    }

    if (settings.showWaveInfo) {
      ctx.ctx.fillText(`Wave: ${gameState.wave} | Level: ${gameState.level}`, padding, yPos);
      yPos += 20;
    }

    if (settings.showAICount) {
      ctx.ctx.fillText(`AIs: ${aiInstances.length}`, padding, yPos);
      yPos += 20;
    }

    if (settings.showCoordinates) {
      ctx.ctx.fillText(`Era: ${gameState.era}`, padding, yPos);
      yPos += 20;
    }

    if (settings.showFPS) {
      ctx.ctx.fillText(`FPS: ${Math.round(fps)}`, padding, yPos);
      yPos += 20;
    }

    // Debug section
    if (settings.debugMode && settings.showDebugInfo) {
      yPos += 10;
      ctx.ctx.fillStyle = palette.accent;
      ctx.ctx.fillText('[DEBUG]', padding, yPos);
      yPos += 20;

      ctx.ctx.fillStyle = palette.uiText;
      const activeAIs = aiInstances.filter(ai => ai.towers.length > 0).length;
      ctx.ctx.fillText(`Active AIs: ${activeAIs}`, padding, yPos);
      yPos += 15;

      const avgCoordination = 
        aiInstances.length > 0
          ? (aiInstances.reduce((sum, ai) => sum + ai.coordinationLevel, 0) / aiInstances.length).toFixed(2)
          : '0.00';
      ctx.ctx.fillText(`Coordination: ${avgCoordination}`, padding, yPos);
      yPos += 15;

      ctx.ctx.fillText(`Game Time: ${(gameState.gameTime / 1000).toFixed(1)}s`, padding, yPos);
      yPos += 20;
    }

    // Settings panel is now in HTML overlay - don't render here
  }

  /**
   * Render settings panel
   */
  private renderSettingsPanel(ctx: RenderContext, settings: Settings, startY: number): void {
    const palette = ctx.palette;
    const padding = 10;
    const rightX = ctx.width - 250;
    let yPos = startY + padding;

    ctx.ctx.fillStyle = palette.uiText;
    ctx.ctx.font = '12px monospace';
    ctx.ctx.textAlign = 'right';

    // Settings header
    const isExpanded = this.expandedSections.has('settings');
    ctx.ctx.fillText(`[${isExpanded ? '-' : '+'}] Settings`, ctx.width - padding, yPos);
    yPos += 20;

    if (isExpanded) {
      ctx.ctx.font = '11px monospace';
      ctx.ctx.fillText(`Difficulty: ${settings.difficulty}`, ctx.width - padding, yPos);
      yPos += 15;

      ctx.ctx.fillText(`Speed: ${settings.gameSpeed.toFixed(1)}x`, ctx.width - padding, yPos);
      yPos += 15;

      ctx.ctx.fillText(`Palette: ${settings.colorPalette}`, ctx.width - padding, yPos);
      yPos += 20;

      // Debug subsection
      if (settings.debugMode) {
        const debugExpanded = this.expandedSections.has('debug');
        ctx.ctx.fillStyle = palette.accent;
        ctx.ctx.fillText(
          `[${debugExpanded ? '-' : '+'}] Debug Tools`,
          ctx.width - padding,
          yPos
        );
        yPos += 15;

        if (debugExpanded) {
          ctx.ctx.fillStyle = palette.uiText;
          ctx.ctx.fillText(
            `Repair Mult: ${settings.repairRateMultiplier.toFixed(1)}x`,
            ctx.width - padding,
            yPos
          );
          yPos += 15;
        }
      }
    }
  }
}

/**
 * Game Over Screen
 */
export class GameOverScreen {
  private startTime: number = 0;
  private duration: number = 10; // 10 seconds
  private visible: boolean = false;

  /**
   * Show game over screen
   */
  show(currentTime: number): void {
    this.visible = true;
    this.startTime = currentTime;
  }

  /**
   * Is visible?
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Get remaining time
   */
  getRemainingTime(currentTime: number): number {
    const elapsed = (currentTime - this.startTime) / 1000;
    const remaining = Math.max(0, this.duration - elapsed);
    return remaining;
  }

  /**
   * Is expired?
   */
  isExpired(currentTime: number): boolean {
    return this.getRemainingTime(currentTime) <= 0;
  }

  /**
   * Hide screen
   */
  hide(): void {
    this.visible = false;
  }

  /**
   * Render game over screen
   */
  render(ctx: RenderContext, stats: GameStats, currentTime: number): void {
    if (!this.visible) return;

    const palette = ctx.palette;
    const remaining = this.getRemainingTime(currentTime);

    // Semi-transparent overlay
    ctx.ctx.fillStyle = palette.background;
    ctx.ctx.globalAlpha = 0.8;
    ctx.ctx.fillRect(0, 0, ctx.width, ctx.height);
    ctx.ctx.globalAlpha = 1.0;

    // Game Over text
    ctx.ctx.fillStyle = palette.enemy;
    ctx.ctx.font = 'bold 48px monospace';
    ctx.ctx.textAlign = 'center';
    ctx.ctx.fillText('GAME OVER', ctx.width / 2, ctx.height / 2 - 60);

    // Stats
    ctx.ctx.fillStyle = palette.uiText;
    ctx.ctx.font = '18px monospace';
    const lineHeight = 30;
    let yPos = ctx.height / 2;

    ctx.ctx.fillText(`Score: ${stats.score}`, ctx.width / 2, yPos);
    yPos += lineHeight;

    ctx.ctx.fillText(`Wave: ${stats.wave}`, ctx.width / 2, yPos);
    yPos += lineHeight;

    ctx.ctx.fillText(`Level: ${stats.level}`, ctx.width / 2, yPos);
    yPos += lineHeight;

    ctx.ctx.fillText(`Era: ${stats.era}`, ctx.width / 2, yPos);
    yPos += lineHeight;

    ctx.ctx.fillText(`Cities Lost: ${stats.citiesDestroyed}`, ctx.width / 2, yPos);
    yPos += lineHeight;

    ctx.ctx.fillText(`Enemies Destroyed: ${stats.enemiesDestroyed}`, ctx.width / 2, yPos);
    yPos += lineHeight + 10;

    // Countdown
    ctx.ctx.fillStyle = palette.accent;
    ctx.ctx.font = '24px monospace';
    ctx.ctx.fillText(`Restarting in ${Math.ceil(remaining)}s...`, ctx.width / 2, yPos);
  }
}
