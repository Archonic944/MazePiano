const CHAMBER_WIDTH = 100;
const CHAMBER_HEIGHT = 50;

class TileSystem {
    constructor() {
        this.tileSize = 32; // Same as player width/height
        this.sprites = {};
        this.tiles = {}; // Will store tiles as "x,y" -> tileType
        this.loadSprites();
        // this.generateSampleTiles();
        this.generateMaze();
    }

    loadSprites() {
        const spriteData = [
            { type: TILE_TYPES.STONE, filename: 'stone.png' },
            { type: TILE_TYPES.COIN, filename: 'coin.png' },
            { type: TILE_TYPES.SPIKE, filename: 'spike.png' }
        ];

        spriteData.forEach(data => {
            const img = new Image();
            img.src = `public/sprites/${data.filename}`;
            this.sprites[data.type] = img;
        });
    }

    

    generateMaze() {
        // Recursive division
        /* From wikipedia:
        Mazes can be created with recursive division, an algorithm which works as follows: 
        Begin with the maze's space with no walls. Call this a chamber. 
        Divide the chamber with a randomly positioned wall (or multiple walls) where each wall contains a 
        randomly positioned passage opening within it. 
        Then recursively repeat the process on the subchambers until all chambers are minimum sized. 

For example, in a rectangular maze, build at random points two walls that are perpendicular to each other. 
These two walls divide the large chamber into four smaller chambers separated by four walls. 
Choose three of the four walls at random, and open a one cell-wide hole at a random point in each of the three. 
Continue in this manner recursively, until every chamber has a width of one cell in either of the two directions. 
        */
        for(let x = 0; x < CHAMBER_WIDTH; x++) {
            this.setTile(x, 0, TILE_TYPES.STONE);
            this.setTile(x, CHAMBER_HEIGHT, TILE_TYPES.STONE);
        }
        for(let y = 0; y < CHAMBER_HEIGHT; y++) {
            this.setTile(0, y, TILE_TYPES.STONE);
            this.setTile(CHAMBER_WIDTH, y, TILE_TYPES.STONE);
        }
        this.setTile(CHAMBER_WIDTH, CHAMBER_HEIGHT, TILE_TYPES.STONE); // Bottom right corner
        this.divideChamber(0, 0, CHAMBER_WIDTH, CHAMBER_HEIGHT);
    }

    // Returns the result of randomly dividing this chamber in the form of 4 chambers: 4([x1,y1,x2,y2])
    // where x1,y1 is the top left corner and x2,y2 is the bottom right corner
    // If the chamber is too small, returns false
    // Also pokes a hole in three of the four walls
    divideChamber(x1, y1, x2, y2){
        if (x2 - x1 < 3 || y2 - y1 < 3) return false;
        let randY = Math.floor(Math.random() * (y2 - y1 - 2)) + y1 + 2;
        let randX = Math.floor(Math.random() * (x2 - x1 - 2)) + x1 + 2;
        let randomHoleLocations = [
            [Math.floor(Math.random() * (x2 - x1 - 2)) + x1 + 2, randY],
            [randX, Math.floor(Math.random() * (y2 - y1 - 2)) + y1 + 2],
            [Math.floor(Math.random() * (x2 - x1 - 2)) + x1 + 2, randY],
            [randX, Math.floor(Math.random() * (y2 - y1 - 2)) + y1 + 2]
        ];
        console.log(randomHoleLocations[0][0], randomHoleLocations[0][1], randomHoleLocations[1][0], randomHoleLocations[1][1], randomHoleLocations[2][0], randomHoleLocations[2][1], randomHoleLocations[3][0], randomHoleLocations[3][1]);
        randomHoleLocations.splice(Math.floor(Math.random() * 4), 1);
        const isHoleLocation = (x, y) => {
        return randomHoleLocations.some(hole => hole[0] === x && hole[1] === y);
    };
    
    for(let x = x1; x <= x2; x++){
        console.log(x, randY);
        if(isHoleLocation(x, randY)){
           console.log("random hole locations includes ", x, randY);
           continue;
        }else{
            console.log("random hole locations does not include ", x, randY);
        }
        this.setTile(x, randY, TILE_TYPES.STONE);
    }
    for(let y = y1; y <= y2; y++){
        console.log(randX, y);
        if(isHoleLocation(randX, y)) continue;
        this.setTile(randX, y, TILE_TYPES.STONE);
    }
        return [
            [x1, y1, randX, randY], // Top left
            [randX, y1, x2, randY], // Top right
            [x1, randY, randX, y2], // Bottom left
            [randX, randY, x2, y2]  // Bottom right
        ];
    }


    generateSampleTiles() {
        // Create a simple pattern of tiles for demonstration
        // Stone walls
        for (let x = 5; x < 15; x++) {
            this.setTile(x, 5, TILE_TYPES.STONE);
            this.setTile(x, 15, TILE_TYPES.STONE);
        }
        for (let y = 5; y < 15; y++) {
            this.setTile(5, y, TILE_TYPES.STONE);
            this.setTile(15, y, TILE_TYPES.STONE);
        }

        // Some coins
        this.setTile(8, 8, TILE_TYPES.COIN);
        this.setTile(12, 8, TILE_TYPES.COIN);
        this.setTile(8, 12, TILE_TYPES.COIN);
        this.setTile(12, 12, TILE_TYPES.COIN);

        // Some spikes
        this.setTile(10, 7, TILE_TYPES.SPIKE);
        this.setTile(10, 13, TILE_TYPES.SPIKE);
        this.setTile(7, 10, TILE_TYPES.SPIKE);
        this.setTile(13, 10, TILE_TYPES.SPIKE);
    }

    setTile(x, y, tileType) {
        const key = `${x},${y}`;
        if (tileType === TILE_TYPES.AIR) {
            delete this.tiles[key];
        } else {
            this.tiles[key] = tileType;
        }
    }

    getTile(x, y) {
        const key = `${x},${y}`;
        return this.tiles[key] || TILE_TYPES.AIR;
    }

    worldToTile(worldX, worldY) {
        return {
            x: Math.floor(worldX / this.tileSize),
            y: Math.floor(worldY / this.tileSize)
        };
    }

    tileToWorld(tileX, tileY) {
        return {
            x: tileX * this.tileSize,
            y: tileY * this.tileSize
        };
    }

    render(ctx, camera) {
        // Calculate visible tile range accounting for zoom
        const visibleWidth = canvas.width / camera.zoom;
        const visibleHeight = canvas.height / camera.zoom;
        
        const startTileX = Math.floor(camera.x / this.tileSize) - 1;
        const startTileY = Math.floor(camera.y / this.tileSize) - 1;
        const endTileX = startTileX + Math.ceil(visibleWidth / this.tileSize) + 2;
        const endTileY = startTileY + Math.ceil(visibleHeight / this.tileSize) + 2;

        // Render only visible tiles
        for (let tileX = startTileX; tileX <= endTileX; tileX++) {
            for (let tileY = startTileY; tileY <= endTileY; tileY++) {
                const tileType = this.getTile(tileX, tileY);
                
                if (tileType !== TILE_TYPES.AIR) {
                    const worldPos = this.tileToWorld(tileX, tileY);
                    this.renderTile(ctx, worldPos.x, worldPos.y, tileType);
                }
            }
        }
    }

    renderTile(ctx, x, y, tileType) {
        const sprite = this.sprites[tileType];
        
        if (sprite && sprite.complete) {
            ctx.drawImage(sprite, x, y, this.tileSize, this.tileSize);
        } else {
            // Fallback rendering if sprite isn't loaded
            ctx.fillStyle = this.getTileFallbackColor(tileType);
            ctx.fillRect(x, y, this.tileSize, this.tileSize);
        }
    }

    getTileFallbackColor(tileType) {
        switch (tileType) {
            case TILE_TYPES.STONE: return '#666';
            case TILE_TYPES.COIN: return '#ffd700';
            case TILE_TYPES.SPIKE: return '#ff4444';
            default: return '#fff';
        }
    }
}
