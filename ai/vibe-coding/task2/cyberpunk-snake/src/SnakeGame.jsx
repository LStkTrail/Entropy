import React from 'react';
import useGameLogic from './useGameLogic';
import CanvasBoard from './CanvasBoard';
import GameUI from './GameUI';
import './SnakeGame.css';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

/**
 * SnakeGame - Main container component for Cyberpunk Snake Game
 * 
 * Architecture:
 * - useGameLogic: Custom hook managing all game state, logic, and game loop
 * - CanvasBoard: Pure canvas rendering component with visual effects
 * - GameUI: React overlay component for menus and HUD
 * 
 * Key Design Decisions:
 * 1. useRef for canvas context interaction: The useGameLogic hook uses
 *    refs instead of state for game data (snake, direction, etc.) to avoid
 *    closure staleness in the requestAnimationFrame game loop. If we used
 *    useState, the game loop would always see stale values because the
 *    callback is only created once.
 * 
 * 2. Separation of concerns: Logic (hook), rendering (canvas), UI (React)
 *    This allows the canvas to render at 60fps independently of React's
 *    render cycle, while React handles UI state changes efficiently.
 */
const SnakeGame = () => {
  try {
    const {
      gameState,
      score,
      highScore,
      snake,
      food,
      powerUp,
      particles,
      activePowerUps,
      hasShield,
      startGame,
      setGameState
    } = useGameLogic(CANVAS_WIDTH, CANVAS_HEIGHT);

    const handleReturnToMenu = () => {
      setGameState('menu');
    };

    return (
      <div className="snake-game-container">
      <CanvasBoard
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        snake={snake}
        food={food}
        powerUp={powerUp}
        particles={particles}
        activePowerUps={activePowerUps}
        hasShield={hasShield}
        gameState={gameState}
      />
      
      <GameUI
        gameState={gameState}
        score={score}
        highScore={highScore}
        activePowerUps={activePowerUps}
        onStartGame={startGame}
        onResumeGame={() => setGameState('playing')}
        onReturnToMenu={handleReturnToMenu}
      />
    </div>
    );
  } catch (error) {
    console.error('Error in SnakeGame component:', error);
    return (
      <div style={{
        padding: '20px',
        color: '#ff003c',
        fontFamily: 'monospace',
        background: '#09090b',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1>组件错误</h1>
        <pre style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
          {error.toString()}
          {'\n\n'}
          {error.stack}
        </pre>
      </div>
    );
  }
};

export default SnakeGame;
