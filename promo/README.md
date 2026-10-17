# MineMyLead promo (Remotion)

Portuguese promo source and renders (2026-10-17 backup).

- Remotion: `remotion/` (`Promo.tsx`, `Promo15.tsx`, `Promo30.tsx`, `Promo30v2.tsx`, …)
- Logo options: `logo/` (B magnifier-M in site yellow `#FFE14D` / ink `#0F1B2D`)
- Research: `RESEARCH.md`
- Music: selected track under `music/` (CC BY credit required for FMA “Energetic Upbeat Electronic Dance”). The large `music/fma/` candidate dump is **not** in git.

## Render
```bash
cd remotion && npm install
npx remotion render src/index.ts Promo30v2 out/promo-pt-30s-v2.mp4
```
