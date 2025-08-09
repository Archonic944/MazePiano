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
    // HUD / coins
    this.coinCount = 0;
    this.coinSound = new Audio('public/sounds/coin_sfx.mp3');
    this._wasDead = false;
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

        // Handle coin pickup when player overlaps a coin tile
        const centerTile = this.tileSystem.worldToTile(this.player.x, this.player.y);
        if (this.tileSystem.getTile(centerTile.x, centerTile.y) === TILE_TYPES.COIN) {
            this.tileSystem.setTile(centerTile.x, centerTile.y, TILE_TYPES.AIR);
            this.coinCount += 1;
            try { this.coinSound.currentTime = 0; this.coinSound.play(); } catch {}
        }

        // Reset coin counter on death (edge-triggered)
        if (!this._wasDead && this.player.isDead) {
            this.coinCount = 0;
        }
        this._wasDead = this.player.isDead;
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

        // HUD overlay
        this.renderCoinCounter();
    }

    renderCoinCounter() {
        // Draw coin icon and count in top-right of the canvas (screen space)
        const padding = 16;
        const iconSize = 28;
        const y = padding;
        const text = 'x ' + this.coinCount;

        // Reset transform to screen space
        if (ctx.resetTransform) ctx.resetTransform();
        else ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.font = 'bold 20px Arial';
        ctx.textBaseline = 'middle';

        const textWidth = ctx.measureText(text).width;
        const spacing = 8;
        // Position so that [icon][space][text] touches right padding
        const iconX = canvas.width - padding - textWidth - spacing - iconSize;
        const textX = iconX + iconSize + spacing;

        const coinSprite = this.tileSystem.sprites[TILE_TYPES.COIN];
        if (coinSprite && coinSprite.complete) {
            ctx.drawImage(coinSprite, iconX, y, iconSize, iconSize);
        } else {
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(iconX, y, iconSize, iconSize);
        }
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(text, textX, y + iconSize / 2);
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
