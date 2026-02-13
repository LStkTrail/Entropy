import React from 'react';
import './SnakeGame.css';

const GameUI = ({
  gameState,
  score,
  highScore,
  activePowerUps,
  onStartGame,
  onResumeGame,
  onReturnToMenu
}) => {
  const now = Date.now();
  
  // Calculate remaining time for power-ups
  const getPowerUpTimeLeft = (expiry) => {
    const remaining = Math.max(0, expiry - now);
    return Math.ceil(remaining / 1000);
  };

  // Start Screen
  if (gameState === 'menu') {
    return (
      <div className="glass-overlay">
        <div className="glass-panel">
          <h1 className="game-title">NEON SNAKE</h1>
          <p className="game-subtitle">CYBERPUNK EDITION</p>
          
          <button className="cyber-button" onClick={onStartGame}>
            START GAME
          </button>
          
          <div className="power-up-legend">
            <p className="power-up-legend-title">POWER-UPS</p>
            <div className="power-up-item">
              <div className="power-up-icon speed"></div>
              <span>SPEED - Double points, faster pace</span>
            </div>
            <div className="power-up-item">
              <div className="power-up-icon shield"></div>
              <span>SHIELD - Survive one collision</span>
            </div>
            <div className="power-up-item">
              <div className="power-up-icon slow"></div>
              <span>SLOW - Bullet time effect</span>
            </div>
          </div>
          
          <div className="instructions">
            <p>Use <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> or <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> to move</p>
          </div>
        </div>
      </div>
    );
  }

  // Game Over Screen
  if (gameState === 'gameover') {
    const isNewHighScore = score >= highScore;
    
    return (
      <div className="glass-overlay">
        <div className="glass-panel">
          <h1 className="game-over-title">GAME OVER</h1>
          
          <p className="score-label">FINAL SCORE</p>
          <div className="score-display">{score}</div>
          
          {isNewHighScore && (
            <p style={{ color: '#00ff9d', marginBottom: '20px', fontSize: '14px' }}>
              NEW HIGH SCORE!
            </p>
          )}
          
          <div>
            <button className="cyber-button" onClick={onStartGame}>
              PLAY AGAIN
            </button>
            <button 
              className="cyber-button secondary" 
              onClick={onReturnToMenu}
            >
              MENU
            </button>
          </div>
        </div>
      </div>
    );
  }

  // HUD for playing state
  return (
    <>
      <div className="game-hud">
        <div className="hud-item">
          <span className="hud-label">Score</span>
          <span className="hud-value score">{score}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">High Score</span>
          <span className="hud-value high-score">{highScore}</span>
        </div>
      </div>
      
      {Object.keys(activePowerUps).length > 0 && (
        <div className="active-power-ups">
          {activePowerUps.speed && (
            <div className="power-up-indicator power-up-speed">
              SPEED: {getPowerUpTimeLeft(activePowerUps.speed)}s
            </div>
          )}
          {activePowerUps.shield && (
            <div className="power-up-indicator power-up-shield">
              SHIELD: {getPowerUpTimeLeft(activePowerUps.shield)}s
            </div>
          )}
          {activePowerUps.slow && (
            <div className="power-up-indicator power-up-slow">
              SLOW: {getPowerUpTimeLeft(activePowerUps.slow)}s
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default GameUI;
