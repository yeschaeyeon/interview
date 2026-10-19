/* 기기 간 동기화: GitHub 저장소(비공개) Contents API. 텍스트 데이터만 동기화, 녹음·영상은 제외 */
(()=>{
'use strict';
const IV=window.IV,S=IV.S;
const KEY='iv.sync.gh.v1';
let cfg={};try{cfg=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const sync=IV.sync={cfg,preset:false,st:{state:cfg.t?'idle':'off',msg:'',last:cfg.last||0}};
sync.enabled=()=>!!(cfg.t&&cfg.o&&cfg.r);
function persist(){cfg.last=sync.st.last;try{localStorage.setItem(KEY,JSON.stringify(cfg))}catch(e){}}
sync.setCfg=o=>{Object.assign(cfg,o);for(const k in shas)delete shas[k];persist();sync.st.state=sync.enabled()?'idle':'off'};
sync.clear=()=>{for(const k of['t','o','r','last'])delete cfg[k];sync.st={state:'off',msg:'',last:0};persist()};
sync.pack=()=>btoa(unescape(encodeURIComponent(JSON.stringify({o:cfg.o,r:cfg.r,t:cfg.t}))));
sync.unpack=s=>{const o=JSON.parse(decodeURIComponent(escape(atob(s.trim()))));if(!o.o||!o.r||!o.t)throw new Error('x');return o};

/* GitHub Contents API: 비공개 저장소의 iv-sync/ 폴더에 JSON 파일로 저장 */
const shas={};
const api=id=>`https://api.github.com/repos/${encodeURIComponent(cfg.o)}/${encodeURIComponent(cfg.r)}/contents/iv-sync/${id}.json`;
const hdr=(extra)=>Object.assign({'Authorization':'Bearer '+cfg.t,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},extra||{});
const b64=s=>btoa(unescape(encodeURIComponent(s)));
const unb64=s=>decodeURIComponent(escape(atob(s.replace(/\s/g,''))));
async function fail(r){let m='';try{m=(await r.json()).message}catch(e){}throw new Error(`${r.status} ${m}`.trim())}
async function getDoc(id){
  const r=await fetch(api(id),{headers:hdr(),cache:'no-store'});
  if(r.status===404){delete shas[id];return null}
  if(!r.ok)await fail(r);
  const j=await r.json();shas[id]=j.sha;
  let txt;
  if(j.content&&j.encoding==='base64')txt=unb64(j.content);
  else{const rr=await fetch(api(id),{headers:hdr({'Accept':'application/vnd.github.raw+json'}),cache:'no-store'});if(!rr.ok)await fail(rr);txt=await rr.text()}
  return JSON.parse(txt);
}
async function freshSha(id){const r=await fetch(api(id),{headers:hdr(),cache:'no-store'});if(r.status===404)return null;if(!r.ok)await fail(r);return(await r.json()).sha}
async function putDoc(id,obj,retry){
  const body={message:'sync '+id,content:b64(JSON.stringify(obj))};
  if(shas[id])body.sha=shas[id];
  const r=await fetch(api(id),{method:'PUT',headers:hdr({'Content-Type':'application/json'}),body:JSON.stringify(body)});
  if((r.status===409||r.status===422)&&!retry){shas[id]=await freshSha(id);if(!shas[id])delete shas[id];return putDoc(id,obj,true)}
  if(!r.ok)await fail(r);
  const j=await r.json();if(j.content)shas[id]=j.content.sha;
}
async function delDoc(id){try{const sha=shas[id]||await freshSha(id);if(!sha)return;await fetch(api(id),{method:'DELETE',headers:hdr({'Content-Type':'application/json'}),body:JSON.stringify({message:'delete '+id,sha})});delete shas[id]}catch(e){}}

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
    else if(/^401/.test(sync.st.msg))sync.st.msg='토큰이 올바르지 않거나 만료됐어요. ('+sync.st.msg+')';
    else if(/^403|^404/.test(sync.st.msg))sync.st.msg='저장소를 찾을 수 없거나 토큰 권한(Contents 읽기/쓰기)이 부족해요. ('+sync.st.msg+')';
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
sync.schedule=()=>{if(!sync.enabled())return;clearTimeout(timer);timer=setTimeout(()=>sync.run(),1200)};
sync.deleteReport=async id=>{S.ridx[id]=-1;S.ts['ridx|'+id]=Date.now();IV.save();if(sync.enabled()){await delDoc('r_'+id);sync.schedule()}};
sync.init=()=>{
  if(!sync.enabled())return;
  sync.run();
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync.run()});
  addEventListener('online',()=>sync.run());
  addEventListener('pagehide',()=>{if(S.ts)sync.run()});
  setInterval(()=>{if(document.visibilityState==='visible')sync.run()},20000);
};
})();
