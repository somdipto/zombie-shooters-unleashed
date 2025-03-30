
export interface GameState {
  health: number;
  ammo: number;
  maxAmmo: number;
  score: number;
  wave: number;
  gameStatus: 'menu' | 'playing' | 'paused' | 'gameover';
  kills: number;
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
