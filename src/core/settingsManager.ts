/**
 * Settings management for the game
 * Handles both Wallpaper Engine properties and in-game settings
 */

export interface Settings {
  // Gameplay
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
  gameSpeed: number;
  cityRepairRate: number;
  cityCount: number; // Number of cities (2-8)
  aiAccuracy: number; // 0-1, AI shooting accuracy (0=50% accuracy, 1=100% accuracy)
  
  // Display
  colorPalette: 'classic' | 'monochrome' | 'retro' | 'red80s';
  
  // UI Visibility
  showScore: boolean;
  showWaveInfo: boolean;
  showAICount: boolean;
  showHealth: boolean;
  showCoordinates: boolean;
  showFPS: boolean;
  
  // Debug
  debugMode: boolean;
  showDebugInfo: boolean;
  aiCoordinationOverride?: number;
  repairRateMultiplier: number;
}

export const DEFAULT_SETTINGS: Settings = {
  difficulty: 'normal',
  gameSpeed: 1.0,
  cityRepairRate: 0.1,
  cityCount: 4, // Default to 4 cities
  aiAccuracy: 0.7, // Default to 70% accuracy (normal skill)
  
  colorPalette: 'classic',
  
  showScore: true,
  showWaveInfo: true,
  showAICount: true,
  showHealth: true,
  showCoordinates: false,
  showFPS: false,
  
  debugMode: false,
  showDebugInfo: false,
  repairRateMultiplier: 1.0,
};

export class SettingsManager {
  private settings: Settings = { ...DEFAULT_SETTINGS };
  private listeners: Set<(settings: Settings) => void> = new Set();

  constructor(initialSettings?: Partial<Settings>) {
    if (initialSettings) {
      this.settings = { ...this.settings, ...initialSettings };
    }
  }

  /**
   * Get current settings
   */
  getSettings(): Settings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(updates: Partial<Settings>): void {
    this.settings = { ...this.settings, ...updates };
    this.notifyListeners();
  }

  /**
   * Get a specific setting value
   */
  getSetting<K extends keyof Settings>(key: K): Settings[K] {
    return this.settings[key];
  }

  /**
   * Set a specific setting value
   */
  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.settings[key] = value;
    this.notifyListeners();
  }

  /**
   * Subscribe to settings changes
   */
  onChange(callback: (settings: Settings) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.settings));
  }

  /**
   * Get difficulty multiplier for game balance
   */
  getDifficultyMultiplier(): number {
    switch (this.settings.difficulty) {
      case 'easy':
        return 0.7;
      case 'normal':
        return 1.0;
      case 'hard':
        return 1.3;
      case 'extreme':
        return 1.6;
      default:
        return 1.0;
    }
  }

  /**
   * Reset to default settings
   */
  reset(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.notifyListeners();
  }
}
