import{r as Z,g as J}from"./phaser-Czz4FBZH.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const r of a.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function e(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(s){if(s.ep)return;s.ep=!0;const a=e(s);fetch(s.href,a)}})();var Q=Z();const v=J(Q),H=8,_=1/120,U=1e6,K=760,$=3,tt=1.2,et=.1,st=.35,it=24,at=18,X=1.2,j=1.25,nt=.09,rt=2.2,V=1100,ot=4,lt=1,x=["tank","striker","medic","trickster","sniper","vampire","bulwark"],o={tank:{label:"Tank",description:"Heavy body. Very durable but slower and lower damage.",color:3108827,radius:22,mass:1.65,maxHp:155,speed:165,outgoingDamageMult:.84,incomingDamageMult:.7,wallBounceMult:.9},striker:{label:"Striker",description:"Aggressive burst damage class with high impact attacks.",color:15092540,radius:17,mass:1,maxHp:100,speed:255,outgoingDamageMult:1.35,incomingDamageMult:1,wallBounceMult:1},medic:{label:"Medic",description:"Regenerates health over time, excels in long fights.",color:2339950,radius:18,mass:1.05,maxHp:112,speed:210,outgoingDamageMult:1,incomingDamageMult:.95,wallBounceMult:1,regenPerSecond:4.7},trickster:{label:"Trickster",description:"Dashes periodically and gains speed from wall rebounds.",color:15774761,radius:16,mass:.8,maxHp:92,speed:240,outgoingDamageMult:1.06,incomingDamageMult:1.08,wallBounceMult:1.08,dashCooldown:2.8,dashMultiplier:1.45},sniper:{label:"Sniper",description:"Glass cannon. High impact collisions deal extra precision damage.",color:9390079,radius:15,mass:.9,maxHp:88,speed:230,outgoingDamageMult:1.2,incomingDamageMult:1.08,wallBounceMult:1.02,impactThreshold:210,impactBonusMult:1.55},vampire:{label:"Vampire",description:"Lifesteal class. Heals from damage dealt to enemies.",color:9245247,radius:17,mass:1.02,maxHp:105,speed:218,outgoingDamageMult:1.1,incomingDamageMult:1,wallBounceMult:1,lifesteal:.28},bulwark:{label:"Bulwark",description:"Periodic shield and damage reflection (thorns).",color:5534074,radius:20,mass:1.35,maxHp:130,speed:185,outgoingDamageMult:.96,incomingDamageMult:.92,wallBounceMult:.96,shieldCooldown:4.4,shieldDuration:1.2,shieldReductionMult:.45,thorns:.2}},R={arenaWidth:980,arenaHeight:640,classCounts:{tank:4,striker:5,medic:3,trickster:4,sniper:3,vampire:3,bulwark:3}},Y=[[1,.6],[1,-.6],[-1,.6],[-1,-.6],[.6,1],[-.6,1],[.6,-1],[-.6,-1],[.25,1],[-.25,1]],p=(n,t,e)=>Math.min(e,Math.max(t,n)),I=n=>Math.round(n*U)/U,A=n=>`#${o[n].color.toString(16).padStart(6,"0")}`;function ct(n){return btoa(unescape(encodeURIComponent(n))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")}function ht(n){const t=n.replace(/-/g,"+").replace(/_/g,"/"),e=t.length%4===0?"":"=".repeat(4-t.length%4);return decodeURIComponent(escape(atob(t+e)))}function ut(n){const t={w:C(n.arenaWidth,R.arenaWidth),h:C(n.arenaHeight,R.arenaHeight),c:x.reduce((e,i)=>(e[i]=W(n.classCounts[i]),e),{})};return ct(JSON.stringify(t))}function dt(n){var t;try{const e=JSON.parse(ht(n));if(!e||typeof e!="object")return null;const i={};for(const s of x)i[s]=W((t=e.c)==null?void 0:t[s]);return{arenaWidth:C(e.w,R.arenaWidth),arenaHeight:C(e.h,R.arenaHeight),classCounts:i}}catch{return null}}function pt(){const t=new URL(window.location.href).searchParams.get("setup");return t?dt(t):null}const z=pt()??structuredClone(R);function W(n){const t=Number.parseInt(n,10);return!Number.isFinite(t)||Number.isNaN(t)?0:p(t,0,90)}function C(n,t){const e=Number.parseInt(n,10);return!Number.isFinite(e)||Number.isNaN(e)?t:p(e,420,2200)}function ft(n,t,e,i,s,a){const r=o[t];return{id:n,classKey:t,classLabel:r.label,r:r.radius,mass:r.mass,x:e,y:i,vx:s,vy:a,hp:r.maxHp,maxHp:r.maxHp,color:r.color,alive:!0,abilityState:{tricksterDashTimer:r.dashCooldown??0,bulwarkShieldCooldown:r.shieldCooldown??0,bulwarkShieldTimeLeft:0}}}function gt(n){const t=[];for(const e of x){const i=W(n[e]);for(let s=0;s<i;s+=1)t.push(e)}return t}function xt(n){const t=gt(n.classCounts);t.length===0&&t.push("tank");const e=t.length,i=Math.max(1,Math.ceil(Math.sqrt(e*(n.arenaWidth/n.arenaHeight)))),s=Math.max(1,Math.ceil(e/i)),a=Math.max(50,Math.min(130,n.arenaWidth*.12)),r=Math.max(50,Math.min(130,n.arenaHeight*.12)),c=Math.max(0,n.arenaWidth-a*2),d=Math.max(0,n.arenaHeight-r*2),h=[];for(let l=0;l<e;l+=1){const f=t[l],m=o[f],D=l%i,B=Math.floor(l/i),b=i>1?a+c*D/(i-1):n.arenaWidth/2,S=s>1?r+d*B/(s-1):n.arenaHeight/2,[w,u]=Y[l%Y.length],g=Math.hypot(w,u)||1,T=w/g*m.speed,N=u/g*m.speed;h.push(ft(l,f,b,S,T,N))}return h}function mt(){if(document.getElementById("ball-controls-style"))return;const n=document.createElement("style");n.id="ball-controls-style",n.textContent=`
    body {
      background:
        linear-gradient(0deg, rgba(25, 26, 35, 0.72), rgba(25, 26, 35, 0.72)),
        repeating-linear-gradient(
          0deg,
          #2b2f3b 0 6px,
          #232733 6px 12px
        );
    }
    canvas {
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
    #ball-controls {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 50;
      width: 292px;
      max-height: calc(100vh - 20px);
      overflow: auto;
      background: rgba(11, 13, 18, 0.92);
      color: #f3f4f6;
      border: 2px solid #4b5563;
      border-radius: 8px;
      padding: 12px;
      font-family: "Consolas", "Courier New", monospace;
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
      user-select: none;
    }
    #ball-controls .status {
      margin-bottom: 8px;
      border: 1px solid #374151;
      border-radius: 6px;
      background: linear-gradient(180deg, rgba(29, 40, 59, 0.9), rgba(17, 24, 39, 0.9));
      padding: 8px;
      font-size: 12px;
      line-height: 1.35;
    }
    #ball-controls .status strong {
      color: #fef08a;
    }
    #ball-controls h2 {
      margin: 0 0 10px;
      font-size: 15px;
      font-weight: 700;
    }
    #ball-controls .row {
      display: grid;
      grid-template-columns: 1fr 80px;
      gap: 8px;
      align-items: center;
      margin-bottom: 6px;
    }
    #ball-controls label {
      font-size: 12px;
      opacity: 0.93;
    }
    #ball-controls input {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #374151;
      border-radius: 4px;
      padding: 5px 6px;
      font-size: 12px;
      background: #111827;
      color: #f9fafb;
      font-family: inherit;
    }
    #ball-controls .actions {
      display: grid;
      margin-top: 8px;
      margin-bottom: 10px;
      gap: 6px;
    }
    #ball-controls button {
      border: 0;
      border-radius: 6px;
      padding: 8px 9px;
      cursor: pointer;
      font-weight: 700;
      font-size: 12px;
      background: #f59e0b;
      color: #111827;
      font-family: inherit;
    }
    #ball-controls .hint {
      margin-top: 8px;
      font-size: 11px;
      color: #d1d5db;
      line-height: 1.3;
    }
    #ball-controls .subsection {
      margin-top: 10px;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #a5f3fc;
    }
    #ball-controls .drop-zone {
      min-height: 48px;
      border: 2px dashed #4b5563;
      border-radius: 8px;
      padding: 6px;
      background: rgba(15, 23, 42, 0.7);
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
    }
    #ball-controls .drop-zone.active {
      border-color: #22d3ee;
      background: rgba(12, 74, 110, 0.4);
    }
    #ball-controls .chip {
      display: inline-flex;
      align-items: center;
      border: 1px solid #111827;
      border-radius: 12px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 700;
      color: #e5e7eb;
      cursor: grab;
      white-space: nowrap;
    }
    #ball-controls .chip.saved {
      cursor: pointer;
      border-color: #e5e7eb;
    }
    #ball-controls .link-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 6px;
      margin-bottom: 8px;
    }
    #ball-controls .link-row input {
      background: #030712;
      border-color: #4b5563;
      font-size: 11px;
    }
    #ball-controls .mini {
      background: #67e8f9;
      color: #0f172a;
      padding: 6px 8px;
      font-size: 11px;
    }
    #ball-controls .desc-title {
      margin-top: 6px;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #fde68a;
    }
    #ball-controls .class-desc {
      margin: 0 0 6px;
      font-size: 11px;
      line-height: 1.35;
      color: #d1d5db;
    }
    #ball-controls .swatch {
      display: inline-block;
      width: 9px;
      height: 9px;
      border: 1px solid #111827;
      margin-right: 6px;
      vertical-align: middle;
    }
  `,document.head.appendChild(n)}function yt(n){mt();let t=document.getElementById("ball-controls");t||(t=document.createElement("div"),t.id="ball-controls",document.body.appendChild(t));const e=x.map(u=>`
      <div class="row">
        <label for="count_${u}">${o[u].label}</label>
        <input id="count_${u}" data-class-key="${u}" type="number" min="0" max="90" />
      </div>
    `).join(""),i=x.map(u=>`<p class="class-desc"><span class="swatch" style="background:${A(u)}"></span><strong>${o[u].label}:</strong> ${o[u].description}</p>`).join("");t.innerHTML=`
    <h2>Pixel Arena Controls</h2>
    <div id="roundStatus" class="status">Round running...</div>
    <div class="row">
      <label for="arenaWidth">Arena Width</label>
      <input id="arenaWidth" type="number" min="420" max="2200" />
    </div>
    <div class="row">
      <label for="arenaHeight">Arena Height</label>
      <input id="arenaHeight" type="number" min="420" max="2200" />
    </div>
    ${e}
    <div class="actions">
      <button id="applySetupBtn" type="button">Apply Setup + Reset</button>
      <button id="resetRoundBtn" type="button">Reset Round</button>
    </div>
    <div class="subsection">Round Survivors (drag)</div>
    <div id="survivorPool" class="drop-zone"></div>
    <div class="subsection">Next Round Box (drop here)</div>
    <div id="nextRoundBox" class="drop-zone"></div>
    <div class="actions">
      <button id="useNextRoundBtn" type="button">Use Box For Next Round</button>
    </div>
    <div class="subsection">Share Setup Link</div>
    <div class="link-row">
      <input id="shareLinkOut" type="text" readonly />
      <button id="copyLinkBtn" class="mini" type="button">Copy</button>
    </div>
    <div class="actions">
      <button id="generateLinkBtn" type="button">Generate Link</button>
    </div>
    <div class="desc-title">Class Descriptions</div>
    ${i}
    <div class="hint">R = reset | F = fast-forward | P = pause</div>
    <div class="hint">Tip: drag survivor chips into Next Round Box, then press Use Box For Next Round.</div>
  `;const s=t.querySelector("#arenaWidth"),a=t.querySelector("#arenaHeight"),r=t.querySelector("#roundStatus"),c=t.querySelector("#survivorPool"),d=t.querySelector("#nextRoundBox"),h=t.querySelector("#shareLinkOut"),l=t.querySelector("#applySetupBtn"),f=t.querySelector("#resetRoundBtn"),m=t.querySelector("#useNextRoundBtn"),D=t.querySelector("#generateLinkBtn"),B=t.querySelector("#copyLinkBtn"),b=t.querySelectorAll("[data-class-key]");n.ui={root:t,arenaWidthEl:s,arenaHeightEl:a,roundStatusEl:r,survivorPoolEl:c,nextRoundBoxEl:d,shareLinkOutEl:h,countInputs:b},n.syncControlInputs();const S=()=>d.classList.add("active"),w=()=>d.classList.remove("active");d.addEventListener("dragover",u=>{u.preventDefault(),S()}),d.addEventListener("dragleave",()=>{w()}),d.addEventListener("drop",u=>{var T;u.preventDefault();const g=(T=u.dataTransfer)==null?void 0:T.getData("text/classKey");if(!g||!o[g]){w();return}n.addClassToNextRoundBox(g),w()}),l.addEventListener("click",()=>{const u={};for(const g of b)u[g.dataset.classKey]=W(g.value);n.applySetup({arenaWidth:C(s.value,n.setup.arenaWidth),arenaHeight:C(a.value,n.setup.arenaHeight),classCounts:u}),n.syncControlInputs()}),f.addEventListener("click",()=>{n.resetSimulation(),n.syncControlInputs()}),m.addEventListener("click",()=>{n.applyNextRoundBox(),n.syncControlInputs()}),D.addEventListener("click",()=>{h.value=n.generateShareLink(),h.select()}),B.addEventListener("click",async()=>{h.value||(h.value=n.generateShareLink());try{await navigator.clipboard.writeText(h.value),r.innerHTML=`${r.innerHTML}<br /><strong>Link copied.</strong>`}catch{h.select(),document.execCommand("copy")}}),n.updateRoundPanels()}class vt extends v.Scene{constructor(){super("main"),this.graphics=null,this.hudText=null,this.winnerText=null,this.accumulator=0,this.stepCounter=0,this.fastForward=!1,this.paused=!1,this.initialState=[],this.balls=[],this.setup=structuredClone(z),this.effects=[],this.simTime=0,this.lastDamageTimesByPair=new Map,this.lastPairPruneAt=0,this.roundFinished=!1,this.winnerClassKey=null,this.nextRoundBoxClasses=[],this.ui=null,this.pixelMaskCache=new Map}create(){this.cameras.main.setBackgroundColor(1711398),this.graphics=this.add.graphics(),this.hudText=this.add.text(12,12,"",{fontFamily:"Consolas, monospace",fontSize:"15px",color:"#f3f4f6"}),this.hudText.setDepth(10),this.winnerText=this.add.text(0,0,"",{fontFamily:"Consolas, monospace",fontSize:"26px",color:"#f8fafc",fontStyle:"bold"}),this.winnerText.setDepth(12),this.winnerText.setOrigin(.5,.5),this.winnerText.setVisible(!1),this.input.keyboard.on("keydown-R",()=>{this.resetSimulation()}),this.input.keyboard.on("keydown-F",()=>{this.fastForward=!this.fastForward}),this.input.keyboard.on("keydown-P",()=>{this.paused=!this.paused}),yt(this),this.rebuildInitialState()}syncControlInputs(){if(this.ui){this.ui.arenaWidthEl.value=String(this.setup.arenaWidth),this.ui.arenaHeightEl.value=String(this.setup.arenaHeight);for(const t of this.ui.countInputs)t.value=String(this.setup.classCounts[t.dataset.classKey]??0)}}getCurrentClassCounts(){const t=Object.fromEntries(x.map(e=>[e,0]));for(const e of this.balls)t[e.classKey]+=1;return t}evaluateWinnerState(){if(this.roundFinished)return;if(this.balls.length===0){this.roundFinished=!0,this.winnerClassKey=null,this.paused=!0,this.updateRoundPanels();return}new Set(this.balls.map(e=>e.classKey)).size<=1&&(this.roundFinished=!0,this.winnerClassKey=this.balls[0].classKey,this.paused=!0,this.effects.push({type:"ring",x:this.balls[0].x,y:this.balls[0].y,color:this.balls[0].color,life:.7,radius:this.balls[0].r+6}),this.updateRoundPanels())}getSurvivorDraftPool(){return this.roundFinished?[...this.balls].sort((t,e)=>e.hp-t.hp||t.id-e.id).map(t=>({id:t.id,classKey:t.classKey,label:`${o[t.classKey].label} #${t.id} (${Math.round(t.hp)})`})):[]}addClassToNextRoundBox(t){!o[t]||this.nextRoundBoxClasses.length>=90||(this.nextRoundBoxClasses.push(t),this.updateRoundPanels())}applyNextRoundBox(){if(this.nextRoundBoxClasses.length===0)return;const t=Object.fromEntries(x.map(e=>[e,0]));for(const e of this.nextRoundBoxClasses)t[e]+=1;this.nextRoundBoxClasses=[],this.applySetup({arenaWidth:this.setup.arenaWidth,arenaHeight:this.setup.arenaHeight,classCounts:t}),this.updateRoundPanels()}generateShareLink(){var s;const t=ut(this.setup),e=new URL(window.location.href);e.searchParams.set("setup",t);const i=e.toString();return window.history.replaceState({},"",i),(s=this.ui)!=null&&s.shareLinkOutEl&&(this.ui.shareLinkOutEl.value=i),i}updateRoundPanels(){if(!this.ui)return;this.roundFinished?this.winnerClassKey?this.ui.roundStatusEl.innerHTML=`Winner: <strong style="color:${A(this.winnerClassKey)}">${o[this.winnerClassKey].label}</strong> (${this.balls.length} left)`:this.ui.roundStatusEl.innerHTML="<strong>Draw:</strong> everyone eliminated":this.ui.roundStatusEl.textContent=`Round running... alive ${this.balls.length}`,this.ui.survivorPoolEl.innerHTML="";const t=this.getSurvivorDraftPool();if(t.length===0){const e=document.createElement("span");e.textContent=this.roundFinished?"No survivors to draft.":"Survivors unlock when round ends.",e.style.fontSize="11px",e.style.color="#94a3b8",this.ui.survivorPoolEl.appendChild(e)}else for(const e of t){const i=document.createElement("span");i.className="chip",i.textContent=e.label,i.style.background=A(e.classKey),i.draggable=!0,i.addEventListener("dragstart",s=>{var a;(a=s.dataTransfer)==null||a.setData("text/classKey",e.classKey),s.dataTransfer.effectAllowed="copy"}),this.ui.survivorPoolEl.appendChild(i)}if(this.ui.nextRoundBoxEl.innerHTML="",this.nextRoundBoxClasses.length===0){const e=document.createElement("span");e.textContent="Drop survivor chips here.",e.style.fontSize="11px",e.style.color="#94a3b8",this.ui.nextRoundBoxEl.appendChild(e)}else for(let e=0;e<this.nextRoundBoxClasses.length;e+=1){const i=this.nextRoundBoxClasses[e],s=document.createElement("span");s.className="chip saved",s.textContent=`${o[i].label} ${e+1}`,s.style.background=A(i),s.title="Click to remove",s.addEventListener("click",()=>{this.nextRoundBoxClasses.splice(e,1),this.updateRoundPanels()}),this.ui.nextRoundBoxEl.appendChild(s)}this.ui.shareLinkOutEl.value||(this.ui.shareLinkOutEl.value=this.generateShareLink())}applySetup(t){const e={};for(const s of x)e[s]=W(t.classCounts[s]);x.reduce((s,a)=>s+e[a],0)===0&&(e.tank=1),this.setup={arenaWidth:C(t.arenaWidth,R.arenaWidth),arenaHeight:C(t.arenaHeight,R.arenaHeight),classCounts:e},this.scale.resize(this.setup.arenaWidth,this.setup.arenaHeight),this.cameras.main.setSize(this.setup.arenaWidth,this.setup.arenaHeight),this.rebuildInitialState(),this.generateShareLink()}rebuildInitialState(){this.initialState=xt(this.setup),this.resetSimulation()}resetSimulation(){this.balls=this.initialState.map(t=>({...t,abilityState:{...t.abilityState}})),this.effects=[],this.stepCounter=0,this.accumulator=0,this.fastForward=!1,this.paused=!1,this.simTime=0,this.lastDamageTimesByPair.clear(),this.lastPairPruneAt=0,this.roundFinished=!1,this.winnerClassKey=null,this.renderScene(),this.updateRoundPanels()}update(t,e){if(this.paused){this.renderScene();return}this.accumulator+=e/1e3,this.accumulator=Math.min(this.accumulator,.25);const i=this.fastForward?ot:lt;let s=0;for(;this.accumulator>=_&&s<i;)this.simulateStep(_),this.accumulator-=_,s+=1;this.renderScene()}simulateStep(t){const e=this.balls.filter(a=>a.alive).sort((a,r)=>a.id-r.id),i=new Map,s=new Map;this.simTime+=t;for(const a of e)this.applyPerStepAbilities(a,t),a.x+=a.vx*t,a.y+=a.vy*t,this.resolveWallCollision(a),this.spawnTrail(a);for(let a=0;a<e.length;a+=1)for(let r=a+1;r<e.length;r+=1)this.resolveBallCollision(e[a],e[r],i,s);for(const a of e){const r=i.get(a.id)??0,c=s.get(a.id)??0;a.hp=p(a.hp-r+c,0,a.maxHp),a.hp<=0&&(a.alive=!1)}this.balls=this.balls.filter(a=>a.alive);for(const a of this.balls)this.capSpeed(a),a.x=I(a.x),a.y=I(a.y),a.vx=I(a.vx),a.vy=I(a.vy);this.pruneCollisionDamageCache(),this.evaluateWinnerState(),this.updateEffects(t),this.stepCounter+=1,this.stepCounter%15===0&&this.updateRoundPanels()}applyPerStepAbilities(t,e){const i=o[t.classKey];i.regenPerSecond&&(t.hp=Math.min(t.maxHp,t.hp+i.regenPerSecond*e),(this.stepCounter+t.id)%28===0&&this.effects.push({type:"plus",x:t.x,y:t.y-t.r-7,color:6747034,life:.22})),t.classKey==="trickster"&&(t.abilityState.tricksterDashTimer-=e,t.abilityState.tricksterDashTimer<=0&&(t.vx*=i.dashMultiplier,t.vy*=i.dashMultiplier,t.abilityState.tricksterDashTimer=i.dashCooldown,this.effects.push({type:"ring",x:t.x,y:t.y,color:16768358,life:.35,radius:t.r}))),t.classKey==="bulwark"&&(t.abilityState.bulwarkShieldTimeLeft>0?t.abilityState.bulwarkShieldTimeLeft=Math.max(0,t.abilityState.bulwarkShieldTimeLeft-e):(t.abilityState.bulwarkShieldCooldown-=e,t.abilityState.bulwarkShieldCooldown<=0&&(t.abilityState.bulwarkShieldTimeLeft=i.shieldDuration,t.abilityState.bulwarkShieldCooldown=i.shieldCooldown,this.effects.push({type:"ring",x:t.x,y:t.y,color:11989503,life:.42,radius:t.r+2}))))}resolveWallCollision(t){const e=t.r,i=this.setup.arenaWidth-t.r,s=t.r,a=this.setup.arenaHeight-t.r,r=o[t.classKey].wallBounceMult??1;let c=!1;t.x<e?(t.x=e,t.vx=Math.abs(t.vx)*r,c=!0):t.x>i&&(t.x=i,t.vx=-Math.abs(t.vx)*r,c=!0),t.y<s?(t.y=s,t.vy=Math.abs(t.vy)*r,c=!0):t.y>a&&(t.y=a,t.vy=-Math.abs(t.vy)*r,c=!0),c&&this.effects.push({type:"spark",x:t.x,y:t.y,color:14212841,life:.2})}resolveBallCollision(t,e,i,s){const a=e.x-t.x,r=e.y-t.y,c=t.r+e.r,d=a*a+r*r;if(d>=c*c)return;let h=Math.sqrt(d),l=1,f=0;h>0?(l=a/h,f=r/h):h=0;const m=c-h;if(m>0){const y=1/t.mass,k=1/e.mass,M=y+k;t.x-=l*m*(y/M),t.y-=f*m*(y/M),e.x+=l*m*(k/M),e.y+=f*m*(k/M)}const D=e.vx-t.vx,B=e.vy-t.vy,b=D*l+B*f,S=Math.max(0,-b),w=Math.max(0,t.vx*l+t.vy*f),u=Math.max(0,-(e.vx*l+e.vy*f)),g=p(w/K*X,0,j),T=p(u/K*X,0,j),N=this.getPairKey(t.id,e.id),E=this.canDealCollisionDamage(N);let F=0,O=0;if(E&&S>=at){const y=p(tt+et*S,st,it);F=y*(1+g),O=y*(1+T)}t.classKey==="sniper"&&S>=o.sniper.impactThreshold&&(F*=o.sniper.impactBonusMult),e.classKey==="sniper"&&S>=o.sniper.impactThreshold&&(O*=o.sniper.impactBonusMult),t.classKey==="striker"&&t.hp/t.maxHp<.35&&(F*=1.2),e.classKey==="striker"&&e.hp/e.maxHp<.35&&(O*=1.2);let L=F*o[t.classKey].outgoingDamageMult*o[e.classKey].incomingDamageMult,P=O*o[e.classKey].outgoingDamageMult*o[t.classKey].incomingDamageMult;if(t.classKey==="bulwark"&&t.abilityState.bulwarkShieldTimeLeft>0&&(P*=o.bulwark.shieldReductionMult),e.classKey==="bulwark"&&e.abilityState.bulwarkShieldTimeLeft>0&&(L*=o.bulwark.shieldReductionMult),E&&(P>0||L>0)&&(this.lastDamageTimesByPair.set(N,this.simTime),i.set(t.id,(i.get(t.id)??0)+P),i.set(e.id,(i.get(e.id)??0)+L)),E&&t.classKey==="vampire"&&s.set(t.id,(s.get(t.id)??0)+L*o.vampire.lifesteal),E&&e.classKey==="vampire"&&s.set(e.id,(s.get(e.id)??0)+P*o.vampire.lifesteal),E&&t.classKey==="bulwark"&&t.abilityState.bulwarkShieldTimeLeft>0&&i.set(e.id,(i.get(e.id)??0)+P*o.bulwark.thorns),E&&e.classKey==="bulwark"&&e.abilityState.bulwarkShieldTimeLeft>0&&i.set(t.id,(i.get(t.id)??0)+L*o.bulwark.thorns),this.effects.push({type:"spark",x:(t.x+e.x)*.5,y:(t.y+e.y)*.5,color:16777215,life:p(.14+S/900,.14,.36)}),b<0){const y=1/t.mass,k=1/e.mass,M=-1.98*b/(y+k),q=M*l,G=M*f;t.vx-=q*y,t.vy-=G*y,e.vx+=q*k,e.vy+=G*k}}capSpeed(t){const e=t.vx*t.vx+t.vy*t.vy,i=K*K;if(e>i){const s=Math.sqrt(e),a=K/s;t.vx*=a,t.vy*=a}}getPairKey(t,e){return t<e?`${t}:${e}`:`${e}:${t}`}canDealCollisionDamage(t){const e=this.lastDamageTimesByPair.get(t);return e==null?!0:this.simTime-e>=nt}pruneCollisionDamageCache(){if(!(this.simTime-this.lastPairPruneAt<.6)){this.lastPairPruneAt=this.simTime;for(const[t,e]of this.lastDamageTimesByPair.entries())this.simTime-e>rt&&this.lastDamageTimesByPair.delete(t)}}spawnTrail(t){Math.hypot(t.vx,t.vy)<200||(this.stepCounter+t.id)%3===0&&this.effects.push({type:"trail",x:t.x,y:t.y,color:t.color,life:.18})}updateEffects(t){for(const e of this.effects)e.life-=t;this.effects=this.effects.filter(e=>e.life>0),this.effects.length>V&&(this.effects=this.effects.slice(this.effects.length-V))}getPixelMask(t){if(this.pixelMaskCache.has(t))return this.pixelMaskCache.get(t);const e=[];for(let i=-t;i<=t;i+=$)for(let s=-t;s<=t;s+=$)s*s+i*i<=t*t&&e.push([s,i]);return this.pixelMaskCache.set(t,e),e}drawPixelBall(t){const e=t.r,i=v.Display.Color.IntegerToColor(t.color),s=v.Display.Color.GetColor(p(i.red+48,0,255),p(i.green+48,0,255),p(i.blue+48,0,255)),a=v.Display.Color.GetColor(p(i.red-42,0,255),p(i.green-42,0,255),p(i.blue-42,0,255)),r=this.getPixelMask(e);for(const[d,h]of r){let l=t.color;d+h<-e*.25?l=s:d+h>e*.4&&(l=a),this.graphics.fillStyle(l,1),this.graphics.fillRect(t.x+d,t.y+h,$,$)}this.graphics.fillStyle(1118481,1),this.graphics.fillRect(t.x-e,t.y-e,e*2,1),this.graphics.fillRect(t.x-e,t.y+e-1,e*2,1),this.graphics.fillRect(t.x-e,t.y-e,1,e*2),this.graphics.fillRect(t.x+e-1,t.y-e,1,e*2)}drawClassArt(t){const e=Math.round(t.x),i=Math.round(t.y);t.r,this.graphics.fillStyle(724760,.95),t.classKey==="tank"?(this.graphics.fillRect(e-4,i-4,8,8),this.graphics.fillRect(e-8,i-1,16,2)):t.classKey==="striker"?(this.graphics.fillRect(e+2,i-7,2,6),this.graphics.fillRect(e-4,i-1,10,2),this.graphics.fillRect(e-8,i+5,2,2)):t.classKey==="medic"?(this.graphics.fillRect(e-1,i-6,2,12),this.graphics.fillRect(e-6,i-1,12,2)):t.classKey==="trickster"?(this.graphics.fillRect(e-6,i+2,12,2),this.graphics.fillRect(e-2,i-6,2,8),this.graphics.fillRect(e+2,i-6,2,8)):t.classKey==="sniper"?(this.graphics.fillRect(e-7,i-1,14,2),this.graphics.fillRect(e+6,i-2,2,4)):t.classKey==="vampire"?(this.graphics.fillRect(e-5,i-4,3,8),this.graphics.fillRect(e+2,i-4,3,8),this.graphics.fillRect(e-2,i+2,4,4)):t.classKey==="bulwark"&&(this.graphics.fillRect(e-6,i-5,12,10),this.graphics.fillStyle(12571866,.9),this.graphics.fillRect(e-1,i-3,2,6))}drawEffects(){for(const t of this.effects){const e=p(t.life*4,0,1);t.type==="trail"?(this.graphics.fillStyle(t.color,e*.5),this.graphics.fillRect(t.x-2,t.y-2,4,4)):t.type==="spark"?(this.graphics.fillStyle(t.color,e),this.graphics.fillRect(t.x-1,t.y-1,3,3),this.graphics.fillRect(t.x-5,t.y-1,2,2),this.graphics.fillRect(t.x+3,t.y-1,2,2),this.graphics.fillRect(t.x-1,t.y-5,2,2),this.graphics.fillRect(t.x-1,t.y+3,2,2)):t.type==="ring"?(this.graphics.lineStyle(2,t.color,e),this.graphics.strokeCircle(t.x,t.y,(t.radius??10)+(1-e)*6)):t.type==="plus"&&(this.graphics.fillStyle(t.color,e),this.graphics.fillRect(t.x-1,t.y-4,2,8),this.graphics.fillRect(t.x-4,t.y-1,8,2))}}renderScene(){this.graphics.clear(),this.graphics.fillStyle(2106416,1),this.graphics.fillRect(0,0,this.setup.arenaWidth,this.setup.arenaHeight),this.graphics.fillStyle(2304056,1);for(let s=0;s<this.setup.arenaHeight;s+=24)for(let a=s/24%2===0?0:12;a<this.setup.arenaWidth;a+=24)this.graphics.fillRect(a,s,12,12);this.graphics.lineStyle(H,12502480,1),this.graphics.strokeRect(H/2,H/2,this.setup.arenaWidth-H,this.setup.arenaHeight-H),this.graphics.fillStyle(725536,.2),this.graphics.fillRect(0,0,this.setup.arenaWidth,40),this.graphics.fillRect(0,this.setup.arenaHeight-40,this.setup.arenaWidth,40);for(const s of this.balls){this.drawPixelBall(s),this.drawClassArt(s),s.classKey==="bulwark"&&s.abilityState.bulwarkShieldTimeLeft>0&&(this.graphics.lineStyle(2,11071743,.8),this.graphics.strokeCircle(s.x,s.y,s.r+4));const a=s.r*2,r=4,c=p(s.hp/s.maxHp,0,1),d=s.x-a/2,h=s.y-s.r-11;this.graphics.fillStyle(1053462,1),this.graphics.fillRect(d,h,a,r);const l=v.Display.Color.Interpolate.ColorWithColor(v.Display.Color.ValueToColor(14498876),v.Display.Color.ValueToColor(3524938),100,Math.floor(c*100));this.graphics.fillStyle(v.Display.Color.GetColor(l.r,l.g,l.b),1),this.graphics.fillRect(d+1,h+1,(a-2)*c,r-2)}if(this.drawEffects(),this.roundFinished){const s=Math.min(520,this.setup.arenaWidth-60),a=54,r=(this.setup.arenaWidth-s)/2,c=20;this.graphics.fillStyle(396054,.82),this.graphics.fillRect(r,c,s,a),this.graphics.lineStyle(2,this.winnerClassKey?o[this.winnerClassKey].color:16317180,1),this.graphics.strokeRect(r,c,s,a),this.graphics.fillStyle(16317180,1),this.graphics.fillRect(r+18,c+20,s-36,2);const d=this.winnerClassKey?`${o[this.winnerClassKey].label} WINS`:"DRAW";this.winnerText.setVisible(!0),this.winnerText.setText(d),this.winnerText.setColor(this.winnerClassKey?A(this.winnerClassKey):"#f8fafc"),this.winnerText.setPosition(this.setup.arenaWidth/2,c+a/2)}else this.winnerText.setVisible(!1);const t=x.map(s=>`${o[s].label}:${this.setup.classCounts[s]}`).join(" "),e=this.getCurrentClassCounts(),i=x.map(s=>`${o[s].label}:${e[s]}`).join(" ");this.hudText.setText(`step:${this.stepCounter}  alive:${this.balls.length}  size:${this.setup.arenaWidth}x${this.setup.arenaHeight}
setup:${t}
alive:${i}
fast-forward:${this.fastForward?"ON":"OFF"}  paused:${this.paused?"ON":"OFF"}${this.roundFinished?`
winner:${this.winnerClassKey?o[this.winnerClassKey].label:"Draw"}`:""}`)}}const St={type:v.AUTO,width:z.arenaWidth,height:z.arenaHeight,backgroundColor:"#1a1d26",pixelArt:!0,antialias:!1,roundPixels:!0,scene:vt};new v.Game(St);
