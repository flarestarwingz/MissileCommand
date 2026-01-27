# Build & Deployment Instructions

## Initial Setup

### 1. Install Dependencies
```bash
cd MissileCommand
npm install
```

This installs:
- TypeScript compiler
- Webpack bundler
- Development dependencies
- Math.js library (bundled)

### 2. Build the Project
```bash
npm run build
```

This:
1. Compiles TypeScript to JavaScript
2. Bundles all modules with Webpack
3. Creates optimized output in `dist/missile-command.js`
4. Generates source maps for debugging

### 3. Test Locally
```bash
npm run serve
```

Opens `http://localhost:8080` in your browser with hot-reload support.

Alternatively, simply open `index.html` in a browser (requires build first).

## Project Structure After Build

```
dist/
├── missile-command.js     # Main bundled application
├── missile-command.js.map # Source map for debugging
assets/
├── gimmicks.json          # Enemy configurations (NOT bundled)
index.html                 # Entry point
properties.json            # Wallpaper Engine configuration
```

## Wallpaper Engine Deployment

### Prerequisites
- Wallpaper Engine installed on Windows
- Built project (`npm run build` completed)
- `dist/` folder with compiled JavaScript

### Step-by-Step

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Prepare files for Wallpaper Engine:**
   - Ensure `index.html` is in project root
   - Ensure `properties.json` is in project root
   - Ensure `assets/gimmicks.json` is present
   - Ensure `dist/missile-command.js` exists

3. **Open Wallpaper Engine:**
   - Launch Wallpaper Engine
   - Go to Editor > Create Custom Scene
   - Set "Custom URL or HTML" mode

4. **Configure the Scene:**
   - Set path to your `index.html`
   - The engine will automatically discover `properties.json`
   - Configure initial properties:
     - **AI Count**: 1-8
     - **Difficulty**: Choose one
     - **Game Speed**: 1.0 (normal)
     - **Color Palette**: Pick your favorite
     - **UI Toggles**: Customize what's shown

5. **Test:**
   - Preview the wallpaper in the editor
   - Verify all features work
   - Test with different settings

6. **Publish/Share:**
   - Save your custom scene
   - Share the entire MissileCommand folder
   - Include this README for users

## Development Workflow

### During Development
```bash
# Start development server with auto-rebuild
npm run dev

# In another terminal, run webpack dev server
npm run serve

# Edit files in src/
# Changes auto-compile
# Refresh browser to see updates
```

### Making Changes

1. **Adding new enemies:** Edit `assets/gimmicks.json`
2. **Changing colors:** Edit `src/rendering/palette.ts`
3. **Adding features:** Create new files in appropriate `src/` folders
4. **Testing changes:** Run `npm run build` then test

### Compiling for Production
```bash
npm run build
```

Creates optimized, minified JavaScript bundle.

## File Descriptions

### Entry Points
- **index.html**: Main HTML file loaded by Wallpaper Engine
- **src/index.ts**: Application initialization and main loop

### Configuration
- **properties.json**: Wallpaper Engine property definitions
- **assets/gimmicks.json**: Enemy and boss configurations
- **tsconfig.json**: TypeScript compiler settings
- **webpack.config.js**: Module bundling configuration
- **package.json**: Dependencies and build scripts

### Source Code Structure
```
src/
├── core/              # Game engine, state, settings
├── rendering/         # Canvas, colors, effects
├── entities/          # Game objects, AI, bosses
├── ui/                # HUD, menus, game over
├── utils/             # Math, collision, input
├── wallpaperEngine/   # WE integration
└── index.ts           # Main application
```

## Troubleshooting Builds

### Issue: TypeScript compilation errors
**Solution:**
```bash
# Clean and rebuild
rm -rf dist/
npm run build
```

### Issue: Module not found errors
**Solution:**
- Check file paths in imports
- Verify relative paths are correct
- Ensure all files exist in `src/`

### Issue: Wallpaper Engine doesn't load
**Solution:**
1. Verify `index.html` exists and is valid
2. Check browser console (F12) for JavaScript errors
3. Ensure `dist/missile-command.js` is properly bundled
4. Check `assets/gimmicks.json` path is correct

### Issue: Settings not applying
**Solution:**
1. Verify property names in `properties.json` match code
2. Check `wallpaperPropsToSettings()` in `integration.ts`
3. Ensure settings manager listeners are registered
4. Clear Wallpaper Engine cache: `%appdata%\Wallpaper Engine\`

## Performance Optimization

### Build Size
Current bundle: ~50-70KB (uncompressed)

To reduce:
- Remove unused dependencies
- Minify assets
- Use tree-shaking in webpack

### Runtime Performance
- Higher AI count = more CPU usage
- Enemies spawn increases with waves
- Optimize collision detection with spatial partitioning
- Use object pooling for projectiles/explosions

### Testing Performance
```bash
# Enable debug FPS counter
# In Wallpaper Engine properties, set "Show FPS" to On
# Monitor FPS in-game
```

## Version Updates

### Making a New Release
1. Update version in `package.json`
2. Update version in `properties.json`
3. Document changes in `README.md`
4. Build: `npm run build`
5. Test thoroughly
6. Commit and tag in Git

## Distribution

### For Users
1. Download the MissileCommand folder
2. Unzip to desired location
3. In Wallpaper Engine, select "Custom scene"
4. Point to the `index.html` file
5. Configure settings as desired
6. Apply to screen

### For Developers Forking
1. Clone or fork the repository
2. `npm install` to set up dependencies
3. Make modifications
4. `npm run build` to compile
5. Test locally and in Wallpaper Engine
6. Commit and push changes

## Environment Setup for CI/CD

If setting up automated builds:

```yaml
# Example GitHub Actions workflow
name: Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: actions/upload-artifact@v2
        with:
          name: missile-command
          path: dist/
```

## Maintenance

### Regular Tasks
- Monitor for TypeScript updates
- Update dependencies: `npm update`
- Test on latest Wallpaper Engine version
- Collect user feedback and bug reports

### Long-term Improvements
- Add more enemy types
- Create new color palettes
- Improve AI algorithms
- Add particle effects
- Optimize for lower-end hardware

## Support

For issues or questions:
1. Check `QUICKSTART.md` for common problems
2. Review `DEVELOPMENT.md` for architecture
3. Check GitHub issues if repository is public
4. Contact project maintainers

---

**Ready to build!** Run `npm install && npm run build` to get started.
