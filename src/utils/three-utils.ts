import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { GameState, Zombie } from '@/types/game';

// Function to load 3D models
export const loadModel = (url: string, dracoUrl: string | null = null): Promise<THREE.Group> => {
  return new Promise((resolve, reject) => {
    const gltfLoader = new GLTFLoader();

    // Add DRACOLoader if dracoUrl is provided
    if (dracoUrl) {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(dracoUrl);
      gltfLoader.setDRACOLoader(dracoLoader);
    }

    gltfLoader.load(
      url,
      (gltf) => {
        resolve(gltf.scene);
      },
      undefined,
      (error) => {
        console.error("An error happened while loading the model:", error);
        reject(error);
      }
    );
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

  // Load environment map (skybox)
  new RGBELoader()
    .setPath('/assets/')
    .load('royal_esplanade_1k.hdr', function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
    });

  // Add fog
  scene.fog = new THREE.FogExp2('#8B0000', 0.015);

  // Add ground
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: '#228B22', roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

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
};

// Function to create the weapon
export const createWeapon = (scene: THREE.Scene, camera: THREE.PerspectiveCamera): THREE.Group => {
  const geometry = new THREE.BoxGeometry(0.1, 0.2, 0.5);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const weapon = new THREE.Mesh(geometry, material);
  weapon.position.set(0.3, -0.2, -0.5);
  camera.add(weapon);
  scene.add(camera);

  return weapon;
};

// Function to create a zombie
export const createZombie = (type: 'walker' | 'runner' | 'tank', position: THREE.Vector3): THREE.Group => {
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

  return zombie;
};

// Function to update zombie positions
export const updateZombies = (zombies: Zombie[], playerPosition: THREE.Vector3, deltaTime: number): void => {
  zombies.forEach(zombie => {
    if (!zombie.isDead) {
      // Staggered movement timing
      if (!zombie.lastMoveTime || Date.now() - zombie.lastMoveTime > 100) {
        const zombieMesh = zombie.model as THREE.Mesh;
        const zombiePosition = new THREE.Vector3(zombie.position.x, zombie.position.y, zombie.position.z);
        const targetPosition = playerPosition.clone();

        // Calculate direction to player
        const direction = targetPosition.sub(zombiePosition).normalize();

        // Move zombie towards player
        const speed = zombie.speed || 0.015;
        zombiePosition.x += direction.x * speed * deltaTime;
        zombiePosition.z += direction.z * speed * deltaTime;

        // Update zombie's position
        zombieMesh.position.set(zombiePosition.x, zombiePosition.y, zombiePosition.z);
        zombie.position = { x: zombiePosition.x, y: zombiePosition.y, z: zombiePosition.z };

        // Update zombie's last move time
        zombie.lastMoveTime = Date.now();

        // Rotate zombie to face player
        const angle = Math.atan2(direction.x, direction.z);
        zombieMesh.rotation.y = -angle;
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

  const hits = raycaster.intersectObjects(scene.children);

  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i];

    // Find the zombie that was hit
    const zombie = zombies.find(z => (z.model as THREE.Mesh).uuid === hit.object.uuid);

    if (zombie && !zombie.isDead) {
      // Apply damage
      zombie.health -= damageAmount;

      // Check if zombie is dead
      if (zombie.health <= 0) {
        zombie.isDead = true;
        scene.remove(zombie.model);
        return { hit: true, zombieId: zombie.id };
      }

      return { hit: true, zombieId: zombie.id };
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
      const zombieMesh = zombie.model as THREE.Mesh;
      const zombiePosition = zombieMesh.position;

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
