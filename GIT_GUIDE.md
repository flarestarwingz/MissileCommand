# Git Repository Guide

## Initializing Git

If you haven't already initialized git in this project, run:

```bash
git init
git add .
git commit -m "Initial commit: Missile Command Wallpaper Engine"
git branch -M main
```

## GitHub Upload

To push this project to GitHub:

1. Create a new repository on GitHub (without README or .gitignore)

2. Add the remote:
```bash
git remote add origin https://github.com/YOUR_USERNAME/missile-command-wallpaper.git
```

3. Push to GitHub:
```bash
git push -u origin main
```

## Repository Structure for GitHub

The project is organized as follows:

```
missile-command-wallpaper/
├── .github/                      # GitHub workflows (future)
├── src/                          # Source code
│   ├── core/                     # Game engine
│   ├── entities/                 # Game objects
│   ├── rendering/                # Graphics
│   ├── ui/                        # User interface
│   ├── utils/                    # Utilities
│   ├── wallpaperEngine/          # WE integration
│   └── index.ts                  # Entry point
├── assets/                       # Game assets
│   └── gimmicks.json             # Enemy definitions
├── docs/                         # Documentation (if desired)
├── index.html                    # Wallpaper entry point
├── properties.json               # Wallpaper Engine config
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── webpack.config.js             # Build config
├── README.md                     # Main documentation
├── QUICKSTART.md                 # Quick start guide
├── DEVELOPMENT.md                # Developer guide
├── BUILD.md                      # Build instructions
├── FEATURES.md                   # Feature documentation
├── PROJECT_COMPLETE.md           # Project status
├── FILE_REFERENCE.md             # File locations
├── IMPLEMENTATION_VERIFIED.md    # Verification checklist
├── LICENSE                       # BSD 3-Clause
└── .gitignore                    # Git ignores

```

## .gitignore Details

Current `.gitignore` includes:
- `node_modules/` - Dependencies
- `dist/` - Compiled output (regenerable)
- `*.map` - Source maps (development only)
- `.vscode/`, `.idea/` - IDE files
- `.DS_Store`, `Thumbs.db` - OS files
- `.env` - Environment variables
- `coverage/` - Test coverage

## GitHub Workflows (Optional)

To add automated builds to GitHub, create `.github/workflows/build.yml`:

```yaml
name: Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build project
        run: npm run build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: missile-command-build
          path: dist/

```

## Contributing Guidelines (Optional)

Create `CONTRIBUTING.md` for contributors:

```markdown
# Contributing to Missile Command Wallpaper

## How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Commit with clear messages (`git commit -m 'Add feature: ...'`)
5. Push to the branch (`git push origin feature/my-feature`)
6. Open a Pull Request

## Development Setup

```bash
npm install
npm run dev
```

## Code Style

- Use TypeScript
- Follow existing naming conventions
- Add comments for complex logic
- Keep files modular and focused

## Testing

- Test locally with `npm run serve`
- Test in Wallpaper Engine before submitting
- Check for console errors (F12)

## Issues & Suggestions

- Use GitHub Issues for bug reports
- Include reproduction steps for bugs
- Suggest features with clear descriptions
```

## Release Management

### Semantic Versioning

Format: `MAJOR.MINOR.PATCH`

- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes

### Creating a Release

1. Update version in `package.json`
2. Update version in `properties.json`
3. Update `README.md` with release notes
4. Commit changes: `git commit -m "v1.0.0: Release notes"`
5. Create tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
6. Push: `git push && git push --tags`
7. Create GitHub Release from tag

## Branching Strategy

Recommended: GitHub Flow

- `main` - Production-ready code
- `develop` - Development branch
- `feature/xxx` - Feature branches
- `bugfix/xxx` - Bug fix branches

Create a feature branch:
```bash
git checkout -b feature/new-enemy-type
# Make changes
git push -u origin feature/new-enemy-type
# Create Pull Request on GitHub
```

## Code Review Checklist

Before merging to main:
- [ ] Code builds without errors
- [ ] Tests pass (if applicable)
- [ ] No TypeScript errors
- [ ] Follows project style
- [ ] Documentation updated
- [ ] Works in Wallpaper Engine
- [ ] No external dependencies added
- [ ] Performance considerations reviewed

## Common Git Commands

```bash
# View status
git status

# Add changes
git add .
git add src/index.ts

# Commit
git commit -m "Description of changes"

# View history
git log
git log --oneline

# Branches
git branch -a
git checkout -b feature/name
git branch -d feature/name

# Sync with remote
git pull origin main
git push origin main

# Stash changes
git stash
git stash pop

# Undo changes
git reset HEAD file.ts
git checkout file.ts
```

## Collaboration Notes

- Always pull before pushing
- Use descriptive commit messages
- Keep commits focused and atomic
- Update documentation with changes
- Test before pushing
- Review others' code constructively

## License Reminder

This project is licensed under BSD 3-Clause. When contributing:
- Respect the license
- Ensure your contributions can be licensed under BSD 3-Clause
- Include proper copyright notices if adding significant code

## Questions?

Refer to:
- `README.md` for user documentation
- `DEVELOPMENT.md` for architecture
- `QUICKSTART.md` for getting started
- `BUILD.md` for build instructions

---

**Repository Type**: Public (recommended)
**License**: BSD 3-Clause
**Collaboration**: Open to contributions
