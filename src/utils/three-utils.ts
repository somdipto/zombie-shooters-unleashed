
import * as THREE from 'three';
import { Zombie } from '@/types/game';

// Create a basic scene
export const createScene = (): THREE.Scene => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');
  
  // Add fog for atmosphere
  scene.fog = new THREE.FogExp2('#1a1a1a', 0.035);
  
  return scene;
};

// Set up camera
export const createCamera = (): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(
    75, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
  );
  camera.position.set(0, 1.6, 0); // Eye height
  
  return camera;
};

// Create a renderer
export const createRenderer = (): THREE.WebGLRenderer => {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  return renderer;
};

// Generate the game environment
export const createEnvironment = (scene: THREE.Scene): void => {
  // Ground
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: '#2D2D2D',
    roughness: 0.8, 
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Ambient light
  const ambientLight = new THREE.AmbientLight('#333333');
  scene.add(ambientLight);
  
  // Directional light (moonlight)
  const moonLight = new THREE.DirectionalLight('#A0A0FF', 0.5);
  moonLight.position.set(50, 50, 50);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = 1024;
  moonLight.shadow.mapSize.height = 1024;
  scene.add(moonLight);
  
  // Add buildings and obstacles
  addBuildings(scene);
};

// Add some basic buildings to the scene
const addBuildings = (scene: THREE.Scene): void => {
  // Materials
  const buildingMaterial = new THREE.MeshStandardMaterial({ 
    color: '#505050',
    roughness: 0.7 
  });
  
  // Building positions
  const positions = [
    { x: -20, z: -20, w: 10, h: 15, d: 10 },
    { x: 20, z: -15, w: 15, h: 10, d: 15 },
    { x: -15, z: 20, w: 12, h: 8, d: 12 },
    { x: 25, z: 25, w: 8, h: 12, d: 8 },
  ];
  
  // Create buildings
  positions.forEach(pos => {
    const geometry = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
    const building = new THREE.Mesh(geometry, buildingMaterial);
    building.position.set(pos.x, pos.h / 2, pos.z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
  });
  
  // Add some barriers/obstacles
  for (let i = 0; i < 20; i++) {
    const size = Math.random() * 3 + 1;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({ 
      color: Math.random() > 0.5 ? '#8B4513' : '#A52A2A',
      roughness: 0.9 
    });
    const obstacle = new THREE.Mesh(geometry, material);
    
    // Random position avoiding buildings
    let validPosition = false;
    let x, z;
    
    while (!validPosition) {
      x = Math.random() * 80 - 40;
      z = Math.random() * 80 - 40;
      
      // Check if far enough from buildings
      validPosition = positions.every(pos => {
        const dx = Math.abs(x - pos.x);
        const dz = Math.abs(z - pos.z);
        return dx > (pos.w / 2 + size + 2) || dz > (pos.d / 2 + size + 2);
      });
    }
    
    obstacle.position.set(x, size / 2, z);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    scene.add(obstacle);
  }
};

// Create a weapon model
export const createWeapon = (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
  const group = new THREE.Group();
  
  // Gun body
  const gunGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.3);
  const gunMaterial = new THREE.MeshStandardMaterial({ color: '#111111' });
  const gun = new THREE.Mesh(gunGeometry, gunMaterial);
  gun.position.set(0, -0.05, 0);
  group.add(gun);
  
  // Gun barrel
  const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
  const barrelMaterial = new THREE.MeshStandardMaterial({ color: '#222222' });
  const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, -0.03, 0.35);
  group.add(barrel);
  
  // Position the weapon in front of the camera
  group.position.set(0.25, -0.2, -0.5);
  camera.add(group);
  
  return group;
};

// Create a zombie model
export const createZombie = (type: 'walker' | 'runner' | 'tank', position: THREE.Vector3): THREE.Group => {
  const zombie = new THREE.Group();
  
  // Different zombie types have different colors and sizes
  let bodyColor, headColor, scale, health, speed, damage;
  
  switch (type) {
    case 'runner':
      bodyColor = '#567d46'; // green tint
      headColor = '#4a6c3c';
      scale = 0.9;
      health = 50;
      speed = 0.06;
      damage = 10;
      break;
    case 'tank':
      bodyColor = '#6b4423'; // brown tint
      headColor = '#5a381e';
      scale = 1.3;
      health = 200;
      speed = 0.02;
      damage = 25;
      break;
    default: // walker
      bodyColor = '#696969'; // gray
      headColor = '#595959';
      scale = 1;
      health = 100;
      speed = 0.03;
      damage = 15;
  }
  
  // Body
  const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 1;
  body.scale.set(scale, scale, scale);
  zombie.add(body);
  
  // Head
  const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
  const headMaterial = new THREE.MeshStandardMaterial({ color: headColor });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0, 1.8 * scale, 0);
  head.scale.set(scale, scale, scale);
  zombie.add(head);
  
  // Arms
  const armGeometry = new THREE.CapsuleGeometry(0.15, 0.7, 4, 8);
  const armMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
  
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-0.7 * scale, 1 * scale, 0);
  leftArm.rotation.z = -Math.PI / 4;
  leftArm.scale.set(scale, scale, scale);
  zombie.add(leftArm);
  
  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(0.7 * scale, 1 * scale, 0);
  rightArm.rotation.z = Math.PI / 4;
  rightArm.scale.set(scale, scale, scale);
  zombie.add(rightArm);
  
  // Legs
  const legGeometry = new THREE.CapsuleGeometry(0.2, 0.8, 4, 8);
  const legMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
  
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.3 * scale, 0.4 * scale, 0);
  leftLeg.scale.set(scale, scale, scale);
  zombie.add(leftLeg);
  
  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(0.3 * scale, 0.4 * scale, 0);
  rightLeg.scale.set(scale, scale, scale);
  zombie.add(rightLeg);
  
  // Position the zombie
  zombie.position.copy(position);
  
  // Add shadow casting
  zombie.traverse(object => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  
  return zombie;
};

// Zombie movement logic
export const updateZombies = (
  zombies: Zombie[], 
  playerPosition: THREE.Vector3, 
  deltaTime: number
): void => {
  zombies.forEach(zombie => {
    if (zombie.isDead) return;
    
    // Get direction to player
    const direction = new THREE.Vector3(
      playerPosition.x - zombie.position.x,
      0, // Don't move up/down
      playerPosition.z - zombie.position.z
    ).normalize();
    
    // Move zombie towards player
    zombie.position.x += direction.x * zombie.speed * deltaTime;
    zombie.position.z += direction.z * zombie.speed * deltaTime;
    
    // Update model position
    if (zombie.model) {
      zombie.model.position.set(
        zombie.position.x,
        zombie.position.y,
        zombie.position.z
      );
      
      // Rotate zombie to face player
      zombie.model.lookAt(new THREE.Vector3(
        playerPosition.x,
        zombie.model.position.y,
        playerPosition.z
      ));
    }
  });
};

// Raycasting for shooting
export const shootZombie = (
  camera: THREE.Camera,
  zombies: Zombie[],
  scene: THREE.Scene,
  damage: number
): { hit: boolean, zombieId?: string } => {
  const raycaster = new THREE.Raycaster();
  const rayDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  
  raycaster.set(camera.position, rayDirection);
  
  // Collect all zombie meshes for raycasting
  const zombieMeshes: THREE.Object3D[] = [];
  const zombieMap = new Map<THREE.Object3D, Zombie>();
  
  zombies.forEach(zombie => {
    if (zombie.isDead) return;
    
    zombie.model.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        zombieMeshes.push(object);
        zombieMap.set(object, zombie);
      }
    });
  });
  
  // Check for intersections
  const intersects = raycaster.intersectObjects(zombieMeshes);
  
  if (intersects.length > 0) {
    const hitObject = intersects[0].object;
    const hitZombie = zombieMap.get(hitObject);
    
    if (hitZombie) {
      // Apply damage
      hitZombie.health -= damage;
      
      // Check if zombie is dead
      if (hitZombie.health <= 0 && !hitZombie.isDead) {
        hitZombie.isDead = true;
        
        // Death animation - slump to ground
        const deathAnimation = () => {
          // Rotate forward and lower to ground
          if (hitZombie.model.rotation.x < Math.PI / 2) {
            hitZombie.model.rotation.x += 0.1;
            hitZombie.model.position.y -= 0.05;
            requestAnimationFrame(deathAnimation);
          } else {
            // Remove from scene after delay
            setTimeout(() => {
              scene.remove(hitZombie.model);
            }, 5000);
          }
        };
        
        deathAnimation();
        
        return { hit: true, zombieId: hitZombie.id };
      }
      
      return { hit: true };
    }
  }
  
  return { hit: false };
};

// Collision detection between player and zombies
export const checkZombieCollisions = (
  playerPosition: THREE.Vector3,
  zombies: Zombie[],
  radius: number = 1
): { collision: boolean, zombieId?: string, damage?: number } => {
  for (const zombie of zombies) {
    if (zombie.isDead) continue;
    
    const dx = playerPosition.x - zombie.position.x;
    const dz = playerPosition.z - zombie.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < radius) {
      return {
        collision: true,
        zombieId: zombie.id,
        damage: zombie.damage
      };
    }
  }
  
  return { collision: false };
};
