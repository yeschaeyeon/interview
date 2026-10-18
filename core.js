/* 공용: DOM 헬퍼, 저장소, 하이라이트 엔진 */
(()=>{
'use strict';
const IV=window.IV={};
IV.DATA=window.DATA; IV.SRC=window.SOURCE||{};
IV.byId=Object.fromEntries(IV.DATA.map(e=>[e.id,e]));

/* ---------- DOM ---------- */
IV.h=function h(tag,a,...kids){
  const el=document.createElement(tag);
  if(a)for(const k in a){
    let v=a[k]; if(k.startsWith('aria-')&&typeof v==='boolean')v=String(v); if(v==null||v===false)continue;
    if(k==='class')el.className=v;
    else if(k==='on'){for(const ev in v)el.addEventListener(ev,v[ev])}
    else if(k==='dataset'){Object.assign(el.dataset,v)}
    else if(k==='style')el.style.cssText=v;
    else if(k==='value'||k==='checked'||k==='disabled'||k==='hidden')el[k]=v;
    else el.setAttribute(k,v===true?'':v);
  }
  const add=x=>{if(x==null||x===false)return;if(Array.isArray(x))x.forEach(add);else el.append(x.nodeType?x:document.createTextNode(String(x)))};
  kids.forEach(add);
  return el;
};
const h=IV.h;
IV.clear=el=>{while(el.firstChild)el.removeChild(el.firstChild)};
IV.fmt=ms=>{ms=Math.max(0,Math.round(ms/1000));const s=ms%60,m=Math.floor(ms/60)%60,hh=Math.floor(ms/3600);const p=n=>String(n).padStart(2,'0');return hh?`${hh}:${p(m)}:${p(s)}`:`${m}:${p(s)}`};
IV.fmtDate=t=>new Date(t).toLocaleString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'short',hour:'numeric',minute:'2-digit'});
IV.shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
let toastT;
IV.toast=msg=>{const t=document.getElementById('toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{t.hidden=true},3200)};
IV.modal=function({title,body,ok='확인',cancel='취소',danger=false,onOk}){
  const close=()=>bg.remove();
  const bg=h('div',{class:'modal-bg',role:'dialog','aria-modal':'true'},
    h('div',{class:'modal'},h('h3',null,title),body?h('p',{class:'muted',style:'margin:0'},body):null,
      h('div',{class:'acts'},
        cancel?h('button',{class:'btn',type:'button',on:{click:close}},cancel):null,
        h('button',{class:'btn '+(danger?'danger':'primary'),type:'button',on:{click:()=>{close();onOk&&onOk()}}},ok))));
  bg.addEventListener('click',e=>{if(e.target===bg)close()});
  document.body.append(bg);
  return close;
};

/* ---------- 상태 저장 (localStorage) ---------- */
const LS='iv.state.v1';
const SECS=['imp','src','hl','done','intro','notes','ridx'];
const S=IV.S={imp:{},src:{},hl:{},done:{},intro:{},notes:{},ridx:{},ts:{}};
try{const o=JSON.parse(localStorage.getItem(LS)||'{}');for(const k of[...SECS,'ts'])if(o[k])S[k]=o[k]}catch(e){}
let st;
IV.save=()=>{clearTimeout(st);st=setTimeout(()=>{try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}},120)};
IV.SECS=SECS;
IV.touch=(sec,key)=>{S.ts[sec+'|'+key]=Date.now();IV.save();if(IV.sync)IV.sync.schedule()};
IV.imp=e=>S.imp[e.id]||2;
IV.getSrc=e=>(S.src[e.id]!=null?S.src[e.id]:(IV.SRC[e.id]||''));
const PAL=['g','y','p','b','c','r'];
const _subs=[];IV.DATA.forEach(e=>{if(!_subs.includes(e.subject))_subs.push(e.subject)});
IV.subjColor=sub=>PAL[_subs.indexOf(sub)%6];
IV.isDone=e=>!!S.done[e.id];
IV.label=e=>`${e.grade}학년 ${e.subject}${e.activity?' · '+e.activity:''}`;

/* ---------- IndexedDB (리포트 + 녹음) ---------- */
const mem=new Map();let dbp=null;
function db(){
  if(dbp)return dbp;
  dbp=new Promise((res,rej)=>{
    try{const r=indexedDB.open('iv-db',1);
      r.onupgradeneeded=()=>r.result.createObjectStore('reports',{keyPath:'id'});
      r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}
  }).catch(()=>null);
  return dbp;
}
const tx=(d,mode,fn)=>new Promise((res,rej)=>{const t=d.transaction('reports',mode);const rq=fn(t.objectStore('reports'));t.oncomplete=()=>res(rq&&rq.result);t.onerror=()=>rej(t.error)});
IV.reports={
  async all(){const d=await db();if(!d)return[...mem.values()].sort((a,b)=>b.createdAt-a.createdAt);return(await tx(d,'readonly',s=>s.getAll())).sort((a,b)=>b.createdAt-a.createdAt)},
  async put(r){const d=await db();if(!d){mem.set(r.id,r);return}await tx(d,'readwrite',s=>s.put(r))},
  async del(id){const d=await db();if(!d){mem.delete(id);return}await tx(d,'readwrite',s=>s.delete(id))}
};

/* ---------- 하이라이트 ---------- */
const CL={y:'hl-y',g:'hl-g',p:'hl-p',b:'hl-b',c:'hl-c',r:'hl-r'};
const LABEL=/^([가-힣A-Za-z0-9/() ]{1,14})[:：]\s/;
IV.paint=function paint(el,text,key,opt){
  el._text=text;el._opt=opt||{};el.dataset.hk=key;
  const hls=(S.hl[key]||[]);
  let labelEnd=0;
  if(opt&&opt.label){const m=LABEL.exec(text);if(m)labelEnd=m[0].length-1}
  const todos=[];const re=/【[^】]*】?/g;let m;
  while((m=re.exec(text)))todos.push([m.index,m.index+m[0].length]);
  const pts=new Set([0,text.length]);
  hls.forEach(([s,e])=>{pts.add(s);pts.add(e)});
  todos.forEach(([s,e])=>{pts.add(s);pts.add(e)});
  if(labelEnd)pts.add(labelEnd);
  const arr=[...pts].filter(p=>p>=0&&p<=text.length).sort((a,b)=>a-b);
  IV.clear(el);
  for(let i=0;i<arr.length-1;i++){
    const a=arr[i],b=arr[i+1];if(a===b)continue;
    const seg=text.slice(a,b);const cls=[];
    let hc=null;for(const [s,e,c] of hls)if(a>=s&&b<=e)hc=c;
    if(hc)cls.push('hl',CL[hc]);
    if(labelEnd&&a<labelEnd)cls.push('lbl');
    if(todos.some(([s,e])=>a>=s&&b<=e))cls.push('todo');
    if(!cls.length)el.append(document.createTextNode(seg));
    else{const sp=h('span',{class:cls.join(' ')},seg);sp.dataset.s=a;el.append(sp)}
  }
};
IV.leaf=function(tag,text,key,cls,opt){const el=h(tag,{class:cls});IV.paint(el,text,key,opt);return el};
function addHL(key,s,e,c){
  eraseHL(key,s,e,true);
  const l=S.hl[key]=S.hl[key]||[];l.push([s,e,c]);
  l.sort((a,b)=>a[0]-b[0]);
  for(let i=l.length-2;i>=0;i--){if(l[i][1]===l[i+1][0]&&l[i][2]===l[i+1][2]){l[i][1]=l[i+1][1];l.splice(i+1,1)}}
}
function eraseHL(key,s,e,silent){
  const l=S.hl[key];if(!l)return;const out=[];
  for(const [a,b,c] of l){
    if(b<=s||a>=e){out.push([a,b,c]);continue}
    if(a<s)out.push([a,s,c]);
    if(b>e)out.push([e,b,c]);
  }
  if(out.length)S.hl[key]=out;else delete S.hl[key];
}
IV.clearHLPrefix=p=>{for(const k of Object.keys(S.hl))if(k.startsWith(p)){delete S.hl[k];S.ts['hl|'+k]=Date.now()}IV.save();if(IV.sync)IV.sync.schedule()};

const tb=document.getElementById('hltb');
let pending=null;
function hideTb(){tb.hidden=true;pending=null}
function offsetIn(leaf,node,off){const r=document.createRange();r.selectNodeContents(leaf);r.setEnd(node,off);return r.toString().length}
function showTb(rect,mode){
  IV.clear(tb);
  if(mode==='sel'){
    for(const c of['g','y','p','b','c','r'])tb.append(h('button',{type:'button','aria-label':'하이라이트 '+c,dataset:{c},on:{pointerdown:ev=>ev.preventDefault(),click:()=>applyPending(c)}}));
    tb.append(h('button',{type:'button',class:'x',on:{pointerdown:ev=>ev.preventDefault(),click:()=>applyPending(null)}},'지우기'));
  }else{
    tb.append(h('button',{type:'button',class:'x',on:{pointerdown:ev=>ev.preventDefault(),click:()=>applyPending(null)}},'하이라이트 삭제'));
  }
  tb.hidden=false;
  const w=tb.offsetWidth,hh=tb.offsetHeight;
  let x=rect.left+rect.width/2-w/2;x=Math.max(8,Math.min(innerWidth-w-8,x));
  let y=rect.top-hh-10;if(y<8)y=rect.bottom+10;
  tb.style.left=x+'px';tb.style.top=y+'px';
}
function applyPending(c){
  if(!pending)return;
  const touched=new Set();
  for(const {leaf,s,e,whole} of pending){
    const key=leaf.dataset.hk;
    if(c)addHL(key,s,e,c);else eraseHL(key,s,e);
    S.ts['hl|'+key]=Date.now();
    touched.add(leaf);
  }
  touched.forEach(l=>IV.paint(l,l._text,l.dataset.hk,l._opt));
  IV.touch('hl',[...touched][0].dataset.hk);
  const sel=getSelection();sel&&sel.removeAllRanges();
  hideTb();
}
function onSel(){
  const sel=getSelection();
  if(!sel||!sel.rangeCount||sel.isCollapsed){if(pending&&pending[0].mode==='sel')hideTb();return}
  const r=sel.getRangeAt(0);
  let root=r.commonAncestorContainer;root=root.nodeType===1?root:root.parentElement;
  const scope=root&&root.closest('.hl-scope');
  if(!scope){hideTb();return}
  const leaves=[...scope.querySelectorAll('[data-hk]')].filter(l=>r.intersectsNode(l));
  const list=[];
  for(const leaf of leaves){
    const len=leaf._text.length;
    const s=leaf.contains(r.startContainer)?offsetIn(leaf,r.startContainer,r.startOffset):0;
    const e=leaf.contains(r.endContainer)?offsetIn(leaf,r.endContainer,r.endOffset):len;
    if(e>s)list.push({leaf,s,e,mode:'sel'});
  }
  if(!list.length){hideTb();return}
  pending=list;
  showTb(r.getBoundingClientRect(),'sel');
}
let selT;
document.addEventListener('selectionchange',()=>{clearTimeout(selT);selT=setTimeout(onSel,140)});
document.addEventListener('click',ev=>{
  const sp=ev.target.closest&&ev.target.closest('.hl');
  const sel=getSelection();
  if(sp&&(!sel||sel.isCollapsed)){
    const leaf=sp.closest('[data-hk]');if(!leaf)return;
    const pos=+sp.dataset.s;const ent=(S.hl[leaf.dataset.hk]||[]).find(([a,b])=>pos>=a&&pos<b);
    if(!ent)return;
    pending=[{leaf,s:ent[0],e:ent[1],mode:'one'}];
    showTb(sp.getBoundingClientRect(),'one');
  }else if(!ev.target.closest('#hltb')&&(!sel||sel.isCollapsed)){hideTb()}
});
document.addEventListener('scroll',()=>{if(pending&&pending[0].mode==='one')hideTb()},true);
})();
