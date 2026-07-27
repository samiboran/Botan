import Phaser from 'phaser';

/**
 * Generates simple colored-shape textures so every scene is playable before
 * real pixel-art sprites exist. Swap these for actual spritesheets later —
 * nothing else in the codebase needs to change, texture keys stay the same.
 */
export function generatePlaceholderTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(8, 8, 8);
  g.lineStyle(1, 0x333333, 1);
  g.strokeCircle(8, 8, 8);
  g.generateTexture('ball', 16, 16);

  g.clear();
  g.fillStyle(0x2e86de, 1);
  g.fillRect(0, 0, 24, 48);
  g.generateTexture('player', 24, 48);

  g.clear();
  g.fillStyle(0xe74c3c, 1);
  g.fillRect(0, 0, 28, 52);
  g.generateTexture('keeper', 28, 52);

  g.clear();
  g.fillStyle(0x1e8449, 1);
  g.fillRect(0, 0, 64, 64);
  g.generateTexture('pitch', 64, 64);

  g.clear();
  g.fillStyle(0xf5f5f5, 1);
  g.fillRect(0, 0, 260, 8);
  g.fillRect(0, 0, 8, 110);
  g.fillRect(252, 0, 8, 110);
  g.generateTexture('goalpost', 260, 110);

  g.clear();
  g.fillStyle(0xf39c12, 1);
  g.fillRect(0, 0, 10, 16);
  g.generateTexture('fan', 10, 16);

  g.destroy();
}
