
export interface GameState {
  health: number;
  ammo: number;
  maxAmmo: number;
  score: number;
  wave: number;
  gameStatus: 'menu' | 'playing' | 'paused' | 'gameover';
  kills: number;
  dayTime: number; // 0-1 value representing time of day cycle
}

export interface Zombie {
  id: string;
  type: 'walker' | 'runner' | 'tank';
  position: { x: number; y: number; z: number };
  health: number;
  speed: number;
  damage: number;
  model: any; // Three.js mesh
  isDead: boolean;
  lastMoveTime?: number; // For staggered movement timing
  screamChance?: number; // Chance to make zombie sound
}

export interface Weapon {
  name: string;
  damage: number;
  fireRate: number; // shots per second
  reloadTime: number; // seconds
  maxAmmo: number;
  recoil: number;
  spread: number;
  model: any; // Three.js mesh
  lastFired: number;
  isReloading: boolean;
}

export type ControlKeys = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  reload: boolean;
};

export interface EnvironmentSettings {
  fogDensity: number;
  fogColor: string;
  ambientLightIntensity: number;
  skyColor: string;
}
