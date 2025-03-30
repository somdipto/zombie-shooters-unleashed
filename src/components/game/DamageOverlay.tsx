
import React, { useEffect, useState } from 'react';

interface DamageOverlayProps {
  showDamage: boolean;
}

const DamageOverlay: React.FC<DamageOverlayProps> = ({ showDamage }) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (showDamage) {
      setOpacity(0.5);
      const timer = setTimeout(() => setOpacity(0), 300);
      return () => clearTimeout(timer);
    }
  }, [showDamage]);

  return (
    <div 
      className="damage-overlay" 
      style={{ opacity }}
    />
  );
};

export default DamageOverlay;
