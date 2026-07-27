import Phaser from 'phaser';
import { generatePlaceholderTextures } from '../systems/placeholderTextures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.load.json('skills', 'data/skills.json');
    this.load.json('countries', 'data/countries.json');
    this.load.json('keepers', 'data/keepers.json');
    this.load.json('sceneTriggers', 'data/sceneTriggers.json');
  }

  create(): void {
    generatePlaceholderTextures(this);
    this.scene.start('MainMenu');
  }
}
