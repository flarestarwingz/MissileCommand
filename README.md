# Missile Command Wallpaper Engine

A dynamic, self-playing Missile Command-style live wallpaper for Wallpaper Engine featuring progressive difficulty scaling, multiple AI personalities, boss encounters, era-based aesthetic progression, and customizable color palettes.

## Features

### Core Gameplay
- **Self-Playing AI**: Autonomous multi-AI system (1-N configurable instances) that plays the game automatically
- **Optional Mouse Control**: Assist the AI with mouse clicks to fire defense projectiles
- **Progressive Difficulty**: Scales through multiple eras with increasing enemy complexity
- **City Repair System**: Damaged cities gradually repair over time (configurable rate)
- **Game Over Flow**: 10-second game over screen with stats before auto-reset

### Enemy Progression & Bosses
- **Wave Scaling**: Starts with meteors → classic missiles → asteroids → futuristic enemies
- **Boss Encounters**: Era-specific boss encounters (e.g., 80s bomber with nuke and chaff, UFO swarms)
- **Dynamic Gimmick System**: Config-driven boss/gimmick variants allowing easy customization and community additions
- **AI Awareness**: AI detects and prioritizes boss threats appropriately

### Aesthetic & Customization
- **Era-Based Visual Progression**: 80s pixel style → 90s → 2000s → futuristic; synchronized with gameplay progression
- **Color Palettes**: 
  - Classic Arcade
  - Monochrome (OLED-safe)
  - Retro
  - Red 80s Wireframe
- **Vector-Based Rendering**: All graphics drawn as lines and vectors for pixel-perfect scaling
- **Responsive Scaling**: Automatically scales to any screen resolution maintaining visual quality

### Settings & Customization
- **Wallpaper Engine Settings**: Configure AI count, difficulty, game speed, palette, and UI visibility
- **In-Game HUD Settings**: Real-time settings adjustment with collapsible expanders
- **Synced Settings**: Changes in Wallpaper Engine or HUD automatically sync across both interfaces
- **UI Visibility Toggles**: Hide/show score, wave count, AI count, health, coordinates, FPS, and debug info

### Debug & Testing
- **Debug Expander**: Access debug tools without affecting wallpaper view
- **Boss Spawn Button**: Manually spawn any configured boss for testing
- **Repair Rate Multiplier**: Speed up/slow down city repair for testing
- **Coordination Level Override**: Test AI coordination scaling
- **Entity Visualization**: Toggle collision bounds and entity information overlay

### Performance & Settings
- **Game Speed Multiplier**: 0.5x to 4x speed control for fast-forwarding through levels or slowing for analysis
- **AI Coordination Scaling**: AI teamwork increases with difficulty level (configurable)
- **Configurable Difficulty**: Affects enemy behavior, spawn rates, and AI skill

## Settings

### Wallpaper Engine Settings
Access these from Wallpaper Engine's properties panel:

| Setting | Range | Description |
|---------|-------|-------------|
| AI Count | 1-8 | Number of autonomous AI players controlling defense |
| Difficulty | Easy / Normal / Hard / Extreme | Enemy aggression and spawn rates |
| Game Speed | 0.5x - 4x | Multiplier for all game speeds (useful for testing) |
| Color Palette | Classic / Monochrome / Retro / Red 80s | Visual theme |
| Show Score | On/Off | Display current score |
| Show Wave Info | On/Off | Display wave and level information |
| Show AI Count | On/Off | Display number of active AIs |
| Show Health | On/Off | Display city health bar |
| Show Coordinates | On/Off | Show debug coordinates |
| Show FPS | On/Off | Display frame rate counter |
| City Repair Rate | 0.1x - 10x | How quickly cities repair (1x = default) |

### In-Game Settings
Press the Settings button or expand the Settings panel in the HUD to access:
- All Wallpaper Engine settings (synced)
- Debug tools (if enabled in Wallpaper Engine settings)
  - Boss spawn controls
  - Repair rate multiplier
  - AI coordination level override
  - Entity visualization toggles

## Configuration

### Gimmicks and Bosses
Edit `assets/gimmicks.json` to customize or add boss encounters and special events for each era.

```json
{
  "eras": {
    "meteors": [
      {
        "id": "large_meteor",
        "name": "Large Meteor",
        "health": 100,
        "speed": 2.5,
        "rarity": 0.3,
        "aiAwareness": "threat"
      }
    ],
    "eighties_missiles": [
      {
        "id": "bomber",
        "name": "B-52 Bomber",
        "health": 300,
        "behavior": "dropping",
        "weaponType": "nuke",
        "specialAbility": "chaff_flares",
        "rarity": 0.1,
        "aiAwareness": "high"
      }
    ]
  }
}
```

Each gimmick entry can include:
- `id`: Unique identifier
- `name`: Display name
- `health`: Hit points
- `rarity`: Spawn frequency (0-1, lower = rarer)
- `aiAwareness`: How much AI focuses on it ("low", "threat", "high")
- Custom behavior properties

## Technical Details

### Architecture
```
src/
  core/           - Game engine, state management
  rendering/      - Canvas rendering, palettes
  entities/       - Game objects (cities, enemies, towers, projectiles)
  ui/             - HUD, settings, game over screen
  utils/          - Math, collision, config loading
  wallpaperEngine/- Wallpaper Engine integration
```

### Technology Stack
- **TypeScript**: Type-safe game code
- **Canvas 2D**: Vector-based rendering
- **Math.js**: Mathematical operations
- **Webpack**: Module bundling
- **Offline-First**: All dependencies bundled; runs completely offline

### Vector Rendering
All graphics use HTML5 Canvas 2D context for drawing lines, arcs, and polygons. The rendering system scales all vectors proportionally to the viewport, ensuring visual consistency across any screen resolution.

### Collision Detection
Custom vector-based collision detection for projectiles, enemies, and impact zones. Optimized for performance with spatial partitioning where needed.

## Building & Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development Build
```bash
npm run dev
```

Runs TypeScript compiler in watch mode and webpack in development mode.

### Production Build
```bash
npm run build
```

Creates optimized production bundle in `dist/`.

### Local Testing
```bash
npm run serve
```

Serves the application at `http://localhost:8080` for browser testing before importing into Wallpaper Engine.

## Installation in Wallpaper Engine

1. Build the project: `npm run build`
2. Create a new custom scene in Wallpaper Engine
3. Set the scene path to the `dist/` directory
4. Configure settings through Wallpaper Engine's properties panel
5. Optionally edit `assets/gimmicks.json` for customization

## Wallpaper Engine Integration

The project uses Wallpaper Engine's native settings system:
- Settings are defined and managed through Wallpaper Engine's properties
- In-game HUD settings automatically sync with Wallpaper Engine properties
- Configuration persists across sessions through Wallpaper Engine's config system
- No external network calls; runs completely offline

## Contributing

Contributions are welcome! Feel free to:
- Add new boss encounters via `assets/gimmicks.json`
- Implement new color palettes in the palette system
- Enhance AI strategies and coordination
- Improve visual rendering and vector graphics
- Optimize performance

## License

This project is licensed under the BSD 3-Clause License - see the [LICENSE](LICENSE) file for details.

## Credits

Inspired by the classic Missile Command arcade game. Built for Wallpaper Engine.

## Roadmap

- [ ] Additional era themes (cyberpunk, space, medieval)
- [ ] Leaderboard system (local storage)
- [ ] Particle effects for explosions
- [ ] Sound effects and music (if Wallpaper Engine supports)
- [ ] Advanced AI learning patterns
- [ ] Custom skin editor
- [ ] Multiplayer AI comparison
