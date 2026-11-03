/* Daterbase 스킨: 도시 계획 (옛 이름 마을, 종이 모형) — 시안 미리보기. 데이터: comm(커미션)·outs(외주) 읽기 전용 */
(function(){
const H=DB.skin.R;const now=new Date(),Y0=now.getFullYear(),CM0=now.getMonth();let Y=Y0,CM=CM0,FM=null,YRS=[Y0];
const MN=["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
let J=[],ROOF={},SHP={};
const won=n=>"₩"+(n||0).toLocaleString();
const tier=j=>j.k=="c"?(j.fee<80000?0:j.fee<150000?1:2):(j.fee<300000?0:j.fee<550000?1:2);
const DEF_ST=[["예약","active"],["신청확인","active"],["입금확인","active"],["러프","active"],["중간확인완료","active"],["완성본 전송","active"],["완료","done"],["연성 교환","tag"],["취소","cancel"]];
const hsh=n=>{n=(n^61)^(n>>>16);n=n+(n<<3);n=n^(n>>>4);n=Math.imul(n,0x27d4eb2d);n=n^(n>>>15);return Math.abs(n);};
const num=v=>{let n=Number(v);return isFinite(n)?n:0};
function build(st){
  const out=[];let id=0;
  const sts=((st.commCfg||{}).statuses||[]).length?st.commCfg.statuses.map(x=>[x.name,x.kind]):DEF_ST;
  const kindOf=n=>(sts.find(x=>x[0]==n)||[])[1]||"active",act=sts.filter(x=>x[1]=="active").map(x=>x[0]);
  const ys=new Set([Y0]);(st.comm||[]).forEach(c=>{if(c.doneDate)ys.add(+c.doneDate.slice(0,4));});(st.outs||[]).forEach(o=>{const d=o.due||o.start;if(d)ys.add(+d.slice(0,4));});YRS=[...ys].filter(x=>x>2000&&x<=Y0).sort();
  (st.comm||[]).forEach(c=>{const k=kindOf(c.status);if(k=="cancel")return;
    const fee=num(c.quoteAfter!=null?c.quoteAfter:c.quoteBefore!=null?c.quoteBefore:c.price);
    const cl=(c.client||"").trim()||"이름 없음",t=c.subtype||"커미션";const ims=(c.images||[]).filter(x=>x&&x.id),cv=ims.find(x=>x.cover)||ims.find(x=>(x.kind||"완성본")=="완성본")||ims.find(x=>x.kind!="레퍼런스"&&x.kind!="참고"),im=cv?(cv.t||cv.id):null;
    if(c.doneDate||k=="done"){const dd=c.doneDate||"";if(!dd.startsWith(Y+"-"))return;out.push({id:id++,uid:"c:"+(c.id!=null?c.id:id),k:"c",cl,t,fee,im,m:+dd.slice(5,7)-1,d:+dd.slice(8,10),start:+((c.reqDate||dd).slice(8,10))||1,done:true,ord:c.order||0});}
    else if(Y==Y0){const i=act.indexOf(c.status);out.push({id:id++,uid:"c:"+(c.id!=null?c.id:id),k:"c",cl,t,fee,m:CM,d:0,done:false,p:Math.round(100*(i+1)/(act.length+1)),ord:c.order||0});}});
  (st.outs||[]).forEach(o=>{const S=o.stages&&o.stages.length?o.stages:[{id:"s0",total:o.total}];
    const tot=S.reduce((a,x)=>a+num(x.total!=null?x.total:o.total),0),dn=(o.log||[]).reduce((a,l)=>a+num(l.n),0);
    const fee=S.reduce((a,x)=>a+num(x.price)*num(x.total!=null?x.total:o.total),0),cl=(o.client||"").trim()||"외주",t=o.title||"외주";
    if(tot>0&&dn>=tot){const dd=o.due||o.start||"";if(!dd.startsWith(Y+"-"))return;out.push({id:id++,uid:"o:"+(o.id!=null?o.id:id),k:"o",cl,t,fee,pg:o.total,m:+dd.slice(5,7)-1,d:+dd.slice(8,10),start:+((o.start||dd).slice(8,10))||1,done:true});}
    else if(Y==Y0&&!o.arch&&!o.hidden)out.push({id:id++,uid:"o:"+(o.id!=null?o.id:id),k:"o",cl,t,fee,pg:o.total,m:CM,d:0,done:false,p:tot?Math.min(99,Math.round(100*dn/tot)):0});});
  // 자리: 달마다 3×3, 넘치면 다음 달 빈 칸으로
  const place=j=>{j.lot=0;return true};
  out.filter(j=>j.done).sort((a,b)=>a.m-b.m||a.d-b.d).forEach(place);
  out.filter(j=>!j.done).forEach(j=>{if(!place(j))j.hid=true});
  // 높이순: 키 큰 건물은 뒤(위)쪽 칸, 낮은 집·접는 중은 앞쪽 칸
  {const cnt={};out.filter(j=>j.k=="c").forEach(j=>cnt[j.t]=(cnt[j.t]||0)+1);SHP={};Object.keys(cnt).sort((x,y)=>cnt[y]-cnt[x]||x.localeCompare(y)).forEach((t,i)=>SHP[t]=i%6);}
  layout(out);const ht=j=>!j.done?0:j.k=="o"?[26,40,56][tier(j)]:[25,30,37][tier(j)];
  for(let m=0;m<12;m++){const g=out.filter(j=>j.m==m&&j.lot!=null);g.sort((a,b)=>ht(b)-ht(a)||a.d-b.d).forEach((j,i)=>j.lot=i);}
  // 의뢰인 색은 해가 바뀌어도 같게: 모든 해의 의뢰인을 처음 나온 날짜 순으로
  const cls=(()=>{const L=[];(st.comm||[]).forEach(c=>{const n=(c.client||"").trim()||"이름 없음";L.push([c.doneDate||c.reqDate||c.due||"9",n]);});(st.outs||[]).forEach(o=>{const n=(o.client||"").trim()||"외주";L.push([o.start||o.due||"9",n]);});L.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);const o=[...new Set(L.map(x=>x[1]))];out.forEach(j=>{if(!o.includes(j.cl))o.push(j.cl);});return o;})();ROOF={};
  let PL=null;try{PL=window.DB&&DB.skin.pal&&DB.skin.pal();}catch(e){}
  cls.forEach((n,i)=>{if(MIFFY){const R6=vpNow().r;ROOF[n]=R6[i%R6.length];return;}const c=PL&&PL.length?PL[i%PL.length]:"var(--r"+(i%8+1)+")";ROOF[n]=`color-mix(in srgb,${c} 78%,#fff6e8)`;});
  return out.filter(j=>j.lot!=null);
}
// 테마(팔레트)마다 마을 색: M=섞는 바탕(라이트 흰색, 다크 바탕색) G 풀 G2 마당 Pk 공원 R 도로 L 노랑 자리 W 물 S 얕은 물 Sd 모래 T/T2 나무 K 줄기 Win 창문 Bn 벤치 A 다리 Ink 선 Wall 벽 r 지붕
const VPK=["M","G","G2","Pk","R","L","W","S","Sd","T","T2","K","Win","Bn","A","Ink","Wall"];
const VP0={M:"#fff",G:"#7dbb68",G2:"#93c97c",Pk:"#86c270",R:"#005b93",L:"#ffdd50",W:"#3f8fd0",S:"#6cc3e0",Sd:"#f4dc9a",T:"#2f8a36",T2:"#ffdd50",K:"#6c3304",Win:"#005b93",Bn:"#f26935",A:"#f26935",Ink:"#4d4a46",Wall:"#fff",r:["#f26935","#005b93","#ffdd50","#6c3304","#2f8a3a","#e3231b"]};
const VPS={calm:{},
folder:{M:"#fff4b8",G:"#f7d417",G2:"#f9dc3a",Pk:"#f2cc12",R:"#1D4BA8",L:"#ffffff",W:"#1D4BA8",S:"#3D6FCC",Sd:"#ffe878",T:"#1D4BA8",T2:"#3D6FCC",K:"#1E2140",Win:"#1D4BA8",Bn:"#1D4BA8",A:"#1D4BA8",Ink:"#1E2140",r:["#1D4BA8","#3D6FCC","#ffc933","#1E2140","#7398DC","#f5b800"]},
sakura:{G:"#b9d8a0",G2:"#cfe4bb",Pk:"#c4dcae",R:"#D9879C",L:"#ffffff",W:"#8fc0e3",S:"#c4e2f2",Sd:"#F7D4DB",T:"#F3B3C4",T2:"#e79bb0",K:"#8a5a5f",Win:"#D9879C",Bn:"#D9879C",A:"#D9879C",Ink:"#7a5560",r:["#F3B3C4","#D9879C","#EBBDBD","#c9768c","#F9CED8","#a8c8e8"]},
green:{G:"#A7D08C",G2:"#CFE3B4",Pk:"#5FA86B",R:"#8C6A4F",L:"#F2B544",W:"#4f9c96",S:"#9fd6c5",Sd:"#E3F0C8",T:"#1F5C3A",T2:"#2F7A4A",K:"#8C6A4F",Win:"#1F5C3A",Bn:"#E8573C",A:"#E8573C",Ink:"#1F3D2B",r:["#E8573C","#F2B544","#2F7A4A","#8C6A4F","#1F5C3A","#5FA86B"]},
pudding:{G:"#A8E6CF",G2:"#c9f0dd",Pk:"#9ddcc2",R:"#E9A23B",L:"#FFF4D6",W:"#9AD0F5",S:"#c4e4fa",Sd:"#FFE08A",T:"#7cc8a4",T2:"#F48FB1",K:"#8A5A3C",Win:"#8A5A3C",Bn:"#F48FB1",A:"#E8739B",Ink:"#6B4226",r:["#F48FB1","#FFB86B","#FFE08A","#C8A2E8","#9AD0F5","#E9A23B"]},
cloud:{G:"#b9e3c6",G2:"#cdeee0",Pk:"#A6E3E9",R:"#9C8CF0",L:"#FFE7A3",W:"#8EC5FF",S:"#bcdcff",Sd:"#FFE3F1",T:"#C9B8FF",T2:"#FFB5D8",K:"#8a7fc0",Win:"#9C8CF0",Bn:"#FFB5D8",A:"#9C8CF0",Ink:"#4A4E7A",r:["#FFB5D8","#C9B8FF","#9C8CF0","#8EC5FF","#FFD0B5","#FFE7A3"]},
lilac:{G:"#cbd3f0",G2:"#dfe4f7",Pk:"#B9C3F2",R:"#6E85D1",L:"#eef6fb",W:"#A9D2EC",S:"#cfe6f4",Sd:"#F2C5D6",T:"#4E7F9C",T2:"#C9A6E0",K:"#4E7F9C",Win:"#6E85D1",Bn:"#C9A6E0",A:"#6E85D1",Ink:"#3d4570",r:["#6E85D1","#C9A6E0","#F2C5D6","#4E7F9C","#A9D2EC","#B9C3F2"]},
sunny:{G:"#9BD770",G2:"#b5e290",Pk:"#9BD770",R:"#5CB8E4",L:"#FFE45C",W:"#5CB8E4",S:"#7FDDE8",Sd:"#ffe9a8",T:"#4fa83a",T2:"#FF9CC2",K:"#a0622d",Win:"#0730d5",Bn:"#F28C38",A:"#FF9CC2",Ink:"#3b3a5a",r:["#FFE45C","#FFB938","#FF9CC2","#5CB8E4","#F28C38","#0730d5"]},
mono:{G:"#c9ddd6",G2:"#dfe6e3",Pk:"#cfdcd6",R:"#3c3b39",L:"#f3c15e",W:"#3473b7",S:"#9fbfdc",Sd:"#ede6d3",T:"#4D7A5A",T2:"#f3c15e",K:"#3c3b39",Win:"#3c3b39",Bn:"#d54134",A:"#d54134",Ink:"#2A2724",r:["#3c3b39","#d54134","#3473b7","#f3c15e","#4D7A5A","#7A3D5D"]},
rocket:{G:"#B6B6B6",G2:"#cfcfcf",Pk:"#c4c4c4",R:"#005288",L:"#fc5822",W:"#1D7373",S:"#2dacae",Sd:"#F4F4F4",T:"#1D7373",T2:"#2dacae",K:"#1A1A1A",Win:"#005288",Bn:"#fc5822",A:"#fc5822",Ink:"#1A1A1A",r:["#fc5822","#2dacae","#005288","#1D7373","#e55010","#1A1A1A"]},
maroon:{G:"#a8a26a",G2:"#E1D3A9",Pk:"#8F7C3A",R:"#734F31",L:"#E1D3A9",W:"#5E7C80",S:"#9bb0a8",Sd:"#E1D3A9",T:"#A85530",T2:"#8F7C3A",K:"#371E13",Win:"#371E13",Bn:"#5E2A25",A:"#A85530",Ink:"#371E13",r:["#5E2A25","#A85530","#C0AA8A","#734F31","#8F7C3A","#371E13"]},
tarp:{G:"#d9dcd2",G2:"#e6e6e6",Pk:"#cfd6c4",R:"#3670FF",L:"#F9D601",W:"#1F3FA8",S:"#9DB8FF",Sd:"#FFE97A",T:"#1F3FA8",T2:"#F9D601",K:"#171717",Win:"#3670FF",Bn:"#F9D601",A:"#3670FF",Ink:"#171717",r:["#F9D601","#3670FF","#1F3FA8","#9DB8FF","#171717","#FFE97A"]},
blockdark:{M:"#172033",G:"#8fb83a",G2:"#9fd13a",Pk:"#2EC4D6",R:"#5A6478",L:"#FFD84D",W:"#2EC4D6",S:"#7C8CFF",Sd:"#FFD84D",T:"#7C8CFF",T2:"#FF9AD5",K:"#5A6478",Win:"#FFD84D",Bn:"#FF7A1A",A:"#FF9AD5",Ink:"#0b1020",Wall:"#E9EDF5",r:["#FF9AD5","#C3F53C","#2EC4D6","#FF7A1A","#7C8CFF","#FFD84D"]},
neon:{M:"#021826",G:"#0b8a6a",G2:"#0d9c74",Pk:"#01595A",R:"#3FC1C9",L:"#EAF405",W:"#3FC1C9",S:"#06F284",Sd:"#9BFF6C",T:"#06F284",T2:"#f29eff",K:"#01595A",Win:"#EAF405",Bn:"#f29eff",A:"#f29eff",Ink:"#010d15",Wall:"#c7c7c7",r:["#f29eff","#06F284","#EAF405","#3FC1C9","#9BFF6C","#c7c7c7"]},
alien:{M:"#060A07",G:"#1FA80B",G2:"#0F7A4A",Pk:"#2BD90F",R:"#00E5C7",L:"#39FF14",W:"#0F7A4A",S:"#00E5C7",Sd:"#B6FF9E",T:"#39FF14",T2:"#7CFF5C",K:"#0B3D2E",Win:"#39FF14",Bn:"#00E5C7",A:"#39FF14",Ink:"#020402",Wall:"#B6FF9E",r:["#39FF14","#00E5C7","#7CFF5C","#1FA80B","#B6FF9E","#0F7A4A"]},
halloween:{M:"#120A1C",G:"#502C76",G2:"#6a4a9e",Pk:"#502C76",R:"#C9B8F0",L:"#FD8D10",W:"#8267D0",S:"#C9B8F0",Sd:"#FFC46B",T:"#FF5404",T2:"#FD8D10",K:"#07020A",Win:"#FFC46B",Bn:"#FF5404",A:"#FD8D10",Ink:"#07020A",Wall:"#C9B8F0",r:["#FF5404","#FD8D10","#8267D0","#FFC46B","#C9B8F0","#502C76"]}};
const VPOLD={dawnsea:"lilac",iron:"rocket",bloom:"calm",pastel:"cloud",basic:"calm",candy:"pudding",tropical:"sunny",vivid:"sunny",nature:"green",vintage:"maroon",muted:"mono",deep:"maroon"};
function vpKey(){try{const S=(DB.skin.R.get().settings)||{};let k=S.palKey||"calm";return VPOLD[k]||k;}catch(e){return"calm"}}
function vpNow(){const k=vpKey();if(VPS[k])return Object.assign({},VP0,VPS[k],{k});let pl=null;try{pl=DB.skin.pal&&DB.skin.pal()}catch(e){}return Object.assign({},VP0,{k,r:pl&&pl.length>=4?pl.slice(0,6):VP0.r});}
function vpApply(el){const v=vpNow();VPK.forEach(n=>el.style.setProperty("--v"+n,v[n]));el.dataset.vp=v.k;return v;}
// ---------- 공통 ----------
let pop,menu,toast,undoFn=null,tT;
function vUiInit(){if(!document.getElementById("vlg-pop")){document.body.insertAdjacentHTML("beforeend",'<div class="vlg-pop" id="vlg-pop"></div><div class="vlg-menu" id="vlg-menu"></div><div class="vlg-toast" id="vlg-toast"><span data-t></span><button data-undo>되돌리기</button></div>');
  document.addEventListener("click",e=>{if(!e.target.closest(".vlg-pop,.vlg-menu,.hz"))closeAll();});}
  pop=document.getElementById("vlg-pop");menu=document.getElementById("vlg-menu");toast=document.getElementById("vlg-toast");
  toast.querySelector("[data-undo]").onclick=()=>{undoFn&&undoFn();toast.classList.remove("on");};}
function say(msg,u){toast.querySelector("[data-t]").textContent=msg;undoFn=u;toast.querySelector("[data-undo]").style.display=u?"":"none";toast.classList.add("on");clearTimeout(tT);tT=setTimeout(()=>toast.classList.remove("on"),4000);}
function closeAll(){if(pop){pop.classList.remove("on");menu.classList.remove("on");}}
function place(el,x,y){el.style.left=Math.min(x,innerWidth-el.offsetWidth-12)+"px";el.style.top=Math.min(y,innerHeight-el.offsetHeight-12)+"px";}
let cur=null;
const THU={};let THdb=null;function thumbURL(k){if(!k)return Promise.resolve(null);if(THU[k])return THU[k];
  THdb=THdb||new Promise(res=>{try{const r=indexedDB.open("planner-commission");r.onsuccess=()=>res(r.result);r.onerror=()=>res(null);}catch(_){res(null)}});
  return THU[k]=THdb.then(d=>{if(!d||!d.objectStoreNames.contains("blobs"))return null;return new Promise(res=>{try{const q=d.transaction("blobs").objectStore("blobs").get(k);q.onsuccess=()=>res(q.result?URL.createObjectURL(q.result):null);q.onerror=()=>res(null);}catch(_){res(null)}});});}
let tip;function tipShow(j,x,y){if(pop&&pop.classList.contains("on"))return tipHide();
  if(!tip){tip=document.createElement("div");tip.className="vlg-tip";document.body.appendChild(tip);}
  const k=tip.dataset.id!=j.id;if(k){tip.dataset.id=j.id;tip.innerHTML=`<b>${j.cl}</b><span>${j.k=="c"?j.t:j.t+(j.pg?" · "+j.pg+"p":"")}</span><span>${j.done?`${j.m+1}월 ${j.d}일 완성`:"접는 중 "+j.p+"%"} · ${won(j.fee)}</span>`;}
  tip.style.display="flex";const w=tip.offsetWidth,h=tip.offsetHeight;let L=x+14,T=y+16;if(L+w>innerWidth-8)L=x-w-14;if(T+h>innerHeight-8)T=y-h-12;tip.style.left=L+"px";tip.style.top=T+"px";}
function tipHide(){if(tip){tip.style.display="none";tip.dataset.id="";}}
function showPop(j,x,y){tipHide();
  const wk=j.done?`${j.m+1}.${j.start} ~ ${j.m+1}.${j.d}`:"진행 "+j.p+"%";
  pop.innerHTML=`<div class="k">${j.k=="c"?"커미션":"외주"} · ${j.done?MN[j.m]+" "+(j.lot+1)+"번지":"접는 중"}</div><h4>${j.t}</h4>
   <div class="r"><span>의뢰인</span><span>${j.cl}</span></div><div class="r"><span>금액</span><span>${won(j.fee)}</span></div>
   ${j.pg?`<div class="r"><span>분량</span><span>${j.pg}페이지</span></div>`:""}<div class="r"><span>${j.done?"작업":"상태"}</span><span>${wk}</span></div>
   <div class="bt"><button class="pill dark" data-o>의뢰 열기</button>${j.done?"":`<button class="pill lite" data-fin>완료로 바꾸기</button>`}</div>`;
  pop.classList.add("on");place(pop,x+12,y+12);
  pop.querySelector("[data-o]").onclick=()=>{closeAll();say(`${j.k=="c"?"커미션":"외주"} › ${j.cl} · ${j.t} 열기 (시안에서는 이동 없음)`);};
  const f=pop.querySelector("[data-fin]");if(f)f.onclick=()=>{closeAll();finish(j);};
}
function showMenu(j,x,y){
  menu.innerHTML=`<button data-a="info">자세히 보기</button><button data-a="open">의뢰 열기</button><hr>
   ${j.done?"":`<button data-a="fin">완료로 바꾸기</button><hr>`}<button data-a="nb">같은 의뢰인 집 보기</button><button data-a="mv">자리 옮기기 <span class="ar">끌기</span></button><hr><button data-a="hide" class="del">도시 계획에서 숨기기</button>`;
  menu.classList.add("on");place(menu,x,y);
  menu.onclick=e=>{const a=e.target.closest("button")?.dataset.a;if(!a)return;closeAll();
    if(a=="info")showPop(j,x,y);if(a=="open")say(`${j.cl} · ${j.t} 열기 (시안에서는 이동 없음)`);
    if(a=="fin")finish(j);if(a=="nb"){V.forEach(v=>v.nb(j.cl));}
    if(a=="mv")say("집을 끌어서 빈 자리에 놓으세요");
    if(a=="hide"){j.hid=true;renderAll();say("도시 계획에서 숨겼어요 · 의뢰 기록은 그대로",()=>{j.hid=false;renderAll();});}};
}
function finish(j){const old={...j};j.done=true;j.m=CM;j.d=31;j.start=12;j.isNew=true;
  const used=J.filter(x=>x!==j&&x.done&&x.m==CM).map(x=>x.lot);let l=0;while(used.includes(l))l++;j.lot=l;
  renderAll();say(`${j.cl} · ${j.t} 준공! 10월길에 한 채 늘었어요`,()=>{Object.assign(j,old);delete j.isNew;renderAll();});setTimeout(()=>delete j.isNew,400);}


let V=[];function renderAll(){V.forEach(v=>v.render());}
function finish(j){const old={...j};j.done=true;j.m=CM;j.d=31;j.start=12;
  const keep=j.lot;
  renderAll();document.querySelectorAll(`.hz[data-id="${j.id}"]`).forEach(g=>g.classList.add("fold-in"));say(`${j.cl} · ${j.t} 다 접었어요! (미리보기라 저장은 안 돼요)`,()=>{Object.assign(j,old);renderAll();});}
const inMR=(x,y)=>MR.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h),inPkY=inMR;
// 길 한 줄(고정 좌표 f, 축 ax: 'x'=세로 길)에서 합친 블록에 끊기는 구간을 뺀 나머지 구간
// 땅 모양: 마을 밖은 둥글고 들쭉날쭉한 둘레 땅(ZN 0) → 강(1) → 건너편 땅(2). 다리(BR)는 가운데 길 따라 밖으로
const LIM=(x,y)=>Math.max(2.3,3.4+.9*Math.sin(x*.33+1.3)+.7*Math.sin(y*.29+.4)+.5*Math.sin((x+y)*.17+2.1)),RVW=(x,y)=>5+1.4*Math.sin(x*.21+y*.19+.7);
// 해안 도시: 뒤쪽(y<0) 한 면만 육지로 이어지고(올라갈수록 해안선이 벌어짐) 나머지 세 면은 바다
// 강 (04 2026-11-03 실제 지도 참고 "강도 흐르면 좋겠고"): 마을 왼쪽(x<0)을 따라 내려오다 앞쪽(y>GY)으로 굽어 흐르는 강. 굽이(사인 두 겹)로 폭·거리 달라짐
// FF<.45 = 마을 쪽 땅, .45~RW0-.45 = 물·모래, >RW0-.45 = 건너편 땅
const RVD=(x,y)=>{const dx=Math.max(0,-x),dy=Math.max(0,y-GY),al=y-x;return Math.hypot(dx,dy)-(5.8+1.9*Math.sin(al*.15+1)+.6*Math.sin(al*.37+2));},RW0=5.2;
const FF=(px,py)=>RVD(px,py)+RW0/2;
// 칸 네 꼭짓점이 모두 물가선(.45) 안이면 땅(0), 모두 건너편 선 밖이면 건너편(2), 아니면 물·모래(1, 칸 대신 매끈한 곡선으로 그림)
const ZN=(x,y)=>{if(x>=0&&y>=0&&x<GX&&y<GY)return 0;const v=[FF(x,y),FF(x+1,y),FF(x,y+1),FF(x+1,y+1)];if(Math.max(...v)<.45)return 0;if(Math.min(...v)>RW0-.45)return 2;return 1;};
const BRL=()=>BRL0(),BRL0=()=>{const ax=[...RDX].filter(v=>v<GX).sort((a,b)=>a-b),ay=[...RDY].filter(v=>v<GY).sort((a,b)=>a-b);return {x:ax.length?ax[Math.floor((ax.length-1)/2)]:-1,y:ay.length?ay[Math.floor((ay.length-1)/2)]:-1};};
const BR=(x,y,b)=>x==b.x&&(y<0||y>=GY);// 다리는 앞쪽 하나만 (04 2026-11-03)
const rdSegs=(f,ax,a0,a1)=>{const cut=MR.filter(r=>ax=='x'?f>=r.x&&f<r.x+r.w:f>=r.y&&f<r.y+r.h).map(r=>ax=='x'?[r.y,r.y+r.h]:[r.x,r.x+r.w]).sort((a,b)=>a[0]-b[0]);let o=[],c=a0;cut.forEach(([u,v])=>{if(u>c)o.push([c,u]);c=Math.max(c,v);});if(a1>c)o.push([c,a1]);return o;};
// 미피(딕 브루너) 색감: 납작한 원색 6가지 + 진한 테두리. false면 앱 테마 색
const MIFFY=true,BRUNA0=["#f26935","#005b93","#ffdd50","#6c3304","#2f8a3a","#e3231b"];
let RB=null,RCN=[],CAS=new Set(),CNK=new Set(),EMP=[],MR=[],DYN=[],TW=88,TH=44,GX=15,GY=12,PL=[],TI={},CEL={},LN={},ALY=[],PK=null,GDN=[],RDX=new Set(),RDY=new Set();
// 달 구역 크기: 그 달 일 수에 맞춰 정사각형(최소 3×3). 같은 열은 가장 넓은 달, 같은 줄은 가장 깊은 달에 맞춤 → 길이 곧게 이어짐
function layout(out){const n=Array(12).fill(0);out.forEach(j=>n[j.m]++);
  // 그 달 일 수만큼 집터(a×b). 집터 줄 사이엔 골목(LN), 달마다 골목 방향을 바꿈. 구역 안 자리는 조금씩 어긋나게
  // 줄마다 길이·시작 위치를 조금씩 다르게 → 들쭉날쭉한 블록 (o=1이면 세로 줄)
  // 집터 배치: c채를 W×H 땅에 줄(L) 단위로. o=0이면 줄이 x방향. 줄마다 길이·시작 위치를 조금씩 다르게(들쭉날쭉)
  const mkSz=(c,m,W,H)=>{c=Math.max(1,c);for(const o of [m%2,1-m%2]){const LW=o?H:W,NW=o?W:H;let b=Math.max(1,Math.min(NW,Math.round(Math.sqrt(c*NW/LW))));
      while(b<=NW&&Math.ceil(c/b)>LW)b++;if(b>NW)continue;const a=Math.ceil(c/b),L=Array(b).fill(a);let ex=a*b-c,i=0;
      while(ex>0){const r=hsh(m*17+i++)%b;if(L[r]>1){L[r]--;ex--;}}
      if(c>3)for(let t=0;t<b;t++){const r1=hsh(m*5+t)%b,r2=hsh(m*9+t+3)%b;if(r1!=r2&&L[r1]>1&&L[r2]<LW){L[r1]--;L[r2]++;}}
      const off=L.map((l,r)=>c>2&&l<LW?hsh(m*23+r*7)%2:0),fl=Math.max(...L.map((l,r)=>l+off[r]));
      return o?{L,off,o,fw:b,fh:fl}:{L,off,o,fw:fl,fh:b};}return null;};
  // 블록: 한 변 S칸, 한 줄에 3칸. 줄(bx)마다 왼쪽 아래→오른쪽 위(by 2→0) 순서로 달을 채움(1 2 3 / 4 5 6 / …).
  // 일이 많아 한 블록에 안 들어가면 옆(같은 줄) 또는 아래(다음 줄) 블록과 합침. 3번째 줄 가운데 한 블록은 공원
  const S=4,U=S+1,used={},MRs=[],PLs=[];const tk=(x,y)=>x+","+y;used[tk(2,1)]=1;
  const SH=[[1,1],[1,2],[2,1],[1,3],[2,2],[2,3],[3,3],[4,3],[5,3]];let bx=0,by=2,maxX=3;
  const free=(x,y,dr,ds)=>{if(y-ds+1<0)return false;for(let i=0;i<dr;i++)for(let j=0;j<ds;j++)if(used[tk(x+i,y-j)])return false;return true;};
  for(let m=0;m<12;m++){let done=false;
    while(!done){while(used[tk(bx,by)]){by--;if(by<0){by=2;bx++;}}
      for(const [dr,ds] of SH){const W=dr*S+dr-1,H=ds*S+ds-1,q=mkSz(n[m],m,W,H);if(!q)continue;
        if(!free(bx,by,dr,ds)){if(dr*ds>1)continue;else break;}
        for(let i=0;i<dr;i++)for(let j=0;j<ds;j++)used[tk(bx+i,by-j)]=1;
        const R={x:bx*U,y:(by-ds+1)*U,w:W,h:H};if(dr*ds>1)MRs.push(R);PLs.push({m,q,R});maxX=Math.max(maxX,bx+dr-1);done=true;break;}
      if(!done){used[tk(bx,by)]=2;if(bx>40){PLs.push({m,q:mkSz(1,m,S,S),R:{x:bx*U,y:by*U,w:S,h:S}});done=true;}}}}
  const NR=maxX+1;EMP=[];for(let x=0;x<NR;x++)for(let y=0;y<3;y++)if(used[tk(x,y)]!=1)EMP.push({x:x*U,y:y*U,w:S,h:S});MR=MRs.slice();PK={x:2*U,y:U,w:S,h:S};MR.push(PK);GDN=[];
  // 합친 블록이 마을 가장자리(뒤쪽: 위·왼쪽)에 닿으면 그 뒤 흐린 동네 블록도 같이 합쳐 길이 끊기게
  // (뒤쪽 흐린 동네 블록 합치기는 길이 끊겨 보여서 뺌, 04 2026-11-01)
  RDX=new Set();RDY=new Set();for(let i=0;i<NR;i++)RDX.add(i*U+S);for(let i=0;i<3;i++)RDY.add(i*U+S);
  PL=[];TI={};CEL={};LN={};ALY=[];PLs.forEach(({m,q,R})=>{const w=q.fw,h=q.fh,x=R.x,y=R.y,lots=[];
    // 집이 적어도 블록 전체에 고르게 퍼지게: 집터 격자(w×h)를 블록(R.w×R.h)에 늘려 놓음
    const kx=R.w/w,ky=R.h/h,PX=u=>R.x+Math.floor((u+.5)*kx),PY=v=>R.y+Math.floor((v+.5)*ky),EX=u=>R.x+Math.round(u*kx),EY=v=>R.y+Math.round(v*ky);
    q.L.forEach((l,r)=>{for(let t=0;t<l;t++){const u=q.off[r]+t;lots.push(q.o?[PX(r),PY(u)]:[PX(u),PY(r)]);}});
    // 골목: 줄 사이 경계선을 따라 좁은 길(두 줄이 겹치는 구간만)
    for(let r=1;r<q.L.length;r++){const s0=Math.min(q.off[r-1],q.off[r]),s1=Math.max(q.off[r-1]+q.L[r-1],q.off[r]+q.L[r]);ALY.push(q.o?[EX(r),R.y,EX(r),R.y+R.h,m]:[R.x,EY(r),R.x+R.w,EY(r),m]);/* 길목은 블록 끝(길)까지 이어 그림 */}
    /* 큰 원형 길 위에는 집을 두지 않음 */if(PK){const pcx=PK.x+PK.w/2,pcy=PK.y+PK.h/2,RRx=(PK.w/2+.5)*Math.SQRT2+.75;for(let i=lots.length-1;i>=0;i--)if(lots.length>1&&Math.hypot(lots[i][0]+.5-pcx,lots[i][1]+.5-pcy)<RRx)lots.splice(i,1);}
    lots.sort((a,b)=>(a[0]+a[1])-(b[0]+b[1])||a[0]-b[0]);
    lots.forEach(([lx,ly],i)=>TI[lx+","+ly]={m,i});for(let a=0;a<R.w;a++)for(let b=0;b<R.h;b++)CEL[(R.x+a)+","+(R.y+b)]=m;PL[m]={x,y,w:R.w,h:R.h,lots,cell:{x:R.x,y:R.y,w:R.w,h:R.h}};});
  GX=NR*U;GY=3*U;
  // 둥근 모서리 (04 2026-11-03 "모서리에 있는 것만 둥글게 말아"): 실제 마을(달·공원 블록) 바깥 모양에서 볼록한 모서리만 찾음. 빈 칸 모서리는 제외
  {const oc=(i,j)=>i>=0&&j>=0&&i<NR&&j<3&&used[tk(i,j)]==1,cv=(i,j,dx,dy)=>oc(i,j)&&!oc(i+dx,j)&&!oc(i,j+dy)&&!oc(i+dx,j+dy);RCN=[];CAS=new Set();CNK=new Set();
    for(let i=0;i<NR;i++)for(let j=0;j<3;j++)[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([dx,dy])=>{if(!cv(i,j,dx,dy)||dy<0)return;/* 뒤쪽(2월·12월 쪽) 모서리는 둥글게 안 함, 강 쪽 앞 모서리만 (04 2026-11-03) */const tx=dx<0?i*U-1:i*U+S,ty=dy<0?j*U-1:j*U+S,r=cv(i,j,-dx,dy)||cv(i,j,dx,-dy)?2.4:4.2;
      RCN.push({nx:tx+.5,ny:ty+.5,sx:-dx,sy:-dy,r});CNK.add(tx+","+ty);for(let t=1;t<=4;t++){CAS.add(tx+","+(ty+dy*t));CAS.add((tx+dx*t)+","+ty);}});}
  /* 공원 둘레 네모 길은 없애고 더 큰 동그란 길로 (04 2026-11-03 "정사각형 도로보다 키워") */if(PK){for(let t=0;t<PK.w;t++){CAS.add((PK.x+t)+","+(PK.y-1));CAS.add((PK.x+t)+","+(PK.y+PK.h));}for(let t=0;t<PK.h;t++){CAS.add((PK.x-1)+","+(PK.y+t));CAS.add((PK.x+PK.w)+","+(PK.y+t));}}
  // 블록 크기 제각각 (04 2026-11-03 실제 지도 참고 "땅도 자연스럽게"): 이웃 블록 둘·넷을 큰 땅(아파트 단지처럼)으로 합침. 사이 길은 없어지고 땅이 이어짐
  {const tk2=(a,b)=>a+","+b,uu={},inG=(a,b)=>a>=0&&b>=0&&a<NR&&b<3,cand=[];for(let a=-11;a<NR+11;a++)for(let b=-11;b<14;b++)cand.push([a,b]);
    const bc=Math.floor((NR-1)/2),ok=(a,b,w,h)=>{if(a<=bc&&a+w-1>bc||b<=1&&b+h-1>1)return false;/* 다리로 가는 길은 끊지 않음 */for(let i=0;i<w;i++)for(let j=0;j<h;j++){const A=a+i,B=b+j;if(uu[tk2(A,B)])return false;if(inG(A,B))return false;}return true;};
    cand.forEach(([a,b])=>{const h=hsh((a+40)*31+(b+40)*17);if(h%10>=4)return;const sh=[[2,1],[1,2],[2,2],[3,1]][(h>>4)%4];if(!ok(a,b,...sh))return;
      for(let i=0;i<sh[0];i++)for(let j=0;j<sh[1];j++)uu[tk2(a+i,b+j)]=1;MR.push({x:a*U,y:b*U,w:sh[0]*U-1,h:sh[1]*U-1,vm:1});});
    // 마을 안 달 블록은 꾸밈으로 합치지 않음: 일이 많은 달만 옆·아래 블록을 차지하고 다른 달이 뒤로 밀림(위 layout, 04 2026-11-03)
    }}
// 땅 모양 (04 2026-11-03 "블록 자체가 사각형, 지도처럼"): 교차로(길 가운데 격자점)마다 위치를 조금씩 비틀어 블록이 제각각 사다리꼴·마름모꼴이 되게.
// 격자점 사이는 그대로 이어 붙여(쌍선형) 길은 곧고 끊기지 않음. 집·칸·길 모두 같은 비틀기를 따름
const WA=0,WN=(i,j)=>hsh((i+50)*41+(j+50)*67)%4?[0,0]:[((hsh((i+50)*73+(j+50)*19)%1000)/1000-.5)*2*WA,((hsh((i+50)*31+(j+50)*97)%1000)/1000-.5)*2*WA];
const WP0=(x,y)=>{const u=(x-4.5)/5,v=(y-4.5)/5,i=Math.floor(u),j=Math.floor(v),fx=u-i,fy=v-j,a=WN(i,j),b=WN(i+1,j),c=WN(i,j+1),d=WN(i+1,j+1),m=(k)=>a[k]*(1-fx)*(1-fy)+b[k]*fx*(1-fy)+c[k]*(1-fx)*fy+d[k]*fx*fy;return [x+m(0),y+m(1)];};
// 둥근 모서리 땅 (04 2026-11-03 "모서리에 있는 것만, 1월 모서리 도로만 둥그렇게"): 1월 바깥 모서리(강 쪽) 교차로 둘레를 원호로 당김. 네모 모서리→원, 바깥으로 갈수록 원래대로
const WP=(x,y)=>{for(const k of RCN){const cx=k.nx+k.sx*k.r,cy=k.ny+k.sy*k.r,a=(cx-x)*k.sx,b=(cy-y)*k.sy;if(a<=0||b<=0)continue;const m=Math.max(a,b),L=Math.hypot(a,b),f=m<=k.r+.7?1:Math.max(0,1-(m-k.r-.7)/(1.4*k.r)),s=1-f+f*m/L;x=cx-k.sx*a*s;y=cy-k.sy*b*s;}/* 가운데 분수공원 땅을 동그랗게 (04 2026-11-03): 공원 블록+둘레 길을 원으로, 밖으로 갈수록 원래대로 */if(PK&&0){const cx=PK.x+PK.w/2,cy=PK.y+PK.h/2,R=PK.w/2+.5,a=x-cx,b=y-cy,m=Math.max(Math.abs(a),Math.abs(b)),L=Math.hypot(a,b);if(L>1e-6){const f=m<=R+.7?1:Math.max(0,1-(m-R-.7)/2.5),s=1-f+f*m*Math.SQRT2/L;/* 원이 네 모서리 교차로를 지나게(모서리는 제자리, 변 가운데를 바깥으로) — 길이 안으로 말리지 않게 (04 2026-11-03) */x=cx+a*s;y=cy+b*s;}}return [x,y];};
// 긴 변은 잘게 나눠 비틀린 땅을 따라 꺾이게
const SUBD=(pts,m=.3)=>{const o=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/m));for(let j=0;j<n;j++)o.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);}return o;};
const P=a=>a.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
const up=(p,h)=>[p[0],p[1]-h];
function iso(j,cx,cy,sc=1){
  const rf=ROOF[j.cl];let s="";const t=j.done?tier(j):1;const k=sc*TW/58;
  const face=(p0,p1,u1,u2,v1,v2,hh)=>{const q=(u,v)=>[p0[0]+(p1[0]-p0[0])*u,p0[1]+(p1[1]-p0[1])*u-hh*v];return P([q(u1,v1),q(u2,v1),q(u2,v2),q(u1,v2)]);};
  if(!j.done){const f=.8,a=TW*f/2*sc,b=TH*f/2*sc,E=[cx+a,cy],S=[cx,cy+b],Wp=[cx-a,cy],h=(6+30*j.p/100)*k,H2=40*k;
    s+=`<polygon class="lf dsh" points="${P([Wp,S,up(S,h),up(Wp,h)])}" style="fill:${rf};fill-opacity:.35"/><polygon class="rt dsh" points="${P([S,E,up(E,h),up(S,h)])}" style="fill:${rf};fill-opacity:.25"/>`;
    [Wp,S,E].forEach(p=>s+=`<line x1="${p[0]}" y1="${p[1]}" x2="${p[0]}" y2="${p[1]-H2}" stroke="currentColor" stroke-width="1.2"/>`);
    [.35,.7,1].forEach(v=>s+=`<polyline points="${P([up(Wp,H2*v),up(S,H2*v),up(E,H2*v)])}" fill="none" stroke="currentColor" stroke-width="1"/>`);
    s+=`<rect class="pcb" x="${cx-16}" y="${cy-H2-22}" width="32" height="14" rx="7"/><text class="pc" x="${cx}" y="${cy-H2-11.5}" text-anchor="middle">${j.p}%</text>`;return s;}
  if(j.k=="c"){const sh=SHP[j.t]||0,F=[.52,.64,.76][t],f=sh==3?F*.72:sh==4?F*1.06:F,a=TW*f/2*sc,b=TH*f/2*sc;
    let h=[10,12.5,15][t]*k,rh=[16,19,23][t]*k;if(sh==3){h*=2.1;rh*=1.3;}if(sh==5){h*=.35;rh*=1.9;}if(sh==2)h*=1.15;
    const N=[cx,cy-b],E=[cx+a,cy],S=[cx,cy+b],Wp=[cx-a,cy],Wt=up(Wp,h),St=up(S,h),Et=up(E,h),Nt=up(N,h),mid=(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2];
    const walls=()=>`<polygon class="lf dsh" points="${P([Wp,S,St,Wt])}"/><polygon class="rt dsh" points="${P([S,E,Et,St])}"/>`;
    const door=()=>`<polygon points="${face(Wp,S,.4,.65,0,Math.min(.62,8*k/h),h)}" style="fill:${rf}"/>`;
    const win=(v1,v2)=>`<polygon class="w" points="${face(S,E,.2,.45,v1,v2,h)}"/>`+(t>0?`<polygon class="w" points="${face(S,E,.58,.83,v1,v2,h)}"/>`:"");
    const pyr=(A)=>`<polygon class="rf" points="${P([Wt,St,A])}" style="fill:${rf}"/><polygon class="rf" points="${P([St,Et,A])}" style="fill:${rf};filter:brightness(.82)"/>`;
    s+=walls();
    if(sh==0){s+=door()+win(.35,.75)+pyr([cx,cy-h-rh]);}
    else if(sh==1||sh==5){const R1=up(mid(Wt,St),rh),R2=up(mid(Nt,Et),rh);
      if(sh==1)s+=door()+win(.35,.75);
      s+=`<polygon class="rf" points="${P([Wt,R1,R2,Nt])}" style="fill:${rf};filter:brightness(1.1)"/><polygon class="lf" points="${P([Wt,St,R1])}"/><polygon class="rf" points="${P([St,Et,R2,R1])}" style="fill:${rf};filter:brightness(.82)"/>`;
      if(sh==5)s+=`<polygon points="${face(Wp,S,.4,.6,0,1,h+rh*.42)}" style="fill:${rf}"/>`;}
    else if(sh==2){s+=door()+win(.35,.75)+`<polygon points="${P([Wt,St,Et,Nt])}" style="fill:${rf};filter:brightness(1.1)"/>`;
      const c0=[cx+a*.35,cy-b*.25],cw2=a*.16,cb=b*.16,ch=9*k,q=[[c0[0]-cw2,c0[1]],[c0[0],c0[1]+cb],[c0[0]+cw2,c0[1]]].map(p=>up(p,h));
      s+=`<polygon class="lf" points="${P([q[0],q[1],up(q[1],ch),up(q[0],ch)])}"/><polygon class="rt" points="${P([q[1],q[2],up(q[2],ch),up(q[1],ch)])}"/><polygon points="${P([up(q[0],ch),up(q[1],ch),up(q[2],ch),up([c0[0],c0[1]-cb],h+ch)])}" style="fill:${rf};filter:brightness(.7)"/>`;}
    else if(sh==3){s+=door()+win(.55,.72)+win(.8,.92)+pyr([cx,cy-h-rh]);}
    else if(sh==4){s+=door()+win(.3,.8)+`<polygon points="${P([Wt,St,Et,Nt])}" style="fill:${rf};filter:brightness(.9)"/>`;
      const g=.62,a2=a*g,b2=b*g,o=[cx-a*.12,cy-b*.12],h2=h*.8,W2=up([o[0]-a2,o[1]],h),S2=up([o[0],o[1]+b2],h),E2=up([o[0]+a2,o[1]],h),A=[o[0],o[1]-h-h2-rh*.9];
      s+=`<polygon class="lf dsh" points="${P([W2,S2,up(S2,h2),up(W2,h2)])}"/><polygon class="rt dsh" points="${P([S2,E2,up(E2,h2),up(S2,h2)])}"/>`;
      s+=`<polygon class="w" points="${P([up(S2,h2*.35),up([S2[0]+(E2[0]-S2[0])*.35,S2[1]+(E2[1]-S2[1])*.35],h2*.35),up([S2[0]+(E2[0]-S2[0])*.35,S2[1]+(E2[1]-S2[1])*.35],h2*.75),up(S2,h2*.75)].map(p=>[p[0]+(E2[0]-S2[0])*.25,p[1]+(E2[1]-S2[1])*.25]))}"/>`;
      s+=`<polygon class="rf" points="${P([up(W2,h2),up(S2,h2),A])}" style="fill:${rf}"/><polygon class="rf" points="${P([up(S2,h2),up(E2,h2),A])}" style="fill:${rf};filter:brightness(.82)"/>`;}
    return s;}
  const f=.76,a=TW*f/2*sc,b=TH*f/2*sc,h=[26,40,56][t]*k,N=[cx,cy-b],E=[cx+a,cy],S=[cx,cy+b],Wp=[cx-a,cy];
  s+=`<polygon class="dsh bl" points="${P([Wp,S,up(S,h),up(Wp,h)])}" style="fill:${rf};filter:brightness(.8)"/><polygon class="dsh bl" points="${P([S,E,up(E,h),up(S,h)])}" style="fill:${rf}"/>`;
  s+=`<polygon class="bl" points="${P([up(Wp,h),up(N,h),up(E,h),up(S,h)])}" style="fill:${rf};filter:brightness(1.15)"/>`;
  const fl=t+2;for(let k=0;k<fl;k++)for(const [p0,p1] of [[Wp,S],[S,E]])for(const u of [.22,.6])s+=`<polygon class="w bw" points="${face(p0,p1,u,u+.2,(k+.3)/(fl+.4),(k+.8)/(fl+.4),h)}"/>`;
  return s;}
let NET=true;
function net(j,nx,ny,k,lot){const rf=ROOF[j.cl],u=13*k,fl=j.k=="o";
  const wh=fl?u*2.6:u*1.7,ww=u*1.5,W4=ww*4,x0=-W4/2,y0=-wh/2;let s="";
  const WL="var(--surface)",WD="color-mix(in srgb,var(--fg) 10%,var(--surface))";
  const R=(x,y,w,h)=>`M${x} ${y}h${w}v${h}h${-w}Z`,X=i=>x0+i*ww;let pan=[];
  if(fl){for(let i=0;i<4;i++)pan.push({d:R(X(i),y0,ww,wh),f:rf,fx:i%2?"brightness(.8)":""});
    pan.push({d:R(X(1),y0-ww,ww,ww),f:rf,fx:"brightness(1.15)"});}
  else{const gh=u,rh=u*1.25;
    for(let i=0;i<4;i++){pan.push({d:R(X(i),y0,ww,wh),f:i%2?WD:WL,w:i});
      pan.push(i%2?{d:R(X(i),y0-rh,ww,rh),f:rf,fx:i==3?"brightness(.82)":""}:{d:`M${X(i)} ${y0}l${ww/2} ${-gh}l${ww/2} ${gh}Z`,f:i?WD:WL});}}
  const n=Math.round(pan.length*j.p/100),on=i=>i<n,onW=i=>fl?on(i):on(i*2);
  const deco=()=>{let d="";
    if(fl){for(let i=0;i<4;i++)for(let r=0;r<3;r++)for(const c of [.2,.6])d+=`<rect class="${on(i)?"w":"dr"}" x="${X(i)+ww*c}" y="${y0+u*.35+r*u*.75}" width="${ww*.22}" height="${u*.4}"/>`;}
    else{d+=onW(0)?`<rect x="${X(0)+ww*.38}" y="${y0+wh-u*.95}" width="${ww*.26}" height="${u*.95}" style="fill:${rf}"/>`:`<rect class="dr" x="${X(0)+ww*.38}" y="${y0+wh-u*.95}" width="${ww*.26}" height="${u*.95}"/>`;
      [1,3].forEach(i=>d+=`<rect class="${onW(i)?"w2":"dr"}" x="${X(i)+ww*.3}" y="${y0+u*.45}" width="${ww*.4}" height="${u*.5}" ${onW(i)?`style="fill:${rf};fill-opacity:.35"`:""}/>`);}
    return d;};
  const tabs=`M${x0+W4} ${y0+u*.3}l${u*.45} ${u*.25}v${wh-u*1.1}l${-u*.45} ${u*.25}Z`+[0,1,2,3].map(i=>`M${X(i)+u*.15} ${y0+wh}l${u*.25} ${u*.4}h${ww-u*.8}l${u*.25} ${-u*.4}Z`).join("");
  const fold=`<path class="fold" d="${[1,2,3].map(i=>`M${X(i)} ${y0}v${wh}`).join("")}${fl?`M${X(1)} ${y0}h${ww}`:`M${x0} ${y0}h${W4}`}"/>`;
  // 바깥 테두리(자르는 선)는 실선, 접는 선은 점선
  const outl=(()=>{let d=`M${x0} ${y0+wh}H${x0+W4}V${y0}`;if(fl)d+=`H${X(2)}V${y0-ww}H${X(1)}V${y0}H${x0}Z`;else{const gh=u,rh=u*1.25;for(let i=3;i>=0;i--){d+=i%2?`V${y0-rh}H${X(i)}V${y0}`:`L${X(i)+ww/2} ${y0-gh}L${X(i)} ${y0}`;}d+="Z";}return `<path class="outl" d="${d}"/>`;})();
  const panels=()=>pan.map((p,i)=>`<path class="pn${on(i)?" on":""}" d="${p.d}" style="${on(i)?`fill:${p.f};${p.fx?`filter:${p.fx}`:""}`:""}"/>`).join("")+deco()+fold+outl;
  if(lot&&lot.flat){const [cx,cy]=lot,E=Math.hypot(TW/2,TH/2),sc=(lot.span||.92)*E/(W4+u*1.4),a=.894*sc,b=.447*sc;
    s+=`<g class="nt flat" transform="matrix(${a},${b},${-a},${b},${cx},${cy-(lot.lift||0)}) rotate(${lot.rot||0}) translate(${lot.dx||0},${lot.dy||0})">`;
    s+=`<rect class="sheet3" x="${x0-u*.6}" y="${y0-u*(fl?1.9:1.8)+(fl?u*.5:u*.5)}" width="${W4+u*1.4}" height="${wh+u*(fl?2.9:2.8)-u*1.2}" transform="translate(0,${-u*.5})"/><path class="tab" d="${tabs}"/>`+panels()+`</g>`;
    return s;}
  if(lot){const [cx,cy]=lot;s+=`<polygon class="nlot" points="${P([[cx,cy-TH/2],[cx+TW/2,cy],[cx,cy+TH/2],[cx-TW/2,cy]])}"/><ellipse class="nsh" cx="${cx}" cy="${cy}" rx="${TW*.3}" ry="${TH*.22}"/><path class="lead" d="M${nx} ${ny+wh/2+u*.5} C${nx} ${(ny+cy)/2} ${cx} ${(ny+cy)/2} ${cx} ${cy}"/>`;}
  s+=`<g class="nt" transform="translate(${nx},${ny})"><g class="bob"><g transform="rotate(${(j.id%3-1)*3})">`;
  s+=`<rect class="sheet3" x="${x0-u*.6}" y="${y0-u*(fl?1.9:1.8)}" width="${W4+u*1.4}" height="${wh+u*(fl?2.9:2.8)}"/>`;
  s+=`<path class="tab" d="${tabs}"/>`;
  s+=panels();
  s+=`<text class="nlb" x="${x0-u*.3}" y="${y0+wh+u*1.15}">${j.cl} · ${j.t}</text>`;
  s+=`</g><g transform="translate(${W4/2},${y0-u*1.6})"><rect class="pcb" x="-22" y="-10" width="44" height="20" rx="10"/><text class="pc" y="4" text-anchor="middle">${j.p}%</text></g></g></g>`;
  return s;}
function mkIso(root,cfg){
  const main=root.querySelector("[data-main]"),bd=root.querySelector("[data-board]");let R=0,filt="all",nbCl=null;let PAN={x:0,y:0},PK0=null,RSET=new Set();
  // 마을 밖 길: 교차로끼리 이어진 구간만 남기고, 한쪽만 이어진 끝 구간은 계속 잘라내서 막다른 길이 없게
  const buildRS=()=>{const ext=(lo,hi)=>{const o=[];for(let v=lo;v<=hi;v++)if(((v%5)+5)%5==4)o.push(v);return o;},EX=ext(-PAD,GX+PAD-1),EY=ext(-PAD,GY+PAD-1);
    const inV=(x,y)=>x>=0&&y>=0&&x<GX&&y<GY,land=(x,y)=>ZN(x,y)!=1||BR(x,y,BRL0()),K=(x,y)=>x+","+y;
    const cv={},ch={};EX.forEach(x=>cv[x]=rdSegs(x,'x',-PAD,GY+PAD));EY.forEach(y=>ch[y]=rdSegs(y,'y',-PAD,GX+PAD));
    const on=(x,y,vert)=>land(x,y)&&!CAS.has(x+","+y)&&(vert?cv[x]:ch[y]).some(([u,v])=>{const t=vert?y:x;return t>=u&&t<v;});
    const nd=new Set();EX.forEach(x=>EY.forEach(y=>{if(land(x,y)&&!inMR(x,y))nd.add(K(x,y));}));
    const E=[];EX.forEach(x=>{for(let i=0;i+1<EY.length;i++){const a=EY[i],b=EY[i+1];if(!nd.has(K(x,a))||!nd.has(K(x,b)))continue;let ok=true;for(let t=a;t<=b;t++)if(!on(x,t,1)){ok=false;break;}if(ok)E.push({a:K(x,a),b:K(x,b),v:1,f:x,u:a,w:b,on:1});}});
    EY.forEach(y=>{for(let i=0;i+1<EX.length;i++){const a=EX[i],b=EX[i+1];if(!nd.has(K(a,y))||!nd.has(K(b,y)))continue;let ok=true;for(let t=a;t<=b;t++)if(!on(t,y,0)){ok=false;break;}if(ok)E.push({a:K(a,y),b:K(b,y),v:0,f:y,u:a,w:b,on:1});}});
    const deg=()=>{const d={};E.forEach(e=>{if(e.on){d[e.a]=(d[e.a]||0)+1;d[e.b]=(d[e.b]||0)+1;}});return d;};
    const inVk=k=>{const [x,y]=k.split(",").map(Number);return inV(x,y);};
    for(let it=0;it<60;it++){const d=deg();let ch2=false;E.forEach(e=>{if(!e.on)return;if((d[e.a]==1&&!inVk(e.a))||(d[e.b]==1&&!inVk(e.b))){e.on=0;ch2=true;}});if(!ch2)break;}
    const S=new Set();E.forEach(e=>{if(!e.on)return;for(let t=e.u;t<=e.w;t++)S.add(e.v?K(e.f,t):K(t,e.f));});return S;};
  const vis=j=>!j.hid&&(filt=="all"||j.k==filt);
  const lotXY=(m,i)=>PL[m].lots[i]||PL[m].lots[0];
  let RX=0,RY=0,RW=GX,RH=GY;const setReg=()=>{RX=-PAD;RY=-PAD;RW=GX+PAD*2;RH=GY+PAD*2;};
  const rot=(x,y)=>{x-=RX;y-=RY;return R==0?[x,y]:R==1?[RH-1-y,x]:R==2?[RW-1-x,RH-1-y]:[y,RW-1-x]};
  const W=()=>R%2?RH:RW,H=()=>R%2?RW:RH,scr=(x,y)=>[(x-y)*TW/2,(x+y)*TH/2];
  // 한 해 보기: 달 블록들이 차지하는 화면 범위(TW 단위). 이 범위가 화면을 꽉 채우게 맞춤
  const bb=()=>{let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;PL.forEach(q=>{const c=q.cell;[[c.x,c.y],[c.x+c.w,c.y],[c.x,c.y+c.h],[c.x+c.w,c.y+c.h]].forEach(([u,v])=>{const [a,b]=rotC(u,v),X=(a-b)/2,Y=(a+b)/4;x0=Math.min(x0,X);x1=Math.max(x1,X);y0=Math.min(y0,Y);y1=Math.max(y1,Y);});});return {x0:x0-.25,x1:x1+.25,y0:y0-.1,y1:y1+.15};};const WLH=()=>{const w=root.querySelector("[data-wl]");const h=w&&w.children.length>1?w.offsetHeight:0;v._wlUsed=h;return h;},TOPP=58;
  const fit=()=>{const sc=root.querySelector(".scr");if(!sc)return;const dk=root.querySelector(".desk"),t=dk.getBoundingClientRect().top+(document.scrollingElement||{}).scrollTop||0;{/* 한 해·한 달마다 칸 위치를 기억해 두고 바로 그 높이로 그림: 두 번 그리며 늦어지는 것 막기 (04 2026-11-03 "딜레이·움찔") */const tp=(v._tops||{})[FM==null?"y":"m"],nh=Math.max(360,Math.round(innerHeight-(tp!=null?tp:dk.getBoundingClientRect().top)-16));if(Math.abs(nh-(dk._h||0))>4){dk._h=nh;dk.style.height=nh+"px";}}const n=FM==null?(GX+GY)/2*.95:(PL[FM].cell.w+PL[FM].cell.h)/2+1.2,aw=sc.clientWidth-60,wlE=root.querySelector("[data-wl]"),ah=sc.clientHeight-40-(wlE&&wlE.offsetHeight&&FM==null?wlE.offsetHeight+8:0);
    // 높이: 땅(n*TW/2) + 위 여유(건물·팻말 ≈ 1.6TW) + 두께
    if(FM==null){const b=bb();TW=Math.max(24,Math.min((sc.clientWidth-40)/(b.x1-b.x0),(sc.clientHeight-TOPP-WLH()-14)/(b.y1-b.y0),200));}else TW=Math.max(30,Math.min(aw/n,(ah-cfg.depth-20)/(n/2+1.7),240));TH=TW/2;};
  const RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  let PAD=2;const rotC=(cx,cy)=>([cx,cy]=WP(cx,cy),cx-=RX,cy-=RY,R==0?[cx,cy]:R==1?[RH-cy,cx]:R==2?[RW-cx,RH-cy]:[cy,RW-cx]);
  const G=(gx,gy)=>[(gx-gy)*TW/2,(gx+gy)*TH/2],TC=(x,y)=>{const c=G(...rotC(x+.5,y+.5));return [c[0],c[1]-TH/2];};
  function tree(cx,cy,v){const k=TW/58,r=[5,6.5,4.2][v]*k,h=[5,6.5,4][v]*k,t=cy-h;
    return `<g class="tr"><ellipse class="trs" cx="${cx}" cy="${cy}" rx="${r*.8}" ry="${r*.38}"/><rect class="trk" x="${cx-1.1*k}" y="${t}" width="${2.2*k}" height="${h}" rx="${1.1*k}"/><circle class="trc${v==2?" b2":""}" cx="${cx}" cy="${t-r*.75}" r="${r}"/></g>`;}
  // 마당: 집은 칸 뒤쪽으로 조금 작게, 울타리(앞쪽 왼편에 대문), 디딤돌, 마당 나무·꽃밭
  function yardHouse(o){const j=o.j,k=TW/58,h=hsh(j.id*17+5),cx=o.cx,cy=o.cy,a=TW/2*.76,b=TH/2*.76;
    const Nn=[cx,cy-b],E=[cx+a,cy],S=[cx,cy+b],Wp=[cx-a,cy],fh=3.2*k,L=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];
    const fence=(p,q,gap)=>{const seg=(u,v)=>`<line class="hdg" x1="${L(p,q,u)[0]}" y1="${L(p,q,u)[1]-1.4*k}" x2="${L(p,q,v)[0]}" y2="${L(p,q,v)[1]-1.4*k}" style="stroke-width:${3.4*k}"/>`;return gap?seg(.04,.32)+seg(.68,.96):seg(.04,.96);};
    if(j.k=="o"){const jx=((h%7)-3)*.01;return `<g class="hz" data-id="${j.id}">${iso(j,cx+jx*TW,cy-TH*.04,.92)}</g>`;}
    const sh=(h%5-2)*.03,hx=cx+sh*TW-TW*.04,hy=cy-TH*.1+((h>>3)%3-1)*TH*.03;
    const ft=(h>>4)%6,wood=(p,q,u0,u1)=>{let d=`<line class="wd" x1="${L(p,q,u0)[0]}" y1="${L(p,q,u0)[1]-2.6*k}" x2="${L(p,q,u1)[0]}" y2="${L(p,q,u1)[1]-2.6*k}"/>`;for(let t=u0;t<=u1+.001;t+=(u1-u0)/3){const pp=L(p,q,t);d+=`<line class="wdp" x1="${pp[0]}" y1="${pp[1]}" x2="${pp[0]}" y2="${pp[1]-3.6*k}"/>`;}return d;},
      stone=(p,q,u0,u1)=>`<line class="stw" x1="${L(p,q,u0)[0]}" y1="${L(p,q,u0)[1]-1*k}" x2="${L(p,q,u1)[0]}" y2="${L(p,q,u1)[1]-1*k}" style="stroke-width:${2.6*k}"/>`,
      bush=(p)=>`<ellipse class="bsh" cx="${p[0]}" cy="${p[1]-2*k}" rx="${3.4*k}" ry="${2.6*k}"/>`;
    // 집마다 다르게: 없음 / 뒤쪽 생울타리 / 나무 울타리 한쪽 / 낮은 돌담 / 모퉁이 덤불 / 앞쪽 꽃 줄
    let back="",front="",ex="";
    if(ft==1)back=fence(Wp,Nn)+fence(Nn,E);
    else if(ft==2){back=wood(Nn,E,.1,.9);front=wood(S,E,.15,.85);}
    else if(ft==3){back=stone(Wp,Nn,.05,.95);front=stone(Wp,S,.05,.32)+stone(Wp,S,.68,.95);}
    else if(ft==4){back=bush(L(Wp,Nn,.25))+bush(Nn);front=bush(E)+bush(L(S,E,.7));}
    else if(ft==5){for(let i=0;i<5;i++){const pp=L(S,E,.15+i*.17);front+=`<circle class="fl f${(h+i)%3}" cx="${pp[0]}" cy="${pp[1]-1.5*k}" r="${1.5*k}"/>`;}}
    const g=L(Wp,S,.5);[.25,.5,.75].forEach(t=>{const p=L([hx-TW*.12,hy+TH*.12],g,t);ex+=`<ellipse class="st" cx="${p[0]}" cy="${p[1]}" rx="${2.2*k}" ry="${1.1*k}"/>`;});
    let deco="";if(h%3==0)deco=tree(cx+a*.78,cy+b*.06,(h>>2)%2?2:0);else if(h%3==1){for(let i=0;i<4;i++){const p=L(S,E,.25+i*.15);deco+=`<circle class="fl f${(h+i)%3}" cx="${p[0]}" cy="${p[1]-b*.22}" r="${1.4*k}"/>`;}}
    return `<g class="hz" data-id="${j.id}"><ellipse class="hsh" cx="${hx+TW*.04}" cy="${hy+TH*.08}" rx="${TW*.3}" ry="${TH*.26}"/>${back}${ex}${h%3==0?"":deco}${iso(j,hx,hy,.74)}${h%3==0?deco:""}${front}</g>`;}
  // 가운데 큰 공원: 둘레 산책로, 가운데 분수 광장, 벤치, 둘레 나무
  function bigPark(lv){/* 공원 키우기 (04 2026-11-03 "땅을 채울수록 더 커지게, 발전되게"): lv 1 잔디+작은 분수 → 2 둘레 산책로·벤치 → 3 광장·십자길·나무 가득 → 4 큰 분수·꽃밭·가로등 */lv=window.__pkLv||lv||4;const k=TW/58,{x,y,w,h}=PK,Q=pts=>P(SUBD(pts).map(p=>G(...rotC(...p)))),c=G(...rotC(x+w/2,y+h/2)),o=[];
    const ring=(m)=>{const pts=[];for(let i=0;i<40;i++){const an=i/40*Math.PI*2;const cq=Math.max(Math.abs(Math.cos(an)),Math.abs(Math.sin(an)));/* 동그란 공원 비틀기를 거치면 원이 되게 미리 네모로 */pts.push([x+w/2+Math.cos(an)*(w/2-m),y+h/2+Math.sin(an)*(h/2-m)]);}return Q(pts);};
    /* 동그란 공원: 네 모서리 교차로를 지나는 큰 원형 길(곧은 길은 그대로 이어짐) + 그 안 둥근 땅 */const RR=(w/2+.5)*Math.SQRT2,hw=.3,rg=(r)=>ring(w/2-r);let base=`<polygon class="sw" points="${rg(RR+hw+.07)}"/><polygon class="rds" points="${rg(RR+hw)}"/><polygon class="sw" points="${rg(RR-hw)}"/><polygon class="pkg" points="${rg(RR-hw-.07)}"/><polygon class="cl" style="fill:none" points="${rg(RR)}"/>`;/* 원형 길과 곧은 길이 만나는 네 곳은 연석 선을 지우고 한 길로 이어지게 (04 2026-11-03 "선 없애고 도로 합쳐") */[[x-1,y-1,-1,-1],[x+w,y-1,1,-1],[x-1,y+h,-1,1],[x+w,y+h,1,1]].forEach(([tx,ty,dx,dy])=>{const A=.5-hw,B=.5+hw;const dk=[];for(let i=0;i<24;i++){const an=i/24*Math.PI*2;dk.push([tx+.5+Math.cos(an)*hw,ty+.5+Math.sin(an)*hw]);}const okA=(a,b)=>!inMR(a,b)&&!CAS.has(a+","+b);base+=`<polygon class="rds" points="${Q(dk)}"/>${!okA(tx+dx,ty)?"":`<polygon class="rds" points="${Q(dx<0?[[tx-.6,ty+A],[tx+.5,ty+A],[tx+.5,ty+B],[tx-.6,ty+B]]:[[tx+.5,ty+A],[tx+1.6,ty+A],[tx+1.6,ty+B],[tx+.5,ty+B]])}"/>`}${!okA(tx,ty+dy)?"":`<polygon class="rds" points="${Q(dy<0?[[tx+A,ty-.6],[tx+B,ty-.6],[tx+B,ty+.5],[tx+A,ty+.5]]:[[tx+A,ty+.5],[tx+B,ty+.5],[tx+B,ty+1.6],[tx+A,ty+1.6]])}"/>`}`;});if(lv>=2)base+=`<polygon class="bpk-path" points="${ring(.75)}"/><polygon class="pkg2" points="${ring(1.0)}"/>`;
    const pl=[];for(let i=0;i<40;i++){const an=i/40*Math.PI*2;const cq=Math.max(Math.abs(Math.cos(an)),Math.abs(Math.sin(an)));pl.push([x+w/2+Math.cos(an)*.95,y+h/2+Math.sin(an)*.95]);}if(lv>=3)base+=`<polygon class="plz" points="${Q(pl)}"/>`;
    if(lv>=3)[[0,1],[0,-1],[1,0],[-1,0]].forEach(([u,v])=>base+=`<polygon class="bpk-path" points="${Q([[x+w/2+u*.9-v*.18,y+h/2+v*.9+u*.18],[x+w/2+u*(w/2-.55)-v*.18,y+h/2+v*(h/2-.55)+u*.18],[x+w/2+u*(w/2-.55)+v*.18,y+h/2+v*(h/2-.55)-u*.18],[x+w/2+u*.9+v*.18,y+h/2+v*.9-u*.18]])}"/>`);
    const ft=`<g class="ftn"><ellipse class="ftb" cx="${c[0]}" cy="${c[1]+2*k}" rx="${TW*.42}" ry="${TH*.42}"/><ellipse class="ftw" cx="${c[0]}" cy="${c[1]}" rx="${TW*.36}" ry="${TH*.36}"/><rect class="ftp" x="${c[0]-2*k}" y="${c[1]-12*k}" width="${4*k}" height="${12*k}" rx="${1.5*k}"/><ellipse class="ftw2" cx="${c[0]}" cy="${c[1]-12*k}" rx="${7*k}" ry="${3*k}"/><path class="ftj" d="M${c[0]} ${c[1]-13*k}q${-5*k} ${-8*k} ${-9*k} ${2*k}M${c[0]} ${c[1]-13*k}q${5*k} ${-8*k} ${9*k} ${2*k}"/></g>`;
    const fs=[.6,.8,1,1.4][lv-1];const items=[{gx:x+w/2,gy:y+h/2,s:`<g transform="translate(${c[0]},${c[1]}) scale(${fs}) translate(${-c[0]},${-c[1]})">${ft}</g>`}];
    if(lv>=4){const FC=["#f28b82","#fbbc04","#f6aea9","#c58af9","#ffffff"];for(let i=0;i<28;i++){const an=i/28*Math.PI*2,rr=1.25+(i%2)*.12,gx=x+w/2+Math.cos(an)*rr,gy=y+h/2+Math.sin(an)*rr,p=G(...rotC(gx,gy));items.push({gx,gy,s:`<ellipse cx="${p[0]}" cy="${p[1]}" rx="${3.2*k}" ry="${1.8*k}" fill="${FC[i%5]}" stroke="#0002" stroke-width=".5"/>`});}
      [[1,1],[-1,1],[1,-1],[-1,-1]].forEach(([u,v])=>{const gx=x+w/2+u*1.6,gy=y+h/2+v*1.6,p=G(...rotC(gx,gy));items.push({gx,gy,s:`<g><rect x="${p[0]-.8*k}" y="${p[1]-16*k}" width="${1.6*k}" height="${16*k}" fill="#5b5b5b"/><circle cx="${p[0]}" cy="${p[1]-17*k}" r="${2.6*k}" fill="#fff6c8" stroke="#5b5b5b" stroke-width="${.8*k}"/></g>`});});}
    const NT0=Math.max(14,Math.round((w+h)*1.3)),NT=[5,9,NT0,NT0+4][lv-1];for(let i=0;i<NT;i++){const an=i/NT*Math.PI*2+.2,r=.5+((i*7)%3)*.06,gx=x+w/2+Math.cos(an)*(w/2-.3)*(.9+r*.1),gy=y+h/2+Math.sin(an)*(h/2-.3)*(.9+r*.1),p=G(...rotC(gx,gy));items.push({gx,gy,s:tree(p[0],p[1],i%3)});}
    [[.5,-1.7],[-.5,1.7],[1.7,.5],[-1.7,-.5]].slice(0,[0,2,4,4][lv-1]).forEach(([u,v])=>{const gx=x+w/2+u*(w/4),gy=y+h/2+v*(h/4)/1.7,p=G(...rotC(gx,gy));items.push({gx,gy,s:`<g transform="translate(${p[0]},${p[1]})">${bench(k)}</g>`});});
    /* 공원 시안 B·C·D (04 2026-11-03 "공원 시안 더 뽑아줘"): window.__pkSt로 미리보기 */const st=window.__pkSt||"A";
    if(st!=="A"){const cx=x+w/2,cy=y+h/2,LR=RR-hw-.07,pc=(r,n=48,ox=0,oy=0,ry)=>{const o=[];for(let i=0;i<n;i++){const an=i/n*Math.PI*2;o.push([cx+ox+Math.cos(an)*r,cy+oy+Math.sin(an)*(ry||r)]);}return o;},at=(gx,gy,sv)=>{const p=G(...rotC(gx,gy));items2.push({gx,gy,s:sv(p[0],p[1])});},items2=[];
      base=base.split('<polygon class="bpk-path"')[0];/* 원형 길·잔디까지만 남기고 속은 새로 */
      const FC=["#f28b82","#fbbc04","#f6aea9","#c58af9","#ffffff","#ff8a65"];
      if(st==="B"){/* 호수 공원 */base+=`<polygon class="bpk-path" points="${Q(pc(2.45))}"/><polygon class="pkg" points="${Q(pc(2.25))}"/><polygon class="ftb" points="${Q(pc(1.75,48,.15,.1,1.35))}"/><polygon class="ftw" points="${Q(pc(1.6,48,.15,.1,1.2))}"/><polygon class="pkg2" points="${Q(pc(.38,24,.75,-.35))}"/><polygon style="fill:#b5835a;stroke:#7a5233;stroke-width:1" points="${Q([[cx-1.55,cy+.35],[cx-.1,cy+.35],[cx-.1,cy+.62],[cx-1.55,cy+.62]])}"/>`;
        at(cx+.75,cy-.35,(px,py)=>tree(px,py,0));for(let i=0;i<22;i++){const an=i/22*Math.PI*2+.1,rr=2.75+(i%3)*.12;at(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr,(px,py)=>tree(px,py,i%3));}
        [[0,-2.05],[1.9,.6],[-1.6,-1.3]].forEach(([u,v])=>at(cx+u,cy+v,(px,py)=>`<g transform="translate(${px},${py})">${bench(k)}</g>`));
        for(let i=0;i<5;i++){const an=1+i*.5;at(cx+.15+Math.cos(an)*1.3,cy+.1+Math.sin(an)*1.0,(px,py)=>`<ellipse cx="${px}" cy="${py}" rx="${3*k}" ry="${1.3*k}" fill="#6fbf73" stroke="#3d8f3a" stroke-width=".6"/>`);}}
      else if(st==="C"){/* 꽃 정원 + 정자 */base+=`<polygon class="bpk-path" points="${Q(pc(2.5))}"/><polygon class="pkg" points="${Q(pc(2.3))}"/>`;[[1,0],[0,1],[-1,0],[0,-1]].forEach(([u,v])=>base+=`<polygon class="bpk-path" points="${Q([[cx+u*.6-v*.2,cy+v*.6+u*.2],[cx+u*2.4-v*.2,cy+v*2.4+u*.2],[cx+u*2.4+v*.2,cy+v*2.4-u*.2],[cx+u*.6+v*.2,cy+v*.6-u*.2]])}"/>`);base+=`<polygon class="plz" points="${Q(pc(.75))}"/>`;
        [1.15,1.6,2.05].forEach((rr,j)=>{const n=Math.round(rr*14);for(let i=0;i<n;i++){const an=i/n*Math.PI*2+j*.2;if(Math.abs(Math.sin(2*an))<.22)continue;at(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr,(px,py)=>`<ellipse cx="${px}" cy="${py}" rx="${3.4*k}" ry="${2*k}" fill="${FC[(i+j)%6]}" stroke="#0002" stroke-width=".5"/>`);}});
        at(cx,cy,(px,py)=>{const R=11*k,H=16*k;let pil="";[-1,1].forEach(sx=>pil+=`<rect x="${px+sx*R*.7-1.2*k}" y="${py-H}" width="${2.4*k}" height="${H}" fill="#f4efe6" stroke="#8a7b6a" stroke-width=".7"/>`);return `<g><ellipse cx="${px}" cy="${py}" rx="${R*1.05}" ry="${R*.55}" fill="#e9e2d4" stroke="#8a7b6a" stroke-width=".7"/>${pil}<polygon points="${px-R*1.25},${py-H} ${px},${py-H-11*k} ${px+R*1.25},${py-H} ${px},${py-H+5*k}" fill="#c0504d" stroke="#7a2e2c" stroke-width=".8"/></g>`;});
        for(let i=0;i<18;i++){const an=i/18*Math.PI*2+.15;at(cx+Math.cos(an)*2.8,cy+Math.sin(an)*2.8,(px,py)=>tree(px,py,i%3));}}
      else{/* D 잔디 광장 + 큰 나무 + 놀이터 */base+=`<polygon class="bpk-path" points="${Q(pc(2.6))}"/><polygon class="pkg" points="${Q(pc(2.4))}"/><polygon class="pkg2" points="${Q(pc(1.9))}"/>`;
        [[-.9,.7,"#f28b82"],[.6,1.1,"#fbbc04"],[1.1,-.3,"#8ab4f8"]].forEach(([u,v,c2])=>base+=`<polygon style="fill:${c2};opacity:.9" points="${Q([[cx+u-.28,cy+v-.2],[cx+u+.28,cy+v-.2],[cx+u+.28,cy+v+.2],[cx+u-.28,cy+v+.2]])}"/>`);
        base+=`<polygon style="fill:#e8d9b5" points="${Q(pc(.65,32,-1.1,-1.0))}"/>`;
        at(cx,cy,(px,py)=>`<g transform="translate(${px},${py}) scale(1.9) translate(${-px},${-py})">${tree(px,py,0)}</g>`);
        at(cx-1.1,cy-1.0,(px,py)=>`<g><path d="M${px-8*k} ${py}L${px-8*k} ${py-14*k}L${px+8*k} ${py}" fill="none" stroke="#e5534b" stroke-width="${2*k}"/><path d="M${px-10*k} ${py-14*k}L${px-6*k} ${py-14*k}" stroke="#555" stroke-width="${1.2*k}"/><rect x="${px+2*k}" y="${py-12*k}" width="${1.2*k}" height="${12*k}" fill="#555"/><rect x="${px+9*k}" y="${py-12*k}" width="${1.2*k}" height="${12*k}" fill="#555"/><rect x="${px+2*k}" y="${py-12.5*k}" width="${8*k}" height="${1.2*k}" fill="#555"/><rect x="${px+4.5*k}" y="${py-5*k}" width="${3*k}" height="${1.2*k}" fill="#fbbc04"/></g>`);
        for(let i=0;i<20;i++){const an=i/20*Math.PI*2+.3;at(cx+Math.cos(an)*2.85,cy+Math.sin(an)*2.85,(px,py)=>tree(px,py,i%3));}
        [[1.9,.9],[-1.9,.6],[.2,-2.1],[.9,2.0]].forEach(([u,v])=>at(cx+u,cy+v,(px,py)=>`<g transform="translate(${px},${py})">${bench(k)}</g>`));}
      items.length=0;items.push(...items2);}
    /* 공원으로 건너가는 횡단보도 (04 2026-11-03): 원형 길 위 네 방향 + 공원 안으로 이어지는 짧은 길 */{const cx=x+w/2,cy=y+h/2,pa=(r,an)=>[cx+Math.cos(an)*r,cy+Math.sin(an)*r];[0,Math.PI/2,Math.PI,Math.PI*1.5].forEach(an=>{const da=.19/RR;{const bk=[];for(let j=0;j<=6;j++)bk.push(pa(RR-hw+.01,an-da*1.15+j*da*2.3/6));for(let j=6;j>=0;j--)bk.push(pa(RR+hw-.01,an-da*1.15+j*da*2.3/6));base+=`<polygon class="rds" points="${Q(bk)}"/>`;}for(let i=0;i<4;i++){const r0=RR-hw+.06+i*.135,r1=r0+.08;base+=`<polygon class="zb" points="${Q([pa(r0,an-da),pa(r1,an-da),pa(r1,an+da),pa(r0,an+da)])}"/>`;}const t=.16/RR,ri=RR-hw-.07,ro2=(st==="A"?w/2-.6:2.3);if(ri>ro2)base+=`<polygon class="bpk-path" points="${Q([pa(ro2,an-t*1.3),pa(ri+.02,an-t),pa(ri+.02,an+t),pa(ro2,an+t*1.3)])}"/>`;});}
    const r=[{o:-1,y:-1e9,s:`<g class="bpk">${base}</g>`}];items.forEach(it=>{const q=rotC(it.gx,it.gy);r.push({o:q[0]+q[1]-1,y:G(...q)[1],s:it.s});});return r;}
  // 공원 위아래 정원: 가운데 곧은 산책로, 양옆 가로수 줄, 벤치
  function garden(q){const {x,y,w,h}=q,Q=pts=>P(SUBD(pts).map(p=>G(...rotC(...p)))),k=TW/58,cx=x+w/2,r=[];
    r.push({o:-1,y:-1e9,s:`<polygon class="pkg2" points="${Q([[x+.15,y+.15],[x+w-.15,y+.15],[x+w-.15,y+h-.15],[x+.15,y+h-.15]])}"/><polygon class="bpk-path" points="${Q([[cx-.22,y],[cx+.22,y],[cx+.22,y+h],[cx-.22,y+h]])}"/>`});
    for(let t=.5;t<h;t+=1)[cx-.8,cx+.8,x+.45,x+w-.45].forEach((gx,i)=>{if(i>1&&hsh(Math.round(t*10)+i*7+y)%2)return;const q2=rotC(gx,y+t),p=G(...q2);r.push({o:q2[0]+q2[1]-1,y:p[1],s:tree(p[0],p[1],i%2?0:2)});});
    {const q2=rotC(cx+.45,y+h/2),p=G(...q2);r.push({o:q2[0]+q2[1]-1,y:p[1],s:`<g transform="translate(${p[0]},${p[1]})">${bench(k)}</g>`});}
    return r;}
  // 바깥 동네: 흐린 회색 집·건물
  const GT=["a","b","c","d","e","f"];function ghost(g){const h=g.h,o=h%4==0,j={k:o?"o":"c",cl:"_g",t:GT[h%6],fee:o?[200000,400000,700000][h%3]:[50000,100000,200000][h%3],done:true};
    const SV=SHP;SHP={a:0,b:1,c:2,d:3,e:4,f:5};const sv=ROOF._g;ROOF._g="var(--gh)";const r=`<g class="gh">${iso(j,g.cx,g.cy,o?.85:.78)}</g>`;SHP=SV;return r;}
  // 공원: 연못·벤치·꽃밭·산책길
  // 구불 산책길: 옆 도로 가장자리에서 시작해 공원 안으로 구불구불(도로 둘이면 둘을 잇고, 하나면 벤치·나무까지) — 04 2026-11-03
  function wPath(t,ex,ey){const nb=t.nb||[];if(!nb.length)return "";const A=nb[0],B=nb[1]||[ex,ey],dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy)||1,px=-dy/L,py=dx/L,w=L*(t.hs%2?.32:-.32);
    return `<path class="pth" d="M${A[0].toFixed(1)} ${A[1].toFixed(1)}C${(A[0]+dx*.33+px*w).toFixed(1)} ${(A[1]+dy*.33+py*w).toFixed(1)} ${(A[0]+dx*.66-px*w).toFixed(1)} ${(A[1]+dy*.66-py*w).toFixed(1)} ${B[0].toFixed(1)} ${B[1].toFixed(1)}"/>`;}
  function park(t){const k=TW/58,{cx,cy}=t,v=t.v%2?1:3,a=TW/2,b=TH/2;
    if(v==0){let d=`<ellipse class="pdr" cx="${cx}" cy="${cy+1.2*k}" rx="${a*.6}" ry="${b*.56}"/><ellipse class="pdr2" cx="${cx}" cy="${cy}" rx="${a*.6}" ry="${b*.56}"/><ellipse class="pd" cx="${cx}" cy="${cy+.6*k}" rx="${a*.5}" ry="${b*.46}"/>`;
      [[-.2,.05],[.18,-.1]].forEach(([u,w])=>d+=`<ellipse class="lily" cx="${cx+u*a}" cy="${cy+w*b}" rx="${3*k}" ry="${1.5*k}"/>`);
      for(let i=0;i<5;i++){const an=Math.PI*(.15+i*.18);d+=`<ellipse class="rk" cx="${cx+Math.cos(an)*a*.6}" cy="${cy+Math.sin(an)*b*.56}" rx="${2.4*k}" ry="${1.5*k}"/>`;}
      return `<g class="pk">${d}</g>`;}
    if(v==1)return `<g class="pk">${wPath(t,cx-a*.15,cy+b*.15)}<g transform="translate(${cx-a*.15},${cy+b*.15})">${bench(k)}</g><line class="lp" x1="${cx+a*.35}" y1="${cy+b*.1}" x2="${cx+a*.35}" y2="${cy-14*k}"/><circle class="lpb" cx="${cx+a*.35}" cy="${cy-14*k}" r="${1.8*k}"/></g>`;
    if(v==2){const hh=3*k;let d=`<ellipse class="fbw" cx="${cx}" cy="${cy}" rx="${a*.48}" ry="${b*.44}"/><rect class="fbw" x="${cx-a*.48}" y="${cy-hh}" width="${a*.96}" height="${hh}"/><ellipse class="fbt" cx="${cx}" cy="${cy-hh}" rx="${a*.48}" ry="${b*.44}"/><ellipse class="fbs" cx="${cx}" cy="${cy-hh}" rx="${a*.4}" ry="${b*.36}"/>`;
      const fl=[];for(let i=0;i<9;i++){const an=i*2.4,r=.1+(i%4)*.07;fl.push([cx+Math.cos(an)*a*r,cy-hh+Math.sin(an)*b*r,i]);}fl.sort((p,q)=>p[1]-q[1]);
      fl.forEach(([x,y,i])=>d+=`<line class="stem" x1="${x}" y1="${y}" x2="${x}" y2="${y-3*k}"/><circle class="fl f${i%3}" cx="${x}" cy="${y-3.4*k}" r="${1.6*k}"/>`);return `<g class="pk">${d}</g>`;}
    return `<g class="pk">${wPath(t,cx-a*.35,cy-b*.25)}${tree(cx-a*.35,cy-b*.25,(t.o)%3)}</g>`;}
  // 벤치: 땅 격자 방향(번갈아 두 방향)을 따르는 입체 벤치. 등받이(뒤) → 다리 → 앉는 판 순서
  let BNC=0;function bench(k){const ax=(BNC++)%2,L=.17,D=.055,u=ax?[-TW/2,TH/2]:[TW/2,TH/2],v=ax?[-TW/2,-TH/2]:[TW/2,-TH/2],
      pt=(a,b,z)=>[u[0]*a+v[0]*b,u[1]*a+v[1]*b-z],sh=3.2*k,th=1*k,bh=4.2*k;
    const seat=[pt(-L,-D,sh),pt(L,-D,sh),pt(L,D,sh),pt(-L,D,sh)],front=[pt(-L,-D,sh),pt(L,-D,sh),pt(L,-D,sh-th),pt(-L,-D,sh-th)],
      back=[pt(-L,D,sh),pt(L,D,sh),pt(L,D*1.4,sh+bh),pt(-L,D*1.4,sh+bh)];
    const leg=(a,b)=>{const p0=pt(a,b,0),p1=pt(a,b,sh-th);return `<line class="fp" x1="${p0[0]}" y1="${p0[1]}" x2="${p1[0]}" y2="${p1[1]}"/>`;};
    return `<g class="bnc"><ellipse class="crs" cx="0" cy="0" rx="${TW*.13}" ry="${TH*.09}"/>${leg(-L*.8,D*.8)}${leg(L*.8,D*.8)}<polygon class="bn bnb" points="${P(back)}"/>${leg(-L*.8,-D*.8)}${leg(L*.8,-D*.8)}<polygon class="bn" points="${P(seat)}"/><polygon class="bn bnf" points="${P(front)}"/></g>`;}
  function prism(dx,dy,off,L,Wd,z0,h,fill,side,topc){const px=-dy,py=dx,cs=[[1,1],[1,-1],[-1,-1],[-1,1]].map(([a,b])=>G(dx*(off+L/2*a)+px*Wd/2*b,dy*(off+L/2*a)+py*Wd/2*b)).map(p=>[p[0],p[1]-z0]);
    let sd=[];for(let i=0;i<4;i++){const a=cs[i],b=cs[(i+1)%4];sd.push({y:(a[1]+b[1])/2,p:[a,b,[b[0],b[1]-h],[a[0],a[1]-h]],i});}sd.sort((a,b)=>a.y-b.y);
    return sd.map(q=>`<polygon points="${P(q.p)}" style="fill:${side(q.i)}"/>`).join("")+`<polygon points="${P(cs.map(p=>[p[0],p[1]-h]))}" style="fill:${topc}"/>`;}
  function car(dx,dy,col){const k=TW/58,L=.36,Wd=.2,px=-dy,py=dx;
    const wh=[[1,1],[1,-1],[-1,-1],[-1,1]].map(([a,b])=>G(dx*L*.3*a+px*Wd*.5*b,dy*L*.3*a+py*Wd*.5*b));
    const dk=`color-mix(in srgb,${col} 72%,#000)`,gl="color-mix(in srgb,#cfe8f7 85%,var(--surface))";
    return `<g class="cr"><ellipse class="crs" cx="0" cy="${1.5*k}" rx="${TW*.15}" ry="${TH*.1}"/>`+wh.map(w=>`<ellipse class="whl" cx="${w[0]}" cy="${w[1]-1.2*k}" rx="${1.7*k}" ry="${1.7*k}"/>`).join("")
      +prism(dx,dy,0,L,Wd,1.2*k,3.6*k,col,i=>i%2?dk:`color-mix(in srgb,${col} 85%,#000)`,col)
      +prism(dx,dy,-.02,L*.52,Wd*.84,4.8*k,3*k,col,i=>i==0?gl:i==2?gl:gl,`color-mix(in srgb,${col} 90%,#fff)`)+`</g>`;}
  // 사람: 그림자, 다리 둘, 옷(몸통), 팔, 얼굴, 머리카락. 가끔 둘이 함께 걷거나 강아지와 산책
  function walker(v){const k=TW/58,shirt=["#f2a65a","#6aa6e8","#e77fa0","#7cc576","#b48be0","#f3d27c"][v%6],pants=["#4a5568","#6b7a90","#8a6a52"][(v>>3)%3],hair=["#3b2f2a","#7a5233","#d8b26a","#2b2b2b"][(v>>5)%4];
    const one=(dx,sh)=>`<g transform="translate(${dx},0)"><ellipse class="crs" cx="0" cy="0" rx="${2.6*k}" ry="${1.1*k}"/>`
      +`<rect x="${-1.3*k}" y="${-3.6*k}" width="${1.1*k}" height="${3.6*k}" rx="${.5*k}" style="fill:${pants}"/><rect x="${.2*k}" y="${-3.6*k}" width="${1.1*k}" height="${3.6*k}" rx="${.5*k}" style="fill:${pants}"/>`
      +`<rect x="${-2.6*k}" y="${-7.4*k}" width="${.9*k}" height="${3.4*k}" rx="${.45*k}" style="fill:${sh}"/><rect x="${1.7*k}" y="${-7.4*k}" width="${.9*k}" height="${3.4*k}" rx="${.45*k}" style="fill:${sh}"/>`
      +`<rect x="${-1.8*k}" y="${-7.8*k}" width="${3.6*k}" height="${4.6*k}" rx="${1.3*k}" style="fill:${sh}"/>`
      +`<circle class="hd" cx="0" cy="${-9.7*k}" r="${1.9*k}"/><path d="M${-2*k} ${-9.6*k}a${2*k} ${2*k} 0 0 1 ${4*k} 0q${-1*k} ${-.9*k} ${-2*k} ${-.6*k}q${-1.2*k} ${.2*k} ${-2*k} ${.6*k}z" style="fill:${hair}"/></g>`;
    let s=one(0,shirt);if(v%5==0)s+=one(4.6*k,["#f3d27c","#86cf9a","#e77fa0"][v%3]);
    else if(v%5==1)s+=`<g transform="translate(${5*k},0)"><ellipse class="crs" cx="0" cy="0" rx="${2.2*k}" ry="${.9*k}"/><ellipse cx="0" cy="${-1.8*k}" rx="${2.2*k}" ry="${1.3*k}" style="fill:#c9935f"/><circle cx="${1.9*k}" cy="${-3*k}" r="${1.1*k}" style="fill:#c9935f"/><line x1="${-1.2*k}" y1="${-6*k}" x2="${1.8*k}" y2="${-3.4*k}" class="leash"/></g>`;
    return s;}
  function traffic(){let o="",n=0;const PLc=MIFFY?vpNow().r.slice(0,4):(()=>{try{return DB.skin.pal&&DB.skin.pal()}catch(e){return null}})()||["var(--r1)","var(--r2)","var(--r3)","var(--r4)"];
    const lines=[],cs=(f,vt,sg)=>{const o=[];sg.forEach(([u,v])=>{let a=null;for(let t=u;t<=v;t++){const ok=t<v&&!CAS.has(vt?f+","+t:t+","+f);if(ok&&a==null)a=t;if(!ok&&a!=null){o.push([a,t]);a=null;}}});return o;};/* 없앤 길(공원 둘레 등) 위로는 차가 안 다니게 */RDX.forEach(x=>{if(x<GX)cs(x,1,rdSegs(x,'x',0,GY)).forEach(([u,v])=>{if(v-u>1.5)lines.push({a:[x+.5,u],b:[x+.5,v-.001],v:1});});});RDY.forEach(y=>{if(y<GY)cs(y,0,rdSegs(y,'y',0,GX)).forEach(([u,v])=>{if(v-u>1.5)lines.push({a:[u,y+.5],b:[v-.001,y+.5],v:0});});});
    lines.forEach((ln,i)=>{const len=Math.hypot(ln.b[0]-ln.a[0],ln.b[1]-ln.a[1]);
      [1,-1].forEach(dir=>{if(hsh(i*11+dir*3)%3==0)return;const off=.14*dir,A=ln.v?[ln.a[0]+off,ln.a[1]]:[ln.a[0],ln.a[1]-off],B=ln.v?[ln.b[0]+off,ln.b[1]]:[ln.b[0],ln.b[1]-off];
        let [s0,s1]=dir>0?[A,B]:[B,A];const w0=s0,w1=s1;s0=rotC(...s0);s1=rotC(...s1);const ux=Math.sign(Math.round(s1[0]-s0[0])),uy=Math.sign(Math.round(s1[1]-s0[1]));
        const p0=G(...s0),p1=G(...s1),dur=(len*1.6).toFixed(1),bg=-(hsh(i*5+dir)%100)/100*len*1.6;
        const f=.1+(hsh(i*5+dir)%80)/100,pw=G(...rotC(w0[0]+(w1[0]-w0[0])*f,w0[1]+(w1[1]-w0[1])*f)),qx=s0[0]+(s1[0]-s0[0])*f,qy=s0[1]+(s1[1]-s0[1])*f,cy=pw[1];DYN.push({o:qx+qy-1,y:cy,s:`<g class="car" transform="translate(${pw[0]},${cy})">${car(ux,uy,PLc[(n++)%PLc.length])}</g>`});});
      // 산책: 길 가장자리 인도에서 몇 칸 왔다 갔다
      for(let w=0;w<0;w++){const h=hsh(i*23+w*7);if(h%2)continue;const st=(h%Math.max(1,Math.floor(len-4)))+1,sl=2+h%3,side=(w?.44:-.44);
        const A=ln.v?[ln.a[0]+side,st]:[st,ln.a[1]+side],B=ln.v?[ln.a[0]+side,st+sl]:[st+sl,ln.a[1]+side],p0=G(...rotC(...A)),p1=G(...rotC(...B)),dur=(sl*4.5).toFixed(1);
        o+=`<g class="wk" transform="translate(${(p0[0]+p1[0])/2},${(p0[1]+p1[1])/2})">${walker(h)}</g>`;}});
    return `<g class="trf">${roadDeco()}${o}</g>`;}
  // 도로: 인도 턱, 가운데 점선, 교차로 옆 횡단보도
  function roadDeco(){const Q=pts=>P(SUBD(pts).map(p=>G(...rotC(...p))));let d="",cl="";
    const isI=(x,y)=>RDX.has(x)&&RDY.has(y),RI=.2;// 길은 칸 가운데 60%만(양옆은 잔디)
    const a0=-PAD,ax=GX+PAD,ay=GY+PAD,BB=BRL(),okR=(x,y)=>!CAS.has(x+","+y)&&((x>=0&&y>=0&&x<GX&&y<GY)||RSET.has(x+","+y));
    const clip=(segs,f,vert)=>{const o=[];segs.forEach(([a,b])=>{let s0=null;for(let t=Math.ceil(a);t<b;t++){const ok=vert?okR(f,t):okR(t,f);if(ok&&s0==null)s0=t;if(!ok&&s0!=null){o.push([s0,t]);s0=null;}}if(s0!=null)o.push([s0,b]);});return o;};
    let brg="";
    // 바깥 동네 길도 마을 길과 같은 간격(5칸마다)·같은 모양으로
    const ext=(lo,hi)=>{const o=[];for(let v=Math.ceil(lo);v<=hi;v++)if(((v%5)+5)%5==4)o.push(v);return o;},EX=ext(a0,ax-1),EY=ext(a0,ay-1);
    // 가운데 점선은 교차로 칸에서 끊음
    const noI=(a,b,L)=>{const o=[];let c=a;L.forEach(t=>{if(t+1.85<=c||t-.85>=b)return;if(t-.85>c)o.push([c,t-.85]);c=Math.max(c,t+1.85);});if(b>c)o.push([c,b]);return o.filter(([u,v])=>v-u>.25);};// 교차로 양옆 횡단보도 칸까지 점선 끊음
    // 굽은 구간: 바깥 동네 교차로~교차로 사이 몇 곳을 S자로 굽힘 (04 2026-11-03 "곡선으로 도는 구간")
    const CVT=new Set(),CVL=(vert,f,a,b,L)=>{const g=[];return g;/* 바깥 S자 길은 뺌 (04 2026-11-03 "꾸불거리는 도로는 다 빼줘") */L.forEach(k=>{const c=k+.5,e=c+5;if(c<a-.01||e>b+.01)return;const inG=vert?(f>=-1&&f<=GX&&e>-1&&c<GY+1):(f>=-1&&f<=GY&&e>-1&&c<GX+1);if(inG||hsh(f*31+k*17+(vert?7:3))%2)return;for(let t=Math.floor(c);t<e;t++)if(vert?ZN(f,t):ZN(t,f))return;g.push([c,e,hsh(f*3+k)%2?1:-1]);for(let t=Math.floor(c);t<e;t++)CVT.add(vert?f+","+t:t+","+f);});return g;};
    const off=(g,t)=>{for(const [c,e,sg] of g)if(t>c&&t<e)return sg*.42*Math.sin(Math.PI*2*(t-c)/5);return 0;};
    const strip=(vert,f,a,b,cls,L)=>{const g=CVL(vert,f,a,b,L),P2=(u,t)=>vert?[f+u+off(g,t),t]:[t,f+u+off(g,t)],ts=[];for(let t=a;t<b;t+=.25)ts.push(t);ts.push(b);
      const band=(u0,u1)=>P(ts.map(t=>P2(u0,t)).concat(ts.slice().reverse().map(t=>P2(u1,t))).map(p=>G(...rotC(...p))));
      let c="";cls.forEach(([u,v])=>{const q=[u];for(let t=Math.ceil(u*4)/4+.25;t<v;t+=.25)q.push(t);q.push(v);c+="M"+q.map(t=>G(...rotC(...P2(.5,t)))).join("L");});
      return [`<polygon class="rds" points="${band(RI,1-RI)}"/><polygon class="sw" points="${band(RI,RI+.07)}"/><polygon class="sw" points="${band(1-RI-.07,1-RI)}"/>`,c];};
    /* 막다른 길 끝은 둥글게 (04 2026-11-03 "합쳐진 블록 옆 끊긴 길 동그랗게 메꿔") */const CAP=(vert,f,t,dir)=>{const hw=.5-RI,pt=(r,an)=>vert?[f+.5+Math.cos(an)*r,t+dir*Math.sin(an)*r]:[t+dir*Math.sin(an)*r,f+.5+Math.cos(an)*r],arc=(r)=>{const o=[];for(let i=0;i<=16;i++)o.push(pt(r,i/16*Math.PI));return o;};return `<polygon class="sw" points="${Q(arc(hw+.07).concat(arc(hw).reverse()))}"/><polygon class="rds" points="${Q(arc(hw))}"/>`;};
    const EYs=new Set(EY),EXs=new Set(EX);EX.forEach(x=>{const segs=clip(rdSegs(x,'x',a0,ay),x,1);segs.forEach(([y0,y1])=>{for(let t=y0;t<y1;t++)if(ZN(x,t)==1)brg+=`<polygon class="brg" points="${Q([[x+RI-.12,t],[x+1-RI+.12,t],[x+1-RI+.12,t+1],[x+RI-.12,t+1]])}"/><path class="rail" d="M${G(...rotC(x+RI-.08,t))}L${G(...rotC(x+RI-.08,t+1))}M${G(...rotC(x+1-RI+.08,t))}L${G(...rotC(x+1-RI+.08,t+1))}"/>`;if(EYs.has(y0))y0+=CNK.has(x+","+y0)?1-RI:RI;/* 둥근 모퉁이 칸은 칸 앞에서 멈춤 */else if(y0>a0+1){y0+=.37;d+=CAP(1,x,y0,-1);}if(EYs.has(y1-1))y1-=CNK.has(x+","+(y1-1))?1-RI:RI;else if(y1<ay-1){y1-=.37;d+=CAP(1,x,y1,1);}{const [q,c]=strip(1,x,y0,y1,noI(y0,y1,EY),EY);d+=q;cl+=c;}});});
    EY.forEach(y=>{clip(rdSegs(y,'y',a0,ax),y,0).forEach(([x0,x1])=>{for(let t=x0;t<x1;t++)if(ZN(t,y)==1)brg+=`<polygon class="brg" points="${Q([[t,y+RI-.12],[t+1,y+RI-.12],[t+1,y+1-RI+.12],[t,y+1-RI+.12]])}"/><path class="rail" d="M${G(...rotC(t,y+RI-.08))}L${G(...rotC(t+1,y+RI-.08))}M${G(...rotC(t,y+1-RI+.08))}L${G(...rotC(t+1,y+1-RI+.08))}"/>`;if(EXs.has(x0))x0+=CNK.has(x0+","+y)?1-RI:RI;else if(x0>a0+1){x0+=.37;d+=CAP(0,y,x0,-1);}if(EXs.has(x1-1))x1-=CNK.has((x1-1)+","+y)?1-RI:RI;else if(x1<ax-1){x1-=.37;d+=CAP(0,y,x1,1);}{const [q,c]=strip(0,y,x0,x1,noI(x0,x1,EX),EX);d+=q;cl+=c;}});});
    // 교차로 칸은 인도 지우기(길 색으로 덮음). DN: 변을 잘게 나눠 굽은 모퉁이(WP)를 따라 휘게 (04 11-03 연석 톱니)
    const DN=(p,n=8)=>{const o=[];for(let k=0;k<p.length;k++){const a=p[k],b=p[(k+1)%p.length];for(let t=0;t<n;t++)o.push([a[0]+(b[0]-a[0])*t/n,a[1]+(b[1]-a[1])*t/n]);}return o;};
    EX.forEach(x=>EY.forEach(y=>{if(inMR(x,y)||!okR(x,y))return;{const c=(px,py,vert)=>vert?clip(rdSegs(px,'x',a0,ay),px,1).some(([u,v])=>py>=u&&py<v):clip(rdSegs(py,'y',a0,ax),py,0).some(([u,v])=>px>=u&&px<v),n=c(x,y-1,1),s_=c(x,y+1,1),w_=c(x-1,y,0),e=c(x+1,y,0);if(n&&s_&&!w_&&!e||w_&&e&&!n&&!s_)return;/* 곧게 지나가는 칸은 덮지 않음: 굽은 길에서 연석 톱니 생김 (04 11-03) */const ck=CNK.has(x+","+y),o=.025,oh=.025,q=.035,X0=x+RI+(w_?-oh:q),X1=x+1-RI+(e?oh:-q),Y0=y+RI+(n?-o:q),Y1=y+1-RI+(s_?o:-q);/* 둥근 모퉁이 칸: 안쪽 꼭짓점이 연석 밖으로 안 튀게 *//* 막힌 쪽은 연석 안쪽까지만 *//* 길 있는 쪽으로 살짝 넓혀 연석 테두리 실선 안 비치게 */if(ck){/* 둥근 모퉁이 칸 (04 11-03 연석 톱니): 길은 칸 앞에서 멈추고, 칸 안은 네모 + 길 쪽 혀(연석 사이만)로 메움 */const A=x+RI,B=x+1-RI,A2=y+RI,B2=y+1-RI,w=.095,t=.03;let P=[[A,A2]];if(n)P.push([A+w,A2],[A+w,A2-t],[B-w,A2-t],[B-w,A2]);P.push([B,A2]);if(e)P.push([B,A2+w],[B+t,A2+w],[B+t,B2-w],[B,B2-w]);P.push([B,B2]);if(s_)P.push([B-w,B2],[B-w,B2+t],[A+w,B2+t],[A+w,B2]);P.push([A,B2]);if(w_)P.push([A,B2-w],[A-t,B2-w],[A-t,A2+w],[A,A2+w]);const P2=[];P.forEach((p,k)=>{const q=P[(k+1)%P.length];for(let u=0;u<4;u++)P2.push([p[0]+(q[0]-p[0])*u/4,p[1]+(q[1]-p[1])*u/4]);});d+=`<polygon class="ix nf" points="${Q(P2)}"/>`;}else d+=`<polygon class="ix" points="${Q(DN([[X0,Y0],[X1,Y0],[X1,Y1],[X0,Y1]],4))}"/>`;}
      // 막힌 쪽(T자 교차로)은 인도 턱을 이어서 길이 끝난 게 아니라 꺾인 것처럼
      const w=.07,A=RI,B=1-RI;const cov=(px,py,vert)=>vert?clip(rdSegs(px,'x',a0,ay),px,1).some(([u,v])=>py>=u&&py<v):clip(rdSegs(py,'y',a0,ax),py,0).some(([u,v])=>px>=u&&px<v);
      if(!cov(x,y-1,1))d+=`<polygon class="sw" points="${Q(DN([[x+A,y+A],[x+B,y+A],[x+B,y+A+w],[x+A,y+A+w]]))}"/>`;
      if(!cov(x,y+1,1))d+=`<polygon class="sw" points="${Q(DN([[x+A,y+B-w],[x+B,y+B-w],[x+B,y+B],[x+A,y+B]]))}"/>`;
      if(!cov(x-1,y,0))d+=`<polygon class="sw" points="${Q(DN([[x+A,y+A],[x+A+w,y+A],[x+A+w,y+B],[x+A,y+B]]))}"/>`;
      if(!cov(x+1,y,0))d+=`<polygon class="sw" points="${Q(DN([[x+B-w,y+A],[x+B,y+A],[x+B,y+B],[x+B-w,y+B]]))}"/>`;
      {const k=RCN.find(q=>q.nx==x+.5&&q.ny==y+.5);if(k){const ix0=k.sx<0?x+A:x+B-w,iy0=k.sy<0?y+A:y+B-w;d+=`<polygon class="sw" points="${Q(DN([[ix0,iy0],[ix0+w,iy0],[ix0+w,iy0+w],[ix0,iy0+w]]))}"/>`;}}}));
    // 회전 교차로: 신호등 없는 교차로 몇 곳을 둥근 섬 + 둥근 차로로 (04 2026-11-03 "원형으로 도는 도로")
    // 회전 교차로는 마을 안 한 곳만 (04 2026-11-03 "너무 막 쓰지 마, 하나만"): 신호등 없는 네거리 중 마을 가운데에 가장 가까운 곳
    {let best=null,bd=1e9;RB=null;EX.forEach(x=>EY.forEach(y=>{const inG=x>=0&&y>=0&&x<GX&&y<GY;if(inMR(x,y)||!okR(x,y))return;if(PK&&(x==PK.x-1||x==PK.x+PK.w)&&(y==PK.y-1||y==PK.y+PK.h))return;/* 동그란 공원 둘레 교차로는 회전 교차로 제외 */const cv=(a,b)=>!inMR(a,b)&&okR(a,b)&&ZN(a,b)!=1;if(!cv(x-1,y)||!cv(x+1,y)||!cv(x,y-1)||!cv(x,y+1))return;const lab=PL.some(q=>{if(!q||!q.lots.length)return false;const t=q.lots.reduce((a,b)=>a[0]+a[1]<=b[0]+b[1]?a:b);return Math.hypot(t[0]-x,t[1]-y)<3&&t[0]+t[1]>=x+y;}),dd=Math.hypot(x-GX/2,y-GY/2)+(inG?0:4)+(lab?20:0);/* 달 이름표에 가리지 않는 곳 */if(dd<bd){bd=dd;best=[x,y];}}));best=null;/* 회전 교차로 없앰 (04 2026-11-03 "다리랑 맞닿는 곳 원형도로 없애줘") */
    RB=best;(best?[best]:[]).forEach(([x,y])=>{const cx=x+.5,cy=y+.5,ring=(r,n=40)=>{const o=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;o.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}return o;};
      d+=`<polygon class="sw" points="${Q(ring(.7,56))}"/><polygon class="ix" points="${Q(ring(.64,56))}"/><polygon class="sw" points="${Q(ring(.3))}"/><polygon class="pkg2" points="${Q(ring(.25))}"/>`;
      const rl=ring(.47,56);for(let i=0;i<rl.length;i+=2){const a=rl[i],b=rl[(i+1)%rl.length];cl+=`M${G(...rotC(...a))}L${G(...rotC(...b))}`;}
      const qq=rotC(cx,cy),[px,py]=G(...qq);DYN.push({o:qq[0]+qq[1]-1,y:py,s:tree(px,py,hsh(x+y)%3)});});}
    // 바깥 동네 길에도 차 몇 대 (마을 안과 같은 모양)
    {const PLc=MIFFY?vpNow().r.slice(0,4):(()=>{try{return DB.skin.pal&&DB.skin.pal()}catch(e){return null}})()||["var(--r1)","var(--r2)","var(--r3)","var(--r4)"];let n=0;const m5=v=>((v%5)+5)%5==4;
      RSET.forEach(kk=>{const [x,y]=kk.split(",").map(Number);if(x>=0&&y>=0&&x<GX&&y<GY)return;if(m5(x)==m5(y)||CVT.has(kk)||inMR(x,y)||ZN(x,y)==1)return;const h=hsh((x+80)*19+(y+80)*37);if(h%9)return;
        const vert=m5(x),dir=h&32?1:-1,off=.14*dir,w=vert?[x+.5+off,y+.5]:[x+.5,y+.5-off],s0=rotC(...w),s1=rotC(...(vert?[w[0],w[1]+dir]:[w[0]+dir,w[1]])),ux=Math.sign(Math.round(s1[0]-s0[0])),uy=Math.sign(Math.round(s1[1]-s0[1])),pw=G(...s0);
        DYN.push({o:s0[0]+s0[1]-1,y:pw[1],s:`<g class="car" transform="translate(${pw[0]},${pw[1]})">${car(ux,uy,PLc[(n++)%PLc.length])}</g>`});});}
    // 블록 모서리를 둥글게 (04 2026-11-03 "블록이 너무 사각사각"): 네거리 네 귀퉁이에 길 색 곡선 + 곡선 연석
    {const hasR2=(a,b)=>okR(a,b)&&!inMR(a,b)&&ZN(a,b)!=1,rr=.55,w=.07,N=10;EX.forEach(x=>EY.forEach(y=>{if(!hasR2(x,y)||RB&&RB[0]==x&&RB[1]==y||CNK.has(x+","+y))return;
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([dx,dy])=>{if(!hasR2(x+dx,y)||!hasR2(x,y+dy))return;if(PK&&x+dx>=PK.x&&x+dx<PK.x+PK.w&&y+dy>=PK.y&&y+dy<PK.y+PK.h)return;const px=x+.5+dx*(.5-RI),py=y+.5+dy*(.5-RI),cx=px+dx*rr,cy=py+dy*rr,arc=(r)=>{const o=[];for(let i=0;i<=N;i++){const t=i/N*Math.PI/2;o.push([cx-dx*r*Math.cos(t),cy-dy*r*Math.sin(t)]);}return o;};
        d+=`<polygon class="ix" points="${Q([[px,py],...arc(rr)])}"/><polygon class="ix" points="${Q([[px,py],[px-dx*(w+.03),py],[px-dx*(w+.03),py+dy*rr],[px,py+dy*rr]])}"/><polygon class="ix" points="${Q([[px,py],[px,py-dy*(w+.03)],[px+dx*rr,py-dy*(w+.03)],[px+dx*rr,py]])}"/><polygon class="sw" points="${Q([...arc(rr),...arc(rr+w).reverse()])}"/>`;});}));}
    let z="";const hasR=(a,b)=>okR(a,b)&&!inMR(a,b)&&ZN(a,b)!=1;/* 횡단보도: 마을 밖 교차로에도 똑같이 (04 2026-11-03 "외곽일수록 빈부격차") */EX.forEach(x=>EY.forEach(y=>{if(!hasR(x,y)||CNK.has(x+","+y)||PK&&(x==PK.x-1||x==PK.x+PK.w)&&(y==PK.y-1||y==PK.y+PK.h))return;const inG=x>=0&&y>=0&&x<GX&&y<GY;if(!inG&&hsh((x+60)*11+(y+60)*23)%2)return;/* 횡단보도 다시 늘림 (04 2026-11-03 "너무 없어"): 마을 안 교차로는 모두, 밖은 둘 중 하나 *//* 횡단보도 줄임 (04 2026-11-03): 마을 안은 신호등 있는 네거리만, 밖은 4곳 중 1곳 */
      [[0,-1],[0,1]].forEach(([_,dy])=>{const yy=y+dy;if(EYs.has(yy)||!hasR(x,yy))return;const y0=dy<0?yy+.23:yy+.40;/* 둥근 모퉁이 곡선 밖, 곧은 길 위로 (04 "연석 깨짐") *//* 바탕 덮개 없앰: 점선은 noI로 이미 비킴 *//* 연석은 안 덮게 (04 "스티커처럼 끊어먹음") *//* 점선 안 겹치게 */for(let i=0;i<4;i++){const x0=x+RI+.09+i*.1167;z+=`<polygon class="zb" points="${Q([[x0,y0],[x0+.08,y0],[x0+.08,y0+.37],[x0,y0+.37]])}"/>`;}});
      [[-1,0],[1,0]].forEach(([dx])=>{const xx=x+dx;if(EXs.has(xx)||!hasR(xx,y))return;const x0=dx<0?xx+.23:xx+.40;for(let i=0;i<4;i++){const y0=y+RI+.09+i*.1167;z+=`<polygon class="zb" points="${Q([[x0,y0],[x0+.37,y0],[x0+.37,y0+.08],[x0,y0+.08]])}"/>`;}});}));
    // 신호등: 교차로 대각선 두 모퉁이 인도 위, 팔을 교차로 쪽으로 뻗어 불 상자를 매닮
    let tl="";const k=TW/58;RDX.forEach(x=>RDY.forEach(y=>{if(x>=GX||y>=GY||inMR(x,y)||CNK.has(x+","+y)||PK&&(x==PK.x-1||x==PK.x+PK.w)&&(y==PK.y-1||y==PK.y+PK.h)||RB&&RB[0]==x&&RB[1]==y)return;const ic=G(...rotC(x+.5,y+.5)),hv=hsh(x*13+y*7);
      [[x+RI-.1,y+RI-.1,0],[x+1-RI+.1,y+1-RI+.1,1]].forEach(([gx,gy,f])=>{if(f||hv%2)return;const qq=rotC(gx,gy),[px,py]=G(...qq),h=15*k;let vx=ic[0]-px,vy=ic[1]-py;const ln=Math.hypot(vx,vy)||1;vx/=ln;vy/=ln;
        const bw=5*k,bh=13*k,bx=px-bw/2,by=py-h-bh,sd=1.8*k;
        let tl1=`<g class="tlt"><ellipse class="crs" cx="${px}" cy="${py}" rx="${2.2*k}" ry="${1.1*k}"/><rect class="tpole" x="${px-.9*k}" y="${py-h}" width="${1.8*k}" height="${h}" rx="${.9*k}"/>`
          +`<polygon class="tbs" points="${P([[bx+bw,by],[bx+bw+sd,by-sd*.5],[bx+bw+sd,by+bh-sd*.5],[bx+bw,by+bh]])}"/><polygon class="tbt" points="${P([[bx,by],[bx+sd,by-sd*.5],[bx+bw+sd,by-sd*.5],[bx+bw,by]])}"/><rect class="tbx" x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${.8*k}"/>`
          +["lr","ly","lg"].map((c,i)=>{const cy2=by+2.3*k+i*4.2*k;return `<circle class="${c}" cx="${px}" cy="${cy2}" r="${1.55*k}"/><path class="tvi" d="M${px-1.9*k} ${cy2-.2*k}a${1.9*k} ${1.9*k} 0 0 1 ${3.8*k} 0"/>`;}).join("")+`</g>`;DYN.push({o:qq[0]+qq[1]-1,y:py,s:tl1});});}));
    let al="";
    // 구불 골목 + 집 대문길 (04 2026-11-03 "산책길 다 이어지게, 집으로 들어가는 길도, 실제 쓰는 길처럼")
    const aOff=(t,L,sd)=>{const tp=Math.max(0,Math.min(1,t/.9,(L-t)/.9));return .2*Math.sin(t*Math.PI/1.7+sd)*tp;};
    const rib=(pts,w)=>{const Lf=[],Rt=[];pts.forEach((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l*w,ny=dx/l*w;Lf.push([p[0]+nx,p[1]+ny]);Rt.push([p[0]-nx,p[1]-ny]);});return Lf.concat(Rt.reverse());};
    const AL=ALY.map(([x1,y1,x2,y2,m])=>{const v=x1==x2,L=v?y2-y1:x2-x1,sd=((x1*7+y1*3)%6),at=t=>v?[x1+aOff(t,L,sd),y1+t]:[x1+t,y1+aOff(t,L,sd)];const pts=[];for(let t=0;t<=L+1e-6;t+=.1)pts.push(at(Math.min(t,L)));al+=`<polygon class="aly" points="${Q(rib(pts,.11))}"/>`;return {v,x1,y1,L,m,at};});
    J.filter(vis).forEach(j=>{const B=PL[j.m]&&PL[j.m].cell;if(!B)return;const [lx,ly]=lotXY(j.m,j.lot),cx=lx+.5,cy=ly+.5;
      // 대문은 화면 앞쪽(+y). 앞 마당 가장자리(cy+.5)로 나와서, 바로 앞이 길(블록 끝·가로 골목)이면 그대로, 아니면 가까운 세로 골목·블록 옆으로 휘어 감
      const fy=cy+.5,S=[cx,cy+.2];let T=null,dm=1e9;const tk=(c,d)=>{if(d<dm){dm=d;T=c;}};
      if(Math.abs(B.y+B.h-fy)<.05)tk([cx,B.y+B.h],0);
      AL.forEach(a=>{if(a.m!==j.m)return;if(!a.v){const t=cx-a.x1;if(t>=0&&t<=a.L){const c=a.at(t);if(c[1]>=fy-.25&&c[1]-fy<.45)tk(c,0);}}else{const t=fy-a.y1;if(t>=0&&t<=a.L){const c=a.at(t);tk(c,Math.abs(c[0]-cx));}}});
      tk([B.x,fy],cx-B.x);tk([B.x+B.w,fy],B.x+B.w-cx);
      const M=[cx,fy],pts=[];for(let i=0;i<=12;i++){const u=i/12,v=1-u;pts.push([v*v*S[0]+2*v*u*M[0]+u*u*T[0],v*v*S[1]+2*v*u*M[1]+u*u*T[1]]);}
      al+=`<polygon class="aly ent" points="${Q(rib(pts,.055))}"/>`;});
    let arc="";{const Hm=TW*.42;const run=(vert,f)=>{let t0=null;for(let t=a0;t<=(vert?ay:ax);t++){const w=t<(vert?ay:ax)&&(vert?ZN(f,t):ZN(t,f))==1;if(w&&t0==null)t0=t;if(!w&&t0!=null){const t1=t,L=t1-t0,n=Math.max(1,Math.round(L/3));
        [RI-.1,1-RI+.1].forEach(e=>{let pa="",hg="";for(let k=0;k<=L*8;k++){const u=t0+k/8,q=vert?[f+e,u]:[u,f+e],[px,py]=G(...rotC(...q)),hh=Hm*Math.abs(Math.sin(Math.PI*n*(u-t0)/L));pa+=(k?"L":"M")+px.toFixed(1)+" "+(py-hh).toFixed(1);if(k%4==0&&k&&k<L*8)hg+=`M${px.toFixed(1)} ${py.toFixed(1)}V${(py-hh).toFixed(1)}`;}
          arc+=`<path class="hng" d="${hg}"/><path class="arc" d="${pa}"/>`;});t0=null;}}};if(BB.x>=0)run(1,BB.x);}
    return brg+al+d+`<path class="cl" d="${cl}"/>`+z+tl+arc;}
  function celebrate(id){const sc=root.querySelector(".scr"),el=bd.querySelector(`.hz[data-id="${id}"]`);if(!sc||!el)return;const r=el.getBoundingClientRect(),q=sc.getBoundingClientRect();if(r.width<2)return;
    const fx=document.createElement("div");fx.className="vlg-fx";fx.style.left=(r.left-q.left+r.width/2)+"px";fx.style.top=(r.top-q.top+r.height*.35)+"px";
    const C=["#f26935","#005b93","#ffdd50","#3fa143","#ff9bb3","#fff"];let h=`<div class="rb"><i class="l"></i><i class="r"></i><b></b></div>`;
    for(let i=0;i<26;i++){const a=(i/26)*Math.PI*2+(i%3)*.3,d=46+(i*37%40);h+=`<span style="--x:${(Math.cos(a)*d).toFixed(0)}px;--y:${(Math.sin(a)*d*.7-30).toFixed(0)}px;--r:${(i*47)%360}deg;background:${C[i%C.length]};animation-delay:${(i%5)*20}ms"></span>`;}
    fx.innerHTML=h;sc.appendChild(fx);setTimeout(()=>fx.remove(),2200);}
  function render(){v&&(v._rt=Date.now());
    setReg();fit();const SC=root.querySelector(".scr"),SW=SC.clientWidth,SH=SC.clientHeight,wlH=(root.querySelector("[data-wl]")||{}).offsetHeight||0;
    {const pk=FM+"|"+R+"|"+Y;if(pk!==PK0){PAN={x:0,y:0};PK0=pk;}}PAD=48;setReg();RSET=buildRS();{const b=bb(),m=TW*2.2,hw=(b.x1-b.x0)*TW/2,hh=(b.y1-b.y0)*TW/2;v._pl={x:Math.max(m,hw-SW/2+m),y:Math.max(m,hh-SH/2+m)};if(FM!=null){v._pl.x+=SW*.3;v._pl.y+=SH*.3;}PAN.x=Math.max(-v._pl.x,Math.min(v._pl.x,PAN.x));PAN.y=Math.max(-v._pl.y,Math.min(v._pl.y,PAN.y));}const BB=BRL(),ZPC=(v._cam&&v._cam.fm===FM&&v._zc&&v._zc.fm2===FM&&Date.now()-v._zt<450)?v._zc:v._cam,ZSC=(ZPC&&ZPC.fm!==FM&&ZPC.r===R&&!RM)?TW/ZPC.tw:1,ML=Math.max(SW,SH)*Math.max(.6,(ZSC-1)/2+.7);let sea="",cliffs="";const LAY=[{c:"shn",lv:1.6,f:v=>v<1.6,d:""},{c:"shn",lv:RW0-1.6,f:v=>v>RW0-1.6,d:""},{c:"snd",lv:.95,f:v=>v<.95,d:""},{c:"snd",lv:RW0-.95,f:v=>v>RW0-.95,d:""},{c:"grn",lv:.45,f:v=>v<.45,d:""},{c:"grf",lv:RW0-.45,f:v=>v>RW0-.45,d:""}];const okR=(x,y)=>!CAS.has(x+","+y)&&((x>=0&&y>=0&&x<GX&&y<GY)||RSET.has(x+","+y));
    const Wd=W(),Hd=H();let sandE="",tiles="",objs=[],wips=[],trees=[],parks=[],ghosts=[];
    const cc=FM==null?null:[PL[FM].cell.x+PL[FM].cell.w/2,PL[FM].cell.y+PL[FM].cell.h/2],ctr=FM==null?(()=>{const b=bb();return [(b.x0+b.x1)/2*TW,(b.y0+b.y1)/2*TW];})():G(...rotC(...cc)),offX=SW/2-ctr[0]+PAN.x,offY=(FM==null?TOPP+(SH-TOPP-WLH()-14)/2:SH/2+TW*.45)-ctr[1]+PAN.y;
    const occ={};J.filter(vis).forEach(j=>{const [x,y]=lotXY(j.m,j.lot);occ[x+","+y]=j;});
    for(let x=RX;x<RX+RW;x++)for(let y=RY;y<RY+RH;y++){
      const out=x<0||y<0||x>=GX||y>=GY,dst=out?Math.max(-x,-y,x-GX+1,y-GY+1):0;
      const gRd=out&&((x<0||x>=GX)&&(x+100)%5==4||(y<0||y>=GY)&&(y+100)%5==4)&&okR(x,y);
      const ti=TI[x+","+y],road=!ti,isRd=(RDX.has(x)&&x<GX||RDY.has(y)&&y<GY)&&!inMR(x,y)&&okR(x,y)||gRd,m=road?-1:ti.m,i=road?-1:ti.i;
      const [rx,ry]=rot(x,y),[sx,sy]=TC(x,y);if(sx+offX<-TW-ML||sx+offX>SW+TW+ML||sy+offY<-TW*2-ML||sy+offY>SH+TW+ML)continue;
      const zn=out?ZN(x,y):0;
      if(zn==1){const cell=(cx,cy,st)=>{const C=[[cx,cy],[cx+st,cy],[cx+st,cy+st],[cx,cy+st]],V=C.map(c=>FF(...c));
          LAY.forEach(L=>{const inn=V.map(v=>L.f(v));if(!inn.some(Boolean))return;const pts=[];for(let k=0;k<4;k++){const k2=(k+1)%4;if(inn[k])pts.push(C[k]);if(inn[k]!=inn[k2]){const t=(L.lv-V[k])/(V[k2]-V[k]);pts.push([C[k][0]+(C[k2][0]-C[k][0])*t,C[k][1]+(C[k2][1]-C[k][1])*t]);}}
            L.d+="M"+pts.map(q=>G(...rotC(...q)).map(n=>n.toFixed(1)).join(" ")).join("L")+"Z";});};
        for(let a=0;a<2;a++)for(let b=0;b<2;b++)cell(x+a*.5,y+b*.5,.5);
        const h=hsh((x+60)*17+(y+60)*31),fc=FF(x+.5,y+.5);if(h%6==0&&fc>1.7&&fc<RW0-1.7){const w=TW*.16,px=sx+((h>>2)%5-2)*TW*.08,py=sy+TH/2+((h>>5)%3-1)*TH*.15;sea+=`M${px-w} ${py}q${w/2} ${-w*.35} ${w} 0t${w} 0`;}continue;}
      const cm=CEL[x+","+y],fut=cm!=null&&cm>CM;
      const ln=LN[x+","+y],jj=occ[x+","+y],inR=q=>q&&x>=q.x&&x<q.x+q.w&&y>=q.y&&y<q.y+q.h,ffc=out?FF(x+.5,y+.5):-9,bank=out&&!isRd&&(ffc>-1.6&&ffc<.45||ffc>RW0-.45&&ffc<RW0+1.4),inPk=inR(PK)||GDN.some(inR)||bank;// 강가 둔치: 강 양쪽 띠는 공원(집 없이 나무)
      tiles+=`<polygon class="tl${inPk?" pkg":ln?(fut?" fu":" ln"):road?(isRd?" rd":" gr"+(fut?" fu":"")):m>CM?" fu":jj&&jj.done?(jj.k=="o"?" pv":" yd"):m==CM?" cur":""}${out?" ou":""}${zn==2?" fb":""}"  ${cfg.tile?cfg.tile(m,road,x,y):""} data-m="${m}" data-i="${i}" points="${P([[x,y],[x+1,y],[x+1,y+1],[x,y+1]].map(p=>G(...rotC(...p))))}"/>`;
      const j=occ[x+","+y];if(j)(j.done?objs:wips).push({o:rx+ry,j,cx:sx,cy:sy+TH/2});
      else if(inPk){if(bank&&hsh((x+70)*13+(y+70)*29)%3==0)trees.push({o:rx+ry,cx:sx,cy:sy+TH/2,v:hsh((x+70)*7+y)%3});}
      else if(road&&!ln&&!isRd&&!fut&&!out&&hsh((x+9)*41+(y+9)*29)%7==0)parks.push({o:rx+ry,cx:sx,cy:sy+TH/2,v:hsh((x+9)*3+(y+9)*5)%4,nb:[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>{const X2=x+dx,Y2=y+dy,o2=X2<0||Y2<0||X2>=GX||Y2>=GY,g2=o2&&((X2<0||X2>=GX)&&(X2+100)%5==4||(Y2<0||Y2>=GY)&&(Y2+100)%5==4)&&okR(X2,Y2);return (RDX.has(X2)&&X2<GX||RDY.has(Y2)&&Y2<GY)&&!inMR(X2,Y2)&&okR(X2,Y2)||g2;}).map(([dx,dy])=>{const [a2,b2]=TC(x+dx,y+dy);return [(sx+a2)/2,(sy+b2)/2+TH/2];}),hs:hsh((x+9)*11+(y+9)*23)});
      else if((out||EMP.some(inR))&&!isRd&&hsh((x+99)*37+(y+99)*11)%(zn==2?5:2)==0)ghosts.push({o:rx+ry,cx:sx,cy:sy+TH/2,h:hsh((x+99)*5+(y+99)*7)});
      else if(road&&!ln&&!isRd&&!fut&&hsh((x+9)*31+(y+9)*17)%5<(out?1:2))trees.push({o:rx+ry,cx:sx,cy:sy+TH/2,v:hsh((x+9)*7+(y+9)*13)%3,op:1});}
    const c=[[0,0],[Wd,0],[Wd,Hd],[0,Hd]].map(([x,y])=>scr(x,y));
    objs.sort((a,b)=>a.o-b.o);
    DYN=[];BNC=0;const traf=traffic();
    const tz=(o)=>o.op<1?`<g opacity="${o.op}">${tree(o.cx,o.cy,o.v)}</g>`:tree(o.cx,o.cy,o.v);const all=objs.map(o=>({o:o.o,y:o.cy,s:yardHouse(o)})).concat(trees.map(t=>({o:t.o,y:t.cy,s:tz(t)}))).concat(parks.map(t=>({o:t.o,y:t.cy,s:park(t)}))).concat(ghosts.map(g=>({o:g.o,y:g.cy,s:ghost(g)}))).concat(PK?bigPark((()=>{const tot=PL.reduce((a,q)=>a+(q?q.lots.length:0),0)||1,f=objs.length/tot;return f<.25?1:f<.5?2:f<.75?3:4;})()):[]).concat(GDN.flatMap(garden)).concat(DYN);all.sort((a,b)=>a.o-b.o||a.y-b.y);
    const hz0=all.map(a=>a.s).join("");
    const hz=hz0;
    const kk=TW/58;
    const wz=wips.map(o=>`<g class="hz" data-id="${o.j.id}"><polygon class="nlot" data-id="${o.j.id}" points="${P([[o.cx,o.cy-TH/2],[o.cx+TW/2,o.cy],[o.cx,o.cy+TH/2],[o.cx-TW/2,o.cy]])}"/><text class="nlp" x="${o.cx}" y="${o.cy+4}" text-anchor="middle">${o.j.p}%</text></g>`).join(""),wb="";
    const wl=root.querySelector("[data-wl]");if(wl){const L=J.filter(j=>!j.done&&!j.hid&&vis(j)).map(j=>({j})).sort((a,b)=>b.j.p-a.j.p);
      wl.innerHTML=`<div class="wlh">접는 중<b>${L.length}</b></div>`+(L.length?L.map(o=>`<div class="wli" data-id="${o.j.id}"><svg width="208" height="150" viewBox="-104 -78 208 150">${net(o.j,0,o.j.k=="o"?10:4,1.9)}</svg><div class="wln"><span>${o.j.cl} · ${o.j.t}</span><b>${o.j.p}%</b></div><div class="wlb"><i style="width:${o.j.p}%;background:${ROOF[o.j.cl]}"></i></div></div>`).join(""):`<div class="wle">작업 중인 의뢰가 없어요</div>`);
      wl.querySelectorAll(".wli").forEach(el=>{const j=J.find(x=>x.id==+el.dataset.id);const lot=()=>bd.querySelector(`.nlot[data-id="${j.id}"]`);
        el.onclick=e=>{e.stopPropagation();closeAll();showPop(j,e.clientX,e.clientY);};
        el.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();closeAll();showMenu(j,e.clientX,e.clientY);};
        el.onmouseenter=()=>{const l=lot();if(l)l.classList.add("on");};el.onmouseleave=()=>{const l=lot();if(l)l.classList.remove("on");};});}
    let flags="",poles="";for(let m=0;m<12;m++){let bx=null;for(const [x,y] of PL[m].lots){const [sx,sy]=TC(x,y);if(!bx||sy<bx[1])bx=[sx,sy];}const f=cfg.flag(bx[0],bx[1]+4,m);poles+=f[0];flags+=f[1];
}
    const vw=SW,vh=SH;
    const shore=LAY.map(L=>`<path class="${L.c}" d="${L.d}"/>`).join("")+`<path class="wave" d="${sea}"/>`;
    const NGT=(()=>{let o=null;try{o=localStorage.getItem("vlgNight")}catch(_){}if(o=="1")return true;if(o=="0")return false;const h=new Date().getHours();return h>=19||h<6;})();root.classList.toggle("night",NGT);
    const nightL=NGT?`<rect class="ngt" x="${-offX-4000}" y="${-offY-4000}" width="${SW+8000}" height="${SH+8000}"/><g class="glow">${hz0}${traf}</g>`:"";
    bd.innerHTML=`<svg width="${vw}" height="${vh}" style="color:var(--ink);--k:${(TW/58).toFixed(3)}"><g transform="translate(${offX},${offY})">${shore}<g class="tg">${tiles}</g>${sandE}${traf}${poles}${wz}${hz}${nightL}${flags}${wb}</g></svg>`;
    // 확대·축소 이음: 새 그림을 옛 카메라 위치에서 시작해 부드럽게 다가감
    {let pc=v._cam,dur=450;const sv=bd.querySelector("svg");
      // 전환 도중 다시 그리면(크기 맞춤 등) 처음 카메라에서 남은 시간만큼 이어서 감: 한 프레임 튀는 것 막기
      if(pc&&pc.fm===FM&&v._zc&&v._zc.fm2===FM&&Date.now()-v._zt<450){pc=v._zc;dur=Math.max(120,450-(Date.now()-v._zt));}
      const soft=v._soft&&pc&&pc.fm===FM&&pc.r===R&&(Math.abs(pc.tw-TW)>.3||Math.hypot(pc.ox-offX,pc.oy-offY)>3);v._soft=0;if(soft)dur=380;/* 한 해로 돌아온 뒤 접는 중 줄 높이로 다시 맞출 때 뚝 튀지 않게 이어서 움직임 (04 2026-11-03 "달 확대 후 한 해로 돌아가는 게 어색") *//* 처음 열 때(자리 잡는 동안)는 확대 애니메이션 없이, 다 자리 잡은 뒤 한 번에 살짝 나타나게 (04 2026-11-03 "멀리서 열리고 한번 그리고 확대되면서 움찔") */{const bdd=bd;if(!v._ready){bdd.classList.add("warm");clearTimeout(v._rdy);v._rdy=setTimeout(()=>{v._ready=1;bdd.classList.remove("warm");},420);}}
      if(v._ready&&pc&&(pc.fm!==FM||soft)&&pc.r===R&&sv&&!RM){if(dur==450){v._zc=Object.assign({},pc,{fm2:FM});v._zt=Date.now();}const sc=TW/pc.tw,tx=pc.ox-offX/sc,ty=pc.oy-offY/sc;
      sv.style.transformOrigin="0 0";sv.style.transform=`translate(${tx}px,${ty}px) scale(${1/sc})`;sv.getBoundingClientRect();sv.style.transition=`transform ${dur}ms cubic-bezier(.3,.7,.2,1)`;sv.style.transform="none";}
     const chg=pc&&pc.fm!==FM&&!v._re;v._cam={ox:offX,oy:offY,tw:TW,fm:FM,r:R};
     /* 한 해↔한 달 바뀐 직후 칸 높이가 달라지면 바로 한 번 더 맞춰 그림(옛 카메라에서 출발): 1초 뒤 다시 튀는 것 막기 (04 2026-11-03) */
     if(chg)v._mc=pc;}
    {const sc2=root.querySelector(".scr");v._sz=sc2.clientWidth+"x"+sc2.clientHeight;}
    // 접는 중 줄 높이가 바뀌면(첫 그림·돌리기·거르기) 한 번 더 맞춤: 아래 줄이 구역을 덮지 않게
    if(FM==null&&!v._wlFix){const w=root.querySelector("[data-wl]"),h2=w&&w.children.length>1?w.offsetHeight:0;if(Math.abs(h2-(v._wlUsed||0))>6){v._wlFix=1;requestAnimationFrame(()=>{v._soft=1;render();v._wlFix=0;});}}
    // 한 달 보기: 집마다 부동산 앱처럼 팻말(의뢰인·금액)
    if(FM!=null){const G0=bd.querySelector("svg>g");let pins="",PS=[];const man=f=>f>=10000?Math.round(f/10000).toLocaleString("ko-KR")+"만":f?f.toLocaleString("ko-KR")+"원":"";
      let PI=0;J.filter(j=>j.m==FM&&j.done&&vis(j)).forEach(j=>{const el=bd.querySelector(`.hz[data-id="${j.id}"]`);if(!el)return;let b;try{b=el.getBBox()}catch(_){return}if(!b.width)return;
        const x=b.x+b.width/2,y=b.y-2;
        const PST=window.__pnSt||"B",rc=ROOF[j.cl]||"#888";
        if(PST==="A")PS.push([y,`<foreignObject class="pin" data-id="${j.id}" x="${(x-130).toFixed(1)}" y="${(y-110).toFixed(1)}" width="260" height="110"><div xmlns="http://www.w3.org/1999/xhtml" class="ptip">${j.im?`<img class="pth" data-k="${j.im}" alt=""/>`:""}<div class="ptx"><b>${j.cl}</b><span>${j.k=="c"?j.t:j.t+(j.pg?" · "+j.pg+"p":"")}</span><span>${j.m+1}월 ${j.d}일 완성 · ${won(j.fee)}</span></div></div></foreignObject>`,x,0,0]);
        else{/* 팻말 시안 (04 2026-11-03 "카드가 따닥따닥, 회색이라 안 예뻐"): B 흰 말풍선+지붕 색 띠(이름·금액 한 줄), C 지붕 색 알약(이름만), D 금액 동그라미. 겹치면 위로 비키고, 그래도 겹치면 점만 */
          const lbl=PST==="D"?man(j.fee):j.cl/* B: 이름만 (04 2026-11-03 "금액 들어가는 게 별로") */,wE=PST==="D"?Math.max(34,[...lbl].length*9+14):[...lbl].length*(PST==="C"?12:12.5)+30,hE=PST==="D"?26:28;
          PS.push([y,(dy,dot)=>dot?`<circle class="pdot" cx="${x}" cy="${y-6}" r="4.5" fill="${rc}"/>`:`<foreignObject class="pin" data-id="${j.id}" x="${(x-wE/2-6).toFixed(1)}" y="${(y-hE-14-dy).toFixed(1)}" width="${wE+12}" height="${hE+16+dy}"><div xmlns="http://www.w3.org/1999/xhtml" class="pn${PST}" style="--rc:${rc};--st:${dy}px;--i:${PI++}"><span>${cttE(lbl)}</span></div></foreignObject>`,x,wE,hE]);}});
      const cttE=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
      {const placed=[];PS.sort((a,b)=>b[0]-a[0]);/* 앞(아래)에 있는 집부터 자리 잡기 */PS.forEach(it=>{if(typeof it[1]==="string"){it.out=it[1];return;}const [y,f,x,w,h]=it;let dy=0,ok=false;for(let t=0;t<4&&!ok;t++){const bx={x0:x-w/2-3,x1:x+w/2+3,y0:y-h-12-dy,y1:y-12-dy};if(!placed.some(q=>bx.x0<q.x1&&bx.x1>q.x0&&bx.y0<q.y1&&bx.y1>q.y0)){placed.push(bx);ok=true;}else dy+=h+4;}it.out=ok?f(dy,false):f(0,true);});}
      pins=PS.sort((a,b)=>a[0]-b[0]).map(x=>x.out).join("");
      /* 한 달 보기 달 표시: 블록 앞 모서리 아래 큰 이름표 (04 2026-11-03 "달 표기가 더 잘 보이게") */if(G0){const c=PL[FM].cell,cn=[[c.x,c.y+c.h],[c.x+c.w,c.y+c.h],[c.x+c.w,c.y],[c.x,c.y]].map(q=>G(...rotC(...q)));const fp=cn.reduce((a,b)=>b[1]>a[1]?b:a),nD=J.filter(j=>j.m==FM&&j.done&&vis(j)).length,tx=MN[FM],ww=[...tx].length*20+76;
        G0.insertAdjacentHTML("beforeend",`<foreignObject class="mbig" x="${fp[0]-ww/2-10}" y="${fp[1]+6}" width="${ww+20}" height="60"><div xmlns="http://www.w3.org/1999/xhtml" class="mbg${FM==CM?" now":""}"><b>${tx}</b><span>${nD}채</span></div></foreignObject>`);bd.querySelectorAll(".mlg,.mpo").forEach((g,i)=>{if(i%1==0)g.style.display="none";});}
      if(G0&&pins){G0.insertAdjacentHTML("beforeend",`<g class="pins">${pins}</g>`);G0.querySelectorAll(".pins img.pth").forEach(im=>thumbURL(im.dataset.k).then(u=>{if(u)im.src=u;else im.remove();}));}}
    // 완공 연출: 지난번에 못 본 새 완성 집에 리본이 끊기고 꽃가루가 터짐(한 번만)
    {const KEY="vlgDoneSeen2",now=J.filter(j=>j.done).map(j=>j.uid);let seen=null;try{seen=JSON.parse(localStorage.getItem(KEY)||"null")}catch(_){}
     if(seen&&!RM){const ss=new Set(seen),nw=J.filter(j=>j.done&&!ss.has(j.uid)).slice(-3);nw.forEach((j,n)=>setTimeout(()=>celebrate(j.id),250+n*500));}
     try{localStorage.setItem(KEY,JSON.stringify([...new Set((seen||[]).concat(now))].slice(-3000)))}catch(_){}}
    root.classList.toggle("mon",FM!=null);
    /* 한 해↔한 달 바뀐 직후: 머리줄·칸 높이가 다 바뀐 뒤 같은 순간에 한 번 더 맞춤(옛 카메라에서 출발) → 1초 뒤 움찔 없앰 (04 2026-11-03) */{const dk0=root.querySelector(".desk");if(dk0){v._tops=v._tops||{};v._tops[FM==null?"y":"m"]=dk0.getBoundingClientRect().top;}}if(v._mc&&!v._re){const pc0=v._mc;v._mc=null;const dk=root.querySelector(".desk"),nh=dk?Math.max(360,Math.round(innerHeight-dk.getBoundingClientRect().top-16)):0;if(dk&&Math.abs(nh-(dk._h||0))>4){v._cam=pc0;v._zc=null;v._re=1;try{render();}finally{v._re=0;}return;}}else v._mc=null;
    {const chk=()=>{const dk=root.querySelector(".desk");if(!dk||!document.body.contains(dk))return;const nh=Math.max(360,Math.round(innerHeight-dk.getBoundingClientRect().top-16));if(Math.abs(nh-(dk._h||0))>4){v._soft=1;render();}};if(!v._fx){v._fx=1;[60,300,900].forEach(t=>setTimeout(chk,t));setTimeout(()=>v._fx=0,950);}}
    bd.querySelectorAll(".hz").forEach(g=>bind(g,J.find(j=>j.id==+g.dataset.id)));
    const done=J.filter(j=>j.done&&!j.hid),nC=done.filter(j=>j.k=="c").length,nb=new Set(done.map(j=>j.cl)).size,sum=done.reduce((a,j)=>a+j.fee,0);
    const yt=root.querySelector("[data-yt]");if(yt)yt.innerHTML=FM==null?`${Y}`:`${Y}<em>${MN[FM]}</em>`;
    root.querySelectorAll("[data-y]").forEach(b=>{const d=+b.dataset.y;b.disabled=FM==null?!YRS.some(y=>d<0?y<Y:y>Y):(FM+d<0||FM+d>11);});
    root.querySelectorAll("[data-vm]").forEach(b=>b.classList.toggle("on",(b.dataset.vm=="m")==(FM!=null)));{const bk=root.querySelector("[data-back]");if(bk){bk.hidden=FM==null;bk.onclick=()=>{FM=null;closeAll();render();};}}/* 한 달 보기에서 한 해로 돌아가는 큰 버튼 (04 2026-11-03) */
    bd.querySelectorAll(".tl[data-m]").forEach(t=>{const m=+t.dataset.m;if(m>=0&&m!==FM)t.onclick=()=>{FM=m;closeAll();render();};});
    bd.querySelectorAll(".mlg").forEach((g,m)=>g.onclick=()=>{FM=m;closeAll();render();});
    root.querySelector("[data-stat]").innerHTML=`<span><b>${done.length}</b>채</span><span><b>${nC}</b>집</span><span><b>${done.length-nC}</b>건물</span><span><b>${nb}</b>이웃</span><span><b>${J.filter(j=>!j.done&&!j.hid).length}</b>${cfg.wip}</span>`;
    root.querySelectorAll("[data-cap]").forEach(e=>e.textContent=`2026 도시 계획 · ${done.length}채`);
    root.querySelectorAll("[data-sub]").forEach(e=>e.textContent=`커미션 ${nC} · 외주 ${done.length-nC} · 이웃 ${nb} · ${won(sum)}`);
  }
  // 한 달 보기: 달력 칸(일~토) 위에 그날 끝낸 집이 섬
  function monthSvg(){const days=new Date(Y,FM+1,0).getDate(),off=new Date(Y,FM,1).getDay(),rows=RH,offX=rows*TW/2+30,offY=TW*1.2+30;
    const S=(x,y)=>[(x-y)*TW/2,(x+y)*TH/2],dia=(x,y,g)=>P([S(x+g,y+g),S(x+1-g,y+g),S(x+1-g,y+1-g),S(x+g,y+1-g)]);
    const byD={};J.filter(j=>j.done&&j.m==FM&&vis(j)).forEach(j=>(byD[j.d]=byD[j.d]||[]).push(j));
    let tl="",nums="",obj=[],hd="";const today=Y==Y0&&FM==CM0?now.getDate():0,mx=(x,y)=>{const [a,b]=S(x,y);return `matrix(${TW/2},${TH/2},${-TW/2},${TH/2},${a},${b})`;};
    for(let c=0;c<7;c++){const [a,b]=S(c+.5,-.25);hd+=`<text class="mwd${c==0?" sun":c==6?" sat":""}" x="${a}" y="${b}" font-size="${Math.max(11,TW*.15)}" text-anchor="middle">${"일월화수목금토"[c]}</text>`;}
    for(let r=0;r<rows;r++)for(let c=0;c<7;c++){const d=r*7+c-off+1,inM=d>=1&&d<=days;
      tl+=`<polygon class="tl ${inM?"dy":"gr"}${d==today?" cur":""}${c==0?" sun":c==6?" sat":""}" points="${dia(c,r,.04)}"/>`;
      if(!inM)continue;{const [a,b]=S(c+.08,r+.92);nums+=`<text class="mdn${c==0?" sun":c==6?" sat":""}${d==today?" now":""}" x="${a}" y="${b+3}" font-size="${Math.max(10,TW*.13)}" text-anchor="middle">${d}</text>`;}
      const L=byD[d]||[],n=L.length;if(!n)continue;
      const pos=n==1?[[.5,.5]]:[[.3,.3],[.7,.3],[.3,.7],[.7,.7]],sc=n==1?.8:.55;
      L.slice(0,4).forEach((j,i)=>{const [u,v]=pos[i],[cx,cy]=S(c+u,r+v);obj.push({cy,s:`<g class="hz" data-id="${j.id}">${iso(j,cx,cy,sc)}</g>`});});
      if(n>4){const [cx,cy]=S(c+.85,r+.85);obj.push({cy:cy+1e3,s:`<g><rect class="pcb" x="${cx-14}" y="${cy-9}" width="28" height="18" rx="9"/><text class="pc" x="${cx}" y="${cy+4}" text-anchor="middle">+${n-4}</text></g>`});}}
    obj.sort((a,b)=>a.cy-b.cy);
    const c4=[S(0,0),S(7,0),S(7,rows),S(0,rows)],vw=(7+rows)*TW/2+60,vh=(7+rows)*TH/2+offY+cfg.depth+20;
    return `<svg width="${vw}" height="${vh}" style="color:var(--ink)"><g transform="translate(${offX},${offY})">${cfg.base(c4,cfg.depth)}<g class="tg">${tl}</g>${hd}${nums}${obj.map(o=>o.s).join("")}</g></svg>`;}
  function bind(g,j){
    g.onclick=e=>{e.stopPropagation();closeAll();showPop(j,e.clientX,e.clientY);};
    g.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();closeAll();showMenu(j,e.clientX,e.clientY);};
    g.onmousemove=e=>tipShow(j,e.clientX,e.clientY);g.onmouseleave=tipHide;
    g.onpointerdown=e=>{if(e.button||!j.done)return;const sx=e.clientX,sy=e.clientY;let moving=false,tgt=null;
      const mv=ev=>{if(!moving&&Math.hypot(ev.clientX-sx,ev.clientY-sy)<5)return;moving=true;closeAll();
        g.style.pointerEvents="none";g.style.opacity=".7";g.setAttribute("transform",`translate(${ev.clientX-sx},${ev.clientY-sy})`);
        bd.querySelectorAll(".tl.hot").forEach(t=>t.classList.remove("hot"));tgt=null;
        const u=document.elementFromPoint(ev.clientX,ev.clientY);
        if(u&&u.classList.contains("tl")&&+u.dataset.m==j.m){u.classList.add("hot");tgt=+u.dataset.i;}};
      const up2=()=>{removeEventListener("pointermove",mv);removeEventListener("pointerup",up2);if(!moving)return;
        g.onclick=null;if(tgt!=null){const o=J.find(x=>x!==j&&x.m==j.m&&x.done&&x.lot==tgt);if(o)o.lot=j.lot;j.lot=tgt;}renderAll();};
      addEventListener("pointermove",mv);addEventListener("pointerup",up2);};
  }
  const v={render,zoom(z){TW=z;TH=z/2;render();},rotate(d){R=(R+d+4)%4;render();},nb(cl){nbCl=cl;render();say(`${cl}의 집 ${J.filter(j=>j.cl==cl&&j.done).length}채`,()=>{nbCl=null;render();});setTimeout(()=>{if(nbCl==cl){nbCl=null;render();}},4000);}};
  root.querySelectorAll("[data-rot]").forEach(b=>b.onclick=()=>v.rotate(+b.dataset.rot));
  // 밤: 저녁 7시~아침 6시 자동, ☾ 버튼으로 바꿔 보기(이 기기에만 기억)
  root.querySelectorAll("[data-night]").forEach(b=>b.onclick=()=>{const n=!root.classList.contains("night");try{localStorage.setItem("vlgNight",n?"1":"0")}catch(_){}render();});
  root.querySelectorAll("[data-y]").forEach(b=>b.onclick=()=>{const d=+b.dataset.y;closeAll();
    if(FM!=null){FM=Math.max(0,Math.min(11,FM+d));render();return;}
    const L=d<0?YRS.filter(y=>y<Y):YRS.filter(y=>y>Y);if(!L.length)return;Y=d<0?L[L.length-1]:L[0];CM=Y==Y0?CM0:Y<Y0?12:-1;cfg.rebuild();renderAll();});
  root.querySelectorAll("[data-vm]").forEach(b=>b.onclick=()=>{closeAll();FM=b.dataset.vm=="m"?(FM!=null?FM:Y==Y0?CM0:0):null;render();});
  /* 끌어서 화면 옮기기 */
  {const sc=root.querySelector(".scr");let d0=null,eat=false;
   sc.addEventListener("pointerdown",e=>{if(e.button!==0||e.target.closest(".vlg-pop,.vlg-menu,.wli,button"))return;d0={x:e.clientX,y:e.clientY,id:e.pointerId,mv:false};});
   const mv=e=>{if(!d0||e.pointerId!==d0.id)return;const dx=e.clientX-d0.x,dy=e.clientY-d0.y;if(!d0.mv){if(dx*dx+dy*dy<25)return;d0.mv=true;root.classList.add("pan");closeAll();try{sc.setPointerCapture(d0.id)}catch(_){}}
     const sv=bd.querySelector("svg");if(sv){sv.style.transition="none";sv.style.transform=`translate(${dx}px,${dy}px)`;}};
   const up=e=>{if(!d0||e.pointerId!==d0.id)return;const was=d0.mv,dx=e.clientX-d0.x,dy=e.clientY-d0.y;d0=null;root.classList.remove("pan");if(!was)return;eat=true;setTimeout(()=>eat=false,0);
     const pl=v._pl||{x:200,y:200};PAN={x:Math.max(-pl.x,Math.min(pl.x,PAN.x+dx)),y:Math.max(-pl.y,Math.min(pl.y,PAN.y+dy))};v._cam=null;render();};
   sc.addEventListener("pointermove",mv);sc.addEventListener("pointerup",up);sc.addEventListener("pointercancel",up);
   sc.addEventListener("click",e=>{if(eat){e.stopPropagation();e.preventDefault();eat=false;}},true);}
  const esc=e=>{if(e.key=="Escape"&&FM!=null&&document.body.contains(root)){FM=null;closeAll();render();}};document.addEventListener("keydown",esc);
  if(window.ResizeObserver){const _sc=root.querySelector(".scr");let lw=_sc.clientWidth,lh=_sc.clientHeight;const ro=new ResizeObserver(es=>{const r=es[0].contentRect,w=Math.round(r.width),h=Math.round(r.height);const sc2=root.querySelector(".scr"),sz=sc2.clientWidth+"x"+sc2.clientHeight;if(sz==v._sz||Date.now()-(v._rt||0)<500||(Math.abs(w-lw)<24&&Math.abs(h-lh)<24)){lw=w;lh=h;return;}lw=w;lh=h;clearTimeout(v._t);v._t=setTimeout(render,120);});ro.observe(root.querySelector(".scr"));}
  root.querySelectorAll("[data-f] button").forEach(b=>b.onclick=()=>{filt=b.dataset.k;root.querySelectorAll("[data-f] button").forEach(x=>x.classList.toggle("on",x==b));render();});

  // 그림 목록
  let ah="";["c","o"].forEach(k=>[0,1,2].forEach(t=>{const fee=k=="c"?[50000,100000,200000][t]:[200000,400000,700000][t];
    ah+=`<div class="c"><svg width="120" height="120" viewBox="-60 -100 120 120" style="color:var(--ink)"><g class="hz">${iso({k,cl:k=="c"?"별사탕":"봄출판",fee,done:true},0,0,.85)}</g></svg><span>${["작은","보통","큰"][t]} ${k=="c"?"집":"건물"}</span><em>${k=="c"?["~8만","8~15만","15만~"][t]:["~30만","30~55만","55만~"][t]}</em></div>`;}));

  ah+=cfg.artEx;const _a=root.querySelector("[data-art]");if(_a)_a.innerHTML=ah;
  V.push(v);
}

function Village(){
  const ref=H.useRef(null),comm=H.useStore(x=>x.comm),outs=H.useStore(x=>x.outs),cfg0=H.useStore(x=>x.commCfg),palK=H.useStore(x=>{const S=x.settings||{};return JSON.stringify([S.palKey,S.palCustom,S.palMix,S.palMixOrd,S.palMixPin])});
  const sig=H.useRef("");
  H.useEffect(()=>()=>{const el=ref.current;if(el)el.innerHTML="";sig.current="";closeAll&&closeAll();},[]);
  H.useEffect(()=>{const el=ref.current;if(!el)return;vpApply(el);const J2=build({comm,outs,commCfg:cfg0}),sg=JSON.stringify([J2.map(j=>[j.k,j.cl,j.t,j.fee,j.m,j.d,j.done,j.p,j.pg]),palK]);if(sg===sig.current&&el.firstChild)return;sig.current=sg;vUiInit();V=[];const S0={comm,outs,commCfg:cfg0};CFG.rebuild=()=>{J=build(S0);};J=build(S0);
    el.innerHTML=MARKUP();const root=el;
    mkIso(root,CFG);renderAll();
    if(!J.length)root.querySelector("[data-stat]").innerHTML="<span>올해 끝낸 커미션·외주가 생기면 여기에 집이 지어져요</span>";
    },[comm,outs,cfg0,palK]);
  return H.h("div",{ref,className:"vlg vp"+(MIFFY?" miffy":""),style:{height:"100%",overflow:"hidden"}});
}
const MARKUP=()=>`<div data-main><div class="vhead"><div class="yr"><button data-y="-1">‹</button><h2 data-yt></h2><button data-y="1">›</button></div><div class="fseg vm"><button data-vm="y" class="on">한 해</button><button data-vm="m">한 달</button></div>
        <i class="vsp"></i><div class="fseg" data-f><button class="on" data-k="all">전체</button><button data-k="c">커미션</button><button data-k="o">외주</button></div></div>
      <div class="stat" data-stat></div>
      <div class="desk"><div class="wl" data-wl></div><div class="scr"><div class="board" data-board></div></div>
        <div class="ctl"><button data-night title="밤">☾</button></div><button class="vback" data-back hidden>‹ 한 해 보기</button></div></div>`;
const CFG={depth:8,wip:"접는 중",
  base:(c,d)=>{const o=10;return `<polygon class="shad" points="${P(c.map(p=>[p[0]+o,p[1]+o+d]))}"/><polygon class="sheet2" points="${P([c[3],c[2],[c[2][0],c[2][1]+d],[c[3][0],c[3][1]+d]])}"/><polygon class="sheet2" points="${P([c[2],c[1],[c[1][0],c[1][1]+d],[c[2][0],c[2][1]+d]])}" style="filter:brightness(.93)"/>`;},
  flag:(x,y,m)=>{const w=m>8?48:40,H=34,c=m==CM?" now":"";return [`<g class="mpo${c}"><ellipse cx="${x}" cy="${y}" rx="5" ry="2.5"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y-H}"/></g>`,`<g class="mlg${c}" transform="translate(${x},${y-H})"><line class="mpl" x1="0" y1="0" x2="0" y2="14"/><rect x="0" y="-2" width="${w}" height="24" rx="4"/><text x="${w/2}" y="14.5" text-anchor="middle">${MN[m]}</text></g>`]},
  end:(main,v,btn)=>{const d=main.querySelector(".desk"),on=!d.classList.contains("photo");const f=d.querySelector(".flash");
    if(on){d._z=TW;v.zoom(52);d.querySelector(".scr").scrollTo(0,0);f.classList.remove("go");void f.offsetWidth;f.classList.add("go");d.classList.add("photo");btn.textContent="사진 치우기";say("2026 도시 계획 사진을 앨범에 넣었어요");}else{d.classList.remove("photo");v.zoom(d._z||88);btn.textContent="사진 한 장 찍기";}},
  artEx:""};
DB.skin.screen("comm",Village);
})();
