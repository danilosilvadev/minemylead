import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
const A = "#7468B8", TX = "#14161A", MU = "#6B7280", LN = "#E5E7EB";
const FONT = `@font-face{font-family:IV;src:url(${staticFile("InterVar.ttf")});font-weight:100 900}`;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ez = Easing.bezier(0.22, 1, 0.36, 1), zin = Easing.bezier(0.7, 0, 0.84, 0);
const iv = (f: number, a: number, b: number, o: [number, number] = [0, 1], e = ez) => interpolate(f, [a, b], o, { ...cl, easing: e });
const B = (n: number) => Math.round(n * 14.2857);
// cuts on 126 BPM grid (30fps): S1 0-4b, S2 4-8b, S3 8-11b, S4 11-14b, drop 14b
const C1 = B(4), C2 = B(8), C3 = B(11), DROP = B(14);
const T: React.CSSProperties = { fontFamily: "IV", fontWeight: 850, letterSpacing: "-0.045em", lineHeight: 1, color: TX };
// zoom-in: scale explodes exponentially over the last frames before a cut
const zoomOut = (f: number, cut: number, d = 7, max = 40) => Math.pow(max, iv(f, cut - d, cut, [0, 1], zin));
const blurV = (f: number, cut: number, d = 7) => iv(f, cut - d, cut, [0, 14], zin);

const Grid = ({ f, depth }: { f: number; depth: number }) => (
  <AbsoluteFill style={{ backgroundImage: `radial-gradient(${LN} 2px, transparent 2px)`, backgroundSize: "54px 54px", transform: `scale(${depth}) translateY(${-f * 0.6}px)`, opacity: 0.8 }} />
);
const Floaters = ({ f, s }: { f: number; s: number }) => (
  <AbsoluteFill>{[[140, 300, 90], [860, 420, 60], [200, 1500, 70], [900, 1650, 110], [520, 220, 40]].map(([x, y, r], i) => (
    <div key={i} style={{ position: "absolute", left: x, top: y - f * (0.8 + i * 0.35), width: r, height: r, borderRadius: i % 2 ? r / 2 : 18, border: `3px solid ${i % 2 ? A : LN}`, opacity: 0.35, transform: `scale(${1 + (s - 1) * (0.3 + i * 0.15)}) rotate(${f * (i % 2 ? 0.6 : -0.4)}deg)` }} />
  ))}</AbsoluteFill>
);

export const V2: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const sp = (s: number, cfg = { damping: 14, stiffness: 180, mass: 0.7 }) => spring({ frame: f - s, fps, config: cfg });
  let scene: React.ReactNode = null, cam = 1;

  if (f < C1) {
    // S1: "Alguém / acabou de / pedir" type-on, hold, zoom into "pedir"
    const words = ["Alguém", "acabou de", "pedir"];
    const z = zoomOut(f, C1, 8, 30); cam = z;
    scene = (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", filter: `blur(${blurV(f, C1, 8)}px)` }}>
        <div style={{ ...T, fontSize: 150, textAlign: "center" }}>
          {words.map((w, i) => { const p = sp(2 + i * 4); return (
            <div key={w} style={{ overflow: "hidden", padding: "6px 20px" }}>
              <div style={{ transform: `translateY(${(1 - p) * 110}%)`, color: i === 2 ? A : TX, transformOrigin: "50% 60%", ...(i === 2 ? { transform: `translateY(${(1 - p) * 110}%) scale(${z})` } : {}) }}>{w}</div>
            </div>); })}
        </div>
      </AbsoluteFill>);
    cam = 1 + (z - 1) * 0.02;
  } else if (f < C2) {
    // S2: purple fill (inside of 'pedir') shrinks into "o que / você / vende"; zoom into the 'o' of você
    const l = f - C1;
    const fill = 1 - iv(f, C1, C1 + 9);
    const z = zoomOut(f, C2, 8, 60);
    const settle = (i: number) => sp(C1 + 3 + i * 3, { damping: 12, stiffness: 200, mass: 0.6 });
    scene = (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ ...T, fontSize: 168, textAlign: "center", transform: `scale(${z})`, transformOrigin: "476px 54.5%", filter: `blur(${blurV(f, C2, 8) * 0.6}px)`, width: 1080 }}>
          <div style={{ opacity: settle(0), transform: `scale(${2.2 - 1.2 * settle(0)})` }}>o que</div>
          <div style={{ position: "relative", display: "inline-block", opacity: settle(1), transform: `scale(${2.2 - 1.2 * settle(1)})`, margin: "10px 0" }}>
            <span style={{ position: "absolute", left: -18, right: -18, top: "6%", bottom: "-4%", background: A, borderRadius: 18, transformOrigin: "left", transform: `scaleX(${iv(f, C1 + 18, C1 + 26)})` }} />
            <span style={{ position: "relative", color: iv(f, C1 + 18, C1 + 26) > 0.5 ? "#fff" : TX }}>você</span>
          </div>
          <div style={{ opacity: settle(2), transform: `scale(${2.2 - 1.2 * settle(2)})` }}>vende</div>
        </div>
        <AbsoluteFill style={{ background: A, opacity: fill, transform: `scale(${0.4 + fill * 0.6})`, borderRadius: (1 - fill) * 400 }} />
      </AbsoluteFill>);
    cam = 1 + l * 0.0015;
  } else if (f < C3) {
    // S3: the white 'o' interior → avatar circle; comment bubble builds; zoom into it (becomes the proof screenshot)
    const g = sp(C2, { damping: 16, stiffness: 120, mass: 0.8 });
    const z = zoomOut(f, C3, 8, 4);
    const av = interpolate(g, [0, 1], [2400, 130]);
    scene = (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: A }}>
        <AbsoluteFill style={{ background: "#fff", opacity: g }} />
        <div style={{ position: "relative", width: 900, transform: `scale(${z})`, filter: `blur(${blurV(f, C3, 8) * 0.4}px)` }}>
          <div style={{ background: "#fff", border: `3px solid ${LN}`, borderRadius: 48, borderBottomLeftRadius: 10, padding: "56px 56px 60px", boxShadow: "0 50px 100px rgba(20,22,26,.12)", opacity: iv(f, C2 + 8, C2 + 14), transform: `translateY(${(1 - iv(f, C2 + 8, C2 + 16)) * 60}px)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
              <div style={{ width: 130, height: 130 }} />
              <div style={{ ...T, fontSize: 44, fontWeight: 700, letterSpacing: "-0.02em" }}>@marcos.antunes.br<div style={{ fontSize: 32, color: MU, fontWeight: 500, marginTop: 6 }}>comentou agora · YouTube</div></div>
            </div>
            <div style={{ ...T, fontSize: 78, marginTop: 40, lineHeight: 1.08 }}>
              {["Indica energia", "solar no Paraná?"].map((w, i) => <div key={w} style={{ opacity: iv(f, C2 + 12 + i * 4, C2 + 18 + i * 4), transform: `translateY(${(1 - iv(f, C2 + 12 + i * 4, C2 + 20 + i * 4)) * 30}px)` }}>{w}</div>)}
            </div>
          </div>
          {/* avatar: the 'o' shrinking into place */}
          <div style={{ position: "absolute", left: 56 + 65 - av / 2, top: 56 + 65 - av / 2, width: av, height: av, borderRadius: av / 2, background: g > 0.98 ? "#C9CED6" : A, border: g < 0.98 ? `${Math.max(6, av * 0.2)}px solid #fff` : "none", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "IV", fontWeight: 800, fontSize: 60 }}>{g > 0.98 ? "M" : ""}</div>
        </div>
      </AbsoluteFill>);
  } else if (f < DROP) {
    // S4: pull back from the screenshot to reveal the lead card in the app; PROVA badge pops
    const pb = sp(C3, { damping: 18, stiffness: 110, mass: 0.9 });
    const s = interpolate(pb, [0, 1], [3.2, 1]);
    const z = zoomOut(f, DROP, 6, 1.6);
    scene = (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 920, background: "#fff", border: `3px solid ${LN}`, borderRadius: 36, padding: 50, boxShadow: "0 50px 110px rgba(116,104,184,.22)", transform: `scale(${s * z})`, transformOrigin: "50% 62%", filter: `blur(${Math.abs(1 - pb) * 6 + blurV(f, DROP, 6) * 0.8}px)`, opacity: 1 - iv(f, DROP - 4, DROP) }}>
          <div style={{ display: "flex", gap: 16, fontFamily: "IV", fontSize: 32, fontWeight: 650, opacity: iv(f, C3 + 8, C3 + 14) }}>
            <span style={{ background: "#F7F8FA", border: `2px solid ${LN}`, borderRadius: 999, padding: "6px 22px", color: MU }}>Lead</span>
            <span style={{ background: A, color: "#fff", borderRadius: 999, padding: "6px 22px" }}>Quente</span>
          </div>
          <div style={{ ...T, fontSize: 56, marginTop: 26, opacity: iv(f, C3 + 10, C3 + 16) }}>@marcos.antunes.br</div>
          <div style={{ fontFamily: "IV", fontSize: 30, color: MU, margin: "26px 0 12px", fontWeight: 600, opacity: iv(f, C3 + 10, C3 + 16) }}>Prova</div>
          <div style={{ border: `2px solid ${LN}`, borderRadius: 18, padding: "26px 28px", display: "flex", gap: 20, background: "#FAFBFC" }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: "#C9CED6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "IV", fontWeight: 800, fontSize: 30, flexShrink: 0 }}>M</div>
            <div style={{ fontFamily: "IV", fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2 }}>Indica energia solar no Paraná?</div>
          </div>
          <div style={{ fontFamily: "IV", fontSize: 30, color: A, fontWeight: 650, marginTop: 22, opacity: iv(f, C3 + 14, C3 + 20) }}>link do comentário ↗</div>
          <div style={{ position: "absolute", right: -36, top: -46, transform: `scale(${sp(C3 + 12, { damping: 9, stiffness: 320, mass: 0.6 })}) rotate(-7deg)`, background: TX, color: "#fff", borderRadius: 26, padding: "20px 34px", fontFamily: "IV", fontSize: 52, fontWeight: 850, letterSpacing: "-0.02em", boxShadow: "0 18px 44px rgba(0,0,0,.25)" }}>✓ PROVA</div>
        </div>
      </AbsoluteFill>);
    cam = 1;
  } else {
    // S5: drop slam, stacked rows of fixed height (no overlap)
    const rows: [string, number, string][] = [["Quem já", DROP, TX], ["precisa", DROP + 7, TX], ["de você.", DROP + 14, A]];
    const shake = f < DROP + 8 ? Math.sin(f * 3.3) * (DROP + 8 - f) * 2 : 0;
    scene = (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `translate(${shake}px,${shake * 0.4}px)` }}>
        <AbsoluteFill style={{ background: A, opacity: iv(f, DROP, DROP + 8, [0.25, 0]) }} />
        {Array.from({ length: 14 }).map((_, i) => { const p = iv(f, DROP, DROP + 14); return <div key={i} style={{ position: "absolute", width: 90, height: 12, borderRadius: 6, background: i % 2 ? A : TX, opacity: 1 - p, transform: `rotate(${(i / 14) * Math.PI * 2}rad) translateX(${320 + p * 400}px)` }} />; })}
        <div style={{ ...T, fontSize: 190, fontWeight: 900, letterSpacing: "-0.055em", textAlign: "center" }}>
          {rows.map(([w, s, c]) => { const p = sp(s, { damping: 15, stiffness: 300, mass: 0.6 }); return (
            <div key={w} style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: c, opacity: f >= s ? 1 : 0, transform: `scale(${1.22 - 0.22 * p}) translateY(${(1 - p) * -24}px)`, filter: `blur(${(1 - Math.min(p, 1)) * 10}px)` }}>{w}</div>); })}
        </div>
        <div style={{ position: "absolute", bottom: 300, display: "flex", alignItems: "center", gap: 20, fontFamily: "IV", fontSize: 56, fontWeight: 750, letterSpacing: "-0.03em", opacity: iv(f, B(16), B(17)) }}>
          <span style={{ width: 50, height: 50, borderRadius: 13, background: A }} />minemylead
        </div>
      </AbsoluteFill>);
  }
  return (
    <AbsoluteFill style={{ background: "#fff", overflow: "hidden" }}>
      <style>{FONT}</style>
      <Audio src={staticFile("v2.wav")} />
      <Grid f={f} depth={1 + (cam - 1) * 0.3} />
      <Floaters f={f} s={cam} />
      <AbsoluteFill style={{ transform: `scale(${cam})` }}>{scene}</AbsoluteFill>
    </AbsoluteFill>
  );
};
