import type { SkillId, SkillLevels } from '../types';

const SAVE_KEY = 'dragonkick_save_v1';

interface SaveData {
  level: number;
  xp: number;
  skillPoints: number;
  skills: SkillLevels;
  score: number;
  streak: number;
  bestStreak: number;
  totalGoals: number;
  totalShots: number;
  selectedCountryId: string;
}

function defaultSave(): SaveData {
  return {
    level: 1,
    xp: 0,
    skillPoints: 0,
    skills: { power: 1, curve: 1, speed: 1 },
    score: 0,
    streak: 0,
    bestStreak: 0,
    totalGoals: 0,
    totalShots: 0,
    selectedCountryId: 'TUR',
  };
}

/** Total XP needed to go from `level` to `level + 1`. */
export function xpToNextLevel(level: number): number {
  return 100 + (level - 1) * 40;
}

class GameStateStore {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return { ...defaultSave(), ...parsed };
    } catch {
      return defaultSave();
    }
  }

  private save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      // localStorage unavailable (private mode, quota) — progress just won't persist.
    }
  }

  get level(): number {
    return this.data.level;
  }

  get xp(): number {
    return this.data.xp;
  }

  get skillPoints(): number {
    return this.data.skillPoints;
  }

  get skills(): SkillLevels {
    return { ...this.data.skills };
  }

  get score(): number {
    return this.data.score;
  }

  get streak(): number {
    return this.data.streak;
  }

  get bestStreak(): number {
    return this.data.bestStreak;
  }

  get selectedCountryId(): string {
    return this.data.selectedCountryId;
  }

  setSelectedCountry(id: string): void {
    this.data.selectedCountryId = id;
    this.save();
  }

  /** Spend an available skill point on the given branch (max level 10). */
  upgradeSkill(id: SkillId): boolean {
    if (this.data.skillPoints <= 0) return false;
    if (this.data.skills[id] >= 10) return false;
    this.data.skills[id] += 1;
    this.data.skillPoints -= 1;
    this.save();
    return true;
  }

  /** Record a scored goal: grants xp/score, extends streak, may level up. */
  registerGoal(xpGained: number, bonusPoints: number): { leveledUp: boolean; newLevel: number } {
    this.data.totalShots += 1;
    this.data.totalGoals += 1;
    this.data.streak += 1;
    this.data.bestStreak = Math.max(this.data.bestStreak, this.data.streak);
    this.data.score += 100 + bonusPoints;

    let leveledUp = false;
    this.data.xp += xpGained;
    while (this.data.xp >= xpToNextLevel(this.data.level)) {
      this.data.xp -= xpToNextLevel(this.data.level);
      this.data.level += 1;
      this.data.skillPoints += 1;
      leveledUp = true;
    }

    this.save();
    return { leveledUp, newLevel: this.data.level };
  }

  /** Record a missed/saved attempt: resets streak, still may award small xp/bonus. */
  registerMiss(xpGained: number, bonusPoints: number): void {
    this.data.totalShots += 1;
    this.data.streak = 0;
    if (bonusPoints > 0) this.data.score += bonusPoints;

    this.data.xp += xpGained;
    while (this.data.xp >= xpToNextLevel(this.data.level)) {
      this.data.xp -= xpToNextLevel(this.data.level);
      this.data.level += 1;
      this.data.skillPoints += 1;
    }
    this.save();
  }

  reset(): void {
    this.data = defaultSave();
    this.save();
  }
}

/** Single shared instance — the whole game reads/writes progress through this. */
export const GameState = new GameStateStore();
