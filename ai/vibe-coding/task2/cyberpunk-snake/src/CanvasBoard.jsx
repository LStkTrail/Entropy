import React, { useRef, useEffect, useCallback } from 'react';
import './SnakeGame.css';

const GRID_SIZE = 20;

const CanvasBoard = ({
  width,
  height,
  snake,
  food,
  powerUp,
  particles,
  activePowerUps,
  hasShield,
  gameState
}) => {
  const canvasRef = useRef(null);

  // Draw grid background with perspective effect
  const drawGrid = useCallback((ctx, width, height, time) => {
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.05)';
    ctx.lineWidth = 1;
    
    // Vertical lines with slight offset animation
    const offset = Math.sin(time / 1000) * 2;
    
    for (let x = 0; x <= width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x + offset, 0);
      ctx.lineTo(x - offset, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, []);

  // Draw snake with glow effect
  const drawSnake = useCallback((ctx, snake, hasShield) => {
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      const alpha = 1 - (index / snake.length) * 0.5;
      
      ctx.fillStyle = isHead 
        ? `rgba(0, 255, 157, ${alpha})` 
        : `rgba(188, 19, 254, ${alpha})`;
      
      // Glow effect
      ctx.shadowBlur = isHead ? 20 : 10;
      ctx.shadowColor = isHead ? '#00ff9d' : '#bc13fe';
      
      ctx.fillRect(
        segment.x * GRID_SIZE + 1,
        segment.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2
      );
      
      // Reset shadow for performance
      ctx.shadowBlur = 0;
      
      // Draw shield indicator on head
      if (isHead && hasShield) {
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00d4ff';
        ctx.strokeRect(
          segment.x * GRID_SIZE - 2,
          segment.y * GRID_SIZE - 2,
          GRID_SIZE + 4,
          GRID_SIZE + 4
        );
        ctx.shadowBlur = 0;
      }
    });
  }, []);

  // Draw food with pulsing glow
  const drawFood = useCallback((ctx, food, time) => {
    if (!food) return;
    
    const pulse = Math.sin(time / 200) * 5 + 15;
    
    ctx.fillStyle = '#00ff9d';
    ctx.shadowBlur = pulse;
    ctx.shadowColor = '#00ff9d';
    
    // Draw as a diamond
    const cx = food.x * GRID_SIZE + GRID_SIZE / 2;
    const cy = food.y * GRID_SIZE + GRID_SIZE / 2;
    const size = GRID_SIZE / 2 - 2;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size, cy);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
  }, []);

  // Draw power-up
  const drawPowerUp = useCallback((ctx, powerUp, time) => {
    if (!powerUp) return;
    
    const colors = {
      speed: '#ff003c',
      shield: '#00d4ff',
      slow: '#39ff14'
    };
    
    const color = colors[powerUp.type];
    const pulse = Math.sin(time / 150) * 8 + 12;
    
    ctx.fillStyle = color;
    ctx.shadowBlur = pulse;
    ctx.shadowColor = color;
    
    const x = powerUp.x * GRID_SIZE + 1;
    const y = powerUp.y * GRID_SIZE + 1;
    
    ctx.fillRect(x, y, GRID_SIZE - 2, GRID_SIZE - 2);
    
    // Inner highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 0;
    ctx.fillRect(
      x + 4,
      y + 4,
      GRID_SIZE - 10,
      GRID_SIZE - 10
    );
  }, []);

  // Draw particles
  const drawParticles = useCallback((ctx, particles) => {
    particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life;
      ctx.shadowBlur = 10;
      ctx.shadowColor = particle.color;
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });
  }, []);

  // Main render function
  const render = useCallback((time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);
    
    // Draw background grid
    drawGrid(ctx, width, height, time);
    
    // Draw game elements
    drawFood(ctx, food, time);
    drawPowerUp(ctx, powerUp, time);
    drawSnake(ctx, snake, hasShield);
    drawParticles(ctx, particles);
  }, [width, height, food, powerUp, snake, particles, hasShield, drawGrid, drawFood, drawPowerUp, drawSnake, drawParticles]);

  // Animation loop for rendering
  useEffect(() => {
    let animationFrame;
    
    const animate = (time) => {
      render(time);
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className="canvas-board"
      width={width}
      height={height}
    />
  );
};

export default CanvasBoard;
