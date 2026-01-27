/**
 * Wallpaper Engine integration
 */

import { Settings } from '../core/settingsManager';

declare global {
  interface Window {
    wallpaperPropertyListener?: {
      applyUserProperties: (props: Record<string, any>) => void;
    };
  }
}

/**
 * Wallpaper Engine properties schema
 */
export function getWallpaperProperties(): Record<string, any> {
  return {
    'general_aicount': {
      order: 0,
      text: 'ui_section_general',
      type: 'category',
    },
    'aicount': {
      order: 1,
      text: 'AI Count',
      type: 'slider',
      min: 1,
      max: 8,
      step: 1,
      value: 1,
    },
    'difficulty': {
      order: 2,
      text: 'Difficulty',
      type: 'combo',
      options: {
        'easy': 'Easy',
        'normal': 'Normal',
        'hard': 'Hard',
        'extreme': 'Extreme',
      },
      value: 'normal',
    },
    'aiaccuracy': {
      order: 3,
      text: 'AI Accuracy',
      type: 'slider',
      min: 0,
      max: 1,
      step: 0.05,
      value: 0.7,
    },
    'gamespeed': {
      order: 4,
      text: 'Game Speed',
      type: 'slider',
      min: 0.5,
      max: 4,
      step: 0.1,
      value: 1.0,
    },
    'cityrepairrate': {
      order: 5,
      text: 'City Repair Rate',
      type: 'slider',
      min: 0.1,
      max: 10,
      step: 0.1,
      value: 1.0,
    },

    'ui_appearance': {
      order: 10,
      text: 'ui_section_appearance',
      type: 'category',
    },
    'colorpalette': {
      order: 11,
      text: 'Color Palette',
      type: 'combo',
      options: {
        'classic': 'Classic Arcade',
        'monochrome': 'Monochrome (OLED)',
        'retro': 'Retro',
        'red80s': 'Red 80s Wireframe',
      },
      value: 'classic',
    },

    'ui_visibility': {
      order: 20,
      text: 'ui_section_visibility',
      type: 'category',
    },
    'showscore': {
      order: 21,
      text: 'Show Score',
      type: 'bool',
      value: true,
    },
    'showwaveinfo': {
      order: 22,
      text: 'Show Wave Info',
      type: 'bool',
      value: true,
    },
    'showaicount': {
      order: 23,
      text: 'Show AI Count',
      type: 'bool',
      value: true,
    },
    'showhealth': {
      order: 24,
      text: 'Show Health',
      type: 'bool',
      value: true,
    },
    'showcoordinates': {
      order: 25,
      text: 'Show Coordinates',
      type: 'bool',
      value: false,
    },
    'showfps': {
      order: 26,
      text: 'Show FPS',
      type: 'bool',
      value: false,
    },

    'debug_section': {
      order: 30,
      text: 'Debug',
      type: 'category',
    },
    'debugmode': {
      order: 31,
      text: 'Enable Debug Mode',
      type: 'bool',
      value: false,
    },
    'showdebuginfo': {
      order: 32,
      text: 'Show Debug Info',
      type: 'bool',
      value: false,
    },
    'repairatemultiplier': {
      order: 33,
      text: 'Repair Rate Multiplier',
      type: 'slider',
      min: 0.1,
      max: 10,
      step: 0.1,
      value: 1.0,
    },
  };
}

/**
 * Convert Wallpaper Engine properties to Settings
 */
export function wallpaperPropsToSettings(props: Record<string, any>): Partial<Settings> {
  return {
    difficulty: props.difficulty || 'normal',
    gameSpeed: props.gamespeed || 1.0,
    cityRepairRate: props.cityrepairrate || 1.0,
    cityCount: props.citycount || 4,
    aiAccuracy: props.aiaccuracy !== undefined ? props.aiaccuracy : 0.7,
    colorPalette: props.colorpalette || 'classic',
    showScore: props.showscore !== false,
    showWaveInfo: props.showwaveinfo !== false,
    showAICount: props.showaicount !== false,
    showHealth: props.showhealth !== false,
    showCoordinates: props.showcoordinates !== false,
    showFPS: props.showfps !== false,
    debugMode: props.debugmode === true,
    showDebugInfo: props.showdebuginfo === true,
    repairRateMultiplier: props.repairatemultiplier || 1.0,
  };
}

/**
 * Setup Wallpaper Engine integration
 */
export function setupWallpaperEngine(
  onPropertiesChanged: (settings: Partial<Settings>) => void
): void {
  // Check if we're running in Wallpaper Engine
  if (window.wallpaperPropertyListener) {
    window.wallpaperPropertyListener.applyUserProperties = (props: Record<string, any>) => {
      const settings = wallpaperPropsToSettings(props);
      onPropertiesChanged(settings);
    };
  }
}
