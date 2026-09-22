# PROGRESS — Platform Football

## Oturum 1 — M0 İskelet

**Yapıldı:**
- Vite + Phaser 3 + TypeScript projesi kuruldu (`platform-football/`, Botan reposunun dışında, ayrı bağımsız repo olarak).
- Sahne akışı: `BootScene` → `MenuScene` → `MatchScene` → `ResultScene`.
- `src/config/arena.ts`: tüm ölçüler tek yerde — 960x540 logical çözünürlük, karakter boyu (70px), derinlik bandı (3 karakter boyu), yarı saha genişliği (4.5 karakter genişliği), kale ağzı yüksekliği (derinlik bandının %50'si), `projectToScreen(x, z, y)` formülü (`screenY = baseY - z*depthScale - y`) sonraki milestone'lar için hazır.
- `MatchScene`: statik placeholder saha — iki kale, orta çizgi, touchline'lar, sabit kamera (zoom/pan/follow yok).
- GitHub Pages deploy workflow'u (`.github/workflows/deploy.yml`) eklendi.
- `npm run build` temiz geçiyor. Playwright ile Menu → Match → Result akışı tarayıcıda uçtan uca doğrulandı, konsol hatası yok.
- Git init yapıldı, ilk commit atıldı (`ac2f2f5`).

**Kalan / bilinen sorun:**
- **GitHub reposu açılamadı.** `mcp__github__create_repository` çağrısı `403 Resource not accessible by integration` hatası verdi — bu oturumun GitHub App entegrasyonu yalnızca önceden tanımlı repolara (örn. `samiboran/Botan`) erişebiliyor, yeni repo oluşturma izni yok. Bu yüzden **push edilemedi, proje şu an sadece local'de** (`/home/user/platform-football`, container'a özel, kalıcı değil).
- Sonuç olarak GitHub Pages deploy'u da yapılamadı (M0'ın son maddesi teknik olarak tamamlanmadı — workflow dosyası hazır ama hiç çalışmadı).
- Devam etmek için: (a) Sami repoyu kendi hesabında elle oluşturup remote'u eklerse ben push ederim, veya (b) GitHub App'e repo oluşturma izni verilirse ben de açıp push edebilirim.

## Oturum 2 — Botan'ın altına taşındı

Ayrı repo denemesi izin duvarına takıldı (repo oluşturma yetkisi yok, tekrar
denemekle açılmıyor). Sami GitHub üzerinden Botan reposuna doğrudan bir
`platform-football` işareti attı — bu proje artık **Botan reposunun bir alt
klasörü** (`Botan/platform-football/`), ayrı repo değil.

**Yapıldı:**
- Proje dosyaları `Botan/platform-football/` altına taşındı, kendi `.git`i
  ve kendi `.github/workflows`ü kaldırıldı (sadece repo kökündeki workflow
  çalışır).
- `vite.config.ts` base: `/platform-football/` → `/Botan/platform-football/`.
- `CLAUDE.md` bölüm 0 ve 11 güncellendi: artık alt klasör, deploy DragonKick
  ile aynı workflow'dan, ayrı alt yola gidiyor.
- `Botan/.github/workflows/deploy.yml` iki projeyi de build edip birleşik
  `dist/`e (DragonKick köke, Platform Football `dist/platform-football/`e)
  koyacak şekilde güncellendi; tetikleyici branch de gerçek default branch
  (`claude/dragonkick-game-design-tjo3lc`) olarak düzeltildi — eskiden `main`
  bekliyordu ve hiç default branch'i olmadığından hiç tetiklenmemişti.

## Sıradaki oturum
- Deploy'un gerçekten tetiklenip tetiklenmediğini doğrula (Actions sekmesi),
  GitHub Pages ayarının "GitHub Actions" kaynağına açık olduğunu kontrol et.
- M1: joystick hareketi (x + z), low-gravity zıplama, gölge sistemi, depth sort.
