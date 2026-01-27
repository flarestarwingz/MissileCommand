# Quick Start Guide

## Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Wallpaper Engine (for final deployment)

### Setup
```bash
cd MissileCommand
npm install
```

## Development

### Build Project
```bash
npm run build
```

This creates an optimized bundle in `dist/missile-command.js`

### Development Watch Mode
```bash
npm run dev
```

Automatically rebuilds when files change.

### Local Testing
```bash
npm run serve
```

Runs webpack dev server at `http://localhost:8080`

## Configuration

### Game Settings
Edit these through:
1. **Wallpaper Engine properties panel** (recommended for end users)
2. **In-game HUD settings** (toggle with Settings expander)

Key settings:
- **AI Count**: 1-8 autonomous AI players
- **Difficulty**: Easy/Normal/Hard/Extreme
- **Game Speed**: 0.5x-4x multiplier (useful for testing)
- **City Repair Rate**: How fast cities heal
- **Color Palette**: Visual theme
- **UI Toggles**: Show/hide score, wave, health, etc.

### Customizing Enemies and Bosses
Edit `assets/gimmicks.json` to customize:
- Enemy types per era
- Boss encounter configurations
- Special abilities (bombing, chaff, spawning, etc.)
- Spawn probabilities

### Custom Color Palettes
Edit `src/rendering/palette.ts` to add new palettes:
```typescript
retro: {
  name: 'Retro',
  background: '#0a0a0a',
  primary: '#FF00FF',
  // ... other colors
},
```

## Game Mechanics

### Gameplay Loop
1. Enemies spawn from top of screen
2. AI players (or you with mouse) fire projectiles
3. Enemies move down toward cities at bottom
4. Collisions cause damage/destruction
5. Waves progress automatically
6. Game ends when all cities are destroyed

### Wave Progression
- **Meteors** (levels 0-4): Simple falling enemies, no coordination needed
- **80s Missiles** (levels 5-9): Classic ballistic missiles, AI learns coordination
- **90s Asteroids** (levels 10-14): Tumbling, sometimes split enemies
- **2000s Drones** (levels 15-19): Intelligent evasion, higher difficulty
- **Future Era** (level 20+): Advanced enemies, motherships, complex behaviors

### AI Coordination
- Starts independent at level 0
- Increases with difficulty and level progression
- At high coordination, AIs focus-fire on threatening targets
- Can be overridden in debug settings for testing

## Mouse Control (Optional)

Click to fire defense shots:
- AI handles most defense automatically
- Your mouse clicks assist (optional enhancement)
- Click near enemy to intercept
- Most effective with fewer AI count (gives you more control)

## Debug Mode

Enable in Wallpaper Engine properties:
1. Set `Enable Debug Mode` to On
2. Set `Show Debug Info` to On

Debug panel shows:
- Active AI count
- Current coordination level
- Game time elapsed
- (Optionally spawn bosses and adjust repair rate)

## Common Tasks

### Testing a Specific Era
1. Set `Game Speed` to 2x-4x
2. Monitor as waves progress to desired era
3. Check enemy behavior and AI coordination

### Testing Boss Mechanics
1. Enable Debug Mode
2. Use debug controls to spawn specific bosses
3. Monitor how AI prioritizes and targets boss
4. Adjust coordination level to see focus-fire behavior

### Testing Performance
1. Set `Show FPS` to On
2. Gradually increase `AI Count` and watch FPS
3. Monitor CPU usage in system monitor
4. Adjust `Game Speed` if performance degrades

### Adjusting Difficulty
1. Change `Difficulty` preset (Easy/Normal/Hard/Extreme)
2. Tweak `City Repair Rate` to make cities harder/easier to defend
3. Add more `AI Count` to make defense stronger

## File Locations

| File | Purpose |
|------|---------|
| `index.html` | Main entry point for Wallpaper Engine |
| `properties.json` | Wallpaper Engine settings schema |
| `assets/gimmicks.json` | Enemy and boss configurations |
| `src/index.ts` | Main application logic |
| `src/core/` | Game engine and state |
| `src/entities/` | All game objects |
| `src/rendering/` | Canvas and graphics |
| `src/ui/` | HUD and menus |
| `dist/` | Compiled output (after build) |

## Deployment to Wallpaper Engine

1. Build the project:
   ```bash
   npm run build
   ```

2. Create a new custom scene in Wallpaper Engine editor

3. Configure properties in Wallpaper Engine:
   - Point file path to `index.html`
   - Set initial properties (AI count, difficulty, palette)
   - Test in editor

4. Save and share your wallpaper

## Tips for Best Results

- **Start Simple**: Begin with 1-2 AIs and Normal difficulty
- **Monitor Performance**: Higher AI counts and faster speeds use more CPU
- **Customize Colors**: Choose palette matching your desktop theme
- **Adjust Repair Rate**: Balance challenge (low repair) vs. aesthetics (can always replenish)
- **Game Speed**: Use 0.5x for relaxing, 2x+ for testing/fast progression
- **Hide Scores**: For a clean wallpaper appearance, hide all UI elements

## Troubleshooting

**Game not starting?**
- Check browser console for errors (F12)
- Verify `assets/gimmicks.json` is in correct location
- Ensure TypeScript compilation succeeded

**AI not firing?**
- Check towers are properly assigned (debug info)
- Verify enemies are spawning
- Increase `Show Debug Info` to see AI state

**Performance issues?**
- Reduce `AI Count`
- Disable `Show FPS` and `Show Debug Info`
- Lower `Game Speed`
- Close other applications

**Settings not persisting?**
- For Wallpaper Engine: Properties auto-save through WE
- For local testing: Reload page to reset settings

## Next Steps

1. Run `npm install` to set up dependencies
2. Run `npm run build` to create the bundle
3. Open `index.html` in your browser to test locally
4. Customize `assets/gimmicks.json` with your own enemy types
5. Add new color palettes to `src/rendering/palette.ts`
6. Deploy to Wallpaper Engine for final testing

## Getting Help

- Check `DEVELOPMENT.md` for architecture details
- Review code comments in TypeScript files
- Check `README.md` for feature documentation
- See `assets/gimmicks.json` for enemy configuration examples

Happy wallpapering!
