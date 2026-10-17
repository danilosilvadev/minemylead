import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
const A = "#7468B8", TX = "#14161A", MU = "#6B7280", LN = "#E5E7EB";
const FONT = `@font-face{font-family:IV;src:url(${staticFile("InterVar.ttf")});font-weight:100 900}`;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ez = Easing.bezier(0.22, 1, 0.36, 1);
const iv = (f: number, a: number, b: number, o: [number, number] = [0, 1], e = ez) => interpolate(f, [a, b], o, { ...cl, easing: e });
const DROP = 90;
const W: React.CSSProperties = { fontFamily: "IV", fontVariationSettings: "'opsz' 32", letterSpacing: "-0.04em" };

const TypeOn = ({ t, f, start, cps = 1.4 }: { t: string; f: number; start: number; cps?: number }) => {
  const n = Math.max(0, Math.floor((f - start) * cps));
  return <>{t.split("").map((c, i) => <span key={i} style={{ opacity: i < n ? 1 : 0, display: "inline-block", transform: `translateY(${i < n ? 0 : 20}px)` }}>{c === " " ? "\u00A0" : c}</span>)}</>;
};

export const Sample: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  // phase 1: type-on (0-47), glitch+morph (47-61), collapse into bubble (61-75), flip to card (75-89), slam (90+)
  const collapse = iv(f, 61, 74);
  const flip = iv(f, 75, 86, [0, 180], Easing.inOut(Easing.cubic));
  const cardOut = iv(f, DROP - 2, DROP + 6);
  const glitch = f >= 47 && f < 56;
  const jx = glitch ? ((f * 37) % 13) - 6 : 0;
  const morph = iv(f, 49, 60);
  const swipe = iv(f, 60, 68);
  const shake = f >= DROP && f < DROP + 8 ? Math.sin(f * 3.1) * (DROP + 8 - f) * 2.2 : 0;
  const flash = iv(f, DROP, DROP + 7, [0.22, 0]);
  const beat = (n: number) => DROP + Math.round(n * 7.14);
  const slam = (s: number) => { const p = spring({ frame: f - s, fps, config: { damping: 13, stiffness: 260, mass: 0.6 } }); return { opacity: f >= s ? 1 : 0, transform: `scale(${2.6 - 1.6 * p})`, filter: `blur(${(1 - Math.min(1, p)) * 8}px)` }; };
  const textLayerOpacity = 1 - iv(f, 64, 72);
  return (
    <AbsoluteFill style={{ background: "#FFFFFF", ...W, color: TX, overflow: "hidden" }}>
      <style>{FONT}</style>
      <Audio src={staticFile("sample.wav")} />
      {/* subtle grid */}
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${LN} 1.6px, transparent 1.6px)`, backgroundSize: "48px 48px", opacity: 0.7 }} />
      <AbsoluteFill style={{ background: A, opacity: f >= DROP ? flash : 0 }} />

      {/* Act 1: kinetic headline */}
      {f < 76 && (
        <AbsoluteFill style={{ justifyContent: "center", padding: "0 90px", opacity: textLayerOpacity, transform: `translateY(${collapse * 120}px) scale(${1 - collapse * 0.55})` }}>
          <div style={{ fontSize: 118, fontWeight: 800, lineHeight: 1.02 }}>
            <div><TypeOn t="Alguém" f={f} start={2} /></div>
            <div><TypeOn t="acabou de" f={f} start={12} /></div>
            <div style={{ position: "relative", height: 260 }}>
              {/* 'pedir...' scattering */}
              <div style={{ position: "absolute", color: A, transform: `translateX(${jx}px)`, textShadow: glitch ? `4px 0 #FF3B6B, -4px 0 #22C3E6` : "none" }}>
                {"pedir...".split("").map((c, i) => {
                  const shown = f >= 26 + i * 1.5;
                  const dx = (i - 3) * 40 * morph, dy = -180 * morph * (0.6 + (i % 3) * 0.3), r = (i % 2 ? 1 : -1) * 40 * morph;
                  return <span key={i} style={{ display: "inline-block", opacity: shown ? 1 - morph : 0, transform: `translate(${dx}px,${dy}px) rotate(${r}deg)` }}>{c}</span>;
                })}
              </div>
              {/* 'o que você vende' rising through a mask */}
              <div style={{ position: "absolute", top: 0 }}>
                {["o que", "você vende"].map((w, i) => (
                  <div key={w} style={{ overflow: "hidden", padding: "0 14px", margin: "0 -14px" }}><div style={{ transform: `translateY(${(1 - iv(f, 50 + i * 4, 62 + i * 4)) * 130}%)`, position: "relative", width: "fit-content" }}>
                    {i === 1 && <span style={{ position: "absolute", left: -10, right: -10, top: "18%", bottom: "8%", background: A, transformOrigin: "left", transform: `scaleX(${swipe})`, borderRadius: 10, zIndex: 0 }} />}
                    <span style={{ position: "relative", color: i === 1 && swipe > 0.5 ? "#fff" : TX }}>{w}</span>
                  </div></div>
                ))}
              </div>
            </div>
          </div>
          {/* caret */}
          {f < 47 && <div style={{ width: 8, height: 110, background: A, opacity: Math.floor(f / 8) % 2 ? 1 : 0.2, position: "absolute", left: 90, bottom: 640 }} />}
        </AbsoluteFill>
      )}

      {/* Act 2: bubble -> card flip */}
      {f >= 64 && f < DROP + 8 && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", perspective: 1600, opacity: 1 - cardOut, transform: `scale(${(0.6 + 0.4 * iv(f, 64, 76)) * (1 + cardOut * 0.6)})` }}>
          <div style={{ width: 860, height: 470, position: "relative", transformStyle: "preserve-3d", transform: `rotateY(${flip}deg)` }}>
            {/* front: comment bubble */}
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", background: "#fff", border: `2px solid ${LN}`, borderRadius: 44, borderBottomLeftRadius: 8, padding: 54, boxShadow: "0 40px 90px rgba(20,22,26,.12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
                <div style={{ width: 84, height: 84, borderRadius: 42, background: "#C9CED6", color: "#fff", fontSize: 40, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>M</div>
                <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em" }}>@marcos.antunes.br<div style={{ fontSize: 28, color: MU, fontWeight: 500 }}>comentou agora</div></div>
              </div>
              <div style={{ fontSize: 50, fontWeight: 700, marginTop: 36, lineHeight: 1.15, letterSpacing: "-0.03em" }}>Alguém indica empresa de energia solar no Paraná?</div>
            </div>
            {/* back: lead card */}
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "#fff", border: `2px solid ${LN}`, borderRadius: 32, padding: 50, boxShadow: "0 40px 90px rgba(116,104,184,.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: MU, fontWeight: 600, letterSpacing: "-0.01em" }}>
                <span style={{ background: "#F7F8FA", border: `2px solid ${LN}`, borderRadius: 999, padding: "6px 20px" }}>LEAD</span>
                <span style={{ background: A, color: "#fff", borderRadius: 999, padding: "6px 20px" }}>Quente</span>
              </div>
              <div style={{ fontSize: 46, fontWeight: 800, marginTop: 28 }}>@marcos.antunes.br</div>
              <div style={{ fontSize: 32, color: MU, fontWeight: 500, marginTop: 8, letterSpacing: "-0.01em" }}>Quer energia solar na padaria · PR</div>
              <div style={{ height: 2, background: LN, margin: "30px 0" }} />
              <div style={{ fontSize: 30, color: MU, fontWeight: 600, letterSpacing: "-0.01em" }}>link do comentário ↗</div>
              {/* proof badge pop */}
              <div style={{ position: "absolute", right: 40, top: 40, transform: `scale(${spring({ frame: f - 82, fps, config: { damping: 9, stiffness: 300 } })}) rotate(-8deg)`, background: TX, color: "#fff", borderRadius: 24, padding: "18px 30px", fontSize: 44, fontWeight: 800, boxShadow: "0 16px 40px rgba(0,0,0,.25)" }}>✓ PROVA</div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* Act 3: slam */}
      {f >= DROP && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `translate(${shake}px,${shake * 0.4}px)` }}>
          <div style={{ fontSize: 196, fontWeight: 900, lineHeight: 0.95, textAlign: "center", letterSpacing: "-0.055em", fontVariationSettings: "'opsz' 32" }}>
            <div style={slam(beat(0))}>Quem já</div>
            <div style={slam(beat(1))}>precisa</div>
            <div style={{ ...slam(beat(2)), color: A }}>de você.</div>
          </div>
          <div style={{ position: "absolute", bottom: 300, display: "flex", alignItems: "center", gap: 18, fontSize: 52, fontWeight: 700, letterSpacing: "-0.03em", opacity: iv(f, beat(4), beat(5)), transform: `translateY(${(1 - iv(f, beat(4), beat(5))) * 30}px)` }}>
            <span style={{ width: 46, height: 46, borderRadius: 12, background: A }} />minemylead
          </div>
          {/* burst lines */}
          {Array.from({ length: 14 }).map((_, i) => { const p = iv(f, DROP, DROP + 14); const a = (i / 14) * Math.PI * 2; return <div key={i} style={{ position: "absolute", width: 80, height: 10, borderRadius: 5, background: i % 2 ? A : TX, opacity: 1 - p, transform: `rotate(${a}rad) translateX(${300 + p * 380}px)` }} />; })}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
