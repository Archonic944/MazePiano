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
    this.isDead = false;
    this.deathTime = 0;
    this.deathFlashDuration = 0.3;
    this.role;
    this.socket;
    this.ready = false;
    this.direction = "down";
    this.isMoving = false;
    this.animationTime = 0;
    this.sprites = {};
    this.deathSound = new Audio("public/sounds/death_sfx.mp3");
    this.loadSprites();
    this.loadWebsockets();
  }

  loadSprites() {
    const spriteNames = [
      "idle_down",
      "idle_right",
      "idle_up",
      "walk_down",
      "walk_down_2",
      "walk_right_1",
      "walk_right_2",
      "walk_up_1",
      "walk_up_2",
    ];

    spriteNames.forEach((name) => {
      const img = new Image();
      img.src = `public/sprites/${name}.png`;
      this.sprites[name] = img;
    });
  }

  loadWebsockets() {
    this.socket = new WebSocket("/room/");

    this.socket.addEventListener("open", (event) => {
      this.ready = true;
    });

    this.socket.addEventListener("message", (e) => {
      const { event, data } = JSON.parse(e.data);
      switch (event) {
        case "role": {
          this.role = data;
          break;
        }
        case "location": {
          this.x = data.x;
          this.y = data.y;
          break;
        }
      }
    });
  }

  update(keys, tileSystem) {
    if (!this.role || !this.ready) {
      return;
    }
    const deltaTime = 1 / 60;
    this.isMoving = false;
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
    let dx = 0;
    let dy = 0;

    let goingUp;
    let goingDown;
    let goingLeft;
    let goingRight;

    if (this.role == "mover") {
      goingUp = keys["KeyW"] || keys["ArrowUp"];
      goingDown = keys["KeyS"] || keys["ArrowDown"];
      goingLeft = keys["KeyA"] || keys["ArrowLeft"];
      goingRight = keys["KeyD"] || keys["ArrowRight"];
    }

    if (this.role == "pianist") {
      return;
    }
    if (goingUp) {
      dy = -this.speed * deltaTime;
      this.direction = "up";
      this.isMoving = true;
    }
    if (goingDown) {
      dy = this.speed * deltaTime;
      this.direction = "down";
      this.isMoving = true;
    }
    if (goingLeft) {
      dx = -this.speed * deltaTime;
      this.direction = "left";
      this.isMoving = true;
    }
    if (goingRight) {
      dx = this.speed * deltaTime;
      this.direction = "right";
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
          adjX >= 0 &&
          adjX < tileSystem.revealedTiles.length &&
          adjY >= 0 &&
          adjY < tileSystem.revealedTiles[0].length
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

    this.socket.send(
      JSON.stringify({ event: "location", data: { x: this.x, y: this.y } })
    );
  }

  getCurrentSprite() {
    if (!this.isMoving) {
      if (this.direction === "left") {
        return this.sprites["idle_right"];
      }
      return (
        this.sprites[`idle_${this.direction}`] || this.sprites["idle_down"]
      );
    }

    const animFrame = Math.floor(this.animationTime) % 2;

    if (this.direction === "down") {
      return animFrame === 0
        ? this.sprites["walk_down"]
        : this.sprites["walk_down_2"];
    }
    if (this.direction === "up") {
      return animFrame === 0
        ? this.sprites["walk_up_1"]
        : this.sprites["walk_up_2"];
    }
    if (this.direction === "right") {
      return animFrame === 0
        ? this.sprites["walk_right_1"]
        : this.sprites["walk_right_2"];
    }
    if (this.direction === "left") {
      return animFrame === 0
        ? this.sprites["walk_right_1"]
        : this.sprites["walk_right_2"];
    }

    return this.sprites["idle_down"];
  }

  checkWallCollision(x, y, tileSystem) {
    // Check all four corners of the hitbox (smaller than sprite)
    const halfW = this.hitboxWidth / 2;
    const halfH = this.hitboxHeight / 2;
    const corners = [
      { x: x - halfW, y: y - halfH }, // Top-left
      { x: x + halfW, y: y - halfH }, // Top-right
      { x: x - halfW, y: y + halfH }, // Bottom-left
      { x: x + halfW, y: y + halfH }, // Bottom-right
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
    // Check player's hitbox center for spike collision
    const centerX = this.x;
    const centerY = this.y;
    const tilePos = tileSystem.worldToTile(centerX, centerY);
    const tileType = tileSystem.getTile(tilePos.x, tilePos.y);
    if (tileType === TILE_TYPES.SPIKE) {
      this.die();
    }
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
        tilePos.x >= 0 &&
        tilePos.x < tileSystem.revealedTiles.length &&
        tilePos.y >= 0 &&
        tilePos.y < tileSystem.revealedTiles[0].length
      ) {
        tileSystem.revealedTiles[tilePos.x][tilePos.y] = true;
      }
      this.die();
    }
  }

  die() {
    // Play death sound
    this.deathSound.currentTime = 0; // Reset sound to beginning
    this.deathSound
      .play()
      .catch((e) => console.log("Could not play death sound:", e));

    // Teleport back to spawn
    this.x = this.spawnX;
    this.y = this.spawnY;
  }

  render(ctx) {
    const sprite = this.getCurrentSprite();
    if (sprite && sprite.complete) {
      ctx.save();
      // Center sprite on hitbox
      if (this.direction === "left") {
        ctx.scale(-1, 1);
        ctx.drawImage(
          sprite,
          -this.x - this.width / 2,
          this.y - this.height / 2,
          this.width,
          this.height
        );
      } else {
        ctx.drawImage(
          sprite,
          this.x - this.width / 2,
          this.y - this.height / 2,
          this.width,
          this.height
        );
      }
      ctx.restore();
    } else {
      ctx.fillStyle = "#ff6b6b";
      ctx.fillRect(
        this.x - this.width / 2,
        this.y - this.height / 2,
        this.width,
        this.height
      );
    }
  }
  render(ctx) {
    const sprite = this.getCurrentSprite();

    if (this.isDead) {
      ctx.save();
      // Draw red overlay for death effect
      ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
      const screenSize = 2000; // Large enough to cover screen
      ctx.fillRect(
        this.x - screenSize / 2,
        this.y - screenSize / 2,
        screenSize,
        screenSize
      );

      if (sprite && sprite.complete) {
        if (this.direction === "left") {
          ctx.scale(-1, 1);
          ctx.drawImage(
            sprite,
            -this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
          );
        } else {
          ctx.drawImage(
            sprite,
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
          );
        }
      } else {
        ctx.fillStyle = "#ff6b6b";
        ctx.fillRect(
          this.x - this.width / 2,
          this.y - this.height / 2,
          this.width,
          this.height
        );
      }
      ctx.restore();
      return;
    }

    if (sprite && sprite.complete) {
      ctx.save();
      // Center sprite on hitbox
      if (this.direction === "left") {
        ctx.scale(-1, 1);
        ctx.drawImage(
          sprite,
          -this.x - this.width / 2,
          this.y - this.height / 2,
          this.width,
          this.height
        );
      } else {
        ctx.drawImage(
          sprite,
          this.x - this.width / 2,
          this.y - this.height / 2,
          this.width,
          this.height
        );
      }
      ctx.restore();
    } else {
      ctx.fillStyle = "#ff6b6b";
      ctx.fillRect(
        this.x - this.width / 2,
        this.y - this.height / 2,
        this.width,
        this.height
      );
    }
  }
}
