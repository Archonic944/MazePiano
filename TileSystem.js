const CHAMBER_WIDTH = 99;
const CHAMBER_HEIGHT = 49;

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
        // Fill chamber with stone
        for (let x = 0; x < CHAMBER_WIDTH; x++) {
            for(let y = 0; y<CHAMBER_HEIGHT; y++){
                this.setTile(x, y, TILE_TYPES.STONE);
            }
        }

        let getAdjacent = function(tile){ // Times two because air tiles are at odd coordinates
            const [x, y] = tile;
            return [
                [x + 2, y],
                [x, y + 2],
                [x - 2, y],
                [x, y - 2]
            ]
        }

        let filterTile = function(tile){ // Filter by in bounds and not visited
            const [x, y] = tile;
            return (
                x >= 0 && x < CHAMBER_WIDTH &&
                y >= 0 && y < CHAMBER_HEIGHT &&
                !visited[x][y]
            );
        }

        let vectors = [
            [1, 0], 
            [0, 1],
            [-1, 0],
            [0, -1]
        ]
        
        // Create evenly spaced holes - first hole is at (1,1), not (0,0)
        for(let x = 1; x < CHAMBER_WIDTH - 1; x+=2){
            for(let y = 1; y < CHAMBER_HEIGHT - 1; y+=2){
                this.setTile(x, y, TILE_TYPES.AIR);
            }
        }
        let visited = Array.from({ length: CHAMBER_WIDTH }, () => Array(CHAMBER_HEIGHT).fill(false)); // this is AI i have no idea why it works
        let initialCell = [1,1];
        visited[initialCell[0]][initialCell[1]] = true;
        let stack = [initialCell];
        outer: while(stack.length > 0) {
            let current = stack.pop();
            let adjacent = getAdjacent(current);
            let index = Math.floor(Math.random() * adjacent.length);
            let skipCount = 0;
            while(!filterTile(adjacent[index])) {
                index = (index + 1) % adjacent.length;
                skipCount++;
                if(skipCount >= adjacent.length) {
                    continue outer; // No valid adjacent tiles, skip to next iteration
                }
            }
            stack.push(current);
            let next = adjacent[index];
            visited[next[0]][next[1]] = true;
            stack.push(next);
            let vec = vectors[index];
            this.setTile(next[0] - vec[0], next[1] - vec[1], TILE_TYPES.AIR);
        }
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
