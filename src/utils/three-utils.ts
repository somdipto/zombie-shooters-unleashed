
import * as THREE from 'three';
import { GameState, Zombie } from '@/types/game';

// Function to load 3D models
export const loadModel = (url: string, dracoUrl: string | null = null): Promise<THREE.Group> => {
  return new Promise((resolve, reject) => {
    // Since we can't use the GLTF/DRACO loaders without the modules,
    // we'll create a simple group as a placeholder
    const group = new THREE.Group();
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ color: '#8B4513' });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    resolve(group);
  });
};

// Function to create the scene
export const createScene = (): THREE.Scene => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#8B0000', 0.015);
  return scene;
};

// Function to create the camera
export const createCamera = (): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 5); // Set the initial position of the camera
  return camera;
};

// Function to create the renderer
export const createRenderer = (): THREE.WebGLRenderer => {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputEncoding = THREE.sRGBEncoding;
  return renderer;
};

// Function to create the environment
export const createEnvironment = (scene: THREE.Scene): void => {
  // Add ambient light
  const ambientLight = new THREE.AmbientLight('#454545', 0.7);
  scene.add(ambientLight);

  // Add directional light (sun/moon)
  const directionalLight = new THREE.DirectionalLight('#FFFFFF', 1);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  // Create skybox
  const skyboxGeometry = new THREE.BoxGeometry(500, 500, 500);
  const skyboxMaterials = [
    new THREE.MeshBasicMaterial({ color: '#87CEEB', side: THREE.BackSide }), // right
    new THREE.MeshBasicMaterial({ color: '#87CEEB', side: THREE.BackSide }), // left
    new THREE.MeshBasicMaterial({ color: '#4682B4', side: THREE.BackSide }), // top
    new THREE.MeshBasicMaterial({ color: '#556B2F', side: THREE.BackSide }), // bottom
    new THREE.MeshBasicMaterial({ color: '#87CEEB', side: THREE.BackSide }), // front
    new THREE.MeshBasicMaterial({ color: '#87CEEB', side: THREE.BackSide }), // back
  ];
  const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
  scene.add(skybox);

  // Add fog
  scene.fog = new THREE.FogExp2('#8B0000', 0.015);

  // Add ground
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: '#228B22', roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Add urban environment elements
  createUrbanEnvironment(scene);

  // Add some trees
  for (let i = 0; i < 10; i++) {
    const treeHeight = 3 + Math.random() * 3;
    const treeGeometry = new THREE.CylinderGeometry(0.5, 0.5, treeHeight, 3);
    const treeMaterial = new THREE.MeshStandardMaterial({ color: '#8B4513', roughness: 0.8 });
    const tree = new THREE.Mesh(treeGeometry, treeMaterial);
    tree.position.x = Math.random() * 80 - 40;
    tree.position.z = Math.random() * 80 - 40;
    tree.position.y = treeHeight / 2;
    tree.castShadow = true;
    tree.receiveShadow = false;
    scene.add(tree);

    const leavesHeight = 2 + Math.random() * 1;
    const leavesGeometry = new THREE.SphereGeometry(1, 7, 7);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: '#006400', roughness: 0.8 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.x = tree.position.x;
    leaves.position.z = tree.position.z;
    leaves.position.y = tree.position.y + treeHeight / 2 + leavesHeight / 2 - 1;
    leaves.castShadow = true;
    leaves.receiveShadow = false;
    scene.add(leaves);
  }

  // Add some rocks
  for (let i = 0; i < 15; i++) {
    const rockSize = 0.5 + Math.random() * 1;
    const rockGeometry = new THREE.SphereGeometry(rockSize, 8, 8);
    const rockMaterial = new THREE.MeshStandardMaterial({ color: '#808080', roughness: 0.9 });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.x = Math.random() * 80 - 40;
    rock.position.z = Math.random() * 80 - 40;
    rock.position.y = rockSize / 2 - 0.3;
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }

  // Add some fire pits
  for (let i = 0; i < 3; i++) {
    const firePitX = Math.random() * 60 - 30;
    const firePitZ = Math.random() * 60 - 30;

    // Pit
    const pitGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 16);
    const pitMaterial = new THREE.MeshStandardMaterial({ color: '#333333', roughness: 0.9 });
    const pit = new THREE.Mesh(pitGeometry, pitMaterial);
    pit.position.set(firePitX, 0.25, firePitZ);
    pit.receiveShadow = true;
    scene.add(pit);

    // Logs
    const logGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.7, 8);
    const logMaterial = new THREE.MeshStandardMaterial({ color: '#4A3000', roughness: 0.8 });

    const log1 = new THREE.Mesh(logGeometry, logMaterial);
    log1.position.set(firePitX + 0.2, 0.6, firePitZ + 0.2);
    log1.rotation.x = Math.PI / 2;
    scene.add(log1);

    const log2 = new THREE.Mesh(logGeometry, logMaterial);
    log2.position.set(firePitX - 0.2, 0.6, firePitZ - 0.2);
    log2.rotation.x = Math.PI / 2;
    scene.add(log2);

    // Fire
    const fireGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const fireMaterial = new THREE.MeshBasicMaterial({ color: '#FFA500', transparent: true, opacity: 0.8 });
    const fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.set(firePitX, 1, firePitZ);
    scene.add(fire);

    // Add light to the fire
    const fireLight = new THREE.PointLight('#FFA500', 1, 5);
    fireLight.position.set(firePitX, 1.5, firePitZ);
    scene.add(fireLight);
  }

  // Add atmospheric particles
  createAtmosphericParticles(scene);
};

// Function to create urban environment
const createUrbanEnvironment = (scene: THREE.Scene): void => {
  // Create streets
  const streetWidth = 10;
  const streetLength = 100;
  const streetGeometry = new THREE.PlaneGeometry(streetWidth, streetLength);
  const streetMaterial = new THREE.MeshStandardMaterial({ 
    color: '#333333',
    roughness: 0.8
  });

  // Main street along z-axis
  const mainStreet = new THREE.Mesh(streetGeometry, streetMaterial);
  mainStreet.rotation.x = -Math.PI / 2;
  mainStreet.position.set(0, 0.05, 0);
  scene.add(mainStreet);

  // Cross street along x-axis
  const crossStreet = new THREE.Mesh(streetGeometry, streetMaterial);
  crossStreet.rotation.x = -Math.PI / 2;
  crossStreet.rotation.z = Math.PI / 2;
  crossStreet.position.set(0, 0.05, 0);
  scene.add(crossStreet);

  // Add sidewalks
  const sidewalkGeometry = new THREE.BoxGeometry(streetWidth + 2, 0.2, streetLength);
  const sidewalkMaterial = new THREE.MeshStandardMaterial({ 
    color: '#888888', 
    roughness: 0.7 
  });

  // Add buildings
  const buildingTypes = [
    { width: 8, depth: 8, maxHeight: 15, color: '#A0522D' },  // Residential
    { width: 10, depth: 10, maxHeight: 25, color: '#708090' }, // Commercial
    { width: 15, depth: 15, maxHeight: 40, color: '#4682B4' }  // Skyscraper
  ];

  // Create building blocks
  for (let i = 0; i < 20; i++) {
    const buildingType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
    const buildingHeight = 5 + Math.random() * buildingType.maxHeight;
    
    // Position buildings away from streets
    let x, z;
    if (Math.random() > 0.5) {
      // Buildings along x-axis
      x = -40 + Math.random() * 80;
      z = (Math.random() > 0.5 ? 1 : -1) * (streetWidth/2 + 5 + Math.random() * 30);
    } else {
      // Buildings along z-axis
      x = (Math.random() > 0.5 ? 1 : -1) * (streetWidth/2 + 5 + Math.random() * 30);
      z = -40 + Math.random() * 80;
    }

    // Create main building structure
    createBuilding(
      scene, 
      x, 
      z, 
      buildingType.width, 
      buildingHeight, 
      buildingType.depth, 
      buildingType.color
    );
  }

  // Add street lights
  for (let i = -40; i <= 40; i += 20) {
    createStreetLight(scene, i, streetWidth/2 + 1, 1);
    createStreetLight(scene, i, -streetWidth/2 - 1, 1);
    createStreetLight(scene, streetWidth/2 + 1, i, 1);
    createStreetLight(scene, -streetWidth/2 - 1, i, 1);
  }

  // Add street props
  for (let i = 0; i < 10; i++) {
    // Position props along sidewalks
    const x = (Math.random() > 0.5 ? 1 : -1) * (streetWidth/2 + 0.8);
    const z = -30 + Math.random() * 60;
    
    if (Math.random() > 0.7) {
      createBench(scene, x, z);
    } else {
      createTrashBin(scene, x, z);
    }
  }
};

// Function to create a building
const createBuilding = (
  scene: THREE.Scene, 
  x: number, 
  z: number, 
  width: number, 
  height: number, 
  depth: number,
  color: string
): void => {
  const isDestroyed = Math.random() > 0.4;

  // Building base
  const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
  const buildingMaterial = new THREE.MeshStandardMaterial({ 
    color: color, 
    roughness: 0.7 
  });
  const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
  building.position.set(x, height/2, z);
  building.castShadow = true;
  building.receiveShadow = true;
  scene.add(building);

  // Add damage to building if destroyed
  if (isDestroyed) {
    // Create holes and damage in the building
    const holeCount = Math.floor(1 + Math.random() * 3);
    
    for (let i = 0; i < holeCount; i++) {
      const holeSize = 2 + Math.random() * 3;
      const holeGeometry = new THREE.BoxGeometry(holeSize, holeSize, depth + 1);
      const holeMaterial = new THREE.MeshBasicMaterial({ 
        color: '#000000',
        transparent: true,
        opacity: 0.8
      });
      
      const hole = new THREE.Mesh(holeGeometry, holeMaterial);
      const holeX = (Math.random() - 0.5) * (width - holeSize)/2;
      const holeY = Math.random() * (height - holeSize/2) - (height/2 - holeSize);
      
      hole.position.set(
        x + holeX,
        holeY + height/2,
        z
      );
      
      scene.add(hole);
    }

    // Add debris around the building
    const debrisCount = Math.floor(3 + Math.random() * 5);
    
    for (let i = 0; i < debrisCount; i++) {
      const debrisSize = 0.3 + Math.random() * 0.8;
      const debrisGeometry = new THREE.BoxGeometry(debrisSize, debrisSize, debrisSize);
      const debrisMaterial = new THREE.MeshStandardMaterial({ 
        color: color, 
        roughness: 0.9 
      });
      
      const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      
      // Position debris around the building
      const angle = Math.random() * Math.PI * 2;
      const distance = width/2 + Math.random() * 3;
      
      debris.position.set(
        x + Math.cos(angle) * distance,
        debrisSize/2,
        z + Math.sin(angle) * distance
      );
      
      debris.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      debris.castShadow = true;
      debris.receiveShadow = true;
      scene.add(debris);
    }
  } else {
    // Add windows to intact buildings
    const windowRowCount = Math.floor(height / 2);
    const windowColCount = Math.floor(width / 2);
    
    for (let row = 0; row < windowRowCount; row++) {
      for (let col = 0; col < windowColCount; col++) {
        if (Math.random() > 0.3) {
          const windowGeometry = new THREE.PlaneGeometry(0.8, 1);
          const windowMaterial = new THREE.MeshBasicMaterial({ 
            color: Math.random() > 0.7 ? '#FFFF00' : '#000000',
            side: THREE.DoubleSide
          });
          
          const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
          
          // Position windows on the building's front face
          windowMesh.position.set(
            x - width/2 + 1 + col * 2,
            2 + row * 2,
            z + depth/2 + 0.01
          );
          
          scene.add(windowMesh);
          
          // Add windows to other sides
          if (Math.random() > 0.5) {
            const sideWindow = windowMesh.clone();
            sideWindow.rotation.y = Math.PI/2;
            sideWindow.position.set(
              x + width/2 + 0.01,
              2 + row * 2,
              z - depth/2 + 1 + col * 2
            );
            scene.add(sideWindow);
          }
        }
      }
    }
  }
};

// Function to create a street light
const createStreetLight = (scene: THREE.Scene, x: number, z: number, height: number): void => {
  // Pole
  const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
  const poleMaterial = new THREE.MeshStandardMaterial({ color: '#444444' });
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.set(x, 2, z);
  pole.castShadow = true;
  scene.add(pole);

  // Light fixture
  const fixtureGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
  const fixtureMaterial = new THREE.MeshStandardMaterial({ color: '#777777' });
  const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
  fixture.position.set(x, 4, z);
  fixture.rotation.x = Math.PI/2;
  scene.add(fixture);

  // Light
  const light = new THREE.PointLight('#FFFFAA', 0.8, 10);
  light.position.set(x, 4, z);
  scene.add(light);
};

// Function to create a bench
const createBench = (scene: THREE.Scene, x: number, z: number): void => {
  const benchGroup = new THREE.Group();
  
  // Seat
  const seatGeometry = new THREE.BoxGeometry(2, 0.1, 0.6);
  const seatMaterial = new THREE.MeshStandardMaterial({ color: '#8B4513' });
  const seat = new THREE.Mesh(seatGeometry, seatMaterial);
  seat.position.y = 0.5;
  benchGroup.add(seat);
  
  // Legs
  const legGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.6);
  const legMaterial = new THREE.MeshStandardMaterial({ color: '#444444' });
  
  const leg1 = new THREE.Mesh(legGeometry, legMaterial);
  leg1.position.set(-0.8, 0.25, 0);
  benchGroup.add(leg1);
  
  const leg2 = new THREE.Mesh(legGeometry, legMaterial);
  leg2.position.set(0.8, 0.25, 0);
  benchGroup.add(leg2);
  
  // Back
  const backGeometry = new THREE.BoxGeometry(2, 0.5, 0.1);
  const backMaterial = new THREE.MeshStandardMaterial({ color: '#8B4513' });
  const back = new THREE.Mesh(backGeometry, backMaterial);
  back.position.set(0, 0.75, -0.25);
  benchGroup.add(back);
  
  benchGroup.position.set(x, 0, z);
  benchGroup.rotation.y = Math.random() * Math.PI * 2;
  scene.add(benchGroup);
};

// Function to create a trash bin
const createTrashBin = (scene: THREE.Scene, x: number, z: number): void => {
  const binGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
  const binMaterial = new THREE.MeshStandardMaterial({ 
    color: Math.random() > 0.5 ? '#228B22' : '#708090',
    roughness: 0.8
  });
  
  const bin = new THREE.Mesh(binGeometry, binMaterial);
  bin.position.set(x, 0.4, z);
  scene.add(bin);
};

// Function to create atmospheric particles
const createAtmosphericParticles = (scene: THREE.Scene): void => {
  const particleCount = 1000;
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 100;
    positions[i + 1] = Math.random() * 20;
    positions[i + 2] = (Math.random() - 0.5) * 100;
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 0.1,
    transparent: true,
    opacity: 0.4
  });
  
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);
};

// Function to create the weapon
export const createWeapon = (scene: THREE.Scene, camera: THREE.PerspectiveCamera): THREE.Group => {
  const weaponGroup = new THREE.Group();

  const geometry = new THREE.BoxGeometry(0.1, 0.2, 0.5);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const weapon = new THREE.Mesh(geometry, material);
  weapon.position.set(0.3, -0.2, -0.5);
  
  weaponGroup.add(weapon);
  camera.add(weaponGroup);
  scene.add(camera);

  return weaponGroup;
};

// Function to create a zombie
export const createZombie = (type: 'walker' | 'runner' | 'tank', position: THREE.Vector3): THREE.Group => {
  const zombieGroup = new THREE.Group();
  
  // Zombie body
  const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
  let color;

  switch (type) {
    case 'runner':
      color = 0xff0000; // Red for runner
      break;
    case 'tank':
      color = 0x0000ff; // Blue for tank
      break;
    default:
      color = 0x00ff00; // Green for walker
  }

  const material = new THREE.MeshBasicMaterial({ color: color });
  const zombie = new THREE.Mesh(geometry, material);
  zombie.position.copy(position);
  zombie.castShadow = true;
  zombie.receiveShadow = true;
  
  zombieGroup.add(zombie);
  
  // Add scary facial features
  const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
  const headMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0, 0.7, 0);
  zombieGroup.add(head);
  
  // Eyes
  const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.1, 0.75, 0.2);
  zombieGroup.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.1, 0.75, 0.2);
  zombieGroup.add(rightEye);
  
  // Mouth
  const mouthGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.05);
  const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
  mouth.position.set(0, 0.65, 0.25);
  zombieGroup.add(mouth);
  
  // Position the whole group
  zombieGroup.position.copy(position);
  
  return zombieGroup;
};

// Function to update zombie positions
export const updateZombies = (zombies: Zombie[], playerPosition: THREE.Vector3, deltaTime: number): void => {
  zombies.forEach(zombie => {
    if (!zombie.isDead) {
      // Staggered movement timing
      if (!zombie.lastMoveTime || Date.now() - zombie.lastMoveTime > 100) {
        const zombieModel = zombie.model as THREE.Group;
        const zombiePosition = new THREE.Vector3(zombie.position.x, zombie.position.y, zombie.position.z);
        const targetPosition = playerPosition.clone();

        // Calculate direction to player
        const direction = targetPosition.sub(zombiePosition).normalize();

        // Move zombie towards player
        const speed = zombie.speed || 0.015;
        zombiePosition.x += direction.x * speed * deltaTime;
        zombiePosition.z += direction.z * speed * deltaTime;

        // Update zombie's position
        zombieModel.position.set(zombiePosition.x, zombiePosition.y, zombiePosition.z);
        zombie.position = { x: zombiePosition.x, y: zombiePosition.y, z: zombiePosition.z };

        // Update zombie's last move time
        zombie.lastMoveTime = Date.now();

        // Rotate zombie to face player
        const angle = Math.atan2(direction.x, direction.z);
        zombieModel.rotation.y = -angle;
      }
    }
  });
};

// Function to handle shooting
export const shootZombie = (
  camera: THREE.PerspectiveCamera,
  zombies: Zombie[],
  scene: THREE.Scene,
  damageAmount: number
): { hit: boolean; zombieId?: string } => {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(0, 0); // Center of the screen

  raycaster.setFromCamera(mouse, camera);

  const hits = raycaster.intersectObjects(scene.children, true);

  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i];
    
    // Find the zombie that was hit by checking parent hierarchy
    for (const zombie of zombies) {
      if (!zombie.isDead && hit.object.parent) {
        const zombieModel = zombie.model as THREE.Group;
        
        if (zombieModel === hit.object || zombieModel === hit.object.parent) {
          // Apply damage
          zombie.health -= damageAmount;

          // Check if zombie is dead
          if (zombie.health <= 0) {
            zombie.isDead = true;
            scene.remove(zombieModel);
            return { hit: true, zombieId: zombie.id };
          }

          return { hit: true, zombieId: zombie.id };
        }
      }
    }
  }

  return { hit: false };
};

// Function to check for zombie collisions
export const checkZombieCollisions = (
  playerPosition: THREE.Vector3,
  zombies: Zombie[]
): { collision: boolean; damage?: number } => {
  for (let i = 0; i < zombies.length; i++) {
    const zombie = zombies[i];

    if (!zombie.isDead) {
      const zombieModel = zombie.model as THREE.Group;
      const zombiePosition = zombieModel.position;

      // Calculate distance between player and zombie
      const distance = playerPosition.distanceTo(zombiePosition);

      // Collision detection
      if (distance < 1) {
        return { collision: true, damage: zombie.damage };
      }
    }
  }

  return { collision: false };
};
