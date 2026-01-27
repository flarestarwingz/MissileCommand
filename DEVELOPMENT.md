# Development Guide

## Project Structure

```
MissileCommand/
├── src/
│   ├── core/              # Game engine and state management
│   │   ├── gameEngine.ts  # Main game loop and timing
│   │   ├── gameState.ts   # Game state and statistics
│   │   └── settingsManager.ts  # Settings management
│   ├── rendering/         # Canvas rendering and visuals
│   │   ├── canvas.ts      # Canvas 2D renderer
│   │   └── palette.ts     # Color palette system
│   ├── entities/          # Game objects and entities
│   │   ├── city.ts        # Cities and defense towers
│   │   ├── enemies.ts     # Enemy entities
│   │   ├── projectiles.ts # Projectiles and explosions
│   │   ├── ai.ts          # AI controller system
│   │   └── bossManager.ts # Boss and gimmick management
│   ├── ui/                # User interface
│   │   └── hud.ts         # HUD and game over screen
│   ├── utils/             # Utility functions
│   │   ├── math.ts        # Vector and math utilities
│   │   ├── collision.ts   # Collision detection
│   │   ├── input.ts       # Input handling
│   │   └── configLoader.ts # Config file loading
│   ├── wallpaperEngine/   # Wallpaper Engine integration
│   │   └── integration.ts # WE property handling
│   └── index.ts           # Main application entry point
├── assets/
│   └── gimmicks.json      # Boss and enemy configurations
├── index.html             # Wallpaper Engine HTML
├── properties.json        # Wallpaper Engine properties schema
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── webpack.config.js      # Webpack build configuration
├── LICENSE                # BSD 3-Clause license
├── README.md              # User documentation
└── DEVELOPMENT.md         # This file
```

## Core Systems

### Game Engine (gameEngine.ts)
- Manages game loop timing with requestAnimationFrame
- Applies game speed multiplier to deltaTime
- Handles pause/resume state
- Triggers update and game over callbacks

### Game State (gameState.ts)
- Tracks score, wave, level, and era progression
- Manages game time tracking
- Handles era transitions based on level
- Stores game over statistics

### Settings Manager (settingsManager.ts)
- Central configuration hub for all settings
- Syncs between Wallpaper Engine and in-game HUD
- Notifies listeners of changes
- Provides difficulty multipliers

### Canvas Renderer (canvas.ts)
- Handles all vector drawing (lines, circles, polygons)
- Manages palette colors
- Supports scaling and transformations
- Provides text rendering utilities

### AI Controller (entities/ai.ts)
- Manages multiple AI instances (1-N)
- Each AI has difficulty level, assigned towers, and reaction time
- Implements target prioritization (bosses, threatening enemies, close enemies)
- Calculates coordination level based on game progression
- Predicts enemy positions for accurate firing

### Entity System
- **City**: Has health, repairs over time, takes damage from enemies
- **Tower**: Fires projectiles at enemies, has limited range
- **Enemy**: Takes damage, moves according to behavior pattern
- **Projectile**: Travels from source to target, damages on collision
- **Explosion**: Temporary visual effect with expanding radius

## Game Mechanics

### Wave Progression
1. Waves increment automatically
2. Levels are calculated as `floor(wave / 5) + 1`
3. Eras change based on level:
   - Level 0-4: Meteors (simple falling)
   - Level 5-9: 80s Missiles (ballistic, coordinated)
   - Level 10-14: 90s Asteroids (tumbling, splitting)
   - Level 15-19: 2000s Drones (intelligent, evasive)
   - Level 20+: Future (advanced AI, spawning)

### AI Coordination
- Starts at 0 (independent)
- Increases by `(level / 10) * 0.6` base + `0.3` bonus after wave 5
- Caps at 1.0 (full coordination)
- High coordination: AIs focus fire on same targets

### Enemy Spawning
- Spawn rate increases with wave: `1 + wave * 0.2`
- Difficulty multiplier: based on selected difficulty and level
- Enemy type selected randomly from current era with rarity weights
- Bosses spawn with low probability, increasing with waves

### Collision System
- Projectile vs Enemy: Enemy takes damage, projectile destroyed
- Enemy vs City: City takes damage, enemy destroyed
- Explosions don't cause additional collision damage (visual only)

## Adding New Features

### Adding a New Enemy Type
1. Add config entry to `assets/gimmicks.json`:
```json
{
  "id": "unique_id",
  "name": "Display Name",
  "health": 100,
  "speed": 2.5,
  "size": 15,
  "rarity": 0.3,
  "aiAwareness": "medium",
  "behavior": "falling"
}
```

2. Add rendering logic in `Enemy.render()` method based on `config.id`
3. Add behavior update in `Enemy.update()` method for custom movement

### Adding a New Color Palette
1. Add palette to `PALETTES` object in `rendering/palette.ts`:
```typescript
const PALETTES: Record<string, ColorPalette> = {
  newpalette: {
    name: 'New Palette',
    background: '#...',
    primary: '#...',
    secondary: '#...',
    accent: '#...',
    enemy: '#...',
    projectile: '#...',
    city: '#...',
    healthGood: '#...',
    healthBad: '#...',
    ui: '#...',
    uiText: '#...',
  },
  // ... existing palettes
};
```

2. Update `properties.json` to add the new option

### Adding Custom AI Behavior
1. Extend `AIController.findBestTarget()` for custom target prioritization
2. Modify reaction time or prediction accuracy based on AI personality
3. Add coordination bonuses for specific enemy types

## Performance Considerations

### Optimization Tips
- Use spatial partitioning for collision detection with many entities
- Pool and reuse projectile/explosion objects
- Limit particle count and effect complexity
- Clamp deltaTime to prevent large jumps (`Math.min(delta, 0.033)`)
- Use Canvas2D getImageData sparingly

### Profiling
- Monitor FPS with `showfps` setting
- Check AI count impact on performance
- Profile collision detection with many enemies
- Test on target hardware (potential wallpaper Engine limitations)

## Testing

### Debug Mode
Enable via Wallpaper Engine properties:
1. `Enable Debug Mode` = On
2. `Show Debug Info` = On
3. Access `Repair Rate Multiplier` to test city repairs
4. Manually spawn bosses (debug button in settings panel)
5. Override coordination level to test AI behavior

### Building and Testing Locally
```bash
npm install
npm run build
# Open index.html in browser
```

### Testing in Wallpaper Engine
1. Build project: `npm run build`
2. Open Wallpaper Engine editor
3. Create new custom scene
4. Point to `dist/` folder
5. Configure properties in WE settings panel

## Common Issues

### Enemies not spawning
- Check `assets/gimmicks.json` is loaded
- Verify era names match in `GameEra` enum
- Check spawn rate calculation in `WaveSpawner.update()`

### AI not firing
- Check towers are assigned to AI: `AIController.assignTowersToAI()`
- Verify `canFire()` check and reaction time
- Check collision detection for projectiles

### Settings not syncing
- Ensure Wallpaper Engine properties names match in `wallpaperPropsToSettings()`
- Check `SettingsManager` listeners are registered
- Verify `HUD.render()` uses current settings

## Building for Wallpaper Engine

### Production Build
```bash
npm run build
```

Creates optimized bundle in `dist/missile-command.js`

### Distribution Package
1. Copy `dist/` folder contents
2. Include `index.html` and `properties.json`
3. Include `assets/gimmicks.json`
4. Add preview image (optional)
5. Zip and distribute

## Resources

- [Wallpaper Engine Documentation](https://docs.wallpaperengine.io)
- [Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Webpack Documentation](https://webpack.js.org/concepts)
