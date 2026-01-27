/**
 * AI controller system
 * Manages multiple AI instances playing the game
 */

import { Vector2, distance } from '../utils/math';
import { Enemy } from './enemies';
import { City, Tower } from './city';
import { Projectile } from './projectiles';
import { GameState } from '../core/gameState';

export interface AIInstance {
  id: string;
  difficulty: number; // 0-1, higher = more skilled
  towers: Tower[];
  targetEnemy: Enemy | null;
  reactionTime: number; // Milliseconds to react
  lastReactionTime: number;
  coordinationLevel: number; // 0-1, how much AI coordinates with others
}

export class AIController {
  private aiInstances: AIInstance[] = [];
  private gameState: GameState;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private cities: City[] = [];
  private width: number;
  private height: number;

  constructor(gameState: GameState, width: number, height: number) {
    this.gameState = gameState;
    this.width = width;
    this.height = height;
  }

  /**
   * Initialize AI instances
   */
  initializeAI(count: number, difficulty: number): void {
    this.aiInstances = [];
    
    for (let i = 0; i < count; i++) {
      const instance: AIInstance = {
        id: `ai_${i}`,
        difficulty: difficulty,
        towers: [],
        targetEnemy: null,
        reactionTime: 200 - difficulty * 150, // 50-200ms
        lastReactionTime: 0,
        coordinationLevel: 0,
      };
      
      this.aiInstances.push(instance);
    }
  }
  
  /**
   * Initialize AI for cities (one AI per city with its 2 towers)
   */
  initializeAIForCities(cities: City[], towers: Tower[], difficulty: number): void {
    this.aiInstances = [];
    this.cities = cities;
    
    // Create one AI per city
    for (let i = 0; i < cities.length; i++) {
      const city = cities[i];
      
      // Find the 2 towers belonging to this city
      const cityTowers = towers.filter(t => t.parentCity === city && !t.isDestroyed());
      
      const instance: AIInstance = {
        id: `ai_city_${i}`,
        difficulty: difficulty,
        towers: cityTowers,
        targetEnemy: null,
        reactionTime: 200 - difficulty * 150, // 50-200ms
        lastReactionTime: 0,
        coordinationLevel: city.stance === 'cooperative' ? 0.8 : city.stance === 'selfish' ? 0.2 : 0.5,
      };
      
      this.aiInstances.push(instance);
    }
  }
  
  /**
   * Update tower lists for each AI (refresh after damage/repair)
   */
  updateTowerLists(towers: Tower[]): void {
    for (let i = 0; i < this.aiInstances.length && i < this.cities.length; i++) {
      const ai = this.aiInstances[i];
      const city = this.cities[i];
      
      // Update tower list with only active towers for this city
      ai.towers = towers.filter(t => t.parentCity === city && t.active && !t.isDestroyed());
    }
  }

  /**
   * Set game entities for AI
   */
  setGameEntities(enemies: Enemy[], projectiles: Projectile[], cities: City[]): void {
    this.enemies = enemies;
    this.projectiles = projectiles;
    this.cities = cities;
  }

  /**
   * Update AI
   */
  update(deltaTime: number): Projectile[] {
    const newProjectiles: Projectile[] = [];
    const currentTime = this.gameState.gameTime;

    // Update coordination based on level/difficulty
    this.updateCoordination();

    // Each AI makes decisions
    for (const ai of this.aiInstances) {
      // Check if it's time for this AI to react
      if (currentTime - ai.lastReactionTime > ai.reactionTime) {
        ai.lastReactionTime = currentTime;

        // Each tower independently selects targets (important for flak towers)
        for (const tower of ai.towers) {
          if (!tower.active || tower.isDestroyed()) continue;
          
          // Find best target for this specific tower (flak prioritizes nearby)
          const bestTarget = this.findBestTarget(ai, tower);
          
          if (!bestTarget) continue;
          
          // Calculate hit probability based on difficulty
          const distanceToEnemy = distance(tower.position, bestTarget.position);
          const interceptChance = 0.5 + ai.difficulty * 0.5; // 50-100% chance to hit

          if (Math.random() < interceptChance) {
            // Fire at predicted position
            const predictedPos = this.predictEnemyPosition(bestTarget, distanceToEnemy, tower.position);
            
            // Check if can fire at target (angle and obstacles)
            const groundY = this.height - 40;
            if (tower.canFireAt(predictedPos, this.cities, groundY) && tower.fire(currentTime, predictedPos)) {
              // Flak towers fire explosive projectiles
              const explosionRadius = tower.isFlakTower ? 35 : 0;
              const projectile = new Projectile(
                tower.position,
                predictedPos,
                250,
                tower.damage,
                '#00FF00',
                explosionRadius
              );
              newProjectiles.push(projectile);
            }
          }
        }
      }
    }

    return newProjectiles;
  }

  /**
   * Find best target for AI
   */
  private findBestTarget(ai: AIInstance, tower: Tower): Enemy | null {
    if (this.enemies.length === 0) return null;

    let bestTarget: Enemy | null = null;
    let bestScore = -Infinity;
    
    // Flak towers prioritize nearby enemies over high altitude
    const isFlakTower = tower.isFlakTower;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      // Score based on threat level
      let score = 0;

      // Distance from this tower
      const distToTower = distance(tower.position, enemy.position);
      
      // Flak towers STRONGLY prioritize nearby enemies
      if (isFlakTower) {
        // Flak inverts distance priority - closer is MUCH better
        if (distToTower < tower.range) {
          score += (tower.range - distToTower) * 3; // Massive boost for close targets
        } else {
          continue; // Skip out-of-range targets entirely for flak
        }
      }

      // Priority 1: Boss-like enemies (high health)
      if (enemy.maxHealth > 150) {
        score += 150;
      }

      // Priority 2: Meteors heading towards cities (trajectory check)
      let closestCity = this.cities[0];
      let minDistToCity = Infinity;
      
      for (const city of this.cities) {
        if (city.isDestroyed()) continue;
        const distToCity = distance(enemy.position, city.position);
        if (distToCity < minDistToCity) {
          minDistToCity = distToCity;
          closestCity = city;
        }
      }
      
      // Check if enemy is heading towards a city
      const dx = closestCity.position.x - enemy.position.x;
      const velocityTowardsCity = enemy.velocity.x * dx > 0 || enemy.velocity.y > 0;
      
      if (velocityTowardsCity && minDistToCity < 400) {
        score += 200; // High priority for threats heading to cities
        score += Math.max(0, 300 - minDistToCity); // Closer = more urgent
        
        // Flak towers get extra bonus if enemy threatens their parent city
        if (isFlakTower && tower.parentCity === closestCity) {
          score += 300; // DEFEND HOME!
        }
      } else {
        score += Math.max(0, 100 - minDistToCity * 0.5);
      }

      // Priority 3: In range of towers (less important for flak, already handled)
      if (!isFlakTower) {
        const inRange = ai.towers.some(
          t => distance(t.position, enemy.position) < t.range
        );
        if (inRange) score += 80;
      }

      // Priority 4: High altitude targets (AI should shoot early) - NOT for flak
      if (!isFlakTower && enemy.position.y < this.height * 0.3) {
        score += 60; // Prioritize high-altitude threats
      }

      // Add coordination bonus (high-coordination AIs focus fire)
      if (ai.coordinationLevel > 0.7 && ai.targetEnemy && ai.targetEnemy.id === enemy.id) {
        score += ai.coordinationLevel * 50;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTarget = enemy;
      }
    }

    return bestTarget;
  }

  /**
   * Predict where enemy will be
   */
  private predictEnemyPosition(enemy: Enemy, distance: number, from: Vector2): Vector2 {
    // Rough prediction based on enemy speed and direction
    const timeToHit = distance / 250; // Projectile speed
    const predictedX = enemy.position.x + enemy.velocity.x * timeToHit;
    const predictedY = enemy.position.y + enemy.velocity.y * timeToHit;

    // Add some inaccuracy based on AI difficulty
    const inaccuracy = (1 - this.aiInstances[0]?.difficulty || 0.5) * 20;
    return {
      x: predictedX + (Math.random() - 0.5) * inaccuracy,
      y: predictedY + (Math.random() - 0.5) * inaccuracy,
    };
  }

  /**
   * Update coordination based on game progression
   */
  private updateCoordination(): void {
    // Coordination scales with difficulty and level
    const baseCoordination = (this.gameState.level / 10) * 0.6; // 0-0.6
    const difficultyBonus = this.gameState.wave > 5 ? 0.3 : 0; // +0.3 after wave 5
    
    for (const ai of this.aiInstances) {
      ai.coordinationLevel = Math.min(1, baseCoordination + difficultyBonus);
    }
  }

  /**
   * Get AI instances
   */
  getAIInstances(): AIInstance[] {
    return this.aiInstances;
  }

  /**
   * Get AI count
   */
  getAICount(): number {
    return this.aiInstances.length;
  }

  /**
   * Assign towers to AIs
   */
  assignTowersToAI(towers: Tower[]): void {
    if (this.aiInstances.length === 0 || towers.length === 0) return;

    // Distribute towers evenly among AIs
    const towersPerAI = Math.ceil(towers.length / this.aiInstances.length);
    
    let towerIndex = 0;
    for (const ai of this.aiInstances) {
      ai.towers = [];
      for (let i = 0; i < towersPerAI && towerIndex < towers.length; i++) {
        ai.towers.push(towers[towerIndex]);
        towerIndex++;
      }
    }
  }

  /**
   * Get coordination level override (debug)
   */
  setCoordinationOverride(level: number): void {
    for (const ai of this.aiInstances) {
      ai.coordinationLevel = Math.max(0, Math.min(1, level));
    }
  }
}
