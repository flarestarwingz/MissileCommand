# File Reference Guide

## Quick Navigation

### Entry Points
- **Main HTML**: `index.html`
- **Main TypeScript**: `src/index.ts`
- **Build Output**: `dist/missile-command.js` (after build)

### Configuration
- **Wallpaper Engine Settings**: `properties.json`
- **Enemy Definitions**: `assets/gimmicks.json`
- **TypeScript Compiler**: `tsconfig.json`
- **Webpack Bundler**: `webpack.config.js`
- **NPM Dependencies**: `package.json`

### Documentation
- **User Features**: `README.md`
- **Getting Started**: `QUICKSTART.md`
- **Architecture & Extending**: `DEVELOPMENT.md`
- **Build Instructions**: `BUILD.md`
- **Complete Features**: `FEATURES.md`
- **Project Status**: `PROJECT_COMPLETE.md`

### License & Ignore
- **License**: `LICENSE` (BSD 3-Clause)
- **Git Ignore**: `.gitignore`

---

## Source Code Organization

### Core Game Logic (`src/core/`)

**gameEngine.ts** (147 lines)
- Game loop implementation
- Delta time management
- Game speed multiplier application
- Frame timing and callbacks

**gameState.ts** (89 lines)
- Game progress tracking
- Wave/level/era management
- Game over state handling
- Statistics collection

**settingsManager.ts** (102 lines)
- Configuration hub
- Settings listeners
- Difficulty multipliers
- Change notifications

### Rendering (`src/rendering/`)

**canvas.ts** (149 lines)
- Canvas 2D context management
- Vector drawing (lines, circles, rectangles, polygons)
- Text rendering
- Grid and visual effects

**palette.ts** (104 lines)
- Color theme definitions
- Palette switching
- Available palette management
- 4 built-in themes

### Game Objects (`src/entities/`)

**city.ts** (157 lines)
- City class with health/repair
- Tower class with firing mechanics
- Era-based visual rendering
- Health bar display

**enemies.ts** (247 lines)
- Enemy base class
- 8+ behavior patterns (falling, ballistic, intelligent, etc.)
- Gimmick config integration
- Damage tracking and rendering

**projectiles.ts** (135 lines)
- Projectile movement and collision
- Explosion visual effects
- Trail rendering support

**ai.ts** (228 lines)
- Multi-instance AI controller
- Target prioritization algorithm
- Position prediction
- Coordination level management
- Tower assignment and control

**bossManager.ts** (94 lines)
- Boss spawn mechanics
- Gimmick configuration cache
- Special event handling (chaff, swarms, etc.)

### User Interface (`src/ui/`)

**hud.ts** (212 lines)
- HUD rendering system
- Settings panel display
- Game over screen with countdown
- Expandable UI sections
- Debug information display

### Utilities (`src/utils/`)

**math.ts** (189 lines)
- Vector operations (add, subtract, scale, normalize)
- Distance and angle calculations
- Interpolation and damping
- Random number generation
- Degree/radian conversion

**collision.ts** (191 lines)
- Circle-circle collision detection
- Point-in-shape checks
- Circle-rectangle collision
- Circle-line collision
- Spatial grid for optimization

**input.ts** (67 lines)
- Mouse input tracking
- Event listener system
- Mouse position management
- Keyboard support

**configLoader.ts** (104 lines)
- JSON configuration loading
- Gimmick definitions
- Era-specific enemy access
- Weighted random selection

### Wallpaper Engine Integration (`src/wallpaperEngine/`)

**integration.ts** (147 lines)
- Properties schema definition
- Property conversion functions
- Wallpaper Engine API binding
- Settings synchronization

### Main Application (`src/`)

**index.ts** (527 lines)
- MissileCommandWallpaper class (main app)
- Game initialization and setup
- Entity creation and management
- Game loop and updates
- Collision detection
- Event handling
- Rendering loop
- WaveSpawner class for enemy generation

---

## Asset Files

### assets/gimmicks.json (415 lines)
Configuration for all enemies and bosses:
- **Meteors Era**: Small, medium, large meteors
- **80s Missiles Era**: Classic missiles, fast missiles, bomber, turret
- **90s Asteroids Era**: Small, medium, large asteroids, comet
- **2000s Era**: Drones, drone swarms, hacker virus
- **Future Era**: Alien fighters, mothership, plasma bolts, dimension rifts

Each entry includes:
- ID and display name
- Health, speed, size
- Rarity (spawn probability)
- AI awareness level
- Behavior type
- Special abilities and parameters

---

## Build Output Files

### After `npm run build`:

**dist/missile-command.js** (~70-100 KB)
- Bundled application code
- All TypeScript compiled to JavaScript
- All modules included
- Minified for production

**dist/missile-command.js.map**
- Source map for debugging
- Maps minified code back to TypeScript

---

## Configuration Files

### properties.json
Wallpaper Engine property definitions:
- Property name keys (lowercase with underscores)
- Label text for UI
- Type (slider, combo, bool)
- Min/max/step values
- Default values
- Help text

Example properties:
- `aicount` (1-8 slider)
- `difficulty` (combo: easy/normal/hard/extreme)
- `gamespeed` (0.5-4.0 slider)
- `colorpalette` (combo: 4 themes)
- Various toggle switches for UI

### package.json
NPM configuration:
- Project metadata
- Build scripts (dev, build, serve)
- Dependencies (TypeScript, Webpack, Math.js)
- License and keywords

### tsconfig.json
TypeScript compiler options:
- Target ES2020
- Strict mode enabled
- Source maps enabled
- Module resolution
- Strict null checks

### webpack.config.js
Module bundling configuration:
- Entry point: src/index.ts
- Output: dist/missile-command.js
- TypeScript loader
- UMD library format

---

## Documentation Files Structure

### README.md
- Feature overview
- Installation and building
- Settings reference table
- Configuration instructions
- Tech stack details

### QUICKSTART.md
- Installation steps
- Build and test instructions
- Configuration walkthrough
- Game mechanics explanation
- Troubleshooting guide

### BUILD.md
- Detailed build process
- File structure after build
- Wallpaper Engine deployment steps
- Troubleshooting builds
- Performance optimization
- CI/CD setup example

### DEVELOPMENT.md
- Project structure overview
- Core systems explanation
- Game mechanics detailed
- Feature addition guide
- Performance considerations
- Common issues and solutions

### FEATURES.md
- Comprehensive feature list
- Game mechanics explanation
- AI system details
- Visual features
- Settings documentation
- Customization options

### PROJECT_COMPLETE.md
- Implementation summary
- Architecture highlights
- File statistics
- Deployment status
- Feature checklist

---

## Key Code Locations by Feature

### Finding Specific Features:

**Game Loop & Timing**
- Location: `src/core/gameEngine.ts`
- Class: `GameEngine`
- Method: `gameLoop()`

**AI Decision Making**
- Location: `src/entities/ai.ts`
- Class: `AIController`
- Method: `findBestTarget()`, `update()`

**Enemy Spawning**
- Location: `src/index.ts`
- Class: `WaveSpawner`
- Method: `spawn()`

**Collision Detection**
- Location: `src/index.ts` MissileCommandWallpaper.updateCollisions()
- Utilities: `src/utils/collision.ts`

**Settings Management**
- Location: `src/core/settingsManager.ts`
- Class: `SettingsManager`
- Methods: `updateSettings()`, `onChange()`

**Color Palettes**
- Location: `src/rendering/palette.ts`
- Object: `PALETTES`
- Class: `PaletteManager`

**Rendering**
- Location: `src/rendering/canvas.ts`
- Class: `CanvasRenderer`
- Methods: `drawLine()`, `drawCircle()`, etc.

**Wallpaper Engine Integration**
- Location: `src/wallpaperEngine/integration.ts`
- Function: `setupWallpaperEngine()`

---

## Dependencies

### Runtime (Bundled)
- **mathjs**: Mathematical operations library

### Development Only
- **TypeScript**: Type-safe JavaScript
- **Webpack**: Module bundler
- **ts-loader**: TypeScript webpack loader

---

## Build Artifacts

After `npm run build`:
- `dist/missile-command.js` - Main bundle (~70KB)
- `dist/missile-command.js.map` - Source map
- `tsconfig.tsbuildinfo` - TypeScript build info

## Important Notes

1. **All source files are TypeScript** (.ts extension)
2. **No external CDNs** - Everything is bundled locally
3. **Configuration is JSON** - Easy to modify without code changes
4. **Self-contained** - Runs completely offline
5. **Vector-based graphics** - All rendering uses Canvas 2D

---

## How to Find Things

| What | Where |
|------|-------|
| Game settings | `settingsManager.ts` |
| Enemy definitions | `assets/gimmicks.json` |
| Color themes | `palette.ts` |
| Game loop | `gameEngine.ts` |
| AI behavior | `ai.ts` |
| Entity rendering | `enemies.ts`, `city.ts` |
| HUD display | `hud.ts` |
| Input handling | `input.ts` |
| Collision code | `collision.ts`, `index.ts` |
| Wallpaper Engine setup | `integration.ts` |

---

**Total Project Size**: ~100KB compiled (including bundled mathjs)
**Source Code**: ~2,500 lines of TypeScript
**Documentation**: ~2,000 lines across 6 files
