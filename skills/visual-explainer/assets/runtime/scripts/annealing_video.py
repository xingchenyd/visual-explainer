"""Deterministic multi-neighborhood SA lesson: prepare, verify, storyboard, render."""
import argparse, json, math, random, itertools, wave, subprocess, shutil, hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W,H,FPS=1280,720,24
BG='#0a1220'; PANEL='#111e30'; INK='#e9f0fa'; MUTED='#9badc7'; CYAN='#68e1d0'; GOLD='#ffd080'; PURPLE='#b7a1ff'; RED='#ff909b'
POINTS=[(1,1),(4,.7),(7,1.6),(8.5,4),(7,7),(3.8,8),(1,6),(.5,3.4)]
INITIAL=[0,3,6,2,5,1,7,4]
OPS=['swap','insert','2-opt']; LABELS={'swap':'交换 Swap','insert':'插入 Insert','2-opt':'区段反转 2-opt'}
def cost(route):
    return sum(math.hypot(POINTS[a][0]-POINTS[b][0],POINTS[a][1]-POINTS[b][1]) for a,b in zip(route,route[1:]+route[:1]))
def move(route,op,i,j):
    r=route[:]
    if op=='swap':r[i],r[j]=r[j],r[i]
    elif op=='insert':r.insert(j,r.pop(i))
    elif op=='2-opt':i,j=sorted((i,j));r[i:j+1]=reversed(r[i:j+1])
    else:raise ValueError(op)
    return r
def simulate(seed=42,steps=600):
    rng=random.Random(seed); current=INITIAL[:];best=current[:];records=[]
    for k in range(steps):
        op=rng.choice(OPS);i,j=rng.sample(range(1,8),2);candidate=move(current,op,i,j)
        T=8*.99**k;delta=cost(candidate)-cost(current);p=1. if delta<=0 else math.exp(-delta/T);u=rng.random();accepted=u<p
        before=current[:]
        if accepted:current=candidate[:]
        if cost(current)<cost(best):best=current[:]
        records.append(dict(k=k+1,op=op,i=i,j=j,T=T,before=before,candidate=candidate,current=current[:],best=best[:],oldCost=cost(before),candidateCost=cost(candidate),cost=cost(current),bestCost=cost(best),delta=delta,p=p,u=u,accepted=accepted))
    return records
def prepare(root):
    root.mkdir(parents=True,exist_ok=True)
    for p in ['data','audio','qa','exports']: (root/p).mkdir(exist_ok=True)
    trace=simulate();good=next(r for r in trace if r['delta'] < -1);bad=next(r for r in trace if r['delta']>1 and r['accepted']);reject=next(r for r in trace if r['delta']>1 and not r['accepted'])
    scenes=[
      ('intro','多算子模拟退火','多种改法，共用一套接受规则','多算子模拟退火怎样优化一条路线？我们用八座城市，看清三种改法、概率接受，以及降温。这里的多算子，指多种邻域操作，不是多个优化目标。'),
      ('problem','先明确：什么叫更好的解？','目标：访问每座城市一次，再回到起点','一条解，就是城市的访问顺序。我们把相邻城市的欧氏距离相加，包括最后回到起点的一段。总路程越短，解就越好。'),
      ('swap','算子 1：交换两个位置','两座城市互换，其余访问位置保留','第一种改法是交换。选中顺序里的两座城市，把它们的位置互换。注意，改变的是访问顺序，地图上的城市坐标并没有移动。'),
      ('insert','算子 2：抽出，再插入','一座城市换位置，中间城市顺次移动','第二种改法是插入。把一座城市从原位置抽出，再插到另一个位置；夹在中间的城市顺次移动。它探索的路线，和简单交换不同。'),
      ('2-opt','算子 3：反转一段路径','对称距离下：断开两条边，再重新连接','第三种是二步优化，也叫二 opt。切断区段两端的连接，把区段内部的访问顺序反过来，再接回去。在这个对称距离例子中，内部边的长度不变，两端连接发生改变。'),
      ('choose','每一轮，先选一个算子','本例固定等概率：各 1/3','多算子并不意味着每轮都把三种改法做一遍。本例每轮等概率抽取一种，生成一个候选解。算子负责怎样改变路线，接受规则负责要不要走过去。'),
      ('improve','候选更短：直接接受','Δ = 候选路程 − 当前路程',f'看一次真实迭代。当前路程是 {good["oldCost"]:.2f}，候选是 {good["candidateCost"]:.2f}。差值小于零，说明路线缩短了，所以直接接受。相等的候选也接受。'),
      ('worse','候选更长：也可能接受','给跳出局部最优，留一个机会',f'再看一次真实迭代。候选变差了 {bad["delta"]:.2f}。按当前温度计算，接受概率约为百分之 {bad["p"]*100:.0f}。随机数小于这个概率，所以本轮仍然接受。接受较差解能帮助探索，但不保证下一步就会改善。'),
      ('cool','温度越低，越不愿意冒险','同样的变差幅度，不同的接受概率','对于同样的正差值，接受概率是 e 的负差值除以温度次方。温度高，更愿意接受变差；温度低，更谨慎。本例每轮把温度乘以零点九九，逐渐从探索转向收敛。'),
      ('run','把 600 轮，连起来看','青色：当前解　金色：历史最好解','现在加速播放六百轮。当前路程会因为接受较差解而上下波动。历史最好值只在发现更短路线时更新，所以不会上升。降温后，路线逐渐稳定。'),
      ('summary','带走这一条主线','多种邻域 + 概率接受 + 降温 + 最优记录','最后返回历史最好解，而不是简单返回最后停留的解。记住：多种算子扩大探索方式，概率接受允许暂时绕路，降温逐渐收紧选择。有限次运行不保证全局最优，效果仍要靠多次实验检验。')
    ]
    ir={'version':'annealing-video-0.1','lessonId':'multi-operator-annealing','title':'多算子模拟退火：三种改法，一套接受规则','seed':42,'fps':FPS,'viewport':[W,H],'points':POINTS,'initial':INITIAL,'settings':{'steps':600,'temperature0':8,'cooling':.99,'operatorProbabilities':[1/3]*3},'examples':{'improve':good,'worse':bad,'reject':reject},'scenes':[{'id':s[0],'title':s[1],'learningBeat':s[2],'narration':s[3]} for s in scenes]}
    (root/'lesson.ir.json').write_text(json.dumps(ir,ensure_ascii=False,indent=2),encoding='utf8')
    (root/'data/trace.json').write_text(json.dumps(trace,indent=2),encoding='utf8')
    (root/'lesson.spec.yaml').write_text('topic: 多算子模拟退火\naudience: beginner\nlearning_goal: 理解多邻域生成与模拟退火接受规则的分工\nexample: 八城市对称欧氏旅行商问题\noperators: [swap, insert, 2-opt]\nselection: 每轮固定等概率抽取一种\n',encoding='utf8')
    (root/'sources.md').write_text('# 来源与假设\n\n- [Rosati et al., 2022, Multi-neighborhood simulated annealing](https://link.springer.com/article/10.1007/s10951-022-00740-y)：多邻域组合与 Metropolis 接受机制。课程不是该论文算法的复现。\n- [Cornell Optimization Wiki: Simulated annealing](https://optimization.cbe.cornell.edu/index.php?title=Simulated_annealing)：最小化问题的接受规则和降温。\n\n城市坐标、初始路线、种子和参数均为教学构造。单位为抽象距离单位；温度与目标差值同尺度。固定 A 为起点；三种算子等概率，每轮对其余位置均匀抽样。插入采用 pop(i) 后 insert(j) 的位置定义。2-opt 反转包含端点的区段，适用于本例对称距离。没有自适应权重，没有多目标优化。有限预算不保证全局最优。\n',encoding='utf8')
    verify(root)
    print(json.dumps({'prepared':str(root),'initial':cost(INITIAL),'best':trace[-1]['bestCost'],'worseExample':bad['k']},ensure_ascii=False))
def verify(root):
    ir=json.loads((root/'lesson.ir.json').read_text(encoding='utf8'));trace=json.loads((root/'data/trace.json').read_text())
    assert trace==simulate(ir['seed'])
    def ref(route):return math.fsum(math.dist(POINTS[route[k]],POINTS[route[(k+1)%8]]) for k in range(8))
    last=INITIAL[:];best=ref(last)
    for r in trace:
        assert r['before']==last
        for name in ['before','candidate','current','best']:assert sorted(r[name])==list(range(8)) and r[name][0]==0
        assert r['candidate']==move(r['before'],r['op'],r['i'],r['j'])
        for name,field in [('before','oldCost'),('candidate','candidateCost'),('current','cost'),('best','bestCost')]:assert abs(ref(r[name])-r[field])<1e-10
        delta=ref(r['candidate'])-ref(r['before']);p=min(1,math.exp(-delta/r['T'])) if delta>=0 else 1
        assert abs(r['delta']-delta)<1e-10 and abs(r['p']-p)<1e-10
        assert r['accepted']==(delta<=0 or r['u']<p)
        assert r['current']==(r['candidate'] if r['accepted'] else r['before'])
        best=min(best,ref(r['current']));assert abs(best-r['bestCost'])<1e-10;last=r['current']
    optimum=min(ref([0]+list(p)) for p in itertools.permutations(range(1,8)))
    report={'status':'math-passed-video-pending','traceRowsVerified':len(trace),'deterministicReplay':True,'invariants':['permutation validity','fixed start','candidate transformation','closed route cost','delta','Metropolis probability','accept/reject','state continuity','best-so-far monotonicity'],'exhaustiveReference':{'tours':5040,'optimum':optimum,'bestFound':best},'visualReview':'pending','mediaValidation':'pending'}
    (root/'quality-report.json').write_text(json.dumps(report,indent=2),encoding='utf8')

FONT_DIR=Path('C:/Windows/Fonts')
FONTS={}
def font(size,bold=False):
    key=(size,bold)
    if key not in FONTS:FONTS[key]=ImageFont.truetype(str(FONT_DIR/('msyhbd.ttc' if bold else 'msyh.ttc')),size)
    return FONTS[key]
def text(d,xy,s,size=24,col=INK,bold=False):d.text(xy,str(s),font=font(size,bold),fill=col)
def wrap(d,s,width,size=25):
    lines=[];line=''
    for ch in s:
        if d.textlength(line+ch,font=font(size))>width:lines.append(line);line=''
        line+=ch
    if line:lines.append(line)
    return lines
def lines(d,x,y,s,width=430,size=24,col=MUTED,gap=12):
    for line in wrap(d,s,width,size):text(d,(x,y),line,size,col);y+=size+gap
    return y
def smooth(p):p=max(0,min(1,p));return p*p*(3-2*p)
def blend(a,b,p):
    def rgb(c):return tuple(int(c[i:i+2],16) for i in (1,3,5))
    aa,bb=rgb(a),rgb(b);return tuple(round(x+(y-x)*p) for x,y in zip(aa,bb))
def panel(d,box):d.rounded_rectangle(box,16,fill=PANEL,outline='#2a3b53',width=1)
def graph(d,route,other=None,progress=1,hot=(),travel=0):
    coords=[(100+x/9*505,215+y/8.5*280) for x,y in POINTS]
    def edges(r):return {tuple(sorted((a,b))) for a,b in zip(r,r[1:]+r[:1])}
    old=edges(route);new=edges(other) if other else old
    for a,b in sorted(old|new):
        col=CYAN
        if other:
            col=blend(RED,PANEL,progress) if (a,b) not in new else blend(PANEL,GOLD,progress) if (a,b) not in old else '#647b94'
        d.line([coords[a],coords[b]],fill=col,width=4)
    shown=other if other and progress>.5 else route
    f=(travel%1)*len(shown);k=int(f)%len(shown);q=f-int(f);a,b=coords[shown[k]],coords[shown[(k+1)%len(shown)]]
    dot=(a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q);d.ellipse([dot[0]-6,dot[1]-6,dot[0]+6,dot[1]+6],fill=GOLD)
    for k,(x,y) in enumerate(coords):
        c=GOLD if k in hot else CYAN;d.ellipse([x-17,y-17,x+17,y+17],fill=BG,outline=c,width=3);text(d,(x-9,y-15),chr(65+k),21,c,True)
def tiles(d,before,after=None,p=0,hot=(),y=538):
    for city in before:
        i=before.index(city);j=after.index(city) if after else i;x=98+(i+(j-i)*p)*64
        lift=-24*math.sin(p*math.pi) if i!=j else 0
        c=GOLD if city in hot else CYAN
        d.rounded_rectangle([x,y+lift,x+48,y+43+lift],8,fill='#203047',outline=c,width=2)
        text(d,(x+14,y+6+lift),chr(65+city),23,c,True)
    text(d,(624,y+9),'↩ A',19,MUTED)
def chart(d,trace,count,box=(83,238,649,506)):
    x0,y0,x1,y1=box;values=[cost(INITIAL)]+[r['cost'] for r in trace];lo=min(r['bestCost'] for r in trace)-1;hi=max(values)+2
    for v in range(math.ceil(lo/10)*10,math.ceil(hi/10)*10,10):
        yy=y1-(v-lo)/(hi-lo)*(y1-y0);d.line([(x0,yy),(x1,yy)],fill='#28384e');text(d,(x0-34,yy-11),v,16,MUTED)
    for name,c in [('cost',CYAN),('bestCost',GOLD)]:
        vals=[cost(INITIAL)]+[r[name] for r in trace[:count]];pts=[(x0+k/600*(x1-x0),y1-(v-lo)/(hi-lo)*(y1-y0)) for k,v in enumerate(vals)]
        if len(pts)>1:d.line(pts,fill=c,width=3)
    text(d,(x0,y1+14),'0',18,MUTED);text(d,(x1-62,y1+14),'600 轮',18,MUTED)
def state_at(ir,t):
    t=max(0,min(t,ir['duration']));scene=ir['scenes'][-1]
    for s in ir['scenes']:
        if t<s['start']+s['duration']:scene=s;break
    p=max(0,min(1,(t-scene['start'])/scene['duration']));return scene,p
def frame(ir,trace,t):
    s,p=state_at(ir,t);sid=s['id'];idx=ir['scenes'].index(s);im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
    text(d,(48,27),'VISUAL EXPLAINER  /  OPTIMIZATION LAB',16,CYAN,True);text(d,(1080,27),f'{idx+1:02} / {len(ir["scenes"]):02}',18,MUTED)
    text(d,(48,67),s['title'],39,INK,True);text(d,(49,126),s['learningBeat'],22,MUTED)
    panel(d,(48,183,696,602));panel(d,(718,183,1232,602))
    timeTravel=t/5
    if sid in ['intro','problem']:
        graph(d,INITIAL,travel=timeTravel);tiles(d,INITIAL)
        text(d,(750,215),'8 座城市 · 1 条闭合路线',27,INK,True)
        text(d,(750,281),'总路程',22,MUTED);text(d,(750,316),f'{cost(INITIAL):.2f}',63,CYAN,True)
        lines(d,750,419,'改变访问顺序，让总路程更短。',430,28,INK)
        text(d,(750,503),'多算子 = 多种邻域操作',23,GOLD)
        text(d,(750,544),'本例只优化总路程一个目标',22,MUTED)
    elif sid in OPS:
        i,j=(2,5) if sid!='insert' else (5,2);after=move(INITIAL,sid,i,j);q=smooth((p-.18)/.52);hot=INITIAL[min(i,j):max(i,j)+1] if sid=='2-opt' else [INITIAL[i],INITIAL[j]] if sid=='swap' else [INITIAL[i]]
        graph(d,INITIAL,after,q,hot,timeTravel);tiles(d,INITIAL,after,q,hot)
        text(d,(750,213),LABELS[sid],29,GOLD,True)
        description={'swap':'C 与 B 交换访问位置','insert':'把 B 从第 6 位移到第 3 位','2-opt':'反转第 3 到第 6 位的区段'}[sid]
        if sid=='swap':description=f'{chr(65+INITIAL[i])} 与 {chr(65+INITIAL[j])} 交换访问位置'
        lines(d,750,276,description,420,26,INK)
        text(d,(750,365),'原路线',22,MUTED);text(d,(985,365),f'{cost(INITIAL):.2f}',28,CYAN,True)
        text(d,(750,414),'候选路线',22,MUTED);text(d,(985,414),f'{cost(after):.2f}',28,GOLD,True)
        lines(d,750,495,'生成候选 ≠ 自动接受；还要比较路程和温度。',417,23,MUTED)
    elif sid=='choose':
        graph(d,INITIAL,travel=timeTravel);tiles(d,INITIAL)
        active=OPS.index(trace[min(20,int(p*21))]['op'])
        for k,op in enumerate(OPS):
            y=220+k*85;c=GOLD if k==active else MUTED;d.rounded_rectangle([750,y,1200,y+66],10,fill='#24354a' if k==active else PANEL,outline=c,width=2);text(d,(770,y+16),LABELS[op],24,c);text(d,(1110,y+17),'1/3',23,c)
        text(d,(750,508),'抽 1 种 → 生成 1 个候选',25,CYAN,True)
        text(d,(750,555),'本例为固定权重，不含自适应调权',20,MUTED)
    elif sid in ['improve','worse']:
        r=ir['examples'][sid];q=smooth((p-.15)/.45);graph(d,r['before'],r['candidate'],q,travel=timeTravel);tiles(d,r['before'],r['candidate'],q)
        text(d,(750,207),f'真实轨迹 · 第 {r["k"]} 轮（数值已取近似）',21,MUTED)
        text(d,(750,252),f'{r["oldCost"]:.2f}  →  {r["candidateCost"]:.2f}',39,INK,True)
        text(d,(750,319),f'Δ = {r["delta"]:+.2f}',30,CYAN if sid=='improve' else RED,True)
        if sid=='improve':
            text(d,(750,388),'Δ ≤ 0   →   接受',33,CYAN,True);lines(d,750,471,'更短或一样长，成为新的当前解。',423,25,MUTED)
        else:
            text(d,(750,375),f'T = {r["T"]:.2f}     p = {r["p"]:.3f}',25,GOLD)
            d.rounded_rectangle([752,427,1190,446],6,fill='#29384f');d.rounded_rectangle([752,427,752+438*r['p']*smooth(p*3),446],6,fill=GOLD)
            xx=752+438*r['u'];d.line([(xx,420),(xx,455)],fill=INK,width=3)
            text(d,(750,470),f'u = {r["u"]:.3f} < p   →   接受',26,CYAN,True)
            text(d,(750,532),'若 u ≥ p，则拒绝并保留原当前解',21,MUTED)
    elif sid=='cool':
        delta=ir['examples']['worse']['delta'];T=8*(.04/8)**p;prob=math.exp(-delta/T)
        text(d,(84,218),'保持同一个变差幅度',25,INK,True);text(d,(84,267),f'Δ = +{delta:.2f}',43,RED,True)
        for k,temp in enumerate([8,1,.1]):
            y=350+k*68;pr=math.exp(-delta/temp);text(d,(84,y),f'T = {temp:g}',23,MUTED);d.rounded_rectangle([217,y+7,534,y+30],5,fill='#28384e');end=217+317*pr
            if end>218:d.rounded_rectangle([217,y+7,end,y+30],5,fill=GOLD)
            text(d,(555,y),f'{pr*100:.1f}%',22,GOLD)
        text(d,(750,218),'当 Δ > 0 时',23,MUTED);text(d,(750,267),'p = exp(−Δ / T)',39,GOLD,True)
        text(d,(750,341),f'T = {T:.3f}',32,CYAN,True);text(d,(750,394),f'p = {prob*100:.2f}%',32,GOLD,True)
        text(d,(750,473),'T 下一轮 = 0.99 × T',27,INK)
        text(d,(750,541),'高温探索 → 低温收敛',25,MUTED)
    elif sid=='run':
        count=max(1,min(600,int(p*600)));r=trace[count-1];chart(d,trace,count);text(d,(83,550),'当前值允许波动；历史最好值不会上升。',23,MUTED)
        text(d,(750,215),f'迭代 {count:03} / 600',30,INK,True)
        text(d,(750,283),'当前路程',22,MUTED);text(d,(995,274),f'{r["cost"]:.2f}',37,CYAN,True)
        text(d,(750,344),'历史最好',22,MUTED);text(d,(995,335),f'{r["bestCost"]:.2f}',37,GOLD,True)
        text(d,(750,406),f'T = {r["T"]:.4f}',27,PURPLE)
        text(d,(750,460),LABELS[r['op']],27,INK);text(d,(750,515),'接受候选' if r['accepted'] else '拒绝候选，保留当前',25,CYAN if r['accepted'] else RED)
    else:
        best=trace[-1];graph(d,best['best'],travel=timeTravel);tiles(d,best['best']);text(d,(750,212),'返回：历史最好路线',27,GOLD,True)
        text(d,(750,264),f'{cost(INITIAL):.2f}  →  {best["bestCost"]:.2f}',42,INK,True)
        for k,label in enumerate(['① 选算子，生成候选','② 比路程，按概率接受','③ 降温，保留历史最好']):text(d,(750,344+k*56),label,26,CYAN if k==0 else INK)
        text(d,(750,541),'有限迭代，不保证全局最优',23,GOLD)
    # Captions paced by narration character fractions, with at most two lines.
    caption_lines=wrap(d,s['narration'],1150,24);groups=[''.join(caption_lines[i:i+2]) for i in range(0,len(caption_lines),2)]
    weights=[len(x) for x in groups];audio_p=max(0,min(.999,(t-s['start']-.25)/max(.01,s['audioDuration'])));target=audio_p*sum(weights);chosen=groups[-1]
    for group,weight in zip(groups,weights):
        if target<weight:chosen=group;break
        target-=weight
    for k,line in enumerate(wrap(d,chosen,1150,24)):text(d,((W-d.textlength(line,font=font(24)))/2,623+k*33),line,24,INK)
    d.rectangle([0,H-5,W,H],fill='#29384e');d.rectangle([0,H-5,W*t/ir['duration'],H],fill=CYAN)
    return im
def audio_timeline(root):
    ir=json.loads((root/'lesson.ir.json').read_text(encoding='utf8'));cursor=0;chunks=[];params=None
    for s in ir['scenes']:
        with wave.open(str(root/'audio'/f'{s["id"]}.wav'),'rb') as wav:
            par=wav.getparams();raw=wav.readframes(wav.getnframes());params=params or par;assert par[:3]==params[:3];duration=par.nframes/par.framerate
        s['audioDuration']=duration;s['start']=cursor;s['duration']=math.ceil((duration+1.1)*FPS)/FPS;cursor+=s['duration']
        framebytes=par.nchannels*par.sampwidth;pre=round(.25*par.framerate);total=round(s['duration']*par.framerate);post=total-pre-par.nframes
        chunks.append(b'\0'*(pre*framebytes)+raw+b'\0'*(post*framebytes))
    ir['duration']=cursor
    with wave.open(str(root/'audio/narration.wav'),'wb') as wav:wav.setparams(params);wav.writeframes(b''.join(chunks))
    (root/'lesson.ir.json').write_text(json.dumps(ir,ensure_ascii=False,indent=2),encoding='utf8')
    return ir
def storyboard(root):
    ir=audio_timeline(root);trace=json.loads((root/'data/trace.json').read_text())
    thumbs=[]
    for s in ir['scenes']:
        im=frame(ir,trace,s['start']+s['duration']*.65);im.save(root/'qa'/f'{s["id"]}.png');thumbs.append(im.resize((640,360)))
    sheet=Image.new('RGB',(1920,360*math.ceil(len(thumbs)/3)),BG)
    for k,im in enumerate(thumbs):sheet.paste(im,((k%3)*640,(k//3)*360))
    sheet.save(root/'qa/storyboard.jpg',quality=92)
    print(json.dumps({'duration':ir['duration'],'frames':round(ir['duration']*FPS)}))
def render(root):
    ir=json.loads((root/'lesson.ir.json').read_text(encoding='utf8'));trace=json.loads((root/'data/trace.json').read_text());output=root/'exports/multi-operator-annealing.mp4'
    args=[shutil.which('ffmpeg'),'-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-i',str(root/'audio/narration.wav'),'-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart','-shortest',str(output)]
    with (root/'qa/ffmpeg.log').open('w') as log:
        proc=subprocess.Popen(args,stdin=subprocess.PIPE,stdout=log,stderr=log)
        try:
            for n in range(round(ir['duration']*FPS)):
                proc.stdin.write(frame(ir,trace,n/FPS).tobytes())
                if n%(FPS*10)==0:print(f'Rendered {n/FPS:.0f}/{ir["duration"]:.0f}s',flush=True)
        finally:proc.stdin.close()
        if proc.wait()!=0:raise RuntimeError('ffmpeg failed: inspect qa/ffmpeg.log')
    shutil.copyfile(root/'qa/intro.png',root/'exports/poster.png')
    print(str(output))
def subtitles(root):
    ir=json.loads((root/'lesson.ir.json').read_text(encoding='utf8'));d=ImageDraw.Draw(Image.new('RGB',(W,H)));entries=[]
    def stamp(t):
        ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
    for s in ir['scenes']:
        ll=wrap(d,s['narration'],1150,24);groups=[''.join(ll[i:i+2]) for i in range(0,len(ll),2)];total=sum(map(len,groups));elapsed=0
        for group in groups:
            start=s['start']+.25+s['audioDuration']*elapsed/total;elapsed+=len(group);end=s['start']+.25+s['audioDuration']*elapsed/total
            entries.append(f'{len(entries)+1}\n{stamp(start)} --> {stamp(end)}\n'+ '\n'.join(wrap(d,group,1150,24))+'\n')
    (root/'exports/chinese.srt').write_text('\n'.join(entries),encoding='utf8');print(f'Exported {len(entries)} subtitle cues')
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('mode',choices=['prepare','verify','storyboard','render','subtitles']);parser.add_argument('output');args=parser.parse_args();globals()[args.mode](Path(args.output).resolve())
