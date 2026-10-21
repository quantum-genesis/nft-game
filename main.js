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
