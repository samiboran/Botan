import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

/**
 * Title screen: player viewed from behind (same diagonal framing as
 * PrepareScene's start pose) with an idle breathing loop, and a ball that
 * bounces-and-settles in front of them. Pressing Play taps the ball away
 * and the camera pushes in behind the player before handing off to the
 * game hub — see design doc T4.
 */
export class MainMenuScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image;
  private ball!: Phaser.GameObjects.Image;
  private ballRestY = 0;
  private ballBounceTimer?: Phaser.Time.TimerEvent;
  private starting = false;

  constructor() {
    super('MainMenu');
  }

  create(): void {
    this.starting = false;
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'pitch').setOrigin(0);

    this.add
      .text(GAME_WIDTH / 2, 70, 'DragonKick', {
        fontFamily: 'monospace',
        fontSize: '42px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Same "arkadan, hafif çapraz" pose PrepareScene starts from.
    this.player = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'player').setScale(1.7);
    this.startIdleBreathing();

    this.ballRestY = this.player.y + 20;
    this.ball = this.add.image(this.player.x + 42, this.ballRestY, 'ball').setScale(1.8);
    this.scheduleNextBounce();

    this.drawMenu();
  }

  private startIdleBreathing(): void {
    this.tweens.add({
      targets: this.player,
      scaleY: { from: 1.7, to: 1.74 },
      y: '+=3',
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private scheduleNextBounce(): void {
    if (this.starting) return;
    this.tweens.add({
      targets: this.ball,
      y: this.ballRestY - 24,
      duration: 260,
      ease: 'Sine.easeOut',
      yoyo: true,
      onComplete: () => {
        if (this.starting) return;
        this.ballBounceTimer = this.time.delayedCall(900, () => this.scheduleNextBounce());
      },
    });
  }

  private drawMenu(): void {
    this.makeButton(GAME_WIDTH / 2, GAME_HEIGHT - 100, 240, 64, 'OYNA', 0xc0392b, 22, () => this.onPlay());
    this.makeButton(GAME_WIDTH / 2 - 130, GAME_HEIGHT - 35, 200, 44, 'Ayarlar', 0x2c3e50, 15, () =>
      this.showPlaceholderPanel('Ayarlar', 'Yakında...'),
    );
    this.makeButton(GAME_WIDTH / 2 + 130, GAME_HEIGHT - 35, 200, 44, 'Künye', 0x2c3e50, 15, () =>
      this.showPlaceholderPanel('Künye', 'DragonKick — yapım aşamasında.'),
    );
  }

  private makeButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    color: number,
    fontSize: number,
    onClick: () => void,
  ): void {
    const bg = this.add
      .rectangle(x, y, w, h, color)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, label, { fontFamily: 'monospace', fontSize: `${fontSize}px`, color: '#ffffff' })
      .setOrigin(0.5);
    bg.on('pointerup', onClick);
  }

  private showPlaceholderPanel(title: string, body: string): void {
    const bg = this.add.rectangle(0, 0, 420, 220, 0x0b0f14, 0.95).setStrokeStyle(2, 0xffffff);
    const titleText = this.add
      .text(0, -70, title, { fontFamily: 'monospace', fontSize: '22px', color: '#ffffff' })
      .setOrigin(0.5);
    const bodyText = this.add
      .text(0, -10, body, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#cccccc',
        align: 'center',
        wordWrap: { width: 380 },
      })
      .setOrigin(0.5);
    const closeBtn = this.add
      .rectangle(0, 70, 140, 40, 0x2c3e50)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true });
    const closeText = this.add
      .text(0, 70, 'Kapat', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' })
      .setOrigin(0.5);

    const panel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2, [bg, titleText, bodyText, closeBtn, closeText]);
    closeBtn.on('pointerup', () => panel.destroy());
  }

  private onPlay(): void {
    if (this.starting) return;
    this.starting = true;
    this.ballBounceTimer?.remove();
    this.tweens.killTweensOf(this.ball);

    // Tap the ball away toward the penalty spot, mid-bounce.
    this.tweens.add({
      targets: this.ball,
      x: this.ball.x + 40,
      y: this.ball.y - 90,
      scale: 0.6,
      alpha: 0,
      duration: 420,
      ease: 'Sine.easeIn',
    });

    // Camera pushes in behind the player into the prepare-shot framing.
    this.cameras.main.zoomTo(1.7, 700, 'Sine.easeInOut', true);
    this.cameras.main.pan(this.player.x, this.player.y + 40, 700, 'Sine.easeInOut', true, (_cam, progress) => {
      if (progress === 1) {
        this.scene.start('Map');
      }
    });
  }
}
