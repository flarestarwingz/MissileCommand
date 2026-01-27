/**
 * Color palette system for different themes
 */

export interface ColorPalette {
  name: string;
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  enemy: string;
  projectile: string;
  city: string;
  healthGood: string;
  healthBad: string;
  ui: string;
  uiText: string;
  grid?: string;
}

const PALETTES: Record<string, ColorPalette> = {
  classic: {
    name: 'Classic Arcade',
    background: '#000000',
    primary: '#00FF00',
    secondary: '#00AA00',
    accent: '#00FFFF',
    enemy: '#FF0000',
    projectile: '#00FF00',
    city: '#00FF00',
    healthGood: '#00FF00',
    healthBad: '#FF0000',
    ui: '#00FF00',
    uiText: '#00FF00',
    grid: '#003300',
  },
  monochrome: {
    name: 'Monochrome (OLED-safe)',
    background: '#000000',
    primary: '#FFFFFF',
    secondary: '#CCCCCC',
    accent: '#999999',
    enemy: '#FFFFFF',
    projectile: '#FFFFFF',
    city: '#CCCCCC',
    healthGood: '#FFFFFF',
    healthBad: '#666666',
    ui: '#CCCCCC',
    uiText: '#FFFFFF',
    grid: '#1a1a1a',
  },
  retro: {
    name: 'Retro',
    background: '#0a0a0a',
    primary: '#FF00FF',
    secondary: '#FF0080',
    accent: '#00FFFF',
    enemy: '#FFFF00',
    projectile: '#FF00FF',
    city: '#00FF80',
    healthGood: '#00FF80',
    healthBad: '#FF0080',
    ui: '#FF00FF',
    uiText: '#00FFFF',
    grid: '#1a001a',
  },
  red80s: {
    name: 'Red 80s Wireframe',
    background: '#000000',
    primary: '#FF0000',
    secondary: '#BB0000',
    accent: '#FF4400',
    enemy: '#FF0000',
    projectile: '#FF0000',
    city: '#FF4400',
    healthGood: '#FF0000',
    healthBad: '#880000',
    ui: '#FF0000',
    uiText: '#FF4400',
    grid: '#330000',
  },
};

export class PaletteManager {
  private currentPalette: ColorPalette;
  private listeners: Set<(palette: ColorPalette) => void> = new Set();

  constructor(paletteName: string = 'classic') {
    this.currentPalette = PALETTES[paletteName] || PALETTES.classic;
  }

  /**
   * Get current palette
   */
  getPalette(): ColorPalette {
    return this.currentPalette;
  }

  /**
   * Set palette by name
   */
  setPalette(name: string): boolean {
    const palette = PALETTES[name];
    if (!palette) return false;
    
    this.currentPalette = palette;
    this.notifyListeners();
    return true;
  }

  /**
   * Get all available palette names
   */
  getAvailablePalettes(): string[] {
    return Object.keys(PALETTES);
  }

  /**
   * Get palette by name
   */
  getPaletteByName(name: string): ColorPalette | null {
    return PALETTES[name] || null;
  }

  /**
   * Subscribe to palette changes
   */
  onChange(callback: (palette: ColorPalette) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentPalette));
  }
}
