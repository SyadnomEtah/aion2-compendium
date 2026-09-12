import re,io,glob,sys,os
bad=0
for f in sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','content','fragments','frag-class-*.html'))):
    s=io.open(f,encoding='utf-8').read()
    h3=re.findall(r'<h3>([^<]*)</h3>',s)
    probs=[]
    if h3.count('Leveling build')!=1: probs.append('leveling h3 count %d'%h3.count('Leveling build'))
    if 'Leveling build' in h3 and h3.index('Leveling build')!=2: probs.append('leveling card at index %d'%h3.index('Leveling build'))
    if h3[:3]!=['Overview and role','Skill priority','Leveling build']: probs.append('order '+str(h3[:4]))
    if s.count('<article')!=s.count('</article>'): probs.append('article imbalance')
    if re.search(r'&#\d+;',s): probs.append('numeric entities')
    if '\u2014' in s: probs.append('em dash')
    if re.search(r'<(script|style)',s): probs.append('script/style tag')
    if re.search(r' style="',s): probs.append('inline style')
    if re.search(r'<h[23]',s[s.find('Leveling build'):s.find('</article>',s.find('Leveling build'))]): probs.append('h2/h3 inside leveling card')
    print(f, 'OK' if not probs else 'PROBLEMS: '+'; '.join(probs)); bad+=bool(probs)
sys.exit(bad)
