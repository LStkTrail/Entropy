import { useState, useEffect, useRef, useCallback } from 'react';

// Constants
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_BOOST = 80;
const SPEED_SLOW = 250;

const POWER_UP_TYPES = {
  SPEED: 'speed',
  SHIELD: 'shield',
  SLOW: 'slow'
};

const POWER_UP_COLORS = {
  speed: '#ff003c',
  shield: '#00d4ff',
  slow: '#39ff14'
};

const POWER_UP_DURATION = 5000;

const useGameLogic = (canvasWidth, canvasHeight) => {
  // Game State
  const [gameState, setGameState] = useState('menu'); // menu, playing, paused, gameover
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      const saved = localStorage.getItem('snakeHighScore');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      console.warn('localStorage not available:', e);
      return 0;
    }
  });
  
  // State for rendering (updated from refs to trigger re-render)
  const [snakeState, setSnakeState] = useState([{ x: 10, y: 10 }]);
  const [foodState, setFoodState] = useState(null);
  const [powerUpState, setPowerUpState] = useState(null);
  const [particlesState, setParticlesState] = useState([]);
  const [activePowerUpsState, setActivePowerUpsState] = useState({});
  const [hasShieldState, setHasShieldState] = useState(false);

  // Refs for game state (avoid closure issues in game loop)
  const gameStateRef = useRef('menu');
  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const directionRef = useRef({ x: 1, y: 0 });
  const nextDirectionRef = useRef({ x: 1, y: 0 });
  const foodRef = useRef(null);
  const powerUpRef = useRef(null);
  const activePowerUpsRef = useRef({});
  const particlesRef = useRef([]);
  const lastUpdateRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const shieldRef = useRef(false);
  const scoreRef = useRef(0);

  const animationFrameRef = useRef(null);

  // Generate random position on grid (avoiding snake)
  function generateFood(snake = snakeRef.current) {
    const cols = Math.floor(canvasWidth / GRID_SIZE);
    const rows = Math.floor(canvasHeight / GRID_SIZE);
    
    // 边界检查
    if (cols <= 0 || rows <= 0) {
      return { x: 10, y: 10 }; // 默认位置
    }
    
    let food;
    let attempts = 0;
    const maxAttempts = Math.min(100, cols * rows);
    
    do {
      food = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows)
      };
      attempts++;
    } while (
      snake && snake.length > 0 && 
      snake.some(segment => segment.x === food.x && segment.y === food.y) &&
      attempts < maxAttempts
    );
    
    return food;
  }

  // Generate random power-up (avoiding snake and food)
  function generatePowerUp(snake = snakeRef.current, food = foodRef.current) {
    if (Math.random() > 0.3) return null; // 30% chance
    
    const types = Object.values(POWER_UP_TYPES);
    const cols = Math.floor(canvasWidth / GRID_SIZE);
    const rows = Math.floor(canvasHeight / GRID_SIZE);
    
    // 边界检查
    if (cols <= 0 || rows <= 0) {
      return null;
    }
    
    let powerUp;
    let attempts = 0;
    const maxAttempts = Math.min(100, cols * rows);
    
    do {
      powerUp = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
        type: types[Math.floor(Math.random() * types.length)]
      };
      attempts++;
    } while (
      ((snake && snake.length > 0 && snake.some(segment => segment.x === powerUp.x && segment.y === powerUp.y)) ||
       (food && food.x === powerUp.x && food.y === powerUp.y)) &&
      attempts < maxAttempts
    );
    
    return powerUp;
  }

  // Create particle explosion
  function createParticles(x, y, color) {
    const particles = [];
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: x * GRID_SIZE + GRID_SIZE / 2,
        y: y * GRID_SIZE + GRID_SIZE / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 6 + 2,
        color,
        life: 1
      });
    }
    return particles;
  }

  // Update particles
  function updateParticles() {
    particlesRef.current = particlesRef.current
      .map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        size: p.size * 0.95,
        life: p.life - 0.03
      }))
      .filter(p => p.life > 0);
  }

  // Check collision
  function checkCollision(head, snake) {
    const cols = Math.floor(canvasWidth / GRID_SIZE);
    const rows = Math.floor(canvasHeight / GRID_SIZE);
    
    // Wall collision
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
      return true;
    }
    
    // Self collision (skip head)
    for (let i = 1; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        return true;
      }
    }
    
    return false;
  }

  // Apply power-up effect
  function applyPowerUp(type) {
    const now = Date.now();
    const expiry = now + POWER_UP_DURATION;
    
    switch (type) {
      case POWER_UP_TYPES.SPEED:
        speedRef.current = SPEED_BOOST;
        activePowerUpsRef.current.speed = expiry;
        break;
      case POWER_UP_TYPES.SHIELD:
        shieldRef.current = true;
        activePowerUpsRef.current.shield = expiry;
        break;
      case POWER_UP_TYPES.SLOW:
        speedRef.current = SPEED_SLOW;
        activePowerUpsRef.current.slow = expiry;
        break;
    }
  }

  // Check and update power-up expiry
  function updatePowerUps() {
    const now = Date.now();
    
    if (activePowerUpsRef.current.speed && now > activePowerUpsRef.current.speed) {
      delete activePowerUpsRef.current.speed;
      speedRef.current = INITIAL_SPEED;
    }
    
    if (activePowerUpsRef.current.shield && now > activePowerUpsRef.current.shield) {
      delete activePowerUpsRef.current.shield;
      shieldRef.current = false;
    }
    
    if (activePowerUpsRef.current.slow && now > activePowerUpsRef.current.slow) {
      delete activePowerUpsRef.current.slow;
      speedRef.current = INITIAL_SPEED;
    }
  }

  // Core game logic update
  const updateGame = useCallback((timestamp) => {
    if (gameStateRef.current !== 'playing') return;
    
    // Check if enough time has passed based on current speed
    if (timestamp - lastUpdateRef.current < speedRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateGame);
      return;
    }
    
    lastUpdateRef.current = timestamp;
    
    // Update direction
    directionRef.current = nextDirectionRef.current;
    
    // Calculate new head position
    const snake = snakeRef.current;
    const direction = directionRef.current;
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;
    
    // Check collision
    if (checkCollision(head, snake)) {
      if (shieldRef.current) {
        shieldRef.current = false;
        delete activePowerUpsRef.current.shield;
        // Move head to opposite side
        const cols = Math.floor(canvasWidth / GRID_SIZE);
        const rows = Math.floor(canvasHeight / GRID_SIZE);
        if (head.x < 0) head.x = cols - 1;
        if (head.x >= cols) head.x = 0;
        if (head.y < 0) head.y = rows - 1;
        if (head.y >= rows) head.y = 0;
      } else {
        // Game over
        gameStateRef.current = 'gameover';
        setGameState('gameover');
        
        // Update high score
        const finalScore = scoreRef.current;
        try {
          const currentHighScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
          if (finalScore > currentHighScore) {
            setHighScore(finalScore);
            localStorage.setItem('snakeHighScore', finalScore.toString());
          }
        } catch (e) {
          console.warn('Failed to save high score:', e);
        }
        return;
      }
    }
    
    // Add new head
    const newSnake = [head, ...snake];
    
    // Check food collision
    const food = foodRef.current;
    if (head.x === food.x && head.y === food.y) {
      // Increase score
      scoreRef.current += 10;
      setScore(scoreRef.current);
      
      // Create particles
      particlesRef.current = [
        ...particlesRef.current,
        ...createParticles(food.x, food.y, '#00ff9d')
      ];
      
      // Generate new food (avoiding snake)
      foodRef.current = generateFood(newSnake);
      
      // Maybe spawn power-up (avoiding snake and food)
      powerUpRef.current = generatePowerUp(newSnake, foodRef.current);
    } else {
      // Remove tail
      newSnake.pop();
    }
    
    // Check power-up collision
    const powerUp = powerUpRef.current;
    if (powerUp && head.x === powerUp.x && head.y === powerUp.y) {
      applyPowerUp(powerUp.type);
      
      // Create particles with power-up color
      particlesRef.current = [
        ...particlesRef.current,
        ...createParticles(powerUp.x, powerUp.y, POWER_UP_COLORS[powerUp.type])
      ];
      
      // Bonus score
      const bonus = powerUp.type === POWER_UP_TYPES.SPEED ? 20 : 10;
      scoreRef.current += bonus;
      setScore(scoreRef.current);
      
      powerUpRef.current = null;
    }
    
    snakeRef.current = newSnake;
    
    // Update particles and power-ups
    updateParticles();
    updatePowerUps();
    
    // Update state to trigger re-render
    setSnakeState([...newSnake]);
    setFoodState(foodRef.current);
    setPowerUpState(powerUpRef.current);
    setParticlesState([...particlesRef.current]);
    setActivePowerUpsState({ ...activePowerUpsRef.current });
    setHasShieldState(shieldRef.current);
    
    // Continue game loop
    animationFrameRef.current = requestAnimationFrame(updateGame);
  }, [canvasWidth, canvasHeight]);

  // Start game
  const startGame = useCallback(() => {
    snakeRef.current = [{ x: 10, y: 10 }];
    directionRef.current = { x: 1, y: 0 };
    nextDirectionRef.current = { x: 1, y: 0 };
    foodRef.current = generateFood(snakeRef.current);
    powerUpRef.current = null;
    activePowerUpsRef.current = {};
    particlesRef.current = [];
    speedRef.current = INITIAL_SPEED;
    shieldRef.current = false;
    scoreRef.current = 0;
    setScore(0);
    lastUpdateRef.current = 0;
    gameStateRef.current = 'playing';
    
    // Update state
    setSnakeState([{ x: 10, y: 10 }]);
    setFoodState(foodRef.current);
    setPowerUpState(null);
    setParticlesState([]);
    setActivePowerUpsState({});
    setHasShieldState(false);
    
    setGameState('playing');
  }, []);

  // Handle keyboard input
  const handleKeyDown = useCallback((e) => {
    if (gameStateRef.current !== 'playing') return;
    
    const key = e.key.toLowerCase();
    const currentDir = directionRef.current;
    
    // Prevent reverse movement
    if ((key === 'arrowup' || key === 'w') && currentDir.y !== 1) {
      nextDirectionRef.current = { x: 0, y: -1 };
      e.preventDefault();
    } else if ((key === 'arrowdown' || key === 's') && currentDir.y !== -1) {
      nextDirectionRef.current = { x: 0, y: 1 };
      e.preventDefault();
    } else if ((key === 'arrowleft' || key === 'a') && currentDir.x !== 1) {
      nextDirectionRef.current = { x: -1, y: 0 };
      e.preventDefault();
    } else if ((key === 'arrowright' || key === 'd') && currentDir.x !== -1) {
      nextDirectionRef.current = { x: 1, y: 0 };
      e.preventDefault();
    }
  }, []);

  // Effect for game loop
  useEffect(() => {
    gameStateRef.current = gameState;
    
    if (gameState === 'playing') {
      lastUpdateRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(updateGame);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [gameState, updateGame]);

  // Effect for keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // Update gameStateRef when gameState changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Update particles in menu/gameover states too for visual effect
  useEffect(() => {
    if (gameState === 'menu' || gameState === 'gameover') {
      const interval = setInterval(() => {
        updateParticles();
      }, 16);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  return {
    gameState,
    score,
    highScore,
    snake: snakeState,
    food: foodState,
    powerUp: powerUpState,
    particles: particlesState,
    activePowerUps: activePowerUpsState,
    hasShield: hasShieldState,
    startGame,
    setGameState,
    updateParticles
  };
};

export default useGameLogic;
