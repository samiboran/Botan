import Phaser from 'phaser';
import type { TimingGrade, TimingResult } from '../types';

export interface TimingZoneConfig {
  /** [start, end] in the 0..1 range along the bar. */
  perfect: [number, number];
  good: [number, number];
}

export interface TimingBarOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Full sweeps (0->1->0) per second. Higher = harder. */
  speed: number;
  zone: TimingZoneConfig;
  label?: string;
}

/**
 * A single "stop the marker in the zone" timing mechanic, reused for the
 * power / curve / height phases of a shot (see design doc section 3).
 */
export class TimingBar {
  private readonly opts: TimingBarOptions;
  private readonly track: Phaser.GameObjects.Graphics;
  private readonly marker: Phaser.GameObjects.Rectangle;
  private readonly labelText?: Phaser.GameObjects.Text;

  private t = 0;
  private direction = 1;
  private running = false;
  private locked = false;

  constructor(scene: Phaser.Scene, opts: TimingBarOptions) {
    this.opts = opts;

    this.track = scene.add.graphics();
    this.drawTrack();

    this.marker = scene.add.rectangle(opts.x, opts.y + opts.height / 2, 6, opts.height + 8, 0xffffff);
    this.marker.setDepth(1);

    if (opts.label) {
      this.labelText = scene.add
        .text(opts.x, opts.y - 22, opts.label, {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#ffffff',
        })
        .setOrigin(0, 0.5);
    }
  }

  private drawTrack(): void {
    const { x, y, width, height, zone } = this.opts;
    this.track.clear();
    this.track.fillStyle(0x1a1a1a, 1);
    this.track.fillRect(x, y, width, height);

    this.track.fillStyle(0xd4a017, 1);
    this.track.fillRect(x + zone.good[0] * width, y, (zone.good[1] - zone.good[0]) * width, height);

    this.track.fillStyle(0x2ecc71, 1);
    this.track.fillRect(
      x + zone.perfect[0] * width,
      y,
      (zone.perfect[1] - zone.perfect[0]) * width,
      height,
    );

    this.track.lineStyle(2, 0xffffff, 0.6);
    this.track.strokeRect(x, y, width, height);
  }

  start(): void {
    this.t = 0;
    this.direction = 1;
    this.running = true;
    this.locked = false;
    this.marker.setVisible(true);
    this.updateMarkerPosition();
  }

  update(_time: number, delta: number): void {
    if (!this.running || this.locked) return;
    const step = (delta / 1000) * this.opts.speed;
    this.t += step * this.direction;
    if (this.t >= 1) {
      this.t = 1;
      this.direction = -1;
    } else if (this.t <= 0) {
      this.t = 0;
      this.direction = 1;
    }
    this.updateMarkerPosition();
  }

  private updateMarkerPosition(): void {
    this.marker.x = this.opts.x + this.t * this.opts.width;
  }

  private gradeFor(t: number): TimingGrade {
    const { perfect, good } = this.opts.zone;
    if (t >= perfect[0] && t <= perfect[1]) return 'perfect';
    if (t >= good[0] && t <= good[1]) return 'good';
    return 'poor';
  }

  /** Stop the marker where it is and grade the result. */
  lock(): TimingResult {
    this.running = false;
    this.locked = true;
    return { value: this.t, grade: this.gradeFor(this.t) };
  }

  setVisible(visible: boolean): void {
    this.track.setVisible(visible);
    this.marker.setVisible(visible);
    this.labelText?.setVisible(visible);
  }

  destroy(): void {
    this.track.destroy();
    this.marker.destroy();
    this.labelText?.destroy();
  }
}

export function gradeMultiplier(grade: TimingGrade): number {
  switch (grade) {
    case 'perfect':
      return 1.0;
    case 'good':
      return 0.7;
    case 'poor':
      return 0.35;
  }
}
