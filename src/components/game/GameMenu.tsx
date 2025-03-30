
import React from 'react';

interface GameMenuProps {
  status: 'menu' | 'paused' | 'gameover';
  onStart: () => void;
  onResume: () => void;
  onRestart: () => void;
  score?: number;
  wave?: number;
}

const GameMenu: React.FC<GameMenuProps> = ({ 
  status, 
  onStart, 
  onResume, 
  onRestart, 
  score = 0, 
  wave = 0 
}) => {
  return (
    <div className="menu-container">
      {status === 'menu' && (
        <>
          <h1 className="menu-title">ZOMBIE SHOOTERS UNLEASHED</h1>
          <div className="text-white mb-8 max-w-md text-center">
            <p className="mb-4">Survive waves of zombies in this first-person shooter.</p>
            <p className="text-sm mb-6">
              <strong>Controls:</strong> WASD to move, Mouse to aim and shoot, R to reload, 
              Space to jump, Shift to sprint, ESC to pause
            </p>
          </div>
          <button className="menu-button" onClick={onStart}>START GAME</button>
        </>
      )}
      
      {status === 'paused' && (
        <>
          <h1 className="menu-title">GAME PAUSED</h1>
          <div className="flex flex-col space-y-4">
            <button className="menu-button" onClick={onResume}>RESUME</button>
            <button className="menu-button" onClick={onRestart}>RESTART</button>
          </div>
        </>
      )}
      
      {status === 'gameover' && (
        <>
          <h1 className="menu-title">GAME OVER</h1>
          <div className="text-white mb-8 text-center">
            <p className="text-2xl mb-2">Final Score: {score}</p>
            <p className="text-xl mb-6">You reached Wave {wave}</p>
          </div>
          <button className="menu-button" onClick={onRestart}>PLAY AGAIN</button>
        </>
      )}
    </div>
  );
};

export default GameMenu;
