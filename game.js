const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

class Game {
    constructor() {
        this.player = new Player(400, 300);
        this.camera = new Camera();
        this.keys = {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.gameLoop();
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    update() {
        this.player.update(this.keys);
        this.camera.follow(this.player);
    }

    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);
        
        this.renderBackground();
        this.player.render(ctx);
        
        ctx.restore();
    }

    renderBackground() {
        const tileSize = 64;
        const startX = Math.floor(this.camera.x / tileSize) * tileSize;
        const startY = Math.floor(this.camera.y / tileSize) * tileSize;
        const endX = startX + canvas.width + tileSize;
        const endY = startY + canvas.height + tileSize;

        ctx.fillStyle = '#2a2a2a';
        for (let x = startX; x < endX; x += tileSize) {
            for (let y = startY; y < endY; y += tileSize) {
                ctx.fillRect(x, y, tileSize, tileSize);
                ctx.strokeStyle = '#444';
                ctx.strokeRect(x, y, tileSize, tileSize);
            }
        }
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

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

class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.smoothing = 0.1;
    }

    follow(target) {
        const targetX = target.x + target.width / 2 - canvas.width / 2;
        const targetY = target.y + target.height / 2 - canvas.height / 2;

        this.x += (targetX - this.x) * this.smoothing;
        this.y += (targetY - this.y) * this.smoothing;
    }
}

const game = new Game();
