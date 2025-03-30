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
  scene.fog = new THREE.FogExp2('#661c0d', 0.012); // Reddish fog color matching the image
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
  renderer.toneMappingExposure = 1.2; // Increased exposure for dramatic effect
  renderer.outputEncoding = THREE.sRGBEncoding;
  return renderer;
};

// Function to create the environment
export const createEnvironment = (scene: THREE.Scene): void => {
  // Add ambient light
  const ambientLight = new THREE.AmbientLight('#5c3c2e', 0.4); // Warmer ambient light
  scene.add(ambientLight);

  // Add directional light (sun/moon)
  const directionalLight = new THREE.DirectionalLight('#ff7f50', 1.2); // Orange-ish sunset light
  directionalLight.position.set(-1, 0.5, -0.5).normalize(); // Position light for sunset
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 100;
  directionalLight.shadow.bias = -0.0001;
  scene.add(directionalLight);

  // Create apocalyptic skybox
  const skyboxGeometry = new THREE.BoxGeometry(500, 500, 500);
  const skyboxMaterials = [
    new THREE.MeshBasicMaterial({ color: '#4a1e1e', side: THREE.BackSide }), // right - dark red
    new THREE.MeshBasicMaterial({ color: '#4a1e1e', side: THREE.BackSide }), // left - dark red
    new THREE.MeshBasicMaterial({ color: '#994400', side: THREE.BackSide }), // top - orange-brown
    new THREE.MeshBasicMaterial({ color: '#331a00', side: THREE.BackSide }), // bottom - dark brown
    new THREE.MeshBasicMaterial({ color: '#4a1e1e', side: THREE.BackSide }), // front - dark red
    new THREE.MeshBasicMaterial({ color: '#4a1e1e', side: THREE.BackSide }), // back - dark red
  ];
  const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
  scene.add(skybox);

  // Add fog
  scene.fog = new THREE.FogExp2('#661c0d', 0.012); // Reddish fog matching the image

  // Add ground
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: '#3d3d3d', 
    roughness: 0.9,
    metalness: 0.1
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Add debris to ground
  for (let i = 0; i < 500; i++) {
    const debrisGeometry = new THREE.BoxGeometry(
      0.1 + Math.random() * 0.3,
      0.05 + Math.random() * 0.1,
      0.1 + Math.random() * 0.3
    );
    const debrisMaterial = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? '#5a5a5a' : '#3d3d3d',
      roughness: 0.9
    });
    const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
    debris.position.set(
      (Math.random() - 0.5) * 80,
      0.05,
      (Math.random() - 0.5) * 80
    );
    debris.rotation.y = Math.random() * Math.PI;
    debris.castShadow = true;
    debris.receiveShadow = true;
    scene.add(debris);
  }

  // Add apocalyptic urban environment
  createApocalypticUrbanEnvironment(scene);

  // Add some dead trees as in the image
  for (let i = 0; i < 15; i++) {
    const treeHeight = 5 + Math.random() * 5;
    const treeGeometry = new THREE.CylinderGeometry(0.3, 0.5, treeHeight, 5);
    const treeMaterial = new THREE.MeshStandardMaterial({ 
      color: '#3d2817', 
      roughness: 0.9,
      metalness: 0.1 
    });
    const tree = new THREE.Mesh(treeGeometry, treeMaterial);
    tree.position.x = Math.random() * 80 - 40;
    tree.position.z = Math.random() * 80 - 40;
    tree.position.y = treeHeight / 2;
    tree.castShadow = true;
    tree.receiveShadow = true;
    scene.add(tree);

    // Create sparse branches for dead trees
    const branchCount = 2 + Math.floor(Math.random() * 4);
    for (let j = 0; j < branchCount; j++) {
      const branchGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1 + Math.random() * 2, 3);
      const branchMaterial = new THREE.MeshStandardMaterial({ 
        color: '#3d2817',
        roughness: 0.9
      });
      const branch = new THREE.Mesh(branchGeometry, branchMaterial);
      
      // Position branch along tree trunk
      const heightPos = (Math.random() * 0.6 + 0.3) * treeHeight;
      const angle = Math.random() * Math.PI * 2;
      
      branch.position.set(
        tree.position.x + Math.cos(angle) * 0.4,
        heightPos,
        tree.position.z + Math.sin(angle) * 0.4
      );
      
      // Rotate branch outward from trunk
      branch.rotation.z = Math.PI / 2 - Math.random() * 0.6;
      branch.rotation.y = angle;
      branch.castShadow = true;
      scene.add(branch);
    }
  }

  // Add fire pits and barrels with fire for the apocalyptic look
  for (let i = 0; i < 8; i++) {
    const firePitX = Math.random() * 60 - 30;
    const firePitZ = Math.random() * 60 - 30;

    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 12);
    const barrelMaterial = new THREE.MeshStandardMaterial({ 
      color: '#5d4037', 
      roughness: 0.8,
      metalness: 0.5
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(firePitX, 0.6, firePitZ);
    barrel.receiveShadow = true;
    barrel.castShadow = true;
    scene.add(barrel);

    // Fire
    const fireGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const fireMaterial = new THREE.MeshBasicMaterial({ 
      color: '#ff4500', 
      transparent: true, 
      opacity: 0.8 
    });
    const fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.set(firePitX, 1.3, firePitZ);
    scene.add(fire);

    // Add light to the fire
    const fireLight = new THREE.PointLight('#ff7700', 1.5, 10);
    fireLight.position.set(firePitX, 1.5, firePitZ);
    scene.add(fireLight);
  }

  // Add atmospheric particles for ash and embers
  createAtmosphericParticles(scene);
};

// Function to create apocalyptic urban environment
const createApocalypticUrbanEnvironment = (scene: THREE.Scene): void => {
  // Create broken streets
  const streetWidth = 10;
  const streetLength = 100;
  const streetGeometry = new THREE.PlaneGeometry(streetWidth, streetLength);
  const streetMaterial = new THREE.MeshStandardMaterial({ 
    color: '#2d2d2d',
    roughness: 0.9,
    metalness: 0.1
  });

  // Main street along z-axis with cracks and damage
  const mainStreet = new THREE.Mesh(streetGeometry, streetMaterial);
  mainStreet.rotation.x = -Math.PI / 2;
  mainStreet.position.set(0, 0.05, 0);
  mainStreet.receiveShadow = true;
  scene.add(mainStreet);
  
  // Add cracks to the street
  addCracksToStreet(scene, 0, 0, streetWidth, streetLength);

  // Cross street along x-axis
  const crossStreet = new THREE.Mesh(streetGeometry, streetMaterial);
  crossStreet.rotation.x = -Math.PI / 2;
  crossStreet.rotation.z = Math.PI / 2;
  crossStreet.position.set(0, 0.05, 0);
  crossStreet.receiveShadow = true;
  scene.add(crossStreet);
  
  // Add cracks to cross street
  addCracksToStreet(scene, 0, 0, streetWidth, streetLength, true);

  // Add damaged vehicles
  for (let i = 0; i < 12; i++) {
    createDamagedVehicle(
      scene,
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 40
    );
  }

  // Create destroyed buildings
  const buildingTypes = [
    { width: 8, depth: 8, maxHeight: 12, color: '#4d4d4d' },  // Residential
    { width: 10, depth: 10, maxHeight: 20, color: '#3d3d3d' }, // Commercial
    { width: 15, depth: 15, maxHeight: 35, color: '#2d2d2d' }  // Skyscraper
  ];

  // Create building blocks - many destroyed
  for (let i = 0; i < 25; i++) {
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

    // Almost all buildings should be destroyed in apocalypse
    const isDestroyed = Math.random() > 0.1;
    const destructionLevel = Math.random() * 0.8 + 0.2; // 0.2-1.0 destruction level

    // Create main building structure
    createDestroyedBuilding(
      scene, 
      x, 
      z, 
      buildingType.width, 
      buildingHeight, 
      buildingType.depth, 
      buildingType.color,
      isDestroyed,
      destructionLevel
    );
  }

  // Add damaged street lights
  for (let i = -40; i <= 40; i += 20) {
    if (Math.random() > 0.5) { // Some street lights are missing
      createDamagedStreetLight(scene, i, streetWidth/2 + 1, Math.random() > 0.7);
    }
    
    if (Math.random() > 0.5) {
      createDamagedStreetLight(scene, i, -streetWidth/2 - 1, Math.random() > 0.7);
    }
    
    if (Math.random() > 0.5) {
      createDamagedStreetLight(scene, streetWidth/2 + 1, i, Math.random() > 0.7);
    }
    
    if (Math.random() > 0.5) {
      createDamagedStreetLight(scene, -streetWidth/2 - 1, i, Math.random() > 0.7);
    }
  }

  // Add street props and debris
  for (let i = 0; i < 25; i++) {
    // Position props throughout the area
    const x = -30 + Math.random() * 60;
    const z = -30 + Math.random() * 60;
    
    const propType = Math.random();
    if (propType < 0.3) {
      createBrokenBench(scene, x, z);
    } else if (propType < 0.6) {
      createTrashBin(scene, x, z, true); // Overturned
    } else {
      createDebrisPile(scene, x, z);
    }
  }

  // Add barricades as seen in the images
  for (let i = 0; i < 8; i++) {
    createBarricade(
      scene,
      -25 + Math.random() * 50,
      -25 + Math.random() * 50
    );
  }
};

// Function to add cracks to a street
const addCracksToStreet = (
  scene: THREE.Scene, 
  centerX: number, 
  centerZ: number, 
  width: number, 
  length: number,
  isHorizontal: boolean = false
): void => {
  // Add major crack along the street
  const crackGeometry = new THREE.PlaneGeometry(
    isHorizontal ? length * 0.8 : Math.random() * 2 + 1,
    isHorizontal ? Math.random() * 2 + 1 : length * 0.8
  );
  
  const crackMaterial = new THREE.MeshStandardMaterial({
    color: '#1a1a1a',
    roughness: 1,
    metalness: 0
  });
  
  const crack = new THREE.Mesh(crackGeometry, crackMaterial);
  crack.rotation.x = -Math.PI / 2;
  crack.position.set(
    centerX + (isHorizontal ? 0 : (Math.random() - 0.5) * width * 0.8),
    0.06,
    centerZ + (isHorizontal ? (Math.random() - 0.5) * width * 0.8 : 0)
  );
  crack.receiveShadow = true;
  scene.add(crack);
  
  // Add smaller cracks
  for (let i = 0; i < 15; i++) {
    const smallCrackGeometry = new THREE.PlaneGeometry(
      Math.random() * 1.5 + 0.5,
      Math.random() * 1.5 + 0.5
    );
    
    const smallCrack = new THREE.Mesh(smallCrackGeometry, crackMaterial);
    smallCrack.rotation.x = -Math.PI / 2;
    smallCrack.rotation.z = Math.random() * Math.PI;
    
    smallCrack.position.set(
      centerX + (Math.random() - 0.5) * width * 0.9,
      0.061,
      centerZ + (Math.random() - 0.5) * length * 0.9
    );
    
    smallCrack.receiveShadow = true;
    scene.add(smallCrack);
  }
  
  // Add potholes
  for (let i = 0; i < 8; i++) {
    const holeRadius = Math.random() * 1.5 + 0.5;
    const holeGeometry = new THREE.CircleGeometry(holeRadius, 8);
    const holeMaterial = new THREE.MeshStandardMaterial({
      color: '#0a0a0a',
      roughness: 1,
      metalness: 0
    });
    
    const hole = new THREE.Mesh(holeGeometry, holeMaterial);
    hole.rotation.x = -Math.PI / 2;
    
    hole.position.set(
      centerX + (Math.random() - 0.5) * width * 0.7,
      0.06,
      centerZ + (Math.random() - 0.5) * length * 0.7
    );
    
    hole.receiveShadow = true;
    scene.add(hole);
  }
};

// Function to create a destroyed building
const createDestroyedBuilding = (
  scene: THREE.Scene, 
  x: number, 
  z: number, 
  width: number, 
  height: number, 
  depth: number,
  color: string,
  isDestroyed: boolean = true,
  destructionLevel: number = 0.7
): void => {
  // Adjust height based on destruction level if building is destroyed
  const actualHeight = isDestroyed ? height * (1 - destructionLevel * 0.7) : height;
  
  // Building base - make it irregular if destroyed
  let buildingGeometry;
  
  if (isDestroyed) {
    // Create custom geometry for destroyed building (irregular shape)
    const vertices = [
      // Base (bottom)
      -width/2, 0, -depth/2,
      width/2, 0, -depth/2,
      width/2, 0, depth/2,
      -width/2, 0, depth/2,
      
      // Top (modified for destruction)
      -width/2 * (1 - Math.random() * 0.3), actualHeight, -depth/2 * (1 - Math.random() * 0.3),
      width/2 * (1 - Math.random() * 0.3), actualHeight, -depth/2 * (1 - Math.random() * 0.3),
      width/2 * (1 - Math.random() * 0.3), actualHeight, depth/2 * (1 - Math.random() * 0.3),
      -width/2 * (1 - Math.random() * 0.3), actualHeight, depth/2 * (1 - Math.random() * 0.3)
    ];
    
    // Convert to Float32Array
    const positionArray = new Float32Array(vertices);
    
    buildingGeometry = new THREE.BoxGeometry(width, actualHeight, depth);
    buildingGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
  } else {
    buildingGeometry = new THREE.BoxGeometry(width, actualHeight, depth);
  }
  
  // Adjust color for destruction (make it darker)
  let buildingColor = color;
  if (isDestroyed) {
    // Convert hex to rgb
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    
    // Darken and add grey tint for destruction
    const darkenFactor = 0.7;
    const newR = Math.floor((r * darkenFactor) * 255).toString(16).padStart(2, '0');
    const newG = Math.floor((g * darkenFactor) * 255).toString(16).padStart(2, '0');
    const newB = Math.floor((b * darkenFactor) * 255).toString(16).padStart(2, '0');
    
    buildingColor = `#${newR}${newG}${newB}`;
  }
  
  const buildingMaterial = new THREE.MeshStandardMaterial({ 
    color: buildingColor, 
    roughness: 0.9,
    metalness: 0.1
  });
  
  const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
  building.position.set(x, actualHeight/2, z);
  building.castShadow = true;
  building.receiveShadow = true;
  scene.add(building);

  // Add extensive damage to destroyed buildings
  if (isDestroyed) {
    // Create exposed concrete and rebar for destroyed sections
    const exposedHeight = height - actualHeight;
    
    if (exposedHeight > 1) {
      // Exposed structure on top
      const exposedGeometry = new THREE.BoxGeometry(
        width * 0.9,
        exposedHeight,
        depth * 0.9
      );
      
      const exposedMaterial = new THREE.MeshStandardMaterial({
        color: '#3d3d3d',
        roughness: 1,
        metalness: 0.1
      });
      
      const exposedConcrete = new THREE.Mesh(exposedGeometry, exposedMaterial);
      exposedConcrete.position.set(
        x,
        actualHeight + exposedHeight/2,
        z
      );
      
      exposedConcrete.castShadow = true;
      scene.add(exposedConcrete);
      
      // Add rebar (metal reinforcement bars)
      for (let i = 0; i < 12; i++) {
        const rebarGeometry = new THREE.CylinderGeometry(0.05, 0.05, exposedHeight * 1.5, 4);
        const rebarMaterial = new THREE.MeshStandardMaterial({
          color: '#8B4513',
          roughness: 0.7,
          metalness: 0.6
        });
        
        const rebar = new THREE.Mesh(rebarGeometry, rebarMaterial);
        
        // Position rebars sticking out of the concrete at various angles
        const posX = (Math.random() - 0.5) * width * 0.8;
        const posZ = (Math.random() - 0.5) * depth * 0.8;
        
        rebar.position.set(
          x + posX,
          actualHeight + exposedHeight * 0.5,
          z + posZ
        );
        
        // Bend the rebar at random angles
        rebar.rotation.x = (Math.random() - 0.5) * 0.5;
        rebar.rotation.z = (Math.random() - 0.5) * 0.5;
        
        rebar.castShadow = true;
        scene.add(rebar);
      }
    }

    // Create holes and damage in the building
    const holeCount = Math.floor(2 + Math.random() * 5);
    
    for (let i = 0; i < holeCount; i++) {
      const holeSize = 1 + Math.random() * 2;
      const holeGeometry = new THREE.BoxGeometry(holeSize, holeSize, depth + 1);
      const holeMaterial = new THREE.MeshBasicMaterial({ 
        color: '#0a0a0a',
        transparent: true,
        opacity: 0.8
      });
      
      const hole = new THREE.Mesh(holeGeometry, holeMaterial);
      const holeX = (Math.random() - 0.5) * (width - holeSize);
      const holeY = Math.random() * (actualHeight - holeSize/2);
      
      hole.position.set(
        x + holeX,
        holeY + holeSize/2,
        z
      );
      
      scene.add(hole);
      
      // Add rubble around holes
      const rubbleCount = Math.floor(3 + Math.random() * 4);
      for (let j = 0; j < rubbleCount; j++) {
        createRubblePiece(
          scene,
          hole.position.x + (Math.random() - 0.5) * holeSize,
          hole.position.y - holeSize/2 - 0.2,
          hole.position.z + depth/2 + Math.random() * 0.5
        );
      }
    }

    // Add debris around the building
    const debrisCount = Math.floor(10 + Math.random() * 15);
    
    for (let i = 0; i < debrisCount; i++) {
      // Position debris around the building
      const angle = Math.random() * Math.PI * 2;
      const distance = width/2 + Math.random() * 5;
      
      createRubblePiece(
        scene,
        x + Math.cos(angle) * distance,
        Math.random() * 0.4,
        z + Math.sin(angle) * distance
      );
    }
  } else {
    // Add windows to intact buildings
    const windowRowCount = Math.floor(height / 2);
    const windowColCount = Math.floor(width / 2);
    
    for (let row = 0; row < windowRowCount; row++) {
      for (let col = 0; col < windowColCount; col++) {
        if (Math.random() > 0.3) {
          const windowGeometry = new THREE.PlaneGeometry(0.8, 1);
          const isBroken = Math.random() > 0.5;
          const windowMaterial = new THREE.MeshBasicMaterial({ 
            color: isBroken ? '#1a1a1a' : Math.random() > 0.9 ? '#FFFF00' : '#212121',
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

// Function to create a piece of rubble/debris
const createRubblePiece = (scene: THREE.Scene, x: number, y: number, z: number): void => {
  const size = 0.3 + Math.random() * 0.8;
  
  let geometry;
  const shapeType = Math.floor(Math.random() * 4);
  
  switch (shapeType) {
    case 0:
      geometry = new THREE.BoxGeometry(size, size * 0.6, size);
      break;
    case 1:
      geometry = new THREE.TetrahedronGeometry(size * 0.6);
      break;
    case 2:
      geometry = new THREE.DodecahedronGeometry(size * 0.5, 0);
      break;
    default:
      geometry = new THREE.ConeGeometry(size * 0.5, size, 4);
  }
  
  const material = new THREE.MeshStandardMaterial({ 
    color: Math.random() > 0.7 ? '#8B4513' : '#5a5a5a', 
    roughness: 0.9,
    metalness: 0.1
  });
  
  const rubble = new THREE.Mesh(geometry, material);
  
  rubble.position.set(x, y + size/2, z);
  
  rubble.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );
  
  rubble.castShadow = true;
  rubble.receiveShadow = true;
  scene.add(rubble);
};

// Function to create a damaged street light
const createDamagedStreetLight = (scene: THREE.Scene, x: number, z: number, isFallen: boolean): void => {
  // Pole
  const poleHeight = isFallen ? 1 : 4;
  const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, poleHeight, 8);
  const poleMaterial = new THREE.MeshStandardMaterial({ 
    color: '#555555',
    roughness: 0.7,
    metalness: 0.6
  });
  
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  
  if (isFallen) {
    // Fallen pole
    pole.rotation.z = Math.PI / 2;
    pole.position.set(x, 0.5, z);
  } else {
    // Standing but damaged pole (slight tilt)
    pole.rotation.z = (Math.random() - 0.5) * 0.3;
    pole.position.set(x, poleHeight/2, z);
  }
  
  pole.castShadow = true;
  pole.receiveShadow = true;
  scene.add(pole);

  // Light fixture
  const fixtureGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
  const fixtureMaterial = new THREE.MeshStandardMaterial({ 
    color: '#777777',
    roughness: 0.7,
    metalness: 0.4
  });
  
  const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
  
  if (isFallen) {
    fixture.rotation.z = Math.PI / 2;
    fixture.position.set(x + 2, 0.3, z);
  } else {
    fixture.rotation.x = Math.PI/2;
    fixture.rotation.z = pole.rotation.z;
    fixture.position.set(
      x + Math.sin(pole.rotation.z) * 4,
      poleHeight + Math.cos(pole.rotation.z) * 0.3,
      z
    );
  }
  
  fixture.castShadow = true;
  fixture.receiveShadow = true;
  scene.add(fixture);

  // Light - only working on some standing lights
  if (!isFallen && Math.random() > 0.6) {
    const light = new THREE.PointLight('#ffaa22', 0.8, 10, 2);
    light.position.copy(fixture.position);
    scene.add(light);
  }
};

// Function to create a broken bench
const createBrokenBench = (scene: THREE.Scene, x: number, z: number): void => {
  const benchGroup = new THREE.Group();
  
  // Determine if bench is knocked over
  const isKnockedOver = Math.random() > 0.5;
  
  // Seat - maybe broken
  const seatGeometry = new THREE.BoxGeometry(2, 0.1, 0.6);
  const seatMaterial = new THREE.MeshStandardMaterial({ 
    color: '#4d3319',
    roughness: 0.9 
  });
  
  const seat = new THREE.Mesh(seatGeometry, seatMaterial);
  
  if (isKnockedOver) {
    seat.rotation.z = Math.PI / 2;
    seat.position.y = 0.3;
    seat.position.x = -0.
