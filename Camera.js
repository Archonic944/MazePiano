class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        //this.zoom = 1.5;
        this.zoom = 0.3; //debug
        this.smoothing = 0.1;
    }

    follow(target) {
        const targetX = target.x + target.width / 2 - (canvas.width / this.zoom) / 2;
        const targetY = target.y + target.height / 2 - (canvas.height / this.zoom) / 2;

        this.x += (targetX - this.x) * this.smoothing;
        this.y += (targetY - this.y) * this.smoothing;
    }
}
