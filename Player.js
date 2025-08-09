class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.speed = 200;
        this.direction = 'down';
        this.isMoving = false;
        this.animationTime = 0;
        this.sprites = {};
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

    update(keys) {
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

        this.x += dx;
        this.y += dy;

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
