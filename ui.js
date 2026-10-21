// 用户界面逻辑（HUD、弹窗、按钮交互）
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
  State.bombs--;
  State.enemies.forEach(e => State.score += 50);
  State.enemies = [];
  State.enemyBullets = [];
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
  State.activeChips = { spread: 0, laser: 0 };
  State.bullets = []; State.enemies = [];
  State.player = new Player();
  
  updateHUD();
  requestAnimationFrame(gameLoop);
}

function checkLevelUp() {
  State.xp = 0;
  State.nextXp = Math.floor(State.nextXp * 1.5);
  State.techLevel++;
  State.rogueSelecting = true;
  
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
      
      document.getElementById('screen-rogue').classList.remove('show');
      State.rogueSelecting = false;
      requestAnimationFrame(gameLoop);
    };
    container.appendChild(div);
  });
  
  document.getElementById('screen-rogue').classList.add('show');
}
