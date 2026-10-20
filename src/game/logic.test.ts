import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_PLAYER_STATS,
  applyUpgrade,
  calculateKillScore,
  registerEnemyKill,
  checkCircleCollision,
  generateWaveConfig,
  applyPlayerDamage,
} from './logic.ts';

test('initial stats are properly configured', () => {
  assert.equal(INITIAL_PLAYER_STATS.lives, 3);
  assert.equal(INITIAL_PLAYER_STATS.hp, 100);
  assert.equal(INITIAL_PLAYER_STATS.maxHp, 100);
  assert.equal(INITIAL_PLAYER_STATS.damage, 22);
});

test('applyUpgrade increases damage and fire rate correctly', () => {
  const upgradedDmg = applyUpgrade(INITIAL_PLAYER_STATS, 'dmg_boost');
  assert.ok(upgradedDmg.damage > INITIAL_PLAYER_STATS.damage);

  const upgradedSpeed = applyUpgrade(INITIAL_PLAYER_STATS, 'speed_boost');
  assert.ok(upgradedSpeed.speed > INITIAL_PLAYER_STATS.speed);

  const upgradedHp = applyUpgrade(INITIAL_PLAYER_STATS, 'max_hp');
  assert.equal(upgradedHp.maxHp, 130);
  assert.equal(upgradedHp.hp, 130);

  const upgradedDash = applyUpgrade(INITIAL_PLAYER_STATS, 'dash_cd');
  assert.ok(upgradedDash.dashCooldown < INITIAL_PLAYER_STATS.dashCooldown);
});

test('calculateKillScore multiplies score with combo correctly', () => {
  assert.equal(calculateKillScore(100, 1), 100);
  assert.equal(calculateKillScore(100, 3), 300);
  assert.equal(calculateKillScore(100, 15), 1000); // capped at 10x
});

test('registerEnemyKill increases combo and scales multiplier', () => {
  const k1 = registerEnemyKill(0);
  assert.equal(k1.combo, 1);
  assert.equal(k1.multiplier, 1);

  const k3 = registerEnemyKill(2);
  assert.equal(k3.combo, 3);
  assert.equal(k3.multiplier, 2);

  const k6 = registerEnemyKill(5);
  assert.equal(k6.combo, 6);
  assert.equal(k6.multiplier, 3);
});

test('checkCircleCollision accurately detects overlap', () => {
  // Overlapping
  assert.equal(checkCircleCollision(0, 0, 10, 5, 0, 10), true);
  // Touching
  assert.equal(checkCircleCollision(0, 0, 10, 20, 0, 10), true);
  // Separated
  assert.equal(checkCircleCollision(0, 0, 10, 25, 0, 10), false);
});

test('generateWaveConfig schedules boss every 5 waves', () => {
  const w1 = generateWaveConfig(1);
  assert.equal(w1.isBossWave, false);

  const w5 = generateWaveConfig(5);
  assert.equal(w5.isBossWave, true);
  assert.ok(w5.bossConfig);
  assert.equal(w5.bossConfig.name, 'CYBER GOLIATH');

  const w10 = generateWaveConfig(10);
  assert.equal(w10.isBossWave, true);
  assert.ok(w10.bossConfig!.hp > w5.bossConfig!.hp);
});

test('applyPlayerDamage handles shields and life deduction', () => {
  // With shield
  const withShield = applyPlayerDamage(100, 3, 50, true);
  assert.equal(withShield.absorbedByShield, true);
  assert.equal(withShield.hp, 100);
  assert.equal(withShield.lives, 3);

  // Without shield, standard damage
  const hit1 = applyPlayerDamage(100, 3, 30, false);
  assert.equal(hit1.absorbedByShield, false);
  assert.equal(hit1.hp, 70);
  assert.equal(hit1.lives, 3);

  // Fatal damage consumes a life
  const fatal1 = applyPlayerDamage(20, 3, 50, false);
  assert.equal(fatal1.lives, 2);
  assert.equal(fatal1.hp, 100); // reset HP for next life
  assert.equal(fatal1.isDead, false);

  // Final fatal damage causes death
  const gameOver = applyPlayerDamage(20, 1, 50, false);
  assert.equal(gameOver.lives, 0);
  assert.equal(gameOver.isDead, true);
});
