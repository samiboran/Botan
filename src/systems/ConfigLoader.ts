import Phaser from 'phaser';
import type { CountryConfig, KeeperProfile, SceneTriggerConfig, SkillTreeConfig } from '../types';

/**
 * Typed access to the JSON config loaded in BootScene (see public/data/*.json).
 * Keeping balance numbers in JSON means Kimi/design can retune the game
 * without touching this code — see the "İş Bölümü Önerisi" section of the design doc.
 */
export class ConfigLoader {
  constructor(private readonly cache: Phaser.Cache.CacheManager) {}

  get skills(): SkillTreeConfig {
    return this.cache.json.get('skills');
  }

  get countries(): CountryConfig[] {
    return this.cache.json.get('countries');
  }

  get keepers(): KeeperProfile[] {
    return this.cache.json.get('keepers');
  }

  get sceneTriggers(): SceneTriggerConfig {
    return this.cache.json.get('sceneTriggers');
  }

  keeperById(id: string): KeeperProfile {
    const keeper = this.keepers.find((k) => k.goalkeeper_id === id);
    if (!keeper) throw new Error(`Unknown keeper id: ${id}`);
    return keeper;
  }

  countryById(id: string): CountryConfig {
    const country = this.countries.find((c) => c.id === id);
    if (!country) throw new Error(`Unknown country id: ${id}`);
    return country;
  }
}
