# Features Documentation

## Game Features

### Progressive Difficulty System
- **5 Era Progression**: Meteors → 80s Missiles → 90s Asteroids → 2000s Drones → Future
- **20+ Difficulty Levels**: Game scales from basic meteor defense to futuristic warfare
- **Wave-based Progression**: Automatically advance through waves with increasing enemy variety
- **Difficulty Modifiers**: Easy (0.7x), Normal (1.0x), Hard (1.3x), Extreme (1.6x) multipliers

### Enemy Variety
- **Meteors**: Simple falling asteroids, no coordination needed
- **80s Missiles**: Classic ballistic projectiles with parabolic arc
- **Bombers**: Larger targets that drop nukes with chaff effect
- **Turrets**: Stationary enemies that fire back
- **Asteroids**: Tumbling rocks that split on destruction
- **Comets**: Fast-falling with visual trail
- **Drones**: Intelligent enemies with evasion patterns
- **Drone Swarms**: Coordinated group attacks
- **Hacker Viruses**: Disables towers temporarily
- **Alien Fighters**: Advanced evasion AI
- **Motherships**: Boss enemies that spawn fighters
- **Plasma Bolts**: Homing projectiles
- **Dimension Rifts**: Expanding hazard zones

### AI System
- **Multi-Instance AI**: 1-8 autonomous AI players (user-configurable)
- **Difficulty Levels**: Each AI has configurable skill level (0.5-1.0)
- **Reaction Time**: 50-200ms based on difficulty
- **Target Prioritization**: 
  - Boss enemies (high health, special abilities)
  - Threatening enemies (close to cities)
  - In-range targets
  - Coordination focus-fire on specific targets
- **Coordination Scaling**:
  - Starts independent at level 0
  - Scales to 0.6 by level 10
  - Reaches 1.0 (full coordination) at high levels
  - Increases further after wave 5

### Prediction & Accuracy
- **Position Prediction**: AI predicts where enemies will be when projectile arrives
- **Difficulty Accuracy**: Better difficulty = tighter prediction
- **Velocity Calculation**: Uses enemy speed and direction for interception

### Mouse Interaction (Optional)
- **Optional Mouse Control**: Click to fire additional defense shots
- **AI Auto-play**: Game plays itself without mouse input
- **Assisted Defense**: Mouse helps AI by adding extra firepower
- **No Required Input**: Fully autonomous wallpaper mode

### Defense Mechanics
- **Multiple Towers**: Several towers per city, distributed across defense line
- **Tower Range**: Limited firing range (150-200 pixels)
- **Fire Rate**: Configurable shot frequency
- **Damage Values**: Variable projectile damage based on tower level
- **Tower Advancement**: Tower capabilities improve with era progression

### City System
- **Health Tracking**: Each city has 100 HP
- **Damage Mechanics**: 
  - Missile hit: ~30 damage
  - Boss impact: ~50+ damage
  - Stacking damage: Multiple hits compound
- **Auto-repair**: Cities gradually heal over time
  - Default: 10 HP/second
  - Configurable: 0.1x-10x multiplier
- **Era Styles**: Cities visually progress through time periods
  - 80s: Simple rectangular structures with building windows
  - 90s: Rounded protective domes
  - Future: Geometric hexagonal fortifications
- **Visual Health Indication**: Color-coded health bars (green→red)
- **Game Over Trigger**: All cities destroyed = end game

### Scoring System
- **Kill Points**: Score based on enemy health (10% of max health per kill)
- **Wave Bonus**: Potential multipliers based on waves completed
- **Stats Tracking**:
  - Total score
  - Enemies destroyed
  - Cities lost
  - Current wave/level
  - Time played

### Game Flow
- **Auto Wave Progression**: Waves spawn continuously
- **Level Advancement**: Every 5 waves = new level
- **Era Transitions**: Visual and mechanical changes at level thresholds
- **Game Over State**: 10-second countdown before auto-restart
- **Game Over Screen**:
  - Final score display
  - Wave reached
  - Level achieved
  - Era (technology level)
  - Cities lost count
  - Enemies destroyed count
  - Countdown timer to restart

### Game Speed Control
- **Speed Multiplier**: 0.5x - 4.0x (fully configurable)
- **Affects Everything**: Game ticks, AI reaction, enemy movement
- **Perfect for Testing**: Fast-forward to later eras in seconds
- **Wallpaper Mode**: Use normal speed for aesthetic effect

## Visual Features

### Vector-Based Graphics
- **Pure Line Drawing**: All entities rendered with vector graphics
- **Resolution Scalable**: Perfect at any screen resolution
- **No Pixelation**: Clean rendering at 4K and higher
- **Performance Efficient**: Lightweight vector rendering
- **Anti-aliased**: Smooth edges even at high zoom

### Color Palettes
- **Classic Arcade**: Green on black, authentic retro feel
- **Monochrome**: White/gray on black, OLED-safe (no white lag)
- **Retro**: Magenta/cyan neon colors
- **Red 80s Wireframe**: Red and orange wireframe aesthetic
- **Switchable**: Change palette in real-time without restart

### Visual Elements
- **Crosshairs**: Tower firing indicators
- **Health Bars**: Color-coded for all entities
- **Explosions**: Expanding circle with rays effect
- **Trails**: Optional visual trails on fast enemies
- **Grid Background**: Optional background grid (palette-dependent)
- **Status Indicators**: Health, damage, targeting info

### Viewport Scaling
- **Full Screen Scaling**: Automatic scaling to window size
- **Aspect Ratio Preservation**: Maintains game balance at any resolution
- **Responsive Design**: Entities scale proportionally
- **Playable Area**: Dynamically sized play space

## UI & Settings

### HUD Elements
- **Score Display**: Current score (toggleable)
- **Wave Info**: Current wave and level (toggleable)
- **AI Count**: Number of active AI players (toggleable)
- **Health Status**: City health bars (toggleable)
- **Coordinates**: Position information (debug, toggleable)
- **FPS Counter**: Frames per second (toggleable)
- **Settings Panel**: Expandable/collapsible menu

### Settings Interface
- **In-Game Menu**: Accessible settings panel
- **Expandable Sections**: Collapse sections to reduce UI clutter
- **Real-time Updates**: Changes apply immediately
- **Synced Settings**: In-game and Wallpaper Engine stay synchronized
- **Debug Mode**: Optional debug tools and information

### Settings Available
- **AI Count**: 1-8 autonomous players
- **Difficulty**: Easy/Normal/Hard/Extreme
- **Game Speed**: 0.5x-4.0x multiplier
- **City Repair Rate**: 0.1x-10.0x multiplier
- **Color Palette**: 4 themes available
- **UI Toggles**: Show/hide score, wave, AI, health, coords, FPS
- **Debug Mode**: Enable debug panel
- **Debug Info**: Show debug statistics
- **Repair Multiplier**: Debug tool for testing repair speed

## Wallpaper Engine Integration

### Automatic Property System
- **Properties.json Schema**: Defines all settings with ranges and options
- **Property Categories**: Organized into logical groups
- **Dropdown Menus**: Easy selection for palette and difficulty
- **Slider Controls**: Smooth adjustment for numeric values
- **Toggle Switches**: On/off for boolean settings

### Settings Sync
- **Bidirectional Sync**: Changes propagate both directions
- **Persistent Storage**: Wallpaper Engine handles persistence
- **Automatic Detection**: Properties automatically discovered
- **Real-time Apply**: No restart needed for setting changes

### Offline Capability
- **Fully Self-Contained**: No external libraries required
- **No CDN Calls**: All code bundled locally
- **No Network Access**: Runs completely offline
- **Optimized Bundle**: Single JavaScript file under 100KB

## Customization

### Gimmick System
- **Config-Driven**: `assets/gimmicks.json` defines all enemies
- **Per-Era Variants**: Different enemies for each time period
- **Custom Properties**: Unlimited custom fields per enemy
- **Rarity System**: Weight-based spawn probability
- **Easy to Extend**: Add new enemies without code changes

### Example Customizations
```json
{
  "id": "custom_boss",
  "name": "Custom Boss",
  "health": 500,
  "speed": 2.0,
  "size": 50,
  "rarity": 0.02,
  "aiAwareness": "critical",
  "behavior": "boss_pattern",
  "specialAbility": "custom_attack",
  "custom_field": "custom_value"
}
```

### Color Palette Extension
Easy to add new palettes in `src/rendering/palette.ts`:
- 11 color variables per palette
- Define background, primary, secondary, accent
- Enemy and projectile colors
- Health indicator colors
- UI colors and text

### AI Customization
- **Difficulty Override**: Set specific difficulty per AI
- **Coordination Control**: Override coordination level
- **Target Priority**: Custom target selection algorithm
- **Reaction Time**: Adjust individual AI reaction speed

## Performance Features

### Optimization
- **Spatial Partitioning**: Efficient collision detection grid
- **Object Pooling**: Reuse projectiles and effects
- **Delta Time Capping**: Prevent frame skip instability (max 33ms)
- **Game Speed Scaling**: Maintain stability at any speed

### Resource Usage
- **Lightweight Bundle**: ~70KB compiled (bundled mathjs)
- **Minimal Memory**: ~50-100MB typical usage
- **CPU Efficient**: Vector rendering lighter than bitmap
- **GPU Capable**: Can leverage hardware acceleration

## Accessibility

### Visual Options
- **Multiple Palettes**: Different color schemes
- **High Contrast**: Monochrome mode for visibility
- **OLED-Safe**: Monochrome avoids white lag
- **Adjustable UI**: Hide/show elements as needed

### Gameplay Options
- **Difficulty Adjustment**: Easy through Extreme
- **Speed Control**: Play at comfortable pace
- **No Time Pressure**: Autoplaying reduces stress
- **Optional Mouse**: No input required

## Debug Features

### Development Tools
- **Entity Visualization**: Show collision bounds and info
- **AI Coordination Display**: See current coordination level
- **Boss Spawn Button**: Manually spawn bosses for testing
- **Repair Rate Multiplier**: Test healing mechanics
- **Coordination Override**: Test AI focus-fire behavior
- **Debug Info Panel**: Real-time game statistics

### Data Available in Debug
- Active AI count
- Average coordination level
- Game time elapsed
- Entities spawned/active
- FPS and frame timing

## Mobile & Scaling

### Responsive Design
- **Mobile-Ready**: Works on tablets and mobile browsers
- **Touch Support**: Touch input treated as mouse clicks
- **Flexible Layout**: Adapts to portrait and landscape
- **Scaling**: All vectors scale to device size

### Resolution Support
- **Ultra-wide**: 32:9 and wider displays
- **4K**: Full support for 4K displays
- **Mobile**: Optimized for 1080p and smaller
- **Retina**: Sharp rendering on high-DPI displays

## Data & Statistics

### Tracking
- **Wave History**: Current and maximum waves reached
- **Level Progression**: Current era and technology level
- **Score Accumulation**: Running total during session
- **Kill Statistics**: Enemies destroyed counter
- **Loss Tracking**: Cities destroyed counter
- **Time Tracking**: Game time elapsed

### Game Over Summary
- **Final Score**: Total points earned
- **Waves Survived**: Number of complete waves
- **Maximum Level**: Highest level reached
- **Final Era**: Last technology era reached
- **Damage Report**: Total cities lost
- **Kill Count**: Total enemies destroyed

## Future-Ready Features

### Architecture for Extensions
- **Modular Design**: Easy to add new systems
- **Config-Based**: Extend enemies without code
- **Pluggable Palettes**: Simple to add color themes
- **AI Framework**: Base for custom AI strategies
- **Entity System**: Foundation for new game objects

### Potential Additions
- Particle effects system
- Sound effects (if WE supports)
- Save/load system for high scores
- Procedural generation for enemies
- Procedural level generation
- Multiplayer comparison mode
- Custom skin editor
