const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let W, H;

function resize() {
  const rect = document.getElementById('canvas-wrap').getBoundingClientRect();
  W = canvas.width = rect.width;
  H = canvas.height = rect.height;
}

// 无人机类
class Drone {
  constructor(angle) {
    this.angle = angle;
    this.x = 0; this.y = 0;
    this.timer = 0;
  }
  update(player, index, total) {
    const t = performance.now() * 0.002;
    const radius = State.activeChips.drone >= 3 ? 55 : 40;
    this.x = player.x + Math.cos(t + this.angle) * radius;
    this.y = player.y + 20 + Math.sin(t * 1.3 + this.angle) * 15;
    
    this.timer++;
    const interval = State.activeChips.drone >= 3 ? 16 : 28;
    if (this.timer >= interval) {
      this.timer = 0;
      State.bullets.push({ x: this.x, y: this.y, vx: 0, vy: -9, w: 3, h: 10, dmg: 10, color: '#00ff66' });
    }
  }
  draw() {
    ctx.fillStyle = '#00ff66';
    ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2); ctx.fill();
  }
}

class Player {
  constructor() {
    this.x = W / 2; this.y = H - 80;
    this.tx = this.x; this.ty = this.y;
    this.timer = 0;
  }
  update() {
    this.x += (this.tx - this.x) * 0.3;
    this.y += (this.ty - this.y) * 0.3;
    this.timer++;
    if (this.timer >= 7) { this.shoot(); this.timer = 0; }
  }
  shoot() {
    const speed = 10 + State.activeChips.laser * 3;
    const isCrossfire = State.synergies.includes('crossfire');
    const dmg = isCrossfire ? 35 : 25;
    const color = isCrossfire ? '#ffaa00' : '#00f0ff';

    // 主弹
    State.bullets.push({ x: this.x, y: this.y - 15, vx: 0, vy: -speed, w: 4, h: 16, dmg: dmg, color: color });
    
    // 散射
    if (State.activeChips.spread > 0) {
      State.bullets.push({ x: this.x - 10, y: this.y - 10, vx: -3, vy: -speed, w: 3, h: 12, dmg: 15, color: color });
      State.bullets.push({ x: this.x + 10, y: this.y - 10, vx: 3, vy: -speed, w: 3, h: 12, dmg: 15, color: color });
    }
    // 进化：环形弹幕
    if (State.evolutions.includes('spread')) {
      for (let a = 0; a < 8; a++) {
        const ang = (Math.PI * 2 / 8) * a;
        State.bullets.push({ x: this.x, y: this.y, vx: Math.cos(ang)*6, vy: Math.sin(ang)*6, w: 4, h: 4, dmg: 12, color: color });
      }
    }
    // 进化：重型光矛
    if (State.evolutions.includes('laser')) {
      State.bullets.push({ x: this.x, y: this.y - 25, vx: 0, vy: -15, w: 8, h: 30, dmg: 45, color: '#ffaa00' });
    }
  }
  draw() {
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - 15);
    ctx.lineTo(this.x + 12, this.y + 10);
    ctx.lineTo(this.x - 12, this.y + 10);
    ctx.fill();
  }
}

class Enemy {
  constructor() {
    this.x = Math.random() * (W - 40) + 20;
    this.y = -20; this.hp = 30;
    this.vx = (Math.random() - 0.5) * 1.5;
  }
  update() {
    this.y += 2.5;
    this.x += this.vx;
    if (this.x < 20 || this.x > W - 20) this.vx *= -1;
  }
  draw() {
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + 10);
    ctx.lineTo(this.x + 10, this.y - 10);
    ctx.lineTo(this.x - 10, this.y - 10);
    ctx.fill();
  }
}

// Boss 类
class Boss {
  constructor() {
    this.x = W / 2; this.y = -60;
    this.targetY = 90;
    this.hp = 1800; this.maxHp = 1800;
    this.vx = 2; this.timer = 0;
    this.phase = 1;
    this.parts = {
      left: { xOff: -32, yOff: 8, hp: 250, destroyed: false, color: '#00f0ff' },
      right: { xOff: 32, yOff: 8, hp: 250, destroyed: false, color: '#ff007f' }
    };
  }
  update() {
    if (this.y < this.targetY) this.y += 1.5;
    else {
      this.x += this.vx;
      if (this.x < 60 || this.x > W - 60) this.vx *= -1;
    }

    // 阶段判定
    const pct = this.hp / this.maxHp;
    let np = pct <= 0.33 ? 3 : pct <= 0.66 ? 2 : 1;
    if (np !== this.phase) {
      this.phase = np;
      this.timer = 0;
      State.enemyBullets = []; // 清屏
    }

    // 炮塔被子弹击中
    for (let i = State.bullets.length - 1; i >= 0; i--) {
      let b = State.bullets[i];
      for (let side of ['left', 'right']) {
        let p = this.parts[side];
        if (p.destroyed) continue;
        if (Math.hypot(b.x - (this.x + p.xOff), b.y - (this.y + p.yOff)) < 14) {
          p.hp -= b.dmg;
          State.bullets.splice(i, 1);
          if (p.hp <= 0) {
            p.destroyed = true;
            this.hp -= 150;
            State.score += 300;
          }
          break;
        }
      }
    }

    // 射击
    this.timer++;
    const interval = this.phase === 3 ? 40 : this.phase === 2 ? 50 : 60;
    if (this.timer % interval === 0) {
      const spread = this.phase === 3 ? 7 : this.phase === 2 ? 6 : 5;
      const half = Math.floor(spread / 2);
      for (let a = -half; a <= half; a++) {
        State.enemyBullets.push({ x: this.x, y: this.y + 25, vx: a * 1.3, vy: 3.2, r: 5 });
      }
    }
    if (this.timer % 120 === 0) {
      if (!this.parts.left.destroyed) State.enemyBullets.push({ x: this.x - 32, y: this.y + 20, vx: -1.5, vy: 3, r: 4 });
      if (!this.parts.right.destroyed) State.enemyBullets.push({ x: this.x + 32, y: this.y + 20, vx: 1.5, vy: 3, r: 4 });
    }
  }
  draw() {
    ctx.save(); ctx.translate(this.x, this.y);
    ctx.fillStyle = '#180511'; ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 30); ctx.lineTo(45, -20); ctx.lineTo(0, -15); ctx.lineTo(-45, -20); ctx.closePath();
    ctx.fill(); ctx.stroke();
    
    for (let side of ['left', 'right']) {
      let p = this.parts[side];
      if (p.destroyed) continue;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.xOff, p.yOff, 8, 0, Math.PI*2); ctx.fill();
      // 炮塔血条
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(p.xOff - 10, p.yOff - 15, 20, 3);
      ctx.fillStyle = p.color; ctx.fillRect(p.xOff - 10, p.yOff - 15, 20 * (p.hp/250), 3);
    }
    ctx.restore();
  }
}

function initStars() {
  State.stars = [];
  for (let i = 0; i < 50; i++) State.stars.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 2 + 0.5 });
}

function gameLoop() {
  if (!State.running || State.paused || State.rogueSelecting) return;

  ctx.fillStyle = '#05070c'; ctx.fillRect(0, 0, W, H);
  State.stars.forEach(s => { s.y += s.s; if (s.y > H) s.y = 0; ctx.fillStyle = '#fff'; ctx.fillRect(s.x, s.y, 2, 2); });

  // 玩家与无人机
  if (State.player) {
    State.player.update(); State.player.draw();
    State.drones.forEach((d, i) => { d.update(State.player, i, State.drones.length); d.draw(); });
  }

  // 玩家子弹
  for (let i = State.bullets.length - 1; i >= 0; i--) {
    let b = State.bullets[i]; b.x += b.vx; b.y += b.vy;
    ctx.fillStyle = b.color; ctx.fillRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
    if (b.y < -30 || b.y > H + 30) State.bullets.splice(i, 1);
  }

  // 敌弹与碰撞
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

  // 生成敌机 / Boss
  State.spawnTimer++;
  if (State.score >= 2000 && !State.boss) {
    State.boss = new Boss();
  } else if (State.spawnTimer % 60 === 0 && !State.boss) {
    State.enemies.push(new Enemy());
  }

  // Boss 更新
  if (State.boss) {
    State.boss.update(); State.boss.draw();
    // 主弹打Boss
    for (let i = State.bullets.length - 1; i >= 0; i--) {
      let b = State.bullets[i];
      if (Math.abs(b.x - State.boss.x) < 45 && Math.abs(b.y - State.boss.y) < 30) {
        State.boss.hp -= b.dmg; State.bullets.splice(i, 1);
        if (State.boss.hp <= 0) { State.score += 1500; State.boss = null; break; }
      }
    }
  }

  // 敌机更新
  for (let i = State.enemies.length - 1; i >= 0; i--) {
    let e = State.enemies[i]; e.update(); e.draw();
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
