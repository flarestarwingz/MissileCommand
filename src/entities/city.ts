/**
 * Base entity classes
 */

import { Vector2, magnitude } from '../utils/math';
import { RenderContext } from '../rendering/canvas';

export abstract class Entity {
  id: string;
  position: Vector2;
  velocity: Vector2;
  radius: number;
  active: boolean = true;

  constructor(id: string, x: number, y: number, radius: number = 5) {
    this.id = id;
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
    this.radius = radius;
  }

  /**
   * Update entity
   */
  abstract update(deltaTime: number, width: number, height: number): void;

  /**
   * Render entity
   */
  abstract render(ctx: RenderContext): void;

  /**
   * Check if entity is out of bounds
   */
  isOutOfBounds(width: number, height: number): boolean {
    return (
      this.position.x < -this.radius ||
      this.position.x > width + this.radius ||
      this.position.y < -this.radius ||
      this.position.y > height + this.radius
    );
  }

  /**
   * Get distance to another entity
   */
  distanceTo(other: Entity): number {
    const dx = other.position.x - this.position.x;
    const dy = other.position.y - this.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

/**
 * Shared truck resource between two adjacent cities
 */
export class SharedTruck {
  available: boolean = true;
  cooldown: number = 0;
  cooldownTime: number = 60; // 60 seconds per deployment
  cityA: City; // Left city
  cityB: City; // Right city
  votedForDeployment: Set<string> = new Set(); // Track which cities voted
  
  constructor(cityA: City, cityB: City) {
    this.cityA = cityA;
    this.cityB = cityB;
  }
  
  /**
   * Check if truck can be deployed (needs both cities to agree)
   */
  canDeploy(requestingCity: City, agreementCity: City): boolean {
    if (!this.available) return false;
    if (this.cityA.isDestroyed() || this.cityB.isDestroyed()) return false;
    return true;
  }
  
  /**
   * Deploy the truck (marks as unavailable)
   */
  deploy(): boolean {
    if (!this.available) return false;
    this.available = false;
    this.cooldown = 0;
    this.votedForDeployment.clear();
    return true;
  }
  
  /**
   * Update cooldown
   */
  update(deltaTime: number): void {
    if (!this.available) {
      this.cooldown += deltaTime;
      if (this.cooldown >= this.cooldownTime) {
        this.available = true;
        this.cooldown = 0;
      }
    }
  }
}

/**
 * City/Base entity
 */
export class City extends Entity {
  maxHealth: number;
  health: number;
  repairRate: number;
  era: number;
  x: number;
  y: number;
  
  // Mobile defender system (shared with neighbor cities via references)
  leftSharedTruck: SharedTruck | null = null; // Reference to shared truck with left neighbor
  rightSharedTruck: SharedTruck | null = null; // Reference to shared truck with right neighbor
  
  // Communication system
  isCommunicating: boolean = false;
  communicationTarget: City | null = null;
  lastThreatAssessment: number = 0;
  assessedThreatLevel: number = 0; // 0-1
  
  // Stance/personality system
  helpfulnessScore: number = 0; // -100 to +100, tracks help given/received
  stance: 'cooperative' | 'neutral' | 'selfish' = 'neutral'; // Changes based on helpfulnessScore
  timesHelped: number = 0;
  timesRefusedHelp: number = 0;
  helpHistory: Map<string, number> = new Map(); // cityId -> help balance
  
  // Super weapon agreement
  votedForSuperWeapon: boolean = false;
  superWeaponConcern: number = 0; // 0-1, how concerned about destruction
  
  constructor(x: number, y: number, era: number = 0) {
    super(`city_${x}_${y}`, x, y, 20);
    this.x = x;
    this.y = y;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.repairRate = 0.02; // Health per second 
    this.era = era;
    
    // Randomize initial stance with slight cooperative bias
    const roll = Math.random();
    if (roll < 0.4) {
      this.stance = 'cooperative';
      this.helpfulnessScore = 20;
    } else if (roll < 0.75) {
      this.stance = 'neutral';
      this.helpfulnessScore = 0;
    } else {
      this.stance = 'selfish';
      this.helpfulnessScore = -20;
    }
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
   * Repair city
   */
  repair(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  /**
   * Is city destroyed?
   */
  isDestroyed(): boolean {
    return this.health <= 0;
  }

  /**
   * Update city
   */
  update(deltaTime: number, width: number, height: number, eraMultiplier: number = 1): void {
    // Only repair if not destroyed
    // Scale repair by era: 1x in era 1, 2x in era 2, 3x in era 3, 4x in era 4, 5x in era 5
    if (!this.isDestroyed()) {
      this.repair(this.repairRate * deltaTime * eraMultiplier);
    }
    
    // Truck cooldowns are now handled by SharedTruck objects in main game loop
    // Truck cooldowns are now handled by SharedTruck objects in main game loop
    
    if (!this.rightSharedTruck) {
      // Placeholder - this should never be reached but prevents future code from breaking
    }
    
    // Update stance based on helpfulness
    if (this.helpfulnessScore > 30) {
      this.stance = 'cooperative';
    } else if (this.helpfulnessScore < -30) {
      this.stance = 'selfish';
    } else {
      this.stance = 'neutral';
    }
  }
  
  /**
   * Can deploy defender for a specific neighbor?
   * Allows solo deployment if this city has no living neighbor (but truck exists)
   */
  canDeployDefender(direction: 'left' | 'right'): boolean {
    if (this.isDestroyed()) return false;
    const truck = direction === 'left' ? this.leftSharedTruck : this.rightSharedTruck;
    if (!truck) return false;
    
    // Can deploy if truck is available AND at least this city is alive
    // Allow solo deployment when neighbor is destroyed
    const thisAlive = !this.isDestroyed();
    const neighborAlive = (truck.cityA === this ? !truck.cityB.isDestroyed() : !truck.cityA.isDestroyed());
    
    return truck.available && thisAlive;
  }
  
  /**
   * Deploy a mobile defender for a specific neighbor
   */
  deployDefender(direction: 'left' | 'right'): boolean {
    if (!this.canDeployDefender(direction)) return false;
    const truck = direction === 'left' ? this.leftSharedTruck : this.rightSharedTruck;
    if (!truck) return false;
    return truck.deploy();
  }
  
  /**
   * Assess threat level based on nearby enemies
   */
  assessThreat(enemies: any[], currentTime: number, waveBonus: number = 0, eraBonus: number = 0): number {
    if (currentTime - this.lastThreatAssessment < 1000) {
      return this.assessedThreatLevel;
    }
    
    this.lastThreatAssessment = currentTime;
    
    // Count enemies within threat range
    const threatRange = 300;
    let threatLevel = 0;
    
    for (const enemy of enemies) {
      const dist = Math.sqrt(
        Math.pow(enemy.position.x - this.position.x, 2) +
        Math.pow(enemy.position.y - this.position.y, 2)
      );
      
      if (dist < threatRange) {
        // Closer enemies = higher threat
        const proximityFactor = 1 - (dist / threatRange);
        // Boss enemies = higher threat
        const bossFactor = enemy.maxHealth > 200 ? 2 : 1;
        // Expanding enemies = CRITICAL threat
        const expandingFactor = enemy.config?.behavior === 'expanding' ? 3 : 1;
        threatLevel += proximityFactor * bossFactor * expandingFactor;
      }
    }
    
    // Add baseline threat from wave/era progression (makes cities deploy more in later stages)
    const baselineThreat = waveBonus + eraBonus;
    
    // Normalize to 0-1
    this.assessedThreatLevel = Math.min(1, (threatLevel / 3) + baselineThreat);
    return this.assessedThreatLevel;
  }

  /**
   * Render city
   */
  render(ctx: RenderContext): void {
    const palette = ctx.palette;
    
    // If city is destroyed, show fallen state
    if (this.isDestroyed()) {
      ctx.ctx.strokeStyle = '#444'; // Dark gray
      ctx.ctx.fillStyle = '#444';
      ctx.ctx.lineWidth = 2;
      
      // Draw rubble (broken base)
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(this.position.x - 15, this.position.y);
      ctx.ctx.lineTo(this.position.x - 10, this.position.y - 8);
      ctx.ctx.lineTo(this.position.x - 5, this.position.y - 5);
      ctx.ctx.lineTo(this.position.x, this.position.y - 10);
      ctx.ctx.lineTo(this.position.x + 5, this.position.y - 6);
      ctx.ctx.lineTo(this.position.x + 10, this.position.y - 9);
      ctx.ctx.lineTo(this.position.x + 15, this.position.y);
      ctx.ctx.stroke();
      
      // Draw X over city
      ctx.ctx.lineWidth = 3;
      ctx.ctx.strokeStyle = '#800'; // Dark red
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(this.position.x - 20, this.position.y - 25);
      ctx.ctx.lineTo(this.position.x + 20, this.position.y - 5);
      ctx.ctx.moveTo(this.position.x + 20, this.position.y - 25);
      ctx.ctx.lineTo(this.position.x - 20, this.position.y - 5);
      ctx.ctx.stroke();
      
      // Label as FALLEN
      ctx.ctx.fillStyle = '#800';
      ctx.ctx.font = '10px monospace';
      ctx.ctx.textAlign = 'center';
      ctx.ctx.fillText('FALLEN', this.position.x, this.position.y + 15);
      
      return; // Don't render normal city
    }
    
    // Determine color based on stance
    let cityColor: string;
    if (this.stance === 'cooperative') {
      cityColor = palette.healthGood; // Green for helpful
    } else if (this.stance === 'selfish') {
      cityColor = palette.healthBad; // Red for selfish
    } else {
      cityColor = palette.city; // Neutral white/blue
    }
    
    // Dim color if low health
    if (this.health < this.maxHealth * 0.5) {
      ctx.ctx.globalAlpha = 0.6;
    }
    
    // Draw dome/shield (represents city health/shields) - tiny ellipse, just around structure
    ctx.ctx.strokeStyle = cityColor;
    ctx.ctx.lineWidth = 2;
    const shieldAlpha = 0.5 + (this.health / this.maxHealth) * 0.3; // More opaque (0.5-0.8)
    ctx.ctx.globalAlpha = shieldAlpha;
    // Very small ellipse: 10px horizontal, 5px vertical
    ctx.ctx.beginPath();
    ctx.ctx.ellipse(this.position.x, this.position.y, 10, 5, 0, Math.PI, 0);
    ctx.ctx.stroke();
    ctx.ctx.globalAlpha = 1.0;
    
    // Draw wireframe city base (varies by stance)
    ctx.ctx.strokeStyle = cityColor;
    ctx.ctx.lineWidth = 2;
    
    if (this.stance === 'cooperative') {
      // Cooperative: Open, welcoming architecture - wider base
      // Central tower
      ctx.ctx.strokeRect(this.position.x - 6, this.position.y - 20, 12, 20);
      // Side platforms (open arms)
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(this.position.x - 6, this.position.y - 10);
      ctx.ctx.lineTo(this.position.x - 16, this.position.y - 5);
      ctx.ctx.lineTo(this.position.x - 16, this.position.y);
      ctx.ctx.stroke();
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(this.position.x + 6, this.position.y - 10);
      ctx.ctx.lineTo(this.position.x + 16, this.position.y - 5);
      ctx.ctx.lineTo(this.position.x + 16, this.position.y);
      ctx.ctx.stroke();
      // Antenna (communication)
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(this.position.x, this.position.y - 20);
      ctx.ctx.lineTo(this.position.x, this.position.y - 28);
      ctx.ctx.stroke();
      ctx.ctx.beginPath();
      ctx.ctx.arc(this.position.x, this.position.y - 28, 3, 0, Math.PI * 2);
      ctx.ctx.stroke();
      // Heart symbol
      ctx.ctx.font = '14px monospace';
      ctx.ctx.textAlign = 'center';
      ctx.ctx.fillStyle = cityColor;
      ctx.ctx.fillText('♥', this.position.x, this.position.y + 18);
      
    } else if (this.stance === 'selfish') {
      // Selfish: Fortified, closed architecture - tall narrow tower
      // Main tower (fortress-like)
      ctx.ctx.strokeRect(this.position.x - 5, this.position.y - 22, 10, 22);
      // Battlements
      for (let i = -1; i <= 1; i++) {
        ctx.ctx.strokeRect(this.position.x + i * 5 - 2, this.position.y - 25, 4, 3);
      }
      // Walls (defensive)
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(this.position.x - 15, this.position.y);
      ctx.ctx.lineTo(this.position.x - 15, this.position.y - 8);
      ctx.ctx.lineTo(this.position.x - 5, this.position.y - 8);
      ctx.ctx.stroke();
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(this.position.x + 15, this.position.y);
      ctx.ctx.lineTo(this.position.x + 15, this.position.y - 8);
      ctx.ctx.lineTo(this.position.x + 5, this.position.y - 8);
      ctx.ctx.stroke();
      // Dollar symbol
      ctx.ctx.font = '14px monospace';
      ctx.ctx.textAlign = 'center';
      ctx.ctx.fillStyle = cityColor;
      ctx.ctx.fillText('$', this.position.x, this.position.y + 18);
      
    } else {
      // Neutral: Balanced architecture - standard buildings
      // Three buildings of varying heights
      ctx.ctx.strokeRect(this.position.x - 12, this.position.y - 12, 7, 12);
      ctx.ctx.strokeRect(this.position.x - 3, this.position.y - 18, 6, 18);
      ctx.ctx.strokeRect(this.position.x + 5, this.position.y - 10, 7, 10);
      // Windows
      ctx.ctx.fillStyle = cityColor;
      ctx.ctx.globalAlpha = 0.3;
      ctx.ctx.fillRect(this.position.x - 10, this.position.y - 8, 2, 2);
      ctx.ctx.fillRect(this.position.x - 1, this.position.y - 12, 2, 2);
      ctx.ctx.fillRect(this.position.x + 7, this.position.y - 6, 2, 2);
      ctx.ctx.globalAlpha = 1.0;
      // Neutral symbol (equals)
      ctx.ctx.font = '14px monospace';
      ctx.ctx.textAlign = 'center';
      ctx.ctx.fillStyle = cityColor;
      ctx.ctx.fillText('=', this.position.x, this.position.y + 18);
    }
    
    // Health bar with stance color
    const barWidth = 30;
    const barHeight = 3;
    const barX = this.position.x - barWidth / 2;
    const barY = this.position.y - 32;
    
    ctx.ctx.strokeStyle = cityColor;
    ctx.ctx.lineWidth = 1;
    ctx.ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    const healthPercent = this.health / this.maxHealth;
    ctx.ctx.fillStyle = cityColor;
    ctx.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
  }
}

/**
 * Defense Tower
 */
export class Tower extends Entity {
  fireRate: number;
  lastFireTime: number = 0;
  range: number;
  damage: number;
  era: number;
  maxHealth: number = 50;
  health: number = 50;
  side: 'left' | 'right'; // Which side of city
  parentCity: City | null = null; // Reference to parent city
  isFlakTower: boolean = false; // Mobile defender flak towers with AoE

  constructor(x: number, y: number, era: number = 0, side: 'left' | 'right' = 'left') {
    super(`tower_${x}_${y}`, x, y, 8);
    this.fireRate = 2; // Shots per second
    this.range = 500; // Long range for high altitude targeting
    this.damage = 25;
    this.era = era;
    this.side = side;
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
   * Repair tower
   */
  repair(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
    if (this.health > 0) {
      this.active = true;
    }
  }
  
  /**
   * Is destroyed?
   */
  isDestroyed(): boolean {
    return this.health <= 0;
  }

  /**
   * Can fire at target? (checks angle and range)
   */
  canFireAt(targetPos: Vector2, cities: City[], groundY: number): boolean {
    // Check range
    const dx = targetPos.x - this.position.x;
    const dy = targetPos.y - this.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > this.range) return false;
    
    // Check minimum angle (don't shoot through ground)
    const angle = Math.atan2(dy, dx);
    const minAngle = -Math.PI * 0.85; // ~153 degrees up from horizontal
    const maxAngle = -Math.PI * 0.01; // ~2 degrees down from horizontal
    
    if (angle > maxAngle || angle < minAngle) return false;
    
    // Check if would shoot through other cities
    for (const city of cities) {
      if (city.isDestroyed()) continue;
      
      // Check if city is between tower and target
      const toCityX = city.position.x - this.position.x;
      const toTargetX = targetPos.x - this.position.x;
      
      // Same direction check
      if ((toCityX > 0) === (toTargetX > 0)) {
        const toCityDist = Math.abs(toCityX);
        const toTargetDist = Math.abs(toTargetX);
        
        if (toCityDist < toTargetDist) {
          // City is closer, check if shot would pass through
          const cityAngle = Math.atan2(city.position.y - this.position.y, toCityX);
          if (Math.abs(angle - cityAngle) < 0.3) { // Within ~17 degrees
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  /**
   * Can fire?
   */
  canFire(currentTime: number): boolean {
    // fireRate is shots per second, currentTime is in milliseconds
    const fireInterval = 1000 / this.fireRate; // milliseconds between shots
    return currentTime - this.lastFireTime > fireInterval;
  }

  /**
   * Fire projectile
   */
  fire(currentTime: number, targetPos: Vector2): boolean {
    if (!this.canFire(currentTime)) return false;
    this.lastFireTime = currentTime;
    return true;
  }

  /**
   * Update tower
   */
  update(deltaTime: number, width: number, height: number): void {
    // Towers don't need special updates
  }

  /**
   * Render tower
   */
  render(ctx: RenderContext): void {
    const palette = ctx.palette;
    
    // Determine color based on health
    let towerColor = palette.primary;
    if (this.health < this.maxHealth * 0.5) {
      towerColor = palette.healthBad;
    } else if (this.health < this.maxHealth * 0.8) {
      towerColor = palette.accent;
    }
    
    // Draw tower with damage indication
    ctx.ctx.fillStyle = towerColor;
    ctx.ctx.globalAlpha = 0.5 + (this.health / this.maxHealth) * 0.5;
    ctx.ctx.fillRect(this.position.x - 5, this.position.y - 5, 10, 10);
    ctx.ctx.globalAlpha = 1.0;
    
    // Draw small health indicator
    if (this.health < this.maxHealth) {
      const barWidth = 10;
      const barHeight = 2;
      const barX = this.position.x - barWidth / 2;
      const barY = this.position.y - 10;
      
      ctx.ctx.strokeStyle = towerColor;
      ctx.ctx.lineWidth = 1;
      ctx.ctx.strokeRect(barX, barY, barWidth, barHeight);
      
      const healthPercent = this.health / this.maxHealth;
      ctx.ctx.fillStyle = towerColor;
      ctx.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
    
    // Draw range indicator (faint) only if active
    if (this.active) {
      ctx.ctx.strokeStyle = palette.primary;
      ctx.ctx.globalAlpha = 0.05;
      ctx.ctx.beginPath();
      ctx.ctx.arc(this.position.x, this.position.y, this.range, 0, Math.PI * 2);
      ctx.ctx.stroke();
      ctx.ctx.globalAlpha = 1.0;
    }
  }
}
