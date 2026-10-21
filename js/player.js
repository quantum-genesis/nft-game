class Player {
  constructor(W, H) {
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
    const dmg = State.synergies.includes('crossfire') ? 35 : 25;
    const color = State.synergies.includes('crossfire') ? '#ffaa00' : '#00f0ff';

    State.bullets.push({ x: this.x, y: this.y - 15, vx: 0, vy: -speed, w: 4, h: 16, dmg, color });
    
    if (State.activeChips.spread > 0) {
      State.bullets.push({ x: this.x - 10, y: this.y - 10, vx: -3, vy: -speed, w: 3, h: 12, dmg: 15, color });
      State.bullets.push({ x: this.x + 10, y: this.y - 10, vx: 3, vy: -speed, w: 3, h: 12, dmg: 15, color });
    }
    if (State.evolutions.includes('spread')) {
      for (let a = 0; a < 8; a++) {
        const ang = (Math.PI * 2 / 8) * a;
        State.bullets.push({ x: this.x, y: this.y, vx: Math.cos(ang)*6, vy: Math.sin(ang)*6, w: 4, h: 4, dmg: 12, color });
      }
    }
    if (State.evolutions.includes('laser')) {
      State.bullets.push({ x: this.x, y: this.y - 25, vx: 0, vy: -15, w: 8, h: 30, dmg: 45, color: '#ffaa00' });
    }
  }
  draw(ctx) {
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - 15);
    ctx.lineTo(this.x + 12, this.y + 10);
    ctx.lineTo(this.x - 12, this.y + 10);
    ctx.fill();
  }
}

class Drone {
  constructor(angle) {
    this.angle = angle; this.x = 0; this.y = 0; this.timer = 0;
  }
  update(player) {
    const t = performance.now() * 0.002;
    const radius = State.activeChips.drone >= 3 ? 55 : 40;
    this.x = player.x + Math.cos(t + this.angle) * radius;
    this.y = player.y + 20 + Math.sin(t * 1.3 + this.angle) * 15;
    
    this.timer++;
    if (this.timer >= (State.activeChips.drone >= 3 ? 16 : 28)) {
      this.timer = 0;
      State.bullets.push({ x: this.x, y: this.y, vx: 0, vy: -9, w: 3, h: 10, dmg: 10, color: '#00ff66' });
    }
  }
  draw(ctx) {
    ctx.fillStyle = '#00ff66';
    ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2); ctx.fill();
  }
}
