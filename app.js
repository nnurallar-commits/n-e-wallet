
let state=null;
const money=n=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(n);
const fmtDate=s=>new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'short'}).format(new Date(s+'T12:00:00'));
const byId=id=>document.getElementById(id);
const save=()=>localStorage.setItem('ne-wallet-state',JSON.stringify(state));

async function load(){
 const base=await fetch('data.json').then(r=>r.json());
 state=JSON.parse(localStorage.getItem('ne-wallet-state')||'null')||base;
 applyPrefs(); render();
}
function net(u){return u.cash+u.investment-u.debt}
function applyPrefs(){
 document.body.classList.toggle('dark',localStorage.getItem('ne-dark')==='1');
 const c=localStorage.getItem('ne-accent')||state.pastels[0];
 document.documentElement.style.setProperty('--accent',c);
}
function toggleDark(){localStorage.setItem('ne-dark',document.body.classList.contains('dark')?'0':'1');applyPrefs()}
function setAccent(c){localStorage.setItem('ne-accent',c);applyPrefs();renderPalette()}
function render(){
 const n=state.balances.nisu,e=state.balances.erol;
 byId('combined').textContent=money(net(n)+net(e));
 byId('nisuNet').textContent=money(net(n)); byId('erolNet').textContent=money(net(e));
 ['nisu','erol'].forEach(id=>{
   const b=state.balances[id];
   byId(id+'Cash').textContent=money(b.cash);
   byId(id+'Inv').textContent=money(b.investment);
   byId(id+'Debt').textContent=money(b.debt);
 });
 renderAccounts();renderTx();renderChart();renderPalette();
}
function renderAccounts(){
 const box=byId('accounts');box.innerHTML='';
 state.accounts.forEach(a=>{
  const d=document.createElement('div');d.className='account';
  d.innerHTML=`<span>${a.name}</span><b>${money(a.balance)}</b>`;
  box.appendChild(d);
 });
}
function renderTx(){
 const box=byId('transactions');box.innerHTML='';
 [...state.transactions].sort((a,b)=>b.date.localeCompare(a.date)).forEach(t=>{
   const d=document.createElement('div');d.className='tx';
   d.innerHTML=`<div class="emoji">${state.categoryEmoji[t.category]||'✨'}</div>
   <div><b>${t.merchant}</b><br><small>${t.owner==='nisu'?'Nisu':'Erol'} · ${t.category} · ${fmtDate(t.date)} · ${t.account}</small></div>
   <div class="amount">-${money(t.amount)}</div>`;
   box.appendChild(d);
 });
}
function chartData(){
 const m={};state.transactions.forEach(t=>m[t.category]=(m[t.category]||0)+t.amount);
 return Object.entries(m).sort((a,b)=>b[1]-a[1]);
}
function renderChart(){
 const arr=chartData(), total=arr.reduce((s,x)=>s+x[1],0);
 const colors=['#B7C9B0','#D9B8AF','#C8C0DB','#D8C79E','#AFC6CC','#DABFD0','#C9D4AE','#D8BDA9'];
 let cursor=0,parts=[];
 arr.forEach(([k,v],i)=>{const a=cursor/total*360;cursor+=v;const b=cursor/total*360;parts.push(`${colors[i%colors.length]} ${a}deg ${b}deg`)});
 byId('pie').style.background=`conic-gradient(${parts.join(',')})`;
 byId('legend').innerHTML=arr.map(([k,v],i)=>`<div class="legend-row"><span class="dot" style="background:${colors[i%colors.length]}"></span><span>${state.categoryEmoji[k]||'✨'} ${k}</span><b>${money(v)}</b></div>`).join('');
}
function renderPalette(){
 const c=localStorage.getItem('ne-accent')||state.pastels[0];
 byId('palette').innerHTML=state.pastels.map(x=>`<button class="swatch ${x===c?'active':''}" aria-label="${x}" style="background:${x}" onclick="setAccent('${x}')"></button>`).join('');
}
function openModal(){byId('modal').classList.add('open')}
function closeModal(){byId('modal').classList.remove('open')}
function addTx(ev){
 ev.preventDefault();
 const f=new FormData(ev.target);
 state.transactions.push({id:Date.now(),owner:f.get('owner'),merchant:f.get('merchant'),account:f.get('account'),category:f.get('category'),date:f.get('date'),amount:Number(f.get('amount'))});
 save();closeModal();render();ev.target.reset();
}
function editDebt(user){
 const cur=state.balances[user].debt;
 const v=prompt(`${user==='nisu'?'Nisu':'Erol'} toplam borcu`,String(cur).replace('.',','));
 if(v===null)return;
 const n=Number(v.replace(/\./g,'').replace(',','.'));
 if(!Number.isFinite(n))return alert('Geçerli bir tutar gir.');
 state.balances[user].debt=n;save();render();
}
window.addEventListener('DOMContentLoaded',load);
