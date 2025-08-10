const canvas = document.getElementById("gameCanvas");
console.log("hello gabe");
const ctx = canvas.getContext("2d");
var socket;
var role;
var ready = false;

class Game {
  constructor() {
    // Pre-initialize properties used later to avoid undefined access
    this.camera = null;
    this.tileSystem = null;
    this.player = null;
    this.piano = null;
    this.keys = {};
    this.lightOverlay = null;
    this.coinCount = 0;
    this.coinSound = null;
    this._wasDead = false;

    // Load websockets
    socket = new WebSocket("/room/");

    socket.addEventListener("message", (e) => {
      const { event, data } = JSON.parse(e.data);
      switch (event) {
        case "init": {
          role = data.role;

          console.log(data);
          // If server provided a tile system snapshot, hydrate a real instance
          if (data.tileSystem) {
            this.tileSystem = new TileSystem(data.tileSystem);
            if (role == "pianist") {
              console.log("Revealing all tiles for pianist");
              this.tileSystem.revealedTiles = Array.from(
                { length: CHAMBER_WIDTH },
                () => Array(CHAMBER_HEIGHT).fill(true)
              );
            }
          }
          ready = true;
          this.init();
          break;
        }
        case "location": {
          this.player.x = data.x;
          this.player.y = data.y;
          break;
        }
      }
    });
  }

  init() {
    this.camera = new Camera();
    console.log(role);
    if (role === "mover" && !this.tileSystem) {
      console.log("here");
      this.tileSystem = new TileSystem();
      // Send only serializable state; avoid sending class instance with methods
      socket.send(
        JSON.stringify({ event: "tilemap", data: this.tileSystem.getState() })
      );
    }
    this.player = new Player(
      this.tileSystem.tileToWorld(1, 1, true).x,
      this.tileSystem.tileToWorld(1, 1, true).y
    );
    this.keys = {};

    // Initialize piano only for pianist role
    if (role === "pianist") {
      this.piano = new Piano();
    }

    this.lightOverlay = new Image();
    this.lightOverlay.src = "public/sprites/light_overlay_pngtree.png";
    // HUD / coins
    this.coinCount = 0;
    this.coinSound = new Audio("public/sounds/coin_sfx.mp3");
    this._wasDead = false;
    this.bindEvents();
    this.gameLoop();
  }

  bindEvents() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;

      // Handle piano input for pianist role
      if (role === "pianist" && this.piano) {
        this.piano.handleKeyDown(e.code);
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;

      // Handle piano input for pianist role
      if (role === "pianist" && this.piano) {
        this.piano.handleKeyUp(e.code);
      }
    });
  }

  update() {
    this.player.update(this.keys, this.tileSystem);
    this.camera.follow(this.player);

    // Handle coin pickup when player overlaps a coin tile
    const centerTile = this.tileSystem.worldToTile(
      this.player.x,
      this.player.y
    );
    if (
      this.tileSystem.getTile(centerTile.x, centerTile.y) === TILE_TYPES.COIN
    ) {
      this.tileSystem.setTile(centerTile.x, centerTile.y, TILE_TYPES.AIR);
      this.coinCount += 1;
      try {
        this.coinSound.currentTime = 0;
        this.coinSound.play();
      } catch {}
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

    // Render piano for pianist role
    if (role === "pianist" && this.piano) {
      this.renderPiano();
    }
  }

  renderCoinCounter() {
    // Draw coin icon and count in top-right of the canvas (screen space)
    const padding = 16;
    const iconSize = 28;
    const y = padding;
    const text = "x " + this.coinCount;

    // Reset transform to screen space
    if (ctx.resetTransform) ctx.resetTransform();
    else ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.font = "bold 20px Arial";
    ctx.textBaseline = "middle";

    const textWidth = ctx.measureText(text).width;
    const spacing = 8;
    // Position so that [icon][space][text] touches right padding
    const iconX = canvas.width - padding - textWidth - spacing - iconSize;
    const textX = iconX + iconSize + spacing;

    const coinSprite = this.tileSystem.sprites[TILE_TYPES.COIN];
    if (coinSprite && coinSprite.complete) {
      ctx.drawImage(coinSprite, iconX, y, iconSize, iconSize);
    } else {
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(iconX, y, iconSize, iconSize);
    }
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(text, textX, y + iconSize / 2);
  }

  renderPiano() {
    // Reset transform to screen space
    if (ctx.resetTransform) ctx.resetTransform();
    else ctx.setTransform(1, 0, 0, 1, 0, 0);

    const pianoHeight = 80;
    const pianoY = canvas.height - pianoHeight;
    const keyWidth = 30;
    const blackKeyWidth = 20;
    const blackKeyHeight = 50;

    // Get currently active notes
    const activeNotes = this.piano.getActiveNotes();

    // White keys layout
    const whiteKeys = [
      "C3",
      "D3",
      "E3",
      "F3",
      "G3",
      "A3",
      "B3",
      "C4",
      "D4",
      "E4",
      "F4",
      "G4",
      "A4",
      "B4",
    ];
    const blackKeyPositions = [
      0.7, 1.7, 3.7, 4.7, 5.7, 7.7, 8.7, 10.7, 11.7, 12.7,
    ]; // Relative to white keys
    const blackKeys = [
      "Csharp3",
      "Dsharp3",
      "Fsharp3",
      "Gsharp3",
      "Asharp3",
      "Csharp4",
      "Dsharp4",
      "Fsharp4",
      "Gsharp4",
      "Asharp4",
    ];

    const startX = (canvas.width - whiteKeys.length * keyWidth) / 2;

    // Draw white keys
    whiteKeys.forEach((note, index) => {
      const x = startX + index * keyWidth;
      const isActive = activeNotes.includes(note);

      ctx.fillStyle = isActive ? "#e0e0e0" : "#ffffff";
      ctx.fillRect(x, pianoY, keyWidth - 1, pianoHeight);

      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, pianoY, keyWidth - 1, pianoHeight);

      // Draw note label
      ctx.fillStyle = "#000000";
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(note, x + keyWidth / 2, pianoY + pianoHeight - 8);
    });

    // Draw black keys
    blackKeys.forEach((note, index) => {
      const x =
        startX + blackKeyPositions[index] * keyWidth - blackKeyWidth / 2;
      const isActive = activeNotes.includes(note);

      ctx.fillStyle = isActive ? "#333333" : "#000000";
      ctx.fillRect(x, pianoY, blackKeyWidth, blackKeyHeight);

      // Draw note label
      ctx.fillStyle = "#ffffff";
      ctx.font = "8px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        note.replace("sharp", "#"),
        x + blackKeyWidth / 2,
        pianoY + blackKeyHeight - 8
      );
    });

    // Draw piano instructions
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.fillText(
      "Piano: zxcvbnm (white), sdghj (black), qwertyui (white oct4), 23567 (black oct4)",
      10,
      pianoY - 10
    );
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
    ctx.fillStyle = "#000";
    ctx.fillRect(
      this.camera.x,
      this.camera.y,
      canvas.width / this.camera.zoom,
      canvas.height / this.camera.zoom
    );
  }

  gameLoop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
}

const game = new Game();
