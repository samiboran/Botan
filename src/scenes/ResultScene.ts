import Phaser from 'phaser';
import { GameState } from '../state/GameState';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import type { ShotAttempt, ShotOutcome } from '../types';

interface ResultData {
  countryId: string;
  attempt: ShotAttempt;
  outcome: ShotOutcome;
}

/**
 * Ball-flight cutscene + special-scene banner (section 5) + outcome
 * resolution that feeds back into GameState (level, streak, score).
 */
export class ResultScene extends Phaser.Scene {
  private resultData!: ResultData;

  constructor() {
    super('Result');
  }

  init(data: ResultData): void {
    this.resultData = data;
  }

  create(): void {
    const { attempt, outcome } = this.resultData;

    // eslint-disable-next-line no-console
    console.log('[DragonKick] shot', { power: attempt.power, curve: attempt.curve, height: attempt.height, outcome });

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0d2b12).setOrigin(0);
    this.add.image(GAME_WIDTH / 2, 140, 'goalpost').setScale(1.4, 1.3);
    const keeper = this.add.image(GAME_WIDTH / 2, 190, 'keeper').setScale(1.4);

    const ball = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 90, 'ball').setScale(2.2);

    if (outcome.special) this.showSpecialBanner(outcome);

    // attempt.curve.value < 0.5 means the timing marker was locked left of
    // center (see ShotResolver.computeCurveStat) — the ball must go that way.
    const side = attempt.curve.value < 0.5 ? -1 : 1;
    const targetX = GAME_WIDTH / 2 + side * (40 + (outcome.curveStat / 100) * 100);
    const targetY = 140 - (outcome.heightValue - 0.5) * 60;
    const midX = (ball.x + targetX) / 2 + side * (outcome.curveStat / 100) * 60;

    const path = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(ball.x, ball.y),
      new Phaser.Math.Vector2(midX, (ball.y + targetY) / 2),
      new Phaser.Math.Vector2(targetX, targetY),
    );

    const duration = Phaser.Math.Clamp(900 - outcome.powerStat * 4, 350, 900);
    const follower = { t: 0 };

    this.tweens.add({
      targets: follower,
      t: 1,
      duration,
      ease: 'Sine.easeIn',
      onUpdate: () => {
        const p = path.getPoint(follower.t);
        ball.setPosition(p.x, p.y);
        ball.setScale(2.2 - follower.t * 1.4);
      },
      onComplete: () => {
        if (outcome.saved) {
          this.tweens.add({ targets: keeper, x: targetX, duration: 200 });
        }
        this.showOutcome();
      },
    });
  }

  private showSpecialBanner(outcome: ShotOutcome): void {
    const banner = this.add
      .text(GAME_WIDTH / 2, 260, outcome.specialLabel ?? '', {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#ffcc00',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({ targets: banner, alpha: 1, duration: 200 });
  }

  private showOutcome(): void {
    const { outcome } = this.resultData;
    let resultText: string;
    let color: string;

    if (outcome.scored) {
      const { leveledUp, newLevel } = GameState.registerGoal(outcome.xpGained, outcome.bonusPoints);
      resultText = leveledUp ? `GOOOL! Seviye atladın: ${newLevel}` : 'GOOOL!';
      color = '#2ecc71';
    } else {
      GameState.registerMiss(outcome.xpGained, outcome.bonusPoints);
      resultText = outcome.saved ? 'KURTARDI!' : 'KAÇTI!';
      color = '#e74c3c';
    }

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, resultText, {
        fontFamily: 'monospace',
        fontSize: '32px',
        color,
      })
      .setOrigin(0.5);

    if (outcome.bonusPoints > 0) {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, `+${outcome.bonusPoints} bonus puan`, {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#f1c40f',
        })
        .setOrigin(0.5);
    }

    const btn = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, 220, 50, 0x2c3e50)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'Devam', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    btn.on('pointerup', () => this.scene.start('Map'));
  }
}
