import{r as yt,g as xt}from"./phaser-Czz4FBZH.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function e(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(i){if(i.ep)return;i.ep=!0;const o=e(i);fetch(i.href,o)}})();var vt=yt();const M=xt(vt),A=8,G=1/120,Z=1e6,I=760,F=3,bt=1.2,St=.1,Ct=.35,wt=24,Mt=18,J=1.2,Q=1.25,kt=.09,Tt=2.2,tt=1100,j=420,Lt=4,Rt=1,et=["standard","crossfire","sanctum","gauntlet"],st=["none","iron_wall","glass_cannon","turbo"],B={hp:{label:"HP",maxLevel:6,baseCost:120,costScale:1.35,hpPerLevel:.08},speed:{label:"Speed",maxLevel:6,baseCost:115,costScale:1.32,speedPerLevel:.06},mastery:{label:"Mastery",maxLevel:6,baseCost:140,costScale:1.4,outgoingPerLevel:.05,incomingReductionPerLevel:.03}},m=["tank","striker","medic","trickster","sniper","vampire","bulwark","splitter","boss"],h={tank:{label:"Tank",description:"Heavy body. Very durable but slower and lower damage.",color:3108827,radius:22,mass:1.65,maxHp:148,speed:175,outgoingDamageMult:.9,incomingDamageMult:.74,wallBounceMult:.9},striker:{label:"Striker",description:"Aggressive burst damage class with high impact attacks.",color:15092540,radius:17,mass:1,maxHp:100,speed:255,outgoingDamageMult:1.24,incomingDamageMult:1.02,wallBounceMult:1},medic:{label:"Medic",description:"Regenerates health over time, excels in long fights.",color:2339950,radius:18,mass:1.05,maxHp:112,speed:210,outgoingDamageMult:1,incomingDamageMult:.95,wallBounceMult:1,regenPerSecond:4.2},trickster:{label:"Trickster",description:"Dashes periodically and gains speed from wall rebounds.",color:15774761,radius:16,mass:.8,maxHp:92,speed:240,outgoingDamageMult:1.06,incomingDamageMult:1.08,wallBounceMult:1.08,dashCooldown:2.8,dashMultiplier:1.45},sniper:{label:"Sniper",description:"Glass cannon. High impact collisions deal extra precision damage.",color:9390079,radius:15,mass:.9,maxHp:88,speed:230,outgoingDamageMult:1.17,incomingDamageMult:1.1,wallBounceMult:1.02,impactThreshold:210,impactBonusMult:1.55},vampire:{label:"Vampire",description:"Lifesteal class. Heals from damage dealt to enemies.",color:9245247,radius:17,mass:1.02,maxHp:105,speed:218,outgoingDamageMult:1.1,incomingDamageMult:1,wallBounceMult:1,lifesteal:.24},bulwark:{label:"Bulwark",description:"Periodic shield and damage reflection (thorns).",color:5534074,radius:20,mass:1.35,maxHp:130,speed:185,outgoingDamageMult:.96,incomingDamageMult:.92,wallBounceMult:.96,shieldCooldown:4.4,shieldDuration:1.2,shieldReductionMult:.5,thorns:.17},splitter:{label:"Splitter",description:"Every heavy hit can split it into two smaller fragments.",color:1292454,radius:16,mass:.86,maxHp:90,speed:230,outgoingDamageMult:.95,incomingDamageMult:1.06,wallBounceMult:1.05,splitImpactThreshold:0,splitCooldown:.24,maxSplitDepth:2,childHpRatio:.52,childRadiusMult:.78,childSpeedMult:1.1},boss:{label:"Boss",description:"Huge elite ball with massive health, high knockback, and damage resistance.",color:14251782,radius:28,mass:2.3,maxHp:252,speed:165,outgoingDamageMult:1.05,incomingDamageMult:.7,wallBounceMult:.9,bonusDamageReduction:.98,shockwaveIntervalSteps:8}},D={arenaWidth:980,arenaHeight:640,classCounts:{tank:4,striker:5,medic:3,trickster:4,sniper:3,vampire:3,bulwark:3,splitter:3,boss:1}},it=[[1,.6],[1,-.6],[-1,.6],[-1,-.6],[.6,1],[-.6,1],[.6,-1],[-.6,-1],[.25,1],[-.25,1]],Bt=56,g=(n,t,e)=>Math.min(e,Math.max(t,n)),_=n=>Math.round(n*Z)/Z,H=n=>`#${h[n].color.toString(16).padStart(6,"0")}`;function z(n){const t=Number.parseInt(n,10);return!Number.isFinite(t)||Number.isNaN(t)?0:g(t,0,90)}function P(n,t){const e=Number.parseInt(n,10);return!Number.isFinite(e)||Number.isNaN(e)?t:g(e,420,2200)}function nt(n){return btoa(unescape(encodeURIComponent(n))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")}function ot(n){const t=n.replace(/-/g,"+").replace(/_/g,"/"),e=t.length%4===0?"":"=".repeat(4-t.length%4);return decodeURIComponent(escape(atob(t+e)))}function Et(n){const t={w:P(n.arenaWidth,D.arenaWidth),h:P(n.arenaHeight,D.arenaHeight),c:m.reduce((e,s)=>(e[s]=z(n.classCounts[s]),e),{})};return nt(JSON.stringify(t))}function Ht(n){var t;try{const e=JSON.parse(ot(n));if(!e||typeof e!="object")return null;const s={};for(const i of m)s[i]=z((t=e.c)==null?void 0:t[i]);return{arenaWidth:P(e.w,D.arenaWidth),arenaHeight:P(e.h,D.arenaHeight),classCounts:s}}catch{return null}}function Pt(){const t=new URL(window.location.href).searchParams.get("setup");return t?Ht(t):null}function Dt(){return new URL(window.location.href).searchParams.get("replay")}function $t(n){return nt(JSON.stringify(n))}function At(n){try{const t=JSON.parse(ot(n));return!t||typeof t!="object"?null:t}catch{return null}}function X(n,t,e,s,i,o){const a=h[t];return{id:n,classKey:t,classLabel:a.label,r:a.radius,mass:a.mass,x:e,y:s,vx:i,vy:o,hp:a.maxHp,maxHp:a.maxHp,color:a.color,alive:!0,abilityState:{tricksterDashTimer:a.dashCooldown??0,bulwarkShieldCooldown:a.shieldCooldown??0,bulwarkShieldTimeLeft:0,splitDepth:0,splitCooldownLeft:0,bossShockwaveCooldown:0}}}function It(n){const t=[];for(const e of m){const s=z(n[e]);for(let i=0;i<s;i+=1)t.push(e)}return t}function zt(n){const t=It(n.classCounts),e=t.length;if(e===0)return[];const s=Math.max(1,Math.ceil(Math.sqrt(e*(n.arenaWidth/n.arenaHeight)))),i=Math.max(1,Math.ceil(e/s)),o=Math.max(50,Math.min(130,n.arenaWidth*.12)),a=Math.max(50,Math.min(130,n.arenaHeight*.12)),l=Math.max(0,n.arenaWidth-o*2),r=Math.max(0,n.arenaHeight-a*2),c=[];for(let u=0;u<e;u+=1){const d=t[u],p=h[d],y=u%s,C=Math.floor(u/s),k=s>1?o+l*y/(s-1):n.arenaWidth/2,w=i>1?a+r*C/(i-1):n.arenaHeight/2,[x,v]=it[u%it.length],b=Math.hypot(x,v)||1,S=x/b*p.speed,$=v/b*p.speed;c.push(X(u,d,k,w,S,$))}return c}function Nt(n,t){return{minX:Math.floor((n.x-n.r)/t),maxX:Math.floor((n.x+n.r)/t),minY:Math.floor((n.y-n.r)/t),maxY:Math.floor((n.y+n.r)/t)}}function Ot(n,t=Bt){const e=new Map;for(let o=0;o<n.length;o+=1){const a=Nt(n[o],t);for(let l=a.minX;l<=a.maxX;l+=1)for(let r=a.minY;r<=a.maxY;r+=1){const c=`${l}:${r}`,u=e.get(c);u?u.push(o):e.set(c,[o])}}const s=new Set,i=[];for(const o of e.values())if(!(o.length<2))for(let a=0;a<o.length;a+=1)for(let l=a+1;l<o.length;l+=1){const r=o[a],c=o[l],u=r<c?`${r}:${c}`:`${c}:${r}`;s.has(u)||(s.add(u),i.push([r,c]))}return i}function Wt({a:n,b:t,impact:e,normalX:s,normalY:i,canDealDamage:o}){const a=Math.max(0,n.vx*s+n.vy*i),l=Math.max(0,-(t.vx*s+t.vy*i)),r=g(a/I*J,0,Q),c=g(l/I*J,0,Q);let u=0,d=0;if(o&&e>=Mt){const v=g(bt+St*e,Ct,wt);u=v*(1+r),d=v*(1+c)}n.classKey==="sniper"&&e>=h.sniper.impactThreshold&&(u*=h.sniper.impactBonusMult),t.classKey==="sniper"&&e>=h.sniper.impactThreshold&&(d*=h.sniper.impactBonusMult),n.classKey==="striker"&&n.hp/n.maxHp<.35&&(u*=1.2),t.classKey==="striker"&&t.hp/t.maxHp<.35&&(d*=1.2);let p=u*h[n.classKey].outgoingDamageMult*h[t.classKey].incomingDamageMult,y=d*h[t.classKey].outgoingDamageMult*h[n.classKey].incomingDamageMult;n.classKey==="bulwark"&&n.abilityState.bulwarkShieldTimeLeft>0&&(y*=h.bulwark.shieldReductionMult),t.classKey==="bulwark"&&t.abilityState.bulwarkShieldTimeLeft>0&&(p*=h.bulwark.shieldReductionMult),n.classKey==="boss"&&(y*=h.boss.bonusDamageReduction),t.classKey==="boss"&&(p*=h.boss.bonusDamageReduction);const C=o&&n.classKey==="vampire"?p*h.vampire.lifesteal:0,k=o&&t.classKey==="vampire"?y*h.vampire.lifesteal:0,w=o&&n.classKey==="bulwark"&&n.abilityState.bulwarkShieldTimeLeft>0?y*h.bulwark.thorns:0,x=o&&t.classKey==="bulwark"&&t.abilityState.bulwarkShieldTimeLeft>0?p*h.bulwark.thorns:0;return o||(y=0,p=0),{damageToA:y,damageToB:p,healingForA:C,healingForB:k,thornsToA:x,thornsToB:w}}const Ft={balanced:{label:"Balanced",counts:{tank:4,striker:5,medic:3,trickster:4,sniper:3,vampire:3,bulwark:3,splitter:3,boss:1}},chaos:{label:"Chaos",counts:{tank:8,striker:10,medic:6,trickster:8,sniper:8,vampire:8,bulwark:6,splitter:10,boss:3}},duel:{label:"Duel",counts:{tank:0,striker:1,medic:0,trickster:0,sniper:1,vampire:0,bulwark:0,splitter:0,boss:0}}};function _t(){if(document.getElementById("ball-controls-style"))return;const n=document.createElement("style");n.id="ball-controls-style",n.textContent=`
    :root {
      --ui-bg: rgba(6, 14, 25, 0.95);
      --ui-edge: #36506e;
      --ui-text: #e2e8f0;
      --ui-muted: #9aa7bb;
      --ui-accent: #f2c94c;
      --ui-accent-alt: #67e8f9;
      --ui-danger: #ff7c70;
    }
    body {
      margin: 0;
      background:
        radial-gradient(1200px 560px at 8% 14%, rgba(24, 43, 73, 0.48), rgba(10, 16, 30, 0.25)),
        linear-gradient(180deg, #0a111f, #0c1424 36%, #090f1b);
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
      width: 332px;
      max-height: calc(100vh - 20px);
      overflow: auto;
      background: var(--ui-bg);
      color: var(--ui-text);
      border: 2px solid var(--ui-edge);
      border-radius: 10px;
      padding: 12px;
      font-family: "Consolas", "Cascadia Mono", monospace;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
      user-select: none;
    }
    #ball-controls h2 {
      margin: 0 0 6px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.3px;
      color: var(--ui-accent);
    }
    #ball-controls .intro {
      margin-bottom: 8px;
      border: 1px solid #2c405b;
      border-radius: 7px;
      background: rgba(15, 24, 42, 0.95);
      padding: 8px;
      font-size: 11px;
      line-height: 1.35;
      color: #bed0ea;
    }
    #ball-controls .status {
      margin-bottom: 8px;
      border: 1px solid #2f4d73;
      border-radius: 7px;
      background: linear-gradient(180deg, rgba(16, 34, 59, 0.94), rgba(11, 20, 35, 0.96));
      padding: 8px;
      font-size: 12px;
      line-height: 1.35;
    }
    #ball-controls .status strong {
      color: #f8e389;
    }
    #ball-controls .row {
      display: grid;
      grid-template-columns: 1fr 90px;
      gap: 8px;
      align-items: center;
      margin-bottom: 6px;
    }
    #ball-controls label {
      font-size: 12px;
      opacity: 0.94;
    }
    #ball-controls input,
    #ball-controls select {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #355171;
      border-radius: 5px;
      padding: 5px 6px;
      font-size: 12px;
      background: #0a1426;
      color: #ecf4ff;
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
      background: var(--ui-accent);
      color: #111827;
      font-family: inherit;
      transition: transform 120ms ease, filter 120ms ease;
    }
    #ball-controls button:hover {
      filter: brightness(1.04);
      transform: translateY(-1px);
    }
    #ball-controls .preset-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin: 8px 0;
    }
    #ball-controls .preset-row button {
      background: var(--ui-accent-alt);
      color: #0b1a2e;
      padding: 6px 8px;
      font-size: 11px;
    }
    #ball-controls .subsection {
      margin-top: 10px;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #9de6ff;
    }
    #ball-controls .panel {
      margin-bottom: 8px;
      border: 1px solid #2f4d73;
      border-radius: 7px;
      background: rgba(8, 18, 31, 0.8);
      padding: 8px;
      font-size: 11px;
      line-height: 1.35;
      color: #dbeafe;
    }
    #ball-controls .drop-zone {
      min-height: 48px;
      border: 2px dashed #416086;
      border-radius: 8px;
      padding: 6px;
      background: rgba(7, 15, 28, 0.78);
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
    }
    #ball-controls .drop-zone.active {
      border-color: #7cf7eb;
      background: rgba(9, 60, 72, 0.34);
    }
    #ball-controls .chip {
      display: inline-flex;
      align-items: center;
      border: 1px solid #111827;
      border-radius: 12px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 700;
      color: #f8fafc;
      cursor: grab;
      white-space: nowrap;
      touch-action: none;
    }
    #ball-controls .chip.saved {
      cursor: pointer;
      border-color: #e5e7eb;
    }
    #ball-controls .chip.dragging {
      opacity: 0.3;
    }
    #ball-controls .chip-ghost {
      position: fixed;
      left: 0;
      top: 0;
      z-index: 1000;
      pointer-events: none;
      opacity: 0.95;
      transform: translate(-9999px, -9999px);
    }
    #ball-controls .link-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 6px;
      margin-bottom: 8px;
    }
    #ball-controls .link-row input {
      background: #050b16;
      border-color: #3f5d83;
      font-size: 11px;
    }
    #ball-controls .mini {
      background: #93e9d6;
      color: #12263f;
      padding: 6px 8px;
      font-size: 11px;
    }
    #ball-controls .desc-title {
      margin-top: 6px;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #f4d974;
    }
    #ball-controls .class-desc {
      margin: 0 0 6px;
      font-size: 11px;
      line-height: 1.35;
      color: #d5deeb;
    }
    #ball-controls .swatch {
      display: inline-block;
      width: 9px;
      height: 9px;
      border: 1px solid #0f172a;
      margin-right: 6px;
      vertical-align: middle;
    }
    #ball-controls .hint {
      margin-top: 8px;
      font-size: 11px;
      color: var(--ui-muted);
      line-height: 1.3;
    }
    #ball-controls textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #355171;
      border-radius: 5px;
      padding: 6px;
      font-size: 11px;
      background: #0a1426;
      color: #ecf4ff;
      font-family: inherit;
      resize: vertical;
      min-height: 54px;
    }
  `,document.head.appendChild(n)}function Kt(n){const t=n.mode.charAt(0).toUpperCase()+n.mode.slice(1);return n.roundFinished?n.winnerClassKey?`[${t}] Winner: <strong style="color:${H(n.winnerClassKey)}">${h[n.winnerClassKey].label}</strong> (${n.balls.length} left)`:`[${t}] <strong>Draw:</strong> no surviving balls`:m.reduce((s,i)=>s+(n.setup.classCounts[i]??0),0)===0?`[${t}] <strong style="color:var(--ui-danger)">No balls configured.</strong> Set class counts and click Apply Setup + Reset.`:`[${t}] Round running... alive ${n.balls.length}`}function at(n,t,e){return n>=e.left&&n<=e.right&&t>=e.top&&t<=e.bottom}function qt(n,t,e,s){t.draggable=!1,t.addEventListener("pointerdown",i=>{if(!i.isPrimary||i.button!==0&&i.pointerType!=="touch")return;i.preventDefault(),t.setPointerCapture&&t.setPointerCapture(i.pointerId);const o=t.cloneNode(!0);o.classList.add("chip-ghost"),document.body.appendChild(o),t.classList.add("dragging");const a=(d,p)=>{o.style.transform=`translate(${Math.round(d+12)}px, ${Math.round(p+12)}px)`;const y=at(d,p,s.getBoundingClientRect());s.classList.toggle("active",y)};a(i.clientX,i.clientY);const l=d=>{a(d.clientX,d.clientY)},r=(d,p)=>{s.classList.remove("active"),t.classList.remove("dragging"),o.remove(),at(d,p,s.getBoundingClientRect())&&n.addClassToNextRoundBox(e)},c=d=>{window.removeEventListener("pointermove",l),window.removeEventListener("pointerup",c),window.removeEventListener("pointercancel",u),t.releasePointerCapture&&t.releasePointerCapture(i.pointerId),r(d.clientX,d.clientY)},u=()=>{window.removeEventListener("pointermove",l),window.removeEventListener("pointerup",c),window.removeEventListener("pointercancel",u),t.releasePointerCapture&&t.releasePointerCapture(i.pointerId),s.classList.remove("active"),t.classList.remove("dragging"),o.remove()};window.addEventListener("pointermove",l),window.addEventListener("pointerup",c),window.addEventListener("pointercancel",u)})}function Ut(n){_t();let t=document.getElementById("ball-controls");t||(t=document.createElement("div"),t.id="ball-controls",document.body.appendChild(t));const e=m.map(f=>`
      <div class="row">
        <label for="count_${f}">${h[f].label}</label>
        <input id="count_${f}" data-class-key="${f}" type="number" min="0" max="90" />
      </div>
    `).join(""),s=m.map(f=>`<p class="class-desc"><span class="swatch" style="background:${H(f)}"></span><strong>${h[f].label}:</strong> ${h[f].description}</p>`).join("");t.innerHTML=`
    <h2>Bouncing Balls Arena</h2>
    <div class="intro">Class-based auto-battler sandbox. Each class can be set to 0. Finish rounds, drag survivors into the next-round box, and chain matches.</div>
    <div id="roundStatus" class="status">Round running...</div>
    <div class="row">
      <label for="modeSelect">Mode</label>
      <select id="modeSelect">
        <option value="classic">Classic</option>
        <option value="blitz">Blitz</option>
        <option value="tournament">Tournament</option>
      </select>
    </div>
    <div class="row">
      <label for="arenaSelect">Arena</label>
      <select id="arenaSelect">
        <option value="standard">Standard</option>
        <option value="crossfire">Crossfire</option>
        <option value="sanctum">Sanctum</option>
        <option value="gauntlet">Gauntlet</option>
      </select>
    </div>
    <div class="row">
      <label for="modifierSelect">Modifier</label>
      <select id="modifierSelect">
        <option value="none">None</option>
        <option value="iron_wall">Iron Wall</option>
        <option value="glass_cannon">Glass Cannon</option>
        <option value="turbo">Turbo</option>
      </select>
    </div>
    <div class="row">
      <label for="arenaWidth">Arena Width</label>
      <input id="arenaWidth" type="number" min="420" max="2200" />
    </div>
    <div class="row">
      <label for="arenaHeight">Arena Height</label>
      <input id="arenaHeight" type="number" min="420" max="2200" />
    </div>
    ${e}
    <div class="preset-row">
      <button id="presetBalanced" type="button">Balanced</button>
      <button id="presetChaos" type="button">Chaos</button>
      <button id="presetDuel" type="button">Duel</button>
    </div>
    <div class="actions">
      <button id="applySetupBtn" type="button">Apply Setup + Reset</button>
      <button id="resetRoundBtn" type="button">Reset Round</button>
      <button id="startTournamentBtn" type="button">Start Tournament</button>
      <button id="startTeamTournamentBtn" type="button">Start Team Tournament</button>
      <button id="stopTournamentBtn" type="button">Stop Tournament</button>
    </div>
    <div class="subsection">Tournament</div>
    <div id="tournamentStatus" class="panel">Tournament inactive.</div>
    <div class="subsection">Prize Board</div>
    <div id="prizeBoard" class="panel">No prizes awarded yet.</div>
    <div class="subsection">Upgrades</div>
    <div class="row">
      <label for="upgradeClass">Upgrade Class</label>
      <select id="upgradeClass">
        ${m.map(f=>`<option value="${f}">${h[f].label}</option>`).join("")}
      </select>
    </div>
    <div class="panel" id="upgradeSummary">Select class to view upgrades.</div>
    <div class="actions">
      <button id="buyHpBtn" type="button">Buy HP Upgrade</button>
      <button id="buySpeedBtn" type="button">Buy Speed Upgrade</button>
      <button id="buyMasteryBtn" type="button">Buy Mastery Upgrade</button>
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
    <div class="subsection">Replay</div>
    <textarea id="replayOut" readonly></textarea>
    <div class="actions">
      <button id="exportReplayBtn" type="button">Export Replay Token</button>
    </div>
    <textarea id="replayIn" placeholder="Paste replay token here"></textarea>
    <div class="actions">
      <button id="importReplayBtn" type="button">Import Replay Token</button>
    </div>
    <div class="subsection">Combat Log</div>
    <div id="combatLog" class="panel">No combat events yet.</div>
    <div class="subsection">Achievements</div>
    <div id="achievements" class="panel">No achievements yet.</div>
    <div class="desc-title">Class Descriptions</div>
    ${s}
    <div class="hint">Controls: R reset | F fast-forward | P pause</div>
    <div class="hint">Deterministic sim: same setup + mode always gives the same result.</div>
    <div class="hint">Flow: finish a round, drag survivor chips into Next Round Box, then click Use Box For Next Round.</div>
  `;const i=t.querySelector("#arenaWidth"),o=t.querySelector("#arenaHeight"),a=t.querySelector("#modeSelect"),l=t.querySelector("#arenaSelect"),r=t.querySelector("#modifierSelect"),c=t.querySelector("#roundStatus"),u=t.querySelector("#tournamentStatus"),d=t.querySelector("#prizeBoard"),p=t.querySelector("#upgradeClass"),y=t.querySelector("#upgradeSummary"),C=t.querySelector("#combatLog"),k=t.querySelector("#achievements"),w=t.querySelector("#survivorPool"),x=t.querySelector("#nextRoundBox"),v=t.querySelector("#shareLinkOut"),b=t.querySelector("#replayOut"),S=t.querySelector("#replayIn"),$=t.querySelector("#applySetupBtn"),N=t.querySelector("#resetRoundBtn"),T=t.querySelector("#startTournamentBtn"),L=t.querySelector("#startTeamTournamentBtn"),R=t.querySelector("#stopTournamentBtn"),O=t.querySelector("#buyHpBtn"),W=t.querySelector("#buySpeedBtn"),rt=t.querySelector("#buyMasteryBtn"),lt=t.querySelector("#useNextRoundBtn"),ct=t.querySelector("#generateLinkBtn"),ht=t.querySelector("#exportReplayBtn"),ut=t.querySelector("#importReplayBtn"),dt=t.querySelector("#copyLinkBtn"),pt=t.querySelector("#presetBalanced"),mt=t.querySelector("#presetChaos"),ft=t.querySelector("#presetDuel"),K=t.querySelectorAll("[data-class-key]");n.ui={root:t,arenaWidthEl:i,arenaHeightEl:o,modeSelectEl:a,arenaSelectEl:l,modifierSelectEl:r,roundStatusEl:c,tournamentStatusEl:u,prizeBoardEl:d,upgradeClassEl:p,upgradeSummaryEl:y,combatLogEl:C,achievementsEl:k,survivorPoolEl:w,nextRoundBoxEl:x,shareLinkOutEl:v,replayOutEl:b,replayInEl:S,countInputs:K,setStatusMessage:f=>{c.innerHTML=f},createStatusHtml:()=>Kt(n),bindDraggableChip:(f,E)=>qt(n,f,E,x)},n.syncControlInputs(),a.value=n.mode,l.value=n.arenaMode,r.value=n.activeModifier,p.value=m[0];const q=f=>{const E=Ft[f];if(E){for(const V of K){const gt=V.dataset.classKey;V.value=String(E.counts[gt]??0)}n.ui.setStatusMessage(`${n.ui.createStatusHtml()}<br /><strong>${E.label} preset loaded.</strong>`)}};pt.addEventListener("click",()=>q("balanced")),mt.addEventListener("click",()=>q("chaos")),ft.addEventListener("click",()=>q("duel")),$.addEventListener("click",()=>{const f={};for(const E of K)f[E.dataset.classKey]=z(E.value);n.applySetup({arenaWidth:P(i.value,n.setup.arenaWidth),arenaHeight:P(o.value,n.setup.arenaHeight),classCounts:f}),n.syncControlInputs()}),a.addEventListener("change",()=>{n.setMode(a.value),n.syncControlInputs()}),l.addEventListener("change",()=>{n.setArenaMode(l.value),n.syncControlInputs()}),r.addEventListener("change",()=>{n.setModifier(r.value),n.syncControlInputs()}),N.addEventListener("click",()=>{n.resetSimulation(),n.syncControlInputs()}),T.addEventListener("click",()=>{n.startTournament(!1),n.syncControlInputs()}),L.addEventListener("click",()=>{n.startTournament(!0),n.syncControlInputs()}),R.addEventListener("click",()=>{n.stopTournament(),n.syncControlInputs()}),lt.addEventListener("click",()=>{n.applyNextRoundBox(),n.syncControlInputs()});const U=f=>{n.buyUpgrade(p.value,f),n.syncControlInputs()};O.addEventListener("click",()=>U("hp")),W.addEventListener("click",()=>U("speed")),rt.addEventListener("click",()=>U("mastery")),p.addEventListener("change",()=>{n.updateRoundPanels()}),ct.addEventListener("click",()=>{v.value=n.generateShareLink(),v.select()}),ht.addEventListener("click",()=>{b.value=n.exportReplayToken(),b.select()}),ut.addEventListener("click",()=>{const f=S.value.trim();if(!f){n.ui.setStatusMessage(`${n.ui.createStatusHtml()}<br /><strong>Paste a replay token first.</strong>`);return}n.importReplayToken(f)?(b.value=f,n.ui.setStatusMessage(`${n.ui.createStatusHtml()}<br /><strong>Replay imported.</strong>`)):n.ui.setStatusMessage(`${n.ui.createStatusHtml()}<br /><strong>Replay import failed.</strong>`)}),dt.addEventListener("click",async()=>{v.value||(v.value=n.generateShareLink());try{await navigator.clipboard.writeText(v.value),n.ui.setStatusMessage(`${n.ui.createStatusHtml()}<br /><strong>Link copied.</strong>`)}catch{v.select(),v.setSelectionRange(0,v.value.length),n.ui.setStatusMessage(`${n.ui.createStatusHtml()}<br /><strong>Copy failed, selected URL for manual copy.</strong>`)}}),n.updateRoundPanels()}const Y=Pt()??structuredClone(D),Gt=Dt();class jt extends M.Scene{constructor(){super("main"),this.graphics=null,this.hudText=null,this.winnerText=null,this.accumulator=0,this.stepCounter=0,this.fastForward=!1,this.paused=!1,this.initialState=[],this.balls=[],this.setup=structuredClone(Y),this.effects=[],this.simTime=0,this.lastDamageTimesByPair=new Map,this.lastPairPruneAt=0,this.roundFinished=!1,this.winnerClassKey=null,this.nextRoundBoxClasses=[],this.ui=null,this.pixelMaskCache=new Map,this.nextBallId=0,this.mode="classic",this.arenaMode="standard",this.activeModifier="none",this.prizeLedger=Object.fromEntries(m.map(t=>[t,0])),this.upgrades=Object.fromEntries(m.map(t=>[t,{hp:0,speed:0,mastery:0}])),this.battleHistory=[],this.combatLog=[],this.achievements=new Set,this.lastNonEmptyClassSnapshot=Object.fromEntries(m.map(t=>[t,0])),this.textureCacheByKey=new Set,this.classGlyphCache=new Map,this.pendingReplayToken=Gt,this.tournament={active:!1,teamMode:!1,baseSetup:null,matches:[],currentMatchIndex:-1,standings:Object.fromEntries(m.map(t=>[t,{played:0,wins:0,losses:0}]))}}create(){this.cameras.main.setBackgroundColor(1711398),this.graphics=this.add.graphics(),this.hudText=this.add.text(12,12,"",{fontFamily:"Consolas, monospace",fontSize:"15px",color:"#f3f4f6"}),this.hudText.setDepth(10),this.winnerText=this.add.text(0,0,"",{fontFamily:"Consolas, monospace",fontSize:"26px",color:"#f8fafc",fontStyle:"bold"}),this.winnerText.setDepth(12),this.winnerText.setOrigin(.5,.5),this.winnerText.setVisible(!1),this.input.keyboard.on("keydown-R",()=>{this.resetSimulation()}),this.input.keyboard.on("keydown-F",()=>{this.fastForward=!this.fastForward}),this.input.keyboard.on("keydown-P",()=>{this.paused=!this.paused}),Ut(this),this.pendingReplayToken?this.importReplayToken(this.pendingReplayToken,!0)||this.rebuildInitialState():this.rebuildInitialState()}syncControlInputs(){if(this.ui){this.ui.arenaWidthEl.value=String(this.setup.arenaWidth),this.ui.arenaHeightEl.value=String(this.setup.arenaHeight),this.ui.modeSelectEl&&(this.ui.modeSelectEl.value=this.mode),this.ui.arenaSelectEl&&(this.ui.arenaSelectEl.value=this.arenaMode),this.ui.modifierSelectEl&&(this.ui.modifierSelectEl.value=this.activeModifier);for(const t of this.ui.countInputs)t.value=String(this.setup.classCounts[t.dataset.classKey]??0)}}setMode(t){["classic","blitz","tournament"].includes(t)&&(this.mode=t,t!=="tournament"&&this.tournament.active&&this.stopTournament(),this.updateRoundPanels())}setArenaMode(t){et.includes(t)&&(this.arenaMode=t,this.updateRoundPanels())}setModifier(t){st.includes(t)&&(this.activeModifier=t,this.updateRoundPanels())}getModeRules(){let t=1,e=1,s=1;return this.mode==="blitz"&&(t=1.1,e=1.15,s=1.2),this.mode==="tournament"&&(e=1.05,s=1.25),this.activeModifier==="iron_wall"?(e*=.9,s*=1.05):this.activeModifier==="glass_cannon"?(e*=1.18,s*=1.1):this.activeModifier==="turbo"&&(t*=1.15,s*=1.08),{movementMult:t,damageMult:e,prizeMult:s}}getArenaRules(){return this.arenaMode==="crossfire"?{hazardTick:54,hazardDamage:3.5}:this.arenaMode==="sanctum"?{sanctumRadius:Math.min(this.setup.arenaWidth,this.setup.arenaHeight)*.17,sanctumHealingPerSecond:2.8}:this.arenaMode==="gauntlet"?{wallThorns:7.5}:{}}logCombatEvent(t){this.combatLog.unshift(`t${this.stepCounter}: ${t}`),this.combatLog.length>20&&(this.combatLog=this.combatLog.slice(0,20))}getBattlePrizeAmount(){const t=this.getModeRules(),e=this.balls.reduce((o,a)=>o+a.hp,0),s=Math.round(e*.15),i=Math.max(0,40-Math.floor(this.stepCounter/60));return Math.max(25,Math.round((85+s+i)*t.prizeMult))}awardWinnerPrize(t,e){this.prizeLedger[t]+=e,this.battleHistory.unshift({id:this.stepCounter+this.simTime,mode:this.mode,winner:t,prize:e,step:this.stepCounter}),this.battleHistory.length>14&&(this.battleHistory=this.battleHistory.slice(0,14)),this.logCombatEvent(`${h[t].label} earned ${e} prize`),this.evaluateAchievements()}getUpgradeCost(t,e){var o;const s=B[e];if(!s)return Number.POSITIVE_INFINITY;const i=((o=this.upgrades[t])==null?void 0:o[e])??0;return Math.round(s.baseCost*Math.pow(s.costScale,i))}buyUpgrade(t,e){const s=B[e];if(!s||!this.upgrades[t]||this.upgrades[t][e]>=s.maxLevel)return!1;const o=this.getUpgradeCost(t,e);return(this.prizeLedger[t]??0)<o?!1:(this.prizeLedger[t]-=o,this.upgrades[t][e]+=1,this.logCombatEvent(`${h[t].label} bought ${s.label} Lv${this.upgrades[t][e]}`),this.updateRoundPanels(),!0)}applyUpgradesToBall(t){const e=this.upgrades[t.classKey];if(!e)return;const s=e.hp??0,i=e.speed??0,o=e.mastery??0;if(s>0&&(t.maxHp=t.maxHp*(1+s*B.hp.hpPerLevel),t.hp=t.maxHp),i>0){const a=1+i*B.speed.speedPerLevel;t.vx*=a,t.vy*=a}o>0&&(t.outgoingBonus=o*B.mastery.outgoingPerLevel,t.incomingReduction=o*B.mastery.incomingReductionPerLevel)}exportReplayToken(){const t={v:1,mode:this.mode,arenaMode:this.arenaMode,activeModifier:this.activeModifier,setup:this.setup,upgrades:this.upgrades};return $t(t)}importReplayToken(t,e=!1){const s=At(t);if(!s||s.v!==1||!s.setup)return!1;if(this.mode=["classic","blitz","tournament"].includes(s.mode)?s.mode:"classic",this.arenaMode=et.includes(s.arenaMode)?s.arenaMode:"standard",this.activeModifier=st.includes(s.activeModifier)?s.activeModifier:"none",s.upgrades&&typeof s.upgrades=="object")for(const i of m){const o=s.upgrades[i];o&&(this.upgrades[i]={hp:g(Number(o.hp)||0,0,B.hp.maxLevel),speed:g(Number(o.speed)||0,0,B.speed.maxLevel),mastery:g(Number(o.mastery)||0,0,B.mastery.maxLevel)})}return this.applySetup(s.setup),this.syncControlInputs(),e||this.logCombatEvent("Replay imported"),!0}evaluateAchievements(){for(const t of m)(this.prizeLedger[t]??0)>=500&&!this.achievements.has(`rich_${t}`)&&this.achievements.add(`rich_${t}`);this.battleHistory.length>=5&&!this.achievements.has("veteran_5")&&this.achievements.add("veteran_5"),this.mode==="tournament"&&this.battleHistory.length>=10&&!this.achievements.has("tournament_runner")&&this.achievements.add("tournament_runner")}resolveEmptyBattleWinner(){let t=null,e=-1;for(const s of m){const i=this.lastNonEmptyClassSnapshot[s]??0;i>e&&(e=i,t=s)}return e<=0?null:t}getCurrentClassCounts(){const t=Object.fromEntries(m.map(e=>[e,0]));for(const e of this.balls)t[e.classKey]+=1;return t}evaluateWinnerState(){if(this.roundFinished)return;if(this.balls.length===0){this.roundFinished=!0,this.winnerClassKey=this.resolveEmptyBattleWinner(),this.paused=!0,this.finalizeBattleResults(),this.updateRoundPanels();return}new Set(this.balls.map(e=>e.classKey)).size<=1&&(this.roundFinished=!0,this.winnerClassKey=this.balls[0].classKey,this.paused=!0,this.effects.push({type:"ring",x:this.balls[0].x,y:this.balls[0].y,color:this.balls[0].color,life:.7,radius:this.balls[0].r+6}),this.finalizeBattleResults(),this.updateRoundPanels())}finalizeBattleResults(){if(!this.winnerClassKey)return;const t=this.getBattlePrizeAmount();this.awardWinnerPrize(this.winnerClassKey,t),this.tournament.active&&this.completeTournamentBattle(this.winnerClassKey)}getSurvivorDraftPool(){return this.roundFinished?[...this.balls].sort((t,e)=>e.hp-t.hp||t.id-e.id).map(t=>({id:t.id,classKey:t.classKey,label:`${h[t.classKey].label} #${t.id} (${Math.round(t.hp)})`})):[]}getPrizeBoardHtml(){return[...m].map(s=>({classKey:s,prize:this.prizeLedger[s]})).sort((s,i)=>i.prize-s.prize||m.indexOf(s.classKey)-m.indexOf(i.classKey)).slice(0,6).map(s=>`<div><strong style="color:${H(s.classKey)}">${h[s.classKey].label}</strong>: ${s.prize}</div>`).join("")||"<div>No prizes awarded yet.</div>"}getTournamentHtml(){if(!this.tournament.active)return"<div>Tournament inactive.</div>";const t=this.tournament.matches.length,e=this.tournament.currentMatchIndex+1,s=m.filter(l=>{var r;return(((r=this.tournament.baseSetup)==null?void 0:r.classCounts[l])??0)>0}).map(l=>{const r=this.tournament.standings[l];return`<div><strong style="color:${H(l)}">${h[l].label}</strong>: ${r.wins}W-${r.losses}L</div>`}).join(""),i=this.tournament.matches[this.tournament.currentMatchIndex],o=i!=null&&i.label?`<div>${i.label}</div>`:"";return`<div>${this.tournament.teamMode?"Team mode":"Solo mode"} | Match ${e}/${t}</div>${o}${s}`}getCombatLogHtml(){return this.combatLog.length===0?"<div>No combat events yet.</div>":this.combatLog.slice(0,10).map(t=>`<div>${t}</div>`).join("")}getAchievementsHtml(){return this.achievements.size===0?"<div>No achievements yet.</div>":[...this.achievements].slice(0,10).map(t=>`<div>${t}</div>`).join("")}getUpgradePanelHtml(t){const e=h[t]?t:m[0],s=this.upgrades[e],i=this.getUpgradeCost(e,"hp"),o=this.getUpgradeCost(e,"speed"),a=this.getUpgradeCost(e,"mastery");return`
      <div><strong style="color:${H(e)}">${h[e].label}</strong> prize: ${this.prizeLedger[e]}</div>
      <div>HP Lv${s.hp} | next ${i}</div>
      <div>Speed Lv${s.speed} | next ${o}</div>
      <div>Mastery Lv${s.mastery} | next ${a}</div>
    `}addClassToNextRoundBox(t){!h[t]||this.nextRoundBoxClasses.length>=90||(this.nextRoundBoxClasses.push(t),this.updateRoundPanels())}applyNextRoundBox(){if(this.nextRoundBoxClasses.length===0)return;const t=Object.fromEntries(m.map(e=>[e,0]));for(const e of this.nextRoundBoxClasses)t[e]+=1;this.nextRoundBoxClasses=[],this.applySetup({arenaWidth:this.setup.arenaWidth,arenaHeight:this.setup.arenaHeight,classCounts:t}),this.updateRoundPanels()}buildTournamentMatches(){const t=m.filter(s=>(this.setup.classCounts[s]??0)>0),e=[];if(this.tournament.teamMode){const s=[];for(let i=0;i<t.length;i+=2){const o=t[i],a=t[i+1];o&&a&&s.push([o,a])}for(let i=0;i<s.length;i+=1)for(let o=i+1;o<s.length;o+=1)e.push({aTeam:s[i],bTeam:s[o],label:`${h[s[i][0]].label}/${h[s[i][1]].label} vs ${h[s[o][0]].label}/${h[s[o][1]].label}`});return e}for(let s=0;s<t.length;s+=1)for(let i=s+1;i<t.length;i+=1)e.push({a:t[s],b:t[i],label:`${h[t[s]].label} vs ${h[t[i]].label}`});return e}startTournament(t=!1){this.tournament.teamMode=!!t;const e=this.buildTournamentMatches();if(e.length===0){this.updateRoundPanels();return}this.tournament.active=!0,this.tournament.baseSetup=structuredClone(this.setup),this.tournament.matches=e,this.tournament.currentMatchIndex=-1,this.tournament.standings=Object.fromEntries(m.map(s=>[s,{played:0,wins:0,losses:0}])),this.mode="tournament",this.launchNextTournamentMatch()}stopTournament(){this.tournament.active=!1,this.tournament.matches=[],this.tournament.currentMatchIndex=-1,this.tournament.teamMode=!1,this.updateRoundPanels()}launchNextTournamentMatch(){if(!this.tournament.active)return;const t=this.tournament.currentMatchIndex+1;if(t>=this.tournament.matches.length){this.stopTournament();return}this.tournament.currentMatchIndex=t;const e=this.tournament.matches[t],s=Object.fromEntries(m.map(i=>[i,0]));if(e.aTeam&&e.bTeam){for(const i of e.aTeam)s[i]=this.tournament.baseSetup.classCounts[i];for(const i of e.bTeam)s[i]=this.tournament.baseSetup.classCounts[i]}else s[e.a]=this.tournament.baseSetup.classCounts[e.a],s[e.b]=this.tournament.baseSetup.classCounts[e.b];this.applySetup({arenaWidth:this.tournament.baseSetup.arenaWidth,arenaHeight:this.tournament.baseSetup.arenaHeight,classCounts:s}),this.paused=!1,this.updateRoundPanels()}completeTournamentBattle(t){if(!this.tournament.active||this.tournament.currentMatchIndex<0)return;const e=this.tournament.matches[this.tournament.currentMatchIndex];if(e.aTeam&&e.bTeam){const s=e.aTeam.includes(t),i=s?e.aTeam:e.bTeam,o=s?e.bTeam:e.aTeam;for(const a of e.aTeam)this.tournament.standings[a].played+=1;for(const a of e.bTeam)this.tournament.standings[a].played+=1;for(const a of i)this.tournament.standings[a].wins+=1;for(const a of o)this.tournament.standings[a].losses+=1}else this.tournament.standings[e.a].played+=1,this.tournament.standings[e.b].played+=1,t===e.a?(this.tournament.standings[e.a].wins+=1,this.tournament.standings[e.b].losses+=1):(this.tournament.standings[e.b].wins+=1,this.tournament.standings[e.a].losses+=1);this.time.delayedCall(700,()=>{this.launchNextTournamentMatch()})}generateShareLink(){var o;const t=Et(this.setup),e=this.exportReplayToken(),s=new URL(window.location.href);s.searchParams.set("setup",t),s.searchParams.set("replay",e);const i=s.toString();return window.history.replaceState({},"",i),(o=this.ui)!=null&&o.shareLinkOutEl&&(this.ui.shareLinkOutEl.value=i),i}updateRoundPanels(){if(!this.ui)return;this.ui.roundStatusEl.innerHTML=this.ui.createStatusHtml(),this.ui.prizeBoardEl&&(this.ui.prizeBoardEl.innerHTML=this.getPrizeBoardHtml()),this.ui.tournamentStatusEl&&(this.ui.tournamentStatusEl.innerHTML=this.getTournamentHtml()),this.ui.combatLogEl&&(this.ui.combatLogEl.innerHTML=this.getCombatLogHtml()),this.ui.achievementsEl&&(this.ui.achievementsEl.innerHTML=this.getAchievementsHtml()),this.ui.replayOutEl&&(this.ui.replayOutEl.value=this.exportReplayToken()),this.ui.upgradeClassEl&&this.ui.upgradeSummaryEl&&(this.ui.upgradeSummaryEl.innerHTML=this.getUpgradePanelHtml(this.ui.upgradeClassEl.value)),this.ui.survivorPoolEl.innerHTML="";const t=this.getSurvivorDraftPool();if(t.length===0){const e=document.createElement("span");e.textContent=this.roundFinished?"No survivors to draft.":"Survivors unlock when round ends.",e.style.fontSize="11px",e.style.color="#94a3b8",this.ui.survivorPoolEl.appendChild(e)}else for(const e of t){const s=document.createElement("span");s.className="chip",s.textContent=e.label,s.style.background=H(e.classKey),s.dataset.classKey=e.classKey,this.ui.bindDraggableChip&&this.ui.bindDraggableChip(s,e.classKey),this.ui.survivorPoolEl.appendChild(s)}if(this.ui.nextRoundBoxEl.innerHTML="",this.nextRoundBoxClasses.length===0){const e=document.createElement("span");e.textContent="Drop survivor chips here.",e.style.fontSize="11px",e.style.color="#94a3b8",this.ui.nextRoundBoxEl.appendChild(e)}else for(let e=0;e<this.nextRoundBoxClasses.length;e+=1){const s=this.nextRoundBoxClasses[e],i=document.createElement("span");i.className="chip saved",i.textContent=`${h[s].label} ${e+1}`,i.style.background=H(s),i.title="Click to remove",i.addEventListener("click",()=>{this.nextRoundBoxClasses.splice(e,1),this.updateRoundPanels()}),this.ui.nextRoundBoxEl.appendChild(i)}this.ui.shareLinkOutEl.value||(this.ui.shareLinkOutEl.value=this.generateShareLink())}applySetup(t){const e={};for(const s of m)e[s]=z(t.classCounts[s]);this.setup={arenaWidth:P(t.arenaWidth,D.arenaWidth),arenaHeight:P(t.arenaHeight,D.arenaHeight),classCounts:e},this.scale.resize(this.setup.arenaWidth,this.setup.arenaHeight),this.cameras.main.setSize(this.setup.arenaWidth,this.setup.arenaHeight),this.rebuildInitialState(),this.generateShareLink()}rebuildInitialState(){this.initialState=zt(this.setup),this.resetSimulation()}resetSimulation(){this.balls=this.initialState.map(t=>({...t,abilityState:{...t.abilityState}}));for(const t of this.balls)this.applyUpgradesToBall(t);this.effects=[],this.stepCounter=0,this.accumulator=0,this.fastForward=!1,this.paused=!1,this.simTime=0,this.lastDamageTimesByPair.clear(),this.lastPairPruneAt=0,this.roundFinished=!1,this.winnerClassKey=null,this.nextBallId=this.balls.reduce((t,e)=>Math.max(t,e.id),-1)+1,this.renderScene(),this.updateRoundPanels()}update(t,e){if(this.paused){this.renderScene();return}this.accumulator+=e/1e3,this.accumulator=Math.min(this.accumulator,.25);const s=this.fastForward?Lt:Rt;let i=0;for(;this.accumulator>=G&&i<s;)this.simulateStep(G),this.accumulator-=G,i+=1;this.renderScene()}simulateStep(t){const e=this.balls.filter(r=>r.alive),s=new Map,i=new Map,o=[],a=this.getModeRules();this.simTime+=t,e.length>0&&(this.lastNonEmptyClassSnapshot=this.getCurrentClassCounts());for(const r of e){this.applyPerStepAbilities(r,t),r.x+=r.vx*t*a.movementMult,r.y+=r.vy*t*a.movementMult;const c=this.resolveWallCollision(r);c&&this.trySpawnSplitChildrenFromWall(r,c.x,c.y,o),this.applyArenaEffects(r,t,s,i),this.spawnTrail(r)}const l=Ot(e);for(const[r,c]of l)this.resolveBallCollision(e[r],e[c],s,i,o);for(const r of e){const c=s.get(r.id)??0,u=i.get(r.id)??0,d=g(r.incomingReduction??0,0,.75);r.hp=g(r.hp-c*a.damageMult*(1-d)+u,0,r.maxHp),r.hp<=0&&(r.alive=!1)}if(this.balls=this.balls.filter(r=>r.alive),o.length>0){const r=Math.max(0,j-this.balls.length);r>0&&this.balls.push(...o.slice(0,r))}for(const r of this.balls)this.capSpeed(r),r.x=_(r.x),r.y=_(r.y),r.vx=_(r.vx),r.vy=_(r.vy);this.pruneCollisionDamageCache(),this.evaluateWinnerState(),this.updateEffects(t),this.stepCounter+=1,this.stepCounter%15===0&&this.updateRoundPanels()}applyPerStepAbilities(t,e){const s=h[t.classKey];t.abilityState.splitCooldownLeft>0&&(t.abilityState.splitCooldownLeft=Math.max(0,t.abilityState.splitCooldownLeft-e)),t.abilityState.bossShockwaveCooldown>0&&(t.abilityState.bossShockwaveCooldown=Math.max(0,t.abilityState.bossShockwaveCooldown-e)),s.regenPerSecond&&(t.hp=Math.min(t.maxHp,t.hp+s.regenPerSecond*e),(this.stepCounter+t.id)%28===0&&this.effects.push({type:"plus",x:t.x,y:t.y-t.r-7,color:6747034,life:.22})),t.classKey==="trickster"&&(t.abilityState.tricksterDashTimer-=e,t.abilityState.tricksterDashTimer<=0&&(t.vx*=s.dashMultiplier,t.vy*=s.dashMultiplier,t.abilityState.tricksterDashTimer=s.dashCooldown,this.effects.push({type:"ring",x:t.x,y:t.y,color:16768358,life:.35,radius:t.r}))),t.classKey==="bulwark"&&(t.abilityState.bulwarkShieldTimeLeft>0?t.abilityState.bulwarkShieldTimeLeft=Math.max(0,t.abilityState.bulwarkShieldTimeLeft-e):(t.abilityState.bulwarkShieldCooldown-=e,t.abilityState.bulwarkShieldCooldown<=0&&(t.abilityState.bulwarkShieldTimeLeft=s.shieldDuration,t.abilityState.bulwarkShieldCooldown=s.shieldCooldown,this.effects.push({type:"ring",x:t.x,y:t.y,color:11989503,life:.42,radius:t.r+2}))))}applyArenaEffects(t,e,s,i){const o=this.getArenaRules();if(o.hazardTick&&this.stepCounter%o.hazardTick===0){const a=Math.floor(this.stepCounter/o.hazardTick),l=a*41%this.setup.arenaWidth,r=a*37%this.setup.arenaHeight;(Math.abs(t.x-l)<t.r*.7||Math.abs(t.y-r)<t.r*.7)&&s.set(t.id,(s.get(t.id)??0)+o.hazardDamage)}if(o.sanctumRadius){const a=this.setup.arenaWidth*.5,l=this.setup.arenaHeight*.5,r=t.x-a,c=t.y-l;r*r+c*c<=o.sanctumRadius*o.sanctumRadius&&i.set(t.id,(i.get(t.id)??0)+o.sanctumHealingPerSecond*e)}}resolveWallCollision(t){const e=t.r,s=this.setup.arenaWidth-t.r,i=t.r,o=this.setup.arenaHeight-t.r,a=h[t.classKey].wallBounceMult??1;let l=!1,r=0,c=0;if(t.x<e?(t.x=e,t.vx=Math.abs(t.vx)*a,l=!0,r=1,c=0):t.x>s&&(t.x=s,t.vx=-Math.abs(t.vx)*a,l=!0,r=-1,c=0),t.y<i?(t.y=i,t.vy=Math.abs(t.vy)*a,l=!0,r=0,c=1):t.y>o&&(t.y=o,t.vy=-Math.abs(t.vy)*a,l=!0,r=0,c=-1),l){const u=this.getArenaRules();return u.wallThorns&&(t.hp=Math.max(0,t.hp-u.wallThorns)),this.effects.push({type:"spark",x:t.x,y:t.y,color:14212841,life:.2}),{x:r,y:c}}return null}resolveBallCollision(t,e,s,i,o){const a=e.x-t.x,l=e.y-t.y,r=t.r+e.r,c=a*a+l*l;if(c>=r*r)return;let u=Math.sqrt(c),d=1,p=0;u>0?(d=a/u,p=l/u):u=0;const y=r-u;if(y>0){const T=1/t.mass,L=1/e.mass,R=T+L;t.x-=d*y*(T/R),t.y-=p*y*(T/R),e.x+=d*y*(L/R),e.y+=p*y*(L/R)}const C=e.vx-t.vx,k=e.vy-t.vy,w=C*d+k*p,x=Math.max(0,-w),v=this.getPairKey(t.id,e.id),b=this.canDealCollisionDamage(v),S=Wt({a:t,b:e,impact:x,normalX:d,normalY:p,canDealDamage:b}),$=1+(t.outgoingBonus??0),N=1+(e.outgoingBonus??0);if(S.damageToB*=$,S.damageToA*=N,S.healingForA*=$,S.healingForB*=N,b&&(S.damageToA>0||S.damageToB>0)&&(this.lastDamageTimesByPair.set(v,this.simTime),s.set(t.id,(s.get(t.id)??0)+S.damageToA+S.thornsToA),s.set(e.id,(s.get(e.id)??0)+S.damageToB+S.thornsToB),i.set(t.id,(i.get(t.id)??0)+S.healingForA),i.set(e.id,(i.get(e.id)??0)+S.healingForB)),this.effects.push({type:"spark",x:(t.x+e.x)*.5,y:(t.y+e.y)*.5,color:16777215,life:g(.14+x/900,.14,.36)}),this.tryBossShockwave(t,e,d,p),this.tryBossShockwave(e,t,-d,-p),this.trySpawnSplitChildren(t,e,x,d,p,o),this.trySpawnSplitChildren(e,t,x,-d,-p,o),w<0){const T=1/t.mass,L=1/e.mass,R=-1.98*w/(T+L),O=R*d,W=R*p;t.vx-=O*T,t.vy-=W*T,e.vx+=O*L,e.vy+=W*L}}tryBossShockwave(t,e,s,i){if(t.classKey!=="boss"||t.abilityState.bossShockwaveCooldown>0)return;const o=h.boss.shockwaveIntervalSteps;if((this.stepCounter+t.id+e.id)%o!==0)return;const a=75;e.vx+=s*a,e.vy+=i*a,t.vx-=s*a*.2,t.vy-=i*a*.2,t.abilityState.bossShockwaveCooldown=.5,this.effects.push({type:"ring",x:t.x,y:t.y,color:16761707,life:.25,radius:t.r+6}),this.stepCounter%24===0&&this.logCombatEvent(`Boss shockwave from #${t.id}`)}trySpawnSplitChildren(t,e,s,i,o,a){if(t.classKey!=="splitter"||!t.alive)return;const l=h.splitter;if(this.balls.length+a.length>=j||t.abilityState.splitCooldownLeft>0||t.abilityState.splitDepth>=l.maxSplitDepth||s<l.splitImpactThreshold)return;const r=-o,c=i,u=Math.max(8,Math.round(t.r*l.childRadiusMult)),d=Math.max(1,t.hp*l.childHpRatio),p=Math.max(180,Math.hypot(t.vx,t.vy)*l.childSpeedMult),y=u+3;t.alive=!1,t.hp=0;for(const C of[-1,1]){const k=t.x+r*y*C,w=t.y+c*y*C,x=t.vx+r*p*.45*C+i*42,v=t.vy+c*p*.45*C+o*42,b=X(this.nextBallId,"splitter",k,w,x,v);b.r=u,b.mass=Math.max(.42,t.mass*.62),b.maxHp=d,b.hp=d,b.abilityState.splitDepth=t.abilityState.splitDepth+1,b.abilityState.splitCooldownLeft=l.splitCooldown,this.applyUpgradesToBall(b),a.push(b),this.nextBallId+=1}this.effects.push({type:"ring",x:t.x,y:t.y,color:6220500,life:.35,radius:t.r+4}),this.logCombatEvent(`Splitter #${t.id} split on impact`),this.effects.push({type:"spark",x:(t.x+e.x)*.5,y:(t.y+e.y)*.5,color:10090212,life:.25})}trySpawnSplitChildrenFromWall(t,e,s,i){if(t.classKey!=="splitter"||!t.alive)return;const o=h.splitter;if(t.abilityState.splitCooldownLeft>0||t.abilityState.splitDepth>=o.maxSplitDepth||this.balls.length+i.length>=j)return;const a=-s,l=e,r=Math.max(8,Math.round(t.r*o.childRadiusMult)),c=Math.max(1,t.hp*o.childHpRatio),u=Math.max(170,Math.hypot(t.vx,t.vy)*o.childSpeedMult),d=r+3;t.alive=!1,t.hp=0;for(const p of[-1,1]){const y=t.x+a*d*p,C=t.y+l*d*p,k=t.vx+a*u*.35*p+e*34,w=t.vy+l*u*.35*p+s*34,x=X(this.nextBallId,"splitter",y,C,k,w);x.r=r,x.mass=Math.max(.42,t.mass*.62),x.maxHp=c,x.hp=c,x.abilityState.splitDepth=t.abilityState.splitDepth+1,x.abilityState.splitCooldownLeft=o.splitCooldown,this.applyUpgradesToBall(x),i.push(x),this.nextBallId+=1}this.effects.push({type:"ring",x:t.x,y:t.y,color:10090212,life:.3,radius:t.r+5}),this.logCombatEvent(`Splitter #${t.id} split on wall`)}capSpeed(t){const e=t.vx*t.vx+t.vy*t.vy,s=I*I;if(e>s){const i=Math.sqrt(e),o=I/i;t.vx*=o,t.vy*=o}}getPairKey(t,e){return t<e?`${t}:${e}`:`${e}:${t}`}canDealCollisionDamage(t){const e=this.lastDamageTimesByPair.get(t);return e==null?!0:this.simTime-e>=kt}pruneCollisionDamageCache(){if(!(this.simTime-this.lastPairPruneAt<.6)){this.lastPairPruneAt=this.simTime;for(const[t,e]of this.lastDamageTimesByPair.entries())this.simTime-e>Tt&&this.lastDamageTimesByPair.delete(t)}}spawnTrail(t){Math.hypot(t.vx,t.vy)<200||(this.stepCounter+t.id)%3!==0||this.effects.push({type:"trail",x:t.x,y:t.y,color:t.color,life:.18})}updateEffects(t){for(const e of this.effects)e.life-=t;this.effects=this.effects.filter(e=>e.life>0),this.effects.length>tt&&(this.effects=this.effects.slice(this.effects.length-tt))}getPixelMask(t){if(this.pixelMaskCache.has(t))return this.pixelMaskCache.get(t);const e=[];for(let s=-t;s<=t;s+=F)for(let i=-t;i<=t;i+=F)i*i+s*s<=t*t&&e.push([i,s]);return this.pixelMaskCache.set(t,e),e}drawPixelBall(t){const e=t.r,s=M.Display.Color.IntegerToColor(t.color),i=M.Display.Color.GetColor(g(s.red+48,0,255),g(s.green+48,0,255),g(s.blue+48,0,255)),o=M.Display.Color.GetColor(g(s.red-42,0,255),g(s.green-42,0,255),g(s.blue-42,0,255)),a=M.Display.Color.GetColor(g(s.red+20,0,255),g(s.green+20,0,255),g(s.blue+20,0,255));t.classKey==="boss"&&(this.graphics.lineStyle(3,16761707,.9),this.graphics.strokeCircle(t.x,t.y,e+6),this.graphics.lineStyle(1,2101508,.6),this.graphics.strokeCircle(t.x,t.y,e+10));const l=this.getPixelMask(e);for(const[c,u]of l){let d=t.color;c+u<-e*.25?d=i:c+u>e*.4?d=o:Math.abs(c)+Math.abs(u)<e*.4&&(d=a),this.graphics.fillStyle(d,1),this.graphics.fillRect(t.x+c,t.y+u,F,F)}this.graphics.fillStyle(1118481,1),this.graphics.fillRect(t.x-e,t.y-e,e*2,1),this.graphics.fillRect(t.x-e,t.y+e-1,e*2,1),this.graphics.fillRect(t.x-e,t.y-e,1,e*2),this.graphics.fillRect(t.x+e-1,t.y-e,1,e*2),this.graphics.fillStyle(16317180,.55),this.graphics.fillRect(t.x-Math.floor(e*.45),t.y-Math.floor(e*.45),2,2)}drawClassArt(t){const e=Math.round(t.x),s=Math.round(t.y),i=this.getClassGlyph(t.classKey);for(const o of i.dark)this.graphics.fillStyle(724760,.95),this.graphics.fillRect(e+o[0],s+o[1],o[2],o[3]);for(const o of i.light)this.graphics.fillStyle(12571866,.9),this.graphics.fillRect(e+o[0],s+o[1],o[2],o[3])}getClassGlyph(t){if(this.classGlyphCache.has(t))return this.classGlyphCache.get(t);const e={dark:[],light:[]};return t==="tank"?e.dark.push([-4,-4,8,8],[-8,-1,16,2]):t==="striker"?e.dark.push([2,-7,2,6],[-4,-1,10,2],[-8,5,2,2]):t==="medic"?e.dark.push([-1,-6,2,12],[-6,-1,12,2]):t==="trickster"?e.dark.push([-6,2,12,2],[-2,-6,2,8],[2,-6,2,8]):t==="sniper"?e.dark.push([-7,-1,14,2],[6,-2,2,4]):t==="vampire"?e.dark.push([-5,-4,3,8],[2,-4,3,8],[-2,2,4,4]):t==="bulwark"?(e.dark.push([-6,-5,12,10]),e.light.push([-1,-3,2,6])):t==="splitter"?e.dark.push([-7,-1,14,2],[-1,-7,2,14],[-5,-5,2,2],[3,3,2,2]):t==="boss"&&e.dark.push([-10,2,20,3],[-8,-6,16,2],[-9,-9,3,3],[-1,-10,2,4],[6,-9,3,3]),this.classGlyphCache.set(t,e),e}drawEffects(){for(const t of this.effects){const e=g(t.life*4,0,1);t.type==="trail"?(this.graphics.fillStyle(t.color,e*.5),this.graphics.fillRect(t.x-2,t.y-2,4,4)):t.type==="spark"?(this.graphics.fillStyle(t.color,e),this.graphics.fillRect(t.x-1,t.y-1,3,3),this.graphics.fillRect(t.x-5,t.y-1,2,2),this.graphics.fillRect(t.x+3,t.y-1,2,2),this.graphics.fillRect(t.x-1,t.y-5,2,2),this.graphics.fillRect(t.x-1,t.y+3,2,2)):t.type==="ring"?(this.graphics.lineStyle(2,t.color,e),this.graphics.strokeCircle(t.x,t.y,(t.radius??10)+(1-e)*6)):t.type==="plus"&&(this.graphics.fillStyle(t.color,e),this.graphics.fillRect(t.x-1,t.y-4,2,8),this.graphics.fillRect(t.x-4,t.y-1,8,2))}}drawAbilityCooldown(t){let e=null,s=9149364;if(t.classKey==="trickster"){const r=h.trickster.dashCooldown;e=g((t.abilityState.tricksterDashTimer??0)/r,0,1),s=15774761}else if(t.classKey==="bulwark"){const r=h.bulwark.shieldCooldown;(t.abilityState.bulwarkShieldTimeLeft??0)>0?(e=0,s=10217471):(e=g((t.abilityState.bulwarkShieldCooldown??0)/r,0,1),s=8239050)}else t.classKey==="boss"&&(e=g((t.abilityState.bossShockwaveCooldown??0)/.5,0,1),s=16761707);if(e==null)return;const i=Math.max(10,Math.floor(t.r*1.1)),o=3,a=t.x-i/2,l=t.y+t.r+8;this.graphics.fillStyle(988970,.9),this.graphics.fillRect(a,l,i,o),this.graphics.fillStyle(s,.95),this.graphics.fillRect(a+1,l+1,(i-2)*(1-e),o-2)}drawArenaOverlay(){const t=this.getArenaRules();if(t.sanctumRadius&&(this.graphics.lineStyle(2,7663794,.5),this.graphics.strokeCircle(this.setup.arenaWidth*.5,this.setup.arenaHeight*.5,t.sanctumRadius)),t.hazardTick){const e=Math.floor(this.stepCounter/t.hazardTick),s=e*41%this.setup.arenaWidth,i=e*37%this.setup.arenaHeight;this.graphics.lineStyle(1,16743034,.45),this.graphics.strokeLineShape(new M.Geom.Line(s,0,s,this.setup.arenaHeight)),this.graphics.strokeLineShape(new M.Geom.Line(0,i,this.setup.arenaWidth,i))}}renderScene(){this.graphics.clear(),this.graphics.fillStyle(1120294,1),this.graphics.fillRect(0,0,this.setup.arenaWidth,this.setup.arenaHeight),this.graphics.fillStyle(1779256,1);for(let a=0;a<this.setup.arenaHeight;a+=28)for(let l=a/28%2===0?0:14;l<this.setup.arenaWidth;l+=28)this.graphics.fillRect(l,a,14,14);this.graphics.fillStyle(660258,.18);for(let a=0;a<this.setup.arenaWidth;a+=52)this.graphics.fillRect(a,0,2,this.setup.arenaHeight);for(let a=0;a<this.setup.arenaHeight;a+=52)this.graphics.fillRect(0,a,this.setup.arenaWidth,2);this.graphics.lineStyle(A,12502480,1),this.graphics.strokeRect(A/2,A/2,this.setup.arenaWidth-A,this.setup.arenaHeight-A),this.graphics.fillStyle(725536,.2),this.graphics.fillRect(0,0,this.setup.arenaWidth,40),this.graphics.fillRect(0,this.setup.arenaHeight-40,this.setup.arenaWidth,40),this.drawArenaOverlay();for(const a of this.balls){this.drawPixelBall(a),this.drawClassArt(a),a.classKey==="bulwark"&&a.abilityState.bulwarkShieldTimeLeft>0&&(this.graphics.lineStyle(2,11071743,.8),this.graphics.strokeCircle(a.x,a.y,a.r+4)),a.classKey==="boss"&&(this.graphics.lineStyle(1,16773582,.45),this.graphics.strokeCircle(a.x,a.y,a.r+12));const l=a.r*2,r=4,c=g(a.hp/a.maxHp,0,1),u=a.x-l/2,d=a.y-a.r-11;this.graphics.fillStyle(1053462,1),this.graphics.fillRect(u,d,l,r);const p=M.Display.Color.Interpolate.ColorWithColor(M.Display.Color.ValueToColor(14498876),M.Display.Color.ValueToColor(3524938),100,Math.floor(c*100));this.graphics.fillStyle(M.Display.Color.GetColor(p.r,p.g,p.b),1),this.graphics.fillRect(u+1,d+1,(l-2)*c,r-2),this.drawAbilityCooldown(a)}if(this.balls.length===0&&!this.roundFinished&&(this.graphics.fillStyle(330002,.74),this.graphics.fillRect(this.setup.arenaWidth/2-200,this.setup.arenaHeight/2-32,400,64),this.graphics.lineStyle(2,9415119,.95),this.graphics.strokeRect(this.setup.arenaWidth/2-200,this.setup.arenaHeight/2-32,400,64)),this.drawEffects(),this.roundFinished){const a=Math.min(520,this.setup.arenaWidth-60),l=54,r=(this.setup.arenaWidth-a)/2,c=20;this.graphics.fillStyle(396054,.82),this.graphics.fillRect(r,c,a,l),this.graphics.lineStyle(2,this.winnerClassKey?h[this.winnerClassKey].color:16317180,1),this.graphics.strokeRect(r,c,a,l),this.graphics.fillStyle(16317180,1),this.graphics.fillRect(r+18,c+20,a-36,2);const u=this.winnerClassKey?`${h[this.winnerClassKey].label} WINS`:"DRAW";this.winnerText.setVisible(!0),this.winnerText.setText(u),this.winnerText.setColor(this.winnerClassKey?H(this.winnerClassKey):"#f8fafc"),this.winnerText.setPosition(this.setup.arenaWidth/2,c+l/2)}else this.winnerText.setVisible(!1);const t=m.map(a=>`${h[a].label}:${this.setup.classCounts[a]}`).join(" "),e=this.getCurrentClassCounts(),s=m.map(a=>`${h[a].label}:${e[a]}`).join(" "),i=[...m].map(a=>({classKey:a,prize:this.prizeLedger[a]})).sort((a,l)=>l.prize-a.prize||m.indexOf(a.classKey)-m.indexOf(l.classKey))[0],o=this.tournament.active?`  tournament:${this.tournament.currentMatchIndex+1}/${this.tournament.matches.length}`:"";this.hudText.setText(`mode:${this.mode}  step:${this.stepCounter}  alive:${this.balls.length}  size:${this.setup.arenaWidth}x${this.setup.arenaHeight}${o}
setup:${t}
alive:${s}
leader:${h[i.classKey].label} ${i.prize}
fast-forward:${this.fastForward?"ON":"OFF"}  paused:${this.paused?"ON":"OFF"}${this.roundFinished?`
winner:${this.winnerClassKey?h[this.winnerClassKey].label:"Draw"}`:""}`)}}const Xt={type:M.AUTO,width:Y.arenaWidth,height:Y.arenaHeight,backgroundColor:"#1a1d26",pixelArt:!0,antialias:!1,roundPixels:!0,scene:jt};new M.Game(Xt);
