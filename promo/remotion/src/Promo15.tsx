import React from "react";
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Lines, Logo, App, Floaters, Cursor, A, D, TX, TINT, SOFT, FONT, T, iv, zin, io } from "./Promo";
const FAST = { damping: 22, stiffness: 420, mass: 0.5 };
export const Promo15: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const sp = (s: number, c: any = FAST) => spring({ frame: f - s, fps, config: c });
  let bg = "#fff", fl = A, node: React.ReactNode = null;
  if (f < 80) { // hook 1, zoom-through 'pedir'
    const z = Math.pow(40, iv(f, 72, 80, [0, 1], zin));
    node = <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", filter: `blur(${iv(f, 72, 80, [0, 12], zin)}px)` }}>
      <div style={{ ...T, fontSize: 150, textAlign: "center" }}>
        {["Alguém", "acabou de", "pedir"].map((w, i) => { const p = sp(i * 2); return <div key={w} style={{ overflow: i < 2 ? "hidden" : "visible", padding: "4px 30px" }}><div style={{ transform: `translateY(${(1 - p) * 115}%) ${i === 2 ? `scale(${z})` : ""}`, transformOrigin: "50% 55%", color: i === 2 ? A : TX }}>{w}</div></div>; })}
      </div></AbsoluteFill>;
  } else if (f < 157) { // hook 2 on purple, collapse to point
    bg = A; fl = "#fff";
    const col = iv(f, 152, 157, [0, 1], zin);
    const sc = (i: number) => { const p = sp(80 + i * 2); return { opacity: Math.min(1, p * 2), transform: `scale(${2.2 - 1.2 * p})`, filter: `blur(${Math.max(0, 1 - p) * 10}px)` }; };
    node = <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `scale(${1 - col})` }}>
      <div style={{ ...T, fontSize: 168, color: "#fff", textAlign: "center" }}>
        <div style={sc(0)}>o que</div>
        <div style={{ ...sc(1), display: "inline-block", margin: "8px 0", background: "#fff", color: A, borderRadius: 20, padding: "0 20px" }}>você</div>
        <div style={sc(2)}>vende.</div>
      </div></AbsoluteFill>;
  } else if (f < 257) { // drop + logo, whip-pan out
    const shake = f < 165 ? Math.sin(f * 3.3) * (165 - f) * 2.2 : 0;
    const whip = iv(f, 250, 257, [0, 1], zin);
    const rows: [string, number, string][] = [["Quem já", 157, TX], ["precisa", 161, TX], ["de você.", 165, A]];
    node = <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `translate(${shake - whip * 1100}px,${shake * 0.4}px)`, filter: `blur(${whip * 16}px)` }}>
      <AbsoluteFill style={{ background: A, opacity: iv(f, 157, 166, [0.3, 0]) }} />
      {Array.from({ length: 16 }).map((_, i) => { const p = iv(f, 157, 173); return <div key={i} style={{ position: "absolute", width: 100, height: 14, borderRadius: 7, background: i % 2 ? A : TX, opacity: 1 - p, transform: `rotate(${(i / 16) * Math.PI * 2}rad) translateX(${340 + p * 420}px)` }} />; })}
      <div style={{ position: "absolute", top: 520, ...T, fontSize: 196, fontWeight: 900, letterSpacing: "-0.055em", textAlign: "center" }}>
        {rows.map(([w, s, c]) => { const p = sp(s, { damping: 18, stiffness: 380, mass: 0.5 }); return <div key={w} style={{ height: 205, display: "flex", alignItems: "center", justifyContent: "center", color: c, opacity: f >= s ? 1 : 0, transform: `scale(${1.22 - 0.22 * p})`, filter: `blur(${(1 - Math.min(p, 1)) * 10}px)` }}>{w}</div>; })}
      </div>
      <div style={{ position: "absolute", top: 1330, opacity: iv(f, 168, 178), transform: `translateY(${(1 - sp(168)) * 60}px)` }}><Logo s={1.25} /></div>
    </AbsoluteFill>;
  } else if (f < 343) { // app: lead opens with proof, iris out
    bg = SOFT;
    const enter = iv(f, 257, 266, [1, 0], io);
    const t = Math.min(282, 222 + (f - 257) * 1.1);
    const pan = iv(f, 300, 322, [0, 1], io);
    const cx = interpolate(pan, [0, 1], [814, 1580]), cy = interpolate(pan, [0, 1], [560, 470]), s = interpolate(pan, [0, 1], [1.05, 1.87]);
    node = <>
      <div style={{ transform: `translateX(${enter * 1100}px)`, filter: `blur(${enter * 14}px)` }}><App t={t} cx={cx} cy={cy} s={s} blur={Math.sin(pan * Math.PI) * 3} /></div>
      <div style={{ position: "absolute", top: 200, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Lines ls={["Cada lead", "vem com prova"]} size={124} start={250} f={f} stagger={2} hi={{ 1: A }} cfg={FAST} />
      </div>
      {f >= 335 && <AbsoluteFill style={{ background: "#fff", clipPath: `circle(${iv(f, 335, 343, [0, 1], io) * 120}% at 50% 70%)` }} />}
    </>;
  } else { // CTA
    const pulse = ((f - 360) % 43) / 43;
    node = <AbsoluteFill style={{ background: "#fff", alignItems: "center" }}>
      <div style={{ position: "absolute", top: 300, opacity: iv(f, 343, 351) }}><Logo s={1} /></div>
      <div style={{ position: "absolute", top: 600 }}><Lines ls={["Ganhe"]} size={140} start={343} f={f} cfg={FAST} /></div>
      <div style={{ position: "absolute", top: 800, ...T, fontSize: 132, background: A, color: "#fff", borderRadius: 32, padding: "10px 40px 22px", transform: `scale(${sp(345, { damping: 22, stiffness: 420, mass: 0.5 })})` }}>3 leads grátis</div>
      <div style={{ position: "absolute", top: 1210, opacity: iv(f, 345, 353) }}>
        {f > 360 && <div style={{ position: "absolute", inset: 0, borderRadius: 999, border: `4px solid ${A}`, transform: `scale(${1 + pulse * 0.25})`, opacity: 1 - pulse }} />}
        <div style={{ border: `4px solid ${TX}`, borderRadius: 999, padding: "26px 60px", fontFamily: "IV", fontWeight: 800, fontSize: 72, letterSpacing: "-0.03em", color: TX }}>minemylead.com</div>
      </div>
    </AbsoluteFill>;
  }
  return <AbsoluteFill style={{ background: bg, overflow: "hidden" }}><style>{FONT}</style><Audio src={staticFile("p15.wav")} /><Floaters f={f} c={fl} />{node}{f >= 250 && f < 257 && <div style={{ position: "absolute", top: 200, left: 0, right: 0, display: "flex", justifyContent: "center" }}><Lines ls={["Cada lead", "vem com prova"]} size={124} start={250} f={f} stagger={2} hi={{ 1: A }} cfg={FAST} /></div>}</AbsoluteFill>;
};
