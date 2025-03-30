import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import GameHUD from '@/components/game/GameHUD';
import GameMenu from '@/components/game/GameMenu';
import DamageOverlay from '@/components/game/DamageOverlay';
import { 
  createScene, 
  createCamera, 
  createRenderer, 
  createEnvironment,
  createWeapon,
  createZombie,
  updateZombies,
  shootZombie,
  checkZombieCollisions
} from '@/utils/three-utils';
import { GameState, Zombie, ControlKeys, EnvironmentSettings } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const weaponRef = useRef<THREE.Group | null>(null);
  const zombiesRef = useRef<Zombie[]>([]);
  
  const [gameState, setGameState] = useState<GameState>({
    health: 100,
    ammo: 30,
    maxAmmo: 30,
    score: 0,
    wave: 1,
    gameStatus: 'menu',
    kills: 0,
    dayTime: 0.2 // Start at night-time for horror atmosphere
  });
  
  const controlsRef = useRef<ControlKeys>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    reload: false
  });
  
  const playerVelocity = useRef(new THREE.Vector3());
  const playerOnGround = useRef(true);
  const lastTime = useRef(0);
  const showDamage = useRef(false);
  const reloading = useRef(false);
  const waveStartTime = useRef(0);
  const zombiesInWave = useRef(0);
  const zombiesKilled = useRef(0);
  const environmentSettings = useRef<EnvironmentSettings>({
    fogDensity: 0.015,
    fogColor: '#8B0000',
    ambientLightIntensity: 0.7,
    skyColor: '#1a1a1a'
  });
  
  // Initialize game
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Initialize Three.js components
    const scene = createScene();
    const camera = createCamera();
    const renderer = createRenderer();
    
    containerRef.current.appendChild(renderer.domElement);
    
    // Create environment
    createEnvironment(scene);
    
    // Create weapon
    const weapon = createWeapon(scene, camera);
    
    // Store references
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    weaponRef.current = weapon;
    
    // Show intro toast message for atmosphere
    toast({
      title: "Last Survivor",
      description: "You're the only human left. Survive as long as you can...",
      duration: 5000,
    });
    
    // Set up window resize handler
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);
  
  // Game loop
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
    
    let animationFrameId: number;
    
    const animate = (time: number) => {
      if (!lastTime.current) lastTime.current = time;
      const deltaTime = Math.min(time - lastTime.current, 100);
      lastTime.current = time;
      
      // Update day/night cycle if playing
      if (gameState.gameStatus === 'playing') {
        // Very slow day/night cycle - one full cycle every 15 minutes
        const dayTimeIncrement = deltaTime / (15 * 60 * 1000);
        setGameState(prev => ({
          ...prev,
          dayTime: (prev.dayTime + dayTimeIncrement) % 1
        }));
        
        // Update scene based on time of day
        updateEnvironment(gameState.dayTime);
      }
      
      // Update player movement if playing
      if (gameState.gameStatus === 'playing') {
        updatePlayerMovement(deltaTime);
      }
      
      // Update zombie movement if playing
      if (gameState.gameStatus === 'playing' && cameraRef.current && zombiesRef.current.length > 0) {
        updateZombies(
          zombiesRef.current, 
          cameraRef.current.position, 
          deltaTime
        );
        
        // Random zombie sounds for atmosphere
        if (Math.random() > 0.997) {
          const randomIndex = Math.floor(Math.random() * zombiesRef.current.length);
          const zombie = zombiesRef.current[randomIndex];
          
          if (!zombie.isDead) {
            // Calculate distance to player
            const distToPlayer = new THREE.Vector3(
              cameraRef.current.position.x - zombie.position.x,
              0,
              cameraRef.current.position.z - zombie.position.z
            ).length();
            
            // Only play sounds for zombies within hearing range
            if (distToPlayer < 30) {
              // Different sound type based on zombie type
              const soundType = zombie.type === 'runner' ? 'screech' : 
                               zombie.type === 'tank' ? 'roar' : 'moan';
              
              // Volume based on distance
              const volume = Math.max(0.1, 1 - (distToPlayer / 30));
              
              toast({
                description: `You hear a ${soundType} nearby...`,
                duration: 1500,
              });
            }
          }
        }
        
        // Check for zombie collisions
        if (cameraRef.current) {
          const collision = checkZombieCollisions(
            cameraRef.current.position,
            zombiesRef.current
          );
          
          if (collision.collision) {
            handlePlayerDamage(collision.damage || 10);
          }
        }
      }
      
      // Check if wave is complete
      if (
        gameState.gameStatus === 'playing' &&
        zombiesRef.current.length > 0 && 
        zombiesRef.current.every(z => z.isDead) &&
        time - waveStartTime.current > 5000 && // Ensure wave has been active for at least 5 seconds
        zombiesInWave.current === zombiesKilled.current
      ) {
        startNextWave();
      }
      
      // Weapon movement (bob up and down slightly)
      if (weaponRef.current) {
        weaponRef.current.position.y = -0.2 + Math.sin(time * 0.003) * 0.01;
      }
      
      // Render scene
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState.gameStatus, gameState.dayTime]);
  
  // Update environment based on time of day
  const updateEnvironment = (dayTime: number) => {
    if (!sceneRef.current) return;
    
    // Circle from dawn (0) to noon (0.25) to sunset (0.5) to midnight (0.75)
    // Determine time period
    let timeOfDay: 'dawn' | 'day' | 'sunset' | 'night';
    
    if (dayTime < 0.2 || dayTime > 0.8) {
      timeOfDay = 'night';
    } else if (dayTime < 0.3) {
      timeOfDay = 'dawn';
    } else if (dayTime < 0.7) {
      timeOfDay = 'day';
    } else {
      timeOfDay = 'sunset';
    }
    
    // Update fog based on time of day
    if (sceneRef.current.fog instanceof THREE.FogExp2) {
      switch (timeOfDay) {
        case 'dawn':
          sceneRef.current.fog.color.set('#8B4513');
          sceneRef.current.fog.density = 0.02;
          break;
        case 'day':
          sceneRef.current.fog.color.set('#CCCCCC');
          sceneRef.current.fog.density = 0.01;
          break;
        case 'sunset':
          sceneRef.current.fog.color.set('#CC6600');
          sceneRef.current.fog.density = 0.015;
          break;
        case 'night':
          sceneRef.current.fog.color.set('#1a1a1a');
          sceneRef.current.fog.density = 0.025;
          break;
      }
    }
    
    // Update lighting
    sceneRef.current.traverse(object => {
      if (object instanceof THREE.DirectionalLight) {
        // Sun/moon light
        switch (timeOfDay) {
          case 'dawn':
            object.color.set('#FFA07A');
            object.intensity = 0.6;
            break;
          case 'day':
            object.color.set('#FFFFFF');
            object.intensity = 1.0;
            break;
          case 'sunset':
            object.color.set('#FF4500');
            object.intensity = 0.7;
            break;
          case 'night':
            object.color.set('#A0A0FF');
            object.intensity = 0.3;
            break;
        }
      } else if (object instanceof THREE.AmbientLight) {
        // Ambient light
        switch (timeOfDay) {
          case 'dawn':
            object.color.set('#323232');
            object.intensity = 0.6;
            break;
          case 'day':
            object.color.set('#454545');
            object.intensity = 0.8;
            break;
          case 'sunset':
            object.color.set('#302520');
            object.intensity = 0.5;
            break;
          case 'night':
            object.color.set('#151520');
            object.intensity = 0.3;
            break;
        }
      } else if (object instanceof THREE.PointLight) {
        // Fire lights become more visible at night
        if (timeOfDay === 'night' || timeOfDay === 'sunset') {
          object.intensity = 1.8;
          object.distance *= 1.2;
        } else {
          object.intensity = 1.0;
        }
      }
    });
  };
  
  // Input handling
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
          controlsRef.current.forward = true;
          break;
        case 'KeyS':
          controlsRef.current.backward = true;
          break;
        case 'KeyA':
          controlsRef.current.left = true;
          break;
        case 'KeyD':
          controlsRef.current.right = true;
          break;
        case 'Space':
          controlsRef.current.jump = true;
          handleJump();
          break;
        case 'ShiftLeft':
          controlsRef.current.sprint = true;
          break;
        case 'KeyR':
          handleReload();
          break;
        case 'Escape':
          pauseGame();
          break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
          controlsRef.current.forward = false;
          break;
        case 'KeyS':
          controlsRef.current.backward = false;
          break;
        case 'KeyA':
          controlsRef.current.left = false;
          break;
        case 'KeyD':
          controlsRef.current.right = false;
          break;
        case 'Space':
          controlsRef.current.jump = false;
          break;
        case 'ShiftLeft':
          controlsRef.current.sprint = false;
          break;
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (gameState.gameStatus !== 'playing' || !cameraRef.current) return;
      
      const sensitivity = 0.002;
      cameraRef.current.rotation.y -= e.movementX * sensitivity;
      
      // Limit vertical look
      const verticalLook = cameraRef.current.rotation.x - e.movementY * sensitivity;
      cameraRef.current.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, verticalLook));
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      if (gameState.gameStatus !== 'playing') return;
      
      // Left click to shoot
      if (e.button === 0) {
        handleShoot();
      }
    };
    
    const handlePointerLock = () => {
      if (gameState.gameStatus === 'playing' && containerRef.current) {
        containerRef.current.requestPointerLock = 
          containerRef.current.requestPointerLock || 
          (containerRef.current as any).mozRequestPointerLock;
        
        containerRef.current.requestPointerLock();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    containerRef.current?.addEventListener('click', handlePointerLock);
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      containerRef.current?.removeEventListener('click', handlePointerLock);
    };
  }, [gameState.gameStatus]);
  
  // Handle player movement
  const updatePlayerMovement = (deltaTime: number) => {
    if (!cameraRef.current) return;
    
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    
    // Create a direction vector based on camera rotation
    const direction = new THREE.Vector3();
    const rotation = camera.rotation.clone();
    
    // Forward/backward movement
    if (controls.forward || controls.backward) {
      direction.z = controls.forward ? -1 : 1;
    }
    
    // Left/right movement
    if (controls.left || controls.right) {
      direction.x = controls.left ? -1 : 1;
    }
    
    // Normalize direction if moving diagonally
    if (direction.length() > 0) {
      direction.normalize();
    }
    
    // Apply camera rotation to movement direction
    direction.applyEuler(new THREE.Euler(0, rotation.y, 0));
    
    // Apply movement speed
    const speed = controls.sprint ? 0.01 : 0.005;
    direction.multiplyScalar(speed * deltaTime);
    
    // Apply gravity and handle jumping
    if (!playerOnGround.current) {
      playerVelocity.current.y -= 0.0005 * deltaTime; // Gravity
    } else {
      playerVelocity.current.y = Math.max(0, playerVelocity.current.y);
    }
    
    // Update position
    camera.position.x += direction.x;
    camera.position.z += direction.z;
    camera.position.y += playerVelocity.current.y * deltaTime;
    
    // Simple ground collision
    if (camera.position.y < 1.6) {
      camera.position.y = 1.6;
      playerOnGround.current = true;
    }
    
    // Footstep sounds when moving
    if ((controls.forward || controls.backward || controls.left || controls.right) && 
        playerOnGround.current && Math.random() > 0.98) {
      // Footstep sound based on sprint
      const stepType = controls.sprint ? 'running' : 'walking';
      
      // Only show for certain steps to not spam
      if (Math.random() > 0.7) {
        toast({
          description: `*${stepType} sound*`,
          duration: 300,
        });
      }
    }
    
    // Head bob effect for walking
    if (playerOnGround.current && (controls.forward || controls.backward || controls.left || controls.right)) {
      const bobFrequency = controls.sprint ? 12 : 8;
      const bobAmount = controls.sprint ? 0.015 : 0.01;
      camera.position.y += Math.sin(Date.now() / bobFrequency * Math.PI) * bobAmount;
    }
  };
  
  // Handle jumping
  const handleJump = () => {
    if (playerOnGround.current) {
      playerVelocity.current.y = 0.015;
      playerOnGround.current = false;
    }
  };
  
  // Handle shooting
  const handleShoot = () => {
    if (reloading.current) return;
    
    if (gameState.ammo <= 0) {
      // Play empty click sound
      toast({
        description: "Click! Your weapon is empty. Press R to reload.",
        duration: 1500,
      });
      handleReload();
      return;
    }
    
    setGameState(prev => ({
      ...prev,
      ammo: prev.ammo - 1
    }));
    
    // Weapon recoil effect
    if (weaponRef.current) {
      weaponRef.current.position.z += 0.05;
      weaponRef.current.rotation.x -= 0.1;
      
      // Reset position after recoil
      setTimeout(() => {
        if (weaponRef.current) {
          weaponRef.current.position.z = -0.5;
          weaponRef.current.rotation.x = 0;
        }
      }, 100);
    }
    
    // Crosshair expand effect
    const crosshair = document.querySelector('.crosshair-inner');
    if (crosshair) {
      crosshair.classList.add('animate-crosshair-expand');
      setTimeout(() => {
        crosshair.classList.remove('animate-crosshair-expand');
      }, 150);
    }
    
    // Camera shake effect for gunshot
    if (cameraRef.current) {
      const originalRotation = cameraRef.current.rotation.clone();
      
      // Random shake direction
      cameraRef.current.rotation.x += (Math.random() - 0.5) * 0.01;
      cameraRef.current.rotation.y += (Math.random() - 0.5) * 0.01;
      
      // Return to original position
      setTimeout(() => {
        if (cameraRef.current) {
          cameraRef.current.rotation.set(
            originalRotation.x,
            originalRotation.y,
            originalRotation.z
          );
        }
      }, 100);
    }
    
    // Check for hits
    if (cameraRef.current && sceneRef.current) {
      const result = shootZombie(
        cameraRef.current,
        zombiesRef.current,
        sceneRef.current,
        25
      );
      
      if (result.hit && result.zombieId) {
        // Increment score and check for zombie death
        const deadZombie = zombiesRef.current.find(z => z.id === result.zombieId);
        
        if (deadZombie && deadZombie.isDead) {
          // Increment score based on zombie type
          const scoreValue = 
            deadZombie.type === 'walker' ? 100 :
            deadZombie.type === 'runner' ? 150 :
            deadZombie.type === 'tank' ? 300 : 100;
          
          setGameState(prev => ({
            ...prev,
            score: prev.score + scoreValue,
            kills: prev.kills + 1
          }));
          
          zombiesKilled.current++;
          
          // Play zombie death sound
          toast({
            description: "Zombie killed!",
            duration: 800,
          });
        } else if (result.hit) {
          // Hit but not killed sound
          toast({
            description: "Zombie hit!",
            duration: 500,
          });
        }
      }
    }
  };
  
  // Handle reloading
  const handleReload = () => {
    if (reloading.current || gameState.ammo === gameState.maxAmmo) return;
    
    reloading.current = true;
    
    // Reload animation
    if (weaponRef.current) {
      weaponRef.current.rotation.x = 0.5;
    }
    
    // Reload sound
    toast({
      description: "Reloading...",
      duration: 2000,
    });
    
    // Reload timer
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        ammo: prev.maxAmmo
      }));
      
      if (weaponRef.current) {
        weaponRef.current.rotation.x = 0;
      }
      
      reloading.current = false;
      
      // Reload complete sound
      toast({
        description: "Reload complete!",
        duration: 1000,
      });
    }, 2000);
  };
  
  // Handle player damage
  const handlePlayerDamage = (damage: number) => {
    // Only take damage on interval (to prevent rapid damage)
    if (!showDamage.current) {
      showDamage.current = true;
      
      setGameState(prev => {
        const newHealth = prev.health - damage;
        
        // Check for game over
        if (newHealth <= 0) {
          endGame();
          return {
            ...prev,
            health: 0
          };
        }
        
        return {
          ...prev,
          health: newHealth
        };
      });
      
      // Player grunt/pain sound based on damage
      if (damage > 20) {
        toast({
          description: "You're badly hurt!",
          duration: 1500,
        });
      } else {
        toast({
          description: "You've been hit!",
          duration: 1000,
        });
      }
      
      // Camera shake effect for damage
      if (cameraRef.current) {
        // Use let instead of const since we need to modify this value
        let intensityValue = Math.min(damage / 100, 0.05);
        
        const shakeEffect = () => {
          if (!cameraRef.current) return;
          
          cameraRef.current.rotation.x += (Math.random() - 0.5) * intensityValue;
          cameraRef.current.rotation.y += (Math.random() - 0.5) * intensityValue;
          
          if (intensityValue > 0.01) {
            intensityValue *= 0.9;
            requestAnimationFrame(shakeEffect);
          }
        };
        
        shakeEffect();
      }
      
      // Reset damage status after delay
      setTimeout(() => {
        showDamage.current = false;
      }, 1000);
    }
  };
  
  // Spawn zombies
  const spawnZombies = (count: number) => {
    if (!sceneRef.current || !cameraRef.current) return;
    
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const newZombies: Zombie[] = [];
    
    for (let i = 0; i < count; i++) {
      // Determine zombie type based on wave and randomness
      let zombieType: 'walker' | 'runner' | 'tank';
      const rand = Math.random();
      
      if (gameState.wave >= 5 && rand < 0.2) {
        zombieType = 'tank';
      } else if (gameState.wave >= 3 && rand < 0.4) {
        zombieType = 'runner';
      } else {
        zombieType = 'walker';
      }
      
      // Random spawn position (at a distance from player)
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 20; // Spawn 30-50 units away
      
      const position = new THREE.Vector3(
        camera.position.x + Math.cos(angle) * distance,
        0,
        camera.position.z + Math.sin(angle) * distance
      );
      
      // Create zombie model
      const zombieModel = createZombie(zombieType, position);
      scene.add(zombieModel);
      
      // Determine zombie stats based on type
      let health, speed, damage;
      
      switch (zombieType) {
        case 'runner':
          health = 50;
          speed = 0.03;
          damage = 10;
          break;
        case 'tank':
          health = 200;
          speed = 0.01;
          damage = 25;
          break;
        default: // walker
          health = 100;
          speed = 0.015;
          damage = 15;
      }
      
      // Add wave-based difficulty scaling
      speed += 0.001 * (gameState.wave - 1);
      health += 10 * (gameState.wave - 1);
      
      // Create zombie object
      const zombie: Zombie = {
        id: uuidv4(),
        type: zombieType,
        position: { x: position.x, y: position.y, z: position.z },
        health,
        speed,
        damage,
        model: zombieModel,
        isDead: false,
        lastMoveTime: Date.now(),
        screamChance: Math.random() * 0.01
      };
      
      newZombies.push(zombie);
    }
    
    zombiesRef.current = [...zombiesRef.current, ...newZombies];
    zombiesInWave.current += count;
  };
  
  // Start the game
  const startGame = () => {
    setGameState({
      health: 100,
      ammo: 30,
      maxAmmo: 30,
      score: 0,
      wave: 1,
      gameStatus: 'playing',
      kills: 0,
      dayTime: 0.2 // Start at night-time
    });
    
    zombiesRef.current = [];
    zombiesInWave.current = 0;
    zombiesKilled.current = 0;
    waveStartTime.current = performance.now();
    
    // Spawn initial zombies
    spawnZombies(5);
    
    // Request pointer lock
    if (containerRef.current) {
      containerRef.current.requestPointerLock = 
        containerRef.current.requestPointerLock || 
        (containerRef.current as any).mozRequestPointerLock;
      
      containerRef.current.requestPointerLock();
    }
    
    // Show wave notification
    toast({
      title: "Wave 1",
      description: "They're coming for you...",
      duration: 3000,
    });
  };
  
  // Start the next wave
  const startNextWave = () => {
    const nextWave = gameState.wave + 1;
    
    setGameState(prev => ({
      ...prev,
      wave: nextWave,
      health: Math.min(prev.health + 20, 100), // Heal a bit between waves
      ammo: prev.maxAmmo // Refill ammo
    }));
    
    zombiesRef.current = zombiesRef.current.filter(z => !z.isDead);
    zombiesInWave.current = 0;
    zombiesKilled.current = 0;
    waveStartTime.current = performance.now();
    
    // Spawn zombies for the new wave
    const baseCount = 5;
    const waveScaling = nextWave * 2;
    const zombieCount = baseCount + waveScaling;
    
    spawnZombies(zombieCount);
    
    // Show wave notification
    toast({
      title: `Wave ${nextWave}`,
      description: `${zombieCount} zombies approaching! They're getting stronger...`,
      duration: 3000,
    });
  };
  
  // Pause the game
  const pauseGame = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'paused'
    }));
    
    // Release pointer lock
    document.exitPointerLock = 
      document.exitPointerLock || 
      (document as any).mozExitPointerLock;
    
    document.exitPointerLock();
  };
  
  // Resume the game
  const resumeGame = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'playing'
    }));
    
    // Request pointer lock
    if (containerRef.current) {
      containerRef.current.requestPointerLock = 
        containerRef.current.requestPointerLock || 
        (containerRef.current as any).mozRequestPointerLock;
      
      containerRef.current.requestPointerLock();
    }
  };
  
  // End the game
  const endGame = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: 'gameover'
    }));
    
    // Release pointer lock
    document.exitPointerLock = 
      document.exitPointerLock || 
      (document as any).mozExitPointerLock;
    
    document.exitPointerLock();
    
    // Death notification
    toast({
      title: "You've died",
      description: `You survived ${gameState.wave} waves and killed ${gameState.kills} zombies.`,
      duration: 5000,
    });
  };
  
  return (
    <div className="h-screen w-screen overflow-hidden" ref={containerRef}>
      {/* Game UI components */}
      {gameState.gameStatus === 'playing' && (
        <GameHUD gameState={gameState} />
      )}
      
      {gameState.gameStatus !== 'playing' && (
        <GameMenu 
          status={gameState.gameStatus}
          onStart={startGame}
          onResume={resumeGame}
          onRestart={startGame}
          score={gameState.score}
          wave={gameState.wave}
        />
      )}
      
      <DamageOverlay showDamage={showDamage.current} health={gameState.health} />
    </div>
  );
};

export default Index;
