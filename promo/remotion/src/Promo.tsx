import React from "react";
import { AbsoluteFill, Audio, Easing, Freeze, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Inbox } from "../../../mml-restore/remotion2/src/Inbox";
const A = "#7468B8", D = "#1F2329", TX = "#14161A", MU = "#6B7280", LN = "#E5E7EB", TINT = "#EEEDF9", SOFT = "#F7F8FA";
const FONT = `@font-face{font-family:IV;src:url(${staticFile("InterVar.ttf")});font-weight:100 900}`;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ez = Easing.bezier(0.22, 1, 0.36, 1), zin = Easing.bezier(0.7, 0, 0.84, 0), io = Easing.inOut(Easing.cubic);
const iv = (f: number, a: number, b: number, o: [number, number] = [0, 1], e = ez) => interpolate(f, [a, b], o, { ...cl, easing: e });
const F = (b: number) => Math.round((b * 100) / 7);
const T: React.CSSProperties = { fontFamily: "IV", fontWeight: 850, letterSpacing: "-0.045em", lineHeight: 1.02 };

const Floaters = ({ f, c = A, k = 1 }: { f: number; c?: string; k?: number }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>{[[90, 260, 80], [930, 360, 54], [150, 1560, 64], [920, 1700, 100], [600, 140, 36], [40, 980, 44]].map(([x, y, r], i) => (
    <div key={i} style={{ position: "absolute", left: x, top: ((y - f * (0.7 + i * 0.3) * k) % 2100 + 2100) % 2100 - 100, width: r, height: r, borderRadius: i % 2 ? r / 2 : 16, border: `3px solid ${c}`, opacity: 0.22, transform: `rotate(${f * (i % 2 ? 0.5 : -0.4)}deg)` }} />))}</AbsoluteFill>
);
const Lines = ({ ls, size, color = TX, start, f, stagger = 4, hi, cfg = { damping: 15, stiffness: 170, mass: 0.7 } }: { ls: string[]; size: number; color?: string; start: number; f: number; stagger?: number; hi?: Record<number, string>; cfg?: any }) => {
  const { fps } = useVideoConfig();
  return <div style={{ ...T, fontSize: size, color, textAlign: "center" }}>{ls.map((l, i) => {
    const p = spring({ frame: f - start - i * stagger, fps, config: cfg });
    return <div key={i} style={{ overflow: "hidden", padding: "4px 30px" }}><div style={{ transform: `translateY(${(1 - p) * 115}%)`, color: hi?.[i] ?? color }}>{l}</div></div>;
  })}</div>;
};
const Logo = ({ s = 1, c = TX }: { s?: number; c?: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 20 * s, fontFamily: "IV", fontSize: 64 * s, fontWeight: 800, letterSpacing: "-0.035em", color: c }}><span style={{ width: 58 * s, height: 58 * s, borderRadius: 15 * s, background: A }} />minemylead</div>
);
const Cursor = ({ x, y, press = 1, ring = 0 }: { x: number; y: number; press?: number; ring?: number }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `scale(${press})`, transformOrigin: "0 0" }}>
    {ring > 0 && ring < 1 && <div style={{ position: "absolute", left: -40, top: -40, width: 80, height: 80, borderRadius: 40, border: `5px solid ${A}`, opacity: 1 - ring, transform: `scale(${0.5 + ring * 1.4})` }} />}
    <svg width="46" height="52" viewBox="0 0 20 22"><path d="M2 1l15 11-7 1-4 7z" fill="#1F2329" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" /></svg>
  </div>
);
// Real app Inbox, frozen at an internal frame, seen through a camera (cx,cy in 1920x1080 comp space)
const VT = 760, VH = 1080;
const App = ({ t, cx, cy, s, blur = 0, children }: { t: number; cx: number; cy: number; s: number; blur?: number; children?: React.ReactNode }) => (
  <div style={{ position: "absolute", left: 30, right: 30, top: VT, height: VH, borderRadius: 36, overflow: "hidden", boxShadow: "0 40px 100px rgba(31,35,40,.16)", border: `2px solid ${LN}`, background: "#fff" }}>
    <div style={{ position: "absolute", width: 1920, height: 1080, transformOrigin: "0 0", transform: `translate(${510 - cx * s}px,${VH / 2 - cy * s}px) scale(${s})`, filter: blur ? `blur(${blur}px)` : undefined }}>
      <Freeze frame={Math.round(t)}><Inbox locale="pt" /></Freeze>
    </div>
    {children}
  </div>
);
const toScreen = (X: number, Y: number, cx: number, cy: number, s: number) => [30 + 510 + (X - cx) * s, VT + VH / 2 + (Y - cy) * s];

const Pill = ({ n, f, at }: { n: string; f: number; at: number }) => {
  const r = iv(f, at - 8, at + 6, [180, 0], io);
  return <div style={{ width: 96, height: 96, borderRadius: 28, background: A, color: "#fff", ...T, fontSize: 58, display: "flex", alignItems: "center", justifyContent: "center", transform: `perspective(600px) rotateX(${r}deg)`, marginBottom: 26 }}>{n}</div>;
};
const YT = () => <div style={{ width: 150, height: 150, borderRadius: 38, background: "#FF0033", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="70" height="70" viewBox="0 0 24 24"><path d="M8 5l12 7-12 7z" fill="#fff" /></svg></div>;
const XL = () => <div style={{ width: 150, height: 150, borderRadius: 38, background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "IV", fontWeight: 800, fontSize: 84 }}>𝕏</div>;
const IG = () => <div style={{ width: 150, height: 150, borderRadius: 38, background: "linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="#fff" /></svg></div>;

export const Promo: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const sp = (s: number, c = { damping: 14, stiffness: 180, mass: 0.7 }) => spring({ frame: f - s, fps, config: c });
  let bg = "#fff", fl = A, node: React.ReactNode = null;

  if (f < 114) { // 1. hook part 1 — zoom-through 'pedir'
    const z = Math.pow(40, iv(f, 106, 114, [0, 1], zin));
    node = <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", filter: `blur(${iv(f, 106, 114, [0, 12], zin)}px)` }}>
      <div style={{ ...T, fontSize: 150, textAlign: "center" }}>
        {["Alguém", "acabou de", "pedir"].map((w, i) => { const p = sp(2 + i * 5); return <div key={w} style={{ overflow: i < 2 ? "hidden" : "visible", padding: "4px 30px" }}><div style={{ transform: `translateY(${(1 - p) * 115}%) ${i === 2 ? `scale(${z})` : ""}`, transformOrigin: "50% 55%", color: i === 2 ? A : TX }}>{w}</div></div>; })}
      </div></AbsoluteFill>;
  } else if (f < 229) { // 2. hook part 2 on purple; out = 3D flip
    bg = A; fl = "#fff";
    const flip = iv(f, 219, 229, [0, 90], zin);
    const sc = (i: number) => { const p = sp(116 + i * 6, { damping: 13, stiffness: 190, mass: 0.6 }); return { opacity: Math.min(1, p * 2), transform: `scale(${2.4 - 1.4 * p})`, filter: `blur(${Math.max(0, 1 - p) * 10}px)` }; };
    const sw = iv(f, 132, 142);
    node = <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `perspective(1400px) rotateY(${flip}deg)` }}>
      <div style={{ ...T, fontSize: 168, color: "#fff", textAlign: "center" }}>
        <div style={sc(0)}>o que</div>
        <div style={{ ...sc(1), position: "relative", display: "inline-block", margin: "8px 0" }}><span style={{ position: "absolute", left: -20, right: -20, top: "8%", bottom: "-2%", background: "#fff", borderRadius: 20, transformOrigin: "left", transform: `scaleX(${sw})` }} /><span style={{ position: "relative", color: sw > 0.5 ? A : "#fff" }}>você</span></div>
        <div style={sc(2)}>vende.</div>
      </div></AbsoluteFill>;
  } else if (f < 343) { // 3. problem on dark; comment drifts away; out = split screen
    bg = D; fl = "#fff";
    const flip = iv(f, 229, 241, [-90, 0], ez);
    const split = iv(f, 333, 346, [0, 1], zin);
    const drift = iv(f, 250, 330, [0, 1], Easing.inOut(Easing.quad));
    const half = (top: boolean) => (
      <div style={{ position: "absolute", left: 0, right: 0, top: top ? 0 : 960, height: 960, overflow: "hidden", transform: `translateY(${(top ? -1 : 1) * split * 960}px)` }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: top ? 0 : -960, height: 1920, background: D }}>
          <AbsoluteFill style={{ alignItems: "center" }}>
            <div style={{ position: "absolute", top: 380, width: 640, padding: 36, borderRadius: 36, borderBottomLeftRadius: 8, background: "rgba(255,255,255,.08)", border: "2px solid rgba(255,255,255,.14)", transform: `translate(${drift * 260}px,${drift * -160}px) scale(${1 - drift * 0.5}) rotate(${drift * 14}deg)`, opacity: 1 - drift, filter: `blur(${drift * 6}px)` }}>
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}><div style={{ width: 70, height: 70, borderRadius: 35, background: "rgba(255,255,255,.25)" }} /><div style={{ width: 240, height: 22, borderRadius: 11, background: "rgba(255,255,255,.25)" }} /></div>
              <div style={{ width: 520, height: 26, borderRadius: 13, background: "rgba(255,255,255,.3)", marginTop: 30 }} /><div style={{ width: 380, height: 26, borderRadius: 13, background: "rgba(255,255,255,.3)", marginTop: 16 }} />
            </div>
            <div style={{ position: "absolute", top: 860, transform: `perspective(1400px) rotateY(${flip}deg)` }}><Lines ls={["Mas o comentário", "se perde."]} size={128} color="#fff" start={229} f={f} hi={{ 1: "#B9B2E6" }} /></div>
          </AbsoluteFill>
        </div>
      </div>);
    node = <>{f >= 333 && <D4 f={f} />}{half(true)}{half(false)}</>;
    bg = f >= 333 ? TINT : D;
  } else if (f < 471) { // 4. cold message on tint; out = collapse to point → dark beat
    bg = TINT;
    node = f < 457 ? <D4 f={f} /> : <AbsoluteFill style={{ background: D, justifyContent: "center", alignItems: "center" }}><div style={{ width: 30, height: 30, borderRadius: 15, background: A, transform: `scale(${1 + Math.sin((f - 457) * 0.9) * 0.4})` }} /></AbsoluteFill>;
  } else if (f < 600) { // 5. DROP + logo; out = cursor drags demo card in
    const shake = f < 479 ? Math.sin(f * 3.3) * (479 - f) * 2.2 : 0;
    const rows: [string, number, string][] = [["Quem já", 471, TX], ["precisa", 478, TX], ["de você.", 485, A]];
    const drag = iv(f, 586, 600, [0, 1], io);
    node = <>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `translate(${shake - drag * 300}px,${shake * 0.4}px)` }}>
        <AbsoluteFill style={{ background: A, opacity: iv(f, 471, 480, [0.3, 0]) }} />
        {Array.from({ length: 16 }).map((_, i) => { const p = iv(f, 471, 487); return <div key={i} style={{ position: "absolute", width: 100, height: 14, borderRadius: 7, background: i % 2 ? A : TX, opacity: 1 - p, transform: `rotate(${(i / 16) * Math.PI * 2}rad) translateX(${340 + p * 420}px)` }} />; })}
        <div style={{ position: "absolute", top: 520, ...T, fontSize: 196, fontWeight: 900, letterSpacing: "-0.055em", textAlign: "center" }}>
          {rows.map(([w, s, c]) => { const p = sp(s, { damping: 15, stiffness: 300, mass: 0.6 }); return <div key={w} style={{ height: 205, display: "flex", alignItems: "center", justifyContent: "center", color: c, opacity: f >= s ? 1 : 0, transform: `scale(${1.22 - 0.22 * p})`, filter: `blur(${(1 - Math.min(p, 1)) * 10}px)` }}>{w}</div>; })}
        </div>
        <div style={{ position: "absolute", top: 1330, opacity: iv(f, 500, 512), transform: `translateY(${(1 - sp(500)) * 60}px)` }}><Logo s={1.25} /></div>
      </AbsoluteFill>
      {f >= 580 && <><div style={{ position: "absolute", top: 0, bottom: 0, left: 1080 - drag * 1080, width: 1080, background: SOFT, boxShadow: "-30px 0 60px rgba(0,0,0,.12)", filter: `blur(${Math.sin(drag * Math.PI) * 6}px)` }} />
        <Cursor x={1080 - drag * 1080 + 40} y={960} press={f > 584 ? 0.85 : 1} /></>}
    </>;
  } else if (f < 1343) { // DEMO
    bg = SOFT; fl = A;
    const step = f < 771 ? 1 : f < 957 ? 2 : f < 1143 ? 3 : 4;
    // sticky label (top)
    const lab = (() => {
      if (step === 1) return { n: "1", at: 606, ls: ["Diga o que", "você vende"], start: 604, hi: { 1: A } as Record<number, string>, out: 763 };
      if (step === 2) return { n: "2", at: 771, ls: ["Ele procura no", "YouTube, X", "e Instagram"], start: 771, hi: {} as Record<number, string>, out: 949 };
      if (step === 3) return { n: "3", at: 957, ls: ["Cada lead", "vem com prova"], start: 957, hi: { 1: A } as Record<number, string>, out: 1135 };
      return f < 1243 ? { n: "✓", at: 1143, ls: ["Mensagem pronta."], start: 1143, hi: {} as Record<number, string>, out: 1233 } : { n: "✓", at: 1143, ls: ["Você aprova."], start: 1243, hi: { 0: A } as Record<number, string>, out: 1335 };
    })();
    const outT = iv(f, lab.out, lab.out + 8, [0, 1], zin);
    const sz = lab.ls.length === 3 ? 104 : 118;
    // step-3 entrance = expand from small; step-4 = slide mask from left; others = rise
    const entrance = step === 3 ? { transform: `scale(${0.55 + 0.45 * sp(957)})`, filter: `blur(${(1 - Math.min(1, sp(957))) * 8}px)` } : step === 4 ? { clipPath: `inset(0 ${100 - iv(f, lab.start, lab.start + 12) * 100}% 0 0)` } : {};
    const label = <div style={{ position: "absolute", top: 120, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: 1 - outT, transform: `translateY(${-outT * 60}px)`, filter: `blur(${outT * 8}px)` }}>
      <Pill n={lab.n} f={f} at={lab.at} />
      <div style={entrance}><Lines ls={lab.ls} size={sz} start={lab.start} f={f} hi={lab.hi} /></div>
    </div>;
    let ui: React.ReactNode = null;
    if (step === 1) {
      const typed = "energia solar".slice(0, Math.max(0, Math.floor((f - 640) / 3)));
      const cardIn = sp(612);
      const collapse = iv(f, 760, 778, [0, 1], io);
      ui = <div style={{ position: "absolute", left: 90, right: 90, top: 900, background: "#fff", borderRadius: 36, border: `2px solid ${LN}`, padding: "56px 56px 60px", boxShadow: "0 40px 100px rgba(31,35,40,.12)", transform: `translateY(${(1 - cardIn) * 300}px) scale(${1 - collapse * 0.8})`, opacity: 1 - collapse }}>
        <div style={{ fontFamily: "IV", fontSize: 40, color: MU, fontWeight: 600, letterSpacing: "-0.02em" }}>O que você vende?</div>
        <div style={{ marginTop: 26, border: `3px solid ${f > 636 ? A : LN}`, borderRadius: 22, padding: "30px 32px", fontFamily: "IV", fontSize: 64, fontWeight: 700, letterSpacing: "-0.03em", color: TX, display: "flex", alignItems: "center" }}>{typed}<span style={{ width: 5, height: 70, background: A, marginLeft: 6, opacity: Math.floor(f / 8) % 2 ? 1 : 0.15 }} /></div>
        <div style={{ marginTop: 34, background: A, color: "#fff", borderRadius: 22, padding: "28px 0", textAlign: "center", fontFamily: "IV", fontSize: 50, fontWeight: 750, letterSpacing: "-0.02em", transform: `scale(${f >= 712 && f < 718 ? 0.94 : 1})` }}>Buscar leads</div>
        {f > 690 && <Cursor x={560 + iv(f, 690, 710, [260, 0], io)} y={460 + iv(f, 690, 710, [200, 0], io)} press={f >= 712 && f < 718 ? 0.85 : 1} ring={iv(f, 713, 730)} />}
      </div>;
    } else if (step === 2) {
      const icons = [YT, XL, IG];
      const from = [[-700, 0], [0, -900], [700, 0]];
      const appIn = sp(830, { damping: 18, stiffness: 120, mass: 0.8 });
      const t = 60 + (f - 830) * 0.8;
      ui = <>
        <div style={{ position: "absolute", top: appIn > 0.01 ? 560 + 0 : 1150, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 50, transform: `translateY(${appIn * 0}px)` }}>
          {icons.map((Ic, i) => { const p = sp(780 + i * 6, { damping: 12, stiffness: 160, mass: 0.7 }); const k = 1 - Math.min(1, p); const tgtY = iv(f, 820, 840, [580, 0], io); return <div key={i} style={{ transform: `translate(${from[i][0] * k}px,${from[i][1] * k + tgtY}px) rotate(${k * (i - 1) * 60}deg) scale(${1 - iv(f, 820, 840) * 0.45})`, filter: `blur(${k * 10}px)` }}><Ic /></div>; })}
        </div>
        {f >= 826 && <div style={{ opacity: appIn, transform: `scale(${0.7 + 0.3 * appIn})`, transformOrigin: "50% 70%" }}><App t={t} cx={814} cy={560} s={1.05} /></div>}
      </>;
    } else if (step === 3) {
      const t = Math.min(282, 186 + (f - 957));
      const pan = iv(f, 1050, 1078, [0, 1], io);
      const zoom = iv(f, 1092, 1118, [0, 1], io);
      const cx = interpolate(pan, [0, 1], [814, 1580]), cy = interpolate(pan, [0, 1], [560, 470]) + zoom * -40;
      const s = interpolate(pan, [0, 1], [1.05, 1.7]) * (1 + zoom * 0.1);
      ui = <App t={t} cx={cx} cy={cy} s={s} blur={Math.sin(pan * Math.PI) * 3 + Math.sin(zoom * Math.PI) * 2} />;
    } else {
      const t = Math.min(360, 300 + Math.max(0, f - 1150) * 0.9);
      const back = iv(f, 1143, 1165, [0, 1], io);
      const cx = interpolate(back, [0, 1], [1580, 1580]), cy = interpolate(back, [0, 1], [430, 740]), s = interpolate(back, [0, 1], [1.87, 1.7]);
      const btn = [1668, 1018];
      const [bx, by] = toScreen(btn[0], btn[1], cx, cy, s);
      const cIn = iv(f, 1262, 1290, [0, 1], io);
      const press = f >= 1296 && f < 1303;
      ui = <>
        <App t={t} cx={cx} cy={cy} s={s} blur={Math.sin(back * Math.PI) * 3} />
        {false && <div style={{ position: "absolute", left: bx - 92, top: by - 34, width: 184, height: 68, borderRadius: 16, background: A, opacity: iv(f, 1297, 1304), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "IV", fontWeight: 700, fontSize: 30 }}>✓</div>}
        {f >= 1258 && <Cursor x={interpolate(cIn, [0, 1], [bx + 200, bx])} y={interpolate(cIn, [0, 1], [by + 220, by])} press={press ? 0.85 : 1} ring={iv(f, 1297, 1315)} />}
        {f >= 1333 && <div style={{ position: "absolute", left: bx, top: by, width: 10, height: 10, borderRadius: 5, background: A, transform: `translate(-50%,-50%) scale(${Math.pow(500, iv(f, 1333, 1343, [0, 1], zin))})` }} />}
      </>;
    }
    node = <>{ui}{label}</>;
  } else if (f < 1657) { // BENEFITS: sticky flip board, background changes underneath
    const items: [string[], number, number, string, string][] = [
      [["Pague uma vez."], 1343, 1406, A, "#fff"], [["Sem mensalidade."], 1414, 1478, A, "#fff"],
      [["Roda no seu", "computador."], 1486, 1563, D, "#fff"], [["Privado.", "Só leitura."], 1571, 1649, TINT, TX]];
    const idx = items.findIndex(([, s], i) => f < (items[i + 1]?.[1] ?? 9999));
    const [ls, s0, e0, bgc, col] = items[idx];
    const prev = items[idx - 1];
    bg = bgc; fl = col;
    // background wipe from the previous colour
    const wipe = prev && prev[3] !== bgc ? iv(f, s0 - 8, s0 + 6, [0, 1], io) : 1;
    const rin = iv(f, s0, s0 + 12, [-90, 0], ez), rout = iv(f, e0, e0 + 8, [0, 90], zin);
    const hi = idx === 1 ? { 0: "#1F2329" } : idx === 3 ? { 1: A } : {};
    node = <>
      {prev && wipe < 1 && <AbsoluteFill style={{ background: prev[3], clipPath: `inset(0 0 ${wipe * 100}% 0)` }} />}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "absolute", top: 560, opacity: 0.9 }}>{idx < 2 ? <div style={{ ...T, fontSize: 40, color: "rgba(255,255,255,.7)", letterSpacing: "0.12em", fontWeight: 700 }}>PAGAMENTO ÚNICO</div> : null}</div>
        <div style={{ transform: `perspective(1200px) rotateX(${f < e0 ? rin : rout}deg)`, background: idx === 1 ? "#fff" : "transparent", borderRadius: 40, padding: idx === 1 ? "30px 50px" : 0 }}>
          <div style={{ ...T, fontSize: ls.length > 1 ? 150 : 132, color: idx === 1 ? TX : col, textAlign: "center" }}>{ls.map((l, i) => <div key={l} style={{ color: (hi as any)[i] ?? (idx === 1 ? TX : col) }}>{l}</div>)}</div>
        </div>
      </AbsoluteFill></>;
  } else { // CTA: iris reveal
    const iris = iv(f, 1649, 1668, [0, 1], io);
    const pulse = (f - 1690) % 43 / 43;
    node = <>
      <AbsoluteFill style={{ background: TINT }} />
      <AbsoluteFill style={{ background: "#fff", clipPath: `circle(${iris * 120}% at 50% 50%)`, alignItems: "center" }}>
        <div style={{ position: "absolute", top: 260, opacity: iv(f, 1660, 1672) }}><Logo s={1} /></div>
        <div style={{ position: "absolute", top: 560 }}><Lines ls={["Entre na lista", "e ganhe"]} size={128} start={1652} f={f} /></div>
        <div style={{ position: "absolute", top: 870, ...T, fontSize: 128, background: A, color: "#fff", borderRadius: 32, padding: "10px 40px 22px", transform: `scale(${sp(1664, { damping: 11, stiffness: 220, mass: 0.6 })})` }}>3 leads grátis</div>
        <div style={{ position: "absolute", top: 1290, opacity: iv(f, 1668, 1678), transform: `translateY(${(1 - iv(f, 1668, 1680)) * 40}px)` }}>
          {f > 1690 && <div style={{ position: "absolute", inset: 0, borderRadius: 999, border: `4px solid ${A}`, transform: `scale(${1 + pulse * 0.25})`, opacity: 1 - pulse }} />}
          <div style={{ border: `4px solid ${TX}`, borderRadius: 999, padding: "26px 60px", fontFamily: "IV", fontWeight: 800, fontSize: 72, letterSpacing: "-0.03em", color: TX }}>minemylead.com</div>
        </div>
      </AbsoluteFill></>;
  }
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <style>{FONT}</style>
      <Audio src={staticFile("promo.wav")} />
      <Floaters f={f} c={fl} />
      {node}
    </AbsoluteFill>
  );
};
// scene 4 body (also rendered under the split-screen of scene 3)
const D4 = ({ f }: { f: number }) => {
  const collapse = iv(f, 447, 457, [0, 1], zin);
  const { fps } = useVideoConfig();
  const b = spring({ frame: f - 352, fps, config: { damping: 14, stiffness: 160 } });
  return <AbsoluteFill style={{ background: TINT, alignItems: "center", transform: `scale(${1 - collapse})`, filter: `blur(${collapse * 10}px)` }}>
    <div style={{ position: "absolute", top: 400, right: 120, width: 560, padding: "34px 36px", borderRadius: 36, borderBottomRightRadius: 8, background: A, transform: `scale(${b})`, transformOrigin: "100% 100%" }}>
      <div style={{ width: 440, height: 24, borderRadius: 12, background: "rgba(255,255,255,.55)" }} /><div style={{ width: 300, height: 24, borderRadius: 12, background: "rgba(255,255,255,.55)", marginTop: 16 }} />
    </div>
    <div style={{ position: "absolute", top: 600, right: 130, display: "flex", gap: 0, opacity: iv(f, 370, 380) }}>
      <svg width="64" height="40" viewBox="0 0 32 20" fill="none" stroke="#9CA3AF" strokeWidth="2.6" strokeLinecap="round"><path d="M2 10l6 6L20 4M12 16L24 4" /></svg>
    </div>
    <div style={{ position: "absolute", top: 860 }}><Lines ls={["Mensagem fria", "fica no visto."]} size={128} start={333} f={f} hi={{ 1: A }} /></div>
  </AbsoluteFill>;
};

export { Lines, Logo, App, Floaters, Cursor, toScreen, A, D, TX, MU, LN, TINT, SOFT, FONT, T, iv, ez, zin, io };
