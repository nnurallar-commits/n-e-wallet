
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDzpJvxluGEoBDLXX9MioPnp7UpJ4ofJ2A",
  authDomain: "ne-wallet-web.firebaseapp.com",
  projectId: "ne-wallet-web",
  storageBucket: "ne-wallet-web.firebasestorage.app",
  messagingSenderId: "292475418110",
  appId: "1:292475418110:web:2c4339454587c578433caf",
  measurementId: "G-M8NWL4F77L"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const walletRef = doc(db, "wallets", "shared-ne-wallet");
let state=null;
let applyingRemote=false;

const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(n)||0);
const fmtDate=s=>new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'short'}).format(new Date(s+'T12:00:00'));
const byId=id=>document.getElementById(id);
const net=u=>(Number(u.cash)||0)+(Number(u.investment)||0)-(Number(u.debt)||0);

async function persist(){
  localStorage.setItem('ne-wallet-state',JSON.stringify(state));
  if(applyingRemote) return;
  try{
    await setDoc(walletRef,{...state,updatedAt:new Date().toISOString()});
    setSync("senkronize ✓");
  }catch(e){
    console.error(e);
    setSync("yerelde kayıtlı • firebase izni gerekli");
  }
}
function setSync(t){ const el=byId("syncStatus"); if(el) el.textContent=t; }

async function load(){
  const base=await fetch('data.json').then(r=>r.json());
  const local=JSON.parse(localStorage.getItem('ne-wallet-state')||'null');
  state=local||base;
  applyPrefs(); render();

  try{
    const snap=await getDoc(walletRef);
    if(snap.exists()){
      applyingRemote=true;
      state=snap.data();
      localStorage.setItem('ne-wallet-state',JSON.stringify(state));
      applyingRemote=false;
      render(); setSync("firebase bağlı ✓");
    }else{
      await setDoc(walletRef,{...state,updatedAt:new Date().toISOString()});
      setSync("firebase bağlı ✓");
    }

    onSnapshot(walletRef,(snap)=>{
      if(!snap.exists()) return;
      applyingRemote=true;
      state=snap.data();
      localStorage.setItem('ne-wallet-state',JSON.stringify(state));
      applyingRemote=false;
      render(); setSync("canlı senkronizasyon ✓");
    },()=>setSync("firebase okuma izni gerekli"));
  }catch(e){
    console.error(e); setSync("yerel mod • firestore'u aç");
  }
}
function applyPrefs(){
 document.body.classList.toggle('dark',localStorage.getItem('ne-dark')==='1');
 const c=localStorage.getItem('ne-accent')||(state?.pastels?.[0]||'#DCE8D5');
 document.documentElement.style.setProperty('--accent',c);
}
function toggleDark(){localStorage.setItem('ne-dark',document.body.classList.contains('dark')?'0':'1');applyPrefs()}
function setAccent(c){localStorage.setItem('ne-accent',c);applyPrefs()}
function render(){
 if(!state) return;
 const n=state.balances.nisu,e=state.balances.erol;
 byId('combined').textContent=money(net(n)+net(e));
 byId('nisuNet').textContent=money(net(n)); byId('nisuNetCard').textContent=money(net(n)); byId('erolNet').textContent=money(net(e));
 ['nisu','erol'].forEach(id=>{
   const b=state.balances[id];
   byId(id+'Cash').textContent=money(b.cash);
   byId(id+'Inv').textContent=money(b.investment);
   byId(id+'Debt').textContent=money(b.debt);
 });
 renderAccounts();renderTx();
}
function renderAccounts(){
 const box=byId('accounts');box.innerHTML='';
 (state.accounts||[]).forEach(a=>{
  const d=document.createElement('div');d.className='account';
  d.innerHTML=`<span>${a.name.toLowerCase()}</span><b>${money(a.balance)}</b><div class="account-actions">${a.name.toLowerCase()} &nbsp; düzenle &nbsp; sil</div>`;
  box.appendChild(d);
 });
}
function renderTx(){
 const box=byId('transactions');box.innerHTML='';
 [...(state.transactions||[])].sort((a,b)=>b.date.localeCompare(a.date)).forEach(t=>{
   const d=document.createElement('div');d.className='tx';
   d.innerHTML=`<div class="emoji">${state.categoryEmoji[t.category]||'✨'}</div>
   <div><b>${t.merchant}</b><br><small>${t.owner==='nisu'?'Nisu':'Erol'} · ${t.category} · ${fmtDate(t.date)} · ${t.account}</small></div>
   <div class="amount">-${money(t.amount)}</div>`;
   box.appendChild(d);
 });
}
function chartData(){
 const m={};(state.transactions||[]).forEach(t=>m[t.category]=(m[t.category]||0)+Number(t.amount||0));
 return Object.entries(m).sort((a,b)=>b[1]-a[1]);
}
function renderChart(){
 const arr=chartData(), total=arr.reduce((s,x)=>s+x[1],0);
 const colors=['#B7C9B0','#D9B8AF','#C8C0DB','#D8C79E','#AFC6CC','#DABFD0','#C9D4AE','#D8BDA9'];
 let cursor=0,parts=[];
 if(total){arr.forEach(([k,v],i)=>{const a=cursor/total*360;cursor+=v;const b=cursor/total*360;parts.push(`${colors[i%colors.length]} ${a}deg ${b}deg`)})}
 byId('pie').style.background=total?`conic-gradient(${parts.join(',')})`:'#e7e7de';
 byId('legend').innerHTML=arr.map(([k,v],i)=>`<div class="legend-row"><span class="dot" style="background:${colors[i%colors.length]}"></span><span>${state.categoryEmoji[k]||'✨'} ${k}</span><b>${money(v)}</b></div>`).join('');
}
function renderPalette(){
 const c=localStorage.getItem('ne-accent')||state.pastels[0];
 byId('palette').innerHTML=state.pastels.map(x=>`<button class="swatch ${x===c?'active':''}" aria-label="${x}" style="background:${x}" data-accent="${x}"></button>`).join('');
 document.querySelectorAll('[data-accent]').forEach(b=>b.onclick=()=>setAccent(b.dataset.accent));
}
function openModal(){byId('modal').classList.add('open')}
function closeModal(){byId('modal').classList.remove('open')}
async function addTx(ev){
 ev.preventDefault();
 const f=new FormData(ev.target);
 state.transactions.push({id:Date.now(),owner:f.get('owner'),merchant:f.get('merchant'),account:f.get('account'),category:f.get('category'),date:f.get('date'),amount:Number(f.get('amount'))});
 await persist();closeModal();render();ev.target.reset();
}
async function editDebt(user){
 const cur=state.balances[user].debt;
 const v=prompt(`${user==='nisu'?'Nisu':'Erol'} toplam borcu`,String(cur).replace('.',','));
 if(v===null)return;
 const n=Number(v.replace(/\./g,'').replace(',','.'));
 if(!Number.isFinite(n))return alert('Geçerli bir tutar gir.');
 state.balances[user].debt=n;await persist();render();
}
window.toggleDark=toggleDark;window.openModal=openModal;window.closeModal=closeModal;window.addTx=addTx;window.editDebt=editDebt;
window.addEventListener('DOMContentLoaded',load);
