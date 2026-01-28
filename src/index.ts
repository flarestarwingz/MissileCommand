/**
 * Main application - ties together all systems
 */

import { GameEngine } from './core/gameEngine';
import { GameState, GameStateType, GameEra } from './core/gameState';
import { SettingsManager } from './core/settingsManager';
import { CanvasRenderer } from './rendering/canvas';
import { PaletteManager } from './rendering/palette';
import { City, Tower, SharedTruck } from './entities/city';
import { Enemy } from './entities/enemies';
import { Projectile, Explosion } from './entities/projectiles';
import { AIController } from './entities/ai';
import { MobileDefender } from './entities/mobileDefender';
import { Railgun, RailgunBolt } from './entities/railgun';
import { HUD, GameOverScreen } from './ui/hud';
import { InputHandler } from './utils/input';
import { checkCircleCollision, checkCircleRectCollision } from './utils/collision';
import { distance, random, randomInt } from './utils/math';
import { loadGimmicksConfig, getRandomGimmickFromEra } from './utils/configLoader';
import { setupWallpaperEngine } from './wallpaperEngine/integration';

export class MissileCommandWallpaper {
  private gameEngine: GameEngine;
  private settingsManager: SettingsManager;
  private canvas: HTMLCanvasElement;
  private renderer: CanvasRenderer;
  private paletteManager: PaletteManager;
  private inputHandler: InputHandler;
  private aiController: AIController;
  private hud: HUD;
  private gameOverScreen: GameOverScreen;

  // Game entities
  private cities: City[] = [];
  private towers: Tower[] = [];
  private sharedTrucks: SharedTruck[] = []; // Shared truck resources between adjacent cities
  private railguns: Railgun[] = []; // Railguns for end cities
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private explosions: Explosion[] = [];
  private mobileDefenders: MobileDefender[] = [];
  private railgunBolts: RailgunBolt[] = []; // Railgun projectiles

  // Game flow
  private waveSpawner: WaveSpawner;
  private lastFrameTime: number = Date.now();
  private frameCount: number = 0;
  private fps: number = 0;
  
  // Super weapon system
  private superWeaponAvailable: boolean = true;
  private superWeaponActive: boolean = false;
  private superWeaponAnimationTime: number = 0;
  
  // Debug mode
  private debugClickMode: boolean = false;

  constructor(canvasId: string) {
    // Setup canvas
    const canvasElement = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvasElement) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }
    this.canvas = canvasElement;

    // Initialize systems
    this.settingsManager = new SettingsManager();
    this.paletteManager = new PaletteManager(this.settingsManager.getSettings().colorPalette);
    this.renderer = new CanvasRenderer(this.canvas, this.paletteManager);
    this.inputHandler = new InputHandler(this.canvas);
    this.gameEngine = new GameEngine(
      this.renderer.getDimensions().width,
      this.renderer.getDimensions().height,
      this.settingsManager.getSettings()
    );
    this.aiController = new AIController(
      this.gameEngine.getGameState(),
      this.renderer.getDimensions().width,
      this.renderer.getDimensions().height
    );
    this.hud = new HUD();
    this.gameOverScreen = new GameOverScreen();
    const settings = this.settingsManager.getSettings();
    this.waveSpawner = new WaveSpawner(settings.difficulty);

    // Setup event handlers
    this.setupEventHandlers();
    this.setupWallpaperEngine();
    
    // Initialize game
    this.initializeGame();

    // Start game loop
    this.gameEngine.setOnUpdate((deltaTime) => this.update(deltaTime));
    this.gameEngine.start();
    this.startRenderLoop();
  }

  /**
   * Initialize game
   */
  private initializeGame(): void {
    this.cities = this.createCities();
    this.towers = this.createTowers();
    this.createSharedTrucks(); // Create shared truck resources between adjacent cities
    this.createRailguns(); // Create railguns for end cities
    
    const settings = this.settingsManager.getSettings();
    // Use aiAccuracy setting for AI skill (0-1)
    const aiAccuracy = settings.aiAccuracy || 0.7;
    
    // Initialize AI based on active cities (one AI per city)
    this.aiController.initializeAIForCities(this.cities, this.towers, aiAccuracy);
    
    // Set era start for wave spawner
    this.waveSpawner.setEraStart(this.gameEngine.getGameState().wave);
    
    this.gameEngine.getGameState().nextWave();
  }

  /**
   * Create cities
   */
  private createCities(preserveExisting: boolean = false): City[] {
    const { width, height } = this.renderer.getDimensions();
    const cities: City[] = [];
    
    const settings = this.settingsManager.getSettings();
    const count = settings.cityCount || 4;
    const spacing = width / (count + 1);
    
    // Scale city size based on count (more cities = smaller)
    const baseRadius = 20;
    const scaledRadius = Math.max(12, baseRadius - (count - 4) * 2);
    
    // Store old city data if preserving
    const oldCityData = preserveExisting ? this.cities.map(c => ({
      health: c.health,
      maxHealth: c.maxHealth,
      stance: c.stance,
      helpfulnessScore: c.helpfulnessScore,
      helpHistory: c.helpHistory
    })) : [];
    
    for (let i = 0; i < count; i++) {
      const x = spacing * (i + 1);
      const y = height - 50;
      const city = new City(x, y, 0);
      city.radius = scaledRadius;
      
      // Restore health and personality from old city if available
      if (preserveExisting && i < oldCityData.length) {
        city.health = oldCityData[i].health;
        city.maxHealth = oldCityData[i].maxHealth;
        city.stance = oldCityData[i].stance;
        city.helpfulnessScore = oldCityData[i].helpfulnessScore;
        city.helpHistory = oldCityData[i].helpHistory;
      }
      
      cities.push(city);
    }
    
    return cities;
  }

  /**
   * Create towers
   */
  private createTowers(): Tower[] {
    const towers: Tower[] = [];
    
    // Create 2 towers per city (left and right)
    for (const city of this.cities) {
      const leftTower = new Tower(city.x - 40, city.y + 30, 0, 'left');
      const rightTower = new Tower(city.x + 40, city.y + 30, 0, 'right');
      
      leftTower.parentCity = city;
      rightTower.parentCity = city;
      
      towers.push(leftTower);
      towers.push(rightTower);
    }
    
    return towers;
  }

  /**
   * Create shared truck resources between adjacent cities
   */
  private createSharedTrucks(): void {
    this.sharedTrucks = [];
    
    // Create shared trucks for each pair of adjacent cities
    for (let i = 0; i < this.cities.length - 1; i++) {
      const cityA = this.cities[i];
      const cityB = this.cities[i + 1];
      
      const sharedTruck = new SharedTruck(cityA, cityB);
      this.sharedTrucks.push(sharedTruck);
      
      // Link the truck to both cities
      cityA.rightSharedTruck = sharedTruck;
      cityB.leftSharedTruck = sharedTruck;
    }
    
    console.log(`Created ${this.sharedTrucks.length} shared trucks between ${this.cities.length} cities`);
  }

  /**
   * Create railguns for end cities (cities without neighbors)
   */
  private createRailguns(): void {
    this.railguns = [];
    
    if (this.cities.length === 0) return;
    
    const screenWidth = this.renderer.getDimensions().width;
    
    // First city gets a left-pointing railgun if no left neighbor
    if (this.cities.length > 0) {
      const firstCity = this.cities[0];
      if (!firstCity.leftSharedTruck) {
        const railgun = new Railgun(firstCity, 'left', screenWidth);
        this.railguns.push(railgun);
        console.log(`Created left railgun for city ${firstCity.id}`);
      }
    }
    
    // Last city gets a right-pointing railgun if no right neighbor
    if (this.cities.length > 0) {
      const lastCity = this.cities[this.cities.length - 1];
      if (!lastCity.rightSharedTruck) {
        const railgun = new Railgun(lastCity, 'right', screenWidth);
        this.railguns.push(railgun);
        console.log(`Created right railgun for city ${lastCity.id}`);
      }
    }
    
    console.log(`Created ${this.railguns.length} railguns for end cities`);
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Settings changes
    this.settingsManager.onChange((settings) => {
      this.paletteManager.setPalette(settings.colorPalette);
      this.gameEngine.getSettings().updateSettings(settings);
    });

    // Window resize
    window.addEventListener('resize', () => this.handleResize());

    // Mouse input for help
    this.inputHandler.on('mousedown', (pos) => {
      if (this.gameEngine.getGameState().state === GameStateType.PLAYING) {
        this.handleMouseShot(pos);
      }
    });

    // HUD click handling (simplified)
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if clicked on settings expander (simplified)
      if (x > this.renderer.getDimensions().width - 260 && x < this.renderer.getDimensions().width - 10) {
        if (y < 30) {
          this.hud.toggleSection('settings');
        }
      }
    });
  }

  /**
   * Setup Wallpaper Engine integration
   */
  private setupWallpaperEngine(): void {
    setupWallpaperEngine((settings) => {
      this.settingsManager.updateSettings(settings);
    });
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    const oldWidth = this.renderer.getDimensions().width;
    const oldHeight = this.renderer.getDimensions().height;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Calculate scaling factors
    const scaleX = width / oldWidth;
    const scaleY = height / oldHeight;
    
    // Reposition cities proportionally
    const groundY = height - 50;
    for (const city of this.cities) {
      city.position.x *= scaleX;
      city.x = city.position.x;
      city.position.y = groundY;
      city.y = groundY;
    }
    
    // Reposition towers with their parent cities
    for (const tower of this.towers) {
      if (tower.parentCity) {
        const offsetX = tower.position.x - tower.parentCity.x;
        tower.position.x = tower.parentCity.x + offsetX;
        tower.position.y = tower.parentCity.y + 30;
      }
    }
    
    // Reposition mobile defenders proportionally
    for (const defender of this.mobileDefenders) {
      defender.position.x *= scaleX;
      defender.position.y = Math.min(defender.position.y * scaleY, groundY);
    }
    
    this.renderer.resize(width, height);
    this.gameEngine.resize(width, height);
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * Handle mouse shot
   */
  private handleMouseShot(pos: { x: number; y: number }): void {
    if (this.towers.length === 0) return;
    
    // Debug click mode
    if (this.debugClickMode) {
      const { height } = this.renderer.getDimensions();
      
      // Check if clicked on a city
      for (const city of this.cities) {
        const dist = distance(pos, city.position);
        if (dist < city.radius * 2) {
          // Destroy city
          city.health = 0;
          city.active = false;
          console.log(`Debug: Destroyed city at (${city.position.x}, ${city.position.y})`);
          return;
        }
      }
      
      // Check if clicked on a tower
      for (const tower of this.towers) {
        const dist = distance(pos, tower.position);
        if (dist < tower.radius * 2) {
          // Destroy tower
          tower.health = 0;
          tower.active = false;
          console.log(`Debug: Destroyed tower at (${tower.position.x}, ${tower.position.y})`);
          return;
        }
      }
      
      // If clicked in top half, spawn enemy
      if (pos.y < height * 0.5) {
        const gameState = this.gameEngine.getGameState();
        const era = gameState.era;
        const eraName = era as string;
        const config = this.waveSpawner.getEraGimmickConfig(eraName);
        
        if (config) {
          const enemy = new Enemy(pos.x, -30, config);
          this.enemies.push(enemy);
          console.log(`Debug: Spawned ${config.name} at (${pos.x}, -30)`);
        }
        return;
      }
    }
    
    // Normal tower firing

    // Find closest tower and fire towards mouse
    let closestTower = this.towers[0];
    let minDist = distance(closestTower.position, pos);

    for (const tower of this.towers) {
      const d = distance(tower.position, pos);
      if (d < minDist) {
        minDist = d;
        closestTower = tower;
      }
    }

    const groundY = this.renderer.getDimensions().height - 40;
    if (closestTower.canFireAt(pos, this.cities, groundY) && closestTower.fire(this.gameEngine.getGameState().gameTime, pos)) {
      const projectile = new Projectile(closestTower.position, pos, 250, closestTower.damage, '#00FF00');
      this.projectiles.push(projectile);
    }
  }

  /**
   * City communication and defender deployment
   */
  private updateCityCommunication(gameTime: number): void {
    const activeCities = this.cities.filter(c => !c.isDestroyed());
    const groundY = this.renderer.getDimensions().height - 40;
    
    for (let i = 0; i < activeCities.length; i++) {
      const cityA = activeCities[i];
      
      // Assess local threat
      const threatLevel = cityA.assessThreat(this.enemies, gameTime);
      
      // Allow deployment even with turrets up, but prefer when turrets are down
      const activeTowers = this.towers.filter(t => t.parentCity === cityA && t.active && !t.isDestroyed()).length;
      
      // Check if we can deploy left or right truck
      const canDeployLeft = cityA.canDeployDefender('left');
      const canDeployRight = cityA.canDeployDefender('right');
      
      // Adjust threat threshold based on turret count: 0.4 if turrets down, 0.7 if turrets up
      const threatThreshold = activeTowers < 2 ? 0.4 : 0.7;
      const shouldConsiderDeployment = threatLevel > threatThreshold && (canDeployLeft || canDeployRight);
      
      // If threat is critical and city can deploy
      if (shouldConsiderDeployment) {
        // Find nearest other city to coordinate with
        let nearestCity: City | null = null;
        let minDist = Infinity;
        
        for (let j = 0; j < activeCities.length; j++) {
          if (i === j) continue;
          const cityB = activeCities[j];
          const d = distance(cityA.position, cityB.position);
          if (d < minDist) {
            minDist = d;
            nearestCity = cityB;
          }
        }
        
        // Coordinate with nearest city
        if (nearestCity) {
          cityA.isCommunicating = true;
          cityA.communicationTarget = nearestCity;
          
          // Determine direction (left or right) based on x position
          const direction = nearestCity.position.x < cityA.position.x ? 'left' : 'right';
          const canDeploy = cityA.canDeployDefender(direction);
          
          if (!canDeploy) {
            // Can't deploy in this direction, try other cities
            cityA.isCommunicating = false;
            cityA.communicationTarget = null;
            continue;
          }
          
          // Both cities assess threat independently
          const cityBThreat = nearestCity.assessThreat(this.enemies, gameTime);
          
          // Check help history between cities
          const helpBalance = cityA.helpHistory.get(nearestCity.id) || 0;
          
          // Determine if cityB will help based on stance and history
          let cityBWillHelp = cityBThreat > 0.5;
          
          if (nearestCity.stance === 'selfish') {
            // Selfish cities only help if they also have high threat or owed help
            cityBWillHelp = cityBThreat > 0.7 || helpBalance > 2;
          } else if (nearestCity.stance === 'cooperative') {
            // Cooperative cities help more easily
            cityBWillHelp = cityBThreat > 0.3 || helpBalance < -1;
          }
          
          // Deploy if both agree (lowered threshold to 0.45 so cities deploy earlier)
          if (cityBWillHelp && threatLevel > 0.45) {
            console.log(`Cities ${cityA.id} & ${nearestCity.id} agreed! Threat: ${threatLevel.toFixed(2)}/${cityBThreat.toFixed(2)}, Balance: ${helpBalance}, Stance: ${nearestCity.stance}, Direction: ${direction}`);
            
            if (cityA.deployDefender(direction)) {
              // Decide deployment location based on threat distribution
              const cityAThreat = threatLevel;
              const cityBThreatLevel = cityBThreat;
              
              let deployX: number;
              if (cityAThreat > cityBThreatLevel + 0.2) {
                // Deploy closer to cityA (higher threat)
                deployX = cityA.position.x * 0.7 + nearestCity.position.x * 0.3;
              } else if (cityBThreatLevel > cityAThreat + 0.2) {
                // Deploy closer to cityB
                deployX = cityA.position.x * 0.3 + nearestCity.position.x * 0.7;
              } else {
                // Deploy in middle
                deployX = (cityA.position.x + nearestCity.position.x) / 2;
              }
              
              const defender = new MobileDefender(
                cityA.position,
                { x: deployX, y: groundY },
                groundY
              );
              defender.sourceCityA = cityA;
              defender.sourceCityB = nearestCity;
              this.mobileDefenders.push(defender);
              
              // Update help history
              cityA.timesHelped++;
              cityA.helpfulnessScore += 5;
              nearestCity.helpfulnessScore += 10; // Helper gets more credit
              
              const currentBalance = cityA.helpHistory.get(nearestCity.id) || 0;
              cityA.helpHistory.set(nearestCity.id, currentBalance - 1); // cityA owes cityB
              
              const reciprocalBalance = nearestCity.helpHistory.get(cityA.id) || 0;
              nearestCity.helpHistory.set(cityA.id, reciprocalBalance + 1); // cityB is owed
            }
            
            // Clear communication
            cityA.isCommunicating = false;
            cityA.communicationTarget = null;
          } else if (!cityBWillHelp) {
            console.log(`City ${nearestCity.id} refused help! Stance: ${nearestCity.stance}, Balance: ${helpBalance}, Threat: ${cityBThreat.toFixed(2)}`);
            
            // Update refusal tracking
            nearestCity.timesRefusedHelp++;
            nearestCity.helpfulnessScore -= 10;
            
            // Update help history negatively
            const currentBalance = cityA.helpHistory.get(nearestCity.id) || 0;
            cityA.helpHistory.set(nearestCity.id, currentBalance + 1); // cityB owes cityA (didn't help)
          }
        }
      } else {
        // No threat or can't deploy - clear communication
        cityA.isCommunicating = false;
        cityA.communicationTarget = null;
      }
    }
  }
  
  /**
   * Super weapon voting and activation
   */
  private updateSuperWeaponVoting(gameTime: number): void {
    if (!this.superWeaponAvailable || this.superWeaponActive) return;
    
    const activeCities = this.cities.filter(c => !c.isDestroyed());
    if (activeCities.length === 0) return;
    
    // Calculate panic level - look ahead at incoming threats
    const groundY = this.renderer.getDimensions().height - 40;
    let incomingThreats = 0;
    let fastIncomingThreats = 0;
    
    for (const enemy of this.enemies) {
      const distToGround = enemy.position.y - groundY;
      if (distToGround > 0) {
        // Enemy is above ground, heading down
        const timeToImpact = Math.abs(distToGround / enemy.velocity.y);
        if (timeToImpact < 10) { // Less than 10 seconds
          incomingThreats++;
          if (timeToImpact < 5) fastIncomingThreats++;
        }
      }
    }
    
    const totalEnemies = this.enemies.length;
    const panicMode = (incomingThreats > 20 || (fastIncomingThreats > 10 && totalEnemies > 15));
    
    // Each city votes based on threat level and personality
    activeCities.forEach(city => {
      const threatLevel = city.assessThreat(this.enemies, gameTime);
      city.superWeaponConcern = threatLevel;
      
      // PANIC MODE: If situation is overwhelming, even selfish cities agree
      if (panicMode) {
        // Still use personality but with lower thresholds
        if (city.stance === 'cooperative') {
          city.votedForSuperWeapon = threatLevel > 0.5;
        } else if (city.stance === 'selfish') {
          city.votedForSuperWeapon = threatLevel > 0.7; // Selfish panic at higher threshold
        } else {
          city.votedForSuperWeapon = threatLevel > 0.6;
        }
      } else {
        // Normal voting criteria: high threat + personality consideration
        if (city.stance === 'cooperative') {
          city.votedForSuperWeapon = threatLevel > 0.8; // Cooperative cities agree easier
        } else if (city.stance === 'selfish') {
          city.votedForSuperWeapon = threatLevel > 0.95 && city.health < 50; // Selfish only when desperate
        } else {
          city.votedForSuperWeapon = threatLevel > 0.9; // Neutral needs high threat
        }
      }
    });
    
    // Check if ALL cities agree
    const allAgree = activeCities.every(c => c.votedForSuperWeapon);
    
    if (allAgree && activeCities.length > 0) {
      console.log(`🚀 ALL CITIES AGREED! Activating super weapon!`);
      this.activateSuperWeapon();
      
      // Reset votes
      activeCities.forEach(c => c.votedForSuperWeapon = false);
    }
  }
  
  /**
   * Activate super weapon - clears screen with era-specific effect
   */
  private activateSuperWeapon(): void {
    this.superWeaponActive = true;
    this.superWeaponAnimationTime = 0;
    this.superWeaponAvailable = false; // One per era
    
    const gameState = this.gameEngine.getGameState();
    const era = gameState.era;
    
    console.log(`Super weapon activated for era: ${era}`);
    
    // Destroy all enemies
    this.enemies.forEach(enemy => {
      enemy.active = false;
      
      // Create era-specific explosions
      const explosion = new Explosion(
        enemy.position,
        enemy.radius * 4,
        0.8,
        era === 'meteors' ? '#FFAA00' : era === 'eighties_missiles' ? '#FF0080' : '#00FFFF',
        enemy.maxHealth * 2
      );
      this.explosions.push(explosion);
    });
    
    // Bonus: Heal all cities slightly for cooperation
    this.cities.forEach(city => {
      if (!city.isDestroyed()) {
        city.repair(20);
        city.helpfulnessScore += 15; // Big cooperation boost
      }
    });
  }

  /**
   * Update game
   */
  private update(deltaTime: number): void {
    const gameState = this.gameEngine.getGameState();

    // Update entities
    this.cities.forEach(city => city.update(deltaTime, this.renderer.getDimensions().width, this.renderer.getDimensions().height));
    
    // Update shared truck cooldowns
    this.sharedTrucks.forEach(truck => truck.update(deltaTime));
    
    this.towers.forEach(tower => {
      tower.update(deltaTime, this.renderer.getDimensions().width, this.renderer.getDimensions().height);
      
      // Destroy tower if parent city is destroyed
      if (tower.parentCity && tower.parentCity.isDestroyed() && !tower.isDestroyed()) {
        tower.takeDamage(tower.health); // Destroy tower
        console.log(`Tower ${tower.id} destroyed with parent city ${tower.parentCity.id}`);
      }
      
      // Repair towers based on parent city repair rate
      if (tower.parentCity && tower.health < tower.maxHealth && !tower.parentCity.isDestroyed()) {
        tower.repair(tower.parentCity.repairRate * deltaTime * 0.5); // Towers repair at half city rate
      }
    });
    
    // Repair railguns (very slow - 25% of tower rate = 12.5% of city rate)
    for (const railgun of this.railguns) {
      if (railgun.parentCity && !railgun.parentCity.isDestroyed() && railgun.health < railgun.maxHealth) {
        const repairAmount = railgun.parentCity.repairRate * deltaTime * 0.5 * 0.25; // 25% of tower rate
        railgun.health = Math.min(railgun.maxHealth, railgun.health + repairAmount);
      }
    }
    
    // Update AI tower lists (remove destroyed, update based on cities)
    this.aiController.updateTowerLists(this.towers);
    
    // Check for super weapon agreement
    this.updateSuperWeaponVoting(gameState.gameTime);
    
    // Update super weapon animation
    if (this.superWeaponActive) {
      this.superWeaponAnimationTime += deltaTime;
      if (this.superWeaponAnimationTime > 3) { // 3 second animation
        this.superWeaponActive = false;
        this.superWeaponAnimationTime = 0;
      }
    }
    
    // Debug enemy status
    if (this.enemies.length > 0 && this.frameCount % 60 === 0) {
      console.log(`Frame ${this.frameCount}: Enemies before filter: ${this.enemies.length}, active: ${this.enemies.filter(e => e.active).length}`);
      if (this.enemies.length > 0) {
        const first = this.enemies[0];
        console.log(`  First enemy at: (${Math.round(first.position.x)}, ${Math.round(first.position.y)}), active: ${first.active}, behavior: ${first.behavior}`);
      }
    }
    
    const enemiesBeforeFilter = this.enemies.length;
    this.enemies = this.enemies.filter(e => e.active);
    const enemiesAfterFilter = this.enemies.length;
    
    if (enemiesBeforeFilter !== enemiesAfterFilter) {
      console.log(`Filtered out ${enemiesBeforeFilter - enemiesAfterFilter} inactive enemies`);
    }
    
    this.enemies.forEach(enemy => enemy.update(deltaTime, this.renderer.getDimensions().width, this.renderer.getDimensions().height));
    this.projectiles = this.projectiles.filter(p => p.active);
    this.projectiles.forEach(proj => proj.update(deltaTime, this.renderer.getDimensions().width, this.renderer.getDimensions().height));
    this.explosions = this.explosions.filter(e => e.active);
    this.explosions.forEach(exp => exp.update(deltaTime, this.renderer.getDimensions().width, this.renderer.getDimensions().height));

    // Update mobile defenders
    this.mobileDefenders = this.mobileDefenders.filter(d => d.active);
    this.mobileDefenders.forEach(def => {
      def.update(deltaTime, this.renderer.getDimensions().width, this.renderer.getDimensions().height);
      
      // Take rapid damage if either parent city is destroyed
      if ((def.sourceCityA && def.sourceCityA.isDestroyed()) || 
          (def.sourceCityB && def.sourceCityB.isDestroyed())) {
        // Take 20% health per second when city destroyed
        const tower = def.getTower();
        if (tower) {
          tower.takeDamage(tower.maxHealth * 0.2 * deltaTime);
          if (tower.isDestroyed()) {
            def.active = false;
          }
        }
      }
    });
    
    // Check for city communication and defender deployment
    this.updateCityCommunication(gameState.gameTime);

    // AI updates
    this.aiController.setGameEntities(this.enemies, this.projectiles, this.cities);
    const aiProjectiles = this.aiController.update(deltaTime);
    if (aiProjectiles.length > 0) {
      console.log(`AI fired ${aiProjectiles.length} projectiles`);
    }
    this.projectiles.push(...aiProjectiles);
    
    // Collect projectiles from mobile defenders
    const groundY = this.renderer.getDimensions().height - 40;
    for (const defender of this.mobileDefenders) {
      if (defender.isDeployed() && defender.getTower()) {
        const tower = defender.getTower()!;
        
        // Find closest enemy
        let closestEnemy: Enemy | null = null;
        let minDist = tower.range;
        for (const enemy of this.enemies) {
          const d = distance(tower.position, enemy.position);
          if (d < minDist) {
            minDist = d;
            closestEnemy = enemy;
          }
        }
        
        if (closestEnemy && tower.canFireAt(closestEnemy.position, this.cities, groundY) && tower.fire(gameState.gameTime, closestEnemy.position)) {
          const projectile = new Projectile(
            tower.position,
            closestEnemy.position,
            250,
            tower.damage,
            '#00FFFF'
          );
          this.projectiles.push(projectile);
        }
      }
    }

    // Spawn waves
    const settings = this.settingsManager.getSettings();
    this.waveSpawner.update(deltaTime, gameState);
    const newEnemies = this.waveSpawner.spawn(
      this.renderer.getDimensions().width,
      this.renderer.getDimensions().height,
      gameState.era
    );
    if (newEnemies.length > 0) {
      console.log(`Spawned ${newEnemies.length} enemies, total: ${this.enemies.length + newEnemies.length}`);
      newEnemies.forEach(e => {
        console.log(`  Enemy spawned at (${Math.round(e.position.x)}, ${Math.round(e.position.y)}), behavior: ${e.behavior}, speed: ${e.speed}`);
      });
    }
    this.enemies.push(...newEnemies);
    
    // Railgun AI - fire at distant enemies
    this.updateRailgunAI(gameState.gameTime);
    
    // Update railgun bolts
    this.railgunBolts = this.railgunBolts.filter(b => b.active);
    this.railgunBolts.forEach(bolt => bolt.update(deltaTime, this.renderer.getDimensions().width, this.renderer.getDimensions().height));

    // Collision detection
    this.updateCollisions(gameState);
    
    // Check wave completion and era changes
    const currentEra = gameState.era;
    if (this.enemies.length === 0 && this.waveSpawner.isWaveComplete()) {
      const previousEra = currentEra;
      gameState.nextWave();
      
      // If era changed, mark it for wave spawner (resets wave scaling)
      if (previousEra !== gameState.era) {
        this.waveSpawner.setEraStart(gameState.wave);
        this.superWeaponAvailable = true;
        console.log(`Era changed to ${gameState.era} - Super weapon recharged!`);
      }
      
      this.waveSpawner.reset();
      console.log(`Wave ${gameState.wave} starting!`);
    }

    // Check game over condition
    if (this.cities.every(city => city.isDestroyed())) {
      if (gameState.state !== GameStateType.GAME_OVER) {
        this.gameEngine.gameOver();
        this.gameOverScreen.show(gameState.gameTime);
      }
    }

    // Handle game over timeout
    if (gameState.state === GameStateType.GAME_OVER) {
      if (this.gameOverScreen.isExpired(gameState.gameTime)) {
        this.resetGame();
      }
    }

    // Apply repair rate multiplier with cap at 10 HP per second (10% of max health)
    const repairMultiplier = settings.cityRepairRate * settings.repairRateMultiplier;
    const maxRepairRatePerSecond = 10; // 10 HP per second maximum (10% of 100 max health)
    for (const city of this.cities) {
      // Cap the repair rate at 10 HP/s regardless of multiplier
      // repairRate is in HP per second, gets multiplied by deltaTime each frame
      city.repairRate = Math.min(maxRepairRatePerSecond, repairMultiplier);
    }
  }

  /**
   * Update railgun AI - fire at most threatening enemy with multi-target and hold-fire logic
   */
  private updateRailgunAI(currentTime: number): void {
    for (const railgun of this.railguns) {
      if (railgun.parentCity.isDestroyed() || railgun.isDestroyed()) continue;
      
      const screenWidth = this.renderer.getDimensions().width;
      const screenHeight = this.renderer.getDimensions().height;
      const screenCenterX = screenWidth / 2;
      const railgunX = railgun.parentCity.position.x + railgun.xOffset;
      const railgunY = railgun.parentCity.position.y;
      
      // Evaluate all enemies in correct half
      const validTargets: Array<{enemy: Enemy, threat: number, willHitCity: boolean, willHitRailgun: boolean}> = [];
      
      for (const enemy of this.enemies) {
        // Left railgun covers RIGHT HALF of screen (x > screenCenter)
        // Right railgun covers LEFT HALF of screen (x < screenCenter)
        const inCorrectHalf = (railgun.direction === 'left' && enemy.position.x > screenCenterX) ||
                              (railgun.direction === 'right' && enemy.position.x < screenCenterX);
        
        if (!inCorrectHalf) continue;
        
        // Check if enemy is within range
        const dx = enemy.position.x - railgunX;
        const dy = enemy.position.y - railgunY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > railgun.range) continue;
        
        // Determine threat level based on what it will hit
        let willHitCity = false;
        let willHitRailgun = false;
        let minCityDistance = Infinity;
        let minRailgunDistance = Infinity;
        
        // Check if enemy's trajectory threatens cities
        for (const city of this.cities) {
          if (city.isDestroyed()) continue;
          const cityDist = Math.sqrt(
            Math.pow(enemy.position.x - city.position.x, 2) +
            Math.pow(enemy.position.y - city.position.y, 2)
          );
          minCityDistance = Math.min(minCityDistance, cityDist);
          
          // Is it heading toward this city?
          const headingToCity = enemy.velocity.y > 0 && Math.abs(enemy.position.x - city.position.x) < 100;
          if (headingToCity && cityDist < 400) {
            willHitCity = true;
          }
        }
        
        // Check if enemy threatens other railguns
        for (const otherRailgun of this.railguns) {
          if (otherRailgun === railgun || otherRailgun.isDestroyed()) continue;
          const railgunDist = Math.sqrt(
            Math.pow(enemy.position.x - (otherRailgun.parentCity.position.x + otherRailgun.xOffset), 2) +
            Math.pow(enemy.position.y - otherRailgun.parentCity.position.y, 2)
          );
          minRailgunDistance = Math.min(minRailgunDistance, railgunDist);
          if (railgunDist < 150) {
            willHitRailgun = true;
          }
        }
        
        // Calculate threat score
        let threatScore = 0;
        
        // PRIORITY 1: Direct threats to cities (HIGHEST)
        if (willHitCity) {
          threatScore += 1000;
          threatScore += Math.max(0, (400 - minCityDistance) / 400 * 500); // Closer = more urgent
        }
        
        // PRIORITY 2: Threats to railguns
        if (willHitRailgun) {
          threatScore += 500;
        }
        
        // PRIORITY 3: Will cause splash damage (medium priority)
        const groundProximity = enemy.position.y / screenHeight;
        if (groundProximity > 0.7 && !willHitCity) {
          threatScore += 200 * groundProximity; // Near ground but not targeting city
        }
        
        // PRIORITY 4: Harmless enemies (LOW priority - only if nothing else to shoot)
        if (!willHitCity && !willHitRailgun && groundProximity < 0.7) {
          threatScore += 10; // Very low
        }
        
        // Bonus for high health (boss-like)
        if (enemy.maxHealth > 100) {
          threatScore += 50;
        }
        
        validTargets.push({enemy, threat: threatScore, willHitCity, willHitRailgun});
      }
      
      // Sort by threat (highest first)
      validTargets.sort((a, b) => b.threat - a.threat);
      
      // Always update visual target to highest threat (even if we won't fire)
      railgun.currentTarget = validTargets.length > 0 ? validTargets[0].enemy : null;
      
      // Smoothly rotate railgun toward target (visual only)
      if (railgun.currentTarget) {
        const targetAngle = Math.atan2(
          railgun.currentTarget.position.y - railgunY,
          railgun.currentTarget.position.x - railgunX
        );
        // Smooth interpolation toward target angle
        const angleDiff = targetAngle - railgun.currentAngle;
        const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        railgun.currentAngle += normalizedDiff * 0.15; // 15% interpolation for smooth movement
      }
      
      // Don't fire if we can't fire yet
      if (!railgun.canFire(currentTime)) continue;
      
      // HOLD FIRE logic: Don't waste shots on harmless enemies
      if (validTargets.length > 0 && validTargets[0].threat < 100) {
        // Nothing is really dangerous - hold fire
        continue;
      }
      
      // Find best shot considering multi-target potential
      let bestShot: {target: Enemy, multiKillCount: number, totalThreat: number} | null = null;
      
      for (const candidate of validTargets.slice(0, 5)) { // Check top 5 threats
        const targetX = candidate.enemy.position.x;
        const targetY = candidate.enemy.position.y;
        
        // Calculate beam path (extended to screen edge)
        const angle = Math.atan2(targetY - railgunY, targetX - railgunX);
        const maxDistance = Math.max(screenWidth, screenHeight) * 2;
        const endX = railgunX + Math.cos(angle) * maxDistance;
        const endY = railgunY + Math.sin(angle) * maxDistance;
        
        // Count how many enemies this beam would hit
        let multiKillCount = 0;
        let totalThreat = 0;
        
        for (const potential of validTargets) {
          // Check if potential target intersects with beam path
          const distToLine = this.distanceToLineSegment(
            potential.enemy.position,
            {x: railgunX, y: railgunY},
            {x: endX, y: endY}
          );
          
          if (distToLine < potential.enemy.radius + 5) {
            multiKillCount++;
            totalThreat += potential.threat;
          }
        }
        
        // Prefer shots that hit multiple targets or high-threat singles
        const shotValue = totalThreat * (1 + multiKillCount * 0.5);
        
        if (!bestShot || shotValue > bestShot.totalThreat) {
          bestShot = {target: candidate.enemy, multiKillCount, totalThreat: shotValue};
        }
      }
      
      // Fire at best shot
      if (bestShot) {
        const bolt = railgun.fire(
          bestShot.target.position.x,
          bestShot.target.position.y,
          screenWidth,
          screenHeight,
          currentTime
        );
        if (bolt) {
          this.railgunBolts.push(bolt);
          if (bestShot.multiKillCount > 1) {
            console.log(`⚡ Railgun multi-shot: ${bestShot.multiKillCount} targets`);
          }
        }
      }
    }
  }
  
  /**
   * Calculate distance from point to line segment
   */
  private distanceToLineSegment(point: {x: number, y: number}, lineStart: {x: number, y: number}, lineEnd: {x: number, y: number}): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lengthSq = dx * dx + dy * dy;
    
    if (lengthSq === 0) {
      return Math.sqrt(
        Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
      );
    }
    
    const t = Math.max(0, Math.min(1,
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq
    ));
    
    const projX = lineStart.x + t * dx;
    const projY = lineStart.y + t * dy;
    
    return Math.sqrt(
      Math.pow(point.x - projX, 2) + Math.pow(point.y - projY, 2)
    );
  }

  /**
   * Update collisions
   */
  private updateCollisions(gameState: GameState): void {
    // Check projectile vs enemy collisions
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        
        if (checkCircleCollision(
          { x: projectile.position.x, y: projectile.position.y, radius: projectile.radius },
          { x: enemy.position.x, y: enemy.position.y, radius: enemy.radius }
        ).isColliding) {
          // Hit detected - apply damage
          enemy.takeDamage(projectile.damage);
          projectile.active = false;
          
          // If projectile has explosion radius (flak), damage nearby enemies
          if (projectile.explosionRadius > 0) {
            for (let k = this.enemies.length - 1; k >= 0; k--) {
              if (k === j) continue; // Skip the directly hit enemy
              const nearbyEnemy = this.enemies[k];
              const dist = distance(projectile.position, nearbyEnemy.position);
              if (dist < projectile.explosionRadius) {
                // Apply reduced damage based on distance (50% at edge, 100% at center)
                const damageMultiplier = 1 - (dist / projectile.explosionRadius) * 0.5;
                nearbyEnemy.takeDamage(projectile.damage * damageMultiplier);
              }
            }
            
            // Create larger explosion visual for flak
            this.explosions.push(new Explosion(
              { x: projectile.position.x, y: projectile.position.y },
              projectile.explosionRadius * 1.2
            ));
          }
          
          // Track cross-city defense for goodwill
          // Find which city the projectile came from and which city was threatened
          let shootingCity: City | null = null;
          let threatenedCity: City | null = null;
          let minDistToShooter = Infinity;
          let minDistToEnemy = Infinity;
          
          for (const city of this.cities) {
            if (city.isDestroyed()) continue;
            
            // Find closest city to projectile origin (shooter)
            const distToOrigin = Math.abs(city.position.x - projectile.position.x);
            if (distToOrigin < minDistToShooter) {
              minDistToShooter = distToOrigin;
              shootingCity = city;
            }
            
            // Find closest city to enemy (threatened)
            const distToEnemy = distance(city.position, enemy.position);
            if (distToEnemy < minDistToEnemy) {
              minDistToEnemy = distToEnemy;
              threatenedCity = city;
            }
          }
          
          // Award goodwill if helping another city
          if (shootingCity && threatenedCity && shootingCity.id !== threatenedCity.id && minDistToEnemy < 250) {
            shootingCity.helpfulnessScore += 2;
            threatenedCity.helpfulnessScore += 1; // Smaller boost for receiving help
            
            const currentBalance = shootingCity.helpHistory.get(threatenedCity.id) || 0;
            shootingCity.helpHistory.set(threatenedCity.id, currentBalance + 1);
            
            const reciprocalBalance = threatenedCity.helpHistory.get(shootingCity.id) || 0;
            threatenedCity.helpHistory.set(shootingCity.id, reciprocalBalance - 1);
          }
          
          if (!enemy.active) {
            gameState.score += Math.ceil(enemy.maxHealth / 10);
            gameState.enemiesDestroyed++;
            
            // Create explosion
            const explosion = new Explosion(
              enemy.position,
              enemy.radius * 2,
              0.3,
              '#FF4400',
              enemy.maxHealth * 0.5
            );
            this.explosions.push(explosion);
          }
          break;
        }
      }
    }

    // Check enemy vs ground collisions
    const groundY = this.renderer.getDimensions().height - 40;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      if (enemy.position.y + enemy.radius >= groundY) {
        enemy.active = false;
        
        // Create explosion on ground impact
        const explosion = new Explosion(
          { x: enemy.position.x, y: groundY },
          enemy.radius * 2,
          0.5,
          '#FF8800',
          enemy.maxHealth * 0.8
        );
        this.explosions.push(explosion);
        
        // Damage nearby cities and towers
        for (const city of this.cities) {
          const dist = Math.abs(city.position.x - enemy.position.x);
          if (dist < 100) {
            const wasAlive = !city.isDestroyed();
            const damage = Math.ceil(enemy.maxHealth * 0.5 * (1 - dist / 100));
            city.takeDamage(damage);
            
            // Increment destroyed counter if city just died
            if (wasAlive && city.isDestroyed()) {
              this.gameEngine.getGameState().citiesDestroyed++;
            }
            
            // Damage towers on the side of impact
            for (const tower of this.towers) {
              if (tower.parentCity === city) {
                const towerDist = Math.abs(tower.position.x - enemy.position.x);
                if (towerDist < 60) {
                  const towerDamage = Math.ceil(damage * 0.8);
                  tower.takeDamage(towerDamage);
                }
              }
            }
          }
        }
      }
    }
    
    // Railgun bolt vs enemy collisions (instant piercing beam)
    // Check on first frame only (age < 0.1) since bolt is instant
    for (let i = this.railgunBolts.length - 1; i >= 0; i--) {
      const bolt = this.railgunBolts[i];
      
      // Only check collisions when bolt first appears (instant hit)
      if (bolt.age > 0.1) continue;
      
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        
        // Skip if already hit this enemy
        if (bolt.hitEnemies.has(enemy.id)) continue;
        
        // Check if enemy intersects the beam path (line segment collision)
        let hitEnemy = false;
        for (let k = 0; k < bolt.trailPoints.length - 1; k++) {
          const p1 = bolt.trailPoints[k];
          const p2 = bolt.trailPoints[k + 1];
          
          // Distance from enemy to line segment
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const lengthSq = dx * dx + dy * dy;
          
          if (lengthSq === 0) continue;
          
          const t = Math.max(0, Math.min(1, 
            ((enemy.position.x - p1.x) * dx + (enemy.position.y - p1.y) * dy) / lengthSq
          ));
          
          const closestX = p1.x + t * dx;
          const closestY = p1.y + t * dy;
          
          const distToLine = Math.sqrt(
            (enemy.position.x - closestX) ** 2 + 
            (enemy.position.y - closestY) ** 2
          );
          
          if (distToLine <= enemy.radius + 3) {
            hitEnemy = true;
            break;
          }
        }
        
        if (hitEnemy) {
          // Apply damage
          enemy.takeDamage(bolt.damage);
          bolt.hitEnemies.add(enemy.id);
          
          // Bolt continues (piercing) but loses some damage
          bolt.damage *= 0.7; // 30% damage reduction per enemy pierced
          
          // Create small explosion
          this.explosions.push(new Explosion(
            { x: enemy.position.x, y: enemy.position.y },
            enemy.radius * 1.5,
            0.3,
            '#00FFFF'
          ));
        }
      }
    }
    
    // Check enemy vs railgun collisions
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      let enemyHit = false;
      
      for (const railgun of this.railguns) {
        if (railgun.isDestroyed()) continue;
        
        const railgunX = railgun.parentCity.position.x + railgun.xOffset;
        const railgunY = railgun.parentCity.position.y;
        const railgunRadius = 10; // Collision radius for railgun
        
        if (checkCircleCollision(
          { x: enemy.position.x, y: enemy.position.y, radius: enemy.radius },
          { x: railgunX, y: railgunY, radius: railgunRadius }
        ).isColliding) {
          const damage = Math.ceil(enemy.maxHealth * 0.5);
          railgun.takeDamage(damage);
          enemy.active = false;
          enemyHit = true;
          
          // Create explosion
          const explosion = new Explosion(
            { x: railgunX, y: railgunY },
            enemy.radius * 1.5,
            0.3,
            '#00FFFF',
            enemy.maxHealth * 0.4
          );
          this.explosions.push(explosion);
          break;
        }
      }
      
      if (enemyHit) continue;
    }
    
    // Check enemy vs city collisions
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      for (const city of this.cities) {
        if (checkCircleCollision(
          { x: enemy.position.x, y: enemy.position.y, radius: enemy.radius },
          { x: city.position.x, y: city.position.y, radius: city.radius }
        ).isColliding) {
          const wasAlive = !city.isDestroyed();
          const damage = Math.ceil(enemy.maxHealth * 0.3);
          city.takeDamage(damage);
          enemy.active = false;
          
          // Increment destroyed counter if city just died
          if (wasAlive && city.isDestroyed()) {
            this.gameEngine.getGameState().citiesDestroyed++;
          }
          
          // Damage towers based on which side was hit
          for (const tower of this.towers) {
            if (tower.parentCity === city) {
              const onSameSide = (tower.side === 'left' && enemy.position.x < city.position.x) ||
                                  (tower.side === 'right' && enemy.position.x > city.position.x);
              if (onSameSide) {
                tower.takeDamage(Math.ceil(damage * 0.6));
              } else {
                tower.takeDamage(Math.ceil(damage * 0.2)); // Less damage to far tower
              }
            }
          }
          
          // Create explosion
          const explosion = new Explosion(
            enemy.position,
            enemy.radius * 2,
            0.4,
            '#FF0000',
            enemy.maxHealth * 0.6
          );
          this.explosions.push(explosion);
          break;
        }
      }
    }
  }

  /**
   * Update a setting from external UI
   */
  public updateSetting(key: string, value: any): void {
    const settings = this.settingsManager.getSettings();
    const updates: any = {};
    updates[key] = value;
    this.settingsManager.updateSettings(updates);
    
    // Handle special cases
    if (key === 'cityCount') {
      // Recreate cities and towers with new count, preserving existing city health
      this.cities = this.createCities(true);
      this.towers = this.createTowers();
      this.createSharedTrucks(); // Recreate shared truck resources
      this.createRailguns(); // Recreate railguns for new end cities
      
      // Re-initialize AI for new city count
      const currentSettings = this.settingsManager.getSettings();
      const aiAccuracy = currentSettings.aiAccuracy || 0.7;
      this.aiController.initializeAIForCities(this.cities, this.towers, aiAccuracy);
    }
    
    if (key === 'difficulty') {
      // Update wave spawner difficulty (affects enemy count and speed)
      const currentSettings = this.settingsManager.getSettings();
      this.waveSpawner.setDifficulty(currentSettings.difficulty);
    }
    
    if (key === 'aiAccuracy') {
      // Update AI accuracy (affects AI shooting skill)
      const currentSettings = this.settingsManager.getSettings();
      const aiAccuracy = currentSettings.aiAccuracy || 0.7;
      this.aiController.initializeAIForCities(this.cities, this.towers, aiAccuracy);
    }
    
    if (key === 'colorPalette') {
      this.paletteManager.setPalette(value);
    }
    
    if (key === 'gameSpeed') {
      this.gameEngine.setGameSpeed(value);
    }
  }

  /**
   * Spawn a boss enemy (debug) - era/wave relevant
   */
  public spawnBoss(): void {
    const { width } = this.renderer.getDimensions();
    const gameState = this.gameEngine.getGameState();
    const era = gameState.era;
    const eraName = era as string;
    const gimmicks = this.waveSpawner.getEraGimmicks(eraName);
    
    if (gimmicks && gimmicks.length > 0) {
      // Find boss-like enemies (75+ health, special abilities)
      const bosses = gimmicks.filter(
        (g: any) => g.health >= 75 || g.specialAbility || g.behavior === 'bombing' || g.behavior === 'stationary'
      );
      
      if (bosses.length > 0) {
        const x = random(100, width - 100);
        const y = -50;
        const bossConfig = bosses[Math.floor(Math.random() * bosses.length)];
        const boss = new Enemy(x, y, bossConfig, gameState.wave);
        this.enemies.push(boss);
        console.log(`✨ Manual boss spawned: ${bossConfig.name} for era ${era}`);
        return;
      }
    }
    
    // Fallback to generic tough boss
    const x = random(100, width - 100);
    const y = -50;
    const bossConfig = {
      id: 'debug_boss',
      name: 'Debug Boss',
      health: 500,
      speed: 1.5,
      size: 50,
      rarity: 1.0,
      aiAwareness: 'critical',
      behavior: 'falling',
    };
    const boss = new Enemy(x, y, bossConfig, gameState.wave);
    this.enemies.push(boss);
    console.log('✨ Manual debug boss spawned!');
  }

  /**
   * Skip to next wave (debug)
   */
  public nextWave(): void {
    const gameState = this.gameEngine.getGameState();
    // Clear all current enemies
    this.enemies = [];
    this.projectiles = [];
    // Progress wave
    gameState.nextWave();
    this.waveSpawner.reset();
    console.log(`⏭️ Skipped to wave ${gameState.wave}, era ${gameState.era}`);
  }

  /**
   * Skip to next era (debug)
   */
  public nextEra(): void {
    const gameState = this.gameEngine.getGameState();
    // Clear all current enemies
    this.enemies = [];
    this.projectiles = [];
    // Progress era
    gameState.nextEra();
    this.waveSpawner.reset();
    console.log(`🚀 Skipped to era ${gameState.era}, wave ${gameState.wave}`);
  }
  
  /**
   * Spawn death wave (debug) - 100 enemies at once
   */
  public spawnDeathWave(): void {
    const { width } = this.renderer.getDimensions();
    const gameState = this.gameEngine.getGameState();
    const era = gameState.era;
    const eraName = era as string;
    const gimmicks = this.waveSpawner.getEraGimmicks(eraName);
    
    if (!gimmicks || gimmicks.length === 0) {
      console.log('No gimmicks configured for current era');
      return;
    }
    
    console.log('DEATH WAVE! Spawning 100 enemies...');
    
    for (let i = 0; i < 100; i++) {
      const x = random(50, width - 50);
      const y = -30 - (i * 5); // Stagger vertically
      
      // Random enemy from current era
      const config = gimmicks[Math.floor(Math.random() * gimmicks.length)];
      const enemy = new Enemy(x, y, config);
      this.enemies.push(enemy);
    }
  }
  
  /**
   * Set debug click mode
   */
  public setDebugClickMode(enabled: boolean): void {
    this.debugClickMode = enabled;
    console.log(`Debug click mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    if (enabled) {
      console.log('Click cities/turrets to destroy, click top half to spawn enemies');
    }
  }

  /**
   * Reset game
   */
  private resetGame(): void {
    this.gameEngine.reset();
    this.gameOverScreen.hide();
    this.enemies = [];
    this.projectiles = [];
    this.explosions = [];
    this.railgunBolts = []; // Clear railgun bolts
    this.cities = this.createCities();
    this.towers = this.createTowers();
    this.createSharedTrucks();
    this.createRailguns();
    
    const settings = this.settingsManager.getSettings();
    const aiAccuracy = settings.aiAccuracy || 0.7;
    this.aiController.initializeAIForCities(this.cities, this.towers, aiAccuracy);
    
    this.gameEngine.getGameState().nextWave();
    this.waveSpawner.setEraStart(1); // Reset era tracking
    this.waveSpawner.reset();
  }

  /**
   * Render loop
   */
  private startRenderLoop = (): void => {
    const now = Date.now();
    const delta = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    // Calculate FPS
    this.frameCount++;
    if (this.frameCount % 30 === 0) {
      this.fps = Math.round(1 / delta);
    }

    // Render
    const renderCtx = this.renderer.getRenderContext();
    this.renderer.clear();

    // Render hilly ground below cities
    const groundBaseY = renderCtx.height - 40;
    renderCtx.ctx.strokeStyle = renderCtx.palette.secondary;
    renderCtx.ctx.lineWidth = 2;
    renderCtx.ctx.beginPath();
    renderCtx.ctx.moveTo(0, groundBaseY);
    
    // Create hilly terrain with flat spots for cities
    for (let x = 0; x <= renderCtx.width; x += 10) {
      // Check if near a city - make it flat
      let isNearCity = false;
      for (const city of this.cities) {
        if (Math.abs(x - city.position.x) < 50) {
          isNearCity = true;
          break;
        }
      }
      
      let y = groundBaseY;
      if (!isNearCity) {
        // Add hills with sine wave
        y += Math.sin(x / 100) * 15 + Math.sin(x / 50) * 8;
      }
      
      renderCtx.ctx.lineTo(x, y);
    }
    renderCtx.ctx.stroke();

    // Fill below ground
    renderCtx.ctx.fillStyle = renderCtx.palette.background;
    renderCtx.ctx.globalAlpha = 0.3;
    renderCtx.ctx.beginPath();
    renderCtx.ctx.moveTo(0, groundBaseY);
    for (let x = 0; x <= renderCtx.width; x += 10) {
      let isNearCity = false;
      for (const city of this.cities) {
        if (Math.abs(x - city.position.x) < 50) {
          isNearCity = true;
          break;
        }
      }
      let y = groundBaseY;
      if (!isNearCity) {
        y += Math.sin(x / 100) * 15 + Math.sin(x / 50) * 8;
      }
      renderCtx.ctx.lineTo(x, y);
    }
    renderCtx.ctx.lineTo(renderCtx.width, renderCtx.height);
    renderCtx.ctx.lineTo(0, renderCtx.height);
    renderCtx.ctx.closePath();
    renderCtx.ctx.fill();
    renderCtx.ctx.globalAlpha = 1.0;

    // Render entities
    for (const city of this.cities) {
      city.render(renderCtx);
    }
    
    // Render city communication lines
    for (const city of this.cities) {
      if (city.isCommunicating && city.communicationTarget) {
        const target = city.communicationTarget;
        const targetThreat = target.assessedThreatLevel;
        const cityThreat = city.assessedThreatLevel;
        
        // Determine agreement
        const agree = targetThreat > 0.5 && cityThreat > 0.6;
        const color = agree ? renderCtx.palette.healthGood : renderCtx.palette.healthBad;
        
        // Draw communication line
        renderCtx.ctx.strokeStyle = color;
        renderCtx.ctx.lineWidth = 2;
        renderCtx.ctx.setLineDash([5, 5]);
        renderCtx.ctx.globalAlpha = 0.6;
        renderCtx.ctx.beginPath();
        renderCtx.ctx.moveTo(city.position.x, city.position.y - 20);
        renderCtx.ctx.lineTo(target.position.x, target.position.y - 20);
        renderCtx.ctx.stroke();
        renderCtx.ctx.setLineDash([]);
        renderCtx.ctx.globalAlpha = 1.0;
        
        // Draw speech bubble icon above communicating city
        renderCtx.ctx.fillStyle = color;
        renderCtx.ctx.beginPath();
        renderCtx.ctx.arc(city.position.x, city.position.y - 30, 5, 0, Math.PI * 2);
        renderCtx.ctx.fill();
        
        // Draw small dots (thinking/talking indicator)
        for (let i = 0; i < 3; i++) {
          renderCtx.ctx.beginPath();
          renderCtx.ctx.arc(city.position.x + (i - 1) * 6, city.position.y - 40, 2, 0, Math.PI * 2);
          renderCtx.ctx.fill();
        }
      }
    }
    
    for (const tower of this.towers) {
      tower.render(renderCtx);
    }
    
    // Render truck availability indicators next to turrets
    for (const city of this.cities) {
      if (city.isDestroyed()) continue;
      
      // Find towers for this city
      const cityTowers = this.towers.filter(t => t.parentCity === city && t.active);
      if (cityTowers.length === 0) continue;
      
      // Sort towers by x position to identify left and right
      cityTowers.sort((a, b) => a.position.x - b.position.x);
      
      const indicatorSize = 6;
      const indicatorOffsetY = -15; // Above the turret
      
      // Left tower gets left truck indicator
      if (cityTowers[0] && city.leftSharedTruck) {
        const leftTower = cityTowers[0];
        const truck = city.leftSharedTruck;
        
        renderCtx.ctx.fillStyle = truck.available ? renderCtx.palette.accent : '#444';
        renderCtx.ctx.beginPath();
        renderCtx.ctx.arc(
          leftTower.position.x,
          leftTower.position.y + indicatorOffsetY,
          indicatorSize,
          0,
          Math.PI * 2
        );
        renderCtx.ctx.fill();
        
        // If cooling down, show progress
        if (!truck.available) {
          const progress = truck.cooldown / truck.cooldownTime;
          renderCtx.ctx.strokeStyle = renderCtx.palette.accent;
          renderCtx.ctx.lineWidth = 2;
          renderCtx.ctx.beginPath();
          renderCtx.ctx.arc(
            leftTower.position.x,
            leftTower.position.y + indicatorOffsetY,
            indicatorSize,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * progress
          );
          renderCtx.ctx.stroke();
        }
      }
      
      // Right tower gets right truck indicator
      if (cityTowers[1] && city.rightSharedTruck) {
        const rightTower = cityTowers[1];
        const truck = city.rightSharedTruck;
        
        renderCtx.ctx.fillStyle = truck.available ? renderCtx.palette.accent : '#444';
        renderCtx.ctx.beginPath();
        renderCtx.ctx.arc(
          rightTower.position.x,
          rightTower.position.y + indicatorOffsetY,
          indicatorSize,
          0,
          Math.PI * 2
        );
        renderCtx.ctx.fill();
        
        // If cooling down, show progress
        if (!truck.available) {
          const progress = truck.cooldown / truck.cooldownTime;
          renderCtx.ctx.strokeStyle = renderCtx.palette.accent;
          renderCtx.ctx.lineWidth = 2;
          renderCtx.ctx.beginPath();
          renderCtx.ctx.arc(
            rightTower.position.x,
            rightTower.position.y + indicatorOffsetY,
            indicatorSize,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * progress
          );
          renderCtx.ctx.stroke();
        }
      }
    }
    for (const enemy of this.enemies) {
      enemy.render(renderCtx);
    }
    for (const projectile of this.projectiles) {
      projectile.render(renderCtx);
    }
    for (const explosion of this.explosions) {
      explosion.render(renderCtx);
    }
    
    // Render mobile defenders
    for (const defender of this.mobileDefenders) {
      defender.render(renderCtx);
    }
    
    // Get settings for debug rendering
    const settings = this.settingsManager.getSettings();
    
    // Render railguns (pass current time for charge display)
    for (const railgun of this.railguns) {
      railgun.render(renderCtx, this.gameEngine.getGameState().gameTime);
      
      // Debug mode: show targeting info when Show Debug Info is enabled
      if (settings.showDebugInfo) {
        const railgunX = railgun.parentCity.position.x + railgun.xOffset;
        const railgunY = railgun.parentCity.position.y;
        const screenCenterX = renderCtx.width / 2;
        
        renderCtx.ctx.save();
        
        // Draw screen half boundary line (shows which half this railgun covers)
        renderCtx.ctx.globalAlpha = 0.3;
        renderCtx.ctx.strokeStyle = '#00ffff';
        renderCtx.ctx.lineWidth = 2;
        renderCtx.ctx.setLineDash([5, 5]);
        renderCtx.ctx.beginPath();
        renderCtx.ctx.moveTo(screenCenterX, 0);
        renderCtx.ctx.lineTo(screenCenterX, renderCtx.height);
        renderCtx.ctx.stroke();
        renderCtx.ctx.setLineDash([]);
        
        // Shade the half that this railgun covers
        renderCtx.ctx.globalAlpha = 0.05;
        renderCtx.ctx.fillStyle = '#00ffff';
        if (railgun.direction === 'left') {
          // Left railgun covers RIGHT half
          renderCtx.ctx.fillRect(screenCenterX, 0, renderCtx.width - screenCenterX, renderCtx.height);
        } else {
          // Right railgun covers LEFT half
          renderCtx.ctx.fillRect(0, 0, screenCenterX, renderCtx.height);
        }
        
        // Show current target with marker if one exists
        if (railgun.currentTarget && railgun.currentTarget.active) {
          const target = railgun.currentTarget;
          
          // Draw targeting line from railgun to target
          renderCtx.ctx.globalAlpha = 0.4;
          renderCtx.ctx.strokeStyle = '#ff0000';
          renderCtx.ctx.lineWidth = 2;
          renderCtx.ctx.setLineDash([5, 3]);
          renderCtx.ctx.beginPath();
          renderCtx.ctx.moveTo(railgunX, railgunY);
          renderCtx.ctx.lineTo(target.position.x, target.position.y);
          renderCtx.ctx.stroke();
          renderCtx.ctx.setLineDash([]);
          
          // Draw target marker (crosshair)
          renderCtx.ctx.globalAlpha = 0.8;
          renderCtx.ctx.strokeStyle = '#ff0000';
          renderCtx.ctx.lineWidth = 2;
          const markerSize = 15;
          
          // Crosshair
          renderCtx.ctx.beginPath();
          renderCtx.ctx.moveTo(target.position.x - markerSize, target.position.y);
          renderCtx.ctx.lineTo(target.position.x + markerSize, target.position.y);
          renderCtx.ctx.moveTo(target.position.x, target.position.y - markerSize);
          renderCtx.ctx.lineTo(target.position.x, target.position.y + markerSize);
          renderCtx.ctx.stroke();
          
          // Circle around target
          renderCtx.ctx.beginPath();
          renderCtx.ctx.arc(target.position.x, target.position.y, markerSize, 0, Math.PI * 2);
          renderCtx.ctx.stroke();
          
          // "TARGET" label
          renderCtx.ctx.globalAlpha = 1;
          renderCtx.ctx.fillStyle = '#ff0000';
          renderCtx.ctx.font = 'bold 10px monospace';
          renderCtx.ctx.textAlign = 'center';
          renderCtx.ctx.fillText('TARGET', target.position.x, target.position.y - markerSize - 5);
        }
        
        // Show railgun charge time (use game time for accuracy)
        const gameTime = this.gameEngine.getGameState().gameTime;
        const timeSinceLastFire = (gameTime - railgun.lastFireTime) / 1000;
        const cooldownTime = 1 / railgun.fireRate;
        const timeUntilReady = Math.max(0, cooldownTime - timeSinceLastFire);
        renderCtx.ctx.globalAlpha = 1;
        renderCtx.ctx.fillStyle = timeUntilReady > 0 ? '#ff0000' : '#00ff00';
        renderCtx.ctx.font = '10px monospace';
        renderCtx.ctx.textAlign = 'center';
        renderCtx.ctx.fillText(
          timeUntilReady > 0 ? `CD: ${timeUntilReady.toFixed(1)}s` : 'READY',
          railgunX,
          railgunY - 40
        );
        
        renderCtx.ctx.restore();
      }
    }
    
    // Render railgun bolts
    for (const bolt of this.railgunBolts) {
      bolt.render(renderCtx);
    }
    
    // Render super weapon voting status
    if (this.superWeaponAvailable && !this.superWeaponActive) {
      const activeCities = this.cities.filter(c => !c.isDestroyed());
      const votedCount = activeCities.filter(c => c.votedForSuperWeapon).length;
      
      if (votedCount > 0) {
        renderCtx.ctx.fillStyle = renderCtx.palette.accent;
        renderCtx.ctx.font = '16px monospace';
        renderCtx.ctx.textAlign = 'center';
        renderCtx.ctx.fillText(
          `⚡ Super Weapon Vote: ${votedCount}/${activeCities.length} cities agree`,
          renderCtx.width / 2,
          50
        );
        
        // Draw vote indicators above voting cities
        for (const city of activeCities) {
          if (city.votedForSuperWeapon) {
            renderCtx.ctx.fillStyle = renderCtx.palette.accent;
            renderCtx.ctx.beginPath();
            renderCtx.ctx.arc(city.position.x, city.position.y - 45, 6, 0, Math.PI * 2);
            renderCtx.ctx.fill();
            renderCtx.ctx.fillText('⚡', city.position.x, city.position.y - 42);
          }
        }
      }
    }
    
    // Render super weapon animation
    if (this.superWeaponActive) {
      const progress = this.superWeaponAnimationTime / 3;
      const era = this.gameEngine.getGameState().era;
      
      if (era === 'meteors') {
        // Solar flare effect
        renderCtx.ctx.fillStyle = '#FFAA00';
        renderCtx.ctx.globalAlpha = 0.3 * (1 - progress);
        renderCtx.ctx.fillRect(0, 0, renderCtx.width, renderCtx.height);
        renderCtx.ctx.globalAlpha = 1.0;
        
        // Rays from top
        for (let i = 0; i < 20; i++) {
          renderCtx.ctx.strokeStyle = '#FFFF00';
          renderCtx.ctx.lineWidth = 3;
          renderCtx.ctx.globalAlpha = 0.5 * (1 - progress);
          renderCtx.ctx.beginPath();
          renderCtx.ctx.moveTo(renderCtx.width / 2, 0);
          renderCtx.ctx.lineTo((i / 20) * renderCtx.width, renderCtx.height);
          renderCtx.ctx.stroke();
        }
        renderCtx.ctx.globalAlpha = 1.0;
      } else if (era === 'eighties_missiles') {
        // 80s style grid wave
        renderCtx.ctx.strokeStyle = '#FF0080';
        renderCtx.ctx.lineWidth = 2;
        renderCtx.ctx.globalAlpha = 0.7 * (1 - progress);
        for (let y = 0; y < renderCtx.height; y += 20) {
          renderCtx.ctx.beginPath();
          renderCtx.ctx.moveTo(0, y + Math.sin(progress * 10 + y * 0.1) * 10);
          renderCtx.ctx.lineTo(renderCtx.width, y + Math.sin(progress * 10 + y * 0.1) * 10);
          renderCtx.ctx.stroke();
        }
        renderCtx.ctx.globalAlpha = 1.0;
      } else {
        // Futuristic EMP pulse
        renderCtx.ctx.strokeStyle = '#00FFFF';
        renderCtx.ctx.lineWidth = 3;
        renderCtx.ctx.globalAlpha = 0.6 * (1 - progress);
        for (let r = 0; r < 5; r++) {
          renderCtx.ctx.beginPath();
          renderCtx.ctx.arc(
            renderCtx.width / 2,
            renderCtx.height / 2,
            progress * renderCtx.width * (r + 1) / 5,
            0,
            Math.PI * 2
          );
          renderCtx.ctx.stroke();
        }
        renderCtx.ctx.globalAlpha = 1.0;
      }
      
      // Display message
      renderCtx.ctx.fillStyle = renderCtx.palette.accent;
      renderCtx.ctx.font = '24px monospace';
      renderCtx.ctx.textAlign = 'center';
      renderCtx.ctx.fillText('🚀 SUPER WEAPON ACTIVATED! 🚀', renderCtx.width / 2, renderCtx.height / 2);
    }

    // Render HUD
    const gameState = this.gameEngine.getGameState();
    this.hud.render(
      renderCtx,
      gameState,
      settings,
      this.aiController.getAIInstances(),
      this.fps
    );
    
    // Debug info overlay - show health and state for all entities
    if (settings.showDebugInfo) {
      renderCtx.ctx.font = '9px monospace';
      renderCtx.ctx.textAlign = 'center';
      
      // Enemy health
      for (const enemy of this.enemies) {
        renderCtx.ctx.fillStyle = '#ff0000';
        renderCtx.ctx.fillText(
          `HP:${Math.ceil(enemy.health)}/${enemy.maxHealth}`,
          enemy.position.x,
          enemy.position.y - enemy.radius - 5
        );
      }
      
      // City health and sentiment
      for (const city of this.cities) {
        if (!city.isDestroyed()) {
          renderCtx.ctx.fillStyle = '#00ff00';
          renderCtx.ctx.fillText(
            `HP:${Math.ceil(city.health)}/${city.maxHealth}`,
            city.position.x,
            city.position.y - city.radius - 25
          );
          
          // Stance and helpfulness
          renderCtx.ctx.fillStyle = '#ffff00';
          renderCtx.ctx.fillText(
            `${city.stance} (${city.helpfulnessScore})`,
            city.position.x,
            city.position.y - city.radius - 15
          );
          
          // Help balance with neighbors
          if (city.leftSharedTruck) {
            const neighbor = city.leftSharedTruck.cityA === city ? city.leftSharedTruck.cityB : city.leftSharedTruck.cityA;
            const balance = city.helpHistory.get(neighbor.id) || 0;
            renderCtx.ctx.fillStyle = '#00ffff';
            renderCtx.ctx.textAlign = 'right';
            renderCtx.ctx.fillText(
              `\u2190${balance >= 0 ? '+' : ''}${balance}`,
              city.position.x - 30,
              city.position.y
            );
          }
          
          if (city.rightSharedTruck) {
            const neighbor = city.rightSharedTruck.cityA === city ? city.rightSharedTruck.cityB : city.rightSharedTruck.cityA;
            const balance = city.helpHistory.get(neighbor.id) || 0;
            renderCtx.ctx.fillStyle = '#00ffff';
            renderCtx.ctx.textAlign = 'left';
            renderCtx.ctx.fillText(
              `${balance >= 0 ? '+' : ''}${balance}\u2192`,
              city.position.x + 30,
              city.position.y
            );
          }
          renderCtx.ctx.textAlign = 'center';
        }
      }
      
      // Tower health
      for (const tower of this.towers) {
        if (!tower.isDestroyed()) {
          renderCtx.ctx.fillStyle = '#00ff00';
          renderCtx.ctx.fillText(
            `T:${Math.ceil(tower.health)}`,
            tower.position.x,
            tower.position.y - 25
          );
        }
      }
      
      // Railgun health and cooldown
      for (const railgun of this.railguns) {
        if (!railgun.isDestroyed()) {
          const railgunX = railgun.parentCity.position.x + railgun.xOffset;
          const railgunY = railgun.parentCity.position.y;
          
          renderCtx.ctx.fillStyle = '#00ffff';
          renderCtx.ctx.fillText(
            `RG:${Math.ceil(railgun.health)}`,
            railgunX,
            railgunY - 30
          );
        }
      }
      
      // Shared truck cooldowns (between cities)
      for (const truck of this.sharedTrucks) {
        if (!truck.available) {
          const cityA = truck.cityA;
          const cityB = truck.cityB;
          const midX = (cityA.position.x + cityB.position.x) / 2;
          const midY = (cityA.position.y + cityB.position.y) / 2 - 60;
          
          const timeLeft = truck.cooldownTime - truck.cooldown;
          renderCtx.ctx.fillStyle = '#ff00ff';
          renderCtx.ctx.fillText(
            `Truck: ${timeLeft.toFixed(1)}s`,
            midX,
            midY
          );
        }
      }
      
      // Turret aim visualization (show where AI is predicting targets)
      const aiInstances = this.aiController.getAIInstances();
      for (const ai of aiInstances) {
        if (ai.debugAimPositions) {
          for (const tower of ai.towers) {
            if (tower.isDestroyed() || !tower.active) continue;
            
            const aimPos = ai.debugAimPositions.get(tower.id);
            if (aimPos) {
              // Draw line from tower to predicted aim position
              renderCtx.ctx.strokeStyle = tower.isFlakTower ? '#FF8800' : '#00FF0088';
              renderCtx.ctx.lineWidth = 1;
              renderCtx.ctx.setLineDash([4, 4]);
              renderCtx.ctx.beginPath();
              renderCtx.ctx.moveTo(tower.position.x, tower.position.y);
              renderCtx.ctx.lineTo(aimPos.x, aimPos.y);
              renderCtx.ctx.stroke();
              renderCtx.ctx.setLineDash([]);
              
              // Draw crosshair at aim position
              renderCtx.ctx.strokeStyle = tower.isFlakTower ? '#FF8800' : '#00FF00';
              renderCtx.ctx.lineWidth = 2;
              const crossSize = 5;
              renderCtx.ctx.beginPath();
              renderCtx.ctx.moveTo(aimPos.x - crossSize, aimPos.y);
              renderCtx.ctx.lineTo(aimPos.x + crossSize, aimPos.y);
              renderCtx.ctx.moveTo(aimPos.x, aimPos.y - crossSize);
              renderCtx.ctx.lineTo(aimPos.x, aimPos.y + crossSize);
              renderCtx.ctx.stroke();
              
              // Show accuracy percentage next to crosshair
              renderCtx.ctx.fillStyle = tower.isFlakTower ? '#FF8800' : '#00FF00';
              renderCtx.ctx.font = '9px monospace';
              renderCtx.ctx.textAlign = 'left';
              renderCtx.ctx.fillText(
                `${Math.round(ai.difficulty * 100)}%`,
                aimPos.x + 8,
                aimPos.y - 5
              );
            }
          }
        }
      }
      
      // Reset text align
      renderCtx.ctx.textAlign = 'center';
    }
    
    // Render truck availability for each city (above city)
    for (const city of this.cities) {
      if (!city.isDestroyed()) {
        const x = city.position.x;
        const y = city.position.y - 50;
        
        // Draw truck indicators: Left | Right
        renderCtx.ctx.font = '10px monospace';
        renderCtx.ctx.textAlign = 'center';
        
        // Left truck
        const leftOffsetX = -12;
        if (city.leftSharedTruck && city.leftSharedTruck.available) {
          renderCtx.ctx.fillStyle = renderCtx.palette.healthGood;
          renderCtx.ctx.beginPath();
          renderCtx.ctx.arc(x + leftOffsetX, y, 4, 0, Math.PI * 2);
          renderCtx.ctx.fill();
        } else if (city.leftSharedTruck) {
          // Show cooldown progress
          const progress = city.leftSharedTruck.cooldown / city.leftSharedTruck.cooldownTime;
          renderCtx.ctx.strokeStyle = renderCtx.palette.uiText;
          renderCtx.ctx.lineWidth = 1;
          renderCtx.ctx.beginPath();
          renderCtx.ctx.arc(x + leftOffsetX, y, 4, 0, Math.PI * 2);
          renderCtx.ctx.stroke();
          
          // Progress arc
          renderCtx.ctx.strokeStyle = renderCtx.palette.accent;
          renderCtx.ctx.lineWidth = 2;
          renderCtx.ctx.beginPath();
          renderCtx.ctx.arc(
            x + leftOffsetX,
            y,
            5,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * progress
          );
          renderCtx.ctx.stroke();
        }
        
        // Right truck
        const rightOffsetX = 12;
        if (city.rightSharedTruck && city.rightSharedTruck.available) {
          renderCtx.ctx.fillStyle = renderCtx.palette.healthGood;
          renderCtx.ctx.beginPath();
          renderCtx.ctx.arc(x + rightOffsetX, y, 4, 0, Math.PI * 2);
          renderCtx.ctx.fill();
        } else if (city.rightSharedTruck) {
          // Show cooldown progress
          const progress = city.rightSharedTruck.cooldown / city.rightSharedTruck.cooldownTime;
          renderCtx.ctx.strokeStyle = renderCtx.palette.uiText;
          renderCtx.ctx.lineWidth = 1;
          renderCtx.ctx.beginPath();
          renderCtx.ctx.arc(x + rightOffsetX, y, 4, 0, Math.PI * 2);
          renderCtx.ctx.stroke();
          
          // Progress arc
          renderCtx.ctx.strokeStyle = renderCtx.palette.accent;
          renderCtx.ctx.lineWidth = 2;
          renderCtx.ctx.beginPath();
          renderCtx.ctx.arc(
            x + rightOffsetX,
            y,
            5,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * progress
          );
          renderCtx.ctx.stroke();
        }
      }
    }

    // Render game over screen
    if (this.gameOverScreen.isVisible()) {
      this.gameOverScreen.render(renderCtx, gameState.getGameOverStats(), gameState.gameTime);
    }

    requestAnimationFrame(this.startRenderLoop);
  };
}

/**
 * Wave spawner
 */
class WaveSpawner {
  private lastSpawnTime: number = 0;
  private spawnRate: number = 1; // Enemies per second
  private waveStartTime: number = 0;
  private gimmicksConfig: any = null;
  private configLoaded: boolean = false;
  private enemiesSpawnedThisWave: number = 0;
  private maxEnemiesPerWave: number = 15;
  private difficulty: 'easy' | 'normal' | 'hard' | 'extreme' = 'normal';
  private eraStartWave: number = 1; // Wave number when current era started

  constructor(difficulty: 'easy' | 'normal' | 'hard' | 'extreme' = 'normal') {
    this.difficulty = difficulty;
    this.loadConfig();
  }

  private async loadConfig(): Promise<void> {
    this.gimmicksConfig = await loadGimmicksConfig();
    this.configLoaded = true;
    console.log('Gimmicks config loaded:', Object.keys(this.gimmicksConfig.eras));
  }

  /**
   * Update spawner
   */
  update(deltaTime: number, gameState: GameState): void {
    this.lastSpawnTime += deltaTime;
    
    // Get difficulty multiplier (affects enemy count and speed)
    const difficultyMult = this.getDifficultyMultiplier();
    
    // Calculate wave within era (resets each era for nice ramp)
    const waveInEra = gameState.wave - this.eraStartWave + 1;
    
    // Scale spawn rate: increases within each era, affected by difficulty
    // Base rate increases 15% per wave within era, multiplied by difficulty
    const waveScale = 1 + (waveInEra - 1) * 0.15;
    this.spawnRate = waveScale * difficultyMult;
    
    // Scale max enemies per wave: increases within each era
    // Base 10 enemies, +2 per wave within era, multiplied by difficulty
    const baseEnemies = 10;
    const enemiesPerWave = 2;
    this.maxEnemiesPerWave = Math.floor((baseEnemies + (waveInEra - 1) * enemiesPerWave) * difficultyMult);
  }
  
  /**
   * Get difficulty multiplier for spawn rate and enemy count
   */
  private getDifficultyMultiplier(): number {
    switch (this.difficulty) {
      case 'easy': return 0.7;
      case 'normal': return 1.0;
      case 'hard': return 1.4;
      case 'extreme': return 1.8;
      default: return 1.0;
    }
  }
  
  /**
   * Get difficulty speed multiplier for enemy movement
   */
  private getSpeedMultiplier(): number {
    switch (this.difficulty) {
      case 'easy': return 0.8;
      case 'normal': return 1.0;
      case 'hard': return 1.2;
      case 'extreme': return 1.5;
      default: return 1.0;
    }
  }
  
  /**
   * Set difficulty (called when difficulty changes)
   */
  setDifficulty(difficulty: 'easy' | 'normal' | 'hard' | 'extreme'): void {
    this.difficulty = difficulty;
  }
  
  /**
   * Mark the start of a new era
   */
  setEraStart(wave: number): void {
    this.eraStartWave = wave;
  }
  
  /**
   * Is wave complete?
   */
  isWaveComplete(): boolean {
    return this.enemiesSpawnedThisWave >= this.maxEnemiesPerWave;
  }

  /**
   * Spawn enemies
   */
  spawn(width: number, height: number, era: GameEra): Enemy[] {
    const enemies: Enemy[] = [];
    
    if (!this.configLoaded || !this.gimmicksConfig) {
      return enemies;
    }

    // Calculate how many enemies to spawn this frame
    const spawnInterval = 1 / this.spawnRate; // seconds between spawns
    
    // Don't spawn if wave is complete
    if (this.enemiesSpawnedThisWave >= this.maxEnemiesPerWave) {
      return enemies;
    }
    
    if (this.lastSpawnTime >= spawnInterval) {
      this.lastSpawnTime -= spawnInterval;
      
      const x = random(50, width - 50);
      
      // Get era name string directly (enum has string values)
      const eraName = era as string;
      const gimmicks = this.gimmicksConfig.eras[eraName];
      
      if (gimmicks && gimmicks.length > 0) {
        // Check if we should spawn a boss (15% chance, more frequent later in wave)
        const waveProgress = this.enemiesSpawnedThisWave / this.maxEnemiesPerWave;
        const bossChance = waveProgress > 0.5 ? 0.15 : 0.05; // Higher chance in second half of wave
        const shouldSpawnBoss = Math.random() < bossChance;
        
        if (shouldSpawnBoss) {
          // Try to spawn a boss (lower threshold to 75+ HP to include more enemies)
          const bosses = gimmicks.filter(
            (g: any) => g.health >= 75 || g.specialAbility || g.behavior === 'bombing'
          );
          
          if (bosses.length > 0) {
            const bossConfig = bosses[Math.floor(Math.random() * bosses.length)];
            const y = bossConfig.behavior === 'stationary' ? 0 : -30;
            const boss = new Enemy(x, y, bossConfig);
            boss.speed *= this.getSpeedMultiplier();
            enemies.push(boss);
            this.enemiesSpawnedThisWave++;
            console.log(`🎯 Boss spawned: ${bossConfig.name}`);
            return enemies;
          }
        }
        
        // Normal enemy spawning - weight by rarity
        const totalRarity = gimmicks.reduce((sum: number, g: any) => sum + g.rarity, 0);
        let roll = Math.random() * totalRarity;
        
        for (const config of gimmicks) {
          roll -= config.rarity;
          if (roll <= 0) {
            // Spawn stationary enemies at y=0 (visible immediately), others at y=-30
            const y = config.behavior === 'stationary' ? 0 : -30;
            const enemy = new Enemy(x, y, config);
            // Apply difficulty speed multiplier
            enemy.speed *= this.getSpeedMultiplier();
            enemies.push(enemy);
            this.enemiesSpawnedThisWave++;
            break;
          }
        }
        
        // Fallback
        if (enemies.length === 0) {
          const config = gimmicks[0];
          const y = config.behavior === 'stationary' ? 0 : -30;
          const enemy = new Enemy(x, y, config);
          // Apply difficulty speed multiplier
          enemy.speed *= this.getSpeedMultiplier();
          enemies.push(enemy);
          this.enemiesSpawnedThisWave++;
        }
      }
    }
    
    return enemies;
  }

  /**
   * Get current max enemies for this point in the wave (scales up during wave)
   */
  getCurrentMaxEnemies(): number {
    // At start of wave: base amount
    // Partway through: allow more enemies on screen
    const waveProgress = this.enemiesSpawnedThisWave / this.maxEnemiesPerWave;
    
    // Scale from 1.0x at start to 1.5x at 75% through wave
    const scaleFactor = 1.0 + Math.min(waveProgress * 0.67, 0.5); // 1.0x to 1.5x
    
    return Math.floor(this.maxEnemiesPerWave * scaleFactor);
  }
  
  /**
   * Get gimmicks for an era
   */
  getEraGimmicks(eraName: string): any[] | null {
    if (!this.configLoaded || !this.gimmicksConfig) return null;
    return this.gimmicksConfig.eras[eraName] || null;
  }
  
  /**
   * Get a random gimmick config for an era
   */
  getEraGimmickConfig(eraName: string): any | null {
    const gimmicks = this.getEraGimmicks(eraName);
    if (!gimmicks || gimmicks.length === 0) return null;
    return gimmicks[Math.floor(Math.random() * gimmicks.length)];
  }

  /**
   * Reset spawner
   */
  reset(): void {
    this.lastSpawnTime = 0;
    this.waveStartTime = 0;
    this.enemiesSpawnedThisWave = 0;
  }
}

// Global reference for settings panel
declare global {
  interface Window {
    MissileCommand: {
      updateSetting: (key: string, value: any) => void;
      spawnBoss: () => void;
      spawnDeathWave: () => void;
      setDebugClickMode: (enabled: boolean) => void;
      nextWave: () => void;
      nextEra: () => void;
    };
  }
}

// Initialize when DOM is ready
let gameInstance: MissileCommandWallpaper;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    gameInstance = new MissileCommandWallpaper('gameCanvas');
    
    // Expose to global for settings panel
    window.MissileCommand = {
      updateSetting: (key: string, value: any) => gameInstance.updateSetting(key, value),
      spawnBoss: () => gameInstance.spawnBoss(),
      spawnDeathWave: () => gameInstance.spawnDeathWave(),
      setDebugClickMode: (enabled: boolean) => gameInstance.setDebugClickMode(enabled),
      nextWave: () => gameInstance.nextWave(),
      nextEra: () => gameInstance.nextEra(),
    };
  });
} else {
  gameInstance = new MissileCommandWallpaper('gameCanvas');
  
  // Expose to global for settings panel
  window.MissileCommand = {
    updateSetting: (key: string, value: any) => gameInstance.updateSetting(key, value),
    spawnBoss: () => gameInstance.spawnBoss(),
    spawnDeathWave: () => gameInstance.spawnDeathWave(),
    setDebugClickMode: (enabled: boolean) => gameInstance.setDebugClickMode(enabled),
    nextWave: () => gameInstance.nextWave(),
    nextEra: () => gameInstance.nextEra(),
  };
}
