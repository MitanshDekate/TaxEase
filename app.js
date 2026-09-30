'use strict';
/* Tax rules for FY 2026-27. Edit this block when slabs change. */
const CFG={
  std:{new:75000,old:50000},
  new:{name:'New regime',slabs:[[4e5,0],[8e5,.05],[12e5,.10],[16e5,.15],[2e6,.20],[24e5,.25],[Infinity,.30]],limit:12e5,rebate:6e4,maxSur:.25},
  old:{name:'Old regime',slabs:[[25e4,0],[5e5,.05],[1e6,.20],[Infinity,.30]],limit:5e5,rebate:12500,maxSur:.37}
};
const SURCHARGE=[[5e6,.10],[1e7,.15],[2e7,.25],[5e7,.37]];
const CESS=.04;
const GROUPS=[
 {title:'Income',note:'Annual amounts in rupees.',items:[
  {id:'salary',label:'Salary',hint:'Gross annual salary before tax'},
  {id:'other',label:'Other income',hint:'Interest, rent, freelance'}]},
 {title:'Investments',note:'Counted under the old regime only.',items:[
  {id:'c80',label:'Section 80C',hint:'EPF, PPF, ELSS, life insurance',cap:15e4},
  {id:'nps',label:'NPS, section 80CCD(1B)',hint:'Additional contribution',cap:5e4}]},
 {title:'Deductions',note:'Counted under the old regime only.',items:[
  {id:'hlt',label:'Health insurance, 80D',hint:'Premium for self and family',cap:25e3},
  {id:'home',label:'Home loan interest',hint:'Self-occupied property',cap:2e5},
  {id:'hra',label:'HRA exemption',hint:'As worked out for your payslip'},
  {id:'oth',label:'Other deductions',hint:'80E, 80G and similar'}]}];
const ITEMS=GROUPS.flatMap(g=>g.items);
const INR=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Math.round(n));
const PCT=r=>+(r*100).toFixed(1)+'%';
const $=id=>document.getElementById(id);
let view=null;

$('f').innerHTML=GROUPS.map(g=>`<section class="group"><h2>${g.title}</h2><div class="list">${g.items.map(i=>
 `<div class="row"><label for="${i.id}">${i.label}<small>${i.hint}</small></label><div class="field" id="${i.id}-f"><span aria-hidden="true">₹</span><input id="${i.id}" inputmode="numeric" maxlength="12" placeholder="0" aria-describedby="${i.id}-m"></div><p class="msg" id="${i.id}-m"></p></div>`).join('')}</div><p class="note">${g.note}</p></section>`).join('');

const num=id=>+($(id).value.replace(/\D/g,''))||0;

function calc(k,v){
  const c=CFG[k],gross=v.salary+v.other,std=Math.min(v.salary,CFG.std[k]);
  const lines=[['Gross income',gross],['Standard deduction',-std]];let ded=std;
  if(k==='old')ITEMS.slice(2).forEach(i=>{const a=Math.min(v[i.id],i.cap||Infinity);if(a>0){lines.push([i.label,-a]);ded+=a}});
  const taxable=Math.max(0,gross-ded);let lo=0;
  const rows=c.slabs.map(([hi,r])=>{const amt=Math.max(0,Math.min(taxable,hi)-lo),row={lo,hi,r,amt,tax:amt*r};lo=hi;return row});
  const base=rows.reduce((s,r)=>s+r.tax,0);
  let rebate=0;
  if(taxable<=c.limit)rebate=Math.min(base,c.rebate);
  else if(k==='new')rebate=Math.max(0,base-(taxable-c.limit));
  const net=base-rebate,sr=Math.min(c.maxSur,(SURCHARGE.filter(([t])=>taxable>t).pop()||[0,0])[1]);
  const sur=net*sr,cess=(net+sur)*CESS;
  return{k,c,lines,gross,ded,taxable,rows,base,rebate,sur,sr,cess,total:Math.round(net+sur+cess)};
}

function render(r,best,other){
  const pct=x=>Math.max(0,x/r.gross*100).toFixed(2);
  const top=[...r.rows].reverse().find(x=>x.amt>0);
  const diff=Math.abs(r.total-other.total);
  const why=r.taxable===0?'Your taxable income is zero, so no tax is due.'
   :r.total===0?`Your taxable income of ${INR(r.taxable)} is within the rebate limit of ${INR(r.c.limit)}, so the rebate cancels the slab tax.`
   :`Your taxable income of ${INR(r.taxable)} reaches the ${PCT(top.r)} band. Only the part of income inside each band is taxed at that band's rate.`;
  return `<div class="card"><div class="seg" role="tablist" aria-label="Tax regime">${['new','old'].map(k=>`<button role="tab" data-k="${k}" aria-selected="${k===r.k}">${CFG[k].name}</button>`).join('')}</div>
  <p class="kicker">Estimated tax, ${r.c.name.toLowerCase()}</p><p class="big">${INR(r.total)}</p>
  <p class="sub">${INR(r.total/12)} a month · ${PCT(r.total/r.gross)} of gross income</p>
  <p class="verdict">${diff?`${CFG[best].name} is cheaper by ${INR(diff)}.`:'Both regimes cost the same.'}</p>
  <div class="split" role="img" aria-label="Share of income: deductions ${pct(r.ded)}%, tax ${pct(r.total)}%"><i style="width:${pct(r.ded)}%;background:var(--tint);opacity:.35"></i><i style="width:${pct(r.total)}%;background:var(--tint)"></i><i style="flex:1"></i></div>
  <div class="legend"><span><b style="background:var(--tint);opacity:.35"></b>Deductions</span><span><b style="background:var(--tint)"></b>Tax</span><span><b style="background:var(--fill)"></b>Take-home</span></div>
  <h3>Taxable income</h3><dl>${r.lines.map(([l,a])=>`<div class="ln"><dt>${l}</dt><dd>${a<0?'−':''}${INR(Math.abs(a))}</dd></div>`).join('')}<div class="ln sum"><dt>Taxable income</dt><dd>${INR(r.taxable)}</dd></div></dl>
  <h3>Tax by slab</h3><table><thead><tr><th>Band</th><th>Rate</th><th>Income</th><th>Tax</th></tr></thead><tbody>${r.rows.map(x=>`<tr class="${x.amt?'':'off'}"><td>${x.hi===Infinity?'Above '+INR(x.lo):INR(x.lo)+' – '+INR(x.hi)}</td><td>${PCT(x.r)}</td><td>${INR(x.amt)}</td><td>${INR(x.tax)}</td></tr>`).join('')}</tbody></table>
  <h3>Final amount</h3><dl><div class="ln"><dt>Tax on slabs</dt><dd>${INR(r.base)}</dd></div>${r.rebate?`<div class="ln"><dt>Rebate, section 87A</dt><dd>−${INR(r.rebate)}</dd></div>`:''}${r.sur?`<div class="ln"><dt>Surcharge (${PCT(r.sr)})</dt><dd>${INR(r.sur)}</dd></div>`:''}<div class="ln"><dt>Health and education cess (4%)</dt><dd>${INR(r.cess)}</dd></div><div class="ln sum"><dt>Total tax</dt><dd>${INR(r.total)}</dd></div></dl>
  <p class="why">${why}</p></div>`;
}

function update(){
  const v=Object.fromEntries(ITEMS.map(i=>[i.id,num(i.id)]));
  ITEMS.forEach(i=>{const m=$(i.id+'-m');if(i.cap&&v[i.id]>i.cap&&!m.classList.contains('err'))m.textContent=`Only ${INR(i.cap)} counts toward this limit.`;else if(!m.classList.contains('err'))m.textContent=''});
  if(!v.salary&&!v.other){$('out').innerHTML='<div class="card empty"><h2>Your estimate appears here</h2><p>Enter your salary or other income to compare both regimes.</p></div>';return}
  const R={new:calc('new',v),old:calc('old',v)},best=R.new.total<=R.old.total?'new':'old',k=view||best;
  $('out').innerHTML=render(R[k],best,R[k==='new'?'old':'new']);
}

$('f').addEventListener('input',e=>{
  const el=e.target,m=$(el.id+'-m'),bad=/[^\d,\s₹]/.test(el.value);
  if(bad)el.value=el.value.replace(/[^\d]/g,'');
  m.classList.toggle('err',bad);m.textContent=bad?'Use numbers only.':'';
  $(el.id+'-f').classList.toggle('bad',bad);update();
});
$('f').addEventListener('focusin',e=>{if(e.target.tagName==='INPUT')e.target.value=e.target.value.replace(/\D/g,'')});
$('f').addEventListener('focusout',e=>{const el=e.target;if(el.tagName!=='INPUT')return;const n=num(el.id);el.value=n?n.toLocaleString('en-IN'):'';
  $(el.id+'-m').classList.remove('err');$(el.id+'-f').classList.remove('bad');update()});
$('out').addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(b){view=b.dataset.k;update()}});
update();
