/* DUNCAN'S MESS UP FESS UP FLIGHT 2: Wings of Grace — a Book of Heaven Studios game (Vol 2). Built on kit.js. */
(function(){'use strict';
const {X}=K;const clamp=K.clamp,lerp=K.lerp,rand=K.rand,TAU=Math.PI*2;
K.FONT='"Lilita One","Arial Rounded MT Bold",system-ui,sans-serif';
const SAVEK='duncan-flight-2-save-v1';
const save=K.load(SAVEK,{stars:{},unlocked:1,best:0,muted:false,seenIntro:false,doves:0});
K.au.muted=save.muted;const persist=()=>K.store(SAVEK,save);
const QA=/[?&]qa=1/.test(location.search);
/* ---------- worlds & levels ---------- */
const WORLDS=[
 {n:'Courthouse Clouds',img:'bg1',ob:'books',tint:'#ffe7b0',acc:'#f5c518',key:60,bpm:104,seed:7,boss:'Captain Rulebook'},
 {n:'Commandment Canyon',img:'bg2',ob:'tablets',tint:'#ffd0a0',acc:'#ff9a3c',key:62,bpm:110,seed:19,boss:'The Tablet Titan'},
 {n:'Town of Red Tape',img:'bg3',ob:'tape',tint:'#c8d4ff',acc:'#ff4a5a',key:57,bpm:98,seed:31,boss:'Red Tape Rita'},
 {n:'Storm of Guilt',img:'bg4',ob:'storm',tint:'#b8a8ff',acc:'#b07cff',key:55,bpm:118,seed:43,boss:'Old Thunder Guilt'},
 {n:'The Pearly Gates',img:'bg5',ob:'gold',tint:'#fff3c4',acc:'#ffd700',key:64,bpm:100,seed:59,boss:'The Grand Gavel'}];
const LBL=['LAW','RULES','Thou Shalt...','Statute','Code','Decree','Edict','Ordinance','Bylaws','Thou Shalt Not'];
const BCOL=['#7a2e2e','#2e4a7a','#3d6b3a','#6b4a2a','#4a2e6b','#6b2e55'];
const TIPS=['Tap anywhere to flap. Little taps, little hops!','Some rules wiggle! Wait for the gap to come to you.','Rolled-up rule scrolls fly in fast. Watch for the ! sign.','Thunder clouds drift up and down. Stay calm and glide.','Everything at once. You can do it, Duncan!'];
const LEVELS=[];WORLDS.forEach((w,wi)=>{for(let li=0;li<6;li++){const boss=li===5;
 LEVELS.push({i:wi*6+li,w:wi,li,boss,label:(wi+1)+'-'+(li+1),gates:boss?0:8+li*2+wi*2,gap:232-wi*11-li*4,move:wi>=1?Math.min(.65,.18+wi*.12+li*.03):0,
  proj:wi>=2?(wi-1)*2+li:0,clouds:wi>=3?2+li+(wi-3)*2:0,spd:165+wi*13+li*3,hp:3+wi,name:boss?'BOSS: '+w.boss:w.n+' '+(li+1)})}});
const SONGS=WORLDS.map(w=>K.compose(w.seed,{key:w.key,bpm:w.bpm,drum:'half',wave:{lead:'triangle',bass:'sine'},scale:[0,2,4,7,9,12,14,16]}));
const SONG_T=K.compose(3,{key:60,bpm:92,drum:'half',wave:{lead:'triangle',bass:'sine'},scale:[0,2,4,7,9,12,14,16]});
const SONG_B=K.compose(77,{key:57,bpm:132,drum:'four',wave:{lead:'square',bass:'triangle'},scale:[0,2,3,7,8,12,14,15]});
/* ---------- audio ---------- */
const AU=K.au;Object.assign(K.SFX,{
 flap(){AU.noise(.09,.07,1400,'bandpass');AU.tone(520,.06,'sine',.05,700)},
 dove(){AU.tone(1320,.06,'sine',.09,1760);AU.tone(1760,.08,'sine',.07,2100,.06)},
 pass(){AU.tone(784,.1,'triangle',.06,null);AU.tone(1047,.12,'triangle',.05,null,.05)},
 hit(){AU.tone(180,.25,'sawtooth',.14,60);AU.noise(.2,.18,600)},
 choir(){[523,659,784,1047].forEach((f,i)=>{AU.tone(f,1.1,'sine',.05,null,i*.04);AU.tone(f*1.005,1.1,'triangle',.025,null,i*.04)})},
 shield(){AU.tone(660,.25,'sine',.1,1320)},
 page(){[523,659,784,1047,1319,1568].forEach((f,i)=>AU.tone(f,.18,'triangle',.09,null,i*.07))},
 beam(){AU.tone(300,.35,'sawtooth',.08,1500);AU.noise(.3,.08,5000,'highpass')},
 bosshit(){AU.tone(140,.3,'square',.12,50);AU.noise(.25,.14,900)},
 warn(){AU.tone(990,.06,'square',.05);AU.tone(990,.06,'square',.05,null,.12)},
 star(){AU.tone(1047,.12,'square',.08,1568)}});
/* ---------- helpers ---------- */
let RT=0;const S=()=>K.H/720;
function rng(seed){let r=seed>>>0;return()=>{r=(r*1664525+1013904223)>>>0;return r/4294967296}}
function bg(wi,pan){const w=WORLDS[wi%5];if(!K.cover(w.img,{zoom:1.06,px:pan||0})){X.fillStyle='#7fb3ff';X.fillRect(0,0,K.W,K.H)}}
const CL=[];for(let i=0;i<9;i++)CL.push({x:Math.random(),y:Math.random()*.7,s:.5+Math.random()*.9,d:.3+Math.random()*.7});
function clouds(off,a,col){const W=K.W,H=K.H,s=S();X.fillStyle=col||'rgba(255,255,255,'+(a||.55)+')';for(const c of CL){let cx=((c.x*W*1.4-off*c.d*.35)%(W*1.4)+W*1.4)%(W*1.4)-W*.2,cy=c.y*H,r=26*s*c.s;
 X.beginPath();for(let i=0;i<4;i++)X.arc(cx+i*r*.8,cy+(i%2)*r*.3,r,0,TAU);X.fill()}}
function floor(off,wi){const W=K.W,H=K.H,s=S();const col=wi===3?'rgba(70,60,120,.95)':wi===2?'rgba(150,160,190,.95)':'rgba(255,255,255,.96)';X.fillStyle=col;
 const r=34*s;const o=((off)%(r*1.5)+r*1.5)%(r*1.5);X.beginPath();X.moveTo(0,H);for(let x=-o;x<W+r*2;x+=r*1.5){X.arc(x,H-12*s+Math.sin(x*.05)*4*s,r,Math.PI,0)}X.lineTo(W,H);X.closePath();X.fill()}
/* ---------- Duncan (jointed rig) ---------- */
function drawDuncan(px,py,sc,o){o=o||{};const s=sc;X.save();X.translate(px,py);X.rotate(o.tilt||0);if(o.alpha!=null)X.globalAlpha=o.alpha;
 const R=(c,l,tp,w,h)=>{X.fillStyle=c;X.fillRect(l*s,tp*s,w*s,h*s)},poly=(c,p)=>{X.fillStyle=c;X.beginPath();X.moveTo(p[0]*s,p[1]*s);for(let i=2;i<p.length;i+=2)X.lineTo(p[i]*s,p[i+1]*s);X.closePath();X.fill()},
 dot=(c,cx,cy,r)=>{X.fillStyle=c;X.beginPath();X.arc(cx*s,cy*s,r*s,0,TAU);X.fill()},
 tartan=(p,l,tp,w,h)=>{X.save();poly('#1f4a3c',p);X.clip();for(let i=l;i<l+w;i+=4)R('rgba(20,28,60,.85)',i,tp,1.8,h);for(let j=tp;j<tp+h;j+=4)R('rgba(20,28,60,.6)',l,j,w,1.8);
  for(let i=l+2.6;i<l+w;i+=4)R('rgba(0,0,0,.55)',i,tp,.45,h);for(let j=tp+2.6;j<tp+h;j+=4)R('rgba(0,0,0,.45)',l,j,w,.45);X.restore()};
 const wing=o.wing==null?.3:o.wing; // wing elevation (rad): + up, - down
 // wings (behind)
 X.fillStyle='#fff';X.strokeStyle='#d8e4ff';X.lineWidth=2*s;
 for(const d of[-1,1]){X.save();X.translate(d*6*s,-1*s);X.rotate(-d*wing);X.beginPath();X.ellipse(d*15*s,0,17*s,7.5*s,0,0,TAU);X.fill();X.stroke();
  X.strokeStyle='#e4ecff';X.lineWidth=1.2*s;for(const k of[.35,.6,.85]){X.beginPath();X.moveTo(d*k*30*s,-3*s);X.lineTo(d*k*30*s+d*3*s,4*s);X.stroke()}X.restore()}
 // legs (behind kilt): hip -> knee -> ankle, knees bend backward
 const lp=o.legs||[{hip:.2,knee:.4},{hip:-.1,knee:.7}];
 for(let i=0;i<2;i++){const L=lp[i];K.limb((i?2.6:-2.6)*s,20*s,L.hip,6.2*s,L.knee,6*s,4.4*s,i?'#24242c':'#1c1c22',1,-1,(ex,ey,a2)=>{X.save();X.translate(ex,ey);X.rotate(-a2);X.fillStyle='#000';X.beginPath();X.ellipse(1.6*s,.6*s,3.4*s,1.7*s,0,0,TAU);X.fill();X.restore()})}
 // jacket
 poly('#15151b',[-11,0,11,0,13,24,-13,24]);
 // arms: shoulder -> elbow -> hand, elbows flex one way
 const ap=o.arms||[{sh:.5,el:.4},{sh:.5,el:.4}];
 for(let i=0;i<2;i++){const d=i?1:-1,A=ap[i];const f=o.armF||d;K.limb(d*9*s,2*s,A.sh,8*s,A.el,7*s,5*s,'#15151b',f,1,(ex,ey,a2)=>{X.strokeStyle='#fff';X.lineWidth=4.6*s;X.lineCap='butt';X.beginPath();
  X.moveTo(ex-Math.sin(a2)*f*1.2*s,ey-Math.cos(a2)*1.2*s);X.lineTo(ex,ey);X.stroke();X.fillStyle='#f2c9a8';X.beginPath();X.arc(ex+Math.sin(a2)*f*2.2*s,ey+Math.cos(a2)*2.2*s,2.6*s,0,TAU);X.fill()})}
 poly('#fff',[-5,0,5,0,0,10]);dot('#222',0,4.2,.5);dot('#222',0,6.6,.5);
 tartan([-5.5,6,-2,6,0,10,2,6,5.5,6,5,13,-5,13],-6,5,12,9);
 poly('#2a2a33',[-5,0,-1.5,6,-5.5,6]);poly('#2a2a33',[5,0,1.5,6,5.5,6]);
 poly('#000',[0,1.2,-3.6,-.6,-3.6,3,0,1.2]);poly('#000',[0,1.2,3.6,-.6,3.6,3,0,1.2]);dot('#000',0,1.2,1);
 for(const[u,v]of[[-1,-.6],[1,-.6],[-1,.8],[1,.8],[0,1.2]])dot('#e3e6ea',7+u*.9,3.4+v*.9,1.3);dot('#fff',7,3.2,1.2);poly('#4b7a3a',[5.4,5,6.2,4.6,5.2,6.2]);
 tartan([-8.5,12.5,8.5,12.5,10.5,22.5,-10.5,22.5],-11,12,22,11);
 X.strokeStyle='rgba(0,0,0,.35)';X.lineWidth=.5*s;for(const k of[-6,-3,0,3,6]){X.beginPath();X.moveTo(k*s,14*s);X.lineTo(k*1.2*s,22.5*s);X.stroke()}
 X.strokeStyle='#c9ccd1';X.lineWidth=.8*s;X.beginPath();X.moveTo(-8.5*s,12.6*s);X.quadraticCurveTo(0,14.6*s,8.5*s,12.6*s);X.stroke();
 X.fillStyle='#3a2416';X.beginPath();X.ellipse(0,17*s,3.8*s,4.4*s,0,0,TAU);X.fill();X.fillStyle='#d9dde2';X.beginPath();X.ellipse(0,13.9*s,3.4*s,1.5*s,0,0,TAU);X.fill();
 for(const k of[-1.8,0,1.8]){R('#e6e8eb',k-.25,16,.5,2.2);poly('#f4f5f7',[k,17.6,k-.8,20.2,k+.8,20.2])}
 R('#f2c9a8',-2.2,-2,4.4,3);dot('#f2c9a8',0,-9,9);dot('#f2c9a8',-8.8,-8.6,1.6);if(!(o.turn>.4))dot('#f2c9a8',8.8,-8.6,1.6);const tu=o.turn||0;
 X.fillStyle='#f1f1f1';X.beginPath();X.arc(0,-10.5*s,9.4*s,Math.PI*1.03,Math.PI*1.97);X.quadraticCurveTo(4*s,-15.8*s,0,-15.4*s);X.quadraticCurveTo(-5*s,-15.8*s,-9.2*s,-12*s);X.fill();
 R('#e4e4e6',-9.4,-13,2.2,4.5);R('#e4e4e6',7.2,-13,2.2,4.5);
 /* facing check (Oct 30 2026): walking -> face turns 3/4 toward travel (+x) */X.save();X.translate(tu*3*s,-9*s);X.scale(1-.22*tu,1);X.translate(0,9*s);if(tu>.02)dot('#f2c9a8',8.6,-6.8,1.8*tu);dot('rgba(240,130,120,.35)',-5.4,-5.2,1.8);dot('rgba(240,130,120,.35)',5.4,-5.2,1.8);
 const emo=o.emo||'smile';
 if(emo==='oops'){X.strokeStyle='#333';X.lineWidth=.9*s;for(const ex of[-3.7,3.7]){X.beginPath();X.moveTo((ex-1.2)*s,-9.6*s);X.lineTo((ex+1.2)*s,-7.8*s);X.moveTo((ex+1.2)*s,-9.6*s);X.lineTo((ex-1.2)*s,-7.8*s);X.stroke()}}
 else if(o.blink)R('#333',-4.6,-8.6,1.8,.5),R('#333',2.8,-8.6,1.8,.5);else{R('#333',-4.6,-9.4,1.8,1.8);R('#333',2.8,-9.4,1.8,1.8)}
 X.strokeStyle='#8a7a5a';X.lineWidth=.9*s;K.rr(-7.2*s,-11.4*s,6*s,4.6*s,1.6*s);X.stroke();K.rr(1.2*s,-11.4*s,6*s,4.6*s,1.6*s);X.stroke();X.beginPath();X.moveTo(-1.2*s,-9.6*s);X.lineTo(1.2*s,-9.6*s);X.stroke();
 X.strokeStyle='#7a4232';X.lineWidth=.8*s;X.lineCap='round';X.beginPath();if(emo==='oops')X.arc(0,-3.6*s,1.6*s,0,TAU);else if(emo==='joy'){X.fillStyle='#7a4232';X.arc(0,-5.6*s,3*s,.1*Math.PI,.9*Math.PI);X.fill()}else X.arc(0,-5.4*s,2.8*s,.22*Math.PI,.78*Math.PI);X.stroke();
 X.restore();X.strokeStyle='#ffd700';X.lineWidth=3*s;X.shadowColor='#fff38a';X.shadowBlur=15*s;X.beginPath();X.ellipse(0,-24*s+Math.sin(RT*3)*.8*s,11*s,4*s,0,0,TAU);X.stroke();X.shadowBlur=0;
 if(o.shield){X.globalAlpha*=.55+.2*Math.sin(RT*8);X.strokeStyle='#ffe066';X.lineWidth=3*s;X.beginPath();X.arc(0,2*s,30*s,0,TAU);X.stroke();X.fillStyle='rgba(255,240,150,.18)';X.fill()}
 X.restore()}
/* flight rig: wings + arms phase-locked, legs pedal gently with bending knees */
function Rig(){this.ph=0;this.fl=1;this.lp=0}
Rig.prototype.flap=function(){this.fl=0};
Rig.prototype.update=function(dt,vy){this.ph+=dt*TAU*1.7;this.lp+=dt*TAU*(1.4+Math.min(.5,Math.abs(vy||0)/2000));this.fl=Math.min(1,this.fl+dt/.32)};
Rig.prototype.pose=function(vy){let wing;if(this.fl<1){const f=this.fl;wing=f<.4?lerp(.95,-.7,K.ease.out(f/.4)):lerp(-.7,.3,K.ease.inout((f-.4)/.6))}else wing=.3+.28*Math.sin(this.ph);
 const fall=clamp((vy||0)/700,-1,1);const up=clamp((wing+.7)/1.65,0,1);const rising=this.fl<1?(this.fl<.4?0:1):(Math.cos(this.ph)>0?1:0);
 const sh=lerp(.55,2.15,up),el=rising?lerp(.35,.95,up):lerp(.15,.4,up);
 const legs=[0,1].map(i=>{const p=this.lp+i*Math.PI;const sw=.32*Math.sin(p)-.05*fall;return{hip:.12+sw+(fall>0?-.1*fall:.15*-fall),knee:.25+.55*Math.max(0,Math.cos(p))+(this.fl<.4?.3:0)}});
 return{wing,arms:[{sh,el},{sh,el}],legs}};
/* walking rig for story/title (uses kit Gait: cadence tied to ground speed) */
const GAIT=new K.Gait({leg:12.2,walk:30,run:80,knee:1.0});
function walkPose(){const p=GAIT.pose();return{legs:p.legs.map(l=>({hip:l.hip,knee:l.knee})),arms:p.arms.map(a=>({sh:.08+a.sh,el:a.el})),bob:p.bob,wing:.15,armF:1}}
/* ---------- obstacles ---------- */
function book(px,py,w,h,col,lab){X.fillStyle=col;X.fillRect(px,py,w,h);const s=S();X.fillStyle='#f3e9d2';X.fillRect(px+w-6*s,py+3*s,5*s,h-6*s);
 X.fillStyle='#e8c66a';X.fillRect(px,py+4*s,w,2*s);X.fillRect(px,py+h-6*s,w,2*s);K.text(lab,px+w/2-3*s,py+h/2+1,Math.min(h*.42,13*s),'#fff3c4',{fam:'Georgia,serif',w:700,max:w-14*s})}
function pillar(o,sx,gt,gb){const s=S(),W=o.w,H=K.H,ob=WORLDS[o.wi].ob;
 if(ob==='books'){const bh=30*s;let i=0;for(let y=gt-bh;y>-bh;y-=bh,i++)book(sx+((i*7)%3-1)*4*s,y,W,bh-2*s,BCOL[(o.sd+i)%6],LBL[(o.sd+i)%LBL.length]);i=0;for(let y=gb;y<H;y+=bh,i++)book(sx+((i*5)%3-1)*4*s,y,W,bh-2*s,BCOL[(o.sd+i+3)%6],LBL[(o.sd+i+4)%LBL.length]);return}
 if(ob==='tablets'){for(const[y0,y1,up]of[[-10,gt,1],[gb,H+10,0]]){X.fillStyle='#8a7f74';X.fillRect(sx,y0,W,y1-y0);X.fillStyle='#a59a8c';X.fillRect(sx+4*s,y0,W-8*s,y1-y0);
   const ty=up?y1-60*s:y1-(y1-y0)+0;X.fillStyle='#d8cdb8';K.rr(sx-6*s,up?y1-64*s:y0,W+12*s,64*s,up?6*s:22*s);X.fill();X.strokeStyle='#8a7f74';X.lineWidth=2*s;X.stroke();
   const cy=up?y1-32*s:y0+32*s;K.text(['I','II','III','IV','V','VI','VII','VIII','IX','X'][(o.sd+(up?0:5))%10],sx+W/2,cy,20*s,'#6b5e50',{fam:'Georgia,serif',w:700});
   X.strokeStyle='rgba(90,70,50,.35)';X.lineWidth=1.5*s;for(let y=up?y0+12*s:y0+74*s;y<(up?y1-70*s:y1);y+=22*s){X.beginPath();X.moveTo(sx+8*s,y);X.lineTo(sx+W-8*s,y+5*s);X.stroke()}}return}
 if(ob==='tape'){for(const[y0,y1,up]of[[-10,gt,1],[gb,H+10,0]]){X.fillStyle='#4a5068';X.fillRect(sx,y0,W,y1-y0);X.fillStyle='#5c6380';for(let y=y0;y<y1;y+=14*s)for(let x=((y/14|0)%2)*10*s;x<W;x+=20*s)X.fillRect(sx+x+1,y+1,18*s,12*s);
   X.fillStyle='#e0303f';for(let y=y0+20*s;y<y1;y+=46*s){X.save();X.translate(sx+W/2,y);X.rotate(-.18);X.fillRect(-W/2-6*s,-5*s,W+12*s,10*s);X.restore()}
   const ey=up?y1-24*s:y0+24*s;X.fillStyle='#fff6e0';K.rr(sx-8*s,ey-15*s,W+16*s,30*s,5*s);X.fill();X.strokeStyle='#e0303f';X.lineWidth=3*s;X.stroke();K.text(['NO','STOP','RULE 7','FORM B','WAIT'][(o.sd+up)%5],sx+W/2,ey+1,14*s,'#c01f2e',{max:W+8*s})}return}
 if(ob==='storm'){for(const[y0,y1,up]of[[-10,gt,1],[gb,H+10,0]]){X.fillStyle='#3a3266';X.fillRect(sx+6*s,y0,W-12*s,y1-y0);X.fillStyle='#4c4386';
   for(let y=up?y1-14*s:y0+14*s,k=0;up?y>y0-30*s:y<y1+30*s;y+=up?-26*s:26*s,k++){X.beginPath();X.arc(sx+W*.3,y,18*s,0,TAU);X.arc(sx+W*.7,y+(k%2)*6*s,20*s,0,TAU);X.fill()}
   const fl=(Math.sin(RT*5+o.sd)>.93);X.strokeStyle=fl?'#fff':'rgba(255,240,120,.8)';X.lineWidth=(fl?3:2)*s;X.shadowColor='#ffe66b';X.shadowBlur=fl?18:6;X.beginPath();const ey=up?y1:y0;let xx=sx+W/2;X.moveTo(xx,ey);for(let k=1;k<4;k++){xx+=(k%2?8:-8)*s;X.lineTo(xx,ey+(up?12:-12)*s*k)}X.stroke();X.shadowBlur=0}return}
 for(const[y0,y1,up]of[[-10,gt,1],[gb,H+10,0]]){const g=X.createLinearGradient(sx,0,sx+W,0);g.addColorStop(0,'#e9e2d0');g.addColorStop(.5,'#fffaf0');g.addColorStop(1,'#cfc6b0');X.fillStyle=g;X.fillRect(sx+4*s,y0,W-8*s,y1-y0);
  X.strokeStyle='rgba(170,150,110,.5)';X.lineWidth=2*s;for(let k=1;k<4;k++){X.beginPath();X.moveTo(sx+4*s+k*(W-8*s)/4,y0);X.lineTo(sx+4*s+k*(W-8*s)/4,y1);X.stroke()}
  X.fillStyle='#e8b923';const cy=up?y1-14*s:y0;X.fillRect(sx-6*s,cy,W+12*s,14*s);X.fillStyle='#fff3a0';X.fillRect(sx-6*s,cy+3*s,W+12*s,3*s)}}
function drawDove(x,y,sc,t){const s=sc;X.save();X.translate(x,y);const f=Math.sin(t*14);X.fillStyle='#fff';X.strokeStyle='#bcd0ea';X.lineWidth=1.2*s;
 X.beginPath();X.ellipse(0,0,9*s,5.5*s,0,0,TAU);X.fill();X.stroke();X.beginPath();X.arc(7*s,-3*s,3.6*s,0,TAU);X.fill();X.fillStyle='#f5a623';X.beginPath();X.moveTo(10*s,-3.5*s);X.lineTo(13.5*s,-2.5*s);X.lineTo(10*s,-1.5*s);X.fill();
 X.fillStyle='#222';X.beginPath();X.arc(8*s,-3.8*s,.8*s,0,TAU);X.fill();X.fillStyle='#fff';X.beginPath();X.moveTo(-2*s,-2*s);X.quadraticCurveTo(-6*s,-12*s*f-2*s,-12*s,-8*s*f);X.lineTo(3*s,-2*s);X.fill();X.stroke();
 X.fillStyle='#4b7a3a';X.fillRect(9*s,-1*s,4*s,1.2*s);X.restore()}
function drawPage(x,y,sc,big){const s=sc*(big?1.6:1);X.save();X.translate(x,y);X.rotate(Math.sin(RT*2.4)*.12);X.shadowColor='#ffe066';X.shadowBlur=(26+8*Math.sin(RT*6))*sc;
 if(big){X.fillStyle='#f5c518';X.fillRect(-30*s,-38*s,60*s,76*s);X.shadowBlur=0;X.fillStyle='#fff6c0';X.fillRect(-24*s,-30*s,48*s,60*s);X.fillStyle='#b8860b';X.fillRect(-3*s,-22*s,6*s,30*s);X.fillRect(-11*s,-14*s,22*s,6*s);
  K.text('BOOK OF',0,16*s,8.5*s,'#8a5a00',{fam:'Georgia,serif'});K.text('HEAVEN',0,25*s,8.5*s,'#8a5a00',{fam:'Georgia,serif'})}
 else{X.fillStyle='#fff8d8';X.beginPath();X.moveTo(-15*s,-20*s);X.lineTo(15*s,-20*s);X.lineTo(15*s,14*s);X.quadraticCurveTo(0,10*s,-15*s,20*s);X.closePath();X.fill();X.shadowBlur=0;X.strokeStyle='#e8b923';X.lineWidth=2*s;X.stroke();
  X.fillStyle='#d4a017';X.fillRect(-2*s,-14*s,4*s,18*s);X.fillRect(-7*s,-9*s,14*s,4*s);X.strokeStyle='rgba(150,110,40,.4)';X.lineWidth=1*s;for(let k=0;k<3;k++){X.beginPath();X.moveTo(-10*s,8*s+k*3*s);X.lineTo(10*s,6*s+k*3*s);X.stroke()}}
 X.restore()}
function drawShieldOrb(x,y,s){X.save();X.translate(x,y);X.shadowColor='#ffe066';X.shadowBlur=18*s;X.strokeStyle='#ffd700';X.lineWidth=3*s;X.beginPath();X.ellipse(0,-6*s,11*s,4*s,0,0,TAU);X.stroke();X.shadowBlur=0;
 X.fillStyle='rgba(255,240,150,.35)';X.beginPath();X.arc(0,2*s,14*s,0,TAU);X.fill();K.text('♥',0,3*s,16*s,'#ff5a8a',{stroke:'#fff',lw:3});X.restore()}
function drawProj(p,s){X.save();X.translate(p.x,p.y);const ob=p.k;X.rotate(p.r||0);
 if(ob==='scroll'){X.fillStyle='#f3e2b8';X.fillRect(-16*s,-6*s,32*s,12*s);X.fillStyle='#c79a50';X.beginPath();X.arc(-16*s,0,7*s,0,TAU);X.arc(16*s,0,7*s,0,TAU);X.fill();X.fillStyle='#e0303f';X.fillRect(-3*s,-6*s,6*s,12*s)}
 else if(ob==='plane'){X.fillStyle='#fff';X.strokeStyle='#7a8aa8';X.lineWidth=1.2*s;X.beginPath();X.moveTo(-16*s,0);X.lineTo(14*s,-9*s);X.lineTo(8*s,9*s);X.closePath();X.fill();X.stroke();K.text('RULE',2*s,0,6*s,'#2e4a7a')}
 else if(ob==='rock'){X.fillStyle='#b8a68c';K.rr(-12*s,-15*s,24*s,30*s,9*s);X.fill();X.strokeStyle='#6b5e50';X.lineWidth=2*s;X.stroke();K.text('NO',0,1*s,9*s,'#6b5e50')}
 else if(ob==='tape'){X.strokeStyle='#e0303f';X.lineWidth=6*s;X.beginPath();for(let k=-3;k<=3;k++)X.lineTo(k*6*s,Math.sin(RT*12+k)*6*s);X.stroke()}
 else if(ob==='bolt'||ob==='cloud'){X.fillStyle=ob==='cloud'?'#3a3266':'#ffe66b';if(ob==='cloud'){X.beginPath();X.arc(-10*s,0,14*s,0,TAU);X.arc(8*s,-4*s,16*s,0,TAU);X.arc(14*s,6*s,11*s,0,TAU);X.fill();X.fillStyle='#fff';X.fillRect(-8*s,-4*s,4*s,4*s);X.fillRect(6*s,-6*s,4*s,4*s);X.fillStyle='#2a234a';X.fillRect(-6*s,5*s,14*s,3*s)}
  else{X.shadowColor='#fff38a';X.shadowBlur=14*s;X.beginPath();X.moveTo(-14*s,-4*s);X.lineTo(2*s,-10*s);X.lineTo(0,-2*s);X.lineTo(14*s,-6*s);X.lineTo(-2*s,10*s);X.lineTo(0,2*s);X.closePath();X.fill()}}
 else{X.fillStyle='#7a4a24';X.fillRect(-14*s,-8*s,18*s,16*s);X.fillStyle='#e8b923';X.fillRect(-15*s,-9*s,3*s,18*s);X.fillRect(3*s,-9*s,3*s,18*s);X.fillStyle='#5a3418';X.fillRect(4*s,-2*s,14*s,4*s)}
 X.restore()}
function drawBoss(wi,x,y,s,hp,mx,hurt){X.save();X.translate(x,y);if(hurt>0)X.translate(rand(-4,4)*s,rand(-4,4)*s);const bob=Math.sin(RT*3)*4*s;X.translate(0,bob);
 const face=(ey,col)=>{X.fillStyle='#fff';X.beginPath();X.arc(-12*s,ey,7*s,0,TAU);X.arc(12*s,ey,7*s,0,TAU);X.fill();X.fillStyle=col||'#222';X.beginPath();X.arc(-13*s,ey+1*s,3.2*s,0,TAU);X.arc(11*s,ey+1*s,3.2*s,0,TAU);X.fill();
  X.strokeStyle='#222';X.lineWidth=3*s;X.beginPath();X.moveTo(-20*s,ey-11*s);X.lineTo(-6*s,ey-7*s);X.moveTo(20*s,ey-11*s);X.lineTo(6*s,ey-7*s);X.stroke();X.beginPath();X.arc(0,ey+20*s,9*s,1.15*Math.PI,1.85*Math.PI);X.stroke()};
 if(wi===0){X.fillStyle='#7a2e2e';K.rr(-40*s,-52*s,80*s,104*s,6*s);X.fill();X.fillStyle='#f3e9d2';X.fillRect(32*s,-46*s,8*s,92*s);X.fillStyle='#e8c66a';X.fillRect(-40*s,-40*s,80*s,4*s);X.fillRect(-40*s,36*s,80*s,4*s);
  K.text('RULES',0,26*s,15*s,'#fff3c4',{fam:'Georgia,serif'});face(-12*s);X.fillStyle='#1c1c40';X.fillRect(-26*s,-70*s,52*s,14*s);X.fillRect(-18*s,-82*s,36*s,14*s)}
 else if(wi===1){X.fillStyle='#cfc2a8';K.rr(-44*s,-60*s,88*s,120*s,40*s);X.fill();X.strokeStyle='#8a7f74';X.lineWidth=3*s;X.stroke();K.text('I II III',0,30*s,13*s,'#6b5e50',{fam:'Georgia,serif'});face(-14*s)}
 else if(wi===2){X.fillStyle='#e0303f';X.beginPath();for(let k=0;k<14;k++){const a=k/14*TAU+RT;X.ellipse(Math.cos(a)*30*s,Math.sin(a)*30*s,22*s,9*s,a,0,TAU)}X.fill();X.fillStyle='#f6c6a8';X.beginPath();X.arc(0,0,30*s,0,TAU);X.fill();face(-4*s);
  X.fillStyle='#e0303f';X.fillRect(-30*s,-36*s,60*s,10*s);X.fillStyle='#fff';K.text('APPROVED?',0,46*s,11*s,'#fff',{stroke:'#e0303f',lw:3})}
 else if(wi===3){X.fillStyle='#2e2856';X.beginPath();X.arc(-26*s,4*s,30*s,0,TAU);X.arc(18*s,-10*s,38*s,0,TAU);X.arc(28*s,22*s,26*s,0,TAU);X.arc(-6*s,26*s,26*s,0,TAU);X.fill();face(0,'#ffe66b')}
 else{X.fillStyle='#7a4a24';K.rr(-46*s,-30*s,72*s,60*s,10*s);X.fill();X.fillStyle='#e8b923';X.fillRect(-50*s,-32*s,8*s,64*s);X.fillRect(20*s,-32*s,8*s,64*s);X.fillStyle='#5a3418';X.fillRect(26*s,-7*s,52*s,14*s);face(-2*s)}
 X.restore();const bw=90*s;X.fillStyle='rgba(0,0,0,.5)';K.rr(x-bw/2,y-96*s,bw,10*s,5*s);X.fill();X.fillStyle='#ff4a6a';K.rr(x-bw/2,y-96*s,bw*hp/mx,10*s,5*s);X.fill()}
/* ---------- title ---------- */
let G=null;
const Title={menu:true,primary:'play',enter(){G=null;K.music.play(SONG_T);this.rig=new Rig()},update(dt){RT+=dt;this.rig.update(dt,0);if(Math.random()<dt*.7)this.rig.flap();K.updFx(dt)},back(){},
 draw(){const W=K.W,H=K.H,s=K.safe,land=K.land,sc=S();bg(0,Math.sin(RT*.05)*.6);clouds(RT*40,.45);
  const cx=land?W*.3:W/2;const tY=land?H*.2:s.t+92;const tp=land?Math.min(52,W*.05):Math.min(46,W*.11);
  K.text("Duncan's",cx,tY-tp*.95,tp*.62,'#fff8d0',{stroke:'#6b3d00',lw:6,glow:'#ffe066'});K.text('Mess Up Fess Up',cx,tY,tp,'#fff8d0',{stroke:'#6b3d00',lw:7,max:land?W*.55:W-40});
  K.text('FLIGHT 2',cx,tY+tp*1.02,tp*1.05,'#ffd700',{stroke:'#6b3d00',lw:7,glow:'#fff38a'});K.text('Wings of Grace',cx,tY+tp*1.85,tp*.48,'#fff',{stroke:'#4a2a00',lw:4});
  const dS=(land?.95:1.15)*sc*1.6,dy=land?H*.62:H*.43;const p=this.rig.pose(0);const bob=Math.sin(RT*2)*8*sc;drawDuncan(cx,dy+bob,dS,{wing:p.wing,arms:p.arms,legs:p.legs,blink:(RT%3.2)<.12,emo:'joy'});
  K.charRects.push({x:cx-48*dS*.62,y:dy+bob-30*dS,w:96*dS*.62,h:62*dS,name:'duncan'});
  for(let k=0;k<3;k++)drawDove(cx+Math.cos(RT*.8+k*2.1)*80*sc*1.2,dy-30*sc+Math.sin(RT*1.1+k*2.1)*50*sc,sc*1.1,RT+k);
  // buttons
  const tot=Object.values(save.stars).reduce((a,b)=>a+b,0);
  let bx,by,bw,bh=54,gap=10;if(land){bw=Math.min(300,W*.34);bx=W*.66-bw/2+W*.04;by=Math.max(s.t+20,H/2-(bh*4+gap*3)/2-6)}else{bw=Math.min(320,W-56);bx=(W-bw)/2;by=Math.max(dy+48*dS+8,H-s.b-(bh*4+gap*3)-50)}
  K.button('play',bx,by,bw,bh+6,save.unlocked>1?'▶ CONTINUE':'▶ PLAY',{color:'#2fae4a',px:24,cb:()=>{if(!save.seenIntro){save.seenIntro=true;persist();K.go(new K.Story(STORY,()=>K.go(Map),{bg:()=>{bg(0);X.fillStyle='rgba(0,0,0,.25)';X.fillRect(0,0,K.W,K.H)}}))}else K.go(Map)}});by+=bh+6+gap;
  const hw=(bw-gap)/2;K.button('endless',bx,by,hw,bh,'∞ ENDLESS',{color:'#d08a1a',cb:()=>startLevel(-1)});K.button('how',bx+hw+gap,by,hw,bh,'HOW TO PLAY',{color:'#3a7ac8',cb:()=>K.go(How)});by+=bh+gap;
  K.button('story',bx,by,hw,bh,'🎬 STORY',{color:'#7a5ad0',cb:()=>K.go(new K.Story(STORY,()=>K.go(Title),{bg:()=>{bg(0);X.fillStyle='rgba(0,0,0,.25)';X.fillRect(0,0,K.W,K.H)}}))});
  K.button('snd',bx+hw+gap,by,hw,bh,AU.muted?'🔇 SOUND OFF':'🔊 SOUND ON',{color:'#4a4f6a',px:17,cb:()=>{AU.muted=!AU.muted;AU.apply();save.muted=AU.muted;persist()}});by+=bh+gap;
  K.text('★ '+tot+' / 90    Endless best '+save.best+'    🕊 '+save.doves,bx+bw/2,by+12,15,'#fff',{stroke:'#4a2a00',lw:4,max:bw});
  K.logo('tl');K.drawFx()}};
/* ---------- story ---------- */
function panel(wi,fn){return(x,y,w,h,t)=>{X.save();X.translate(x,y);const im=K.img[WORLDS[wi].img];if(im&&im.naturalWidth){const sc=Math.max(w/im.naturalWidth,h/im.naturalHeight);X.drawImage(im,(w-im.naturalWidth*sc)/2,(h-im.naturalHeight*sc)/2,im.naturalWidth*sc,im.naturalHeight*sc)}fn(w,h,t);X.restore()}}
function walker(x,y,sc,dist,dt,emo){GAIT.L=12.2*sc;GAIT.vw=30*sc;GAIT.vr=80*sc;GAIT.update(dist,dt);const p=walkPose();drawDuncan(x,y-p.bob*sc*.6,sc,{wing:p.wing,arms:p.arms,legs:p.legs,emo,armF:1,turn:dist>0?.9:0})}
let lastStoryT=0;
const STORY=[
 {draw:panel(0,(w,h,t)=>{const sc=w/230;const dt=Math.max(0,Math.min(.05,t-lastStoryT));lastStoryT=t;const stop=t>2.2;const x=w*.18+Math.min(t,2.2)*w*.2;
  X.fillStyle='#d9c08a';X.fillRect(w*.7,h*.52,w*.18,h*.22);X.fillStyle='#b8860b';X.fillRect(w*.75,h*.5,w*.08,h*.24);X.fillRect(w*.7,h*.47,w*.18,h*.04);if(!stop||t<2.6)drawPage(w*.79,h*.38-(stop?Math.min(1,(t-2.2)*2.5)*h*.2:0),sc*.6,true);
  if(stop){for(let k=0;k<5;k++){const a=(t-2.2)*1.2+k;drawPage(w*.79+Math.cos(a+k)*w*.25*Math.min(1,t-2.2),h*.4-Math.sin(a)*h*.2-(t-2.2)*h*.05,sc*.35)}}
  walker(x,h*.6,sc*1.3,stop?0:w*.2*dt,dt||.016,stop?'oops':'smile')}),t:'Up in the clouds, Duncan was proudly polishing his brand-new wings when... WHOOPS! He bumped the Book of Heaven right off its stand.'},
 {draw:panel(2,(w,h,t)=>{const sc=w/150;for(let k=0;k<8;k++){const a=t*.6+k*.8;drawPage(((k*61+t*30)%w),h*.2+((k*37)%60)/60*h*.6+Math.sin(a)*10,sc*.45)}}),t:'Its golden pages blew across the sky: over Courthouse Clouds, Commandment Canyon, the Town of Red Tape, the Storm of Guilt, all the way to the Pearly Gates.'},
 {draw:panel(4,(w,h,t)=>{const sc=w/110;const r=new Rig();r.ph=t*TAU*.6;const p=r.pose(0);drawDuncan(w/2,h*.55+Math.sin(t*2)*4,sc,{wing:.1,arms:[{sh:.35,el:1.7},{sh:.35,el:1.7}],legs:[{hip:.05,knee:.1},{hip:-.05,knee:.1}],emo:t<1.5?'oops':'joy'});
  if(t>1.5){X.globalAlpha=Math.min(1,(t-1.5));K.text('FORGIVEN',w/2,h*.16,w*.12,'#fff8d0',{stroke:'#8a5a00',lw:6,glow:'#ffe066'});X.globalAlpha=1}}),t:"Duncan felt awful. But he remembered the rule that beats all the rules: when you mess up, FESS UP. Grace catches you every time."},
 {draw:panel(0,(w,h,t)=>{const sc=w/150;const r=STORY.rig||(STORY.rig=new Rig());r.update(1/60,0);if((t*1.6|0)!==STORY.lf){STORY.lf=t*1.6|0;r.flap()}const p=r.pose(0);drawDuncan(w*.4,h*.5+Math.sin(t*2.5)*10,sc,{wing:p.wing,arms:p.arms,legs:p.legs,emo:'joy'});
  drawDove(w*.75,h*.35+Math.sin(t*3)*8,sc*.9,t);drawDove(w*.68,h*.62+Math.sin(t*2.6)*8,sc*.8,t+1)}),t:"So off he flies to find every page! Tap to flap. Dodge the laws and rules, catch the doves of grace, and if you crash, just fess up and keep flying."}];
const ENDING=[
 {draw:panel(4,(w,h,t)=>{const sc=w/150;drawBoss(4,w*.72,h*.5,sc*.8,0,1,0);drawPage(w*.3,h*.45,sc*.8,true);X.globalAlpha=Math.min(1,t);K.text('GUILTY?',w*.72,h*.16,w*.09,'#fff',{stroke:'#5a3418',lw:5});X.globalAlpha=1}),t:'The Grand Gavel lifted its hammer one last time: "GUILTY!" But the Book of Heaven fell open, and one golden word shone out...'},
 {draw:panel(4,(w,h,t)=>{const sc=w/120;K.text('FORGIVEN',w/2,h*.18,w*.13,'#fff8d0',{stroke:'#8a5a00',lw:6,glow:'#ffe066'});const d=Math.min(1,t/2);drawDuncan(w/2,h*.62,sc,{wing:.6+.3*Math.sin(t*6),arms:[{sh:2.3,el:.3},{sh:2.3,el:.3}],legs:[{hip:.1,knee:.4},{hip:-.1,knee:.6}],emo:'joy'});
  for(let k=0;k<6;k++)drawDove(w/2+Math.cos(t+k)*w*.38*d,h*.55+Math.sin(t*1.3+k)*h*.3*d,sc*.5,t+k)}),t:'FORGIVEN! Duncan put every page back where it belonged. He still messes up sometimes. Everybody does. But now he always fesses up, and he flies lighter than ever.'},
 {draw:panel(0,(w,h,t)=>{const sc=w/150;K.text('THE END',w/2,h*.3,w*.14,'#ffd700',{stroke:'#6b3d00',lw:6,glow:'#fff38a'});K.text('Thanks for flying!',w/2,h*.48,w*.07,'#fff',{stroke:'#6b3d00',lw:4});drawPage(w/2,h*.72,sc*.7,true)}),t:'Thanks for playing! Try Endless mode, and go back for any stars you missed.'}];
/* ---------- map ---------- */
const Map={menu:true,primary:'lv0',enter(){K.music.play(SONG_T);const n=Math.min(save.unlocked,30)-1;this.wi=Math.floor(n/6);this.primary='lv'+n;K.focus='lv'+n},update(dt){RT+=dt;K.updFx(dt)},back(){K.go(Title)},
 draw(){const W=K.W,H=K.H,s=K.safe,land=K.land,wi=this.wi,w=WORLDS[wi];bg(wi,Math.sin(RT*.05)*.5);X.fillStyle='rgba(0,0,20,.25)';X.fillRect(0,0,W,H);
  K.button('back',s.l+10,s.t+10,100,46,'◀ BACK',{color:'#4a4f6a',px:17,cb:()=>K.go(Title)});
  const tY=s.t+(land?36:96);K.text('WORLD '+(wi+1),W/2,tY-(land?0:30),land?20:22,'#fff',{stroke:'#000',lw:5});K.text(w.n,W/2,tY+(land?24:0),land?30:34,w.tint,{stroke:'#000',lw:6,max:W-140});
  const locked=save.unlocked<=wi*6;const ab=50;const ay=land?H*.46:tY+60;
  K.button('wl',s.l+10,ay,ab,ab+20,'◀',{color:'#3a7ac8',dis:wi===0,px:26,cb:()=>{this.wi--;K.focus='lv'+this.wi*6}});
  K.button('wr',W-s.r-10-ab,ay,ab,ab+20,'▶',{color:'#3a7ac8',dis:wi===4,px:26,cb:()=>{this.wi++;K.focus='lv'+this.wi*6}});
  const cols=land?6:3,rows=land?1:2,gap=12;const aw=land?W-s.l-s.r-ab*2-80:W-48;const bw=Math.min(land?120:118,(aw-(cols-1)*gap)/cols),bh=land?104:112;
  const gx=(W-(cols*bw+(cols-1)*gap))/2,gy=land?H*.36:ay+ab+50;
  for(let k=0;k<6;k++){const L=LEVELS[wi*6+k],c=k%cols,r=Math.floor(k/cols),x=gx+c*(bw+gap),y=gy+r*(bh+gap),open=L.i<save.unlocked,st=save.stars[L.i]||0;
   K.button('lv'+L.i,x,y,bw,bh,'',{color:L.boss?'#b0304a':open?'#2c7a4a':'#4a4f6a',dis:!open,cb:()=>K.go(Card,L.i),draw:(x,y,w,h)=>{
    K.text(L.boss?'BOSS':L.label,x+w/2,y+h*.36,L.boss?24:30,'#fff',{stroke:'rgba(0,0,0,.4)',lw:4});if(!open)K.text('🔒',x+w/2,y+h*.74,22);else for(let j=0;j<3;j++)K.text('★',x+w/2+(j-1)*22,y+h*.74,22,j<st?'#ffd700':'rgba(255,255,255,.3)',{stroke:'rgba(0,0,0,.4)',lw:3})}})}
  const ty=land?H-s.b-30:gy+rows*(bh+gap)+30;K.para(locked?'Finish the world before to unlock '+w.n+'.':TIPS[wi],W/2,ty,Math.min(W-60,560),18,'#fff',{stroke:'rgba(0,0,0,.6)',lw:4,center:true});
  if(!land){const dS=S()*1.5;const r=this.rig||(this.rig=new Rig());r.update(1/60,0);if(Math.random()<.01)r.flap();const p=r.pose(0);const dy=Math.min(H-s.b-90,ty+110);drawDuncan(W/2,dy+Math.sin(RT*2)*6,dS,{wing:p.wing,arms:p.arms,legs:p.legs,emo:'joy'});K.charRects.push({x:W/2-30*dS,y:dy-30*dS,w:60*dS,h:62*dS,name:'duncan'})}
  K.drawFx()}};
/* ---------- level card ---------- */
const Card={menu:true,primary:'go',enter(i){this.i=i},update(dt){RT+=dt},back(){K.go(Map)},
 draw(){const W=K.W,H=K.H,s=K.safe,L=LEVELS[this.i],w=WORLDS[L.w];bg(L.w);X.fillStyle='rgba(0,0,20,.45)';X.fillRect(0,0,W,H);
  const cw=Math.min(460,W-40),ch=Math.min(K.land?H-s.t-s.b-30:420,420),cx=(W-cw)/2,cy=(H-ch)/2;X.fillStyle='rgba(20,18,40,.88)';K.rr(cx,cy,cw,ch,22);X.fill();X.strokeStyle=w.acc;X.lineWidth=3;X.stroke();
  K.text('LEVEL '+L.label,W/2,cy+38,22,w.tint);K.text(L.boss?w.boss:w.n,W/2,cy+76,32,'#fff',{stroke:'#000',lw:5,max:cw-30});
  const goal=L.boss?'Catch the golden light to beam '+w.boss+' '+L.hp+' times, then grab the Book of Heaven!':'Fly through '+L.gates+' gates, catch the doves, and grab the golden page!';
  K.para(goal,W/2,cy+124,cw-40,19,'#fff',{lh:1.3});K.para('★ finish   ★ 60% doves   ★ no mess-ups',W/2,cy+ch-120,cw-30,16,'#ffd700');
  const bw=(cw-50)/2;K.button('back',cx+18,cy+ch-74,bw,56,'◀ MAP',{color:'#4a4f6a',cb:()=>K.go(Map)});K.button('go',cx+32+bw,cy+ch-74,bw,56,'FLY! ▶',{color:'#2fae4a',px:24,cb:()=>startLevel(this.i)})}};
/* ---------- how ---------- */
const How={menu:true,primary:'ok',update(dt){RT+=dt},back(){K.go(Title)},
 draw(){const W=K.W,H=K.H,s=K.safe;bg(0);X.fillStyle='rgba(0,0,20,.55)';X.fillRect(0,0,W,H);K.text('HOW TO PLAY',W/2,s.t+44,32,'#ffd700',{stroke:'#000',lw:5});
  const t='TAP anywhere to flap (Space / ↑ or 🎮 A also work).\n\nFly through the gaps in the laws and rules. Catch white doves for grace.\n\nA golden halo ♥ gives Duncan a Grace Shield: one bump is forgiven for free.\n\nCrash? That\'s a mess-up. Tap FESS UP to keep flying from right there.\n\nBosses: grab the golden light to beam them. Then catch the Book of Heaven!\n\nStars: finish · 60% of doves · no mess-ups.';
  K.para(t,W/2,s.t+96,Math.min(W-40,620),K.land?16:19,'#fff',{lh:1.25,w:700});K.button('ok',W/2-110,H-s.b-74,220,56,'GOT IT ▶',{color:'#2fae4a',cb:()=>K.go(Title)})}};
/* ---------- play ---------- */
function startLevel(i){const endless=i<0;const L=endless?{i:-1,w:0,boss:false,gates:1e9,gap:236,move:0,proj:0,clouds:0,spd:170,label:'∞'}:LEVELS[i];
 const s=S();const DX=K.land?K.W*.24:K.W*.27;
 G={L,endless,wi:L.w,s,DX,y:K.H*.45,vy:0,cam:0,state:'ready',t:0,rig:new Rig(),gates:[],doves:[],items:[],proj:[],passed:0,doveN:0,doveT:0,mess:0,shield:0,inv:0,page:null,fessLeft:endless?1:99,
  boss:L.boss?{hp:L.hp,mx:L.hp,x:0,y:K.H*.45,cd:2.5,orb:3,hurt:0,dead:0,warn:0}:null,beams:[],rnd:rng((endless?Date.now():L.i*977+13)),nextX:0,banner:2.2,won:false};
 if(!L.boss)genAhead();K.go(Play);K.music.play(L.boss?SONG_B:SONGS[L.w])}
function genAhead(){const g=G,s=g.s,r=g.rnd,L=g.L;const sp=260*s*(K.land?1.15:1);if(!g.nextX)g.nextX=K.W+120*s;
 while(g.nextX<g.cam+K.W*2.2&&g.gates.length+g.passed<L.gates){const n=g.gates.length+g.passed;let gap=L.gap,move=L.move,wi=g.wi;
  if(g.endless){wi=Math.floor(n/10)%5;gap=Math.max(168,236-n*1.1);move=Math.min(.6,n/60)}const gp=gap*s*(K.land?1.25:1);const H=K.H;const mg=60*s;
  const amp=r()<move?rand(28,60)*s:0;const lo=mg+gp/2+amp,hi=H-mg-gp/2-amp-30*s;let cy=lerp(lo,hi,r());if(g.lastCy!=null)cy=clamp(cy,g.lastCy-H*.4,g.lastCy+H*.4);g.lastCy=cy;const gt={x:g.nextX,w:68*s,cy,gap:gp,amp,ph:r()*TAU,f:.9+r()*.6,sd:Math.floor(r()*9),wi,done:0};g.gates.push(gt);
  const nd=1+Math.floor(r()*3);for(let k=0;k<nd;k++){g.doves.push({x:gt.x+gt.w+sp*(.3+k*.2),y:cy+(r()-.5)*gp*.4,got:0,ph:r()*6});g.doveT++}
  if(!g.endless&&L.li>=1&&n===Math.floor(L.gates/2)||g.endless&&n%15===7)g.items.push({x:gt.x+gt.w/2,y:cy,k:'shield',got:0});
  g.nextX+=sp*(1+r()*.25)}
 if(!g.endless&&g.gates.length===0&&g.passed>=L.gates&&!g.page)g.page={x:g.cam+K.W+80*s,y:K.H*.45,got:0}}
function gateY(gt){return gt.cy+(gt.amp?Math.sin(G.t*gt.f*1.6+gt.ph)*gt.amp:0)}
function flap(){const g=G;if(g.state==='ready'){g.state='fly';g.banner=0}if(g.state!=='fly')return;g.vy=-430*g.s;g.rig.flap();K.sfx('flap');K.burst(g.DX-10*g.s,g.y+10*g.s,['#fff','#e4ecff'],3,60,{g:0,life:.5,size:.8})}
function messUp(why){const g=G;if(g.inv>0||g.state!=='fly')return;(g.mlog=g.mlog||[]).push([why,Math.round(g.y),Math.round(g.vy),g.passed]);if(g.shield){g.shield=0;g.inv=1.4;K.sfx('choir');K.float('FORGIVEN!',g.DX,g.y-40*g.s,'#ffe066',26);K.burst(g.DX,g.y,['#ffe066','#fff'],24,240,{g:0});g.vy=-300*g.s;return}
 g.state='mess';g.mess++;K.sfx('hit');K.shake=12;K.burst(g.DX,g.y,['#fff','#ffd700','#d8e4ff'],26,260);g.messT=0;Play.menu=true;K.focus='fess'}
function fessUp(){const g=G;if(g.fessLeft<=0)return;g.fessLeft--;g.state='fly';Play.menu=false;g.inv=2.2;g.y=K.H*.42;g.vy=-200*g.s;K.sfx('choir');K.float('FESSED UP! FORGIVEN!',K.W/2,K.H*.3,'#ffe066',24);
 // clear the obstacle Duncan hit so he can keep going fairly
 for(const gt of g.gates)if(gt.x-g.cam<g.DX+120*g.s&&gt.x+gt.w-g.cam>g.DX-60*g.s){gt.cy=K.H*.42;gt.amp=0;gt.gap=Math.max(gt.gap,250*g.s)}g.proj=g.proj.filter(p=>Math.abs(p.x-g.DX)>220*g.s)}
function finish(win){const g=G;g.state='done';g.won=win;Play.menu=false;
 if(g.endless){if(g.passed>save.best)save.best=g.passed;save.doves+=g.doveN;persist();setTimeout(()=>{if(G===g)K.go(Result)},900);return}
 const L=g.L;let st=1;if(g.doveT===0||g.doveN/g.doveT>=.6||L.boss)st++;if(g.mess===0)st++;if(L.boss&&g.mess===0)st=3;g.stars=st;
 save.stars[L.i]=Math.max(save.stars[L.i]||0,st);save.unlocked=Math.max(save.unlocked,Math.min(30,L.i+2));save.doves+=g.doveN;persist();setTimeout(()=>{if(G===g)K.go(Result)},1300)}
const Play={menu:false,primary:'fess',enter(){this.menu=false;K.focus=null},
 down(p){if(G.state==='ready'||G.state==='fly')flap()},
 pause(){if(G&&(G.state==='fly'||G.state==='ready')){G.prev=G.state;G.state='pause';this.menu=true;K.focus='resume'}},
 back(){const g=G;if(g.state==='pause')this.resume();else if(g.state==='mess'){}},
 resume(){G.state=G.prev||'fly';if(G.state==='fly')G.state='ready';this.menu=false;K.focus=null},
 update(dt){const g=G,s=g.s,H=K.H;RT+=dt;K.updFx(dt);const P=K.pad.pr,kp=K.kp;
  if(g.state==='pause'){return}
  if(P.start||kp.Escape||kp.KeyP){if(g.state==='fly'||g.state==='ready'){this.pause();return}}
  if(g.state==='ready'||g.state==='fly'){if(P.a||P.x||P.y||P.up||P.rb||kp.Space||kp.ArrowUp||kp.KeyW)flap()}
  if(window.__DK&&__DK.bot)bot(dt);
  g.t+=dt;g.banner-=dt;g.rig.update(dt,g.vy);
  if(g.state==='ready'){g.y=lerp(g.y,H*.45+Math.sin(g.t*3)*10*s,.1);if(Math.random()<dt*2)g.rig.flap();return}
  if(g.state==='mess'){g.messT+=dt;g.vy=Math.min(g.vy+900*s*dt,500*s);if(g.y<H-40*s)g.y+=g.vy*dt;return}
  const wi=g.endless?Math.floor(g.passed/10)%5:g.wi;g.wiNow=wi;
  if(g.state==='done'){g.y=lerp(g.y,H*.42,.05);g.cam+=g.L.spd*s*.5*dt;return}
  const sp=(g.endless?Math.min(250,170+g.passed*1.2):g.L.spd)*s;g.cam+=sp*dt;g.dist=(g.dist||0)+sp*dt;
  const grav=(wi===3?1600:1500)*s;g.vy=Math.min(g.vy+grav*dt,640*s);g.y+=g.vy*dt;if(g.y<16*s){g.y=16*s;g.vy=Math.max(0,g.vy)}
  g.inv=Math.max(0,g.inv-dt);const R=12.5*s*1.6;const dX=g.DX;
  if(g.y>H-30*s){if(g.inv>0||g.shield){g.vy=-420*s;g.y=H-31*s;if(!g.inv)messUp()}else{messUp('floor');return}}
  if(!g.L.boss){genAhead();
   for(const gt of g.gates){const sx=gt.x-g.cam,cy=gateY(gt),gt0=cy-gt.gap/2,gb=cy+gt.gap/2;
    if(!gt.done&&sx+gt.w<dX-R){gt.done=1;g.passed++;K.sfx('pass');if(g.endless&&g.passed%10===0)K.float('WORLD '+(Math.floor(g.passed/10)%5+1)+'!',K.W/2,H*.3,'#ffd700',26)}
    if(dX+R*.8>sx&&dX-R*.8<sx+gt.w&&(g.y-R<gt0||g.y+R>gb)&&g.inv<=0){messUp(g.y-R<gt0?'top:'+Math.round(gt0):'bot:'+Math.round(gb));if(g.state!=='fly')return}}
   g.gates=g.gates.filter(gt=>gt.x-g.cam>-gt.w-40*s);
   // projectiles / drifting storm clouds
   const L=g.L;const pRate=g.endless?(wi>=2?.25:0):L.proj*.045;if(pRate&&Math.random()<pRate*dt*3&&(g.passed<L.gates-1||g.endless)){g.proj.push({k:wi===2?'scroll':wi===3?'bolt':'gavel',x:K.W+60*s,y:rand(60*s,H-90*s),vx:-(sp+170*s),warn:.8,r:0});K.sfx('warn')}
   const cRate=g.endless?(wi>=3?.2:0):L.clouds*.03;if(cRate&&Math.random()<cRate*dt*3){g.proj.push({k:'cloud',x:K.W+60*s,y:rand(80*s,H-120*s),vx:-sp*.9,vy:rand(-1,1)*60*s,warn:.5,r:0,ph:Math.random()*6})}
  }else bossUpdate(dt,sp);
  for(const p of g.proj){if(p.warn>0){p.warn-=dt;continue}p.x+=p.vx*dt;if(p.vy){p.y+=Math.sin(g.t*1.5+p.ph)*p.vy*dt}if(p.vyy)p.y+=p.vyy*dt;if(p.k==='scroll'||p.k==='rock'||p.k==='gavel')p.r-=dt*6;
   if(Math.hypot(p.x-dX,p.y-g.y)<R*.75+12*s*(p.k==='cloud'?1.5:1)&&g.inv<=0){p.dead=1;messUp('proj:'+p.k);if(g.state!=='fly')return}}
  g.proj=g.proj.filter(p=>!p.dead&&p.x>-60*s);
  for(const d of g.doves){if(d.got)continue;const sx=d.x-g.cam;if(Math.hypot(sx-dX,d.y-g.y)<R+16*s){d.got=1;g.doveN++;K.sfx('dove');K.burst(sx,d.y,['#fff','#e4ecff'],8,120,{g:-40});K.float('+1',sx,d.y-16*s,'#fff',18)}}
  g.doves=g.doves.filter(d=>d.x-g.cam>-40*s);
  for(const it of g.items){if(it.got)continue;const sx=it.x-g.cam;if(Math.hypot(sx-dX,it.y-g.y)<R+18*s){it.got=1;g.shield=1;K.sfx('shield');K.float('GRACE SHIELD!',sx,it.y-26*s,'#ffe066',22)}}
  if(g.page&&!g.page.got){const pg=g.page;let sx=pg.x-g.cam;pg.y=lerp(pg.y,g.y,dt*(sx<K.W*.6?1.6:.3));if(sx<dX-50*s){pg.x=g.cam+K.W+60*s}
   if(Math.hypot(sx-dX,pg.y-g.y)<R+30*s){pg.got=1;K.sfx('page');K.burst(sx,pg.y,['#ffd700','#fff6c0','#fff'],44,300,{g:60});K.shake=6;finish(true)}}},
 draw(){const g=G,s=g.s,W=K.W,H=K.H,sf=K.safe,dX=g.DX;const wi=g.wiNow==null?g.wi:g.wiNow;X.save();if(K.shake)X.translate(rand(-K.shake,K.shake)*.4,rand(-K.shake,K.shake)*.4);
  bg(wi,((g.cam/(W*12))%2)-1>0?1-(((g.cam/(W*12))%2)-1):((g.cam/(W*12))%2)-1);clouds(g.cam,.35);
  for(const d of g.doves)if(!d.got)drawDove(d.x-g.cam,d.y+Math.sin(g.t*3+d.ph)*5*s,s*1.1,g.t+d.ph);
  for(const it of g.items)if(!it.got)drawShieldOrb(it.x-g.cam,it.y+Math.sin(g.t*3)*6*s,s*1.2);
  for(const gt of g.gates){const sx=gt.x-g.cam;if(sx>W+20||sx<-gt.w-20)continue;const cy=gateY(gt);pillar(gt,sx,cy-gt.gap/2,cy+gt.gap/2)}
  if(g.boss)bossDraw();
  for(const p of g.proj){if(p.warn>0){if((RT*8|0)%2===0)K.text('!',W-sf.r-24,p.y,34*s+8,'#ff4a5a',{stroke:'#fff',lw:4});continue}drawProj(p,s*1.2)}
  if(g.page&&!g.page.got)drawPage(g.page.x-g.cam,g.page.y,s*1.3,!!g.L.boss);
  const p=g.rig.pose(g.vy);const tilt=g.state==='mess'?Math.min(1.2,g.messT*3):clamp(g.vy/(900*s),-.35,.5);
  const dS=s*1.6*(K.land?1.05:1);const blinkOff=g.inv>0&&((RT*10|0)%2===0);
  drawDuncan(dX,g.y,dS,{wing:g.state==='mess'?-.3:p.wing,arms:g.state==='mess'?[{sh:2.4,el:.5},{sh:2.4,el:.5}]:p.arms,legs:p.legs,tilt,emo:g.state==='mess'?'oops':g.state==='done'?'joy':'smile',shield:g.shield,alpha:blinkOff?.45:1});
  for(const b of g.beams){X.globalAlpha=Math.max(0,b.t/.4);X.strokeStyle='#fff6a0';X.lineWidth=10*s*b.t/.4+2;X.shadowColor='#ffe066';X.shadowBlur=20;X.beginPath();X.moveTo(b.x0,b.y0);X.lineTo(b.x1,b.y1);X.stroke();X.shadowBlur=0;X.globalAlpha=1}
  floor(g.cam,wi);K.drawFx();X.restore();
  // HUD
  const bsz=46;K.button('pause',W-sf.r-bsz-10,sf.t+10,bsz,bsz,'II',{color:'#4a4f6a',nofocus:true,cb:()=>this.pause()});
  const hx=sf.l+12,hy=sf.t+12;X.fillStyle='rgba(20,18,40,.6)';K.rr(hx,hy,Math.min(230,W*.55),46,14);X.fill();
  K.text(g.endless?'∞  '+g.passed:g.L.label,hx+12,hy+15,17,'#ffd700',{align:'left',stroke:'#000',lw:3});K.text('🕊 '+g.doveN+(g.endless?'':'/'+g.doveT)+(g.mess?'   💥'+g.mess:''),hx+12,hy+35,15,'#fff',{align:'left'});
  if(!g.endless&&!g.L.boss){const bw=Math.min(230,W*.55)-110,bx=hx+100;X.fillStyle='rgba(255,255,255,.25)';K.rr(bx,hy+9,bw,10,5);X.fill();X.fillStyle='#ffd700';K.rr(bx,hy+9,bw*Math.min(1,g.passed/g.L.gates),10,5);X.fill()}
  if(g.state==='ready'){K.text(g.L.boss?WORLDS[g.wi].boss+'!':g.endless?'ENDLESS GRACE':WORLDS[g.wi].n,W/2,H*.2,30,'#fff',{stroke:'#000',lw:6,max:W-40});K.text('TAP TO FLAP!',W/2,H*.7,34+Math.sin(RT*6)*2,'#ffd700',{stroke:'#4a2a00',lw:6});
   X.globalAlpha=.6+.4*Math.sin(RT*6);K.text('👆',W/2,H*.7+50,40);X.globalAlpha=1}
  if(g.state==='pause')overlay('PAUSED',[['resume','▶ RESUME','#2fae4a',()=>this.resume()],['restart','↻ RESTART','#3a7ac8',()=>startLevel(g.L.i)],['quit',g.endless?'◀ TITLE':'◀ MAP','#7a2a4a',()=>{const e=g.endless;G=null;K.go(e?Title:Map)}]]);
  if(g.state==='mess'&&g.messT>.45){const canF=g.fessLeft>0;overlay('OOPS! MESS UP!',canF?[['fess','🙏 FESS UP','#d08a1a',()=>fessUp()],['restart','↻ RESTART','#3a7ac8',()=>startLevel(g.L.i)],['quit',g.endless?'◀ TITLE':'◀ MAP','#7a2a4a',()=>{const e=g.endless;G=null;K.go(e?Title:Map)}]]:[['end','SEE SCORE ▶','#2fae4a',()=>finish(false)],['restart','↻ TRY AGAIN','#3a7ac8',()=>startLevel(-1)]],
   canF?(g.endless?'Fess up once per run to keep going!':'Everybody messes up. Fess up and keep flying!'):'No more fess-ups this run.')}
  if(g.state==='done'&&g.won&&!g.endless)K.text(g.L.boss?'THE BOOK OF HEAVEN!':'PAGE FOUND!',W/2,H*.25,36,'#ffd700',{stroke:'#6b3d00',lw:7,glow:'#fff38a'})}};
function overlay(title,btns,sub){const W=K.W,H=K.H;X.fillStyle='rgba(10,8,30,.55)';X.fillRect(0,0,W,H);const bw=Math.min(300,W-60),bh=56,gap=12;const tot=btns.length*(bh+gap);
 const land=K.land;const dS=G.s*1.6;let y0;if(land)y0=H/2-tot/2+20;else if(G.y>H*.48)y0=Math.max(K.safe.t+150,Math.min(G.y-32*dS-tot-14,H*.2+90));else{y0=Math.max(G.y+44*dS,H*.42);if(y0+tot>H-K.safe.b-10)y0=H-K.safe.b-10-tot}
 const bx=land?Math.max(G.DX+70*dS,W*.55-bw/2):(W-bw)/2;K.text(title,land?bx+bw/2:W/2,y0-(sub?78:46),34,'#fff',{stroke:'#000',lw:6,max:W-30});if(sub)K.para(sub,land?bx+bw/2:W/2,y0-38,Math.min(W-40,420),17,'#ffe9a8',{stroke:'rgba(0,0,0,.6)',lw:3,center:true});
 btns.forEach((b,i)=>K.button(b[0],bx,y0+i*(bh+gap),bw,bh,b[1],{color:b[2],cb:b[3]}));K.charRects.push({x:G.DX-24*dS,y:G.y-30*dS,w:48*dS,h:62*dS,name:'duncan'})}
/* ---------- boss ---------- */
function bossUpdate(dt,sp){const g=G,b=g.boss,s=g.s,H=K.H,W=K.W;b.x=lerp(b.x||W+120*s,W-(K.land?140:85)*s,dt*1.5);b.y=H*.45+Math.sin(g.t*.9)*H*.22;b.hurt-=dt;
 for(const bm of g.beams)bm.t-=dt;g.beams=g.beams.filter(q=>q.t>0);
 if(b.dead){b.dead+=dt;if(b.dead>1.2&&!g.page)g.page={x:g.cam+W*.75,y:b.y,got:0};return}
 b.cd-=dt;if(b.cd<=0){b.cd=Math.max(1.1,2.3-g.wi*.22)+rand(0,.5);const k=['plane','rock','tape','bolt','gavel'][g.wi];const n=g.wi>=3&&!K.land?2:1;if(K.land)b.cd+=.4;
  for(let j=0;j<n;j++){const ty=clamp(g.y+(j?rand(-120,120)*s:0),50*s,H-80*s);const v=(230+g.wi*15)*s+sp*.2;const T=(b.x-g.DX)/v;g.proj.push({k,x:b.x-40*s,y:b.y,vx:-v,vyy:(ty-b.y)/T,warn:.5,r:0})}K.sfx('warn')}
 b.orb-=dt;if(b.orb<=0){b.orb=1.7+rand(0,.6);g.items.push({x:g.cam+Math.min(W*.62,g.DX+340*s),y:rand(70*s,H-110*s),k:'orb',got:0,vy:rand(-40,40)*s})}
 for(const it of g.items){if(it.k!=='orb'||it.got)continue;it.x-=sp*.35*dt;it.y=clamp(it.y+it.vy*dt,60*s,H-100*s);const sx=it.x-g.cam;if(Math.hypot(sx-g.DX,it.y-g.y)<12.5*s*1.6+22*s){it.got=1;b.hp--;b.hurt=.5;K.sfx('beam');setTimeout(()=>K.sfx('bosshit'),120);
   g.beams.push({x0:g.DX+20*s,y0:g.y,x1:b.x,y1:b.y,t:.4});K.shake=8;K.burst(b.x,b.y,['#ffe066','#fff'],22,260);K.float('-1',b.x,b.y-60*s,'#ffe066',28);if(b.hp<=0){b.dead=.01;g.proj=[];K.sfx('page');K.burst(b.x,b.y,['#ffe066','#fff','#ff4a6a'],60,380)}}}
 g.items=g.items.filter(it=>it.x-g.cam>-40*s);}
function bossDraw(){const g=G,b=g.boss,s=g.s;for(const it of g.items){if(it.k!=='orb'||it.got)continue;const sx=it.x-g.cam;X.save();X.shadowColor='#ffe066';X.shadowBlur=24;X.fillStyle='#fff6a0';X.beginPath();X.arc(sx,it.y,(12+2*Math.sin(RT*8))*s*1.2,0,TAU);X.fill();X.restore();K.text('✦',sx,it.y+1,18*s*1.2,'#d4a017')}
 if(b.dead){if(b.dead<1.2){X.globalAlpha=1-b.dead/1.2;drawBoss(g.wi,b.x,b.y-b.dead*80*s,s*1.1,0,b.mx,0);X.globalAlpha=1}return}drawBoss(g.wi,b.x,b.y,s*1.1,b.hp,b.mx,b.hurt);
 K.text(WORLDS[g.wi].boss,b.x,b.y-110*s,15*s+4,'#fff',{stroke:'#000',lw:4,max:180})}
/* ---------- bot (QA) ---------- */
function bot(dt){const g=G,s=g.s,H=K.H;if(g.state==='mess'&&g.messT>.6){fessUp();return}if(g.state==='ready'){flap();return}if(g.state!=='fly')return;
 let ty=H*.45;const ahead=g.gates.filter(gt=>gt.x+gt.w-g.cam>g.DX-30*s).sort((a,b)=>a.x-b.x)[0];if(ahead)ty=gateY(ahead)+ahead.gap*.1;
 if(g.page&&!g.page.got)ty=g.page.y;if(g.boss&&!g.boss.dead){const o=g.items.filter(i=>i.k==='orb'&&!i.got&&i.x-g.cam>g.DX-10*s).sort((a,b)=>a.x-b.x)[0];if(o)ty=o.y}
 for(const p of g.proj){if(p.warn>0)continue;const dx=p.x-g.DX;const tt=dx/Math.max(1,-p.vx);const py=p.y+(p.vyy||0)*tt;if(dx>-10*s&&dx<320*s&&Math.abs(py-g.y)<85*s){ty=py<g.y?Math.min(H-90*s,py+120*s):Math.max(60*s,py-120*s)}}
 const R=20*s,gv=1500*s,up=(430*s)*(430*s)/(2*gv);const fy=g.y+g.vy*.12+.5*gv*.0144;
 if(ahead&&!(g.page&&!g.page.got)){const cy=gateY(ahead),top=cy-ahead.gap/2,bot=cy+ahead.gap/2,near=ahead.x-g.cam<g.DX+R+200*s;
  if(near){if(g.y+Math.max(0,g.vy)*.1>bot-R-6*s){flap();return}if(fy>cy&&g.y-up-R>top+4*s&&g.vy>-60*s)flap();return}}
 if(fy>ty+8*s&&g.vy>-60*s)flap()}
/* ---------- result ---------- */
const Result={menu:true,primary:'next',enter(){this.t=0;K.music.play(SONG_T);if(!G.endless&&G.won)for(let i=0;i<G.stars;i++)setTimeout(()=>K.sfx('star'),400+i*300)},update(dt){RT+=dt;this.t+=dt;K.updFx(dt);if(Math.random()<dt*4)K.burst(rand(0,K.W),-10,['#ffd700','#fff','#ffe9a8'],2,80,{g:120,life:2})},back(){K.go(Map)},
 draw(){const g=G,W=K.W,H=K.H,s=K.safe,land=K.land;bg(g.wi);X.fillStyle='rgba(10,8,30,.5)';X.fillRect(0,0,W,H);
  const cx=land?W*.62:W/2;const dS=S()*1.5*(land?1:1.2);const dx=land?W*.2:W/2,dy=land?H*.55:s.t+130;const r=this.rig||(this.rig=new Rig());r.update(1/60,0);if(Math.random()<.03)r.flap();const p=r.pose(0);
  drawDuncan(dx,dy+Math.sin(RT*2)*6,dS,{wing:p.wing,arms:p.arms,legs:p.legs,emo:'joy'});K.charRects.push({x:dx-30*dS,y:dy-30*dS,w:60*dS,h:62*dS,name:'duncan'});
  let y=land?s.t+50:dy+40*dS+44;
  if(g.endless){K.text('ENDLESS GRACE',cx,y,32,'#ffd700',{stroke:'#000',lw:6});y+=50;K.text(g.passed+' gates',cx,y,40,'#fff',{stroke:'#000',lw:6});y+=44;K.text('Best: '+save.best+'   🕊 '+g.doveN,cx,y,20,'#ffe9a8',{stroke:'#000',lw:4});y+=40}
  else{K.text(g.L.boss?'BOSS BEATEN!':'PAGE FOUND!',cx,y,34,'#ffd700',{stroke:'#000',lw:6,glow:'#fff38a'});y+=52;for(let j=0;j<3;j++){const on=j<g.stars&&this.t>.4+j*.3;K.text('★',cx+(j-1)*54,y,52,on?'#ffd700':'rgba(255,255,255,.25)',{stroke:'#000',lw:4})}y+=46;
   K.text('🕊 '+g.doveN+' / '+g.doveT+'     💥 mess-ups: '+g.mess,cx,y,19,'#fff',{stroke:'#000',lw:4,max:land?W*.6:W-30});y+=34;
   if(g.mess)K.text('Every mess-up was forgiven. 🙏',cx,y,16,'#ffe9a8',{stroke:'#000',lw:3});y+=30}
  const bw=Math.min(150,((land?W*.62:W)-50)/3),bh=56;const bx=cx-(bw*3+20)/2;const by=Math.min(H-s.b-bh-16,y+10);
  const last=!g.endless&&g.L.i===29;const nxt=!g.endless&&g.L.i<29;
  K.button('map',bx,by,bw,bh,g.endless?'◀ TITLE':'◀ MAP',{color:'#4a4f6a',cb:()=>{const e=g.endless;G=null;K.go(e?Title:Map)}});
  K.button('again',bx+bw+10,by,bw,bh,'↻ AGAIN',{color:'#3a7ac8',cb:()=>startLevel(g.endless?-1:g.L.i)});
  K.button('next',bx+2*(bw+10),by,bw,bh,last?'THE END ▶':nxt?'NEXT ▶':'PLAY ▶',{color:'#2fae4a',cb:()=>{if(last){G=null;K.go(new K.Story(ENDING,()=>K.go(Title),{go:'THE END',bg:()=>{bg(4);X.fillStyle='rgba(0,0,0,.2)';X.fillRect(0,0,K.W,K.H)}}))}else if(nxt){const n=g.L.i+1;G=null;K.go(Card,n)}else startLevel(-1)}});
  K.drawFx()}};
/* ---------- boot ---------- */
window.__DK={drawDuncan,Rig,bg,drawPage,drawDove,get G(){return G},LEVELS,save,startLevel,bot:false,flap:()=>flap(),Title,Map};
const imgs={logo:'logoboh.webp'};WORLDS.forEach(w=>imgs[w.img]='art/'+w.img+'.webp');
K.loadImages(imgs,()=>{});K.start(Title);
})();
