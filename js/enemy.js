class Enemy {
  constructor(W) {
    this.x = Math.random() * (W - 40) + 20;
    this.y = -20; this.hp = 30;
    this.vx = (Math.random() - 0.5) * 1.5;
  }
  update() {
    this.y += 2.5;
    this.x += this.vx;
  }
  draw(ctx) {
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + 10);
    ctx.lineTo(this.x + 10, this.y - 10);
    ctx.lineTo(this.x - 10, this.y - 10);
    ctx.fill();
  }
}

class Boss {
  constructor(W) {
    this.x = W / 2; this.y = -60;
    this.targetY = 90;
    this.hp = 1800; this.maxHp = 1800;
    this.vx = 2; this.timer = 0; this.phase = 1;
    this.parts = {
      left: { xOff: -32, yOff: 8, hp: 250, destroyed: false, color: '#00f0ff' },
      right: { xOff: 32, yOff: 8, hp: 250, destroyed: false, color: '#ff007f' }
    };
  }
  update(W) {
    if (this.y < this.targetY) this.y += 1.5;
    else {
      this.x += this.vx;
      if (this.x < 60 || this.x > W - 60) this.vx *= -1;
    }
    const pct = this.hp / this.maxHp;
    let np = pct <= 0.33 ? 3 : pct <= 0.66 ? 2 : 1;
    if (np !== this.phase) { this.phase = np; this.timer = 0; State.enemyBullets = []; }

    for (let i = State.bullets.length - 1; i >= 0; i--) {
      let b = State.bullets[i];
      for (let side of ['left', 'right']) {
        let p = this.parts[side];
        if (p.destroyed) continue;
        if (Math.hypot(b.x - (this.x + p.xOff), b.y - (this.y + p.yOff)) < 14) {
          p.hp -= b.dmg; State.bullets.splice(i, 1);
          if (p.hp <= 0) { p.destroyed = true; this.hp -= 150; State.score += 300; }
          break;
        }
      }
    }
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
  draw(ctx) {
    ctx.save(); ctx.translate(this.x, this.y);
    ctx.fillStyle = '#180511'; ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(45, -20); ctx.lineTo(0, -15); ctx.lineTo(-45, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let side of ['left', 'right']) {
      let p = this.parts[side];
      if (p.destroyed) continue;
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.xOff, p.yOff, 8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(p.xOff - 10, p.yOff - 15, 20, 3);
      ctx.fillStyle = p.color; ctx.fillRect(p.xOff - 10, p.yOff - 15, 20 * (p.hp/250), 3);
    }
    ctx.restore();
  }
}
