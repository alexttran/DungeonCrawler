# Dungeon Crawler - Project Context

## Project Overview

A React-based dungeon crawler game featuring procedurally generated levels, multiple enemy types, power-ups, collectibles, and fog of war mechanics. The game uses HTML Canvas for rendering and runs at 60 FPS with smooth continuous movement.

## Technology Stack

- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.0
- **Language**: JavaScript (JSX)
- **Rendering**: HTML5 Canvas API
- **Type**: ES Module (type: "module")

## File Structure

```
DungeonCrawler/
├── src/
│   ├── App.jsx          # Main game component (1563 lines)
│   ├── App.css          # Game styling
│   └── main.jsx         # React entry point
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
└── README.md           # User-facing documentation
```

## Game Architecture

### Core Components

The entire game is built as a single React component (`App.jsx`) that manages:

1. **Game State** (via `gameRef.current`):
   - `grid`: 100x100 tile array (WALL, FLOOR, GOAL)
   - `player`: Position, stats, and active effects
   - `enemies`: Array of enemy entities
   - `powerups`: Array of collectible power-ups
   - `coins`: Array of collectible coins
   - `keys`: Array of collectible keys (level 3+)
   - `goal`: Goal position and properties
   - `explored`: 100x100 boolean array for fog of war
   - `particles`: Visual effect particles
   - `activePowerups`: Currently active power-up effects
   - `cameraX/Y`: Camera position for viewport

2. **React State** (via `useState`):
   - `level`: Current level number
   - `deaths`: Death count
   - `score`: Current score
   - `coins`: Total coins collected
   - `keysCollected`: Keys collected in current level
   - `keysRequired`: Keys needed to unlock goal
   - `activePowerups`: Array of active power-up timers

3. **Refs**:
   - `canvasRef`: Main game canvas
   - `minimapRef`: Minimap canvas
   - `gameRef`: Game state object
   - `keysRef`: Keyboard input state
   - `animationRef`: RequestAnimationFrame ID
   - `transitionStateRef`: Level transition state (null, 'blackout', 'reveal')
   - `transitionProgressRef`: Transition animation progress
   - `nextLevelRef`: Next level number during transition

## Game Constants

### Core Settings
- **Grid**: 100x100 tiles
- **Tile Size**: 16px
- **Canvas**: 1000x700px (62.5x43.75 tiles visible)
- **Minimap**: 200x200px
- **Vision Radius**: 8 tiles (base)
- **Player Speed**: 8 units/second (base)
- **Min Start-Goal Distance**: 50 tiles

### Tile Types
```javascript
TILE.WALL = 0
TILE.FLOOR = 1
TILE.GOAL = 2
```

## Enemy System

### Enemy Types (5 total)

1. **WANDERER** (Gray `#95a5a6`)
   - Speed: 2 units/s
   - Radius: 0.25 tiles
   - Behavior: Random movement with direction changes
   - Difficulty: Easy
   - Availability: All levels

2. **PATROLLER** (Red `#e74c3c`)
   - Speed: 3 units/s
   - Radius: 0.3 tiles
   - Behavior: Fixed patrol patterns (horizontal/vertical/square)
   - Difficulty: Medium
   - Availability: All levels

3. **CHASER** (Orange `#e67e22`)
   - Speed: 6 units/s
   - Radius: 0.28 tiles
   - Chase Range: 12 tiles (base, +1 per level, max 20)
   - Behavior: Chases player when in range, otherwise patrols
   - Visual Indicator: Orange dashed ring when chasing
   - Difficulty: Hard
   - Availability: Level 2+

4. **TANK** (Dark Gray `#34495e`)
   - Speed: 1.5 units/s
   - Radius: 0.45 tiles (largest)
   - Behavior: Slow patrol, blocks corridors
   - Visual: Black outline
   - Difficulty: Medium
   - Availability: Level 3+

5. **DASHER** (Purple `#9b59b6`)
   - Speed: 10 units/s (fastest)
   - Radius: 0.25 tiles
   - Behavior: Dashes in straight lines, changes direction on collision
   - Difficulty: Hard
   - Availability: Level 5+

### Enemy Spawning Logic

- **Count**: 5 + (level × 2), max 30 enemies
- **Speed Scaling**: +5% per level, max 1.5x at level 10+
- **Safe Zone**: 10 tile radius around player start (no spawns)
- **Distribution by Level**:
  - Level 1: 60% Wanderer, 40% Patroller
  - Level 2: 40% Wanderer, 40% Patroller, 20% Chaser
  - Level 3: 20% Wanderer, 30% Patroller, 35% Chaser, 15% Tank
  - Level 4: 15% Wanderer, 25% Patroller, 30% Chaser, 30% Tank
  - Levels 5-7: 15% Wanderer, 20% Patroller, 25% Chaser, 20% Tank, 20% Dasher
  - Level 8+: 10% Wanderer, 15% Patroller, 25% Chaser, 20% Tank, 30% Dasher

### Enemy Patrol Patterns

Three pattern types generated randomly:
1. Horizontal patrol: Back and forth (5-14 tiles)
2. Vertical patrol: Up and down (5-14 tiles)
3. Square patrol: Clockwise/counterclockwise (4-9 tiles per side)

## Power-Up System

### Power-Up Types (4 total)

1. **SPEED** (Blue `#3498db`, ⚡)
   - Duration: 5 seconds
   - Effect: 1.5x movement speed
   - Score: +100 points

2. **INVINCIBILITY** (Yellow `#f1c40f`, ★)
   - Duration: 3 seconds
   - Effect: Cannot be harmed by enemies
   - Visual: Golden ring around player
   - Score: +100 points

3. **VISION** (Teal `#1abc9c`, 👁)
   - Duration: 8 seconds
   - Effect: 1.75x vision radius
   - Score: +100 points

4. **GHOST** (White `#ecf0f1`, 👻)
   - Duration: 4 seconds
   - Effect: Walk through walls and enemies
   - Visual: Semi-transparent player (50% opacity)
   - Score: +100 points

### Power-Up Spawning
- **Count**: 3-6 per level
- **Location**: Random positions in rooms (not start/goal)
- **Visual**: Pulsing icon with colored glow
- **Stacking**: Same type replaces existing (resets timer)

## Collectibles System

### Coins 💰
- **Spawn Count**: 8 + random(13) + floor(level × 1.5)
- **Value**: 10 coins each
- **Score**: +50 points per coin
- **Visual**: Rotating golden coin with glow effect
- **Radius**: 0.25 tiles
- **Shown on**: Main view and minimap (small gold dots)

### Keys 🔑
- **Level 3-4**: 1 key required
- **Level 5-7**: 2 keys required
- **Level 8+**: 3 keys required
- **Score**: +500 points per key
- **Visual**: Cyan glowing key with pulsing effect
- **Radius**: 0.35 tiles
- **Shown on**: Main view and minimap (larger cyan squares with border)
- **Purpose**: Must collect all keys before goal unlocks

## Level Generation

### Room System
- **Count**: 8-12 rooms per level
- **Size Distribution**:
  - Small (4-8 tiles): 50%
  - Medium (8-14 tiles): 35%
  - Large (14-20 tiles): 15%
- **Placement**: Random within grid bounds (3 tile margin)

### Corridor System
- **Type**: L-shaped connections between consecutive rooms
- **Width**: 1-4 tiles (random per corridor segment)
- **Algorithm**: Horizontal then vertical path

### Start/Goal Placement
- **Algorithm**: Find two rooms with ≥50 tile distance
- **Fallback**: Use first and last room if no valid pair found (max 100 attempts)
- **Goal State**:
  - Unlocked (Levels 1-2 or all keys collected): Golden star with animated rays
  - Locked (Levels 3+ with keys remaining): Gray with lock icon and pulsing red ring

## Rendering System

### Main Canvas Rendering
1. **Background**: Dark blue (`#0f0f1e`)
2. **Tiles**: Only render visible and explored tiles
   - Walls in vision: `#2d4059`
   - Floors in vision: `#16213e`
   - Walls explored: `#1a2634` (darker)
   - Floors explored: `#0a0f1e` (darker)
3. **Collectibles**: Coins, keys (with rotation/pulse animations)
4. **Power-ups**: Icons with pulsing glow effect
5. **Goal**: Animated rays (unlocked) or lock icon with pulse (locked)
6. **Enemies**: Colored circles with eyes, chase indicators
7. **Particles**: Fading circular particles
8. **Player**: Green circle (`#4ecca3`) with eyes
9. **Fog of War**: Radial gradient from player position

### Level Transition Animation
- **Blackout Phase** (0.5s): Vision circle shrinks to black
- **Level Init**: New level generated at full blackout
- **Reveal Phase** (0.5s): Vision circle expands from black
- **Implementation**: Uses `transitionStateRef` and `transitionProgressRef`

### Minimap Rendering (200x200px)
- **Scale**: MINIMAP_SIZE / GRID_WIDTH
- **Shows**:
  - Explored tiles (walls: gray, floors: dark)
  - Goal position (locked: gray with red pulse, unlocked: gold with white border)
  - Coins (small gold dots)
  - Keys (larger cyan squares with border)
  - Power-ups (colored squares)
  - Enemies (colored squares in explored areas)
  - Player (green square)
- **Location**: Top-right corner overlay

## Game Loop

### Update Cycle (update function)
1. Handle level transitions (blackout/reveal)
2. Update active power-up timers
3. Process player input (WASD/Arrow keys)
4. Apply movement with collision detection
5. Update exploration (fog of war)
6. Check coin collection
7. Check key collection
8. Check power-up collection
9. Check goal collision (if all keys collected)
10. Update enemy AI and movement
11. Check enemy-player collisions
12. Update particles
13. Update camera position

### Render Cycle
1. Render main canvas (render function)
2. Render minimap (renderMinimap function)
3. Draw transition effects if active
4. Request next animation frame

### Delta Time
- Calculated from requestAnimationFrame timestamp
- Clamped to max 0.1s (100ms) to prevent large jumps
- Used for frame-independent movement and animations

## Movement and Collision

### Player Movement
- **Input**: WASD or Arrow keys (stored in `keysRef`)
- **Diagonal Normalization**: Vector magnitude normalized
- **Speed Calculation**: BASE_PLAYER_SPEED × speedBonus × deltaTime
- **Collision**: Separate X/Y collision checks with wall sliding
- **Ghost Mode**: Bypasses wall collision
- **Bounds Clamping**: Kept within grid bounds

### Enemy Movement
- **Wanderer**: Random direction, timer-based direction changes
- **Patroller**: Follow predefined pattern waypoints
- **Chaser**: Direct pursuit when in range, patrol otherwise
- **Tank**: Same as Patroller (slow speed is key difference)
- **Dasher**: Straight-line dashes with direction changes on collision

### Collision Detection
- **Circle-Circle**: Distance check between centers
- **Circle-Wall**: Check tiles within bounding box, compute closest point distance
- **Player-Enemy**: Resets player position to start (unless invincible/ghost)
- **Player-Collectible**: Marks as collected, applies effects
- **Player-Goal**: Triggers level transition (if unlocked)

## Particle System

### Particle Properties
- Position (x, y)
- Velocity (vx, vy)
- Life (1.0 to 0.0)
- Color
- Size (0.1-0.3 tiles)

### Particle Creation
- **Coin Collection**: 8 golden particles
- **Key Collection**: 20 cyan particles
- **Power-up Collection**: 15 particles (power-up color)
- **Enemy Death/Reset**: 20 red particles
- **Goal Reached**: 30 golden particles

### Particle Update
- Position updated by velocity × deltaTime
- Life decreases by deltaTime × 2
- Removed when life ≤ 0
- Rendered with alpha based on life

## Scoring System

- **Coin Collection**: +50 points
- **Power-up Collection**: +100 points
- **Key Collection**: +500 points
- **Level Completion**: +1000 points

## Difficulty Progression

### Enemy Scaling
- **Count**: +2 per level (starting at 7)
- **Speed**: +5% per level (max 1.5x at level 10+)
- **Chaser Range**: +1 tile per level (max 20 tiles)
- **Type Distribution**: More difficult types at higher levels

### Level Mechanics
- **Levels 1-2**: No keys required
- **Levels 3-4**: 1 key required
- **Levels 5-7**: 2 keys required
- **Level 8+**: 3 keys required

### Coin Scaling
- Base: 8-20 coins
- Scaling: +floor(level × 1.5) additional coins

## Key Functions Reference

### Dungeon Generation
- `generateDungeon(levelNum)`: src/App.jsx:120 - Creates grid, rooms, corridors, start/goal
- `generatePatrolPattern()`: src/App.jsx:243 - Creates enemy patrol paths

### Spawning
- `spawnPowerups(rooms, startRoom, goalRoom)`: src/App.jsx:269
- `spawnCoins(rooms, startRoom, goalRoom, levelNum)`: src/App.jsx:306
- `spawnKeys(rooms, startRoom, goalRoom, levelNum)`: src/App.jsx:338

### Game Logic
- `initLevel(levelNum)`: src/App.jsx:382 - Initialize new level
- `update(deltaTime)`: src/App.jsx:642 - Main game update loop
- `render()`: src/App.jsx:1004 - Main canvas rendering
- `renderMinimap()`: src/App.jsx:1349 - Minimap rendering
- `gameLoop(timestamp)`: src/App.jsx:1466 - RequestAnimationFrame loop

### Effects and Visuals
- `createParticles(x, y, color, count)`: src/App.jsx:539
- `drawCircleTransition(ctx, progress, isBlackout)`: src/App.jsx:949
- `updateExploration()`: src/App.jsx:559

### Collision Detection
- `checkWallCollision(x, y, radius)`: src/App.jsx:583
- `checkCircleCollision(x1, y1, r1, x2, y2, r2)`: src/App.jsx:605

### Power-up Management
- `addPowerup(typeKey, typeData)`: src/App.jsx:611

## Visual Design

### Color Palette
- **Background**: `#0f0f1e` (dark blue-black)
- **UI Background**: `rgba(0, 0, 0, 0.7)` (semi-transparent black)
- **UI Border**: `#16213e` (dark blue)
- **Player**: `#4ecca3` (green)
- **Highlight**: `#4ecca3` (green)
- **Goal**: `#ffd700` (gold)
- **Coins**: `#ffd700` (gold)
- **Keys**: `#00ffff` (cyan)
- **Walls (visible)**: `#2d4059` (medium blue-gray)
- **Floors (visible)**: `#16213e` (dark blue)
- **Walls (explored)**: `#1a2634` (darker blue-gray)
- **Floors (explored)**: `#0a0f1e` (very dark blue)

### UI Layout
- **Top-left**: Stats panel (level, score, coins, keys, deaths, active power-ups)
- **Top-right**: Minimap (200×200px)
- **Font**: 'Courier New', monospace
- **Border Style**: 2-3px solid dark blue

## Input Handling

### Keyboard Controls
- **W / ArrowUp**: Move up
- **S / ArrowDown**: Move down
- **A / ArrowLeft**: Move left
- **D / ArrowRight**: Move right
- **Implementation**: Key state stored in `keysRef`, checked each frame
- **Normalization**: Diagonal movement normalized to prevent faster diagonal speed

## State Management

### React State (UI-driven)
- level, deaths, score, coins, keysCollected, keysRequired, activePowerups
- These trigger UI re-renders when changed

### Game State (gameRef.current)
- All gameplay entities and grid data
- Updated every frame without triggering React re-renders
- Synced with React state when needed (e.g., activePowerups)

### Transition State
- Managed via refs to avoid React re-renders during animation
- `transitionStateRef`: null | 'blackout' | 'reveal'
- `transitionProgressRef`: 0.0 to 1.0
- `nextLevelRef`: Level number to load after blackout

## Development Notes

### Performance Optimizations
- Single component architecture (no prop drilling)
- Canvas rendering (not DOM manipulation)
- Delta time for frame-independent gameplay
- Viewport culling for tile rendering
- Particle cleanup when life reaches 0

### Known Patterns
- Power-ups of same type replace existing (no stacking)
- Enemy death = player reset to start position
- Camera follows player with bounds clamping
- Exploration persists throughout level

### Future Enhancement Areas
- Enemy pathfinding (currently simple AI)
- More room variety (currently rectangular rooms only)
- Additional power-up types
- Sound effects and music
- Level themes/biomes
- Boss enemies
- Weapon system
- Persistent progression/unlocks

## Build and Run

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Browser Requirements
- Modern browser with Canvas support
- ES Module support
- RequestAnimationFrame support
- Tested on Chrome/Firefox/Safari
