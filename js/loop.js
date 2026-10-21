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

function gameLoop() {
  if (!State.running || State.paused || State.rogueSelecting) return;

  ctx.fillStyle = '#05070c'; ctx.fillRect(0, 0, W, H);
  State.stars.forEach(s => { s.y += s.s; if (s.y > H) s.y = 0; ctx.fillStyle = '#fff'; ctx.fillRect(s.x, s.y, 2, 2); });

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
      if (State.hull <= 0) { gameOver(); return; }
    }
    if (eb.y > H + 30) State.enemyBullets.splice(i, 1);
  }

  State.spawnTimer++;
  if (State.score >= 2000 && !State.boss) {
    State.boss = new Boss(W);
  } else if (State.spawnTimer % 60 === 0 && !State.boss) {
    State.enemies.push(new Enemy(W));
  }

  if (State.boss) {
    State.boss.update(W); State.boss.draw(ctx);
    for (let i = State.bullets.length - 1; i >= 0; i--) {
      let b = State.bullets[i];
      if (Math.abs(b.x - State.boss.x) < 45 && Math.abs(b.y - State.boss.y) < 30) {
        State.boss.hp -= b.dmg; State.bullets.splice(i, 1);
        if (State.boss.hp <= 0) { State.score += 1500; State.boss = null; break; }
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
          State.score += 50; State.enemies.splice(i, 1);
          State.xp += 25;
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
