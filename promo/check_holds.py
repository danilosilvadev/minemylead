import json,sys
M=json.load(open(sys.argv[1] if len(sys.argv)>1 else 'remotion/src/moments.json'))
print("| # | Text | Words | Lines | Hold start (s) | Hold (s) | Required (s) | OK |\n|---|---|---|---|---|---|---|---|")
for m in M:
    w=len(m['text'].replace('·','').split()); h=(m['out']-m['in'])/30
    req=max(0.5*w,1.5*m['lines'] if m['id']!=15 else 4.0) if False else max(0.5*w,m.get('min',1.5)) if 'min' in m else (max(0.5*w,1.5) if m['id']!=15 else 4.0)
    print(f"| {m['id']} | {m['text']} | {w} | {m['lines']} | {m['in']/30:.2f} | {h:.2f} | {req:.2f} | {'✓' if h>=req-1e-6 else '✗'} |")
