// 核心游戏逻辑（主循环、实体更新、碰撞）
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let W, H;

function resize() {
  const rect = document.getElementById('canvas-wrap').getBoundingClientRect();
  W = canvas.width = rect.width;
  H = canvas.height = rect.height;
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
    if (this.timer >= 8) { this.shoot(); this.timer = 0; }
  }
  shoot() {
    const speed = 10 + State.activeChips.laser * 3;
    State.bullets.push({ x: this.x, y: this.y - 15, vx: 0, vy: -speed, dmg: 25 });
    if (State.activeChips.spread > 0) {
      State.bullets.push({ x: this.x - 10, y: this.y - 10, vx: -3, vy: -speed, dmg: 15 });
      State.bullets.push({ x: this.x + 10, y: this.y - 10, vx: 3, vy: -speed, dmg: 15 });
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
    this.y = -20;
    this.hp = 30;
  }
  update() {
    this.y += 2.5;
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

function initStars() {
  State.stars = [];
  for (let i = 0; i < 50; i++) {
    State.stars.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 2 + 0.5 });
  }
}

function gameLoop() {
  if (!State.running || State.paused || State.rogueSelecting) return;

  ctx.fillStyle = '#05070c';
  ctx.fillRect(0, 0, W, H);

  // 星空
  State.stars.forEach(s => {
    s.y += s.s;
    if (s.y > H) s.y = 0;
    ctx.fillStyle = '#fff';
    ctx.fillRect(s.x, s.y, 2, 2);
  });

  // 玩家
  if (State.player) {
    State.player.update();
    State.player.draw();
  }

  // 玩家子弹
  for (let i = State.bullets.length - 1; i >= 0; i--) {
    let b = State.bullets[i];
    b.x += b.vx; b.y += b.vy;
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
    if (b.y < 0) State.bullets.splice(i, 1);
  }

  // 生成敌人
  State.spawnTimer++;
  if (State.spawnTimer % 60 === 0) {
    State.enemies.push(new Enemy());
  }

  // 敌人更新与碰撞
  for (let i = State.enemies.length - 1; i >= 0; i--) {
    let e = State.enemies[i];
    e.update();
    e.draw();

    // 打中敌人
    for (let j = State.bullets.length - 1; j >= 0; j--) {
      let b = State.bullets[j];
      if (Math.hypot(b.x - e.x, b.y - e.y) < 15) {
        e.hp -= b.dmg;
        State.bullets.splice(j, 1);
        if (e.hp <= 0) {
          State.score += 50;
          State.enemies.splice(i, 1);
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

// 触摸控制
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
