# Maze Piano - Game Development Documentation

## Project Overview

Maze Piano is a top-down 2D game built with HTML5 Canvas and vanilla JavaScript. The game features a player character that can move around a tile-based world with various interactive elements.

Whenever changes are made, please update this documentation to reflect the current state of the codebase.

Ensure this file is up to date at all times!

## Architecture & File Structure

### Core Files

- `index.html` - Main HTML file with canvas setup and script loading
- `constants.js` - Global constants and enums
- `game.js` - Main game loop and rendering coordination
- `Player.js` - Player character logic and sprite handling
- `Camera.js` - Camera system with zoom and smooth following
- `TileSystem.js` - Tile-based world management

### Asset Structure

```
public/
├── sprites/
│   ├── Player sprites: idle_down.png, idle_right.png, idle_up.png
│   ├── Walking animations: walk_down.png, walk_down_2.png, walk_right_1.png, etc.
│   ├── Tile sprites: stone.png, coin.png, spike.png, spike-ball.png
│   ├── UI elements: banner_green.png, banner_red.png (start/end flags)
│   └── Effects: light_overlay_pngtree.png (lighting effect behind player)
└── sounds/
    ├── coin_sfx.mp3
    └── death_sfx.mp3
```

## Class Documentation

### Game Class (`game.js`)

**Purpose**: Main game controller that orchestrates all game systems.

**Key Properties**:

- `player` - Player instance
- `camera` - Camera instance
- `tileSystem` - TileSystem instance
- `keys` - Object tracking pressed keys
- `lightOverlay` - Image for the light effect rendered behind the player
- `coinCount` - Number of coins collected in the current life
- `coinSound` - Audio object for coin pickup sound
- `_wasDead` - Internal flag to edge-detect death state transitions

**Key Methods**:

- `init()` - Initializes event listeners and starts game loop
- `bindEvents()` - Sets up keyboard input handling
- `update()` - Updates all game systems each frame
- `render()` - Renders all visual elements with camera transformations
- `renderBackground()` - Fills the background with solid black color
- `renderLightOverlay()` - Renders the light effect centered on player
- `gameLoop()` - Main game loop using requestAnimationFrame

**Canvas Context**: Uses global `canvas` and `ctx` variables for rendering.

### Player Class (`Player.js`)

**Purpose**: Handles player character movement, animation, and rendering.

**Key Properties**:

- `x, y` - World position coordinates (center of player)
- `spawnX, spawnY` - Original spawn position for respawning
- `width, height` - Player sprite dimensions (32x32 pixels)
- `hitboxWidth, hitboxHeight` - Player collision hitbox dimensions (20x20 pixels, smaller than sprite)
- `speed` - Movement speed in pixels per second (270)
- `direction` - Current facing direction ('up', 'down', 'left', 'right')
- `isMoving` - Boolean tracking movement state
- `animationTime` - Timer for sprite animation frames
- `isDead` - Boolean tracking death state
- `deathTime` - Timer for death animation
- `deathFlashDuration` - Duration of death animation in seconds
- `sprites` - Object storing loaded sprite images
- `deathSound` - Audio object for death sound effect

**Key Methods**:

- `loadSprites()` - Loads all player sprite images from public/sprites/
- `update(keys, tileSystem)` - Processes input, updates position/animation, and checks collisions
- `checkWallCollision(x, y, tileSystem)` - Returns true if position would collide with stone tiles (uses hitbox size for collision)
- `checkSpikeCollision(tileSystem)` - Checks for spike collision at hitbox center and triggers death
- `die()` - Plays death sound and teleports player back to spawn
- `getCurrentSprite()` - Returns appropriate sprite based on direction and movement
- `render(ctx)` - Draws player sprite centered on hitbox, with flipping for left direction

**Input Handling**: Responds to WASD and arrow keys for movement.

**Collision System**:

- Wall collision: Checks all four corners of player hitbox (24x24) against stone tiles, allowing player to fit through 1-tile-wide gaps
- Spike collision: Checks player hitbox center position against spike tiles
- Movement is prevented if collision with walls would occur
- Spike collision triggers immediate death and respawn

**Death/Respawn System**:

- Player dies when touching spike tiles
- Death state is set (isDead = true)
- Death plays `death_sfx.mp3` sound effect
- Screen flashes red for a brief period (deathFlashDuration)
- Controls are disabled during death animation
- After animation completes, player teleports back to spawn position

**Animation System**:

- Idle sprites for each direction
- 2-frame walking animation for each direction
- Left movement uses horizontally flipped right sprites

### Camera Class (`Camera.js`)

**Purpose**: Manages viewport and provides smooth following with zoom support.

**Key Properties**:

- `x, y` - Camera world position
- `zoom` - Zoom level (default 1.5 for closer view)
- `smoothing` - Interpolation factor for smooth following (0.1)

**Key Methods**:

- `follow(target)` - Smoothly follows target entity (usually player)

**Camera Behavior**:

- Centers on target with zoom consideration
- Uses linear interpolation for smooth movement
- Zoom affects both rendering scale and follow calculations

### TileSystem Class (`TileSystem.js`)

**Purpose**: Manages tile-based world with different tile types and efficient rendering.

**Key Properties**:

- `tileSize` - Size of each tile in pixels (32, matching player size)
- `sprites` - Object storing tile sprite images
- `tiles` - Map storing tile data as "x,y" -> tileType
- `revealedTiles` - 2D array tracking which tiles are visible to the player

**Key Methods**:

- `loadSprites()` - Loads tile sprites (stone.png, coin.png, spike.png)
- `generateSampleTiles()` - Creates demo level with walls, coins, and spikes
- `generateMaze()` - Generates a maze using randomized depth-first search, sets up walls, air tiles, start/end flags, and revealed edges
- `setTile(x, y, tileType)` - Places/removes tiles at grid coordinates
- `getTile(x, y)` - Returns tile type at grid coordinates
- `worldToTile(worldX, worldY)` - Converts world position to tile coordinates
- `tileToWorld(tileX, tileY)` - Converts tile coordinates to world position
- `render(ctx, camera)` - Efficiently renders only visible and revealed tiles
- `renderTile(ctx, x, y, tileType)` - Renders individual tile with sprite or fallback

**Optimization**: Only renders tiles visible in current camera view to maintain performance.

### Constants (`constants.js`)

**TILE_TYPES Enum**:

- `AIR: 0` - Empty space (no tile)
- `STONE: 1` - Solid wall tile
- `COIN: 2` - Collectible coin tile
- `SPIKE: 3` - Hazard spike tile
- `START_FLAG: 4` - Starting point tile
- `END_FLAG: 5` - End point tile

## Rendering Pipeline

### Render Order (back to front):

1. **Background** - Solid black background
2. **Tiles** - Stone walls, coins, spikes from TileSystem (only revealed tiles)
3. **Light Overlay** - Glowing light effect centered on player
4. **Player** - Character sprite with animations

### Camera Transformations:

1. Clear canvas
2. Save context state
3. Apply zoom scaling
4. Apply camera translation
5. Render all world objects
6. Restore context state

## Input System

- **Movement**: WASD or Arrow Keys
- **Key Tracking**: `keys` object stores current pressed state
- **Events**: keydown/keyup listeners update key states
- **Processing**: Player.update() reads key states each frame

## Coordinate Systems

### World Coordinates

- Absolute positions in the game world
- Player and tiles use world coordinates
- Camera tracks world position

### Tile Coordinates

- Grid-based coordinates (0,0), (1,0), etc.
- Each tile is 32x32 pixels in world space
- Used for tile placement and collision detection

### Screen Coordinates

- Canvas pixel positions after camera transformation
- Handled automatically by canvas context transformations

## Visibility System

### Tile Revealing Mechanics

- **Wall Revealing**: Adjacent wall (STONE) tiles are automatically revealed as the player moves
- **Spike Revealing**: Spike tiles are only revealed after the player dies from stepping on them
- **Initial Visibility**: Only border walls and starting area are initially visible
- **Implementation**: Uses `revealedTiles` 2D array in `TileSystem` class to track visibility state
- **Rendering Control**: Only revealed tiles are rendered in the render method

## Performance Considerations

### Tile Culling

- Only renders tiles visible in camera viewport
- Calculates visible tile range based on camera position and zoom
- Prevents unnecessary rendering of off-screen tiles
- Further optimized by only rendering revealed tiles

### Sprite Loading

- Sprites loaded asynchronously
- Fallback colored rectangles while sprites load
- `sprite.complete` check before rendering

### Animation Efficiency

- Fixed 60 FPS delta time for consistent movement
- Animation timers only update when moving
- Efficient sprite selection logic

## Development Guidelines

### Adding New Tile Types

1. Add new constant to `TILE_TYPES` in `constants.js`
2. Add sprite loading in `TileSystem.loadSprites()`
3. Add fallback color in `getTileFallbackColor()`
4. Place tiles using `setTile()` method

### Adding New Player Features

- Modify `Player.update()` for new behaviors
- Add new sprites to `loadSprites()` if needed
- Update `getCurrentSprite()` for new animations
- Consider adding new properties for state tracking
- If changing collision behavior, update `hitboxWidth`/`hitboxHeight` and collision methods to match desired gameplay

### Camera Enhancements

- Adjust `zoom` property for different zoom levels
- Modify `smoothing` for different follow speeds
- Add camera bounds by modifying `follow()` method

### Performance Optimization

- Monitor tile render count in console
- Consider object pooling for frequent allocations
- Use requestAnimationFrame for smooth animation
- Implement frustum culling for complex scenes

## Common Patterns

### Entity Structure

All game entities should have:

- Position properties (x, y)
- Dimension properties (width, height)
- Update method for logic
- Render method for drawing

### Resource Loading

- Load assets asynchronously
- Provide fallback rendering
- Check `.complete` property before using images

### State Management

- Use boolean flags for simple states
- Use enums for multiple states
- Update state in update() methods
- React to state in render() methods

## Future Considerations

### Planned Features

- Collision detection between player and tiles
- Sound effects for interactions
- Multiple levels/maps
- Game state management (menu, game over, etc.)
- Save/load functionality

### Scalability

- Consider component-based entity system for complex entities
- Implement proper game state management
- Add level loading from external files
- Consider using TypeScript for better type safety

### Code Organization

- Keep classes focused on single responsibilities
- Use composition over inheritance
- Maintain clear separation between logic and rendering
- Document public APIs thoroughly
