
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

const fb = initializeApp(firebaseConfig);
const db = getFirestore(fb);
const walletRef = doc(db, "wallets", "shared-ne-wallet");

let state = null;
let applyingRemote = false;

const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY"}).format(Number(n)||0);
const net = u => (Number(u?.cash)||0)+(Number(u?.investment)||0)-(Number(u?.debt)||0);
const dateText = s => {
  try { return new Intl.DateTimeFormat("tr-TR",{day:"numeric",month:"short"}).format(new Date(s+"T12:00:00")); }
  catch { return s || ""; }
};
const setText = (id,v) => { const el=$(id); if(el) el.textContent=v; };

function render(){
  if(!state?.balances) return;
  const n = state.balances.nisu || {};
  const e = state.balances.erol || {};
  setText("heroNet", money(net(n)));
  setText("sharedTotal", money(net(n)+net(e)));
  setText("nisuNet", money(net(n)));
  setText("erolNet", money(net(e)));
  setText("nisuCash", money(n.cash));
  setText("nisuInv", money(n.investment));
  setText("nisuDebt", money(n.debt));
  setText("erolCash", money(e.cash));
  setText("erolInv", money(e.investment));
  setText("erolDebt", money(e.debt));
  setText("nisuDebtLarge", money(n.debt));
  setText("erolDebtLarge", money(e.debt));
  setText("nisuInvLarge", money(n.investment));
  setText("erolInvLarge", money(e.investment));
  renderAccounts();
  renderTransactions();
}

function renderAccounts(){
  const nbox = $("nisuAccounts"), ebox = $("erolAccounts");
  if(nbox) nbox.innerHTML="";
  if(ebox) ebox.innerHTML="";
  (state.accounts||[]).forEach(a=>{
    const box = a.owner==="erol" ? ebox : nbox;
    if(!box) return;
    const row=document.createElement("div");
    row.className="account-row";
    row.innerHTML=`<span>${a.name}</span><strong>${money(a.balance)}</strong><small>düzenle &nbsp; sil</small>`;
    box.appendChild(row);
  });
}

function txHTML(t){
  const emoji = state.categoryEmoji?.[t.category] || "✨";
  return `<div class="record-emoji">${emoji}</div>
  <div class="record-main"><b>${t.merchant||""}</b><small>${t.owner==="erol"?"Erol":"Nisu"} · ${t.category||"diğer"} · ${dateText(t.date)}${t.account?` · ${t.account}`:""}</small></div>
  <div class="record-amount">-${money(t.amount)}</div>`;
}
function renderTransactions(){
  const arr=[...(state.transactions||[])].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  ["transactions","allTransactions"].forEach(id=>{
    const box=$(id); if(!box) return; box.innerHTML="";
    if(!arr.length){ box.innerHTML='<div style="padding:28px 0;color:#82908a">henüz harcama yok</div>'; return; }
    arr.forEach(t=>{ const row=document.createElement("div"); row.className="record"; row.innerHTML=txHTML(t); box.appendChild(row); });
  });
}

async function persist(){
  localStorage.setItem("ne-wallet-state",JSON.stringify(state));
  if(applyingRemote) return;
  try { await setDoc(walletRef,{...state,updatedAt:new Date().toISOString()}); }
  catch(e){ console.warn("Firebase yazma:",e); }
}

async function load(){
  const base=await fetch("./data.json",{cache:"no-store"}).then(r=>r.json());
  let local=null;
  try{ local=JSON.parse(localStorage.getItem("ne-wallet-state")||"null"); }catch{}
  state=local||base;
  render();

  try{
    const snap=await getDoc(walletRef);
    if(snap.exists()){
      applyingRemote=true;
      state=snap.data();
      localStorage.setItem("ne-wallet-state",JSON.stringify(state));
      applyingRemote=false;
      render();
    }else{
      await setDoc(walletRef,{...state,updatedAt:new Date().toISOString()});
    }
    onSnapshot(walletRef,s=>{
      if(!s.exists()) return;
      applyingRemote=true;
      state=s.data();
      localStorage.setItem("ne-wallet-state",JSON.stringify(state));
      applyingRemote=false;
      render();
    },e=>console.warn("Firebase dinleme:",e));
  }catch(e){
    console.warn("Firebase bağlanamadı, yerel mod:",e);
  }
}

function selectTab(name){
  document.querySelectorAll(".wallet-tab-list button").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
  document.querySelectorAll(".tab-body").forEach(p=>p.classList.toggle("active",p.dataset.panel===name));
}
document.querySelectorAll(".wallet-tab-list button").forEach(b=>b.addEventListener("click",()=>selectTab(b.dataset.tab)));
document.querySelectorAll(".quick-actions button").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll(".quick-actions button").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  if(b.dataset.action==="harcama") openModal();
  if(b.dataset.action==="param") selectTab("durum");
  if(b.dataset.action==="borcum") selectTab("borclar");
  if(b.dataset.action==="yatirim") selectTab("yatirimlar");
}));

function openModal(){ $("expenseModal")?.classList.add("open"); }
function closeModal(){ $("expenseModal")?.classList.remove("open"); }
async function addExpense(ev){
  ev.preventDefault();
  const f=new FormData(ev.target);
  state.transactions=state.transactions||[];
  state.transactions.push({
    id:Date.now(), owner:f.get("owner"), merchant:f.get("merchant"),
    amount:Number(f.get("amount")), category:f.get("category"),
    account:f.get("account"), date:f.get("date")
  });
  await persist(); render(); closeModal(); ev.target.reset();
}
async function editDebt(user){
  const cur=state?.balances?.[user]?.debt ?? 0;
  const v=prompt(`${user==="nisu"?"Nisu":"Erol"} toplam borcu`, String(cur).replace(".",","));
  if(v===null) return;
  const n=Number(String(v).replace(/\./g,"").replace(",","."));
  if(!Number.isFinite(n)) return alert("Geçerli bir tutar gir.");
  state.balances[user].debt=n;
  await persist();
  render();
}

window.openModal=openModal;
window.closeModal=closeModal;
window.addExpense=addExpense;
window.editDebt=editDebt;
window.addEventListener("DOMContentLoaded",load);
