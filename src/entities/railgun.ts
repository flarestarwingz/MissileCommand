/**
 * Railgun - special weapon for end cities without neighbors
 */

import { Entity, City } from './city';
import { Vector2 } from '../utils/math';
import { RenderContext } from '../rendering/canvas';
import { Enemy } from './enemies';

export class Railgun {
  parentCity: City;
  fireRate: number = 0.2; // 1 shot every 5 seconds
  lastFireTime: number = -5000; // Start ready to fire (5 seconds ago)
  range: number = 2000; // Very long range - can hit anywhere on correct screen half
  damage: number = 150; // High damage
  direction: 'left' | 'right'; // Which side the railgun is on
  xOffset: number; // Position offset from city center
  currentAngle: number = 0; // Current aiming angle in radians
  currentTarget: Enemy | null = null; // Currently targeted enemy
  health: number = 100;
  maxHealth: number = 100;
  
  constructor(parentCity: City, direction: 'left' | 'right', screenWidth: number) {
    this.parentCity = parentCity;
    this.direction = direction;
    
    // Position railgun much further out - well beyond the turret position
    // Turrets are at ~60px, place railgun at 100px for better separation
    const railgunOffset = direction === 'left' ? -100 : 100;
    
    // Keep railgun at least 20px from screen edge
    if (direction === 'left') {
      this.xOffset = Math.max(railgunOffset, 20 - parentCity.position.x);
    } else {
      this.xOffset = Math.min(railgunOffset, screenWidth - 20 - parentCity.position.x);
    }
    
    // Initialize angle to 45 degrees upward toward opposite side
    // Left railgun aims up-right (-45° from horizontal)
    // Right railgun aims up-left (225° = π + π/4 from horizontal)
    this.currentAngle = direction === 'left' ? -Math.PI / 4 : (Math.PI + Math.PI / 4);
  }
  
  /**
   * Can fire?
   */
  canFire(currentTime: number): boolean {
    if (this.parentCity.isDestroyed() || this.isDestroyed()) return false;
    const timeSinceLastFire = (currentTime - this.lastFireTime) / 1000; // Convert to seconds
    return timeSinceLastFire >= (1 / this.fireRate);
  }
  
  /**
   * Take damage
   */
  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }
  
  /**
   * Is destroyed?
   */
  isDestroyed(): boolean {
    return this.health <= 0;
  }
  
  /**
   * Fire railgun toward opposite side of screen at target position, extending to screen edge
   */
  fire(targetX: number, targetY: number, screenWidth: number, screenHeight: number, currentTime: number): RailgunBolt | null {
    if (!this.canFire(currentTime)) return null;
    
    this.lastFireTime = currentTime; // Store in milliseconds
    
    // Railgun fires from its offset position
    const startX = this.parentCity.position.x + this.xOffset;
    const startY = this.parentCity.position.y;
    
    // Calculate and store aiming angle for visual rotation
    const dx = targetX - startX;
    const dy = targetY - startY;
    this.currentAngle = Math.atan2(dy, dx);
    
    // Extend the bolt path to the screen edge (piercing beam goes off-screen)
    const angle = Math.atan2(dy, dx);
    const maxDistance = Math.max(screenWidth, screenHeight) * 2; // Way beyond screen
    const endX = startX + Math.cos(angle) * maxDistance;
    const endY = startY + Math.sin(angle) * maxDistance;
    
    // Fire directly at the target's current position (no leading)
    // Left railgun fires toward right side, right railgun fires toward left side
    return new RailgunBolt(
      { x: startX, y: startY },
      { x: endX, y: endY },
      this.damage
    );
  }
  
  /**
   * Render railgun as a dual-rail girder structure with square base
   */
  render(ctx: RenderContext, currentTime?: number): void {
    if (this.parentCity.isDestroyed() || this.isDestroyed()) return;
    
    const palette = ctx.palette;
    const x = this.parentCity.position.x + this.xOffset;
    const y = this.parentCity.position.y;
    
    // Calculate charge level for energy buildup (use provided time or Date.now())
    const timeToUse = currentTime !== undefined ? currentTime : Date.now();
    const timeSinceLastFire = (timeToUse - this.lastFireTime) / 1000;
    const chargePercent = Math.min(1, timeSinceLastFire / (1 / this.fireRate));
    
    const healthPercent = this.health / this.maxHealth;
    const baseColor = healthPercent > 0.5 ? palette.city : palette.healthBad;
    
    ctx.ctx.save();
    ctx.ctx.translate(x, y);
    
    // Draw square base platform
    const baseSize = 14;
    ctx.ctx.fillStyle = baseColor;
    ctx.ctx.fillRect(-baseSize / 2, -baseSize / 2, baseSize, baseSize);
    ctx.ctx.strokeStyle = palette.background;
    ctx.ctx.lineWidth = 1.5;
    ctx.ctx.strokeRect(-baseSize / 2, -baseSize / 2, baseSize, baseSize);
    
    // Draw power cables from bottom of base going underground toward city
    ctx.ctx.strokeStyle = palette.city;
    ctx.ctx.lineWidth = 1.5;
    
    const cableLength = 35; // Much longer cables
    const cableDir = this.direction === 'left' ? 1 : -1; // Toward city
    
    // Left cable (long squiggly line underground toward city)
    ctx.ctx.beginPath();
    ctx.ctx.moveTo(-baseSize / 2 + 2, baseSize / 2);
    ctx.ctx.quadraticCurveTo(
      -baseSize / 2 + 2 + cableDir * 5, baseSize / 2 + 8,
      -baseSize / 2 + 2 + cableDir * 10, baseSize / 2 + 12
    );
    ctx.ctx.quadraticCurveTo(
      -baseSize / 2 + 2 + cableDir * 14, baseSize / 2 + 16,
      -baseSize / 2 + 2 + cableDir * 20, baseSize / 2 + 22
    );
    ctx.ctx.quadraticCurveTo(
      -baseSize / 2 + 2 + cableDir * 26, baseSize / 2 + 28,
      -baseSize / 2 + 2 + cableDir * 32, baseSize / 2 + 32
    );
    ctx.ctx.stroke();
    
    // Right cable (long squiggly line underground)
    ctx.ctx.beginPath();
    ctx.ctx.moveTo(baseSize / 2 - 2, baseSize / 2);
    ctx.ctx.quadraticCurveTo(
      baseSize / 2 - 2 - cableDir * 3, baseSize / 2 + 8,
      baseSize / 2 - 2 - cableDir * 8, baseSize / 2 + 14
    );
    ctx.ctx.quadraticCurveTo(
      baseSize / 2 - 2 - cableDir * 12, baseSize / 2 + 20,
      baseSize / 2 - 2 - cableDir * 18, baseSize / 2 + 26
    );
    ctx.ctx.quadraticCurveTo(
      baseSize / 2 - 2 - cableDir * 24, baseSize / 2 + 32,
      baseSize / 2 - 2 - cableDir * 30, baseSize / 2 + 36
    );
    ctx.ctx.stroke();
    
    // Rotate to aim direction
    ctx.ctx.rotate(this.currentAngle);
    
    // Dual-rail girder design with MUCH wider structure
    const railLength = 40;
    const railSpacing = 14; // MUCH wider - nearly doubled
    const railWidth = 3;
    
    // Top rail
    ctx.ctx.fillStyle = palette.city;
    ctx.ctx.fillRect(0, -railSpacing / 2 - railWidth / 2, railLength, railWidth);
    
    // Bottom rail
    ctx.ctx.fillRect(0, railSpacing / 2 - railWidth / 2, railLength, railWidth);
    
    // Girder cross-struts (creates mesh/grid effect) - thicker for wider structure
    ctx.ctx.strokeStyle = palette.city;
    ctx.ctx.lineWidth = 1.5;
    for (let i = 0; i <= 6; i++) {
      const strutX = i * (railLength / 6);
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(strutX, -railSpacing / 2);
      ctx.ctx.lineTo(strutX, railSpacing / 2);
      ctx.ctx.stroke();
    }
    
    // Diagonal cross-bracing for girder look
    ctx.ctx.strokeStyle = palette.city;
    ctx.ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const segX = i * (railLength / 6);
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(segX, -railSpacing / 2);
      ctx.ctx.lineTo(segX + railLength / 6, railSpacing / 2);
      ctx.ctx.stroke();
    }
    
    // Internal beam charge visualization (charges inside the girder)
    if (chargePercent > 0) {
      const energyAlpha = chargePercent * 0.6;
      const energyLength = railLength * chargePercent;
      
      // Inner charging beam (travels along center between rails)
      const gradient = ctx.ctx.createLinearGradient(0, 0, energyLength, 0);
      gradient.addColorStop(0, `rgba(0, 180, 255, 0)`);
      gradient.addColorStop(0.7, `rgba(80, 200, 255, ${energyAlpha * 0.5})`);
      gradient.addColorStop(1, `rgba(150, 220, 255, ${energyAlpha})`);
      
      ctx.ctx.fillStyle = gradient;
      ctx.ctx.fillRect(0, -2, energyLength, 4); // Thin beam along center
      
      // Pulsing glow at charge point
      const pulseIntensity = (Math.sin(Date.now() * 0.01) + 1) / 2; // 0-1 pulse
      ctx.ctx.fillStyle = `rgba(100, 210, 255, ${energyAlpha * 0.4 * pulseIntensity})`;
      ctx.ctx.beginPath();
      ctx.ctx.arc(energyLength, 0, 3, 0, Math.PI * 2);
      ctx.ctx.fill();
      
      // Energy particles at the tip when nearly charged (inside the barrel)
      if (chargePercent > 0.9) {
        const particleAlpha = (chargePercent - 0.9) / 0.1;
        
        // Bright charge ready indicator
        ctx.ctx.fillStyle = `rgba(180, 240, 255, ${particleAlpha * 0.8})`;
        ctx.ctx.beginPath();
        ctx.ctx.arc(railLength, 0, 4, 0, Math.PI * 2);
        ctx.ctx.fill();
        
        // Subtle outer glow when fully charged
        ctx.ctx.fillStyle = `rgba(100, 200, 255, ${particleAlpha * 0.3})`;
        ctx.ctx.beginPath();
        ctx.ctx.arc(railLength, 0, 7, 0, Math.PI * 2);
        ctx.ctx.fill();
      }
    }
    
    // Emitter tips at end of rails (bright when charged)
    const tipColor = chargePercent > 0.9 ? '#00ffff' : palette.city;
    ctx.ctx.fillStyle = tipColor;
    ctx.ctx.fillRect(railLength - 2, -railSpacing / 2 - railWidth / 2, 2, railWidth);
    ctx.ctx.fillRect(railLength - 2, railSpacing / 2 - railWidth / 2, 2, railWidth);
    
    ctx.ctx.restore();
    
    // Health indicator (small, below structure)
    if (healthPercent < 1) {
      const hBarWidth = 20;
      const hBarHeight = 2;
      const hBarX = x - hBarWidth / 2;
      const hBarY = y + 18;
      
      ctx.ctx.fillStyle = palette.healthBad;
      ctx.ctx.fillRect(hBarX, hBarY, hBarWidth, hBarHeight);
      
      ctx.ctx.fillStyle = palette.healthGood;
      ctx.ctx.fillRect(hBarX, hBarY, hBarWidth * healthPercent, hBarHeight);
    }
  }
}

export class RailgunBolt extends Entity {
  damage: number;
  piercing: boolean = true;
  hitEnemies: Set<string> = new Set(); // Track hit enemies to avoid hitting same enemy twice
  trailPoints: Vector2[] = [];
  particles: Array<{x: number, y: number, life: number, speed: number, angle: number}> = [];
  age: number = 0;
  maxAge: number = 2.0; // Extended for particle fade
  beamFadeTime: number = 0.8; // Beam fades quickly
  isHumanFired: boolean = false; // Different visual for human-fired bolts
  
  constructor(start: Vector2, target: Vector2, damage: number, isHumanFired: boolean = false) {
    super(`railgun_bolt_${Math.random()}`, start.x, start.y, 3);
    this.damage = damage;
    this.isHumanFired = isHumanFired;
    
    // Calculate direction - bolt travels VERY fast (essentially instant)
    const dx = target.x - start.x;
    const dy = target.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Bolt moves at 4000 px/s (reaches target almost instantly)
    const speed = 4000;
    
    if (dist > 0) {
      this.velocity = {
        x: (dx / dist) * speed,
        y: (dy / dist) * speed,
      };
    }
    
    // Store entire trail path immediately (hypersonic shot)
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.trailPoints.push({
        x: start.x + dx * t,
        y: start.y + dy * t
      });
    }
    
    // Generate particles along the trail (dissipation wave effect)
    for (let i = 0; i < 40; i++) {
      const t = Math.random();
      const particleX = start.x + dx * t;
      const particleY = start.y + dy * t;
      this.particles.push({
        x: particleX,
        y: particleY,
        life: 1.0,
        speed: 10 + Math.random() * 20,
        angle: Math.random() * Math.PI * 2
      });
    }
    
    // Position bolt at end of path (instant hit)
    this.position.x = target.x;
    this.position.y = target.y;
  }
  
  /**
   * Update bolt - ages trail and updates particles
   */
  update(deltaTime: number, width: number, height: number): void {
    this.age += deltaTime;
    
    // Update particles (drift outward slowly)
    for (const particle of this.particles) {
      particle.x += Math.cos(particle.angle) * particle.speed * deltaTime;
      particle.y += Math.sin(particle.angle) * particle.speed * deltaTime;
      particle.life -= deltaTime / this.maxAge;
    }
    
    // Deactivate after trail and particles have faded
    if (this.age >= this.maxAge) {
      this.active = false;
      return;
    }
  }
  
  /**
   * Render bolt as black core with blue halos (AI) or red with black particles (human)
   */
  render(ctx: RenderContext): void {
    const palette = ctx.palette;
    
    // Beam fades quickly, particles linger longer
    const beamFade = Math.max(0, 1 - (this.age / this.beamFadeTime));
    
    // Color scheme based on firing mode
    const colors = this.isHumanFired ? {
      outer: { r: 255, g: 50, b: 50 },    // Red outer glow
      middle: { r: 255, g: 100, b: 80 },  // Orange-red middle
      inner: { r: 255, g: 150, b: 120 },  // Lighter red inner
      core: { r: 20, g: 0, b: 0 },        // Dark red/black core
      particle1: { r: 200, g: 0, b: 0 },  // Red particle
      particle2: { r: 100, g: 0, b: 0 }   // Dark red particle
    } : {
      outer: { r: 60, g: 140, b: 255 },   // Blue outer glow
      middle: { r: 80, g: 180, b: 255 },  // Bright blue middle
      inner: { r: 120, g: 200, b: 255 },  // Light blue inner
      core: { r: 0, g: 0, b: 0 },         // Black core
      particle1: { r: 100, g: 180, b: 255 }, // Blue particle
      particle2: { r: 150, g: 220, b: 255 }  // Light blue particle
    };
    
    // Draw the beam trail (fades first)
    if (beamFade > 0 && this.trailPoints.length > 1) {
      for (let i = 0; i < this.trailPoints.length - 1; i++) {
        const segmentFade = (i / this.trailPoints.length) * 0.3 + 0.7;
        const alpha = beamFade * segmentFade;
        
        // Outer halo (soft glow)
        ctx.ctx.strokeStyle = `rgba(${colors.outer.r}, ${colors.outer.g}, ${colors.outer.b}, ${alpha * 0.3})`;
        ctx.ctx.lineWidth = 14;
        ctx.ctx.beginPath();
        ctx.ctx.moveTo(this.trailPoints[i].x, this.trailPoints[i].y);
        ctx.ctx.lineTo(this.trailPoints[i + 1].x, this.trailPoints[i + 1].y);
        ctx.ctx.stroke();
        
        // Middle halo (brighter)
        ctx.ctx.strokeStyle = `rgba(${colors.middle.r}, ${colors.middle.g}, ${colors.middle.b}, ${alpha * 0.5})`;
        ctx.ctx.lineWidth = 8;
        ctx.ctx.beginPath();
        ctx.ctx.moveTo(this.trailPoints[i].x, this.trailPoints[i].y);
        ctx.ctx.lineTo(this.trailPoints[i + 1].x, this.trailPoints[i + 1].y);
        ctx.ctx.stroke();
        
        // Inner ring
        ctx.ctx.strokeStyle = `rgba(${colors.inner.r}, ${colors.inner.g}, ${colors.inner.b}, ${alpha * 0.7})`;
        ctx.ctx.lineWidth = 4;
        ctx.ctx.beginPath();
        ctx.ctx.moveTo(this.trailPoints[i].x, this.trailPoints[i].y);
        ctx.ctx.lineTo(this.trailPoints[i + 1].x, this.trailPoints[i + 1].y);
        ctx.ctx.stroke();
        
        // Dark core
        ctx.ctx.strokeStyle = `rgba(${colors.core.r}, ${colors.core.g}, ${colors.core.b}, ${alpha * 0.9})`;
        ctx.ctx.lineWidth = 2;
        ctx.ctx.beginPath();
        ctx.ctx.moveTo(this.trailPoints[i].x, this.trailPoints[i].y);
        ctx.ctx.lineTo(this.trailPoints[i + 1].x, this.trailPoints[i + 1].y);
        ctx.ctx.stroke();
      }
    }
    
    // Draw dissipation particles (linger after beam fades)
    for (const particle of this.particles) {
      if (particle.life <= 0) continue;
      
      const particleAlpha = particle.life * 0.6;
      
      // Colored glow particle
      ctx.ctx.fillStyle = `rgba(${colors.particle1.r}, ${colors.particle1.g}, ${colors.particle1.b}, ${particleAlpha * 0.5})`;
      ctx.ctx.beginPath();
      ctx.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.ctx.fill();
      
      // Bright center
      ctx.ctx.fillStyle = `rgba(${colors.particle2.r}, ${colors.particle2.g}, ${colors.particle2.b}, ${particleAlpha})`;
      ctx.ctx.beginPath();
      ctx.ctx.arc(particle.x, particle.y, 1.5, 0, Math.PI * 2);
      ctx.ctx.fill();
    }
  }
}
