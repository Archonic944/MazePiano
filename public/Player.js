class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.spawnX = x;
        this.spawnY = y;
        this.width = 32; // Sprite size
        this.height = 32;
        this.hitboxWidth = 20; // Hitbox size
        this.hitboxHeight = 20;
        this.speed = 270;
        this.direction = 'down';
        this.isMoving = false;
        this.animationTime = 0;
        this.isDead = false;
        this.deathTime = 0;
        this.deathFlashDuration = 0.3;
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
        
        if (this.isDead) {
            this.deathTime += deltaTime;
            if (this.deathTime >= this.deathFlashDuration) {
                this.isDead = false;
                this.deathTime = 0;
                this.x = this.spawnX;
                this.y = this.spawnY;
            }
            return; // Skip normal update during death animation
        }
        
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

        // Reveal adjacent wall tiles while moving
        if (this.isMoving) {
            const tilePos = tileSystem.worldToTile(this.x, this.y);
            for (let i = 0; i < 4; i++) {
                const adjX = tilePos.x + vectors[i][0];
                const adjY = tilePos.y + vectors[i][1];
                if (
                    adjX >= 0 && adjX < tileSystem.revealedTiles.length &&
                    adjY >= 0 && adjY < tileSystem.revealedTiles[0].length
                ) {
                    if (tileSystem.getTile(adjX, adjY) === TILE_TYPES.STONE) {
                        tileSystem.revealedTiles[adjX][adjY] = true;
                    }
                }
            }
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
        // Check all four corners of the hitbox (smaller than sprite)
        const halfW = this.hitboxWidth / 2;
        const halfH = this.hitboxHeight / 2;
        const corners = [
            { x: x - halfW, y: y - halfH }, // Top-left
            { x: x + halfW, y: y - halfH }, // Top-right
            { x: x - halfW, y: y + halfH }, // Bottom-left
            { x: x + halfW, y: y + halfH } // Bottom-right
        ];
        for (let corner of corners) {
            const tilePos = tileSystem.worldToTile(corner.x, corner.y);
            const tileType = tileSystem.getTile(tilePos.x, tilePos.y);
            if (tileType === TILE_TYPES.STONE) {
                return true; // Collision detected
            }
        }
        return false;
    }

    checkSpikeCollision(tileSystem) {
        // Skip collision check if already dead
        if (this.isDead) return;
        
        const centerX = this.x;
        const centerY = this.y;
        const tilePos = tileSystem.worldToTile(centerX, centerY);
        const tileType = tileSystem.getTile(tilePos.x, tilePos.y);
        if (tileType === TILE_TYPES.SPIKE) {
            // Reveal spike tile only after collision
            if (
                tilePos.x >= 0 && tilePos.x < tileSystem.revealedTiles.length &&
                tilePos.y >= 0 && tilePos.y < tileSystem.revealedTiles[0].length
            ) {
                tileSystem.revealedTiles[tilePos.x][tilePos.y] = true;
            }
            this.die();
        }
    }

    die() {
        // Skip if already dead to prevent repeated calls
        if (this.isDead) return;
        
        // Set death state
        this.isDead = true;
        this.deathTime = 0;
        
        // Play death sound
        this.deathSound.currentTime = 0; // Reset sound to beginning
        this.deathSound.play().catch(e => console.log('Could not play death sound:', e));
    }

    render(ctx) {
        const sprite = this.getCurrentSprite();
        
        if (this.isDead) {
            ctx.save();
            // Draw red overlay for death effect
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            const screenSize = 2000; // Large enough to cover screen
            ctx.fillRect(
                this.x - screenSize/2,
                this.y - screenSize/2,
                screenSize,
                screenSize
            );
            
            if (sprite && sprite.complete) {
                if (this.direction === 'left') {
                    ctx.scale(-1, 1);
                    ctx.drawImage(sprite, -this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
                } else {
                    ctx.drawImage(sprite, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
                }
            } else {
                ctx.fillStyle = '#ff6b6b';
                ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
            }
            ctx.restore();
            return;
        }
        
        if (sprite && sprite.complete) {
            ctx.save();
            // Center sprite on hitbox
            if (this.direction === 'left') {
                ctx.scale(-1, 1);
                ctx.drawImage(sprite, -this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
            } else {
                ctx.drawImage(sprite, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
            }
            ctx.restore();
        } else {
            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
    }
}
