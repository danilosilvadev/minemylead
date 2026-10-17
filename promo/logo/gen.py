from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
import os
A="#7468B8"; D="#1F2329"
f=TTFont("/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf")
f=instantiateVariableFont(f,{"wght":800,"opsz":32})
gs=f.getGlyphSet(); cmap=f.getBestCmap(); hmtx=f['hmtx']; upm=f['head'].unitsPerEm
def text(s,size,x0,base,colors,track=-0.03,dotless_i=False):
    """returns svg paths, end x, and x positions"""
    sc=size/upm; x=x0; out=[]; pos=[]
    for i,ch in enumerate(s):
        g=cmap[ord(ch)]
        if dotless_i and ch=="i": g=cmap[0x131]
        p=SVGPathPen(gs); gs[g].draw(p)
        out.append(f'<path fill="{colors[i]}" transform="translate({x:.2f} {base}) scale({sc:.5f} {-sc:.5f})" d="{p.getCommands()}"/>')
        adv=hmtx[g][0]*sc; pos.append((x,adv)); x+=adv+track*size
    return "".join(out),x-track*size,pos
def svg(w,h,body,bg=None):
    b=f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{b}{body}</svg>'
# --- symbols in a 64x64 box; fg = mark colour, k = knockout colour
def symA(fg,k):  # comment bubble + target
    return (f'<path fill="{fg}" d="M14 6h36a10 10 0 0 1 10 10v24a10 10 0 0 1-10 10H28l-12 10v-10h-2A10 10 0 0 1 4 40V16A10 10 0 0 1 14 6z"/>'
            f'<circle cx="32" cy="28" r="13" fill="none" stroke="{k}" stroke-width="4.5"/><circle cx="32" cy="28" r="5" fill="{k}"/>')
def symB(fg,k):  # magnifier whose lens holds an M
    return (f'<circle cx="27" cy="27" r="20" fill="none" stroke="{fg}" stroke-width="7"/>'
            f'<path d="M42 42l15 15" stroke="{fg}" stroke-width="8.5" stroke-linecap="round"/>'
            f'<path d="M17 36V18l10 11 10-11v18" fill="none" stroke="{fg}" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round"/>')
def symC(fg,k):  # small comment bubble with a proof check (the dot of the i)
    return (f'<path fill="{fg}" d="M14 8h36a10 10 0 0 1 10 10v20a10 10 0 0 1-10 10H30l-14 11V48h-2A10 10 0 0 1 4 38V18A10 10 0 0 1 14 8z"/>'
            f'<path d="M21 28l8 8 15-15" fill="none" stroke="{k}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>')
SYM={"a":symA,"b":symB,"c":symC}
def place(sym,x,y,s,fg,k): return f'<g transform="translate({x} {y}) scale({s/64})">{sym(fg,k)}</g>'
def lockup(o,dark,light):
    word="minemylead"
    if o=="c":
        cols=[dark]*10
        body,xe,pos=text(word,100,10,100,cols,dotless_i=True)
        ix,adv=pos[1]; s=40  # bubble as the i dot
        body+=place(symC,ix+adv/2-s/2+2,8,s,A,light)
        return svg(int(xe+16),130,body)
    cols=[dark]*6+[A]*4
    body,xe,pos=text(word,92,124,92,cols)
    body=place(SYM[o],8,22,96,A,light)+body if o=="a" else place(SYM[o],8,20,96,A,light)+body
    return svg(int(xe+14),130,body)
def icon(o):
    body=f'<rect width="512" height="512" rx="114" fill="{A}"/>'+place(SYM[o],96,96,320,"#fff",A)
    return svg(512,512,body)
for o in "abc":
    d=f"opt-{o}"; os.makedirs(d,exist_ok=True)
    open(f"{d}/symbol.svg","w").write(svg(64,64,SYM[o](A,"#fff")))
    open(f"{d}/symbol-white.svg","w").write(svg(64,64,SYM[o]("#fff",A)))
    open(f"{d}/lockup.svg","w").write(lockup(o,D,"#fff"))
    # on purple: wordmark white, accent part light lavender
    lk=lockup(o,"#fff",A).replace(f'fill="{A}" transform','fill="#D9D4F5" transform')
    if o!="c": lk=lk.replace(f'<g transform="translate(8 2', '<g transform="translate(8 2')
    lk=lk.replace(f'fill="{A}" d="M14','fill="#fff" d="M14').replace(f'stroke="{A}" stroke-width="7"','stroke="#fff" stroke-width="7"').replace(f'stroke="{A}" stroke-width="8.5"','stroke="#fff" stroke-width="8.5"').replace(f'stroke="{A}" stroke-width="5.5"','stroke="#fff" stroke-width="5.5"')
    open(f"{d}/lockup-on-purple.svg","w").write(lk)
    open(f"{d}/app-icon-512.svg","w").write(icon(o))
