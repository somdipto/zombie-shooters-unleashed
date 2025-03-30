
import React from 'react';
import { GameState } from '@/types/game';

interface GameHUDProps {
  gameState: GameState;
}

const GameHUD: React.FC<GameHUDProps> = ({ gameState }) => {
  const { health, ammo, maxAmmo, score, wave, kills } = gameState;
  
  // Get health bar color based on health
  const getHealthColor = () => {
    if (health > 60) return 'bg-red-600';
    if (health > 30) return 'bg-red-500';
    return 'bg-red-400 animate-pulse';
  };
  
  // Get ammo display style based on ammo count
  const getAmmoStyle = () => {
    if (ammo === 0) return 'text-red-500 animate-pulse';
    if (ammo < maxAmmo * 0.25) return 'text-red-400';
    if (ammo < maxAmmo * 0.5) return 'text-yellow-400';
    return 'text-white';
  };
  
  return (
    <div className="fixed inset-0 pointer-events-none p-4">
      {/* Health Bar */}
      <div className="absolute top-4 left-4 w-48">
        <div className="flex items-center mb-1">
          <svg className="w-5 h-5 mr-1 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
          </svg>
          <div className="text-white text-sm font-bold">Health</div>
        </div>
        <div className="health-bar bg-gray-900 border border-gray-700">
          <div 
            className={`health-fill ${getHealthColor()}`}
            style={{ 
              width: `${(health / 100) * 100}%`,
              boxShadow: health < 30 ? '0 0 8px #ff0000' : 'none'
            }}
          />
        </div>
        <div className="text-white text-sm mt-1">{health}/100</div>
      </div>
      
      {/* Ammo Counter */}
      <div className="absolute bottom-4 right-4">
        <div className="flex flex-col items-end">
          <div className={`ammo-counter font-mono ${getAmmoStyle()} text-xl font-bold`}>
            {ammo} <span className="text-gray-400">/ {maxAmmo}</span>
          </div>
          <div className="text-white text-xs uppercase tracking-wider mt-1">Ammunition</div>
        </div>
      </div>
      
      {/* Wave Indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center">
        <div className="bg-black bg-opacity-50 px-4 py-2 rounded">
          <div className="text-red-500 text-sm font-semibold uppercase tracking-wider">Wave</div>
          <div className="wave-indicator text-white font-bold text-2xl">{wave}</div>
        </div>
      </div>
      
      {/* Score Counter */}
      <div className="absolute top-4 right-4">
        <div className="flex flex-col items-end">
          <div className="score-counter text-yellow-400 font-mono text-xl font-bold">{score}</div>
          <div className="text-white text-xs uppercase tracking-wider">Score</div>
          <div className="text-white text-xs mt-1 flex items-center">
            <svg className="w-3 h-3 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
            </svg>
            <span>Kills: {kills}</span>
          </div>
        </div>
      </div>
      
      {/* Crosshair */}
      <div className="crosshair">
        <div className="crosshair-inner"></div>
        <div className="crosshair-center"></div>
      </div>
      
      {/* Day/Night Indicator */}
      <div className="absolute bottom-4 left-4">
        <div className="bg-black bg-opacity-50 px-3 py-1 rounded text-xs text-white flex items-center">
          {gameState.dayTime < 0.2 || gameState.dayTime > 0.8 ? (
            <>
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              Night
            </>
          ) : gameState.dayTime < 0.3 ? (
            <>
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Dawn
            </>
          ) : gameState.dayTime < 0.7 ? (
            <>
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Day
            </>
          ) : (
            <>
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Sunset
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameHUD;
