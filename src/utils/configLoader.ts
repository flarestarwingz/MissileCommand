/**
 * Config loader for gimmicks and other JSON configurations
 */

export interface GimmickConfig {
  id: string;
  name: string;
  health: number;
  speed: number;
  size: number;
  rarity: number;
  aiAwareness: string;
  behavior: string;
  [key: string]: any;
}

export interface GimmicksData {
  eras: {
    [eraName: string]: GimmickConfig[];
  };
}

let gimmicksCache: GimmicksData | null = null;

/**
 * Load gimmicks configuration - uses embedded config to avoid CORS issues
 * (Embedded config works with file:// protocol and is fully offline-capable)
 */
export async function loadGimmicksConfig(): Promise<GimmicksData> {
  if (gimmicksCache) {
    return gimmicksCache;
  }

  try {
    // First try to fetch from assets (works with HTTP/HTTPS servers)
    const response = await fetch('./assets/gimmicks.json');
    if (response.ok) {
      gimmicksCache = await response.json();
      return gimmicksCache || getEmbeddedGimmicksConfig();
    }
  } catch (error) {
    // Fetch failed (likely file:// protocol or network issue)
    console.log('Could not fetch gimmicks.json, using embedded config');
  }

  // Use embedded config (works everywhere)
  return getEmbeddedGimmicksConfig();
}

/**
 * Get embedded gimmicks config (works everywhere - file://, HTTP, offline)
 */
export function getEmbeddedGimmicksConfig(): GimmicksData {
  return {
    eras: {
      meteors: [
        {
          id: 'small_meteor',
          name: 'Small Meteor',
          health: 30,
          speed: 2.0,
          size: 8,
          rarity: 0.6,
          aiAwareness: 'low',
          behavior: 'falling',
        },
        {
          id: 'medium_meteor',
          name: 'Medium Meteor',
          health: 75,
          speed: 1.5,
          size: 15,
          rarity: 0.3,
          aiAwareness: 'low',
          behavior: 'falling',
        },
        {
          id: 'large_meteor',
          name: 'Large Meteor',
          health: 150,
          speed: 1.0,
          size: 25,
          rarity: 0.1,
          aiAwareness: 'threat',
          behavior: 'falling',
        },
      ],
      eighties_missiles: [
        {
          id: 'classic_missile',
          name: 'Soviet Missile',
          health: 50,
          speed: 3.5,
          size: 12,
          rarity: 0.7,
          aiAwareness: 'medium',
          behavior: 'ballistic',
        },
        {
          id: 'fast_missile',
          name: 'Cruise Missile',
          health: 40,
          speed: 5.0,
          size: 10,
          rarity: 0.3,
          aiAwareness: 'medium',
          behavior: 'fast',
        },
        {
          id: 'bomber',
          name: 'B-52 Bomber',
          health: 300,
          speed: 1.5,
          size: 40,
          rarity: 0.05,
          aiAwareness: 'high',
          behavior: 'bombing',
          specialAbility: 'drops_nuke',
          weaponType: 'nuke',
          nukeHealth: 400,
          nukeSize: 60,
          chaff_effect: true,
          chaff_amount: 8,
        },
        {
          id: 'turret',
          name: 'Enemy Turret',
          health: 200,
          speed: 0.0,
          size: 30,
          rarity: 0.08,
          aiAwareness: 'high',
          behavior: 'stationary',
          specialAbility: 'fires_missiles',
          fire_rate: 1.5,
        },
      ],
      nineties_asteroids: [
        {
          id: 'asteroid_s',
          name: 'Small Asteroid',
          health: 40,
          speed: 2.5,
          size: 10,
          rarity: 0.5,
          aiAwareness: 'low',
          behavior: 'tumbling',
        },
        {
          id: 'asteroid_m',
          name: 'Medium Asteroid',
          health: 100,
          speed: 2.0,
          size: 18,
          rarity: 0.3,
          aiAwareness: 'medium',
          behavior: 'tumbling',
          splits_on_destroy: 2,
        },
        {
          id: 'asteroid_l',
          name: 'Large Asteroid',
          health: 250,
          speed: 1.2,
          size: 35,
          rarity: 0.08,
          aiAwareness: 'high',
          behavior: 'tumbling',
          splits_on_destroy: 3,
        },
        {
          id: 'comet',
          name: 'Comet',
          health: 180,
          speed: 4.0,
          size: 28,
          rarity: 0.06,
          aiAwareness: 'medium',
          behavior: 'fast_falling',
          trail: true,
        },
      ],
      two_thousands: [
        {
          id: 'drone',
          name: 'Combat Drone',
          health: 60,
          speed: 4.5,
          size: 14,
          rarity: 0.4,
          aiAwareness: 'high',
          behavior: 'intelligent_dodging',
          maneuverability: 3,
        },
        {
          id: 'drone_swarm',
          name: 'Drone Swarm',
          health: 120,
          speed: 3.5,
          size: 50,
          rarity: 0.1,
          aiAwareness: 'high',
          behavior: 'coordinated_attack',
          swarm_size: 6,
          spawns_drones: true,
        },
        {
          id: 'hacker_virus',
          name: 'Hacker Virus',
          health: 150,
          speed: 3.0,
          size: 20,
          rarity: 0.08,
          aiAwareness: 'high',
          behavior: 'erratic',
          specialAbility: 'disables_towers',
          disable_duration: 3,
        },
      ],
      future: [
        {
          id: 'alien_fighter',
          name: 'Alien Fighter',
          health: 80,
          speed: 5.0,
          size: 16,
          rarity: 0.35,
          aiAwareness: 'high',
          behavior: 'intelligent_evasion',
          maneuverability: 5,
        },
        {
          id: 'mothership',
          name: 'Alien Mothership',
          health: 500,
          speed: 1.0,
          size: 80,
          rarity: 0.03,
          aiAwareness: 'critical',
          behavior: 'slow_advance',
          specialAbility: 'spawns_fighters',
          spawn_rate: 0.8,
          spawn_count: 4,
        },
        {
          id: 'plasma_bolt',
          name: 'Plasma Bolt',
          health: 200,
          speed: 3.5,
          size: 24,
          rarity: 0.08,
          aiAwareness: 'high',
          behavior: 'homing',
          tracking: true,
        },
        {
          id: 'dimension_rift',
          name: 'Dimension Rift',
          health: 300,
          speed: 0.5,
          size: 70,
          rarity: 0.02,
          aiAwareness: 'critical',
          behavior: 'expanding',
          specialAbility: 'expands_damage_zone',
          expansion_rate: 1.2,
        },
      ],
    },
  };
}

/**
 * Get default gimmicks config (fallback - same as embedded)
 */
export function getDefaultGimmicksConfig(): GimmicksData {
  return getEmbeddedGimmicksConfig();
}

/**
 * Get gimmicks for a specific era
 */
export async function getGimmicksForEra(eraName: string): Promise<GimmickConfig[]> {
  const config = await loadGimmicksConfig();
  return config.eras[eraName] || [];
}

/**
 * Get all available eras
 */
export async function getAvailableEras(): Promise<string[]> {
  const config = await loadGimmicksConfig();
  return Object.keys(config.eras);
}

/**
 * Get a random gimmick from an era based on rarity
 */
export async function getRandomGimmickFromEra(eraName: string): Promise<GimmickConfig | null> {
  const gimmicks = await getGimmicksForEra(eraName);
  if (gimmicks.length === 0) return null;

  // Weight selection by rarity (higher rarity = higher chance)
  const totalRarity = gimmicks.reduce((sum, g) => sum + g.rarity, 0);
  let random = Math.random() * totalRarity;

  for (const gimmick of gimmicks) {
    random -= gimmick.rarity;
    if (random <= 0) {
      return gimmick;
    }
  }

  return gimmicks[0];
}
