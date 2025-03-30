
import React from 'react';
import { GameState } from '@/types/game';

interface GameHUDProps {
  gameState: GameState;
}

const GameHUD: React.FC<GameHUDProps> = ({ gameState }) => {
  const { health, ammo, maxAmmo, score, wave } = gameState;
  
  return (
    <div className="fixed inset-0 pointer-events-none p-4">
      {/* Health Bar */}
      <div className="absolute top-4 left-4 w-48">
        <div className="health-bar">
          <div 
            className="health-fill" 
            style={{ width: `${(health / 100) * 100}%` }}
          />
        </div>
        <div className="text-white text-sm mt-1">Health: {health}</div>
      </div>
      
      {/* Ammo Counter */}
      <div className="absolute bottom-4 right-4">
        <div className="ammo-counter">
          {ammo} / {maxAmmo}
        </div>
        <div className="text-white text-sm text-right">Ammo</div>
      </div>
      
      {/* Wave Indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <div className="wave-indicator">Wave {wave}</div>
      </div>
      
      {/* Score Counter */}
      <div className="absolute top-4 right-4">
        <div className="score-counter">{score}</div>
        <div className="text-white text-sm text-right">Score</div>
        <div className="text-white text-sm text-right mt-1">Kills: {gameState.kills}</div>
      </div>
      
      {/* Crosshair */}
      <div className="crosshair">
        <div className="crosshair-inner"></div>
        <div className="crosshair-center"></div>
      </div>
    </div>
  );
};

export default GameHUD;
