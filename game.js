const canvas = document.getElementById('gameCanvas');
console.log("hello gabe")
const ctx = canvas.getContext('2d');

class Game {
    constructor() {
        this.player = new Player(400, 300);
        this.camera = new Camera();
        this.tileSystem = new TileSystem();
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
        this.player.update(this.keys, this.tileSystem);
        this.camera.follow(this.player);
    }

    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);
        
        this.renderBackground();
        this.tileSystem.render(ctx, this.camera);
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

const game = new Game();
