# Dungeon Crawler Game

A React-based dungeon crawler game with smooth movement, diverse enemy types, power-ups, and procedurally generated levels with fog of war mechanics.

## Features

- **Smooth Continuous Movement**: WASD controls with fluid player movement (2.6x faster than before!)
- **Large Procedurally Generated Dungeons**: 100x100 grid with random rooms and corridors
- **5 Unique Enemy Types**: Each with distinct behaviors and difficulty levels
- **4 Power-Up Types**: Collect power-ups to enhance your abilities
- **Particle Effects**: Visual feedback for collections and deaths
- **Fog of War**: Limited visibility with smooth gradient falloff
- **Minimap**: Top-right corner minimap that reveals explored areas
- **Score System**: Earn points for collecting power-ups and completing levels
- **Infinite Levels**: Randomly generated levels with increasing difficulty
- **Minimum Distance Constraint**: Start and goal positions are guaranteed to be at least 50 tiles apart

## How to Play

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** to the URL shown in the terminal (usually `http://localhost:5173`)

## Controls

- **WASD** or **Arrow Keys**: Move your character (green circle)
- Navigate to the golden goal to advance to the next level
- Collect power-ups for temporary abilities
- Avoid enemies - touching them sends you back to the start

## Enemy Types

### Wanderer (Gray)
- **Speed**: Slow (2 units/s)
- **Behavior**: Moves randomly, changes direction periodically
- **Size**: Small
- **Difficulty**: Easy

### Patroller (Red)
- **Speed**: Normal (3 units/s)
- **Behavior**: Follows fixed patrol patterns
- **Size**: Medium
- **Difficulty**: Medium

### Chaser (Orange)
- **Speed**: Fast (6 units/s)
- **Behavior**: Chases player when within 12 tile range, otherwise patrols
- **Size**: Medium
- **Difficulty**: Hard - indicated by orange ring when chasing

### Tank (Dark Gray)
- **Speed**: Very Slow (1.5 units/s)
- **Behavior**: Patrols slowly, blocks corridors
- **Size**: Large (blocks paths effectively)
- **Difficulty**: Medium - easy to dodge but hard to get around

### Dasher (Purple)
- **Speed**: Very Fast (10 units/s)
- **Behavior**: Dashes in straight lines, changes direction on collision
- **Size**: Small
- **Difficulty**: Hard - unpredictable and fast

## Power-Ups

### ⚡ Speed Boost (Blue)
- **Duration**: 5 seconds
- **Effect**: 1.5x movement speed
- **Score**: +100 points

### ★ Invincibility (Yellow)
- **Duration**: 3 seconds
- **Effect**: Cannot be harmed by enemies
- **Visual**: Golden ring around player
- **Score**: +100 points

### 👁 Enhanced Vision (Teal)
- **Duration**: 8 seconds
- **Effect**: 2x vision radius
- **Score**: +100 points

### 👻 Ghost Mode (White)
- **Duration**: 4 seconds
- **Effect**: Walk through walls and enemies
- **Visual**: Semi-transparent player
- **Score**: +100 points

## Collectibles

### 💰 Gold Coins
- **Spawn Rate**: 8-20+ coins per level (more on higher levels)
- **Value**: 10 coins each
- **Score Bonus**: +50 points per coin
- **Visual**: Rotating golden coin with glow effect
- **Shown on**: Main view and minimap (small gold dots)

### 🔑 Keys (Levels 3+)
- **Level 3-4**: 1 key required
- **Level 5-7**: 2 keys required
- **Level 8+**: 3 keys required
- **Score Bonus**: +500 points per key
- **Visual**: Cyan glowing key emoji
- **Shown on**: Main view and minimap (larger cyan squares with border)
- **Purpose**: Must collect all keys before goal unlocks

## Scoring

- **Collect Coin**: +50 points
- **Collect Power-up**: +100 points
- **Collect Key**: +500 points
- **Complete Level**: +1000 points
- **Current score, coins, and keys displayed in UI**

## Game Mechanics

- **Player**: Green circle with smooth continuous movement
- **Goal**:
  - **Unlocked** (Levels 1-2, or all keys collected): Golden star with animated rays
  - **Locked** (Levels 3+, keys remaining): Gray with lock icon and pulsing red ring
  - Advances you to next level when reached (if unlocked)
  - Lock status shown on minimap (gray = locked, gold = unlocked)
- **Coins**: Collectible currency scattered throughout levels
- **Keys**: Required collectibles on harder levels (3+) to unlock goal
- **Enemies**: Color-coded by type with unique behaviors
- **Safe Zone**: Enemies never spawn within 10 tiles of your starting position
- **Vision**: Limited radius around your character (expandable with power-ups)
- **Minimap**: Shows explored areas, your position, enemies, power-ups, coins, keys, and goal status
- **Progressive Difficulty**:
  - **Level 1**: Only Wanderers (60%) and Patrollers (40%)
  - **Level 2**: Wanderers, Patrollers, Chasers introduced (20%)
  - **Level 3**: More Chasers (35%), Tanks introduced (15%)
  - **Level 4**: All types except Dasher, harder distribution
  - **Levels 5-7**: All enemy types unlocked, balanced distribution
  - **Level 8+**: Maximum difficulty, more Chasers/Dashers (65% combined)
  - **Enemy Count**: Starts at 7, +2 per level (max 30)
  - **Speed Scaling**: Enemies get +5% faster each level (max 1.5x at level 10+)
  - **Chase Range**: Chasers detect you from +1 tile further each level (max 20 tiles)
- **Room Variation**:
  - Small rooms (4-8 tiles): 50%
  - Medium rooms (8-14 tiles): 35%
  - Large rooms (14-20 tiles): 15%
- **Corridor Variation**: Width ranges from 1-7 tiles (random for each corridor)

## Technical Details

- Built with React 18 and Vite
- Canvas-based rendering for smooth 60 FPS gameplay
- Custom particle system for visual effects
- Grid size: 100x100 tiles
- Tile size: 16px
- Base vision radius: 8 tiles
- Base player speed: 8 units/second (2.6x faster!)
- Enemy speeds: 1.5-10 units/second depending on type
- 3-6 power-ups per level
- Advanced collision detection with smooth wall sliding

Enjoy the game!