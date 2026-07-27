import Phaser from 'phaser';
import { GameState, xpToNextLevel } from '../state/GameState';
import { ConfigLoader } from '../systems/ConfigLoader';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import type { CountryConfig, SkillId } from '../types';

const SKILL_IDS: SkillId[] = ['power', 'curve', 'speed'];
const SKILL_COLORS: Record<SkillId, number> = { power: 0xe74c3c, curve: 0x3498db, speed: 0xf1c40f };

/** World map / skill tree hub — see design doc sections 4 and 7. */
export class MapScene extends Phaser.Scene {
  private config!: ConfigLoader;
  private skillNodesContainer!: Phaser.GameObjects.Container;
  private countryContainer!: Phaser.GameObjects.Container;
  private headerText!: Phaser.GameObjects.Text;

  constructor() {
    super('Map');
  }

  create(): void {
    this.config = new ConfigLoader(this.cache);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b0f14).setOrigin(0);
    this.add.text(24, 20, 'DragonKick', { fontFamily: 'monospace', fontSize: '28px', color: '#ffffff' });

    this.headerText = this.add.text(24, 56, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#cccccc',
    });

    this.skillNodesContainer = this.add.container(0, 0);
    this.countryContainer = this.add.container(0, 0);

    this.drawSkillTree();
    this.drawCountries();
    this.drawPlayButton();
    this.refreshHeader();
  }

  private refreshHeader(): void {
    const need = xpToNextLevel(GameState.level);
    this.headerText.setText(
      `Seviye ${GameState.level}  |  XP ${GameState.xp}/${need}  |  Skill Puanı: ${GameState.skillPoints}  |  ` +
        `Skor: ${GameState.score}  |  Seri: ${GameState.streak} (En iyi ${GameState.bestStreak})`,
    );
  }

  private drawSkillTree(): void {
    this.skillNodesContainer.removeAll(true);
    const skillTree = this.config.skills;
    const skills = GameState.skills;

    SKILL_IDS.forEach((id, col) => {
      const baseX = 40 + col * 150;
      const baseY = 130;
      const color = SKILL_COLORS[id];
      const level = skills[id];

      this.skillNodesContainer.add(
        this.add.text(baseX, baseY - 30, skillTree[id].label, {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#ffffff',
        }),
      );
      this.skillNodesContainer.add(
        this.add.text(baseX, baseY - 10, `Lv ${level}/10`, {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#999999',
        }),
      );

      for (let i = 0; i < 10; i += 1) {
        const nodeY = baseY + 16 + i * 20;
        const filled = i < level;
        this.skillNodesContainer.add(
          this.add
            .circle(baseX + 8, nodeY, 6, filled ? color : 0x333333)
            .setStrokeStyle(1, 0xffffff, filled ? 0.8 : 0.2),
        );
      }

      const canUpgrade = GameState.skillPoints > 0 && level < 10;
      const upgradeBtn = this.add
        .text(baseX, baseY + 16 + 10 * 20 + 6, '[ Geliştir +1 ]', {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: canUpgrade ? '#2ecc71' : '#555555',
        })
        .setInteractive({ useHandCursor: canUpgrade });
      upgradeBtn.on('pointerup', () => {
        if (GameState.upgradeSkill(id)) {
          this.drawSkillTree();
          this.refreshHeader();
        }
      });
      this.skillNodesContainer.add(upgradeBtn);
    });
  }

  private drawCountries(): void {
    this.countryContainer.removeAll(true);
    const countries = this.config.countries;
    const selected = GameState.selectedCountryId;

    this.countryContainer.add(
      this.add.text(520, 100, 'Rakip Ülke (Avrupa Turu)', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
      }),
    );

    countries.forEach((country: CountryConfig, i: number) => {
      const unlocked = GameState.level >= country.unlock_level;
      const y = 130 + i * 40;
      const bg = this.add
        .rectangle(520, y, 380, 32, unlocked ? (country.id === selected ? 0x27ae60 : 0x2c3e50) : 0x1a1a1a)
        .setOrigin(0, 0.5)
        .setStrokeStyle(1, 0xffffff, unlocked ? 0.6 : 0.15);

      const label = unlocked ? country.label : `${country.label} (Seviye ${country.unlock_level})`;
      const text = this.add
        .text(530, y, label, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: unlocked ? '#ffffff' : '#555555',
        })
        .setOrigin(0, 0.5);

      if (unlocked) {
        bg.setInteractive({ useHandCursor: true }).on('pointerup', () => {
          GameState.setSelectedCountry(country.id);
          this.drawCountries();
        });
      }

      this.countryContainer.add(bg);
      this.countryContainer.add(text);
    });
  }

  private drawPlayButton(): void {
    const btn = this.add
      .rectangle(GAME_WIDTH - 160, GAME_HEIGHT - 60, 260, 60, 0xc0392b)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH - 160, GAME_HEIGHT - 60, 'PENALTI AT', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    btn.on('pointerup', () => {
      this.scene.start('Prepare', { countryId: GameState.selectedCountryId });
    });
  }
}
