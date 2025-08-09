const canvas = document.getElementById('gameCanvas');
console.log("hello gabe")
const ctx = canvas.getContext('2d');

class Game {
    constructor() {
        this.camera = new Camera();
        this.tileSystem = new TileSystem();
        this.player = new Player(this.tileSystem.tileToWorld(1, 1, true).x, this.tileSystem.tileToWorld(1, 1, true).y);
        this.keys = {};
        this.lightOverlay = new Image();
        this.lightOverlay.src = 'public/sprites/light_overlay_pngtree.png';
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
        this.renderLightOverlay();
        this.player.render(ctx);
        
        ctx.restore();
    }

    renderLightOverlay() {
        if (this.lightOverlay && this.lightOverlay.complete) {
            // Center overlay on player
            const overlaySize = 192;
            ctx.save();
            ctx.globalAlpha = 0.7; // Slight transparency
            ctx.drawImage(
                this.lightOverlay,
                this.player.x - overlaySize / 2,
                this.player.y - overlaySize / 2,
                overlaySize,
                overlaySize
            );
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }
    }

    renderBackground() {
        ctx.fillStyle = '#000';
        ctx.fillRect(this.camera.x, this.camera.y, canvas.width / this.camera.zoom, canvas.height / this.camera.zoom);
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

const game = new Game();
