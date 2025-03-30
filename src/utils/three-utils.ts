import * as THREE from 'three';
import { Zombie } from '@/types/game';

// Create a basic scene
export const createScene = (): THREE.Scene => {
  const scene = new THREE.Scene();
  
  // Create skybox with apocalyptic feel
  const skyboxTexture = createApocalypticSkybox();
  scene.background = skyboxTexture;
  
  // Add apocalyptic fog for atmosphere
  scene.fog = new THREE.FogExp2('#8B0000', 0.015);
  
  return scene;
};

// Create a skybox with apocalyptic clouds and atmosphere
const createApocalypticSkybox = (): THREE.CubeTexture => {
  // Create a procedural cube texture with reddish/orange apocalyptic sky
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128);
  const cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);
  
  // Create a procedural skybox texture
  const skyboxMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPosition;
      uniform float time;
      
      // Noise functions for cloud generation
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      
      float fbm(vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 0.5;
        for (int i = 0; i < 6; i++) {
            value += amplitude * noise(st * frequency);
            st = st * 2.0 + time * 0.01;
            amplitude *= 0.5;
            frequency *= 2.0;
        }
        return value;
      }
      
      void main() {
        // Normalize the position
        vec3 normal = normalize(vWorldPosition);
        
        // Base sky color - dark reddish for apocalypse
        vec3 baseColor = vec3(0.3, 0.1, 0.1);
        
        // Gradient sky - darker at the bottom, more reddish at horizon
        float y = normal.y * 0.5 + 0.5;
        vec3 skyColor = mix(vec3(0.6, 0.3, 0.2), vec3(0.1, 0.05, 0.1), y);
        
        // Add clouds
        float cloudDensity = fbm(normal.xz * 2.0 + time * 0.02);
        vec3 cloudColor = mix(vec3(0.3, 0.2, 0.2), vec3(0.1, 0.05, 0.05), cloudDensity);
        
        // Mix sky and clouds
        vec3 finalColor = mix(skyColor, cloudColor, smoothstep(0.4, 0.6, cloudDensity));
        
        // Add a bit of "sun" glow on one side
        float sunGlow = max(0.0, dot(normal, normalize(vec3(1.0, 0.2, 0.0))));
        finalColor += vec3(0.6, 0.2, 0.0) * pow(sunGlow, 8.0) * 0.5;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    side: THREE.BackSide
  });
  
  const skybox = new THREE.Mesh(new THREE.BoxGeometry(1000, 1000, 1000), skyboxMaterial);
  
  return cubeRenderTarget.texture;
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
  
  // Add post-processing for cinematic effect
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  
  return renderer;
};

// Generate the game environment - post-apocalyptic village
export const createEnvironment = (scene: THREE.Scene): void => {
  // Ground
  const groundSize = 1000;
  const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 64, 64);
  
  // Create terrain with height variations
  const vertices = groundGeometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    // Skip the center area to keep it relatively flat for gameplay
    const x = vertices[i];
    const z = vertices[i + 2];
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    
    if (distanceFromCenter > 15) {
      // Add some height variation
      vertices[i + 1] = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2;
      
      // Add some random variation
      if (Math.random() > 0.96) {
        vertices[i + 1] += Math.random() * 0.8;
      }
    }
  }
  
  groundGeometry.computeVertexNormals();
  
  // Ground material with texture
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: '#403530',
    roughness: 0.9, 
    metalness: 0.1,
    flatShading: false
  });
  
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Ambient light - dim for horror atmosphere
  const ambientLight = new THREE.AmbientLight('#232323', 0.7);
  scene.add(ambientLight);
  
  // Directional light (moonlight) - bluish tint
  const moonLight = new THREE.DirectionalLight('#A0A0FF', 0.3);
  moonLight.position.set(50, 50, 50);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = 1024;
  moonLight.shadow.mapSize.height = 1024;
  moonLight.shadow.camera.far = 500;
  moonLight.shadow.camera.near = 0.5;
  moonLight.shadow.camera.left = -100;
  moonLight.shadow.camera.right = 100;
  moonLight.shadow.camera.top = 100;
  moonLight.shadow.camera.bottom = -100;
  scene.add(moonLight);
  
  // Add fog light sources for atmosphere
  addAtmosphericLights(scene);
  
  // Add destroyed village buildings
  addDestroyedVillage(scene);
};

// Add atmospheric lights for mood
const addAtmosphericLights = (scene: THREE.Scene): void => {
  // Flickering light sources
  const createFlickeringLight = (position: THREE.Vector3, color: string, intensity: number, distance: number) => {
    const light = new THREE.PointLight(color, intensity, distance);
    light.position.copy(position);
    light.castShadow = true;
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
    
    // Add subtle animation to the light
    const animation = () => {
      light.intensity = intensity * (0.8 + Math.random() * 0.4);
      setTimeout(animation, 100 + Math.random() * 500);
    };
    
    animation();
    scene.add(light);
    return light;
  };
  
  // Add flickering fires/lights around the environment
  createFlickeringLight(new THREE.Vector3(-15, 2, -20), '#FF5500', 1.5, 20);
  createFlickeringLight(new THREE.Vector3(25, 1, 15), '#FF3300', 1.2, 15);
  createFlickeringLight(new THREE.Vector3(-30, 0.5, 10), '#FF4400', 1, 10);
  createFlickeringLight(new THREE.Vector3(10, 1, -25), '#FF6600', 1.3, 18);
};

// Add destroyed buildings and village scenery
const addDestroyedVillage = (scene: THREE.Scene): void => {
  // Materials
  const buildingMaterial = new THREE.MeshStandardMaterial({ 
    color: '#505050',
    roughness: 0.9,
    metalness: 0.1
  });
  
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: '#8B4513', 
    roughness: 0.8,
    metalness: 0.1
  });
  
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: '#654321',
    roughness: 0.7,
    metalness: 0.1
  });
  
  // Create destroyed buildings
  const createDestroyedBuilding = (
    position: THREE.Vector3, 
    width: number, 
    height: number, 
    depth: number, 
    damageLevel: number
  ) => {
    const buildingGroup = new THREE.Group();
    buildingGroup.position.copy(position);
    
    // Main structure
    const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = height / 2;
    building.castShadow = true;
    building.receiveShadow = true;
    
    // Add damage/destruction
    if (damageLevel > 0) {
      // Create holes and damage in the building
      const destructionGeometry = new THREE.SphereGeometry(damageLevel * 2, 8, 8);
      const destructionBSP = new THREE.Mesh(destructionGeometry);
      
      // Multiple damage points
      for (let i = 0; i < damageLevel * 2; i++) {
        destructionBSP.position.set(
          (Math.random() - 0.5) * width * 0.8,
          Math.random() * height * 0.8,
          (Math.random() - 0.5) * depth * 0.8
        );
        
        // This is a conceptual representation, as Three.js doesn't have built-in BSP
        // In a real implementation, we would use a library like ThreeBSP
        // For now, we'll simulate damage by adding additional meshes
      }
    }
    
    buildingGroup.add(building);
    
    // Add a damaged/partial roof if not completely destroyed
    if (damageLevel < 3) {
      const roofGeometry = new THREE.ConeGeometry(
        Math.max(width, depth) * 0.6, 
        height * 0.4, 
        4
      );
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = height + (height * 0.2);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      
      // Add roof damage
      if (damageLevel > 0) {
        // Simulate damage by rotating/offsetting the roof
        roof.rotation.z = (Math.random() - 0.5) * 0.2 * damageLevel;
        roof.position.x += (Math.random() - 0.5) * damageLevel;
      }
      
      buildingGroup.add(roof);
    }
    
    // Add debris around heavily damaged buildings
    if (damageLevel >= 2) {
      for (let i = 0; i < 10 * damageLevel; i++) {
        const debrisSize = 0.2 + Math.random() * 0.8;
        let debrisGeometry;
        
        // Various debris shapes
        switch(Math.floor(Math.random() * 3)) {
          case 0:
            debrisGeometry = new THREE.BoxGeometry(
              debrisSize, debrisSize, debrisSize
            );
            break;
          case 1:
            debrisGeometry = new THREE.ConeGeometry(
              debrisSize/2, debrisSize, 4
            );
            break;
          default:
            debrisGeometry = new THREE.CylinderGeometry(
              debrisSize/2, debrisSize/2, debrisSize, 4
            );
        }
        
        const debrisMaterial = Math.random() > 0.5 ? buildingMaterial : woodMaterial;
        const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
        
        // Position debris around the building
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * width + 1;
        debris.position.set(
          Math.cos(angle) * distance,
          Math.random() * 0.5,
          Math.sin(angle) * distance
        );
        
        // Random rotation for natural look
        debris.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        
        debris.castShadow = true;
        debris.receiveShadow = true;
        buildingGroup.add(debris);
      }
    }
    
    scene.add(buildingGroup);
    return buildingGroup;
  };
  
  // Create a village of destroyed buildings
  createDestroyedBuilding(new THREE.Vector3(-20, 0, -20), 10, 8, 10, 3); // Heavily destroyed
  createDestroyedBuilding(new THREE.Vector3(15, 0, -15), 12, 6, 8, 2);  // Partially destroyed
  createDestroyedBuilding(new THREE.Vector3(-15, 0, 20), 8, 7, 12, 1);  // Lightly damaged
  createDestroyedBuilding(new THREE.Vector3(25, 0, 25), 15, 5, 10, 2.5); // Mostly destroyed
  createDestroyedBuilding(new THREE.Vector3(0, 0, -35), 10, 9, 14, 3.5); // Almost completely ruined
  
  // Add abandoned cars and other props
  addAbandonedVehicles(scene);
  
  // Add scattered vegetation
  addPostApocalypticVegetation(scene);
};

// Add abandoned vehicles
const addAbandonedVehicles = (scene: THREE.Scene): void => {
  // Simplified car mesh
  const createAbandonedCar = (position: THREE.Vector3, rotation: number, damaged: boolean) => {
    const carGroup = new THREE.Group();
    carGroup.position.copy(position);
    carGroup.rotation.y = rotation;
    
    // Car body
    const bodyGeometry = new THREE.BoxGeometry(4, 1.2, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: damaged ? '#5A5A5A' : '#3A3A3A', 
      roughness: 0.9,
      metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    carGroup.add(body);
    
    // Car cabin
    const cabinGeometry = new THREE.BoxGeometry(2, 1, 1.8);
    const cabinMaterial = new THREE.MeshStandardMaterial({ 
      color: damaged ? '#4A4A4A' : '#2A2A2A', 
      roughness: 0.8,
      metalness: 0.3
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(-0.5, 1.7, 0);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    
    // Add damage to the car if specified
    if (damaged) {
      // Tilt/damage the cabin
      cabin.rotation.z = (Math.random() - 0.5) * 0.3;
      cabin.position.y += Math.random() * 0.2;
      
      // Add some "dents" to the body by scaling parts of it
      body.scale.setY(0.8 + Math.random() * 0.4);
      body.scale.setX(0.9 + Math.random() * 0.2);
    }
    
    carGroup.add(cabin);
    
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 8);
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
      color: '#121212', 
      roughness: 1.0,
      metalness: 0.0
    });
    
    const wheelPositions = [
      [1.5, 0.4, -1], // Front left
      [1.5, 0.4, 1],  // Front right
      [-1.5, 0.4, -1], // Back left
      [-1.5, 0.4, 1]   // Back right
    ];
    
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.rotation.z = Math.PI / 2;
      
      // Flat tires for damaged car
      if (damaged && Math.random() > 0.5) {
        wheel.scale.y = 0.5;
        wheel.position.y -= 0.2;
      }
      
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      carGroup.add(wheel);
    });
    
    scene.add(carGroup);
    return carGroup;
  };
  
  // Add a few abandoned cars
  createAbandonedCar(new THREE.Vector3(12, 0, -8), Math.PI / 3, true);
  createAbandonedCar(new THREE.Vector3(-18, 0, 5), -Math.PI / 6, true);
  createAbandonedCar(new THREE.Vector3(5, 0, 22), Math.PI, false);
  createAbandonedCar(new THREE.Vector3(-8, 0, -25), Math.PI / 1.5, true);
};

// Add post-apocalyptic vegetation
const addPostApocalypticVegetation = (scene: THREE.Scene): void => {
  // Create dead trees
  const createDeadTree = (position: THREE.Vector3, height: number) => {
    const treeGroup = new THREE.Group();
    treeGroup.position.copy(position);
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, height, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
      color: '#4D3319', 
      roughness: 1.0,
      metalness: 0.0
    });
    
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = height / 2;
    
    // Bend the tree trunk slightly for more natural look
    trunk.rotation.x = (Math.random() - 0.5) * 0.2;
    trunk.rotation.z = (Math.random() - 0.5) * 0.2;
    
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);
    
    // Add a few branches
    const branchMaterial = new THREE.MeshStandardMaterial({ 
      color: '#3A2613', 
      roughness: 1.0,
      metalness: 0.0
    });
    
    for (let i = 0; i < 4 + Math.floor(Math.random() * 3); i++) {
      const branchHeight = 0.15 + Math.random() * 0.2;
      const branchLength = 1 + Math.random() * 2;
      
      const branchGeometry = new THREE.CylinderGeometry(0.1, 0.15, branchLength, 5);
      const branch = new THREE.Mesh(branchGeometry, branchMaterial);
      
      // Position branch height along trunk
      const heightPosition = Math.random() * 0.6 + 0.2; // 20%-80% up the trunk
      branch.position.y = height * heightPosition;
      
      // Rotate branch outward from trunk
      branch.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      branch.rotation.z = Math.random() * Math.PI * 2;
      
      // Move branch out from center
      branch.position.x = Math.sin(branch.rotation.z) * 0.2;
      branch.position.z = Math.cos(branch.rotation.z) * 0.2;
      
      branch.castShadow = true;
      treeGroup.add(branch);
    }
    
    scene.add(treeGroup);
    return treeGroup;
  };
  
  // Add scattered dead trees
  for (let i = 0; i < 15; i++) {
    const treeHeight = 5 + Math.random() * 5;
    const distance = 20 + Math.random() * 40;
    const angle = Math.random() * Math.PI * 2;
    createDeadTree(
      new THREE.Vector3(
        Math.cos(angle) * distance,
        0,
        Math.sin(angle) * distance
      ),
      treeHeight
    );
  }
  
  // Add some overgrown grass/weeds
  const createOvergrowth = (position: THREE.Vector3, size: number) => {
    const weedGroup = new THREE.Group();
    weedGroup.position.copy(position);
    
    const weedMaterial = new THREE.MeshStandardMaterial({
      color: '#4D5D4D', // Dark green/gray
      roughness: 1.0,
      metalness: 0.0
    });
    
    for (let i = 0; i < 5 + Math.floor(Math.random() * 10); i++) {
      const height = 0.3 + Math.random() * 0.7;
      const width = 0.05 + Math.random() * 0.1;
      
      const weedGeometry = new THREE.PlaneGeometry(width, height);
      const weed = new THREE.Mesh(weedGeometry, weedMaterial);
      
      // Position randomly within the given size
      weed.position.set(
        (Math.random() - 0.5) * size,
        height / 2,
        (Math.random() - 0.5) * size
      );
      
      // Random rotation so weeds face different directions
      weed.rotation.y = Math.random() * Math.PI * 2;
      
      // Slight random tilt
      weed.rotation.x = (Math.random() - 0.5) * 0.2;
      
      weed.castShadow = true;
      weed.receiveShadow = true;
      weedGroup.add(weed);
    }
    
    scene.add(weedGroup);
    return weedGroup;
  };
  
  // Add groups of overgrowth
  for (let i = 0; i < 30; i++) {
    const size = 1 + Math.random() * 2;
    const x = (Math.random() - 0.5) * 80;
    const z = (Math.random() - 0.5) * 80;
    createOvergrowth(new THREE.Vector3(x, 0, z), size);
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

// Create a zombie model - more scary and detailed
export const createZombie = (type: 'walker' | 'runner' | 'tank', position: THREE.Vector3): THREE.Group => {
  const zombie = new THREE.Group();
  
  // Different zombie types have different colors and sizes
  let bodyColor, headColor, scale, health, speed, damage;
  
  switch (type) {
    case 'runner':
      bodyColor = '#283a28'; // darker green tint
      headColor = '#1e291e';
      scale = 0.9;
      health = 50;
      speed = 0.03; // Slower than before
      damage = 10;
      break;
    case 'tank':
      bodyColor = '#301c10'; // darker brown tint
      headColor = '#1e100a';
      scale = 1.3;
      health = 200;
      speed = 0.01; // Slower than before
      damage = 25;
      break;
    default: // walker
      bodyColor = '#3a3a3a'; // darker gray
      headColor = '#2e2e2e';
      scale = 1;
      health = 100;
      speed = 0.015; // Slower than before
      damage = 15;
  }
  
  // Body
  const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1, 8, 12);
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: bodyColor,
    roughness: 1.0,
    metalness: 0.0
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 1;
  body.scale.set(scale, scale, scale);
  zombie.add(body);
  
  // Head - more detailed/scary
  const headGroup = new THREE.Group();
  
  const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({ 
    color: headColor,
    roughness: 1.0,
    metalness: 0.0
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  
  // Deform head slightly to make it more creepy
  const headVertices = headGeometry.attributes.position.array;
  for (let i = 0; i < headVertices.length; i += 3) {
    // Random deformations
    if (Math.random() > 0.8) {
      headVertices[i] *= 1 + (Math.random() - 0.5) * 0.1;
      headVertices[i + 1] *= 1 + (Math.random() - 0.5) * 0.1;
      headVertices[i + 2] *= 1 + (Math.random() - 0.5) * 0.1;
    }
  }
  
  headGeometry.computeVertexNormals();
  headGroup.add(head);
  
  // Eyes - glowing red
  const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: '#ff0000' });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.1, 0.05, 0.25);
  headGroup.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.1, 0.05, 0.25);
  headGroup.add(rightEye);
  
  // Mouth - creepy gaping mouth
  const mouthGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const mouthMaterial = new THREE.MeshBasicMaterial({ color: '#000000' });
  const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
  mouth.position.set(0, -0.1, 0.25);
  mouth.scale.set(1, 0.5, 0.5);
  headGroup.add(mouth);
  
  headGroup.position.set(0, 1.8 * scale, 0);
  headGroup.scale.set(scale, scale, scale);
  zombie.add(headGroup);
  
  // Arms with claw-like hands
  const createZombieArm = (side: number) => {
    const armGroup = new THREE.Group();
    
    // Upper arm
    const upperArmGeometry = new THREE.CapsuleGeometry(0.15, 0.4, 8, 8);
    const armMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
    const upperArm = new THREE.Mesh(upperArmGeometry, armMaterial);
    upperArm.position.y = -0.2;
    armGroup.add(upperArm);
    
    // Lower arm
    const lowerArmGeometry = new THREE.CapsuleGeometry(0.12, 0.4, 8, 8);
    const lowerArm = new THREE.Mesh(lowerArmGeometry, armMaterial);
    lowerArm.position.y = -0.6;
    armGroup.add(lowerArm);
    
    // Hand with claws
    const handGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const hand = new THREE.Mesh(handGeometry, armMaterial);
    hand.position.y = -0.9;
    armGroup.add(hand);
    
    // Add claw fingers
    const fingerMaterial = new THREE.MeshStandardMaterial({ color: '#1a1a1a' });
    for (let i = 0; i < 3; i++) {
      const fingerGeometry = new THREE.ConeGeometry(0.03, 0.15, 4);
      const finger = new THREE.Mesh(fingerGeometry, fingerMaterial);
      const angle = (i - 1) * 0.3;
      finger.position.set(Math.sin(angle) * 0.1, -1, Math.cos(angle) * 0.1);
      finger.rotation.x = -Math.PI / 2;
      finger.rotation.z = angle;
      armGroup.add(finger);
    }
    
    // Position and rotate the arm
    armGroup.position.set(side * 0.6 * scale, 1.3 * scale, 0);
    armGroup.rotation.z = side * Math.PI / 6;
    
    return armGroup;
  };
  
  zombie.add(createZombieArm(-1)); // Left arm
  zombie.add(createZombieArm(1));  // Right arm
  
  // Legs
  const legGeometry = new THREE.CapsuleGeometry(0.2, 0.8, 8, 8);
  const legMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
  
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.3 * scale, 0.4 * scale, 0);
  leftLeg.scale.set(scale, scale, scale);
  zombie.add(leftLeg);
  
  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(0.3 * scale, 0.4 * scale, 0);
  rightLeg.scale.set(scale, scale, scale);
  zombie.add(rightLeg);
  
  // Add subtle animation to make zombie sway
  const animateZombie = () => {
    const time = Date.now() * 0.001;
    
    // Body sway
    zombie.rotation.y = Math.sin(time * 0.5) * 0.05;
    
    // Head movement
    if (headGroup) {
      headGroup.rotation.z = Math.sin(time * 0.8) * 0.1;
      headGroup.rotation.y = Math.sin(time * 0.3) * 0.15;
    }
    
    // Schedule next frame
    requestAnimationFrame(animateZombie);
  };
  
  animateZombie();
  
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

// Zombie movement logic - make them slower and more cinematic
export const updateZombies = (
  zombies: Zombie[], 
  playerPosition: THREE.Vector3, 
  deltaTime: number
): void => {
  zombies.forEach(zombie => {
    if (zombie.isDead) return;
    
    // Calculate distance to player
    const distanceToPlayer = new THREE.Vector3(
      playerPosition.x - zombie.position.x,
      0,
      playerPosition.z - zombie.position.z
    ).length();
    
    // Decrease speed when getting closer to player for more suspense
    let currentSpeed = zombie.speed;
    if (distanceToPlayer < 10) {
      // Slow down as they get closer for more suspense
      currentSpeed = zombie.speed * (0.7 + (distanceToPlayer / 10) * 0.3);
    }
    
    // Make movement slightly jittery/random for horror effect
    const jitter = Math.random() * 0.01 - 0.005;
    
    // Get direction to player
    const direction = new THREE.Vector3(
      playerPosition.x - zombie.position.x + jitter,
      0, // Don't move up/down
      playerPosition.z - zombie.position.z + jitter
    ).normalize();
    
    // Move zombie towards player
    zombie.position.x += direction.x * currentSpeed * deltaTime;
    zombie.position.z += direction.z * currentSpeed * deltaTime;
    
    // Update model position
    if (zombie.model) {
      zombie.model.position.set(
        zombie.position.x,
        zombie.position.y,
        zombie.position.z
      );
      
      // Rotate zombie to face player with slight delay for more natural movement
      zombie.model.lookAt(new THREE.Vector3(
        playerPosition.x,
        zombie.model.position.y,
        playerPosition.z
      ));
      
      // Apply slight swaying motion based on zombie type
      const time = Date.now() * 0.001;
      const swayAmount = zombie.type === 'tank' ? 0.05 : 
                        zombie.type === 'runner' ? 0.15 : 0.1;
      
      // Add swaying motion
      zombie.model.rotation.x = Math.sin(time * 2) * 0.05;
      zombie.model.position.y += Math.sin(time * 3) * 0.005;
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
