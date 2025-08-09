class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.spawnX = x;
        this.spawnY = y;
        this.width = 32;
        this.height = 32;
        this.speed = 200;
        this.direction = 'down';
        this.isMoving = false;
        this.animationTime = 0;
        this.sprites = {};
        this.deathSound = new Audio('public/sounds/death_sfx.mp3');
        this.loadSprites();
    }

    loadSprites() {
        const spriteNames = [
            'idle_down', 'idle_right', 'idle_up',
            'walk_down', 'walk_down_2',
            'walk_right_1', 'walk_right_2',
            'walk_up_1', 'walk_up_2'
        ];

        spriteNames.forEach(name => {
            const img = new Image();
            img.src = `public/sprites/${name}.png`;
            this.sprites[name] = img;
        });
    }

    update(keys, tileSystem) {
        const deltaTime = 1/60;
        this.isMoving = false;

        let dx = 0;
        let dy = 0;

        if (keys['KeyW'] || keys['ArrowUp']) {
            dy = -this.speed * deltaTime;
            this.direction = 'up';
            this.isMoving = true;
        }
        if (keys['KeyS'] || keys['ArrowDown']) {
            dy = this.speed * deltaTime;
            this.direction = 'down';
            this.isMoving = true;
        }
        if (keys['KeyA'] || keys['ArrowLeft']) {
            dx = -this.speed * deltaTime;
            this.direction = 'left';
            this.isMoving = true;
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
            dx = this.speed * deltaTime;
            this.direction = 'right';
            this.isMoving = true;
        }

        // Check collision before moving
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        if (!this.checkWallCollision(newX, this.y, tileSystem)) {
            this.x = newX;
        }
        if (!this.checkWallCollision(this.x, newY, tileSystem)) {
            this.y = newY;
        }

        // Check for spike collision after movement
        this.checkSpikeCollision(tileSystem);

        if (this.isMoving) {
            this.animationTime += deltaTime * 8;
        } else {
            this.animationTime = 0;
        }
    }

    getCurrentSprite() {
        if (!this.isMoving) {
            if (this.direction === 'left') {
                return this.sprites['idle_right'];
            }
            return this.sprites[`idle_${this.direction}`] || this.sprites['idle_down'];
        }

        const animFrame = Math.floor(this.animationTime) % 2;
        
        if (this.direction === 'down') {
            return animFrame === 0 ? this.sprites['walk_down'] : this.sprites['walk_down_2'];
        }
        if (this.direction === 'up') {
            return animFrame === 0 ? this.sprites['walk_up_1'] : this.sprites['walk_up_2'];
        }
        if (this.direction === 'right') {
            return animFrame === 0 ? this.sprites['walk_right_1'] : this.sprites['walk_right_2'];
        }
        if (this.direction === 'left') {
            return animFrame === 0 ? this.sprites['walk_right_1'] : this.sprites['walk_right_2'];
        }

        return this.sprites['idle_down'];
    }

    checkWallCollision(x, y, tileSystem) {
        // Check all four corners of the player
        const corners = [
            { x: x, y: y }, // Top-left
            { x: x + this.width - 1, y: y }, // Top-right
            { x: x, y: y + this.height - 1 }, // Bottom-left
            { x: x + this.width - 1, y: y + this.height - 1 } // Bottom-right
        ];

        for (let corner of corners) {
            const tilePos = tileSystem.worldToTile(corner.x, corner.y);
            const tileType = tileSystem.getTile(tilePos.x, tilePos.y);
            
            if (tileType === TILE_TYPES.STONE) {
                return true; // Collision detected
            }
        }
        
        return false; // No collision
    }

    checkSpikeCollision(tileSystem) {
        // Check player's center position for spike collision
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const tilePos = tileSystem.worldToTile(centerX, centerY);
        const tileType = tileSystem.getTile(tilePos.x, tilePos.y);
        
        if (tileType === TILE_TYPES.SPIKE) {
            this.die();
        }
    }

    die() {
        // Play death sound
        this.deathSound.currentTime = 0; // Reset sound to beginning
        this.deathSound.play().catch(e => console.log('Could not play death sound:', e));
        
        // Teleport back to spawn
        this.x = this.spawnX;
        this.y = this.spawnY;
    }

    render(ctx) {
        const sprite = this.getCurrentSprite();
        if (sprite && sprite.complete) {
            ctx.save();
            
            if (this.direction === 'left') {
                ctx.scale(-1, 1);
                ctx.drawImage(sprite, -this.x - this.width, this.y, this.width, this.height);
            } else {
                ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
            }
            
            ctx.restore();
        } else {
            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}
