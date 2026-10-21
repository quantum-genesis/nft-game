// 全局状态和配置
const State = {
  running: false, paused: false, rogueSelecting: false,
  score: 0, techLevel: 1, xp: 0, nextXp: 100,
  shield: 100, maxShield: 100, hull: 100, maxHull: 100,
  bombs: 1,
  activeChips: { spread: 0, laser: 0 },
  bullets: [], enemyBullets: [], enemies: [], stars: [],
  player: null, spawnTimer: 0
};

const CHIPS = [
  { id: 'spread', name: '散射矩阵', icon: '🔱', desc: '主炮额外发射 2 发子弹。' },
  { id: 'laser', name: '脉冲聚焦', icon: '⚡', desc: '弹速提升 40%。' },
  { id: 'shield', name: '纳米修复', icon: '🛡️', desc: '修复 40% 护盾。' },
  { id: 'nuke', name: '量子裂变', icon: '☢️', desc: '补充 1 枚核弹。' }
];
