const $=s=>document.querySelector(s),R=Math.random,cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),rp=(x,a,b)=>cl((x-a)/(b-a));
const M={V:380,I:11.5,sl:.04,Ta:30};
const F={normal:{n:'Normal',r:'Motor beroperasi dalam batas wajar. Lanjutkan pemantauan rutin.'},
overload:{n:'Beban lebih (overload)',r:'Kurangi beban mekanik, cek kopling atau beban yang macet, periksa setelan relai overload.'},
undervolt:{n:'Tegangan turun (undervoltage)',r:'Cek tegangan sumber, ukuran dan panjang kabel, serta sambungan di terminal.'},
unbalance:{n:'Tegangan tidak seimbang',r:'Periksa kekencangan terminal, kontaktor, pembagian beban antar fasa, dan suplai.'},
phaseloss:{n:'Kehilangan fasa (single phasing)',r:'Segera matikan motor. Cek sekring, MCB, kontaktor, dan kabel pada fasa yang arusnya hilang.'},
overheat:{n:'Pendinginan buruk (overheating)',r:'Bersihkan sirip dan kipas pendingin, cek ventilasi dan suhu ruangan.'},
bearing:{n:'Kerusakan bearing',r:'Jadwalkan pelumasan atau penggantian bearing, cek alignment poros.'},
rotor:{n:'Batang rotor patah (broken rotor bar)',r:'Rencanakan uji lanjutan (spektrum arus) dan perbaikan atau penggantian rotor.'}};
$('#ft').innerHTML=Object.entries(F).map(([k,v])=>`<option value="${k}">${v.n}</option>`).join('');
let T=50,Tr=50,S={I:[9,9,9],rip:1},run=1,ph=0,last='',log=[];
function sample(o={}){
 const k=(o.k??+$('#sv').value)/100,f=o.f??$('#ft').value;let L=(o.L??+$('#ld').value)/100,vf=1,vu=0,p3=[1,1,1],cool=1,vib=.4+.3*L,rip=1+R()*.6;
 if(f=='overload')L+=.25+.5*k;
 if(f=='undervolt')vf=1-.25*k;
 if(f=='unbalance')vu=.05*k;
 if(f=='phaseloss')p3=[1+.7*k,1+.7*k,1-k];
 if(f=='overheat')cool=1+1.5*k;
 if(f=='bearing')vib+=5*k;
 if(f=='rotor'){rip+=11*k;vib+=1.2*k}
 const n=()=>1+(R()-.5)*.02,I0=M.I*(.35+.65*L)/vf;
 const I=[I0*(1+4*vu)*p3[0]*n(),I0*(1-5*vu)*p3[1]*n(),I0*(1+vu)*p3[2]*n()];
 const V=[M.V*vf*(1+vu)*n(),M.V*vf*(1-.7*vu)*n(),M.V*vf*(1-.3*vu)*n()];
 const av=a=>a.reduce((p,q)=>p+q)/a.length,un=a=>Math.max(...a.map(v=>Math.abs(v-av(a))))/av(a)*100;
 const Ia=av(I),Iu=un(I),sl=M.sl*L/(vf*vf)*(f=='phaseloss'?1+2*k:1);
 const Te=M.Ta+55*(Ia/M.I)**2+80*Iu/100;T+=(Te+55*(Ia/M.I)**2*(cool-1)-T)*.08+(R()-.5)*.3;Tr+=(Te-Tr)*.08;
 return S={I,V,Ia,Va:av(V),Iu,Vu:un(V),pl:1-Math.min(...I)/Ia,sl:sl*100,rpm:1500*(1-sl),T,vib:vib*(1+(R()-.5)*.1),rip,dT:T-Tr,f};
}
function diag(s){
 const ir=s.Ia/M.I,pl=rp(s.pl,.25,.7),dr=(M.V-s.Va)/M.V*100;
 const sc={
 overload:rp(ir,1,1.25)*.5+rp(s.T,75,100)*.25+rp(s.sl,4.2,7)*.25,
 undervolt:rp(dr,3,12)*.7+rp(s.sl,4.5,7)*.15+rp(ir,1,1.2)*.15,
 unbalance:(rp(s.Vu,1,4)*.6+rp(s.Iu,8,25)*.4)*(1-pl),
 phaseloss:pl*.7+rp(s.Iu,15,40)*.3,
 overheat:(rp(s.dT,5,25)*.65+rp(s.T,70,105)*.35)*(.5+.5*(1-rp(ir,1,1.2)))*(1-pl),
 bearing:rp(s.vib,1.2,4.5)*(1-.5*rp(s.rip,3,8)),
 rotor:rp(s.rip,3,10)*.8+rp(s.vib,.9,2)*.2};
 const top=Object.keys(sc).reduce((a,b)=>sc[a]>=sc[b]?a:b),mx=sc[top];
 return mx<.4?{top:'normal',lv:0,mx,sc}:{top,lv:mx<.7?1:2,mx,sc};
}
const lv=(v,a,b)=>v>b?2:v>a?1:0,COL=['#0f7a55','#a15c00','#c42318'],LN=['Normal','Peringatan','Bahaya'];
function render(s,d){
 const ir=s.Ia/M.I,dr=Math.abs(s.Va-M.V)/M.V*100,f1=v=>v.toFixed(1);
 const C=[['Arus rata-rata',f1(s.Ia),'A',lv(ir,1.1,1.25),'In = 11.5 A'],
 ['Arus tidak seimbang',f1(s.Iu),'%',lv(s.Iu,10,25),s.I.map(f1).join(' / ')+' A'],
 ['Tegangan rata-rata',Math.round(s.Va),'V',lv(dr,5,10),'Tidak seimbang '+f1(s.Vu)+'%'],
 ['Kecepatan',Math.round(s.rpm),'rpm',lv(s.sl,5,7),'Slip '+f1(s.sl)+'%'],
 ['Suhu belitan',f1(s.T),'°C',lv(s.T,90,105),'Batas 105 °C'],
 ['Selisih suhu vs model',f1(s.dT),'°C',lv(s.dT,8,20),'Suhu aktual dikurangi suhu acuan'],
 ['Getaran',s.vib.toFixed(2),'mm/s',lv(s.vib,1.8,4.5),'Acuan ISO 10816 kelas I'],
 ['Ripple arus',f1(s.rip),'%',lv(s.rip,3,7),'Indikasi rotor']];
 $('#cd').innerHTML=C.map(c=>`<div class="c l${c[3]}"><span class="mu">${c[0]}</span><br><b>${c[1]}</b> ${c[2]}<small>${c[4]}</small></div>`).join('');
 $('#bn').style.background=COL[d.lv];
 const pct=Math.round((d.top=='normal'?1-d.mx:d.mx)*100);
 $('#bn').innerHTML=`${LN[d.lv]}, kecocokan ${pct}%<big>${F[d.top].n}</big>${F[d.top].r}`;
 $('#bars').innerHTML=Object.keys(d.sc).map(k=>`<div class="br"><span>${F[k].n.split(' (')[0]}</span><div><i style="width:${d.sc[k]*100}%"></i></div><span>${Math.round(d.sc[k]*100)}%</span></div>`).join('');
 const ev=C.filter(c=>c[3]).map(c=>`<li>${c[0]}: ${c[1]} ${c[2]} (${LN[c[3]].toLowerCase()})</li>`);
 $('#ev').innerHTML=ev.join('')||'<li class="mu">Semua besaran dalam batas normal.</li>';
 const key=d.top+d.lv;
 if(key!=last){last=key;log.unshift(`${new Date().toLocaleTimeString('id-ID')}: ${F[d.top].n} (${LN[d.lv].toLowerCase()})`);log=log.slice(0,8)}
 $('#lg').innerHTML=log.map(x=>`<li>${x}</li>`).join('');
}
function draw(){
 const c=$('#cv'),w=c.width=c.clientWidth,h=c.height=170,x=c.getContext('2d'),t2=performance.now()/1000*2;
 x.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--bd');x.beginPath();x.moveTo(0,h/2);x.lineTo(w,h/2);x.stroke();
 ['#e5484d','#e5a50a','#3b82f6'].forEach((col,k)=>{x.strokeStyle=col;x.lineWidth=2;x.beginPath();
  for(let i=0;i<=w;i+=2){const a=2*Math.PI*(i/w*2)+ph-k*2.0944,y=h/2-S.I[k]*1.414*(1+S.rip/100*3*Math.sin(t2))*Math.sin(a)/40*(h/2-6);i?x.lineTo(i,y):x.moveTo(i,y)}
  x.stroke()});
}
['sv','ld'].forEach(i=>$('#'+i).oninput=e=>$('#'+i+'v').textContent=e.target.value);
$('#pl').onclick=e=>{run=!run;e.target.textContent=run?'Jeda':'Lanjut'};
$('#rs').onclick=()=>{T=Tr=M.Ta+20};
const tick=()=>{if(!run)return;demoStep();const s=sample(),d=diag(s);render(s,d);pushData(s,d)};
let hist=[],rows=[],demo=0,dt=0,n0=0;
const f2=v=>v.toFixed(2);
function pushData(s,d){
 hist.push({a:s.Ia/(M.I*1.25),t:s.T/105,v:s.vib/4.5});hist=hist.slice(-120);
 rows.push([(n0++*.5).toFixed(1),...s.I.map(f2),...s.V.map(f2),Math.round(s.rpm),f2(s.T),f2(s.vib),f2(s.rip),s.f,d.top,d.lv]);rows=rows.slice(-3000);trend()}
function trend(){
 const c=$('#tr'),w=c.width=c.clientWidth,h=c.height=150,x=c.getContext('2d'),Y=v=>h-8-cl(v,0,1.5)*(h-16)/1.5;
 x.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--mu');x.setLineDash([4,4]);x.beginPath();x.moveTo(0,Y(1));x.lineTo(w,Y(1));x.stroke();x.setLineDash([]);
 [['a','#8e4ec6'],['t','#f76b15'],['v','#12a594']].forEach(([k,col])=>{x.strokeStyle=col;x.lineWidth=2;x.beginPath();hist.forEach((p,i)=>{i?x.lineTo(i/119*w,Y(p[k])):x.moveTo(0,Y(p[k]))});x.stroke()})}
function demoStep(){
 if(!demo)return;
 const ks=Object.keys(F).slice(1),n=36,p=dt%n,i=Math.floor(dt/n)%ks.length,k=p<4?0:Math.min(100,Math.round((p-4)/28*100));
 $('#ft').value=p<4?'normal':ks[i];$('#sv').value=k;$('#svv').textContent=k;dt++}
$('#dm').onclick=e=>{demo=!demo;dt=0;e.target.textContent=demo?'Hentikan demo':'Demo otomatis'};
$('#csv').onclick=()=>{const b=new Blob(['detik,Ia,Ib,Ic,Vab,Vbc,Vca,rpm,suhu,getaran,ripple,kondisi,diagnosis,level\n'+rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='data_motor.csv';a.click()};
try{if(top!==self)$('#csv').hidden=true}catch(e){$('#csv').hidden=true}
function selfTest(){
 const ks=Object.keys(F),sv=[T,Tr],m=ks.map(()=>ks.map(()=>0)),cs=[];let ok=0;
 ks.slice(1).forEach(f=>[60,80,100].forEach(k=>[50,70,100].forEach(L=>cs.push([f,k,L]))));
 [30,50,70,90,100].forEach(L=>cs.push(['normal',0,L]));
 cs.forEach(([f,k,L])=>{T=Tr=M.Ta+20;const c={};
  for(let i=0;i<60;i++){const t=diag(sample({f,k,L})).top;if(i>=50)c[t]=(c[t]||0)+1}
  const p=Object.keys(c).sort((a,b)=>c[b]-c[a])[0];m[ks.indexOf(f)][ks.indexOf(p)]++;if(p==f)ok++});
 [T,Tr]=sv;
 const nm=k=>F[k].n.split(' (')[0];
 $('#tres').innerHTML=`<p><b>Akurasi: ${ok} dari ${cs.length} kasus (${Math.round(ok/cs.length*100)}%)</b></p><table><tr><th>Aktual ↓ / Hasil →</th>${ks.map(k=>`<th>${nm(k)}</th>`).join('')}</tr>${ks.map((a,i)=>`<tr><td>${nm(a)}</td>${m[i].map((v,j)=>`<td class="${i==j?'hit':''}">${v||''}</td>`).join('')}</tr>`).join('')}</table>`}
$('#st').onclick=selfTest;
setInterval(tick,500);tick();
(function a(){ph+=.12;draw();requestAnimationFrame(a)})();
