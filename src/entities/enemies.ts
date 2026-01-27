/**
 * Enemy entities
 */

import { Entity } from './city';
import { Vector2, distance, angleBetweenPoints } from '../utils/math';
import { RenderContext } from '../rendering/canvas';
import { GimmickConfig } from '../utils/configLoader';

export class Enemy extends Entity {
  health: number;
  maxHealth: number;
  speed: number;
  config: GimmickConfig;
  spawnTime: number;
  behavior: string;
  targetPos?: Vector2;

  constructor(x: number, y: number, config: GimmickConfig, spawnTime: number = 0) {
    super(`enemy_${config.id}_${Math.random()}`, x, y, config.size || 10);
    
    this.health = config.health;
    this.maxHealth = config.health;
    this.speed = config.speed;
    this.config = config;
    this.spawnTime = spawnTime;
    this.behavior = config.behavior;
  }

  /**
   * Take damage
   */
  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.active = false;
    }
  }

  /**
   * Update enemy
   */
  update(deltaTime: number, width: number, height: number): void {
    switch (this.behavior) {
      case 'falling':
        this.updateFalling(deltaTime, width, height);
        break;
      case 'ballistic':
        this.updateBallistic(deltaTime, width, height);
        break;
      case 'fast':
        this.updateFast(deltaTime, width, height);
        break;
      case 'tumbling':
        this.updateTumbling(deltaTime, width, height);
        break;
      case 'bombing':
        this.updateBombing(deltaTime, width, height);
        break;
      case 'stationary':
        // Stationary enemies fall slowly (even if speed=0 in config) to avoid getting stuck at top
        // Use minimum fall speed of 20 to ensure they come into range
        const fallSpeed = Math.max(20, this.speed * Enemy.SPEED_SCALE);
        this.velocity.y = fallSpeed;
        this.position.y += this.velocity.y * deltaTime;
        break;
      case 'intelligent_dodging':
        this.updateIntelligentDodging(deltaTime, width, height);
        break;
      case 'fast_falling':
        this.updateFastFalling(deltaTime, width, height);
        break;
      case 'homing':
        this.updateHoming(deltaTime, width, height);
        break;
      case 'slow_advance':
        this.updateSlowAdvance(deltaTime, width, height);
        break;
      case 'erratic':
        this.updateErratic(deltaTime, width, height);
        break;
      case 'coordinated_attack':
        this.updateCoordinatedAttack(deltaTime, width, height);
        break;
      case 'intelligent_evasion':
        this.updateIntelligentEvasion(deltaTime, width, height);
        break;
      case 'expanding':
        this.updateExpanding(deltaTime, width, height);
        break;
      default:
        this.updateFalling(deltaTime, width, height);
    }

    if (this.isOutOfBounds(width, height)) {
      console.log(`Enemy going out of bounds at (${this.position.x}, ${this.position.y}), width: ${width}, height: ${height}, radius: ${this.radius}`);
      this.active = false;
    }
  }

  /**
   * Override bounds check - enemies can spawn above screen
   */
  isOutOfBounds(width: number, height: number): boolean {
    return (
      this.position.x < -this.radius ||
      this.position.x > width + this.radius ||
      this.position.y < -100 || // Allow spawning above screen
      this.position.y > height + this.radius
    );
  }

  // Speed multiplier to convert config speed to pixels/second
  private static readonly SPEED_SCALE = 60;

  /**
   * Simple falling behavior
   */
  private updateFalling(deltaTime: number, width: number, height: number): void {
    this.position.y += this.speed * Enemy.SPEED_SCALE * deltaTime;
  }

  /**
   * Ballistic/arc behavior
   */
  private updateBallistic(deltaTime: number, width: number, height: number): void {
    this.position.y += this.speed * Enemy.SPEED_SCALE * deltaTime;
    // Slight arc movement
    this.position.x += Math.sin((this.spawnTime + this.position.y / height) * 2) * 30 * deltaTime;
  }

  /**
   * Fast falling behavior
   */
  private updateFast(deltaTime: number, width: number, height: number): void {
    this.position.y += this.speed * Enemy.SPEED_SCALE * 1.5 * deltaTime;
  }

  /**
   * Fast falling with more speed
   */
  private updateFastFalling(deltaTime: number, width: number, height: number): void {
    this.position.y += this.speed * Enemy.SPEED_SCALE * 1.3 * deltaTime;
  }

  /**
   * Tumbling behavior (asteroid-like)
   */
  private updateTumbling(deltaTime: number, width: number, height: number): void {
    this.position.y += this.speed * Enemy.SPEED_SCALE * deltaTime;
    // Add rotation-like movement
    this.position.x += Math.sin(this.spawnTime * 3) * 20 * deltaTime;
  }

  /**
   * Bombing behavior (drops projectiles)
   */
  private updateBombing(deltaTime: number, width: number, height: number): void {
    // Move horizontally slowly
    this.position.x += (Math.random() - 0.5) * 60 * deltaTime;
    this.position.y += this.speed * Enemy.SPEED_SCALE * 0.3 * deltaTime;
  }

  /**
   * Intelligent dodging
   */
  private updateIntelligentDodging(deltaTime: number, width: number, height: number): void {
    this.position.y += this.speed * Enemy.SPEED_SCALE * deltaTime;
    // Weave side to side
    this.position.x += Math.sin((this.spawnTime + this.position.y / 100) * 4) * 80 * deltaTime;
    
    // Keep in bounds horizontally
    if (this.position.x < this.radius) this.position.x = this.radius;
    if (this.position.x > width - this.radius) this.position.x = width - this.radius;
  }

  /**
   * Homing behavior
   */
  private updateHoming(deltaTime: number, width: number, height: number): void {
    // Move towards bottom center by default
    const targetX = width / 2;
    const targetY = height;
    
    const dx = targetX - this.position.x;
    const dy = targetY - this.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      this.position.x += (dx / dist) * this.speed * Enemy.SPEED_SCALE * deltaTime;
      this.position.y += (dy / dist) * this.speed * Enemy.SPEED_SCALE * deltaTime;
    }
  }

  /**
   * Slow advance behavior
   */
  private updateSlowAdvance(deltaTime: number, width: number, height: number): void {
    this.position.y += this.speed * Enemy.SPEED_SCALE * 0.5 * deltaTime;
  }

  /**
   * Erratic behavior
   */
  private updateErratic(deltaTime: number, width: number, height: number): void {
    this.position.y += this.speed * Enemy.SPEED_SCALE * deltaTime;
    this.position.x += (Math.random() - 0.5) * 100 * deltaTime;
    
    // Keep in bounds
    if (this.position.x < this.radius) this.position.x = this.radius;
    if (this.position.x > width - this.radius) this.position.x = width - this.radius;
  }

  /**
   * Coordinated attack behavior
   */
  private updateCoordinatedAttack(deltaTime: number, width: number, height: number): void {
    this.position.y += this.speed * Enemy.SPEED_SCALE * deltaTime;
    // Move in formation pattern
    this.position.x += Math.cos((this.spawnTime + this.position.y / 50) * 2) * 60 * deltaTime;
  }

  /**
   * Intelligent evasion behavior
   */
  private updateIntelligentEvasion(deltaTime: number, width: number, height: number): void {
    this.position.y += this.speed * Enemy.SPEED_SCALE * deltaTime;
    // More complex evasion pattern
    this.position.x += Math.sin((this.spawnTime + this.position.y / 80) * 5) * 100 * deltaTime;
    
    // Keep in bounds
    if (this.position.x < this.radius) this.position.x = this.radius;
    if (this.position.x > width - this.radius) this.position.x = width - this.radius;
  }

  /**
   * Expanding behavior
   */
  private updateExpanding(deltaTime: number, width: number, height: number): void {
    this.position.y += this.speed * Enemy.SPEED_SCALE * 0.3 * deltaTime;
    // Expand size slowly
    this.radius += 5 * deltaTime;
  }

  /**
   * Render enemy
   */
  render(ctx: RenderContext): void {
    const palette = ctx.palette;
    const healthPercent = this.health / this.maxHealth;
    const color = healthPercent > 0.5 ? palette.enemy : palette.accent;
    
    ctx.ctx.strokeStyle = color;
    ctx.ctx.lineWidth = 1;

    // Draw based on config type
    if (this.config.id.includes('meteor')) {
      // Draw meteor (rough circle with jagged edges)
      ctx.ctx.beginPath();
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = this.radius + (Math.random() - 0.5) * 3;
        const x = this.position.x + Math.cos(angle) * r;
        const y = this.position.y + Math.sin(angle) * r;
        
        if (i === 0) ctx.ctx.moveTo(x, y);
        else ctx.ctx.lineTo(x, y);
      }
      ctx.ctx.closePath();
      ctx.ctx.stroke();
    } else if (this.config.id.includes('missile')) {
      // Draw missile (pointed shape)
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(this.position.x, this.position.y - this.radius);
      ctx.ctx.lineTo(this.position.x - this.radius * 0.7, this.position.y + this.radius);
      ctx.ctx.lineTo(this.position.x, this.position.y + this.radius * 0.5);
      ctx.ctx.lineTo(this.position.x + this.radius * 0.7, this.position.y + this.radius);
      ctx.ctx.closePath();
      ctx.ctx.stroke();
    } else if (this.config.id.includes('bomber')) {
      // Draw bomber (wider shape)
      ctx.ctx.strokeRect(
        this.position.x - this.radius * 1.5,
        this.position.y - this.radius,
        this.radius * 3,
        this.radius * 2
      );
    } else if (this.config.id.includes('asteroid')) {
      // Draw asteroid
      ctx.ctx.beginPath();
      ctx.ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.ctx.stroke();
    } else if (this.config.id.includes('drone') || this.config.id.includes('fighter')) {
      // Draw spacecraft
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(this.position.x, this.position.y - this.radius);
      ctx.ctx.lineTo(this.position.x - this.radius, this.position.y + this.radius);
      ctx.ctx.lineTo(this.position.x, this.position.y + this.radius * 0.5);
      ctx.ctx.lineTo(this.position.x + this.radius, this.position.y + this.radius);
      ctx.ctx.closePath();
      ctx.ctx.stroke();
    } else {
      // Default: circle
      ctx.ctx.beginPath();
      ctx.ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.ctx.stroke();
    }

    // Draw health indicator for boss enemies
    if (this.health < this.maxHealth) {
      const barWidth = this.radius * 2.5;
      const barHeight = 2;
      const barX = this.position.x - barWidth / 2;
      const barY = this.position.y - this.radius - 8;
      
      ctx.ctx.strokeStyle = palette.healthBad;
      ctx.ctx.lineWidth = 0.5;
      ctx.ctx.strokeRect(barX, barY, barWidth, barHeight);
      
      ctx.ctx.fillStyle = healthPercent > 0.5 ? palette.healthGood : palette.healthBad;
      ctx.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
  }
}
