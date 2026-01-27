/**
 * Mobile Defender (Truck) - deployable defense unit
 */

import { Entity } from './city';
import { Vector2 } from '../utils/math';
import { RenderContext } from '../rendering/canvas';
import { Tower, City } from './city';

export class MobileDefender extends Entity {
  private targetPos: Vector2;
  private speed: number = 100; // pixels per second
  private deployed: boolean = false;
  private tower: Tower | null = null;
  private lifetime: number = 90; // 90 seconds active time
  private elapsed: number = 0;
  public sourceCityA: City | null = null; // City that deployed the defender
  public sourceCityB: City | null = null; // City that agreed to deployment

  constructor(startPos: Vector2, targetPos: Vector2, groundY: number) {
    super(`defender_${Math.random()}`, startPos.x, groundY - 10, 12);
    // Target position is on ground
    this.targetPos = { x: targetPos.x, y: groundY - 10 };
    
    // Set velocity towards target (only horizontal movement)
    const dx = this.targetPos.x - this.position.x;
    const dist = Math.abs(dx);
    
    if (dist > 0) {
      this.velocity = {
        x: (dx / dist) * this.speed,
        y: 0, // Stay on ground
      };
    }
  }

  /**
   * Get the tower (if deployed)
   */
  getTower(): Tower | null {
    return this.tower;
  }

  /**
   * Is deployed?
   */
  isDeployed(): boolean {
    return this.deployed;
  }

  /**
   * Update mobile defender
   */
  update(deltaTime: number, width: number, height: number): void {
    this.elapsed += deltaTime;
    
    // Deactivate after lifetime
    if (this.elapsed >= this.lifetime) {
      this.active = false;
      if (this.tower) {
        this.tower.active = false;
      }
      return;
    }

    if (!this.deployed) {
      // Move towards target (horizontal only)
      this.position.x += this.velocity.x * deltaTime;

      // Check if reached target (horizontal distance only)
      const distToTarget = Math.abs(this.targetPos.x - this.position.x);

      if (distToTarget < 5) {
        // Deploy
        this.deployed = true;
        this.velocity = { x: 0, y: 0 };
        
        // Create tower - short range, fast firing, like close-range AA flak
        this.tower = new Tower(this.position.x, this.position.y, 0);
        this.tower.fireRate = 3.5; // Much faster than normal towers
        this.tower.range = 150; // Short range - close AA only
        this.tower.isFlakTower = true; // Mark for special handling
      }
    } else {
      // Update tower if deployed
      if (this.tower) {
        this.tower.update(deltaTime, width, height);
      }
    }
  }

  /**
   * Render mobile defender
   */
  render(ctx: RenderContext): void {
    const palette = ctx.palette;
    
    if (!this.deployed) {
      // Draw moving truck
      ctx.ctx.strokeStyle = palette.accent;
      ctx.ctx.lineWidth = 2;
      
      // Truck body
      ctx.ctx.strokeRect(
        this.position.x - 8,
        this.position.y - 5,
        16,
        10
      );
      
      // Wheels
      ctx.ctx.fillStyle = palette.accent;
      ctx.ctx.fillRect(this.position.x - 6, this.position.y + 5, 3, 2);
      ctx.ctx.fillRect(this.position.x + 3, this.position.y + 5, 3, 2);
      
      // Movement trail
      ctx.ctx.globalAlpha = 0.3;
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(this.position.x, this.position.y);
      ctx.ctx.lineTo(this.position.x - this.velocity.x * 0.1, this.position.y - this.velocity.y * 0.1);
      ctx.ctx.stroke();
      ctx.ctx.globalAlpha = 1.0;
    } else {
      // Draw deployed tower
      if (this.tower) {
        this.tower.render(ctx);
      }
      
      // Draw deployment base
      ctx.ctx.strokeStyle = palette.accent;
      ctx.ctx.lineWidth = 1;
      ctx.ctx.strokeRect(
        this.position.x - 10,
        this.position.y - 2,
        20,
        4
      );
    }
    
    // Draw lifetime indicator
    const lifetimePercent = 1 - (this.elapsed / this.lifetime);
    ctx.ctx.fillStyle = lifetimePercent > 0.5 ? palette.healthGood : palette.healthBad;
    ctx.ctx.fillRect(
      this.position.x - 10,
      this.position.y - 15,
      20 * lifetimePercent,
      2
    );
  }
}
