
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
      const baseOpacity = 0.6; // Increased for more dramatic effect
      const healthOpacity = healthFactor * 0.4; // More opacity variation based on health
      
      setOpacity(baseOpacity + healthOpacity);
      setPulseEffect(true);
      
      const timer = setTimeout(() => {
        setOpacity(healthOpacity * 0.8);
        setPulseEffect(false);
      }, 300);
      
      return () => clearTimeout(timer);
    } else if (health < 30) {
      const healthFactor = 1 - (health / 30);
      setOpacity(healthFactor * 0.35); // More visible at low health
    } else {
      setOpacity(0);
    }
  }, [showDamage, health]);

  return (
    <>
      {/* Blood overlay effect */}
      <div 
        className="damage-overlay fixed inset-0 pointer-events-none" 
        style={{ 
          opacity,
          // More realistic blood splatter pattern
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3CradialGradient id='a' cx='50%25' cy='50%25' r='100%25' fx='50%25' fy='50%25'%3E%3Cstop offset='0%25' stop-color='%23700000' stop-opacity='0'/%3E%3Cstop offset='70%25' stop-color='%23700000' stop-opacity='0.4'/%3E%3Cstop offset='100%25' stop-color='%23700000' stop-opacity='1'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23a)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply'
        }}
      />
      
      {/* Blood splatters at edges */}
      {showDamage && (
        <>
          <div
            className="fixed right-0 top-1/4 w-1/4 h-2/4 pointer-events-none"
            style={{
              opacity: opacity * 0.9,
              backgroundImage: "url('/lovable-uploads/c4338286-b849-4d3a-baae-617c7d9f8cb3.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'left center',
              transform: 'scaleX(-1)',
              mixBlendMode: 'multiply'
            }}
          />
          <div
            className="fixed left-0 bottom-1/4 w-1/4 h-2/4 pointer-events-none"
            style={{
              opacity: opacity * 0.9,
              backgroundImage: "url('/lovable-uploads/c4338286-b849-4d3a-baae-617c7d9f8cb3.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'right center',
              mixBlendMode: 'multiply'
            }}
          />
        </>
      )}
      
      {/* Vignette effect for tunnel vision at low health */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.9) 100%)',
          mixBlendMode: 'multiply',
          opacity: health < 50 ? (1 - health/50) * 0.8 : 0,
          transition: 'opacity 500ms ease-in-out'
        }}
      />
      
      {/* Red pulse for low health */}
      {health < 30 && (
        <div 
          className={`fixed inset-0 pointer-events-none bg-red-900 ${pulseEffect || health < 15 ? 'animate-pulse' : ''}`}
          style={{
            opacity: (30 - health) / 100 * 0.8,
            transition: 'opacity 500ms ease-in-out',
            animation: pulseEffect ? 'pulse 1.5s ease-in-out infinite' : 'none'
          }}
        />
      )}
    </>
  );
};

export default DamageOverlay;
