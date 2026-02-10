// 游戏配置
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20; // 每个格子的大小
const canvasSize = 400; // 画布大小
const tileCount = canvasSize / gridSize; // 格子数量

// 难度设置
const difficultySettings = {
    veryEasy: { speed: 200, name: '简单' },
    easy: { speed: 150, name: '较易' },
    normal: { speed: 100, name: '普通' },
    hard: { speed: 70, name: '困难' },
    hell: { speed: 50, name: '地狱' }
};

// 主题配色方案
const themeColors = {
    snake: { head: '#764ba2', body: '#667eea', food: '#ff6b6b' },
    caterpillar: { head: '#2ecc71', body: '#27ae60', food: '#e74c3c' },
    train: { head: '#34495e', body: '#7f8c8d', food: '#f39c12' },
    basketball: { head: '#e67e22', body: '#d35400', food: '#9b59b6' }
};

// 游戏状态
let snake = [];
let food = {};
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop = null;
let gameRunning = false;
let isPaused = false;
let isWaitingToStart = true; // 等待开始状态
let currentDifficulty = 'normal';
let currentTheme = 'snake';
let animationFrame = 0;

// DOM元素
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('finalScore');
const gameOverModal = document.getElementById('gameOverModal');
const countdownModal = document.getElementById('countdownModal');
const countdownText = document.getElementById('countdownText');
const playAgainBtn = document.getElementById('playAgainBtn');
const pauseBtn = document.getElementById('pauseBtn');
const startBtn = document.getElementById('startBtn');
const difficultySelect = document.getElementById('difficulty');
const themeSelect = document.getElementById('theme');

// 初始化最高分显示
highScoreElement.textContent = highScore;

// 初始化游戏
function initGame() {
    // 初始化蛇的位置（从中间开始）
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
 { x: 8, y: 10 }
    ];
    
    // 初始化方向（向右移动）
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    
    // 初始化分数
    score = 0;
    updateScore();
    
    // 重置暂停状态
    isPaused = false;
    pauseBtn.textContent = '暂停';
    pauseBtn.classList.remove('paused');
    
    // 生成第一个食物
    generateFood();
    
    // 绘制初始画面
    draw();
}

// 开始游戏（321倒计时后）
function startGameWithCountdown() {
    countdownModal.classList.remove('hidden');
    disableControls(true);
    
    let count = 3;
    countdownText.textContent = count;
    
    const countdownInterval = setInterval(() => {
        count--;
        
        if (count > 0) {
            countdownText.textContent = count;
        } else if (count === 0) {
            countdownText.textContent = 'GO!';
        } else {
            clearInterval(countdownInterval);
            countdownModal.classList.add('hidden');
            actuallyStartGame();
        }
    }, 1000);
}

// 实际开始游戏
function actuallyStartGame() {
    isWaitingToStart = false;
    gameRunning = true;
    pauseBtn.disabled = false;
    startBtn.classList.remove('primary');
    
    const speed = difficultySettings[currentDifficulty].speed;
    gameLoop = setInterval(gameUpdate, speed);
    
    // 开始动画帧
    animate();
}

// 生成食物
function generateFood() {
    let newFood;
    let foodOnSnake;
    
    do {
        foodOnSnake = false;
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        
        // 确保食物不会生成在蛇身上
        for (let segment of snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                foodOnSnake = true;
                break;
            }
        }
    } while (foodOnSnake);
    
    food = newFood;
}

// 游戏主循环
function gameUpdate() {
    if (!gameRunning || isPaused) return;
    
    // 更新方向
    direction = { ...nextDirection };
    
    // 计算蛇头新位置
    const head = { 
        x: snake[0].x + direction.x, 
        y: snake[0].y + direction.y 
    };
    
    // 检查碰撞
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    // 将新蛇头加入蛇身
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateScore();
        generateFood();
    } else {
        // 如果没有吃到食物，移除蛇尾
        snake.pop();
    }
}

// 动画循环
function animate() {
    if (!gameRunning && !isWaitingToStart) return;
    
    draw();
    animationFrame++;
    requestAnimationFrame(animate);
}

// 碰撞检测
function checkCollision(head) {
    // 检查是否撞墙
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return true;
    }
    
    // 检查是否撞到自己
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            return true;
        }
    }
    
    return false;
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    const colors = themeColors[currentTheme];
    
    // 绘制蛇
    snake.forEach((segment, index) => {
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        const padding = 1;
        
        if (currentTheme === 'caterpillar') {
            drawCaterpillar(x, y, index === 0);
        } else if (currentTheme === 'train') {
            drawTrain(x, y, index === 0, index);
        } else if (currentTheme === 'basketball') {
            drawBasketball(x, y, index === 0);
        } else {
            // 普通蛇
            ctx.fillStyle = index === 0 ? colors.head : colors.body;
            ctx.fillRect(
                x + padding, 
                y + padding, 
                gridSize - 2 * padding, 
                gridSize - 2 * padding
            );
        }
    });
    
    // 绘制食物
    if (currentTheme === 'basketball') {
        drawKun();
    } else {
        drawFood(colors.food);
    }
    
    // 如果暂停，绘制暂停覆盖层
    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('暂停', canvasSize / 2, canvasSize / 2);
    }
}

// 绘制普通食物
function drawFood(color) {
    ctx.fillStyle = color;
    const foodX = food.x * gridSize;
    const foodY = food.y * gridSize;
    const padding = 2;
    
    ctx.fillRect(
        foodX + padding, 
        foodY + padding, 
        gridSize - 2 * padding, 
        gridSize - 2 * padding
    );
}

// 绘制毛毛虫
function drawCaterpillar(x, y, isHead) {
    const radius = gridSize / 2 - 1;
    const centerX = x + gridSize / 2;
    const centerY = y + gridSize / 2;
    
    ctx.fillStyle = isHead ? '#2ecc71' : '#27ae60';
    
    // 绘制圆形身体
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 如果是头部，画眼睛
    if (isHead) {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX - 3, centerY - 2, 3, 0, Math.PI * 2);
        ctx.arc(centerX + 3, centerY - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(centerX - 3, centerY - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(centerX + 3, centerY - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 绘制火车
function drawTrain(x, y, isHead, index) {
    const padding = 1;
    
    if (isHead) {
        // 机车头
        ctx.fillStyle = '#34495e';
        ctx.fillRect(x + padding, y + padding, gridSize - 2 * padding, gridSize - 2 * padding);
        
        // 窗户
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(x + 4, y + 4, 6, 6);
        
        // 烟囱
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(x + 8, y - 4, 4, 5);
    } else {
        // 车厢
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(x + padding, y + padding, gridSize - 2 * padding, gridSize - 2 * padding);
        
        // 窗户
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(x + 5, y + 5, 10, 10);
    }
    
    // 轮子
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(x + 5, y + gridSize - 3, 2, 0, Math.PI * 2);
    ctx.arc(x + gridSize - 5, y + gridSize - 3, 2, 0, Math.PI * 2);
    ctx.fill();
}

// 绘制篮球
function drawBasketball(x, y, isHead) {
    const centerX = x + gridSize / 2;
    const centerY = y + gridSize / 2;
    const radius = gridSize / 2 - 1;
    
    // 篮球主体
    ctx.fillStyle = isHead ? '#e67e22' : '#d35400';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 篮球纹路
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, centerY);
    ctx.lineTo(x + gridSize, centerY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, y);
    ctx.lineTo(centerX, y + gridSize);
    ctx.stroke();
}

// 绘制蔡徐坤（简化版动画）
function drawKun() {
    const foodX = food.x * gridSize;
    const foodY = food.y * gridSize;
    const centerX = foodX + gridSize / 2;
    const centerY = foodY + gridSize / 2;
    
    // 简单的跳跳动画
    const bounce = Math.sin(animationFrame * 0.1) * 2;
    
    // 头
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.arc(centerX, centerY - 3 + bounce, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // 身体
    ctx.fillStyle = '#9b59b6';
    ctx.fillRect(centerX - 4, centerY + 2 + bounce, 8, 8);
    
    // 腿
    ctx.fillStyle = '#2c3e50';
    const legOffset = Math.sin(animationFrame * 0.15) * 2;
    ctx.fillRect(centerX - 4 + legOffset, centerY + 10 + bounce, 3, 5);
    ctx.fillRect(centerX + 1 - legOffset, centerY + 10 + bounce, 3, 5);
    
    // 篮球
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.arc(centerX, centerY + 15 + bounce, 4, 0, Math.PI * 2);
    ctx.fill();
}

// 更新分数
function updateScore() {
    scoreElement.textContent = score;
    
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
    }
}

// 暂停/继续游戏
function togglePause() {
    if (!gameRunning || isWaitingToStart) return;
    
    isPaused = !isPaused;
    if (isPaused) {
        pauseBtn.textContent = '继续';
        pauseBtn.classList.add('paused');
    } else {
        pauseBtn.textContent = '暂停';
        pauseBtn.classList.remove('paused');
    }
}

// 游戏结束
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    
    finalScoreElement.textContent = score;
    gameOverModal.classList.remove('hidden');
}

// 准备重新开始
function prepareToRestart() {
    gameOverModal.classList.add('hidden');
    
    // 重置所有状态
    gameRunning = false;
    isPaused = false;
    isWaitingToStart = true;
    
    // 重置按钮状态
    pauseBtn.disabled = true;
    pauseBtn.textContent = '暂停';
    pauseBtn.classList.remove('paused');
    startBtn.textContent = '开始游戏';
    startBtn.classList.add('primary');
    
    // 重新初始化游戏状态
    initGame();
}

// 禁用/启用控制
function disableControls(disabled) {
    startBtn.disabled = disabled;
    difficultySelect.disabled = disabled;
    themeSelect.disabled = disabled;
}

// 改变难度
function changeDifficulty(newDifficulty) {
    currentDifficulty = newDifficulty;
    if (gameRunning && !isPaused && !isWaitingToStart) {
        clearInterval(gameLoop);
        const speed = difficultySettings[currentDifficulty].speed;
        gameLoop = setInterval(gameUpdate, speed);
    }
}

// 改变主题
function changeTheme(newTheme) {
    currentTheme = newTheme;
    draw();
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    // Enter键开始游戏
    if (key === 'enter') {
        if (isWaitingToStart) {
            e.preventDefault();
            startGameWithCountdown();
        }
        return;
    }
    
    if (!gameRunning || isWaitingToStart) return;
    
    // 暂停/继续
    if (key === ' ' || key === 'escape') {
        togglePause();
        e.preventDefault();
        return;
    }
    
    if (isPaused) return;
    
    // 防止反向移动
    switch(key) {
        case 'arrowup':
        case 'w':
            if (direction.y !== 1) {
                nextDirection = { x: 0, y: -1 };
            }
            e.preventDefault();
            break;
        case 'arrowdown':
        case 's':
            if (direction.y !== -1) {
                nextDirection = { x: 0, y: 1 };
            }
            e.preventDefault();
            break;
        case 'arrowleft':
        case 'a':
            if (direction.x !== 1) {
                nextDirection = { x: -1, y: 0 };
            }
            e.preventDefault();
            break;
        case 'arrowright':
        case 'd':
            if (direction.x !== -1) {
                nextDirection = { x: 1, y: 0 };
            }
            e.preventDefault();
            break;
    }
});

// 按钮事件
playAgainBtn.addEventListener('click', prepareToRestart);
pauseBtn.addEventListener('click', togglePause);
startBtn.addEventListener('click', () => {
    if (isWaitingToStart) {
        startGameWithCountdown();
    }
});

// 下拉菜单事件
difficultySelect.addEventListener('change', (e) => {
    changeDifficulty(e.target.value);
});

themeSelect.addEventListener('change', (e) => {
    changeTheme(e.target.value);
});

// 初始化游戏
initGame();
