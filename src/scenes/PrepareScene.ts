import Phaser from 'phaser';
import { ConfigLoader } from '../systems/ConfigLoader';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

interface PrepareData {
  countryId: string;
}

/**
 * "Hazırlık" state from the design doc — camera behind the player, run-up
 * animation, then a quick "swish pan" cut into ShotScene's front camera.
 */
export class PrepareScene extends Phaser.Scene {
  private countryId!: string;

  constructor() {
    super('Prepare');
  }

  init(data: PrepareData): void {
    this.countryId = data.countryId;
  }

  create(): void {
    const config = new ConfigLoader(this.cache);
    const country = config.countryById(this.countryId);

    this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'pitch').setOrigin(0);
    this.add.text(24, 20, `Rakip: ${country.label}`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
    });
    this.add
      .text(GAME_WIDTH / 2, 40, 'Yaklaşma...', { fontFamily: 'monospace', fontSize: '16px', color: '#dddddd' })
      .setOrigin(0.5);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'goalpost').setScale(0.5, 0.4).setAlpha(0.8);

    const player = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'player').setScale(1.4);

    this.tweens.add({
      targets: player,
      y: GAME_HEIGHT / 2 + 20,
      scale: 0.8,
      duration: 1100,
      ease: 'Sine.easeIn',
      onComplete: () => this.swishTransition(),
    });

    this.input.once('pointerdown', () => {
      this.tweens.killTweensOf(player);
      this.swishTransition();
    });
  }

  private swishTransition(): void {
    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff).setAlpha(0);
    this.tweens.add({
      targets: flash,
      alpha: 1,
      duration: 120,
      onComplete: () => {
        this.scene.start('Shot', { countryId: this.countryId });
      },
    });
  }
}
