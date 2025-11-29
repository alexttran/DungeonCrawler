import { useEffect, useRef, useState } from 'react';
import './App.css';

// Game constants
const TILE_SIZE = 16;
const GRID_WIDTH = 100;
const GRID_HEIGHT = 100;
const BASE_VISION_RADIUS = 8;
const BASE_PLAYER_SPEED = 8;
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;
const MINIMAP_SIZE = 200;
const MIN_DISTANCE_START_GOAL = 50;

// Tile types
const TILE = {
  WALL: 0,
  FLOOR: 1,
  GOAL: 2
};

// Enemy types with different behaviors
const ENEMY_TYPES = {
  WANDERER: {
    name: 'Wanderer',
    color: '#95a5a6',
    speed: 2,
    radius: 0.25,
    behavior: 'random',
    description: 'Slow, moves randomly'
  },
  PATROLLER: {
    name: 'Patroller',
    color: '#e74c3c',
    speed: 3,
    radius: 0.3,
    behavior: 'patrol',
    description: 'Normal speed, follows patterns'
  },
  CHASER: {
    name: 'Chaser',
    color: '#e67e22',
    speed: 6,
    radius: 0.28,
    behavior: 'chase',
    chaseRange: 12,
    description: 'Fast, chases player when nearby'
  },
  TANK: {
    name: 'Tank',
    color: '#34495e',
    speed: 1.5,
    radius: 0.45,
    behavior: 'patrol',
    description: 'Slow, large, blocks paths'
  },
  DASHER: {
    name: 'Dasher',
    color: '#9b59b6',
    speed: 10,
    radius: 0.25,
    behavior: 'dash',
    description: 'Super fast in straight lines'
  }
};

// Power-up types
const POWERUP_TYPES = {
  SPEED: {
    name: 'Speed Boost',
    color: '#3498db',
    duration: 5000,
    effect: 'speed',
    multiplier: 1.5,
    icon: '⚡'
  },
  INVINCIBILITY: {
    name: 'Invincibility',
    color: '#f1c40f',
    duration: 3000,
    effect: 'invincible',
    icon: '★'
  },
  VISION: {
    name: 'Enhanced Vision',
    color: '#1abc9c',
    duration: 8000,
    effect: 'vision',
    multiplier: 1.75,
    icon: '👁'
  },
  GHOST: {
    name: 'Ghost Mode',
    color: '#ecf0f1',
    duration: 4000,
    effect: 'ghost',
    icon: '👻'
  }
};

function App() {
  const canvasRef = useRef(null);
  const minimapRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  const animationRef = useRef(null);

  const [level, setLevel] = useState(1);
  const [deaths, setDeaths] = useState(0);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [keysCollected, setKeysCollected] = useState(0);
  const [keysRequired, setKeysRequired] = useState(0);
  const [activePowerups, setActivePowerups] = useState([]);
  const transitionStateRef = useRef(null); // null, 'blackout', 'reveal'
  const transitionProgressRef = useRef(0);
  const nextLevelRef = useRef(1);
  const currentLevelRef = useRef(1);
  const levelStartStatsRef = useRef({ score: 0, coins: 0, keys: 0 });

  // Generate dungeon with rooms and corridors
  const generateDungeon = (levelNum) => {
    const grid = Array(GRID_HEIGHT).fill(null).map(() =>
      Array(GRID_WIDTH).fill(TILE.WALL)
    );

    const rooms = [];
    const numRooms = 8 + Math.floor(Math.random() * 5);

    // Create rooms with more variation
    for (let i = 0; i < numRooms; i++) {
      // Varied room sizes: small (4-8), medium (8-14), large (14-20)
      const sizeType = Math.random();
      let roomWidth, roomHeight;

      if (sizeType < 0.5) {
        // Small rooms (50%)
        roomWidth = 4 + Math.floor(Math.random() * 5);
        roomHeight = 4 + Math.floor(Math.random() * 5);
      } else if (sizeType < 0.85) {
        // Medium rooms (35%)
        roomWidth = 8 + Math.floor(Math.random() * 7);
        roomHeight = 8 + Math.floor(Math.random() * 7);
      } else {
        // Large rooms (15%)
        roomWidth = 14 + Math.floor(Math.random() * 7);
        roomHeight = 14 + Math.floor(Math.random() * 7);
      }

      const roomX = 3 + Math.floor(Math.random() * (GRID_WIDTH - roomWidth - 6));
      const roomY = 3 + Math.floor(Math.random() * (GRID_HEIGHT - roomHeight - 6));

      // Carve out room
      for (let y = roomY; y < roomY + roomHeight; y++) {
        for (let x = roomX; x < roomX + roomWidth; x++) {
          if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
            grid[y][x] = TILE.FLOOR;
          }
        }
      }

      rooms.push({
        x: roomX + Math.floor(roomWidth / 2),
        y: roomY + Math.floor(roomHeight / 2),
        width: roomWidth,
        height: roomHeight,
        roomX,
        roomY
      });
    }

    // Connect rooms with corridors of varying widths
    for (let i = 0; i < rooms.length - 1; i++) {
      const roomA = rooms[i];
      const roomB = rooms[i + 1];

      let x = roomA.x;
      let y = roomA.y;

      // Random corridor width: 1-4 tiles
      const corridorWidth = 1 + Math.floor(Math.random() * 4);

      // Horizontal corridor
      while (x !== roomB.x) {
        if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
          // Carve corridor with variable width
          for (let w = 0; w < corridorWidth; w++) {
            if (y + w < GRID_HEIGHT) grid[y + w][x] = TILE.FLOOR;
            if (w > 0 && y - w >= 0) grid[y - w][x] = TILE.FLOOR;
          }
        }
        x += x < roomB.x ? 1 : -1;
      }

      // Vertical corridor (possibly different width)
      const corridorWidth2 = 1 + Math.floor(Math.random() * 4);
      while (y !== roomB.y) {
        if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
          // Carve corridor with variable width
          for (let w = 0; w < corridorWidth2; w++) {
            if (x + w < GRID_WIDTH) grid[y][x + w] = TILE.FLOOR;
            if (w > 0 && x - w >= 0) grid[y][x - w] = TILE.FLOOR;
          }
        }
        y += y < roomB.y ? 1 : -1;
      }
    }

    // Find two rooms with minimum distance
    let startRoom, goalRoom;
    let maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const idx1 = Math.floor(Math.random() * rooms.length);
      const idx2 = Math.floor(Math.random() * rooms.length);

      if (idx1 !== idx2) {
        const room1 = rooms[idx1];
        const room2 = rooms[idx2];
        const dist = Math.sqrt((room1.x - room2.x) ** 2 + (room1.y - room2.y) ** 2);

        if (dist >= MIN_DISTANCE_START_GOAL) {
          startRoom = room1;
          goalRoom = room2;
          break;
        }
      }
      attempts++;
    }

    // Fallback: use first and last room if no valid pair found
    if (!startRoom || !goalRoom) {
      startRoom = rooms[0];
      goalRoom = rooms[rooms.length - 1];
    }

    // Place goal
    grid[goalRoom.y][goalRoom.x] = TILE.GOAL;

    return { grid, rooms, startRoom, goalRoom };
  };

  // Generate patrol pattern for enemies
  const generatePatrolPattern = () => {
    const patternType = Math.floor(Math.random() * 3);
    const length = 5 + Math.floor(Math.random() * 10);
    const pattern = [];

    if (patternType === 0) {
      // Horizontal patrol
      for (let j = 0; j < length; j++) pattern.push({ dx: 1, dy: 0 });
      for (let j = 0; j < length; j++) pattern.push({ dx: -1, dy: 0 });
    } else if (patternType === 1) {
      // Vertical patrol
      for (let j = 0; j < length; j++) pattern.push({ dx: 0, dy: 1 });
      for (let j = 0; j < length; j++) pattern.push({ dx: 0, dy: -1 });
    } else {
      // Square/circular patrol
      const size = 4 + Math.floor(Math.random() * 6);
      for (let j = 0; j < size; j++) pattern.push({ dx: 1, dy: 0 });
      for (let j = 0; j < size; j++) pattern.push({ dx: 0, dy: 1 });
      for (let j = 0; j < size; j++) pattern.push({ dx: -1, dy: 0 });
      for (let j = 0; j < size; j++) pattern.push({ dx: 0, dy: -1 });
    }

    return pattern;
  };

  // Spawn powerups in rooms
  const spawnPowerups = (rooms, startRoom, goalRoom) => {
    const powerups = [];
    const numPowerups = 3 + Math.floor(Math.random() * 4);

    for (let i = 0; i < numPowerups; i++) {
      // Pick random room (not start or goal)
      let room;
      let attempts = 0;
      do {
        room = rooms[Math.floor(Math.random() * rooms.length)];
        attempts++;
      } while ((room === startRoom || room === goalRoom) && attempts < 20);

      // Pick random powerup type
      const typeKeys = Object.keys(POWERUP_TYPES);
      const typeKey = typeKeys[Math.floor(Math.random() * typeKeys.length)];
      const type = POWERUP_TYPES[typeKey];

      // Random position in room
      const offsetX = Math.random() * (room.width - 2) - (room.width / 2 - 1);
      const offsetY = Math.random() * (room.height - 2) - (room.height / 2 - 1);

      powerups.push({
        x: room.x + offsetX,
        y: room.y + offsetY,
        type: typeKey,
        typeData: type,
        radius: 0.3,
        collected: false,
        pulse: 0
      });
    }

    return powerups;
  };

  // Spawn coins in rooms and corridors
  const spawnCoins = (rooms, startRoom, goalRoom, levelNum) => {
    const coins = [];
    // More coins on higher levels (8-20 coins)
    const numCoins = 8 + Math.floor(Math.random() * 13) + Math.floor(levelNum * 1.5);

    for (let i = 0; i < numCoins; i++) {
      // Pick random room
      let room;
      let attempts = 0;
      do {
        room = rooms[Math.floor(Math.random() * rooms.length)];
        attempts++;
      } while ((room === startRoom || room === goalRoom) && attempts < 20);

      // Random position in room
      const offsetX = Math.random() * (room.width - 2) - (room.width / 2 - 1);
      const offsetY = Math.random() * (room.height - 2) - (room.height / 2 - 1);

      coins.push({
        x: room.x + offsetX,
        y: room.y + offsetY,
        radius: 0.25,
        collected: false,
        rotation: Math.random() * Math.PI * 2,
        value: 10
      });
    }

    return coins;
  };

  // Spawn keys on harder levels
  const spawnKeys = (rooms, startRoom, goalRoom, levelNum) => {
    const keys = [];

    // Keys required based on level
    let numKeys = 0;
    if (levelNum >= 3 && levelNum < 5) numKeys = 1;
    else if (levelNum >= 5 && levelNum < 8) numKeys = 2;
    else if (levelNum >= 8) numKeys = 3;

    if (numKeys === 0) return keys;

    // Spawn keys in different rooms
    const usedRooms = new Set([startRoom, goalRoom]);

    for (let i = 0; i < numKeys && i < rooms.length - 2; i++) {
      // Find room not yet used
      let room;
      let attempts = 0;
      do {
        room = rooms[Math.floor(Math.random() * rooms.length)];
        attempts++;
      } while (usedRooms.has(room) && attempts < 50);

      if (!usedRooms.has(room)) {
        usedRooms.add(room);

        // Random position in room
        const offsetX = Math.random() * (room.width - 2) - (room.width / 2 - 1);
        const offsetY = Math.random() * (room.height - 2) - (room.height / 2 - 1);

        keys.push({
          x: room.x + offsetX,
          y: room.y + offsetY,
          radius: 0.35,
          collected: false,
          pulse: Math.random() * Math.PI * 2
        });
      }
    }

    return keys;
  };

  // Initialize level
  const initLevel = (levelNum) => {
    const { grid, rooms, startRoom, goalRoom } = generateDungeon(levelNum);

    const player = {
      x: startRoom.x + 0.5,
      y: startRoom.y + 0.5,
      startX: startRoom.x + 0.5,
      startY: startRoom.y + 0.5,
      radius: 0.3,
      invincible: false,
      ghost: false
    };

    const goal = {
      x: goalRoom.x + 0.5,
      y: goalRoom.y + 0.5,
      radius: 0.4
    };

    // Generate enemies with different types
    const enemies = [];
    const numEnemies = Math.min(5 + levelNum * 2, 30);
    const typeKeys = Object.keys(ENEMY_TYPES);
    const SAFE_ZONE_RADIUS = 10; // Enemies can't spawn within this radius of player start

    let spawnAttempts = 0;
    const maxSpawnAttempts = numEnemies * 10;

    while (enemies.length < numEnemies && spawnAttempts < maxSpawnAttempts) {
      spawnAttempts++;

      // Pick random room (avoid start and goal rooms when possible)
      let roomIndex;
      if (rooms.length > 3) {
        roomIndex = 1 + Math.floor(Math.random() * Math.max(1, rooms.length - 2));
      } else {
        roomIndex = Math.floor(Math.random() * rooms.length);
      }
      const room = rooms[roomIndex];

      // Check if room is too close to player start
      const distToStart = Math.sqrt(
        (room.x - player.startX) ** 2 + (room.y - player.startY) ** 2
      );

      // Skip this spawn if too close to player start
      if (distToStart < SAFE_ZONE_RADIUS) {
        continue;
      }

      // Choose enemy type based on level with progressive difficulty
      let typeKey;
      if (levelNum === 1) {
        // Level 1: only wanderers and patrollers
        typeKey = Math.random() < 0.6 ? 'WANDERER' : 'PATROLLER';
      } else if (levelNum === 2) {
        // Level 2: introduce chasers gradually
        const chance = Math.random();
        if (chance < 0.4) typeKey = 'WANDERER';
        else if (chance < 0.8) typeKey = 'PATROLLER';
        else typeKey = 'CHASER';
      } else if (levelNum === 3) {
        // Level 3: more chasers, introduce tanks
        const chance = Math.random();
        if (chance < 0.2) typeKey = 'WANDERER';
        else if (chance < 0.5) typeKey = 'PATROLLER';
        else if (chance < 0.85) typeKey = 'CHASER';
        else typeKey = 'TANK';
      } else if (levelNum === 4) {
        // Level 4: all types except dasher
        const chance = Math.random();
        if (chance < 0.15) typeKey = 'WANDERER';
        else if (chance < 0.4) typeKey = 'PATROLLER';
        else if (chance < 0.7) typeKey = 'CHASER';
        else typeKey = 'TANK';
      } else if (levelNum < 8) {
        // Levels 5-7: all types with balanced distribution
        const chance = Math.random();
        if (chance < 0.15) typeKey = 'WANDERER';
        else if (chance < 0.35) typeKey = 'PATROLLER';
        else if (chance < 0.6) typeKey = 'CHASER';
        else if (chance < 0.8) typeKey = 'TANK';
        else typeKey = 'DASHER';
      } else {
        // Level 8+: harder enemy distribution
        const chance = Math.random();
        if (chance < 0.1) typeKey = 'WANDERER';
        else if (chance < 0.25) typeKey = 'PATROLLER';
        else if (chance < 0.5) typeKey = 'CHASER';
        else if (chance < 0.7) typeKey = 'TANK';
        else typeKey = 'DASHER';
      }

      const enemyType = ENEMY_TYPES[typeKey];
      const pattern = generatePatrolPattern();

      // Scale enemy speed with level (up to 1.5x at level 10+)
      const speedMultiplier = Math.min(1 + (levelNum - 1) * 0.05, 1.5);

      // Scale chase range for chasers (12 base, +1 per level, max 20)
      const chaseRange = typeKey === 'CHASER'
        ? Math.min(12 + (levelNum - 1), 20)
        : enemyType.chaseRange;

      enemies.push({
        x: room.x + 0.5,
        y: room.y + 0.5,
        baseX: room.x + 0.5,
        baseY: room.y + 0.5,
        type: typeKey,
        typeData: {
          ...enemyType,
          speed: enemyType.speed * speedMultiplier,
          chaseRange: chaseRange
        },
        pattern: pattern,
        patternIndex: Math.floor(Math.random() * pattern.length),
        radius: enemyType.radius,
        speed: enemyType.speed * speedMultiplier,
        dashTimer: 0,
        dashDir: { x: 0, y: 0 },
        randomMoveTimer: 0
      });
    }

    const powerups = spawnPowerups(rooms, startRoom, goalRoom);
    const coinsArray = spawnCoins(rooms, startRoom, goalRoom, levelNum);
    const keysArray = spawnKeys(rooms, startRoom, goalRoom, levelNum);

    const explored = Array(GRID_HEIGHT).fill(null).map(() =>
      Array(GRID_WIDTH).fill(false)
    );

    const particles = [];

    gameRef.current = {
      grid,
      player,
      goal,
      enemies,
      powerups,
      coins: coinsArray,
      keys: keysArray,
      explored,
      particles,
      activePowerups: [],
      cameraX: 0,
      cameraY: 0
    };

    setActivePowerups([]);
    setKeysCollected(0);
    setKeysRequired(keysArray.length);
    updateExploration();
  };

  // Reset level when player dies
  const resetLevel = () => {
    if (!gameRef.current) return;

    const { player, powerups, coins: coinsArray, keys: keysArray } = gameRef.current;

    // Reset player position
    player.x = player.startX;
    player.y = player.startY;
    player.invincible = false;
    player.ghost = false;

    // Reset all collectibles to uncollected
    for (const coin of coinsArray) {
      coin.collected = false;
    }
    for (const key of keysArray) {
      key.collected = false;
    }
    for (const powerup of powerups) {
      powerup.collected = false;
    }

    // Revert score and coins to level start values
    setScore(levelStartStatsRef.current.score);
    setCoins(levelStartStatsRef.current.coins);
    setKeysCollected(0);
    setActivePowerups([]);
    setDeaths(d => d + 1);

    // Reset exploration
    const explored = gameRef.current.explored;
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        explored[y][x] = false;
      }
    }
    updateExploration();
  };

  // Create particle effect
  const createParticles = (x, y, color, count = 10) => {
    if (!gameRef.current) return;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;

      gameRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: 0.1 + Math.random() * 0.2
      });
    }
  };

  // Update exploration
  const updateExploration = () => {
    if (!gameRef.current) return;

    const { player, explored } = gameRef.current;
    const currentPowerups = gameRef.current.activePowerups || [];
    const visionBonus = currentPowerups.find(p => p.effect === 'vision')?.multiplier || 1;
    const visionRadius = BASE_VISION_RADIUS * visionBonus;

    const px = Math.floor(player.x);
    const py = Math.floor(player.y);

    for (let y = py - visionRadius; y <= py + visionRadius; y++) {
      for (let x = px - visionRadius; x <= px + visionRadius; x++) {
        if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
          const dist = Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2);
          if (dist <= visionRadius) {
            explored[y][x] = true;
          }
        }
      }
    }
  };

  // Check collision with walls
  const checkWallCollision = (x, y, radius) => {
    const left = Math.floor(x - radius);
    const right = Math.floor(x + radius);
    const top = Math.floor(y - radius);
    const bottom = Math.floor(y + radius);

    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        if (tx >= 0 && tx < GRID_WIDTH && ty >= 0 && ty < GRID_HEIGHT) {
          if (gameRef.current.grid[ty][tx] === TILE.WALL) {
            const closestX = Math.max(tx, Math.min(x, tx + 1));
            const closestY = Math.max(ty, Math.min(y, ty + 1));
            const dist = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);
            if (dist < radius) return true;
          }
        }
      }
    }
    return false;
  };

  // Check collision between two circles
  const checkCircleCollision = (x1, y1, r1, x2, y2, r2) => {
    const dist = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    return dist < r1 + r2;
  };

  // Find nearest free floor space from a position
  const findNearestFreeSpace = (startX, startY) => {
    if (!gameRef.current) return { x: startX, y: startY };

    const { grid } = gameRef.current;
    const playerRadius = gameRef.current.player.radius;

    // Check if current position is already free
    if (!checkWallCollision(startX, startY, playerRadius)) {
      return { x: startX, y: startY };
    }

    // Search outward in expanding circles
    for (let radius = 1; radius <= 20; radius++) {
      for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
        const testX = startX + Math.cos(angle) * radius;
        const testY = startY + Math.sin(angle) * radius;

        // Check bounds
        if (testX < playerRadius || testX >= GRID_WIDTH - playerRadius ||
            testY < playerRadius || testY >= GRID_HEIGHT - playerRadius) {
          continue;
        }

        // Check if this position is free
        const gridX = Math.floor(testX);
        const gridY = Math.floor(testY);

        if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT &&
            grid[gridY][gridX] === TILE.FLOOR &&
            !checkWallCollision(testX, testY, playerRadius)) {
          return { x: testX, y: testY };
        }
      }
    }

    // Fallback to start position if no free space found
    return { x: gameRef.current.player.startX, y: gameRef.current.player.startY };
  };

  // Add powerup effect
  const addPowerup = (typeKey, typeData) => {
    setActivePowerups(prev => {
      // Remove existing powerup of same type
      const filtered = prev.filter(p => p.effect !== typeData.effect);
      return [...filtered, {
        effect: typeData.effect,
        name: typeData.name,
        endTime: Date.now() + typeData.duration,
        multiplier: typeData.multiplier
      }];
    });

    // Apply immediate effect
    if (typeData.effect === 'invincible') {
      gameRef.current.player.invincible = true;
      setTimeout(() => {
        if (gameRef.current?.player) {
          gameRef.current.player.invincible = false;
        }
      }, typeData.duration);
    } else if (typeData.effect === 'ghost') {
      gameRef.current.player.ghost = true;
      setTimeout(() => {
        if (gameRef.current?.player) {
          const player = gameRef.current.player;
          player.ghost = false;

          // Check if player is stuck in a wall after ghost mode ends
          if (checkWallCollision(player.x, player.y, player.radius)) {
            const freeSpace = findNearestFreeSpace(player.x, player.y);
            player.x = freeSpace.x;
            player.y = freeSpace.y;
            createParticles(player.x, player.y, '#ecf0f1', 15);
          }
        }
      }, typeData.duration);
    }
  };

  // Update game logic
  const update = (deltaTime) => {
    if (!gameRef.current) return;

    // Handle level transition animations
    if (transitionStateRef.current === 'blackout') {
      transitionProgressRef.current += deltaTime * 2; // 0.5 seconds for blackout
      if (transitionProgressRef.current >= 1) {
        // Blackout complete, init new level
        currentLevelRef.current = nextLevelRef.current;
        setLevel(nextLevelRef.current);
        initLevel(nextLevelRef.current);
        transitionProgressRef.current = 0;
        transitionStateRef.current = 'reveal';
      }
      return; // Don't update game during transition
    }

    if (transitionStateRef.current === 'reveal') {
      transitionProgressRef.current += deltaTime * 2; // 0.5 seconds for reveal
      if (transitionProgressRef.current >= 1) {
        // Reveal complete
        transitionStateRef.current = null;
        transitionProgressRef.current = 0;
      }
      return; // Don't update game during transition
    }

    const { player, goal, enemies, powerups, particles } = gameRef.current;
    const keys = keysRef.current;

    // Update active powerups
    setActivePowerups(prev => prev.filter(p => p.endTime > Date.now()));

    // Update player movement
    let dx = 0;
    let dy = 0;

    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const mag = Math.sqrt(dx * dx + dy * dy);
      dx /= mag;
      dy /= mag;
    }

    // Apply speed powerup
    const currentPowerups = gameRef.current.activePowerups || [];
    const speedBonus = currentPowerups.find(p => p.effect === 'speed')?.multiplier || 1;
    const speed = BASE_PLAYER_SPEED * speedBonus * deltaTime;
    const newX = player.x + dx * speed;
    const newY = player.y + dy * speed;

    // Check collision (unless ghost mode)
    if (player.ghost) {
      player.x = newX;
      player.y = newY;
    } else {
      if (!checkWallCollision(newX, player.y, player.radius)) {
        player.x = newX;
      }
      if (!checkWallCollision(player.x, newY, player.radius)) {
        player.y = newY;
      }
    }

    // Clamp to bounds
    player.x = Math.max(player.radius, Math.min(GRID_WIDTH - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(GRID_HEIGHT - player.radius, player.y));

    // Update exploration
    updateExploration();

    // Check coin collection
    const coinsArray = gameRef.current.coins;
    for (const coin of coinsArray) {
      if (!coin.collected && checkCircleCollision(
        player.x, player.y, player.radius,
        coin.x, coin.y, coin.radius
      )) {
        coin.collected = true;
        setCoins(c => c + coin.value);
        setScore(s => s + 50);
        createParticles(coin.x, coin.y, '#ffd700', 8);
      }
      coin.rotation += deltaTime * 2;
    }

    // Check key collection
    const keysArray = gameRef.current.keys;
    for (const key of keysArray) {
      if (!key.collected && checkCircleCollision(
        player.x, player.y, player.radius,
        key.x, key.y, key.radius
      )) {
        key.collected = true;
        setKeysCollected(k => k + 1);
        setScore(s => s + 500);
        createParticles(key.x, key.y, '#00ffff', 20);
      }
      key.pulse += deltaTime * 2;
    }

    // Check powerup collection
    for (const powerup of powerups) {
      if (!powerup.collected && checkCircleCollision(
        player.x, player.y, player.radius,
        powerup.x, powerup.y, powerup.radius
      )) {
        powerup.collected = true;
        addPowerup(powerup.type, powerup.typeData);
        createParticles(powerup.x, powerup.y, powerup.typeData.color, 15);
        setScore(s => s + 100);
      }
      powerup.pulse += deltaTime * 3;
    }

    // Check goal collision (only if all keys collected and not transitioning)
    const allKeysCollected = keysCollected >= keysRequired;
    if (!transitionStateRef.current && allKeysCollected && checkCircleCollision(player.x, player.y, player.radius, goal.x, goal.y, goal.radius)) {
      nextLevelRef.current = currentLevelRef.current + 1;
      setScore(s => s + 1000);
      createParticles(goal.x, goal.y, '#ffd700', 30);
      transitionProgressRef.current = 0;
      transitionStateRef.current = 'blackout';
      return;
    }

    // Update enemies
    for (const enemy of enemies) {
      const behavior = enemy.typeData.behavior;

      if (behavior === 'random') {
        // Wanderer: random movement
        enemy.randomMoveTimer -= deltaTime;
        if (enemy.randomMoveTimer <= 0) {
          enemy.randomMoveTimer = 1 + Math.random();
          const angle = Math.random() * Math.PI * 2;
          enemy.targetDir = { x: Math.cos(angle), y: Math.sin(angle) };
        }

        if (enemy.targetDir) {
          const moveX = enemy.targetDir.x * enemy.speed * deltaTime;
          const moveY = enemy.targetDir.y * enemy.speed * deltaTime;

          const nextX = enemy.x + moveX;
          const nextY = enemy.y + moveY;

          if (!checkWallCollision(nextX, enemy.y, enemy.radius)) {
            enemy.x = nextX;
          } else {
            enemy.randomMoveTimer = 0; // Choose new direction
          }

          if (!checkWallCollision(enemy.x, nextY, enemy.radius)) {
            enemy.y = nextY;
          } else {
            enemy.randomMoveTimer = 0;
          }
        }

      } else if (behavior === 'chase') {
        // Chaser: follow player when in range
        const distToPlayer = Math.sqrt(
          (player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2
        );

        if (distToPlayer < enemy.typeData.chaseRange) {
          const dx = player.x - enemy.x;
          const dy = player.y - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 0) {
            const moveX = (dx / dist) * enemy.speed * deltaTime;
            const moveY = (dy / dist) * enemy.speed * deltaTime;

            const nextX = enemy.x + moveX;
            const nextY = enemy.y + moveY;

            if (!checkWallCollision(nextX, enemy.y, enemy.radius)) {
              enemy.x = nextX;
            }
            if (!checkWallCollision(enemy.x, nextY, enemy.radius)) {
              enemy.y = nextY;
            }
          }
        } else {
          // Patrol when player not in range
          const move = enemy.pattern[enemy.patternIndex];
          const targetX = enemy.baseX + move.dx;
          const targetY = enemy.baseY + move.dy;

          const diffX = targetX - enemy.x;
          const diffY = targetY - enemy.y;
          const dist = Math.sqrt(diffX * diffX + diffY * diffY);

          if (dist > 0.1) {
            const moveX = (diffX / dist) * enemy.speed * deltaTime * 0.5;
            const moveY = (diffY / dist) * enemy.speed * deltaTime * 0.5;

            if (!checkWallCollision(enemy.x + moveX, enemy.y, enemy.radius)) {
              enemy.x += moveX;
            }
            if (!checkWallCollision(enemy.x, enemy.y + moveY, enemy.radius)) {
              enemy.y += moveY;
            }
          } else {
            enemy.baseX = targetX;
            enemy.baseY = targetY;
            enemy.patternIndex = (enemy.patternIndex + 1) % enemy.pattern.length;
          }
        }

      } else if (behavior === 'dash') {
        // Dasher: fast movement in straight lines
        if (enemy.dashTimer <= 0) {
          // Pick new dash direction
          const directions = [
            { x: 1, y: 0 }, { x: -1, y: 0 },
            { x: 0, y: 1 }, { x: 0, y: -1 }
          ];
          enemy.dashDir = directions[Math.floor(Math.random() * directions.length)];
          enemy.dashTimer = 1 + Math.random() * 2;
        }

        enemy.dashTimer -= deltaTime;

        const moveX = enemy.dashDir.x * enemy.speed * deltaTime;
        const moveY = enemy.dashDir.y * enemy.speed * deltaTime;

        const nextX = enemy.x + moveX;
        const nextY = enemy.y + moveY;

        if (!checkWallCollision(nextX, enemy.y, enemy.radius)) {
          enemy.x = nextX;
        } else {
          enemy.dashTimer = 0; // Hit wall, choose new direction
        }

        if (!checkWallCollision(enemy.x, nextY, enemy.radius)) {
          enemy.y = nextY;
        } else {
          enemy.dashTimer = 0;
        }

      } else {
        // Patrol behavior (default)
        const move = enemy.pattern[enemy.patternIndex];
        const targetX = enemy.baseX + move.dx;
        const targetY = enemy.baseY + move.dy;

        const diffX = targetX - enemy.x;
        const diffY = targetY - enemy.y;
        const dist = Math.sqrt(diffX * diffX + diffY * diffY);

        if (dist > 0.1) {
          const moveX = (diffX / dist) * enemy.speed * deltaTime;
          const moveY = (diffY / dist) * enemy.speed * deltaTime;

          if (!checkWallCollision(enemy.x + moveX, enemy.y, enemy.radius)) {
            enemy.x += moveX;
          }
          if (!checkWallCollision(enemy.x, enemy.y + moveY, enemy.radius)) {
            enemy.y += moveY;
          }
        } else {
          enemy.baseX = targetX;
          enemy.baseY = targetY;
          enemy.x = targetX;
          enemy.y = targetY;
          enemy.patternIndex = (enemy.patternIndex + 1) % enemy.pattern.length;
        }
      }

      // Check collision with player (if not invincible or ghost)
      if (!player.invincible && !player.ghost &&
          checkCircleCollision(player.x, player.y, player.radius, enemy.x, enemy.y, enemy.radius)) {
        createParticles(enemy.x, enemy.y, '#e74c3c', 20);
        resetLevel();
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime * 2;

      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // Update camera
    const viewWidth = CANVAS_WIDTH / TILE_SIZE;
    const viewHeight = CANVAS_HEIGHT / TILE_SIZE;
    gameRef.current.cameraX = Math.max(0, Math.min(player.x - viewWidth / 2, GRID_WIDTH - viewWidth));
    gameRef.current.cameraY = Math.max(0, Math.min(player.y - viewHeight / 2, GRID_HEIGHT - viewHeight));
  };

  // Draw circle transition effect (shrinking/expanding vision circle)
  const drawCircleTransition = (ctx, progress, isBlackout) => {
    if (!gameRef.current) return;

    const { player, cameraX, cameraY } = gameRef.current;
    const playerScreenX = (player.x - cameraX) * TILE_SIZE;
    const playerScreenY = (player.y - cameraY) * TILE_SIZE;

    const currentPowerups = gameRef.current.activePowerups || [];
    const visionBonus = currentPowerups.find(p => p.effect === 'vision')?.multiplier || 1;
    const normalVisionRadius = BASE_VISION_RADIUS * visionBonus * TILE_SIZE;

    ctx.save();

    if (isBlackout) {
      // Vision circle shrinks (darkness expands inward)
      const currentRadius = normalVisionRadius * (1 - progress);

      // Draw black overlay
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Cut out the shrinking vision circle
      ctx.globalCompositeOperation = 'destination-out';
      const gradient = ctx.createRadialGradient(
        playerScreenX, playerScreenY, currentRadius * 0.5,
        playerScreenX, playerScreenY, currentRadius
      );
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Vision circle expands (darkness recedes outward)
      const currentRadius = normalVisionRadius * progress;

      // Draw black overlay
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Cut out the expanding vision circle
      ctx.globalCompositeOperation = 'destination-out';
      const gradient = ctx.createRadialGradient(
        playerScreenX, playerScreenY, currentRadius * 0.5,
        playerScreenX, playerScreenY, currentRadius
      );
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    ctx.restore();
  };

  // Render game
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas || !gameRef.current) return;

    const ctx = canvas.getContext('2d');
    const { grid, player, goal, enemies, explored, cameraX, cameraY, powerups, particles, coins: coinsArray, keys: keysArray } = gameRef.current;

    // Clear canvas
    ctx.fillStyle = '#0f0f1e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const px = player.x;
    const py = player.y;
    const currentPowerups = gameRef.current.activePowerups || [];
    const visionBonus = currentPowerups.find(p => p.effect === 'vision')?.multiplier || 1;
    const visionRadius = BASE_VISION_RADIUS * visionBonus;

    // Render tiles
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const screenX = (x - cameraX) * TILE_SIZE;
        const screenY = (y - cameraY) * TILE_SIZE;

        if (screenX < -TILE_SIZE || screenX > CANVAS_WIDTH ||
            screenY < -TILE_SIZE || screenY > CANVAS_HEIGHT) {
          continue;
        }

        const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
        const inVision = dist <= visionRadius;

        if (inVision) {
          if (grid[y][x] === TILE.WALL) {
            ctx.fillStyle = '#2d4059';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          } else if (grid[y][x] === TILE.FLOOR) {
            ctx.fillStyle = '#16213e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          } else if (grid[y][x] === TILE.GOAL) {
            ctx.fillStyle = '#16213e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          }
        } else if (explored[y][x]) {
          if (grid[y][x] === TILE.WALL) {
            ctx.fillStyle = '#1a2634';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          } else {
            ctx.fillStyle = '#0a0f1e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }

    // Render coins
    for (const coin of coinsArray) {
      if (coin.collected) continue;

      const dist = Math.sqrt((coin.x - px) ** 2 + (coin.y - py) ** 2);
      if (dist <= visionRadius) {
        const screenX = (coin.x - cameraX) * TILE_SIZE;
        const screenY = (coin.y - cameraY) * TILE_SIZE;

        // Gold coin with shine effect
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(coin.rotation);

        // Outer glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coin.radius * TILE_SIZE * 1.5);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(-coin.radius * TILE_SIZE * 1.5, -coin.radius * TILE_SIZE * 1.5,
                     coin.radius * TILE_SIZE * 3, coin.radius * TILE_SIZE * 3);

        // Coin body
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, coin.radius * TILE_SIZE, 0, Math.PI * 2);
        ctx.fill();

        // Inner circle
        ctx.fillStyle = '#ffed4e';
        ctx.beginPath();
        ctx.arc(0, 0, coin.radius * TILE_SIZE * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(-coin.radius * TILE_SIZE * 0.3, -coin.radius * TILE_SIZE * 0.3,
                coin.radius * TILE_SIZE * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // Render keys
    for (const key of keysArray) {
      if (key.collected) continue;

      const dist = Math.sqrt((key.x - px) ** 2 + (key.y - py) ** 2);
      if (dist <= visionRadius) {
        const screenX = (key.x - cameraX) * TILE_SIZE;
        const screenY = (key.y - cameraY) * TILE_SIZE;

        const pulseSize = key.radius + Math.sin(key.pulse) * 0.15;

        // Cyan glow
        const gradient = ctx.createRadialGradient(
          screenX, screenY, 0,
          screenX, screenY, pulseSize * TILE_SIZE * 1.5
        );
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(
          screenX - pulseSize * TILE_SIZE * 1.5,
          screenY - pulseSize * TILE_SIZE * 1.5,
          pulseSize * TILE_SIZE * 3,
          pulseSize * TILE_SIZE * 3
        );

        // Key icon
        ctx.fillStyle = '#00ffff';
        ctx.font = `${TILE_SIZE * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔑', screenX, screenY);
      }
    }

    // Render powerups
    for (const powerup of powerups) {
      if (powerup.collected) continue;

      const dist = Math.sqrt((powerup.x - px) ** 2 + (powerup.y - py) ** 2);
      if (dist <= visionRadius) {
        const screenX = (powerup.x - cameraX) * TILE_SIZE;
        const screenY = (powerup.y - cameraY) * TILE_SIZE;

        const pulseSize = powerup.radius + Math.sin(powerup.pulse) * 0.1;

        // Outer glow
        const gradient = ctx.createRadialGradient(
          screenX, screenY, 0,
          screenX, screenY, pulseSize * TILE_SIZE
        );
        gradient.addColorStop(0, powerup.typeData.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(
          screenX - pulseSize * TILE_SIZE,
          screenY - pulseSize * TILE_SIZE,
          pulseSize * TILE_SIZE * 2,
          pulseSize * TILE_SIZE * 2
        );

        // Icon
        ctx.fillStyle = powerup.typeData.color;
        ctx.font = `${TILE_SIZE}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerup.typeData.icon, screenX, screenY);
      }
    }

    // Render goal (locked or unlocked)
    const goalDist = Math.sqrt((goal.x - px) ** 2 + (goal.y - py) ** 2);
    const allKeysCollected = keysCollected >= keysRequired;
    const goalLocked = keysRequired > 0 && !allKeysCollected;

    if (goalDist <= visionRadius) {
      const goalScreenX = (goal.x - cameraX) * TILE_SIZE;
      const goalScreenY = (goal.y - cameraY) * TILE_SIZE;

      if (goalLocked) {
        // Locked goal - gray with lock icon
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(goalScreenX, goalScreenY, goal.radius * TILE_SIZE, 0, Math.PI * 2);
        ctx.fill();

        // Lock icon
        ctx.fillStyle = '#999';
        ctx.font = `${TILE_SIZE}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔒', goalScreenX, goalScreenY);

        // Pulsing effect to indicate it's locked
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        const lockPulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
        ctx.globalAlpha = lockPulse;
        ctx.beginPath();
        ctx.arc(goalScreenX, goalScreenY, goal.radius * TILE_SIZE * 1.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        // Unlocked goal - golden with rays
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(goalScreenX, goalScreenY, goal.radius * TILE_SIZE, 0, Math.PI * 2);
        ctx.fill();

        // Animated rays
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + Date.now() * 0.002;
          const x1 = goalScreenX + Math.cos(angle) * (goal.radius * TILE_SIZE);
          const y1 = goalScreenY + Math.sin(angle) * (goal.radius * TILE_SIZE);
          const x2 = goalScreenX + Math.cos(angle) * (goal.radius * TILE_SIZE * 1.8);
          const y2 = goalScreenY + Math.sin(angle) * (goal.radius * TILE_SIZE * 1.8);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }

    // Render enemies
    for (const enemy of enemies) {
      const dist = Math.sqrt((enemy.x - px) ** 2 + (enemy.y - py) ** 2);
      if (dist <= visionRadius) {
        const screenX = (enemy.x - cameraX) * TILE_SIZE;
        const screenY = (enemy.y - cameraY) * TILE_SIZE;

        // Enemy body
        ctx.fillStyle = enemy.typeData.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, enemy.radius * TILE_SIZE, 0, Math.PI * 2);
        ctx.fill();

        // Outline for tanks
        if (enemy.type === 'TANK') {
          ctx.strokeStyle = '#2c3e50';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Eyes
        ctx.fillStyle = '#000';
        const eyeOffset = enemy.radius * TILE_SIZE * 0.3;
        ctx.beginPath();
        ctx.arc(screenX - eyeOffset, screenY - eyeOffset * 0.5, 1.5, 0, Math.PI * 2);
        ctx.arc(screenX + eyeOffset, screenY - eyeOffset * 0.5, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Chase indicator for chasers
        if (enemy.type === 'CHASER') {
          const distToPlayer = Math.sqrt(
            (player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2
          );
          if (distToPlayer < enemy.typeData.chaseRange) {
            ctx.strokeStyle = '#e67e22';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(screenX, screenY, (enemy.radius + 0.2) * TILE_SIZE, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
    }

    // Render particles
    for (const p of particles) {
      const screenX = (p.x - cameraX) * TILE_SIZE;
      const screenY = (p.y - cameraY) * TILE_SIZE;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(screenX, screenY, p.size * TILE_SIZE, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Render player
    const playerScreenX = (player.x - cameraX) * TILE_SIZE;
    const playerScreenY = (player.y - cameraY) * TILE_SIZE;

    // Player effects
    if (player.invincible) {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(playerScreenX, playerScreenY, (player.radius + 0.2) * TILE_SIZE, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (player.ghost) {
      ctx.globalAlpha = 0.5;
    }

    ctx.fillStyle = '#4ecca3';
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, player.radius * TILE_SIZE, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(playerScreenX - 2, playerScreenY - 1, 1.5, 0, Math.PI * 2);
    ctx.arc(playerScreenX + 2, playerScreenY - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;

    // Fog of war gradient
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';

    const gradient = ctx.createRadialGradient(
      playerScreenX,
      playerScreenY,
      visionRadius * TILE_SIZE * 0.5,
      playerScreenX,
      playerScreenY,
      visionRadius * TILE_SIZE * 1.3
    );
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(0.8, 'rgba(0,0,0,0.9)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();

    // Draw transition effect
    if (transitionStateRef.current === 'blackout') {
      drawCircleTransition(ctx, transitionProgressRef.current, true);
    } else if (transitionStateRef.current === 'reveal') {
      drawCircleTransition(ctx, transitionProgressRef.current, false);
    }
  };

  // Render minimap
  const renderMinimap = () => {
    const canvas = minimapRef.current;
    if (!canvas || !gameRef.current) return;

    const ctx = canvas.getContext('2d');
    const { grid, player, goal, enemies, explored, powerups, coins: coinsArray, keys: keysArray } = gameRef.current;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    const scale = MINIMAP_SIZE / GRID_WIDTH;
    const allKeysCollected = keysCollected >= keysRequired;
    const goalLocked = keysRequired > 0 && !allKeysCollected;

    // Render explored tiles
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (explored[y][x]) {
          const mapX = x * scale;
          const mapY = y * scale;

          if (grid[y][x] === TILE.WALL) {
            ctx.fillStyle = '#555';
          } else if (grid[y][x] === TILE.GOAL) {
            // Show goal as locked (gray) or unlocked (gold)
            ctx.fillStyle = goalLocked ? '#666' : '#ffd700';
          } else {
            ctx.fillStyle = '#222';
          }
          ctx.fillRect(mapX, mapY, Math.ceil(scale), Math.ceil(scale));
        }
      }
    }

    // Render coins
    for (const coin of coinsArray) {
      if (coin.collected) continue;
      const cx = Math.floor(coin.x);
      const cy = Math.floor(coin.y);
      if (cx >= 0 && cx < GRID_WIDTH && cy >= 0 && cy < GRID_HEIGHT && explored[cy][cx]) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(coin.x * scale - 0.5, coin.y * scale - 0.5, 2, 2);
      }
    }

    // Render keys (larger and more visible)
    for (const key of keysArray) {
      if (key.collected) continue;
      const kx = Math.floor(key.x);
      const ky = Math.floor(key.y);
      if (kx >= 0 && kx < GRID_WIDTH && ky >= 0 && ky < GRID_HEIGHT && explored[ky][kx]) {
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(key.x * scale - 1.5, key.y * scale - 1.5, 4, 4);
        // Add border to make it stand out
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(key.x * scale - 1.5, key.y * scale - 1.5, 4, 4);
      }
    }

    // Render powerups
    for (const powerup of powerups) {
      if (powerup.collected) continue;
      const px = Math.floor(powerup.x);
      const py = Math.floor(powerup.y);
      if (px >= 0 && px < GRID_WIDTH && py >= 0 && py < GRID_HEIGHT && explored[py][px]) {
        ctx.fillStyle = powerup.typeData.color;
        ctx.fillRect(powerup.x * scale - 1, powerup.y * scale - 1, 3, 3);
      }
    }

    // Render enemies
    for (const enemy of enemies) {
      const ex = Math.floor(enemy.x);
      const ey = Math.floor(enemy.y);
      if (ex >= 0 && ex < GRID_WIDTH && ey >= 0 && ey < GRID_HEIGHT && explored[ey][ex]) {
        ctx.fillStyle = enemy.typeData.color;
        ctx.fillRect(enemy.x * scale - 1, enemy.y * scale - 1, Math.ceil(scale * 2), Math.ceil(scale * 2));
      }
    }

    // Render goal (always visible, even if not explored)
    const goalMapX = goal.x * scale;
    const goalMapY = goal.y * scale;
    const goalSize = 5;

    // Goal background
    ctx.fillStyle = goalLocked ? '#666' : '#ffd700';
    ctx.beginPath();
    ctx.arc(goalMapX, goalMapY, goalSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Goal border to make it stand out
    ctx.strokeStyle = goalLocked ? '#ff6b6b' : '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(goalMapX, goalMapY, goalSize / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Pulsing effect for locked goal
    if (goalLocked) {
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 1;
      const pulse = Math.sin(Date.now() * 0.003) * 1 + 2;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(goalMapX, goalMapY, goalSize / 2 + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Render player
    ctx.fillStyle = '#4ecca3';
    ctx.fillRect(player.x * scale - 1.5, player.y * scale - 1.5, 3, 3);
  };

  // Game loop
  const gameLoop = (timestamp) => {
    if (!gameRef.current.lastTime) {
      gameRef.current.lastTime = timestamp;
    }

    const deltaTime = Math.min((timestamp - gameRef.current.lastTime) / 1000, 0.1);
    gameRef.current.lastTime = timestamp;

    update(deltaTime);
    render();
    renderMinimap();

    animationRef.current = requestAnimationFrame(gameLoop);
  };

  // Initialize game
  useEffect(() => {
    initLevel(1);
    animationRef.current = requestAnimationFrame(gameLoop);

    const handleKeyDown = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Sync activePowerups to gameRef so the game loop can access current values
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.activePowerups = activePowerups;
    }
  }, [activePowerups]);

  // Sync level to ref so game loop always has current level
  useEffect(() => {
    currentLevelRef.current = level;
  }, [level]);

  // Save stats at level start (after state has settled from previous level completion)
  useEffect(() => {
    // Only update when level changes (not on every score/coin change)
    levelStartStatsRef.current = {
      score: score,
      coins: coins,
      keys: 0
    };
  }, [level]);

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
      />
      <canvas
        ref={minimapRef}
        className="minimap"
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
      />
      <div className="ui">
        <div className="ui-stat">
          Level: <span className="highlight">{level}</span>
        </div>
        <div className="ui-stat">
          Score: <span className="highlight">{score}</span>
        </div>
        <div className="ui-stat">
          Coins: <span className="highlight" style={{ color: '#ffd700' }}>{coins}</span>
        </div>
        {keysRequired > 0 && (
          <div className="ui-stat">
            Keys: <span className="highlight" style={{ color: keysCollected >= keysRequired ? '#00ff00' : '#00ffff' }}>
              {keysCollected}/{keysRequired}
            </span>
          </div>
        )}
        <div className="ui-stat">
          Deaths: <span className="highlight">{deaths}</span>
        </div>
        {activePowerups.length > 0 && (
          <div style={{ marginTop: '10px', borderTop: '1px solid #16213e', paddingTop: '8px' }}>
            {activePowerups.map((p, i) => (
              <div key={i} style={{ fontSize: '11px', color: '#4ecca3' }}>
                {p.name}: {Math.ceil((p.endTime - Date.now()) / 1000)}s
              </div>
            ))}
          </div>
        )}
        <div className="controls">WASD to move</div>
      </div>
    </div>
  );
}

export default App;
