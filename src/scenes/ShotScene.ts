import Phaser from 'phaser';
import { ConfigLoader } from '../systems/ConfigLoader';
import { GameState } from '../state/GameState';
import { TimingBar } from '../systems/TimingBar';
import { resolveShot } from '../systems/ShotResolver';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import type { ShotAttempt, TimingResult } from '../types';

interface ShotData {
  countryId: string;
}

type Phase = 'power' | 'curve' | 'height';

/**
 * Front-camera shot mechanic: three sequential timing bars for
 * Power / Curve / Height, per design doc section 3.
 */
export class ShotScene extends Phaser.Scene {
  private countryId!: string;
  private phase: Phase = 'power';
  private currentBar?: TimingBar;
  private results: Partial<ShotAttempt> = {};
  private phaseText!: Phaser.GameObjects.Text;
  private keeperImage!: Phaser.GameObjects.Image;

  constructor() {
    super('Shot');
  }

  init(data: ShotData): void {
    this.countryId = data.countryId;
    this.phase = 'power';
    this.results = {};
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0d2b12).setOrigin(0);
    this.add.image(GAME_WIDTH / 2, 140, 'goalpost').setScale(1.4, 1.3);

    this.keeperImage = this.add.image(GAME_WIDTH / 2, 190, 'keeper').setScale(1.4);
    this.tweens.add({
      targets: this.keeperImage,
      x: GAME_WIDTH / 2 + 30,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 90, 'ball').setScale(2.2);

    this.phaseText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 220, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'Tam zamanında dokun / tıkla / boşluk tuşu', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    this.startPhase('power');

    this.input.on('pointerdown', () => this.handleInput());
    this.input.keyboard?.on('keydown-SPACE', () => this.handleInput());
  }

  update(time: number, delta: number): void {
    this.currentBar?.update(time, delta);
  }

  private startPhase(phase: Phase): void {
    this.phase = phase;
    this.currentBar?.destroy();

    const barY = GAME_HEIGHT - 190;
    const barWidth = 420;
    const barX = GAME_WIDTH / 2 - barWidth / 2;

    if (phase === 'power') {
      this.phaseText.setText('GÜÇ — bırakma zamanlaman şut hızını belirler');
      this.currentBar = new TimingBar(this, {
        x: barX,
        y: barY,
        width: barWidth,
        height: 24,
        speed: 1.2,
        zone: { perfect: [0.82, 1.0], good: [0.6, 0.82] },
        label: 'Güç',
      });
    } else if (phase === 'curve') {
      this.phaseText.setText('FALSO — merkeze yakın düz, kenara yakın falsolu şut');
      this.currentBar = new TimingBar(this, {
        x: barX,
        y: barY,
        width: barWidth,
        height: 24,
        speed: 1.6,
        zone: { perfect: [0.1, 0.25], good: [0.0, 0.4] },
        label: 'Falso (sol/sağ)',
      });
    } else {
      this.phaseText.setText('YÜKSEKLİK — üst köşeye mi, yerden mi?');
      this.currentBar = new TimingBar(this, {
        x: barX,
        y: barY,
        width: barWidth,
        height: 24,
        speed: 1.0,
        zone: { perfect: [0.55, 0.75], good: [0.4, 0.9] },
        label: 'Yükseklik',
      });
    }

    this.currentBar?.start();
  }

  private handleInput(): void {
    if (!this.currentBar) return;
    const result: TimingResult = this.currentBar.lock();

    if (this.phase === 'power') {
      this.results.power = result;
      this.time.delayedCall(250, () => this.startPhase('curve'));
    } else if (this.phase === 'curve') {
      this.results.curve = result;
      this.time.delayedCall(250, () => this.startPhase('height'));
    } else {
      this.results.height = result;
      this.currentBar.destroy();
      this.currentBar = undefined;
      this.finishShot();
    }
  }

  private finishShot(): void {
    const config = new ConfigLoader(this.cache);
    const country = config.countryById(this.countryId);
    const keeper = config.keeperById(country.keeper_id);
    const attempt = this.results as ShotAttempt;

    const outcome = resolveShot(attempt, GameState.skills, keeper, config.skills, config.sceneTriggers);

    this.scene.start('Result', { countryId: this.countryId, attempt, outcome });
  }
}
