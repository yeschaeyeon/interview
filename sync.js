/* 기기 간 동기화: Firebase Firestore REST (본인 프로젝트). 텍스트 데이터만 동기화, 녹음·영상은 제외 */
(()=>{
'use strict';
const IV=window.IV,S=IV.S;
const KEY='iv.sync.v1';
let cfg={};try{cfg=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const sync=IV.sync={cfg,st:{state:cfg.k?'idle':'off',msg:'',last:cfg.last||0}};
sync.enabled=()=>!!(cfg.k&&cfg.p&&cfg.c);
function persist(){cfg.last=sync.st.last;try{localStorage.setItem(KEY,JSON.stringify(cfg))}catch(e){}}
sync.setCfg=o=>{Object.assign(cfg,o);persist();sync.st.state=sync.enabled()?'idle':'off'};
sync.clear=()=>{for(const k of['k','p','c','last'])delete cfg[k];sync.st={state:'off',msg:'',last:0};persist()};
sync.makeCode=()=>{const a='abcdefghijkmnpqrstuvwxyz23456789';return[...crypto.getRandomValues(new Uint8Array(14))].map(b=>a[b%32]).join('')};
sync.pack=()=>btoa(unescape(encodeURIComponent(JSON.stringify({k:cfg.k,p:cfg.p,c:cfg.c}))));
sync.unpack=s=>{const o=JSON.parse(decodeURIComponent(escape(atob(s.trim()))));if(!o.k||!o.p||!o.c)throw new Error('x');return o};

const base=()=>`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(cfg.p)}/databases/(default)/documents/sync`;
const url=id=>`${base()}/${encodeURIComponent(cfg.c)}_${id}?key=${encodeURIComponent(cfg.k)}`;
async function fail(r){let m='';try{m=(await r.json()).error.message}catch(e){}throw new Error(`${r.status} ${m}`.trim())}
async function getDoc(id){const r=await fetch(url(id));if(r.status===404)return null;if(!r.ok)await fail(r);const j=await r.json();return j.fields&&j.fields.d?JSON.parse(j.fields.d.stringValue):null}
async function putDoc(id,obj){
  const body=JSON.stringify({fields:{d:{stringValue:JSON.stringify(obj)}}});
  if(body.length>900000)throw new Error('데이터가 너무 커서 저장할 수 없어요');
  const r=await fetch(url(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body});if(!r.ok)await fail(r);
}
async function delDoc(id){try{await fetch(url(id),{method:'DELETE'})}catch(e){}}

function backfill(){for(const sec of IV.SECS)for(const k of Object.keys(S[sec]))if(!S.ts[sec+'|'+k])S.ts[sec+'|'+k]=1}
function localPayload(){const o={ts:S.ts};for(const sec of IV.SECS)o[sec]=S[sec];return o}
function mergeState(rem){
  let changed=false,needPush=false;const rts=rem.ts||{};
  const keys=new Set([...Object.keys(S.ts),...Object.keys(rts)]);
  for(const tk of keys){
    const tl=S.ts[tk]||0,tr=rts[tk]||0;
    if(tr>tl){
      const i=tk.indexOf('|'),sec=tk.slice(0,i),k=tk.slice(i+1);
      if(!S[sec])continue;
      const v=rem[sec]&&rem[sec][k];
      if(v===undefined)delete S[sec][k];else S[sec][k]=v;
      S.ts[tk]=tr;changed=true;
    }else if(tl>tr)needPush=true;
  }
  return{changed,needPush};
}
const strip=r=>({...r,videos:undefined,records:r.records.map(x=>({...x,blob:null,hadAudio:!!(x.blob||x.hadAudio)}))});
let busy=false,timer=null,again=false;
sync.run=async function(manual){
  if(!sync.enabled())return;
  if(busy){again=true;return}
  busy=true;sync.st.state='syncing';sync.st.msg='';notify();
  let uiChanged=false;
  try{
    backfill();
    const rem=await getDoc('state');
    let needPush=!rem;
    if(rem){const m=mergeState(rem);uiChanged=m.changed;needPush=m.needPush}
    // 리포트
    const reps=await IV.reports.all();const byId=new Map(reps.map(r=>[r.id,r]));
    for(const r of reps){
      const t=r.updatedAt||r.createdAt;
      const rv=S.ridx[r.id];
      if(rv===-1){await IV.reports.del(r.id);uiChanged=true;continue}
      if(rv===undefined||t>rv){
        await putDoc('r_'+r.id,strip(r));S.ridx[r.id]=t;S.ts['ridx|'+r.id]=Date.now();needPush=true;
      }else if(rv>t){
        const d=await getDoc('r_'+r.id);
        if(d){d.videos=r.videos;d.records=d.records.map((x,i)=>({...x,blob:(r.records[i]&&r.records[i].blob)||null}));await IV.reports.put(d);uiChanged=true}
      }
    }
    for(const [id,rv] of Object.entries(S.ridx)){
      if(rv>0&&!byId.has(id)){
        const d=await getDoc('r_'+id);
        if(d){d.records=d.records.map(x=>({...x,blob:null}));await IV.reports.put(d);uiChanged=true}
      }
    }
    if(needPush||uiChanged){await putDoc('state',localPayload())}
    IV.save();
    sync.st.state='ok';sync.st.last=Date.now();persist();
  }catch(e){
    sync.st.state='error';sync.st.msg=String(e.message||e);
    if(/Failed to fetch|NetworkError/i.test(sync.st.msg))sync.st.msg='인터넷에 연결할 수 없어요. 연결되면 다시 시도해요.';
    else if(/403|PERMISSION/i.test(sync.st.msg))sync.st.msg='권한 오류예요. Firestore 규칙을 안내대로 게시했는지 확인해 주세요. ('+sync.st.msg+')';
  }finally{
    busy=false;notify();
    if(uiChanged)refreshUI();
    if(again){again=false;sync.schedule()}
  }
};
function refreshUI(){
  const ae=document.activeElement;
  if(!document.getElementById('session').hidden)return;
  if(ae&&(ae.tagName==='TEXTAREA'||ae.tagName==='INPUT'))return;
  if(IV.render)IV.render();
}
const listeners=new Set();sync.on=f=>listeners.add(f);
function notify(){listeners.forEach(f=>f(sync.st))}
sync.schedule=()=>{if(!sync.enabled())return;clearTimeout(timer);timer=setTimeout(()=>sync.run(),2500)};
sync.deleteReport=async id=>{S.ridx[id]=-1;S.ts['ridx|'+id]=Date.now();IV.save();if(sync.enabled()){await delDoc('r_'+id);sync.schedule()}};
sync.init=()=>{
  if(!sync.enabled())return;
  sync.run();
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync.run()});
  addEventListener('online',()=>sync.run());
  setInterval(()=>{if(document.visibilityState==='visible')sync.run()},60000);
};
})();
