function updateHUD() {
  document.getElementById('hud-score').innerText = State.score;
  document.getElementById('bomb-count').innerText = State.bombs;
  const sPct = Math.max(0, (State.shield / State.maxShield) * 100);
  const hPct = Math.max(0, (State.hull / State.maxHull) * 100);
  document.getElementById('fill-shield').style.width = sPct + '%';
  document.getElementById('fill-hull').style.width = hPct + '%';
}

function useBomb() {
  if (State.bombs <= 0 || !State.running || State.paused) return;
  State.bombs--; State.enemyBullets = [];
  State.enemies.forEach(e => State.score += 50); State.enemies = [];
  if (State.boss) State.boss.hp -= 400;
  updateHUD();
}

function togglePause() {
  if (!State.running) return;
  State.paused = !State.paused;
  if (!State.paused) requestAnimationFrame(gameLoop);
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
  State.bullets = []; State.enemies = []; State.boss = null;
  State.player = new Player();
  
  updateHUD();
  requestAnimationFrame(gameLoop);
}

// 升级选芯片逻辑
function checkLevelUp() {
  State.xp = 0; State.nextXp = Math.floor(State.nextXp * 1.5); State.techLevel++;
  State.rogueSelecting = true;
  
  const container = document.getElementById('rogue-cards');
  container.innerHTML = '';
  const shuffled = [...CHIPS].sort(() => 0.5 - Math.random()).slice(0, 3);
  
  shuffled.forEach(chip => {
    const div = document.createElement('div');
    div.className = 'rogue-card';
    div.innerHTML = `<div class="rogue-icon">${chip.icon}</div><div><b>${chip.name}</b><br><small>${chip.desc}</small></div>`;
    div.onclick = () => {
      // 应用芯片
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

      // 检查羁绊与进化
      checkSynergiesAndEvolutions();

      document.getElementById('screen-rogue').classList.remove('show');
      State.rogueSelecting = false;
      requestAnimationFrame(gameLoop);
    };
    container.appendChild(div);
  });
  
  document.getElementById('screen-rogue').classList.add('show');
}

// 检查进化与羁绊
function checkSynergiesAndEvolutions() {
  // 武器进化
  if (State.activeChips.spread >= 3 && !State.evolutions.includes('spread')) State.evolutions.push('spread');
  if (State.activeChips.laser >= 3 && !State.evolutions.includes('laser')) State.evolutions.push('laser');
  
  // 羁绊：散射 + 激光 = 交叉火力
  if (State.activeChips.spread >= 1 && State.activeChips.laser >= 1 && !State.synergies.includes('crossfire')) {
    State.synergies.push('crossfire');
    alert("⚡ 羁绊激活：交叉火力 (主炮伤害+40% 且变色)");
  }
}

window.addEventListener('load', () => {
  resize(); initStars();
  ctx.fillStyle = '#05070c'; ctx.fillRect(0, 0, W, H);
});

function connectWallet() {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.request({ method: 'eth_requestAccounts' })
      .then(acc => document.getElementById('btn-wallet').innerText = '🦊 ' + acc[0].slice(0, 5) + '...' + acc[0].slice(-4))
      .catch(() => alert('连接被拒绝'));
  } else alert('请在钱包 DApp 浏览器中打开');
}
