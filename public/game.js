// ゲーム基本設定
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let width, height;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight * 0.6; // 最大60vh
  canvas.width = width;
  canvas.height = height;
}
resize();
window.addEventListener('resize', resize);

// ゲーム変数
let score = 0;
let highscore = localStorage.getItem('highscore') || 0;
document.getElementById('highscore').textContent = highscore;

let gameRunning = false;
let obstacles = [];
let coins = [];

const GRAVITY = 0.7;
const JUMP_POWER = 15;

const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;

let player = {
  x: 100,
  y: height - PLAYER_HEIGHT,
  vy: 0,
  jumping: false,
  skin: 0
};

const OBSTACLE_WIDTH = 40;
const OBSTACLE_HEIGHT = 60;

const COIN_SIZE = 30;

// スキン画像ロード
const skins = [
  'images/skin1.png',
  'images/skin2.png',
  'images/skin3.png'
];
const skinImages = [];
skins.forEach(src => {
  const img = new Image();
  img.src = src;
  skinImages.push(img);
});

// 音声読み込み
const sounds = {
  jump: new Audio('sounds/jump.wav'),
  bgm: new Audio('sounds/bgm.mp3'),
  gameover: new Audio('sounds/gameover.wav')
};
sounds.bgm.loop = true;

// UI更新
const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');

function startGame() {
  if (gameRunning) return;
  gameRunning = true;
  score = 0;
  obstacles = [];
  coins = [];
  player.y = height - PLAYER_HEIGHT;
  player.vy = 0;
  player.jumping = false;
  sounds.bgm.play();
  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  sounds.bgm.pause();
  sounds.gameover.play();
  if(score > highscore) {
    highscore = score;
    localStorage.setItem('highscore', highscore);
    highscoreEl.textContent = highscore;
  }
  alert('ゲームオーバー！スコア: ' + score);
}

// ジャンプ処理
function jump() {
  if (!player.jumping) {
    player.vy = -JUMP_POWER;
    player.jumping = true;
    sounds.jump.play();
  }
}

// 障害物生成
function spawnObstacle() {
  const obstacle = {
    x: width,
    y: height - OBSTACLE_HEIGHT,
    width: OBSTACLE_WIDTH,
    height: OBSTACLE_HEIGHT,
    speed: 6 + score * 0.05,
    rotation: 0,
    rotationSpeed: 0.05 + Math.random() * 0.1
  };
  obstacles.push(obstacle);
}

// コイン生成
function spawnCoin() {
  const coin = {
    x: width + Math.random() * 200,
    y: height - PLAYER_HEIGHT - 100 - Math.random() * 80,
    size: COIN_SIZE,
    speed: 6 + score * 0.05
  };
  coins.push(coin);
}

// 当たり判定
function collideRect(a, b) {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

function collideCircleRect(circle, rect) {
  // 円と矩形の当たり判定
  let distX = Math.abs(circle.x - rect.x - rect.width / 2);
  let distY = Math.abs(circle.y - rect.y - rect.height / 2);

  if (distX > (rect.width / 2 + circle.size / 2)) return false;
  if (distY > (rect.height / 2 + circle.size / 2)) return false;

  if (distX <= (rect.width / 2)) return true;
  if (distY <= (rect.height / 2)) return true;

  let dx = distX - rect.width / 2;
  let dy = distY - rect.height / 2;
  return (dx * dx + dy * dy <= (circle.size / 2) * (circle.size / 2));
}

// ゲームループ
let obstacleTimer = 0;
let coinTimer = 0;
const OBSTACLE_INTERVAL = 120; // フレーム数
const COIN_INTERVAL = 80;

function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, width, height);

  // プレイヤー物理
  player.vy += GRAVITY;
  player.y += player.vy;
  if (player.y > height - PLAYER_HEIGHT) {
    player.y = height - PLAYER_HEIGHT;
    player.vy = 0;
    player.jumping = false;
  }

  // 障害物処理
  obstacleTimer++;
  if (obstacleTimer > OBSTACLE_INTERVAL) {
    spawnObstacle();
    obstacleTimer = 0;
  }
  obstacles.forEach((obstacle, i) => {
    obstacle.x -= obstacle.speed;
    obstacle.rotation += obstacle.rotationSpeed;

    // 描画（回転付き）
    ctx.save();
    ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
    ctx.rotate(obstacle.rotation);
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
    ctx.restore();

    // 当たり判定
    if (collideRect(player, obstacle)) {
      endGame();
    }

    // 画面外は配列から除去
    if (obstacle.x + obstacle.width < 0) {
      obstacles.splice(i, 1);
      score++;
      scoreEl.textContent = score;
    }
  });

  // コイン処理
  coinTimer++;
  if (coinTimer > COIN_INTERVAL) {
    spawnCoin();
    coinTimer = 0;
  }
  coins.forEach((coin, i) => {
    coin.x -= coin.speed;

    // コイン描画
    ctx.beginPath();
    ctx.fillStyle = '#ffeb3b';
    ctx.arc(coin.x + coin.size / 2, coin.y + coin.size / 2, coin.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // 当たり判定（円矩形判定）
    if (collideCircleRect(player, coin)) {
      coins.splice(i, 1);
      score += 5;
      scoreEl.textContent = score;
    }

    // 画面外は除去
    if (coin.x + coin.size < 0) {
      coins.splice(i, 1);
    }
  });

  // プレイヤー描画（スキン）
  const skinImg = skinImages[player.skin];
  ctx.drawImage(skinImg, player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT);

  requestAnimationFrame(gameLoop);
}

// キーボードジャンプイベント
window.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    jump();
  }
});

// スキン選択処理
const skinElems = document.querySelectorAll('#skin-selector img');
skinElems.forEach(img => {
  img.addEventListener('click', () => {
    skinElems.forEach(i => i.classList.remove('selected'));
    img.classList.add('selected');
    player.skin = Number(img.dataset.skin);
  });
});

// スタートボタン
document.getElementById('start-btn').addEventListener('click', () => {
  startGame();
});
