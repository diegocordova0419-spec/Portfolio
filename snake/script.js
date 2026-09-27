const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const overlay = document.getElementById('gameOverlay');
const finalScoreElement = document.getElementById('finalScore');
const cellSize = 20;
const columns = canvas.width / cellSize;
const rows = canvas.height / cellSize;
const initialInterval = 145;
const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};
let snake;
let direction;
let queuedDirection;
let food;
let score;
let highScore = Number(localStorage.getItem('snakeHighScore')) || 0;
let lastStep = 0;
let elapsed = 0;
let gameOver = false;
highScoreElement.textContent = highScore;

function placeFood() {
  do {
    food = { x: Math.floor(Math.random() * columns), y: Math.floor(Math.random() * rows) };
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

function startGame() {
  snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
  direction = directions.right;
  queuedDirection = direction;
  score = 0;
  scoreElement.textContent = score;
  gameOver = false;
  elapsed = 0;
  lastStep = 0;
  overlay.hidden = true;
  placeFood();
  draw();
}

function changeDirection(next) {
  if (next.x !== -direction.x || next.y !== -direction.y) queuedDirection = next;
}

function finishGame() {
  gameOver = true;
  finalScoreElement.textContent = score;
  overlay.hidden = false;
}

function step() {
  direction = queuedDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const eating = head.x === food.x && head.y === food.y;
  const bodyToCheck = eating ? snake : snake.slice(0, -1);
  if (head.x < 0 || head.x >= columns || head.y < 0 || head.y >= rows ||
      bodyToCheck.some(segment => segment.x === head.x && segment.y === head.y)) {
    finishGame();
    return;
  }
  snake.unshift(head);
  if (eating) {
    score += 1;
    scoreElement.textContent = score;
    if (score > highScore) {
      highScore = score;
      highScoreElement.textContent = highScore;
      localStorage.setItem('snakeHighScore', String(highScore));
    }
    placeFood();
  } else {
    snake.pop();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f1f5f2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(26, 26, 26, 0.035)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += cellSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += cellSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2, cellSize * .34, 0, Math.PI * 2);
  ctx.fill();
  snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? '#2563eb' : '#4b86ed';
    ctx.beginPath();
    ctx.roundRect(segment.x * cellSize + 2, segment.y * cellSize + 2, cellSize - 4, cellSize - 4, 5);
    ctx.fill();
  });
}

function gameLoop(timestamp) {
  if (!lastStep) lastStep = timestamp;
  elapsed += timestamp - lastStep;
  lastStep = timestamp;
  const interval = Math.max(65, initialInterval - Math.floor(score / 5) * 12);
  while (elapsed >= interval && !gameOver) {
    step();
    elapsed -= interval;
  }
  if (!gameOver) draw();
  requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (event) => {
  const keyDirections = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right'
  };
  if (keyDirections[event.key]) {
    event.preventDefault();
    changeDirection(directions[keyDirections[event.key]]);
  }
});
document.querySelectorAll('[data-direction]').forEach(button => {
  button.addEventListener('click', () => changeDirection(directions[button.dataset.direction]));
});
document.getElementById('restartButton').addEventListener('click', startGame);
document.getElementById('playAgainButton').addEventListener('click', startGame);
let touchStart = null;
canvas.addEventListener('pointerdown', event => {
  touchStart = { x: event.clientX, y: event.clientY };
});
canvas.addEventListener('pointerup', event => {
  if (!touchStart) return;
  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
  changeDirection(Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? directions.right : directions.left)
    : (dy > 0 ? directions.down : directions.up));
});

startGame();
requestAnimationFrame(gameLoop);
