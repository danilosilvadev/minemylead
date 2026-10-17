from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
import os
Y="#FFE14D"; INK="#0F1B2D"; DEEPINK="#F2F6FB"; BG="#F6F8FB"
f=TTFont("/usr/share/fonts/truetype/sand-box/google/Bricolage Grotesque/BricolageGrotesque-VariableFont_opsz,wdth,wght.ttf")
f=instantiateVariableFont(f,{"wght":800,"opsz":96,"wdth":100})
gs=f.getGlyphSet(); cmap=f.getBestCmap(); hm=f['hmtx']; upm=f['head'].unitsPerEm
def text(s,size,x0,base,cols,track=-0.02):
    sc=size/upm;x=x0;out=[];pos=[]
    for i,ch in enumerate(s):
        g=cmap[ord(ch)];p=SVGPathPen(gs);gs[g].draw(p)
        out.append(f'<path fill="{cols[i]}" transform="translate({x:.2f} {base}) scale({sc:.5f} {-sc:.5f})" d="{p.getCommands()}"/>')
        a=hm[g][0]*sc;pos.append((x,a));x+=a+track*size
    return "".join(out),x-track*size,pos
def svg(w,h,body,bg=None):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'+(f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else "")+body+'</svg>'
def sym(ring,lens,m):
    return (f'<circle cx="27" cy="27" r="20" fill="{lens}" stroke="{ring}" stroke-width="7"/>'
            f'<path d="M42 42l15 15" stroke="{ring}" stroke-width="8.5" stroke-linecap="round"/>'
            f'<path d="M17 36V18l10 11 10-11v18" fill="none" stroke="{m}" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round"/>')
V={ # theme: ring, lens, M, word colour, accent style for "lead", bg
 "white":(INK,Y,INK,INK,"hl",None),
 "dark":(Y,"none",Y,DEEPINK,Y,INK),
 "yellow":(INK,Y,INK,INK,INK,Y)}
def place(s,x,y,sz): return f'<g transform="translate({x} {y}) scale({sz/64})">{s}</g>'
os.makedirs("opt-b-site",exist_ok=True)
for k,(r,l,m,wc,acc,bg) in V.items():
    word="minemylead"; cols=[wc]*6+[(wc if acc=="hl" else acc)]*4
    body,xe,pos=text(word,96,128,94,cols)
    hl=""
    if acc=="hl":
        x0=pos[6][0]-6; x1=xe+6; hl=f'<rect x="{x0:.1f}" y="58" width="{x1-x0:.1f}" height="44" rx="6" fill="{Y}"/>'
    W=int(xe+20); out=svg(W,130,hl+place(sym(r,l,m),10,22,96)+body,bg)
    open(f"opt-b-site/lockup-on-{k}.svg","w").write(out)
open("opt-b-site/symbol.svg","w").write(svg(64,64,sym(INK,Y,INK)))
open("opt-b-site/symbol-on-dark.svg","w").write(svg(64,64,sym(Y,"none",Y)))
open("opt-b-site/app-icon-512.svg","w").write(svg(512,512,f'<rect width="512" height="512" rx="114" fill="{INK}"/>'+place(sym(Y,"none",Y),96,96,320)))
open("opt-b-site/app-icon-512-yellow.svg","w").write(svg(512,512,f'<rect width="512" height="512" rx="114" fill="{Y}"/>'+place(sym(INK,Y,INK),96,96,320)))
# contrast
def L(h):
    c=[int(h[i:i+2],16)/255 for i in (1,3,5)];c=[x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4 for x in c];return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]
cr=lambda a,b:(max(L(a),L(b))+0.05)/(min(L(a),L(b))+0.05)
print("ink on yellow %.1f, yellow on ink %.1f, yellow on white %.2f, ink on white %.1f"%(cr(INK,Y),cr(Y,INK),cr(Y,"#FFFFFF"),cr(INK,"#FFFFFF")))
