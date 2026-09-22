# DragonKick

Penaltı vuruşuna odaklanan, pixel art, Kaptan Tsubasa esintili özel efektli bir arcade oyunu.
Tasarım dokümanının tamamı için proje handoff notlarına bakın; bu repo o dokümanın **Bölüm 9-10**'da
Claude Code'a verilen kısmının (proje iskeleti) implementasyonudur.

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ üretir (GitHub Pages için)
npm run preview    # build'i yerelde önizle
```

## Proje Yapısı

```
public/data/            JSON config — kod değişmeden dengeleme (balancing) yapılabilir
  skills.json            Skill tree: power / curve / speed, 10 seviye, efekt eğrileri
  countries.json          Avrupa turu ülkeleri + seviye kilidi + kaleci eşlemesi
  keepers.json           Kaleci zaaf profilleri (weaknesses/strengths)
  sceneTriggers.json     Özel sahne eşikleri (alev topu, dünya turu, vb.)

src/
  main.ts                Phaser.Game giriş noktası, scene listesi
  config.ts               Sabitler (canvas boyutu)
  types/index.ts          Paylaşılan tipler (SkillLevels, KeeperProfile, ShotOutcome, ...)
  state/GameState.ts       Merkezi oyun durumu (level/xp/skill puanı/streak), localStorage'a persist
  systems/
    ConfigLoader.ts        JSON config'lere tipli erişim
    TimingBar.ts            Güç/Falso/Yükseklik için tekrar kullanılabilir zamanlama mekaniği
    ShotResolver.ts          Timing sonucu + skill + kaleci profiline göre gol/kurtarış/özel sahne hesabı
    placeholderTextures.ts   Gerçek pixel-art sprite'lar gelene kadar yer tutucu textureler
  scenes/
    BootScene.ts            JSON config + placeholder texture yükleme
    MapScene.ts              Skill tree + ülke haritası (bölüm 4, 7)
    PrepareScene.ts          Arkadan kamera, yaklaşma, "swish pan" geçişi (bölüm 2)
    ShotScene.ts             Önden kamera, 3 aşamalı timing input (bölüm 3)
    ResultScene.ts           Top uçuşu animasyonu + özel sahne banner'ı + sonuç (bölüm 5)
```

## Veri Odaklı Tasarım / Kimi Handoff

`public/data/*.json` dosyaları çalışma zamanında `fetch` ile yüklenir (Phaser `this.load.json`),
bundle'a gömülü değildir — yani sayısal dengelemeler (eşikler, çarpanlar, kaleci zaafları) için
**kod değişikliği veya yeniden build gerekmez**, sadece JSON dosyasını güncelleyip sayfayı
yenilemek yeterlidir. Sahne tetikleme sırası (`ShotResolver.pickSpecialScene`) kodda sabit ama
eşik değerleri (`sceneTriggers.json > thresholds`) veridir.

Kimi'nin üstleneceği kısımlar (bölüm 10):
- Gerçek pixel-art sprite/animasyonların `placeholderTextures.ts`'teki texture key'lerinin
  (`ball`, `player`, `keeper`, `pitch`, `goalpost`, `fan`) yerine geçmesi
- Özel sahnelerin (alev topu, dünya turu, ambulans vb.) detaylı cutscene implementasyonu
  (şu an `ResultScene.showSpecialBanner` sadece metin banner'ı gösteriyor)
- Kaleci AI davranış detaylarının zenginleştirilmesi (`ShotResolver.keeperSaveProbability`)

## GitHub Pages Deploy

`.github/workflows/deploy.yml`, `claude/dragonkick-game-design-tjo3lc` branch'ine
push'ta otomatik build+deploy yapar (`vite build` → GitHub Pages). Bu, reponun
gerçek default branch'i — eskiden `main` bekliyordu ve öyle bir branch hiç
olmadığından deploy hiç tetiklenmemişti. `vite.config.ts` içindeki
`base: '/Botan/'` repo adıyla senkron tutulmalı.
