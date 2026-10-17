import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { App, iv, zin, io } from "./Promo";
const Y = "#FFE14D", INK = "#0F1B2D", BG = "#F6F8FB", LT = "#F2F6FB";
const FONT = `@font-face{font-family:BG;src:url(${staticFile("Bricolage.ttf")});font-weight:200 800}`;
const T: React.CSSProperties = { fontFamily: "BG", fontWeight: 800, fontVariationSettings: "'opsz' 96", letterSpacing: "-0.035em", lineHeight: 1.0 };
const FAST = { damping: 22, stiffness: 420, mass: 0.5 };
const Floaters = ({ f, c }: { f: number; c: string }) => (
  <AbsoluteFill>{[[90, 260, 80], [930, 360, 54], [150, 1560, 64], [920, 1700, 100], [600, 140, 36], [40, 980, 44]].map(([x, y, r], i) => (
    <div key={i} style={{ position: "absolute", left: x, top: ((y - f * (0.7 + i * 0.3)) % 2100 + 2100) % 2100 - 100, width: r, height: r, borderRadius: i % 2 ? r / 2 : 16, border: `3px solid ${c}`, opacity: 0.25, transform: `rotate(${f * (i % 2 ? 0.5 : -0.4)}deg)` }} />))}</AbsoluteFill>
);
export const Promo30: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const sp = (s: number, c: any = FAST) => spring({ frame: f - s, fps, config: c });
  const rise = (s: number) => ({ transform: `translateY(${(1 - sp(s)) * 115}%)` });
  let bg = BG, fc = INK, node: React.ReactNode = null;
  if (f < 129) { // 1 — rise + highlighter swipe; out: mask up + ink wipe
    const sw = iv(f, 12, 20);
    const out = iv(f, 121, 129, [0, 1], zin);
    node = <>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `translateY(${-out * 400}px)`, filter: `blur(${out * 10}px)` }}>
        <div style={{ ...T, fontSize: 150, color: INK, textAlign: "center" }}>
          <div style={{ overflow: "hidden", padding: "6px 30px" }}><div style={rise(0)}>Alguém pediu</div></div>
          <div style={{ overflow: "hidden", padding: "6px 30px" }}><div style={rise(3)}>o que</div></div>
          <div style={{ overflow: "hidden", padding: "6px 30px" }}><div style={{ ...rise(6), position: "relative", display: "inline-block" }}>
            <span style={{ position: "absolute", left: -14, right: -14, top: "38%", bottom: "-2%", background: Y, transformOrigin: "left", transform: `scaleX(${sw})`, borderRadius: 8 }} />
            <span style={{ position: "relative" }}>você vende.</span></div></div>
        </div></AbsoluteFill>
      {f >= 121 && <AbsoluteFill style={{ background: INK, clipPath: `inset(${(1 - out) * 100}% 0 0 0)` }} />}
    </>;
  } else if (f < 214) { // 2 — ink bg, 3D flip-in; "não viu" struck in yellow; out: split
    bg = INK; fc = LT;
    const flip = iv(f, 129, 141, [-90, 0]);
    const split = iv(f, 206, 214, [0, 1], zin);
    const strike = iv(f, 136, 144);
    const content = <div style={{ ...T, fontSize: 160, color: LT, textAlign: "center", transform: `perspective(1400px) rotateX(${flip}deg)` }}>
      <div>Mas você</div>
      <div style={{ position: "relative", display: "inline-block", color: Y }}>não viu.<span style={{ position: "absolute", left: -10, right: -10, top: "96%", height: 12, background: Y, transformOrigin: "left", transform: `scaleX(${strike})`, opacity: 0.85 }} /></div>
    </div>;
    const half = (top: boolean) => <div style={{ position: "absolute", left: 0, right: 0, top: top ? 0 : 960, height: 960, overflow: "hidden", transform: `translateY(${(top ? -1 : 1) * split * 960}px)` }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: top ? 0 : -960, height: 1920, background: INK, display: "flex", alignItems: "center", justifyContent: "center" }}>{content}</div></div>;
    node = <>{f >= 206 && <AbsoluteFill style={{ background: Y }} />}{half(true)}{half(false)}</>;
  } else if (f < 300) { // 3 — yellow bg, slam; out: collapse to point
    bg = Y; fc = INK;
    const col = iv(f, 292, 300, [0, 1], zin);
    const slam = (s: number) => { const p = sp(s, { damping: 18, stiffness: 380, mass: 0.5 }); return { opacity: f >= s ? 1 : 0, transform: `scale(${1.5 - 0.5 * p})`, filter: `blur(${(1 - Math.min(1, p)) * 10}px)` }; };
    node = <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `scale(${1 - col})` }}>
      <div style={{ ...T, fontSize: 170, color: INK, textAlign: "center" }}><div style={slam(214)}>Nós</div><div style={slam(218)}>encontramos.</div></div>
    </AbsoluteFill>;
  } else if (f < 643) { // 4 — DROP: app reveal; click lead; detail + proof
    const reveal = sp(300, { damping: 16, stiffness: 160, mass: 0.7 });
    const t = Math.min(282, 100 + (f - 300) * 0.9);
    const pan = iv(f, 505, 530, [0, 1], io), zoom = iv(f, 545, 570, [0, 1], io);
    const cx = interpolate(pan, [0, 1], [814, 1580]), cy = interpolate(pan, [0, 1], [560, 470]);
    const s = interpolate(pan, [0, 1], [1.05, 1.7]) * (1 + zoom * 0.1);
    const out = iv(f, 635, 643, [0, 1], zin);
    node = <>
      <AbsoluteFill style={{ background: Y, opacity: iv(f, 300, 309, [0.5, 0]) }} />
      {Array.from({ length: 16 }).map((_, i) => { const p = iv(f, 300, 318); return <div key={i} style={{ position: "absolute", left: 540, top: 1300, width: 100, height: 14, borderRadius: 7, background: i % 2 ? Y : INK, opacity: 1 - p, transform: `rotate(${(i / 16) * Math.PI * 2}rad) translateX(${200 + p * 500}px)` }} />; })}
      <div style={{ transform: `translateY(${(1 - reveal) * 900}px) scale(${1 - out * 0.3})`, opacity: 1 - out, filter: `blur(${out * 10}px)` }}><App t={t} cx={cx} cy={cy} s={s} blur={Math.sin(pan * Math.PI) * 3 + Math.sin(zoom * Math.PI) * 2} /></div>
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center", ...T, fontSize: 124, color: INK, opacity: 1 - out }}>
        <div style={{ overflow: "hidden", padding: "4px 30px" }}><div style={rise(340)}>Cada lead</div></div>
        <div style={{ overflow: "hidden", padding: "4px 30px" }}><div style={{ ...rise(343), display: "inline-block", position: "relative" }}><span style={{ position: "absolute", left: -12, right: -12, top: "38%", bottom: "-2%", background: Y, transformOrigin: "left", transform: `scaleX(${iv(f, 344, 352)})`, borderRadius: 8 }} /><span style={{ position: "relative" }}>vem com prova</span></div></div>
      </div>
    </>;
  } else if (f < 757) { // 5 — benefit, ink, 3D flip; out: yellow iris
    bg = INK; fc = LT;
    const flip = iv(f, 643, 655, [90, 0]);
    const iris = iv(f, 749, 757, [0, 1], io);
    node = <>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ ...T, fontSize: 150, textAlign: "center", transform: `perspective(1400px) rotateY(${flip}deg)` }}><div style={{ color: LT }}>Pague uma vez.</div><div style={{ color: Y, marginTop: 20 }}>Sem mensalidade.</div></div>
      </AbsoluteFill>
      {f >= 749 && <AbsoluteFill style={{ background: Y, clipPath: `circle(${iris * 120}% at 50% 50%)` }} />}
    </>;
  } else { // 6 — logo B + CTA on yellow
    bg = Y; fc = INK;
    const pulse = ((f - 790) % 43) / 43;
    node = <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 520, transform: `scale(${sp(757, { damping: 16, stiffness: 300, mass: 0.6 })})` }}><Img src={staticFile("logoB-yellow.svg")} style={{ width: 920 }} /></div>
      <div style={{ position: "absolute", top: 900, overflow: "hidden", padding: "4px 20px" }}><div style={{ ...rise(763), ...T, fontSize: 112, color: INK }}>Ganhe 3 leads grátis</div></div>
      <div style={{ position: "absolute", top: 1180, opacity: iv(f, 769, 777), transform: `translateY(${(1 - iv(f, 769, 781)) * 40}px)` }}>
        {f > 790 && <div style={{ position: "absolute", inset: 0, borderRadius: 999, border: `5px solid ${INK}`, transform: `scale(${1 + pulse * 0.22})`, opacity: 1 - pulse }} />}
        <div style={{ background: INK, color: Y, borderRadius: 999, padding: "28px 64px", ...T, fontSize: 76, letterSpacing: "-0.02em" }}>minemylead.com</div>
      </div>
    </AbsoluteFill>;
  }
  return <AbsoluteFill style={{ background: bg, overflow: "hidden" }}><style>{FONT}</style><Audio src={staticFile("p30.wav")} /><Floaters f={f} c={fc} />{node}</AbsoluteFill>;
};
