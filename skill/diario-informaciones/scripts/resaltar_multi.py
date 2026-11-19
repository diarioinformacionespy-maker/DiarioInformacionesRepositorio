"""Uso: BOX='pag,x0,y0,x1,y1;pag,...' python3 resaltar_multi.py <pdf> X <salida.png> ["Diario Informaciones · <día y fecha>"]
Ubica el aviso que contiene PALABRA (desde el nombre en negrita hasta la línea 'Op ...'),
renderiza la página y dibuja esquinas rojas elegantes alrededor + recorte con contexto."""
import re,sys,subprocess,os,tempfile
from PIL import Image,ImageDraw,ImageFilter
pdf,kw,out=sys.argv[1],sys.argv[2].upper(),sys.argv[3]
tmp=tempfile.mkdtemp();bx=os.path.join(tmp,'b.html')
subprocess.run(['pdftotext','-bbox-layout',pdf,bx],check=True)
pages=open(bx).read().split('<page ')[1:]
def blocks(p):
    r=[]
    for b in re.findall(r'<block (.*?)</block>',p,re.S):
        x0,y0,x1,y1=map(float,re.match(r'xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)"',b).groups())
        r.append((x0,y0,x1,y1,' '.join(re.findall(r'>([^<]+)</word>',b))))
    return r
BX=[[float(v) for v in b.split(',')] for b in os.environ['BOX'].split(';')]; pi=int(BX[0][0]); x0=min(b[1] for b in BX); top=min(b[2] for b in BX); x1=max(b[3] for b in BX); bot=max(b[4] for b in BX)
dpi=200;s=dpi/72
subprocess.run(['pdftoppm','-r',str(dpi),'-png','-f',str(pi),'-l',str(pi),pdf,os.path.join(tmp,'pg')],check=True)
img=Image.open([os.path.join(tmp,f) for f in os.listdir(tmp) if f.startswith('pg')][0]).convert('RGB')
pad=7
dim=Image.new('RGB',img.size,(255,255,255));base=Image.blend(img,dim,0.55)
d=ImageDraw.Draw(base);red=(178,24,38);w=max(5,int(s*2.2))
for b in BX:
    X0,Y0,X1,Y1=[int(v*s) for v in (b[1]-pad,b[2]-pad,b[3]+pad,b[4]+pad)]
    base.paste(img.crop((X0,Y0,X1,Y1)),(X0,Y0))
for b in BX:
    X0,Y0,X1,Y1=[int(v*s) for v in (b[1]-pad,b[2]-pad,b[3]+pad,b[4]+pad)]
    L=int(min(X1-X0,Y1-Y0)*0.22)
    for (cx,cy,dx,dy) in [(X0,Y0,1,1),(X1,Y0,-1,1),(X0,Y1,1,-1),(X1,Y1,-1,-1)]:
        d.line([(cx,cy),(cx+dx*L,cy)],fill=red,width=w); d.line([(cx,cy),(cx,cy+dy*L)],fill=red,width=w)
        d.ellipse([cx-w//2,cy-w//2,cx+w//2,cy+w//2],fill=red)
X0,Y0,X1,Y1=[int(v*s) for v in (x0-pad,top-pad,x1+pad,bot+pad)]
mx,my=int(110*s),int(70*s)
crop=base.crop((max(0,X0-mx),max(0,Y0-my),min(base.width,X1+mx),min(base.height,Y1+my)))
crop.save(out,optimize=True)
print(pi,round(x0),round(top),round(x1),round(bot),crop.size)
# --- franja superior con fecha/página (arg 4 opcional) ---
if len(sys.argv)>4:
    from PIL import ImageFont
    cap=sys.argv[4]+f'  ·  Página {pi}'
    im=Image.open(out);bar=int(im.height*0.055)+20
    new=Image.new('RGB',(im.width,im.height+bar),(255,255,255));new.paste(im,(0,bar))
    dd=ImageDraw.Draw(new);dd.rectangle([0,0,im.width,bar-6],fill=(15,59,61));dd.rectangle([0,bar-6,im.width,bar-2],fill=(178,24,38))
    sz=int(bar*0.38)
    while True:
        try: f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',sz)
        except: f=ImageFont.load_default(); break
        if dd.textlength(cap,font=f)<=im.width-48 or sz<12: break
        sz-=1
    dd.text((24,(bar-6)//2),cap,fill=(255,255,255),font=f,anchor='lm')
    new.save(out,optimize=True)
