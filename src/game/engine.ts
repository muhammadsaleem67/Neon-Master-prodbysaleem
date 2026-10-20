/**
 * Neon Master 2D Canvas Engine
 */

import {
  PlayerStats,
  INITIAL_PLAYER_STATS,
  UpgradeOption,
  applyUpgrade,
  registerEnemyKill,
  calculateKillScore,
  checkCircleCollision,
  generateWaveConfig,
  applyPlayerDamage,
  getRandomUpgrades,
} from './logic.ts';
import { sounds } from './audio.ts';

export type GameScreen = 'title' | 'playing' | 'upgrade' | 'paused' | 'gameover';

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  vy: number;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'spark' | 'ring';
}

export interface PowerUpItem {
  id: string;
  type: 'shield' | 'rapid' | 'triple' | 'health' | 'slowmo';
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  pulse: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isCrit: boolean;
  isEnemy: boolean;
  life: number;
  maxLife: number;
  penetration: number;
  bounces: number;
  color: string;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: 'chaser' | 'tank' | 'shooter' | 'boss' | 'shrapnel';
  hp: number;
  maxHp: number;
  speed: number;
  color: string;
  hitFlash: number;
  shootTimer?: number;
  telegraphTimer?: number;
  bossPhase?: number;
  bossAttackTimer?: number;
  name?: string;
}

export class NeonGame {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public screen: GameScreen = 'title';

  // State
  public stats: PlayerStats = { ...INITIAL_PLAYER_STATS };
  public score: number = 0;
  public highScore: number = 0;
  public wave: number = 1;
  public enemiesDefeated: number = 0;
  public runTime: number = 0;

  // Player Entity
  public player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    radius: 18,
    dashTimer: 0, // cooldown
    isDashing: false,
    dashDuration: 0,
    dashTrail: [] as { x: number; y: number; angle: number; alpha: number }[],
    autoFire: true,
    lastShotTime: 0,
    hasShield: false,
    powerups: {
      rapid: 0,
      triple: 0,
      slowmo: 0,
    },
  };

  // Upgrades
  public offeredUpgrades: UpgradeOption[] = [];

  // Combo system
  public combo: number = 0;
  public comboMultiplier: number = 1;
  public comboTimer: number = 0;

  // Wave Manager
  public waveConfig = generateWaveConfig(1);
  public waveEnemiesSpawned: number = 0;
  public waveEnemiesTotal: number = 0;
  public spawnTimer: number = 0;
  public waveAnnounceTimer: number = 0;
  public waveAnnounceText: string = '';

  // Entities
  public enemies: Enemy[] = [];
  public bullets: Bullet[] = [];
  public powerups: PowerUpItem[] = [];
  public floatingTexts: FloatingText[] = [];

  // Particle Pool (Preallocated 350 particles to avoid GC)
  private particlePool: Particle[] = [];
  private poolCapacity = 350;

  // Background Starfield & Grid
  private stars: { x: number; y: number; size: number; speed: number; alpha: number; hue: number }[] = [];
  private gridOffset = { x: 0, y: 0 };

  // Juice & Game Feel
  private screenShake = 0;
  private hitstopTimer = 0;

  // Inputs
  public keys: { [key: string]: boolean } = {};
  public mouse = { x: 0, y: 0, isDown: false };
  public touchJoystick = {
    active: false,
    startX: 0,
    startY: 0,
    currX: 0,
    currY: 0,
    dx: 0,
    dy: 0,
  };
  public isMobile = false;

  // Loop control
  private lastTime = 0;
  private animFrameId: number | null = null;
  private onStateChangeCallback?: (state: GameScreen) => void;

  constructor(canvas: HTMLCanvasElement, onStateChange?: (state: GameScreen) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStateChangeCallback = onStateChange;

    const savedHigh = localStorage.getItem('neon_master_highscore');
    this.highScore = savedHigh ? parseInt(savedHigh, 10) : 0;

    this.initParticlePool();
    this.initStarfield();
    this.resizeCanvas();

    this.player.x = this.canvas.width / 2;
    this.player.y = this.canvas.height / 2;

    this.setupListeners();
  }

  private initParticlePool() {
    this.particlePool = [];
    for (let i = 0; i < this.poolCapacity; i++) {
      this.particlePool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        color: '#00f3ff',
        size: 3,
        life: 0,
        maxLife: 1,
        shape: 'circle',
      });
    }
  }

  private initStarfield() {
    this.stars = [];
    const count = 120;
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2.2 + 0.5,
        speed: Math.random() * 0.4 + 0.15,
        alpha: Math.random() * 0.6 + 0.3,
        hue: Math.random() > 0.6 ? 280 : 190,
      });
    }
  }

  public setScreen(newScreen: GameScreen) {
    this.screen = newScreen;
    document.body.dataset.state = newScreen;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(newScreen);
    }
  }

  public resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
    this.isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
  }

  private setupListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());

    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      // Space or Enter on Title starts game
      if (this.screen === 'title' && (e.code === 'Space' || e.code === 'Enter')) {
        this.startGame();
        return;
      }

      // Space dashes in game
      if (this.screen === 'playing' && e.code === 'Space') {
        this.triggerDash();
        e.preventDefault();
      }

      // Pause toggle
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (this.screen === 'playing') {
          this.setScreen('paused');
        } else if (this.screen === 'paused') {
          this.setScreen('playing');
        }
      }

      // Mute toggle
      if (e.key === 'm' || e.key === 'M') {
        sounds.toggleMute();
      }

      // Upgrade selection keys 1, 2, 3
      if (this.screen === 'upgrade') {
        if (e.key === '1' && this.offeredUpgrades[0]) this.chooseUpgrade(0);
        if (e.key === '2' && this.offeredUpgrades[1]) this.chooseUpgrade(1);
        if (e.key === '3' && this.offeredUpgrades[2]) this.chooseUpgrade(2);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.mouse.isDown = false;
    });

    const updateMousePos = (clientX: number, clientY: number) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = clientX - rect.left;
      this.mouse.y = clientY - rect.top;
    };

    window.addEventListener('mousemove', (e) => {
      updateMousePos(e.clientX, e.clientY);
    });

    window.addEventListener('mousedown', (e) => {
      updateMousePos(e.clientX, e.clientY);
      this.mouse.isDown = true;
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });

    // Touch support for mobile
    window.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = this.canvas.getBoundingClientRect();
      const tx = touch.clientX - rect.left;
      const ty = touch.clientY - rect.top;

      // If left half of screen, joystick
      if (tx < window.innerWidth * 0.5) {
        this.touchJoystick.active = true;
        this.touchJoystick.startX = tx;
        this.touchJoystick.startY = ty;
        this.touchJoystick.currX = tx;
        this.touchJoystick.currY = ty;
        this.touchJoystick.dx = 0;
        this.touchJoystick.dy = 0;
      } else {
        // Right half controls aim & fire
        this.mouse.x = tx;
        this.mouse.y = ty;
        this.mouse.isDown = true;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        const tx = t.clientX - rect.left;
        const ty = t.clientY - rect.top;

        if (this.touchJoystick.active && tx < window.innerWidth * 0.6) {
          this.touchJoystick.currX = tx;
          this.touchJoystick.currY = ty;
          const maxDist = 55;
          const rawDx = tx - this.touchJoystick.startX;
          const rawDy = ty - this.touchJoystick.startY;
          const dist = Math.hypot(rawDx, rawDy);
          if (dist > 0) {
            const clamped = Math.min(dist, maxDist);
            this.touchJoystick.dx = (rawDx / dist) * (clamped / maxDist);
            this.touchJoystick.dy = (rawDy / dist) * (clamped / maxDist);
          }
        } else {
          this.mouse.x = tx;
          this.mouse.y = ty;
        }
      }
    }, { passive: true });

    const endTouch = () => {
      this.touchJoystick.active = false;
      this.touchJoystick.dx = 0;
      this.touchJoystick.dy = 0;
      this.mouse.isDown = false;
    };

    window.addEventListener('touchend', endTouch);
    window.addEventListener('touchcancel', endTouch);
  }

  public startGame() {
    this.stats = { ...INITIAL_PLAYER_STATS };
    this.score = 0;
    this.wave = 1;
    this.enemiesDefeated = 0;
    this.runTime = 0;
    this.combo = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;

    this.player.x = window.innerWidth / 2;
    this.player.y = window.innerHeight / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.dashTimer = 0;
    this.player.isDashing = false;
    this.player.hasShield = false;
    this.player.powerups = { rapid: 0, triple: 0, slowmo: 0 };
    this.player.dashTrail = [];

    this.enemies = [];
    this.bullets = [];
    this.powerups = [];
    this.floatingTexts = [];

    this.startWave(1);
    this.setScreen('playing');
  }

  public startWave(waveNum: number) {
    this.wave = waveNum;
    this.waveConfig = generateWaveConfig(waveNum);
    this.waveEnemiesSpawned = 0;
    this.waveEnemiesTotal = this.waveConfig.totalEnemies;
    this.spawnTimer = 0.5;

    this.waveAnnounceText = this.waveConfig.isBossWave
      ? `WARNING: ${this.waveConfig.bossConfig?.name || 'BOSS'} DETECTED`
      : `WAVE ${waveNum}`;
    this.waveAnnounceTimer = 2.4;

    if (this.waveConfig.isBossWave) {
      sounds.playBossAlarm();
      this.addScreenShake(12);
      this.spawnBoss();
    }
  }

  private spawnBoss() {
    if (!this.waveConfig.bossConfig) return;
    const b = this.waveConfig.bossConfig;
    this.enemies.push({
      id: Math.random(),
      x: window.innerWidth / 2,
      y: -80,
      vx: 0,
      vy: 1,
      radius: 46,
      type: 'boss',
      hp: b.hp,
      maxHp: b.hp,
      speed: b.speed,
      color: '#ff0055',
      hitFlash: 0,
      bossPhase: 1,
      bossAttackTimer: 1.5,
      name: b.name,
    });
  }

  private triggerDash() {
    if (this.player.dashTimer > 0 || this.screen !== 'playing') return;

    this.player.isDashing = true;
    this.player.dashDuration = 0.28; // invincible iframe duration
    this.player.dashTimer = this.stats.dashCooldown;

    // Direction of movement or facing
    let dirX = 0;
    let dirY = 0;
    if (this.keys['w'] || this.keys['arrowup']) dirY -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dirY += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dirX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dirX += 1;

    if (this.touchJoystick.active) {
      dirX = this.touchJoystick.dx;
      dirY = this.touchJoystick.dy;
    }

    if (dirX === 0 && dirY === 0) {
      dirX = Math.cos(this.player.angle);
      dirY = Math.sin(this.player.angle);
    } else {
      const len = Math.hypot(dirX, dirY);
      dirX /= len;
      dirY /= len;
    }

    const dashImpulse = 680;
    this.player.vx = dirX * dashImpulse;
    this.player.vy = dirY * dashImpulse;

    sounds.playDash();
    this.addScreenShake(6);
    this.spawnParticleBurst(this.player.x, this.player.y, '#00f3ff', 18);
  }

  public triggerAutoFireToggle() {
    this.player.autoFire = !this.player.autoFire;
    this.spawnFloatingText(
      this.player.x,
      this.player.y - 30,
      this.player.autoFire ? 'AUTO-FIRE: ON' : 'AUTO-FIRE: OFF',
      '#ffe600'
    );
  }

  private shoot() {
    const now = performance.now();
    const effectiveFireRate = this.player.powerups.rapid > 0 ? this.stats.fireRate * 2.4 : this.stats.fireRate;
    const interval = 1000 / effectiveFireRate;

    if (now - this.player.lastShotTime < interval) return;
    this.player.lastShotTime = now;

    sounds.playShoot(this.player.powerups.rapid > 0);

    const isCrit = Math.random() < this.stats.critChance;
    const baseDamage = isCrit ? Math.round(this.stats.damage * 2.2) : this.stats.damage;
    const bulletSpeed = 750;

    // Angle towards mouse or facing direction
    const angle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);

    const createBullet = (bulletAngle: number) => {
      this.bullets.push({
        x: this.player.x + Math.cos(bulletAngle) * 22,
        y: this.player.y + Math.sin(bulletAngle) * 22,
        vx: Math.cos(bulletAngle) * bulletSpeed,
        vy: Math.sin(bulletAngle) * bulletSpeed,
        radius: isCrit ? 6 : 4.5,
        damage: baseDamage,
        isCrit,
        isEnemy: false,
        life: 0,
        maxLife: 1.6,
        penetration: this.stats.penetration,
        bounces: this.stats.bounces,
        color: isCrit ? '#ffe600' : '#00f3ff',
      });
    };

    if (this.player.powerups.triple > 0) {
      createBullet(angle - 0.22);
      createBullet(angle);
      createBullet(angle + 0.22);
    } else {
      createBullet(angle);
    }

    // Gun recoil
    this.player.vx -= Math.cos(angle) * 35;
    this.player.vy -= Math.sin(angle) * 35;
  }

  private enemyShoot(e: Enemy, targetX: number, targetY: number, speed = 260) {
    const angle = Math.atan2(targetY - e.y, targetX - e.x);
    this.bullets.push({
      x: e.x + Math.cos(angle) * (e.radius + 4),
      y: e.y + Math.sin(angle) * (e.radius + 4),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 5,
      damage: 18,
      isCrit: false,
      isEnemy: true,
      life: 0,
      maxLife: 4.5,
      penetration: 1,
      bounces: 0,
      color: '#bd00ff',
    });
    sounds.playEnemyShoot();
  }

  private spawnEnemy() {
    const types: ('chaser' | 'tank' | 'shooter')[] = [];
    const r = Math.random();
    let current = 0;
    const t = this.waveConfig.types;

    if (r <= (current += t.chaser)) types.push('chaser');
    else if (r <= (current += t.tank)) types.push('tank');
    else types.push('shooter');

    const type = types[0] || 'chaser';

    // Spawn just outside the viewport edge
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    const margin = 40;
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (side === 0) { x = Math.random() * w; y = -margin; }
    else if (side === 1) { x = w + margin; y = Math.random() * h; }
    else if (side === 2) { x = Math.random() * w; y = h + margin; }
    else { x = -margin; y = Math.random() * h; }

    const speedScale = 1 + this.wave * 0.04;
    const hpScale = 1 + this.wave * 0.08;

    if (type === 'chaser') {
      this.enemies.push({
        id: Math.random(),
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 14,
        type: 'chaser',
        hp: Math.round(30 * hpScale),
        maxHp: Math.round(30 * hpScale),
        speed: (200 + Math.random() * 30) * speedScale,
        color: '#ff0055',
        hitFlash: 0,
      });
    } else if (type === 'tank') {
      this.enemies.push({
        id: Math.random(),
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 26,
        type: 'tank',
        hp: Math.round(130 * hpScale),
        maxHp: Math.round(130 * hpScale),
        speed: 105 * speedScale,
        color: '#ffaa00',
        hitFlash: 0,
      });
    } else {
      // shooter
      this.enemies.push({
        id: Math.random(),
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 17,
        type: 'shooter',
        hp: Math.round(65 * hpScale),
        maxHp: Math.round(65 * hpScale),
        speed: 140 * speedScale,
        color: '#bd00ff',
        hitFlash: 0,
        shootTimer: 1.8 + Math.random() * 1.5,
        telegraphTimer: 0,
      });
    }

    this.waveEnemiesSpawned++;
  }

  public spawnParticleBurst(x: number, y: number, color: string, count = 12) {
    let spawned = 0;
    for (let i = 0; i < this.poolCapacity && spawned < count; i++) {
      const p = this.particlePool[i];
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 260 + 40;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.color = color;
        p.size = Math.random() * 4 + 2;
        p.life = 0;
        p.maxLife = Math.random() * 0.4 + 0.25;
        p.shape = Math.random() > 0.4 ? 'spark' : 'circle';
        spawned++;
      }
    }
  }

  public spawnFloatingText(x: number, y: number, text: string, color = '#ffe600', size = 18) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      size,
      life: 0,
      maxLife: 1.1,
      vy: -45,
    });
  }

  public addScreenShake(amount: number) {
    this.screenShake = Math.min(22, this.screenShake + amount);
  }

  private maybeDropPowerUp(x: number, y: number) {
    // 12% chance for a powerup
    if (Math.random() < 0.12) {
      const types: ('shield' | 'rapid' | 'triple' | 'health' | 'slowmo')[] = [
        'shield',
        'rapid',
        'triple',
        'health',
        'slowmo',
      ];
      const selected = types[Math.floor(Math.random() * types.length)];
      this.powerups.push({
        id: Math.random().toString(),
        type: selected,
        x,
        y,
        radius: 16,
        life: 0,
        maxLife: 15, // lasts 15s before disappearing
        pulse: 0,
      });
    }
  }

  private killEnemy(enemy: Enemy, enemyIdx: number) {
    this.enemiesDefeated++;
    this.enemies.splice(enemyIdx, 1);

    // Score & Combo
    const comboRes = registerEnemyKill(this.combo);
    this.combo = comboRes.combo;
    this.comboMultiplier = comboRes.multiplier;
    this.comboTimer = comboRes.timer;

    let baseScore = 100;
    if (enemy.type === 'tank') baseScore = 250;
    if (enemy.type === 'shooter') baseScore = 180;
    if (enemy.type === 'boss') baseScore = 3000;

    const earned = calculateKillScore(baseScore, this.comboMultiplier);
    this.score += earned;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('neon_master_highscore', String(this.highScore));
    }

    // Audio & Visual juice
    sounds.playExplosion(enemy.type === 'boss' || enemy.type === 'tank');
    this.addScreenShake(enemy.type === 'boss' ? 18 : enemy.type === 'tank' ? 10 : 5);
    this.hitstopTimer = enemy.type === 'boss' ? 0.08 : 0.035;

    this.spawnParticleBurst(enemy.x, enemy.y, enemy.color, enemy.type === 'boss' ? 36 : 16);
    this.spawnFloatingText(
      enemy.x,
      enemy.y,
      `+${earned}${this.comboMultiplier > 1 ? ` x${this.comboMultiplier}` : ''}`,
      enemy.color
    );

    // Tank shrapnel burst
    if (enemy.type === 'tank') {
      const shrapnelCount = 6;
      for (let i = 0; i < shrapnelCount; i++) {
        const angle = (Math.PI * 2 * i) / shrapnelCount;
        this.bullets.push({
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angle) * 190,
          vy: Math.sin(angle) * 190,
          radius: 4,
          damage: 12,
          isCrit: false,
          isEnemy: true,
          life: 0,
          maxLife: 2.2,
          penetration: 1,
          bounces: 0,
          color: '#ffaa00',
        });
      }
    }

    // Siphon upgrade perk
    if (this.stats.siphonChance > 0 && Math.random() < this.stats.siphonChance) {
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 6);
      this.spawnFloatingText(this.player.x, this.player.y - 20, '+6 HP', '#00ff66', 15);
    }

    this.maybeDropPowerUp(enemy.x, enemy.y);
  }

  private applyPowerUp(item: PowerUpItem) {
    sounds.playPowerUp();
    this.addScreenShake(4);
    this.spawnParticleBurst(item.x, item.y, '#ffe600', 20);

    switch (item.type) {
      case 'shield':
        this.player.hasShield = true;
        this.spawnFloatingText(this.player.x, this.player.y - 30, 'ENERGY SHIELD ONLINE', '#00d8ff', 20);
        break;
      case 'rapid':
        this.player.powerups.rapid = 9;
        this.spawnFloatingText(this.player.x, this.player.y - 30, 'RAPID FIRE ACTIVE!', '#ffe600', 20);
        break;
      case 'triple':
        this.player.powerups.triple = 10;
        this.spawnFloatingText(this.player.x, this.player.y - 30, 'TRIPLE SPREAD ACTIVE!', '#39ff14', 20);
        break;
      case 'health':
        if (this.stats.hp >= this.stats.maxHp && this.stats.lives < 3) {
          this.stats.lives++;
          this.spawnFloatingText(this.player.x, this.player.y - 30, '+1 EXTRA LIFE!', '#00ff66', 22);
        } else {
          this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 45);
          this.spawnFloatingText(this.player.x, this.player.y - 30, '+45 HULL REPAIR', '#00ff66', 20);
        }
        break;
      case 'slowmo':
        this.player.powerups.slowmo = 6;
        this.spawnFloatingText(this.player.x, this.player.y - 30, 'CHRONO-WARP SLOWDOWN!', '#a855f7', 20);
        break;
    }
  }

  public hurtPlayer(damage: number) {
    if (this.player.isDashing || this.screen !== 'playing') return;

    const res = applyPlayerDamage(this.stats.hp, this.stats.lives, damage, this.player.hasShield);

    if (res.absorbedByShield) {
      this.player.hasShield = false;
      sounds.playHit();
      this.addScreenShake(10);
      this.spawnParticleBurst(this.player.x, this.player.y, '#00d8ff', 24);
      this.spawnFloatingText(this.player.x, this.player.y - 25, 'SHIELD BROKEN!', '#00d8ff', 20);
      return;
    }

    this.stats.hp = res.hp;
    this.stats.lives = res.lives;
    sounds.playHit();
    this.addScreenShake(14);
    this.hitstopTimer = 0.05;
    this.spawnParticleBurst(this.player.x, this.player.y, '#ff0055', 20);
    this.spawnFloatingText(this.player.x, this.player.y - 25, `-${damage} HP`, '#ff0055', 20);

    if (res.isDead) {
      this.gameOver();
    }
  }

  private gameOver() {
    this.setScreen('gameover');
    sounds.playGameOver();
    this.addScreenShake(20);
    this.spawnParticleBurst(this.player.x, this.player.y, '#ff0055', 40);
  }

  public chooseUpgrade(index: number) {
    const chosen = this.offeredUpgrades[index];
    if (!chosen) return;

    this.stats = applyUpgrade(this.stats, chosen.id);
    sounds.playPowerUp();
    this.startWave(this.wave + 1);
    this.setScreen('playing');
  }

  // ================= UPDATE LOOP =================

  public update(dt: number) {
    // Delta-time clamp
    const clampedDt = Math.min(dt, 0.05);

    // Hitstop freeze
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= clampedDt;
      return;
    }

    // Always update stars & ambient elements for smooth visual feel
    this.updateStarfield(clampedDt);

    if (this.screen === 'title') {
      this.updateTitleScreen(clampedDt);
      return;
    }

    if (this.screen !== 'playing') return;

    this.runTime += clampedDt;

    // Time scale influenced by slowmo powerup
    const enemyTimeScale = this.player.powerups.slowmo > 0 ? 0.38 : 1.0;

    // Wave announcement fade
    if (this.waveAnnounceTimer > 0) {
      this.waveAnnounceTimer -= clampedDt;
    }

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - clampedDt * 24);
    }

    // Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer -= clampedDt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboMultiplier = 1;
      }
    }

    // Power-up durations
    if (this.player.powerups.rapid > 0) this.player.powerups.rapid = Math.max(0, this.player.powerups.rapid - clampedDt);
    if (this.player.powerups.triple > 0) this.player.powerups.triple = Math.max(0, this.player.powerups.triple - clampedDt);
    if (this.player.powerups.slowmo > 0) this.player.powerups.slowmo = Math.max(0, this.player.powerups.slowmo - clampedDt);

    // Player dash cooldown & invincibility
    if (this.player.dashTimer > 0) {
      this.player.dashTimer = Math.max(0, this.player.dashTimer - clampedDt);
    }
    if (this.player.isDashing) {
      this.player.dashDuration -= clampedDt;
      if (this.player.dashDuration <= 0) {
        this.player.isDashing = false;
      }
    }

    // Player Input & Movement
    let inputX = 0;
    let inputY = 0;
    if (this.keys['w'] || this.keys['arrowup']) inputY -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) inputY += 1;
    if (this.keys['a'] || this.keys['arrowleft']) inputX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) inputX += 1;

    if (this.touchJoystick.active) {
      inputX = this.touchJoystick.dx;
      inputY = this.touchJoystick.dy;
    }

    const inputMag = Math.hypot(inputX, inputY);
    if (inputMag > 1) {
      inputX /= inputMag;
      inputY /= inputMag;
    }

    const accel = 1800;
    const friction = 0.88;

    if (!this.player.isDashing) {
      this.player.vx += inputX * accel * clampedDt;
      this.player.vy += inputY * accel * clampedDt;
      this.player.vx *= friction;
      this.player.vy *= friction;

      // Cap speed
      const curSpeed = Math.hypot(this.player.vx, this.player.vy);
      if (curSpeed > this.stats.speed) {
        this.player.vx = (this.player.vx / curSpeed) * this.stats.speed;
        this.player.vy = (this.player.vy / curSpeed) * this.stats.speed;
      }
    }

    this.player.x += this.player.vx * clampedDt;
    this.player.y += this.player.vy * clampedDt;

    // Clamp player to screen bounds
    const pMargin = 22;
    this.player.x = Math.max(pMargin, Math.min(window.innerWidth - pMargin, this.player.x));
    this.player.y = Math.max(pMargin, Math.min(window.innerHeight - pMargin, this.player.y));

    // Player facing angle (aim with mouse or movement)
    this.player.angle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);

    // Player dash ghost trail
    if (this.player.isDashing || Math.hypot(this.player.vx, this.player.vy) > 200) {
      this.player.dashTrail.push({
        x: this.player.x,
        y: this.player.y,
        angle: this.player.angle,
        alpha: 0.7,
      });
    }
    for (let i = this.player.dashTrail.length - 1; i >= 0; i--) {
      this.player.dashTrail[i].alpha -= clampedDt * 4.5;
      if (this.player.dashTrail[i].alpha <= 0) {
        this.player.dashTrail.splice(i, 1);
      }
    }

    // Auto-fire or mouse down shooting
    if (this.player.autoFire || this.mouse.isDown) {
      this.shoot();
    }

    // Magnet power-up attraction
    const magDist = this.stats.magnetRadius;
    for (const pu of this.powerups) {
      const d = Math.hypot(this.player.x - pu.x, this.player.y - pu.y);
      if (d < magDist && d > 0) {
        const pull = 380 * (1 - d / magDist);
        pu.x += ((this.player.x - pu.x) / d) * pull * clampedDt;
        pu.y += ((this.player.y - pu.y) / d) * pull * clampedDt;
      }
      // Pickup collision
      if (checkCircleCollision(this.player.x, this.player.y, this.player.radius, pu.x, pu.y, pu.radius)) {
        this.applyPowerUp(pu);
        pu.life = pu.maxLife; // mark for removal
      }
    }

    // Powerups cleanup
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      this.powerups[i].life += clampedDt;
      this.powerups[i].pulse += clampedDt * 5;
      if (this.powerups[i].life >= this.powerups[i].maxLife) {
        this.powerups.splice(i, 1);
      }
    }

    // Wave spawning logic
    if (this.waveEnemiesSpawned < this.waveEnemiesTotal) {
      this.spawnTimer -= clampedDt;
      if (this.spawnTimer <= 0) {
        this.spawnEnemy();
        this.spawnTimer = this.waveConfig.spawnInterval;
      }
    } else if (this.enemies.length === 0 && this.waveAnnounceTimer <= 0) {
      // Wave Cleared!
      sounds.playWaveComplete();
      this.offeredUpgrades = getRandomUpgrades(3);
      this.setScreen('upgrade');
      return;
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.hitFlash > 0) e.hitFlash -= clampedDt;

      const simDt = clampedDt * enemyTimeScale;

      if (e.type === 'chaser') {
        const dx = this.player.x - e.x;
        const dy = this.player.y - e.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
          e.x += (dx / dist) * e.speed * simDt;
          e.y += (dy / dist) * e.speed * simDt;
        }
      } else if (e.type === 'tank') {
        const dx = this.player.x - e.x;
        const dy = this.player.y - e.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
          e.x += (dx / dist) * e.speed * simDt;
          e.y += (dy / dist) * e.speed * simDt;
        }
      } else if (e.type === 'shooter') {
        const dx = this.player.x - e.x;
        const dy = this.player.y - e.y;
        const dist = Math.hypot(dx, dy);
        const preferredDist = 260;

        // Maintain distance / orbit
        if (dist < preferredDist - 40) {
          e.x -= (dx / dist) * e.speed * simDt;
          e.y -= (dy / dist) * e.speed * simDt;
        } else if (dist > preferredDist + 40) {
          e.x += (dx / dist) * e.speed * simDt;
          e.y += (dy / dist) * e.speed * simDt;
        } else {
          // Orbit strafe
          e.x += (-dy / dist) * e.speed * 0.75 * simDt;
          e.y += (dx / dist) * e.speed * 0.75 * simDt;
        }

        // Shooting cycle
        if (e.shootTimer !== undefined) {
          e.shootTimer -= simDt;
          if (e.shootTimer <= 0.4 && e.shootTimer > 0) {
            e.telegraphTimer = 0.4; // Aim line visible
          }
          if (e.shootTimer <= 0) {
            this.enemyShoot(e, this.player.x, this.player.y);
            e.shootTimer = 2.4 + Math.random() * 0.8;
            e.telegraphTimer = 0;
          }
        }
      } else if (e.type === 'boss') {
        // Boss AI logic
        const targetX = window.innerWidth / 2;
        const targetY = 160 + Math.sin(this.runTime * 1.5) * 60;
        e.x += (targetX - e.x) * 1.2 * simDt;
        e.y += (targetY - e.y) * 1.2 * simDt;

        if (e.bossAttackTimer !== undefined) {
          e.bossAttackTimer -= simDt;
          if (e.bossAttackTimer <= 0) {
            // Cycle attack patterns
            const pattern = Math.floor(Math.random() * 3);
            if (pattern === 0) {
              // Radial ring blast
              const rings = 12;
              for (let k = 0; k < rings; k++) {
                const angle = (Math.PI * 2 * k) / rings;
                this.bullets.push({
                  x: e.x,
                  y: e.y,
                  vx: Math.cos(angle) * 230,
                  vy: Math.sin(angle) * 230,
                  radius: 6,
                  damage: 18,
                  isCrit: false,
                  isEnemy: true,
                  life: 0,
                  maxLife: 3.5,
                  penetration: 1,
                  bounces: 0,
                  color: '#ff0055',
                });
              }
              sounds.playEnemyShoot();
            } else if (pattern === 1) {
              // Aimed 3-shot burst towards player
              for (let offset = -0.3; offset <= 0.3; offset += 0.3) {
                const a = Math.atan2(this.player.y - e.y, this.player.x - e.x) + offset;
                this.bullets.push({
                  x: e.x,
                  y: e.y,
                  vx: Math.cos(a) * 310,
                  vy: Math.sin(a) * 310,
                  radius: 7,
                  damage: 22,
                  isCrit: false,
                  isEnemy: true,
                  life: 0,
                  maxLife: 3.2,
                  penetration: 1,
                  bounces: 0,
                  color: '#00ffcc',
                });
              }
              sounds.playEnemyShoot();
            } else {
              // Spawn 2 swift chaser escorts
              for (let m = -1; m <= 1; m += 2) {
                this.enemies.push({
                  id: Math.random(),
                  x: e.x + m * 45,
                  y: e.y + 30,
                  vx: 0,
                  vy: 0,
                  radius: 12,
                  type: 'chaser',
                  hp: 25,
                  maxHp: 25,
                  speed: 240,
                  color: '#ff0055',
                  hitFlash: 0,
                });
              }
            }
            e.bossAttackTimer = 2.0;
          }
        }
      }

      // Check collision with player
      if (checkCircleCollision(this.player.x, this.player.y, this.player.radius, e.x, e.y, e.radius)) {
        if (!this.player.isDashing) {
          this.hurtPlayer(e.type === 'boss' ? 35 : e.type === 'tank' ? 25 : 15);
        }
      }
    }

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const bulletDt = b.isEnemy ? clampedDt * enemyTimeScale : clampedDt;

      b.x += b.vx * bulletDt;
      b.y += b.vy * bulletDt;
      b.life += bulletDt;

      // Ricochet bounce off walls
      if (b.bounces > 0) {
        if (b.x < 10 || b.x > window.innerWidth - 10) {
          b.vx *= -1;
          b.bounces--;
          this.spawnParticleBurst(b.x, b.y, b.color, 4);
        }
        if (b.y < 10 || b.y > window.innerHeight - 10) {
          b.vy *= -1;
          b.bounces--;
          this.spawnParticleBurst(b.x, b.y, b.color, 4);
        }
      }

      // Expiration or out of bounds
      if (
        b.life >= b.maxLife ||
        b.x < -40 ||
        b.x > window.innerWidth + 40 ||
        b.y < -40 ||
        b.y > window.innerHeight + 40
      ) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Enemy bullet hitting player
      if (b.isEnemy) {
        if (checkCircleCollision(this.player.x, this.player.y, this.player.radius, b.x, b.y, b.radius)) {
          this.hurtPlayer(b.damage);
          this.bullets.splice(i, 1);
          continue;
        }
      } else {
        // Player bullet hitting enemies
        let bulletRemoved = false;
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (checkCircleCollision(b.x, b.y, b.radius, e.x, e.y, e.radius)) {
            e.hp -= b.damage;
            e.hitFlash = 0.08;
            sounds.playHit();
            this.spawnParticleBurst(b.x, b.y, b.color, b.isCrit ? 8 : 4);

            if (b.isCrit) {
              this.spawnFloatingText(b.x, b.y, `CRIT ${b.damage}!`, '#ffe600', 16);
            }

            b.penetration--;
            if (b.penetration <= 0) {
              this.bullets.splice(i, 1);
              bulletRemoved = true;
            }

            if (e.hp <= 0) {
              this.killEnemy(e, j);
            }

            if (bulletRemoved) break;
          }
        }
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += clampedDt;
      ft.y += ft.vy * clampedDt;
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = 0; i < this.poolCapacity; i++) {
      const p = this.particlePool[i];
      if (p.active) {
        p.life += clampedDt;
        p.x += p.vx * clampedDt;
        p.y += p.vy * clampedDt;
        p.vx *= 0.94;
        p.vy *= 0.94;
        if (p.life >= p.maxLife) {
          p.active = false;
        }
      }
    }
  }

  private updateStarfield(dt: number) {
    const pSpeedX = this.screen === 'playing' ? this.player.vx * 0.12 : 25;
    const pSpeedY = this.screen === 'playing' ? this.player.vy * 0.12 : 15;

    for (const star of this.stars) {
      star.x -= pSpeedX * star.speed * dt;
      star.y -= pSpeedY * star.speed * dt;
      if (star.x < 0) star.x += window.innerWidth;
      if (star.x > window.innerWidth) star.x -= window.innerWidth;
      if (star.y < 0) star.y += window.innerHeight;
      if (star.y > window.innerHeight) star.y -= window.innerHeight;
    }

    this.gridOffset.x = (this.gridOffset.x - pSpeedX * dt * 0.4) % 60;
    this.gridOffset.y = (this.gridOffset.y - pSpeedY * dt * 0.4) % 60;
  }

  private updateTitleScreen(dt: number) {
    // Ship smoothly tracks cursor in title screen
    const targetX = this.mouse.x || window.innerWidth / 2;
    const targetY = this.mouse.y || window.innerHeight / 2;
    this.player.x += (targetX - this.player.x) * 2.5 * dt;
    this.player.y += (targetY - this.player.y) * 2.5 * dt;
    this.player.angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
  }

  // ================= RENDER LOOP =================

  public render() {
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.save();

    // Screen shake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() * 2 - 1) * this.screenShake;
      const shakeY = (Math.random() * 2 - 1) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // Background Clear
    ctx.fillStyle = '#060611';
    ctx.fillRect(0, 0, w, h);

    // Parallax Grid
    this.renderGrid(ctx, w, h);

    // Starfield
    this.renderStars(ctx);

    // Active power-up items on arena floor
    this.renderPowerups(ctx);

    // Enemy Telegraphs (Shooter aim lines)
    this.renderTelegraphs(ctx);

    // Bullets
    this.renderBullets(ctx);

    // Particles
    this.renderParticles(ctx);

    // Enemies
    this.renderEnemies(ctx);

    // Player
    this.renderPlayer(ctx);

    // Floating text popups
    this.renderFloatingTexts(ctx);

    // Wave announcement banner
    if (this.screen === 'playing' && this.waveAnnounceTimer > 0) {
      this.renderWaveAnnouncement(ctx, w, h);
    }

    // Touch controls on mobile
    if (this.isMobile && this.screen === 'playing') {
      this.renderTouchControls(ctx);
    }

    ctx.restore();
  }

  private renderGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
    ctx.lineWidth = 1;

    const gridSize = 60;
    const startX = this.gridOffset.x;
    const startY = this.gridOffset.y;

    ctx.beginPath();
    for (let x = startX - gridSize; x < w + gridSize; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = startY - gridSize; y < h + gridSize; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Subtle arena perimeter glow
    ctx.strokeStyle = 'rgba(255, 0, 85, 0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.restore();
  }

  private renderStars(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const s of this.stars) {
      ctx.fillStyle = `hsla(${s.hue}, 95%, 75%, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderPowerups(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const pu of this.powerups) {
      const scale = 1 + Math.sin(pu.pulse) * 0.15;
      let color = '#ffe600';
      let icon = '⚡';
      if (pu.type === 'shield') { color = '#00d8ff'; icon = '🛡'; }
      if (pu.type === 'rapid') { color = '#ffe600'; icon = '⚡'; }
      if (pu.type === 'triple') { color = '#39ff14'; icon = '🔱'; }
      if (pu.type === 'health') { color = '#ff0055'; icon = '✚'; }
      if (pu.type === 'slowmo') { color = '#bd00ff'; icon = '⏱'; }

      ctx.save();
      ctx.translate(pu.x, pu.y);
      ctx.scale(scale, scale);

      // Glow halo
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.arc(0, 0, pu.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Icon text
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(icon, 0, 1);

      ctx.restore();
    }
    ctx.restore();
  }

  private renderTelegraphs(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const e of this.enemies) {
      if (e.telegraphTimer && e.telegraphTimer > 0) {
        ctx.strokeStyle = 'rgba(189, 0, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(this.player.x, this.player.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private renderBullets(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const b of this.bullets) {
      ctx.shadowColor = b.color;
      ctx.shadowBlur = b.isCrit ? 16 : 9;
      ctx.fillStyle = b.color;

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Bullet trail
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.radius * 0.9;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.025, b.y - b.vy * 0.025);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (let i = 0; i < this.poolCapacity; i++) {
      const p = this.particlePool[i];
      if (p.active) {
        const progress = p.life / p.maxLife;
        const alpha = 1 - progress;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, alpha);

        ctx.beginPath();
        if (p.shape === 'spark') {
          ctx.arc(p.x, p.y, p.size * (1 - progress * 0.5), 0, Math.PI * 2);
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const e of this.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);

      // Hit flash
      if (e.hitFlash > 0) {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ffffff';
      } else {
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = 'rgba(10, 10, 25, 0.9)';
        ctx.strokeStyle = e.color;
      }
      ctx.lineWidth = 2.5;

      if (e.type === 'chaser') {
        const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(e.radius * 1.3, 0);
        ctx.lineTo(-e.radius, -e.radius * 0.85);
        ctx.lineTo(-e.radius * 0.5, 0);
        ctx.lineTo(-e.radius, e.radius * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (e.type === 'tank') {
        ctx.rotate(this.runTime * 0.8);
        ctx.beginPath();
        const sides = 6;
        for (let s = 0; s < sides; s++) {
          const a = (Math.PI * 2 * s) / sides;
          const sx = Math.cos(a) * e.radius;
          const sy = Math.sin(a) * e.radius;
          if (s === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner core
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = e.color;
        ctx.fill();
      } else if (e.type === 'shooter') {
        ctx.rotate(this.runTime * -1.2);
        ctx.beginPath();
        ctx.moveTo(0, -e.radius * 1.2);
        ctx.lineTo(e.radius * 0.9, 0);
        ctx.lineTo(0, e.radius * 1.2);
        ctx.lineTo(-e.radius * 0.9, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Eye lens
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      } else if (e.type === 'boss') {
        // Massive Boss Dreadnought
        ctx.rotate(this.runTime * 0.3);
        ctx.beginPath();
        const sides = 8;
        for (let s = 0; s < sides; s++) {
          const a = (Math.PI * 2 * s) / sides;
          const sx = Math.cos(a) * e.radius;
          const sy = Math.sin(a) * e.radius;
          if (s === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pulsing boss core
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0055';
        ctx.fill();

        ctx.restore();

        // Boss Health Bar at top center
        this.renderBossHealthBar(ctx, e);
        continue;
      }

      ctx.restore();

      // Enemy mini health bar if damaged
      if (e.hp < e.maxHp) {
        const barW = e.radius * 2;
        const barH = 3.5;
        const pct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(e.x - barW / 2, e.y - e.radius - 8, barW, barH);
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x - barW / 2, e.y - e.radius - 8, barW * pct, barH);
      }
    }
    ctx.restore();
  }

  private renderBossHealthBar(ctx: CanvasRenderingContext2D, boss: Enemy) {
    const w = Math.min(420, window.innerWidth - 60);
    const h = 14;
    const x = (window.innerWidth - w) / 2;
    const y = 52;
    const pct = Math.max(0, boss.hp / boss.maxHp);

    ctx.save();
    ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 12;

    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#ff0055';
    ctx.fillRect(x + 2, y + 2, (w - 4) * pct, h - 4);

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${boss.name || 'BOSS'} - ${boss.hp} / ${boss.maxHp}`, window.innerWidth / 2, y - 6);

    ctx.restore();
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Dash trail ghosts
    for (const t of this.player.dashTrail) {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);
      ctx.globalAlpha = t.alpha * 0.45;
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      this.drawPlayerShipPath(ctx);
      ctx.stroke();
      ctx.restore();
    }

    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.player.angle);

    // Energy Shield Bubble
    if (this.player.hasShield) {
      ctx.save();
      ctx.rotate(this.runTime * 2);
      ctx.strokeStyle = '#00d8ff';
      ctx.shadowColor = '#00d8ff';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.player.radius + 12, 0, Math.PI * 2);
      ctx.stroke();

      // Shield hexagon facets
      ctx.beginPath();
      const facets = 6;
      for (let f = 0; f < facets; f++) {
        const fa = (Math.PI * 2 * f) / facets;
        const fx = Math.cos(fa) * (this.player.radius + 12);
        const fy = Math.sin(fa) * (this.player.radius + 12);
        if (f === 0) ctx.moveTo(fx, fy);
        else ctx.lineTo(fx, fy);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    // Engine thruster glow
    const thrusterLength = 8 + Math.random() * 8;
    ctx.fillStyle = '#ffe600';
    ctx.shadowColor = '#ffe600';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-this.player.radius * 0.7, -4);
    ctx.lineTo(-this.player.radius * 0.7 - thrusterLength, 0);
    ctx.lineTo(-this.player.radius * 0.7, 4);
    ctx.closePath();
    ctx.fill();

    // Ship Body
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#08131e';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2.5;

    this.drawPlayerShipPath(ctx);
    ctx.fill();
    ctx.stroke();

    // Ship cockpit
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.arc(2, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawPlayerShipPath(ctx: CanvasRenderingContext2D) {
    const r = this.player.radius;
    ctx.beginPath();
    ctx.moveTo(r * 1.3, 0); // Front nose
    ctx.lineTo(-r * 0.8, -r * 0.85); // Left wingtip
    ctx.lineTo(-r * 0.45, 0); // Engine inset
    ctx.lineTo(-r * 0.8, r * 0.85); // Right wingtip
    ctx.closePath();
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const ft of this.floatingTexts) {
      const alpha = 1 - ft.life / ft.maxLife;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.font = `bold ${ft.size}px monospace`;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }

  private renderWaveAnnouncement(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const alpha = Math.min(1, this.waveAnnounceTimer);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.waveConfig.isBossWave ? '#ff0055' : '#00f3ff';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 20;
    ctx.fillText(this.waveAnnounceText, w / 2, h / 2 - 80);
    ctx.restore();
  }

  private renderTouchControls(ctx: CanvasRenderingContext2D) {
    if (!this.touchJoystick.active) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.touchJoystick.startX, this.touchJoystick.startY, 50, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 243, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(this.touchJoystick.currX, this.touchJoystick.currY, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ================= MAIN LOOP =================

  public startLoop() {
    this.lastTime = performance.now();
    const loop = (timestamp: number) => {
      const dt = (timestamp - this.lastTime) / 1000;
      this.lastTime = timestamp;

      this.update(dt);
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public stopLoop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}
