import { gradeMultiplier } from './TimingBar';
import type {
  KeeperProfile,
  SceneTriggerConfig,
  ShotAttempt,
  ShotOutcome,
  SkillLevels,
  SkillTreeConfig,
  SpecialSceneId,
} from '../types';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** 0..100 effective power from timing quality + the player's Power skill. */
function computePowerStat(attempt: ShotAttempt, skills: SkillLevels, skillTree: SkillTreeConfig): number {
  const mult = skillTree.power.effects.shot_speed_multiplier as number[];
  const skillMultiplier = mult[skills.power - 1] ?? 1;
  return clamp(attempt.power.value * gradeMultiplier(attempt.power.grade) * skillMultiplier * 100, 0, 100);
}

/** 0..100 effective swerve from timing quality + the player's Curve skill. */
function computeCurveStat(attempt: ShotAttempt, skills: SkillLevels, skillTree: SkillTreeConfig): number {
  const mult = skillTree.curve.effects.swerve_multiplier as number[];
  const skillMultiplier = mult[skills.curve - 1] ?? 1;
  // curve's timing value is 0..1 centered at 0.5 (0.5 = straight, edges = max swerve)
  const rawSwerve = Math.abs(attempt.curve.value - 0.5) * 2;
  return clamp(rawSwerve * gradeMultiplier(attempt.curve.grade) * skillMultiplier * 100, 0, 100);
}

type Accuracy = 'pinpoint' | 'ok' | 'poor' | 'way_off';

function computeAccuracy(attempt: ShotAttempt): Accuracy {
  const grades = [attempt.power.grade, attempt.curve.grade, attempt.height.grade];
  const poorCount = grades.filter((g) => g === 'poor').length;
  const perfectCount = grades.filter((g) => g === 'perfect').length;
  if (poorCount >= 2) return 'way_off';
  if (poorCount === 1) return 'poor';
  if (perfectCount >= 2) return 'pinpoint';
  return 'ok';
}

function pickSpecialScene(
  powerStat: number,
  curveStat: number,
  accuracy: Accuracy,
  heightValue: number,
  triggers: SceneTriggerConfig,
): SpecialSceneId {
  const { thresholds } = triggers;
  if (powerStat >= thresholds.power_fire) return 'fire_ball_scene';
  if (curveStat >= thresholds.curve_world_loop) return 'world_loop_scene';
  if (accuracy === 'way_off') return 'crowd_hit_ambulance_scene';
  if (powerStat < thresholds.power_weak && accuracy === 'poor') return 'weak_miss_scene';
  if (powerStat < thresholds.power_slow && heightValue > 0.7) return 'crowd_catch_scene';
  return null;
}

/** Does the keeper's weakness/strength profile favor the attacker for this shot? */
function keeperSaveProbability(
  powerStat: number,
  curveStat: number,
  keeper: KeeperProfile,
  speedSkillLevel: number,
  skillTree: SkillTreeConfig,
): number {
  // base_difficulty 1..10 -> base save chance 10%..70%
  let saveChance = 0.1 + (keeper.base_difficulty / 10) * 0.6;

  if (keeper.weaknesses.includes('heavy_curve') && curveStat > 60) saveChance -= 0.25;
  if (keeper.weaknesses.includes('heavy_power') && powerStat > 60) saveChance -= 0.25;
  if (keeper.weaknesses.includes('low_power_shots') && powerStat < 40) saveChance -= 0.15;
  if (keeper.weaknesses.includes('high_placement')) saveChance -= 0.05;

  if (keeper.strengths.includes('heavy_curve') && curveStat > 60) saveChance += 0.2;
  if (keeper.strengths.includes('heavy_power') && powerStat > 60) saveChance += 0.2;
  if (keeper.strengths.includes('low_power_shots') && powerStat < 40) saveChance += 0.2;

  const reactionCuts = skillTree.speed.effects.keeper_reaction_window_reduction_pct as number[];
  const reductionPct = reactionCuts[speedSkillLevel - 1] ?? 0;
  saveChance -= reductionPct / 100;

  return clamp(saveChance, 0.03, 0.9);
}

export function resolveShot(
  attempt: ShotAttempt,
  skills: SkillLevels,
  keeper: KeeperProfile,
  skillTree: SkillTreeConfig,
  triggers: SceneTriggerConfig,
  rng: () => number = Math.random,
): ShotOutcome {
  const powerStat = computePowerStat(attempt, skills, skillTree);
  const curveStat = computeCurveStat(attempt, skills, skillTree);
  const accuracy = computeAccuracy(attempt);
  const special = pickSpecialScene(powerStat, curveStat, accuracy, attempt.height.value, triggers);
  const specialConfig = special ? triggers.scenes[special] : null;

  let scored: boolean;
  let saved = false;

  if (specialConfig && !specialConfig.forces_goal) {
    // weak_miss / crowd_catch / crowd_hit_ambulance never result in a goal.
    scored = false;
  } else if (specialConfig?.forces_goal) {
    // fire_ball / world_loop overpower ordinary keeper reactions.
    scored = true;
  } else {
    const saveChance = keeperSaveProbability(powerStat, curveStat, keeper, skills.speed, skillTree);
    saved = rng() < saveChance;
    scored = !saved;
  }

  const bonusPoints = specialConfig?.bonus_points ?? 0;
  const xpGained = scored ? 20 + Math.round((powerStat + curveStat) / 10) : 5;

  return {
    scored,
    saved,
    special,
    specialLabel: specialConfig?.label ?? null,
    bonusPoints,
    xpGained,
    powerStat,
    curveStat,
    heightValue: attempt.height.value,
  };
}
