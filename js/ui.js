const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let W, H;

function resize() {
  const rect = document.getElementById('canvas-wrap').getBoundingClientRect();
  W = canvas.width = rect.width;
  H = canvas.height = rect.height;
}

function initStars() {
  State.stars = [];
  for (let i = 0; i < 50; i++) State.stars.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 2 + 0.5 });
}

function spawnFloatingText(x, y, text, color = '#ffaa00') {
  const layer = document.getElementById('fx-layer');
  if (!layer) return;
  const el = document.createElement('div');
  el.className = 'floating-text';
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.color = color;
  el.style.textShadow = `0 0 5px ${color}, 0 0 10px ${color}`;
  layer.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function updateHUD() {
  document.getElementById('hud-score').innerText = State.score;
  document.getElementById('bomb-count').innerText = State.bombs;
  const sPct = Math.max(0, (State.shield / State.maxShield) * 100);
  const hPct = Math.max(0, (State.hull / State.maxHull) * 100);
  document.getElementById('fill-shield').style.width = sPct + '%';
  document.getElementById('fill-hull').style.width = hPct + '%';
}

function togglePause() {
  if (!State.running) return;
  State.paused = !State.paused;
  if (!State.paused) requestAnimationFrame(gameLoop);
}

function useBomb() {
  if (State.bombs <= 0 || !State.running || State.paused) return;
  State.bombs--; State.enemyBullets = [];
  State.enemies.forEach(e => State.score += 50); State.enemies = [];
  if (State.boss) State.boss.hp -= 400;
  updateHUD();
}

function startGame() {
  document.getElementById('screen-start').style.display = 'none';
  document.getElementById('screen-gameover').style.display = 'none';
  document.getElementById('screen-rogue').classList.remove('show');
  
  resize(); initStars();
  State.running = true; State.paused = false;
  State.score = 0; State.shield = 100; State.hull = 100; State.bombs = 1;
  State.xp = 0; State.techLevel = 1; State.nextXp = 100;
  State.activeChips = { spread: 0, laser: 0, drone: 0 };
  State.synergies = []; State.evolutions = []; State.drones = [];
  State.bullets = []; State.enemies = []; State.boss = null; State.particles = [];
  State.player = new Player(W, H);
  
  updateHUD();
  requestAnimationFrame(gameLoop);
}

function checkLevelUp() {
  State.xp = 0; State.nextXp = Math.floor(State.nextXp * 1.5); State.techLevel++;
  State.rogueSelecting = true;
  if (State.player) spawnFloatingText(State.player.x, State.player.y - 40, 'LEVEL UP!', '#00f0ff');
  const container = document.getElementById('rogue-cards');
  container.innerHTML = '';
  const shuffled = [...CHIPS].sort(() => 0.5 - Math.random()).slice(0, 3);
  
  shuffled.forEach(chip => {
    const div = document.createElement('div');
    div.className = 'rogue-card';
    div.innerHTML = `<div class="rogue-icon">${chip.icon}</div><div><b>${chip.name}</b><br><small>${chip.desc}</small></div>`;
    div.onclick = () => {
      if (chip.id === 'spread') State.activeChips.spread++;
      if (chip.id === 'laser') State.activeChips.laser++;
      if (chip.id === 'shield') State.shield = Math.min(State.maxShield, State.shield + 40);
      if (chip.id === 'nuke') State.bombs++;
      if (chip.id === 'drone') {
        State.activeChips.drone++;
        State.drones = [];
        const count = State.activeChips.drone >= 3 ? State.activeChips.drone + 2 : State.activeChips.drone;
        for (let i = 0; i < count; i++) State.drones.push(new Drone((Math.PI*2/count)*i));
      }
      checkSynergiesAndEvolutions();
      document.getElementById('screen-rogue').classList.remove('show');
      State.rogueSelecting = false;
      requestAnimationFrame(gameLoop);
    };
    container.appendChild(div);
  });
  document.getElementById('screen-rogue').classList.add('show');
}

function checkSynergiesAndEvolutions() {
  if (State.activeChips.spread >= 3 && !State.evolutions.includes('spread')) State.evolutions.push('spread');
  if (State.activeChips.laser >= 3 && !State.evolutions.includes('laser')) State.evolutions.push('laser');
  if (State.activeChips.spread >= 1 && State.activeChips.laser >= 1 && !State.synergies.includes('crossfire')) {
    State.synergies.push('crossfire');
    if (State.player) spawnFloatingText(State.player.x, State.player.y - 60, '⚡ 羁绊: 交叉火力', '#ffaa00');
  }
}

// === 核心游戏循环 ===
function gameLoop() {
  if (!State.running || State.paused || State.rogueSelecting) return;
  ctx.fillStyle = '#05070c'; ctx.fillRect(0, 0, W, H);
  State.stars.forEach(s => { s.y += s.s; if (s.y > H) s.y = 0; ctx.fillStyle = '#fff'; ctx.fillRect(s.x, s.y, 2, 2); });

  // 粒子渲染
  for (let i = State.particles.length - 1; i >= 0; i--) {
    let p = State.particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--;
    ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.globalAlpha = 1;
    if (p.life <= 0) State.particles.splice(i, 1);
  }

  if (State.player) {
    State.player.update(); State.player.draw(ctx);
    State.drones.forEach(d => { d.update(State.player); d.draw(ctx); });
  }

  for (let i = State.bullets.length - 1; i >= 0; i--) {
    let b = State.bullets[i]; b.x += b.vx; b.y += b.vy;
    ctx.fillStyle = b.color; ctx.fillRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
    if (b.y < -30 || b.y > H + 30) State.bullets.splice(i, 1);
  }

  for (let i = State.enemyBullets.length - 1; i >= 0; i--) {
    let eb = State.enemyBullets[i]; eb.x += eb.vx; eb.y += eb.vy;
    ctx.fillStyle = '#ff0055'; ctx.beginPath(); ctx.arc(eb.x, eb.y, eb.r, 0, Math.PI*2); ctx.fill();
    if (State.player && Math.hypot(eb.x - State.player.x, eb.y - State.player.y) < eb.r + 10) {
      State.shield -= 25;
      if (State.shield < 0) { State.hull += State.shield; State.shield = 0; }
      State.enemyBullets.splice(i, 1);
      if (State.hull <= 0) { 
        document.getElementById('res-score').innerText = State.score;
        document.getElementById('screen-gameover').style.display = 'flex';
        State.running = false; return; 
      }
    }
    if (eb.y > H + 30) State.enemyBullets.splice(i, 1);
  }

  State.spawnTimer++;
  if (State.score >= 2000 && !State.boss) State.boss = new Boss(W);
  else if (State.spawnTimer % 60 === 0 && !State.boss) State.enemies.push(new Enemy(W));

  if (State.boss) {
    State.boss.update(W); State.boss.draw(ctx);
    for (let i = State.bullets.length - 1; i >= 0; i--) {
      let b = State.bullets[i];
      if (Math.abs(b.x - State.boss.x) < 45 && Math.abs(b.y - State.boss.y) < 30) {
        State.boss.hp -= b.dmg; State.bullets.splice(i, 1);
        if (State.boss.hp <= 0) { 
          State.score += 1500; 
          for(let k=0; k<50; k++) State.particles.push({ x: State.boss.x, y: State.boss.y, vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12, life: 30 + Math.random()*20, maxLife: 50, size: Math.random()*4 + 2, color: Math.random()>0.5 ? '#ffaa00' : '#ff0055' });
          State.boss = null; break; 
        }
      }
    }
  }

  for (let i = State.enemies.length - 1; i >= 0; i--) {
    let e = State.enemies[i]; e.update(); e.draw(ctx);
    for (let j = State.bullets.length - 1; j >= 0; j--) {
      let b = State.bullets[j];
      if (Math.hypot(b.x - e.x, b.y - e.y) < 15) {
        e.hp -= b.dmg; State.bullets.splice(j, 1);
        if (e.hp <= 0) {
          State.score += 50; State.enemies.splice(i, 1); State.xp += 25;
          for(let k=0; k<10; k++) State.particles.push({ x: e.x, y: e.y, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, life: 20 + Math.random()*10, maxLife: 30, size: Math.random()*3 + 1, color: '#ff007f' });
          if (State.xp >= State.nextXp) checkLevelUp();
          break;
        }
      }
    }
    if (e.y > H) State.enemies.splice(i, 1);
  }

  updateHUD();
  requestAnimationFrame(gameLoop);
}

let isDown = false;
canvas.addEventListener('pointerdown', e => { isDown = true; move(e); });
window.addEventListener('pointermove', e => { if (isDown) move(e); });
window.addEventListener('pointerup', () => isDown = false);
function move(e) {
  if (!State.player || State.paused) return;
  const rect = canvas.getBoundingClientRect();
  State.player.tx = e.clientX - rect.left;
  State.player.ty = e.clientY - rect.top;
}
