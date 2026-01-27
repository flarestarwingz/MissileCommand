/**
 * Boss and gimmick system
 */

import { Enemy } from './enemies';
import { Projectile } from './projectiles';
import { Vector2, random, randomInt } from '../utils/math';
import { GimmickConfig } from '../utils/configLoader';

export class BossManager {
  private bosses: Enemy[] = [];
  private bossSpawnChance: number = 0;
  private minimumWaveBetweenBosses: number = 0;
  private lastBossWave: number = -100;
  private gimmicksCache: Map<string, GimmickConfig[]> = new Map();

  constructor() {}

  /**
   * Set gimmicks cache
   */
  setGimmicks(gimmicks: Map<string, GimmickConfig[]>): void {
    this.gimmicksCache = gimmicks;
  }

  /**
   * Check if boss should spawn
   */
  shouldSpawnBoss(wave: number, era: string): boolean {
    // Increase boss spawn chance with waves
    this.bossSpawnChance = Math.min(0.15, wave * 0.01);
    this.minimumWaveBetweenBosses = Math.max(3, 5 - Math.floor(wave / 5));

    if (wave - this.lastBossWave < this.minimumWaveBetweenBosses) {
      return false;
    }

    return Math.random() < this.bossSpawnChance;
  }

  /**
   * Spawn a boss
   */
  spawnBoss(x: number, y: number, era: string, wave: number): Enemy | null {
    if (!this.gimmicksCache.has(era)) {
      return null;
    }

    const gimmicks = this.gimmicksCache.get(era) || [];
    
    // Find boss-like gimmicks (high health, special abilities)
    const bosses = gimmicks.filter(
      g => g.health > 100 || g.specialAbility || g.behavior === 'bombing' || g.behavior === 'stationary'
    );

    if (bosses.length === 0) return null;

    const bossConfig = bosses[randomInt(0, bosses.length - 1)];
    const boss = new Enemy(x, y, bossConfig, wave);
    
    this.lastBossWave = wave;
    return boss;
  }

  /**
   * Get bosses
   */
  getBosses(): Enemy[] {
    return this.bosses.filter(b => b.active);
  }

  /**
   * Add boss
   */
  addBoss(boss: Enemy): void {
    this.bosses.push(boss);
  }

  /**
   * Remove dead bosses
   */
  cleanupDeadBosses(): void {
    this.bosses = this.bosses.filter(b => b.active);
  }

  /**
   * Reset manager
   */
  reset(): void {
    this.bosses = [];
    this.bossSpawnChance = 0;
    this.lastBossWave = -100;
  }
}

/**
 * Special event system (bombing, chaff, spawning, etc)
 */
export class SpecialEventHandler {
  /**
   * Handle bomber bombing
   */
  static handleBomberBombing(boss: Enemy, width: number, height: number): Projectile | null {
    // For now, return null - will be handled in main update loop
    // Bombers spawn nuke-type projectiles
    return null;
  }

  /**
   * Handle chaff/flares effect
   */
  static createChaffFlares(position: Vector2, count: number): Vector2[] {
    const flares: Vector2[] = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const distance = random(20, 60);
      flares.push({
        x: position.x + Math.cos(angle) * distance,
        y: position.y + Math.sin(angle) * distance,
      });
    }
    
    return flares;
  }

  /**
   * Handle swarm spawn
   */
  static createSwarmEnemies(bossConfig: GimmickConfig, position: Vector2): GimmickConfig[] {
    const swarmSize = bossConfig.swarm_size || 3;
    const configs: GimmickConfig[] = [];
    
    // Create smaller enemies around boss
    for (let i = 0; i < swarmSize; i++) {
      configs.push({
        ...bossConfig,
        id: `${bossConfig.id}_drone_${i}`,
        health: Math.floor(bossConfig.health * 0.3),
        speed: bossConfig.speed * 1.2,
      });
    }
    
    return configs;
  }
}
