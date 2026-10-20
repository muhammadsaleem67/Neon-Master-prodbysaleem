/**
 * Pure game rules, scoring, progression, and math logic
 * Decoupled from Canvas/DOM for deterministic testing.
 */

export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  icon: string; // SVG or symbol identifier
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface PlayerStats {
  maxHp: number;
  hp: number;
  lives: number;
  speed: number;
  fireRate: number; // shots per second
  damage: number;
  dashCooldown: number; // in seconds
  penetration: number;
  critChance: number;
  magnetRadius: number;
  bounces: number;
  siphonChance: number;
}

export const INITIAL_PLAYER_STATS: PlayerStats = {
  maxHp: 100,
  hp: 100,
  lives: 3,
  speed: 280,
  fireRate: 4.5,
  damage: 22,
  dashCooldown: 2.2,
  penetration: 1,
  critChance: 0.08,
  magnetRadius: 90,
  bounces: 0,
  siphonChance: 0,
};

export const ALL_UPGRADES: UpgradeOption[] = [
  {
    id: 'dmg_boost',
    name: 'Plasma Overcharge',
    description: '+25% Weapon Damage',
    icon: 'bolt',
    rarity: 'common',
  },
  {
    id: 'speed_boost',
    name: 'Hyper Thrusters',
    description: '+18% Movement Speed',
    icon: 'wind',
    rarity: 'common',
  },
  {
    id: 'fire_rate',
    name: 'Rapid Cycler',
    description: '+22% Fire Rate',
    icon: 'zap',
    rarity: 'common',
  },
  {
    id: 'dash_cd',
    name: 'Quantum Capacitor',
    description: '-25% Dash Cooldown',
    icon: 'clock',
    rarity: 'rare',
  },
  {
    id: 'max_hp',
    name: 'Titanium Nanite Hull',
    description: '+30 Max HP and instantly heals +30 HP',
    icon: 'shield',
    rarity: 'rare',
  },
  {
    id: 'piercing',
    name: 'High-Energy Penetrator',
    description: 'Projectiles pierce through +1 enemy',
    icon: 'disc',
    rarity: 'epic',
  },
  {
    id: 'crit_boost',
    name: 'Flux Critical Laser',
    description: '+15% Crit Chance for 2.2x damage',
    icon: 'crosshair',
    rarity: 'rare',
  },
  {
    id: 'magnet',
    name: 'Vortex Magnet',
    description: '+60% Pickup & Power-up attraction range',
    icon: 'magnet',
    rarity: 'common',
  },
  {
    id: 'ricochet',
    name: 'Refractive Prism',
    description: 'Projectiles ricochet off arena walls +1 time',
    icon: 'corner',
    rarity: 'epic',
  },
  {
    id: 'siphon',
    name: 'Vampiric Core',
    description: 'Enemies have 6% chance to drop micro-heal on kill',
    icon: 'heart',
    rarity: 'legendary',
  },
];

/**
 * Calculates updated stats when an upgrade is applied
 */
export function applyUpgrade(stats: PlayerStats, upgradeId: string): PlayerStats {
  const next = { ...stats };
  switch (upgradeId) {
    case 'dmg_boost':
      next.damage = Math.round(next.damage * 1.25);
      break;
    case 'speed_boost':
      next.speed = Math.round(next.speed * 1.18);
      break;
    case 'fire_rate':
      next.fireRate = Number((next.fireRate * 1.22).toFixed(2));
      break;
    case 'dash_cd':
      next.dashCooldown = Math.max(0.6, Number((next.dashCooldown * 0.75).toFixed(2)));
      break;
    case 'max_hp':
      next.maxHp += 30;
      next.hp = Math.min(next.maxHp, next.hp + 30);
      break;
    case 'piercing':
      next.penetration += 1;
      break;
    case 'crit_boost':
      next.critChance = Math.min(0.75, Number((next.critChance + 0.15).toFixed(2)));
      break;
    case 'magnet':
      next.magnetRadius = Math.round(next.magnetRadius * 1.6);
      break;
    case 'ricochet':
      next.bounces += 1;
      break;
    case 'siphon':
      next.siphonChance = Math.min(0.25, Number((next.siphonChance + 0.06).toFixed(2)));
      break;
  }
  return next;
}

/**
 * Compute score for killing an enemy given base value and combo multiplier
 */
export function calculateKillScore(baseValue: number, comboMultiplier: number): number {
  const mult = Math.max(1, Math.min(10, Math.floor(comboMultiplier)));
  return baseValue * mult;
}

/**
 * Update combo state: returns [newCombo, newMultiplier, resetTimer]
 */
export function registerEnemyKill(
  currentCombo: number,
  comboWindow: number = 2.5
): { combo: number; multiplier: number; timer: number } {
  const nextCombo = currentCombo + 1;
  // Multiplier grows: 1x (0-2), 2x (3-5), 3x (6-9), 4x (10-14), 5x (15-20), max 10x
  let multiplier = 1;
  if (nextCombo >= 35) multiplier = 10;
  else if (nextCombo >= 28) multiplier = 8;
  else if (nextCombo >= 21) multiplier = 6;
  else if (nextCombo >= 15) multiplier = 5;
  else if (nextCombo >= 10) multiplier = 4;
  else if (nextCombo >= 6) multiplier = 3;
  else if (nextCombo >= 3) multiplier = 2;

  return {
    combo: nextCombo,
    multiplier,
    timer: comboWindow,
  };
}

/**
 * Circle-circle collision detection
 */
export function checkCircleCollision(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distSq = dx * dx + dy * dy;
  const radSum = r1 + r2;
  return distSq <= radSum * radSum;
}

/**
 * Wave difficulty scaling and composition
 */
export interface WaveConfig {
  wave: number;
  isBossWave: boolean;
  totalEnemies: number;
  spawnInterval: number; // seconds between spawns
  types: {
    chaser: number;
    tank: number;
    shooter: number;
  };
  bossConfig?: {
    name: string;
    hp: number;
    speed: number;
  };
}

export function generateWaveConfig(wave: number): WaveConfig {
  const isBossWave = wave % 5 === 0;

  if (isBossWave) {
    const bossLevel = wave / 5;
    return {
      wave,
      isBossWave: true,
      totalEnemies: 8 + bossLevel * 4,
      spawnInterval: 2.2,
      types: {
        chaser: 0.5,
        tank: 0.25,
        shooter: 0.25,
      },
      bossConfig: {
        name: bossLevel === 1 ? 'CYBER GOLIATH' : bossLevel === 2 ? 'VORTEX OVERLORD' : `NEXUS TITAN MK-${bossLevel}`,
        hp: 1200 + (bossLevel - 1) * 800,
        speed: 85 + Math.min(50, bossLevel * 10),
      },
    };
  }

  // Regular wave
  const baseCount = 12 + wave * 5;
  const chaserRatio = Math.max(0.35, 0.7 - wave * 0.05);
  const tankRatio = wave >= 2 ? Math.min(0.3, 0.1 + (wave - 2) * 0.04) : 0;
  const shooterRatio = wave >= 3 ? Math.min(0.35, 0.15 + (wave - 3) * 0.05) : 0;
  const total = chaserRatio + tankRatio + shooterRatio;

  return {
    wave,
    isBossWave: false,
    totalEnemies: baseCount,
    spawnInterval: Math.max(0.4, 1.4 - wave * 0.08),
    types: {
      chaser: chaserRatio / total,
      tank: tankRatio / total,
      shooter: shooterRatio / total,
    },
  };
}

/**
 * Calculate damage inflicted on player taking shield and lives into account
 */
export function applyPlayerDamage(
  currentHp: number,
  currentLives: number,
  damage: number,
  hasShield: boolean
): { hp: number; lives: number; absorbedByShield: boolean; isDead: boolean } {
  if (hasShield) {
    return {
      hp: currentHp,
      lives: currentLives,
      absorbedByShield: true,
      isDead: false,
    };
  }

  let hp = currentHp - damage;
  let lives = currentLives;

  if (hp <= 0) {
    lives -= 1;
    if (lives > 0) {
      hp = 100; // Reset HP for next life
    } else {
      hp = 0;
    }
  }

  return {
    hp,
    lives,
    absorbedByShield: false,
    isDead: lives <= 0,
  };
}

/**
 * Draw 3 unique random upgrades from available pool
 */
export function getRandomUpgrades(count = 3): UpgradeOption[] {
  const shuffled = [...ALL_UPGRADES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
