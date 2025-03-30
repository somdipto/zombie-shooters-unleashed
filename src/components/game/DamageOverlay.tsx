import React, { useEffect, useState } from 'react';

interface DamageOverlayProps {
  showDamage: boolean;
  health: number;
}

const DamageOverlay: React.FC<DamageOverlayProps> = ({ showDamage, health }) => {
  const [opacity, setOpacity] = useState(0);
  const [pulseEffect, setPulseEffect] = useState(false);

  useEffect(() => {
    if (showDamage) {
      const healthFactor = 1 - (health / 100);
      const baseOpacity = 0.5;
      const healthOpacity = healthFactor * 0.3;
      
      setOpacity(baseOpacity + healthOpacity);
      setPulseEffect(true);
      
      const timer = setTimeout(() => {
        setOpacity(healthOpacity * 0.7);
        setPulseEffect(false);
      }, 300);
      
      return () => clearTimeout(timer);
    } else if (health < 30) {
      const healthFactor = 1 - (health / 30);
      setOpacity(healthFactor * 0.25);
    } else {
      setOpacity(0);
    }
  }, [showDamage, health]);

  return (
    <>
      <div 
        className="damage-overlay" 
        style={{ 
          opacity,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%25\' height=\'100%25\'%3E%3Cdefs%3E%3CradialGradient id=\'a\' cx=\'50%25\' cy=\'50%25\' r=\'100%25\' fx=\'50%25\' fy=\'50%25\'%3E%3Cstop offset=\'0%25\' stop-color=\'%23700000\' stop-opacity=\'0\'/%3E%3Cstop offset=\'70%25\' stop-color=\'%23700000\' stop-opacity=\'0.3\'/%3E%3Cstop offset=\'100%25\' stop-color=\'%23700000\' stop-opacity=\'1\'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'url(%23a)\'/%3E%3C/svg%3E")'
        }}
      />
      
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.8) 100%)',
          mixBlendMode: 'multiply',
          opacity: 0.7
        }}
      />
      
      {health < 30 && (
        <div 
          className={`fixed inset-0 pointer-events-none bg-red-900 ${pulseEffect || health < 15 ? 'animate-pulse' : ''}`}
          style={{
            opacity: (30 - health) / 100,
            transition: 'opacity 500ms ease-in-out',
            animation: pulseEffect ? 'pulse 1.5s ease-in-out infinite' : 'none'
          }}
        />
      )}
    </>
  );
};

export default DamageOverlay;
