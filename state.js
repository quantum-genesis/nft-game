// 核心合约配置 (Base 主网)
// ==========================================
const CONTRACTS = {
  NFT: "0xE40285906A9f18B598a3cE4d51B5dEcB4c1d739b",
  TOKEN: "0xcBa0df1F014b556c44E7DD25a6Db874b6B61b776",
  GAME: "0x0625E5D6935b621F7f07014faAF73f9c1d388aB6"
};
const State = {
  running: false, paused: false, rogueSelecting: false,
  score: 0, techLevel: 1, xp: 0, nextXp: 100,
  shield: 100, maxShield: 100, hull: 100, maxHull: 100,
  bombs: 1,
  activeChips: { spread: 0, laser: 0, drone: 0 },
  synergies: [], evolutions: [],
  bullets: [], enemyBullets: [], enemies: [], stars: [], drones: [], particles: [],
  player: null, boss: null, spawnTimer: 0
};

const CHIPS = [
  { id: 'spread', name: '散射矩阵', icon: '🔱', desc: '主炮额外发射 2 发子弹。' },
  { id: 'laser', name: '脉冲聚焦', icon: '⚡', desc: '弹速与伤害提升。' },
  { id: 'drone', name: '浮游战机', icon: '🛸', desc: '生成 1 架协同僚机。' },
  { id: 'shield', name: '纳米修复', icon: '🛡️', desc: '修复 40% 护盾。' },
  { id: 'nuke', name: '量子裂变', icon: '☢️', desc: '补充 1 枚核弹。' }
];
