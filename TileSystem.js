class TileSystem {
    constructor() {
        this.tileSize = 32; // Same as player width/height
        this.sprites = {};
        this.tiles = {}; // Will store tiles as "x,y" -> tileType
        this.loadSprites();
        this.generateSampleTiles();
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
