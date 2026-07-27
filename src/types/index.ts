export type SkillId = 'power' | 'curve' | 'speed';

export interface SkillLevels {
  power: number;
  curve: number;
  speed: number;
}

export interface SkillConfig {
  label: string;
  levels: number;
  effects: Record<string, number[] | number>;
}

export type SkillTreeConfig = Record<SkillId, SkillConfig>;

export interface CountryConfig {
  id: string;
  label: string;
  unlock_level: number;
  keeper_id: string;
}

export type KeeperWeaknessOrStrength =
  | 'heavy_curve'
  | 'heavy_power'
  | 'low_power_shots'
  | 'high_placement';

export interface KeeperProfile {
  goalkeeper_id: string;
  country: string;
  base_difficulty: number;
  weaknesses: KeeperWeaknessOrStrength[];
  strengths: KeeperWeaknessOrStrength[];
  reaction_time_ms: number;
  dive_range: 'short' | 'medium' | 'wide';
}

export interface SceneTriggerScene {
  label: string;
  description: string;
  forces_goal: boolean;
  bonus_points: number;
}

export interface SceneTriggerConfig {
  thresholds: {
    power_fire: number;
    curve_world_loop: number;
    power_weak: number;
    power_slow: number;
  };
  scenes: Record<string, SceneTriggerScene>;
}

export type TimingGrade = 'perfect' | 'good' | 'poor';

export interface TimingResult {
  /** 0..1 raw position where the input was locked in */
  value: number;
  grade: TimingGrade;
}

export interface ShotAttempt {
  power: TimingResult;
  curve: TimingResult;
  height: TimingResult;
}

export type SpecialSceneId =
  | 'fire_ball_scene'
  | 'world_loop_scene'
  | 'weak_miss_scene'
  | 'crowd_catch_scene'
  | 'crowd_hit_ambulance_scene'
  | null;

export interface ShotOutcome {
  scored: boolean;
  saved: boolean;
  special: SpecialSceneId;
  specialLabel: string | null;
  bonusPoints: number;
  xpGained: number;
  powerStat: number;
  curveStat: number;
  heightValue: number;
}
