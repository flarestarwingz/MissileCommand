/**
 * Projectile entities
 */

import { Entity } from './city';
import { Vector2, distance } from '../utils/math';
import { RenderContext } from '../rendering/canvas';

export class Projectile extends Entity {
  targetPos: Vector2;
  maxDistance: number;
  distanceTraveled: number = 0;
  speed: number;
  damage: number;
  color: string;
  explosionRadius: number = 0; // AoE damage radius (0 = single target)

  constructor(
    from: Vector2,
    to: Vector2,
    speed: number = 200,
    damage: number = 25,
    color: string = '#00FF00',
    explosionRadius: number = 0
  ) {
    super(`projectile_${Math.random()}`, from.x, from.y, 3);
    
    this.targetPos = { ...to };
    this.speed = speed;
    this.damage = damage;
    this.color = color;
    this.explosionRadius = explosionRadius;
    
    const dist = distance(from, to);
    this.maxDistance = dist;
    
    // Set velocity towards target
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length > 0) {
      this.velocity = {
        x: (dx / length) * speed,
        y: (dy / length) * speed,
      };
    }
  }

  /**
   * Update projectile
   */
  update(deltaTime: number, width: number, height: number): void {
    const traveled = distance(this.position, { x: 0, y: 0 });
    
    // Move projectile
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    
    this.distanceTraveled += this.speed * deltaTime;
    
    // Deactivate if out of bounds or traveled max distance
    if (this.isOutOfBounds(width, height) || this.distanceTraveled > this.maxDistance * 1.5) {
      this.active = false;
    }
  }

  /**
   * Render projectile
   */
  render(ctx: RenderContext): void {
    ctx.ctx.strokeStyle = this.color;
    ctx.ctx.lineWidth = 1;
    ctx.ctx.beginPath();
    ctx.ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.ctx.stroke();
  }
}

/**
 * Explosion effect
 */
export class Explosion extends Entity {
  radius: number;
  maxRadius: number;
  duration: number;
  elapsed: number = 0;
  color: string;
  damage: number;

  constructor(
    pos: Vector2,
    maxRadius: number = 30,
    duration: number = 0.3,
    color: string = '#FF4400',
    damage: number = 50
  ) {
    super(`explosion_${Math.random()}`, pos.x, pos.y, 1);
    this.maxRadius = maxRadius;
    this.radius = 0;
    this.duration = duration;
    this.color = color;
    this.damage = damage;
  }

  /**
   * Update explosion
   */
  update(deltaTime: number, width: number, height: number): void {
    this.elapsed += deltaTime;
    
    if (this.elapsed >= this.duration) {
      this.active = false;
    } else {
      // Expand radius over time
      this.radius = (this.elapsed / this.duration) * this.maxRadius;
    }
  }

  /**
   * Render explosion
   */
  render(ctx: RenderContext): void {
    const alpha = 1 - (this.elapsed / this.duration);
    
    ctx.ctx.strokeStyle = this.color;
    ctx.ctx.globalAlpha = alpha;
    ctx.ctx.lineWidth = 2;
    
    // Draw expanding circle
    ctx.ctx.beginPath();
    ctx.ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.ctx.stroke();
    
    // Draw rays
    const rays = 8;
    for (let i = 0; i < rays; i++) {
      const angle = (i / rays) * Math.PI * 2;
      const endX = this.position.x + Math.cos(angle) * this.radius;
      const endY = this.position.y + Math.sin(angle) * this.radius;
      
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(this.position.x, this.position.y);
      ctx.ctx.lineTo(endX, endY);
      ctx.ctx.stroke();
    }
    
    ctx.ctx.globalAlpha = 1.0;
  }
}
