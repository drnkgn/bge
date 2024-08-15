class Vec2 {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    add(o: Vec2): Vec2 {
        return new Vec2(this.x + o.x, this.y + o.y);
    }

    sub(o: Vec2): Vec2 {
        return new Vec2(this.x - o.x, this.y - o.y);
    }

    dot(o: Vec2): number {
        return this.x*o.x + this.y*o.y;
    }

    norm(): Vec2 {
        let length = Math.sqrt(this.x * this.x + this.y * this.y);
        return new Vec2(this.x / length, this.y / length);
    }

    scale(s: number): Vec2 {
        return new Vec2(this.x * s, this.y * s);
    }

    rotate(d: number): Vec2 {
        return new Vec2(
            Math.cos(d)*this.x - Math.sin(d)*this.y,
            Math.sin(d)*this.x + Math.cos(d)*this.y
        );
    }
};

class Rect {
    pos: Vec2;
    width: number;
    height: number;
    center: Vec2;
    angle: number;
    color: string;

    constructor(
        x: number, y: number,
        width: number, height: number,
        color: string = "rgb(255 0 0)"
    ) {
        this.pos = new Vec2(x, y);
        this.width = width;
        this.height = height;
        this.center = new Vec2(
            this.pos.x + this.width*0.5,
            this.pos.y + this.height*0.5
        );
        this.color = color;
        this.angle = 0;
    }

    rotate(angle: number) {
        this.angle = angle * (Math.PI/180);
    }

    getAxes(): Vec2[] {
        let corners = this.getCorners();
        return [
            corners[0].sub(corners[1]).norm(),
            corners[1].sub(corners[2]).norm()
        ];
    }

    getCorners(): Vec2[] {
        let corners = [
            new Vec2(this.pos.x, this.pos.y),
            new Vec2(this.pos.x + this.width, this.pos.y),
            new Vec2(this.pos.x + this.width, this.pos.y + this.height),
            new Vec2(this.pos.x, this.pos.y + this.height)
        ];
        corners = corners.map((corner) =>
            corner.sub(this.center)
                  .rotate(this.angle)
                  .add(this.center)
        );

        return corners;
    }

    collidesWith(o: Rect): boolean {
        let axes = [...this.getAxes(), ...o.getAxes()];
        let ret = true;
        for (let axis of axes) {
            let proj1 = this.getCorners()
                            .map((v: Vec2) => v.dot(axis));
            let proj2 = o.getCorners()
                            .map((v: Vec2) => v.dot(axis));

            let minProj1 = Math.min(...proj1);
            let minProj2 = Math.min(...proj2);
            let maxProj1 = Math.max(...proj1);
            let maxProj2 = Math.max(...proj2);

            ret = ret && !(maxProj2 < minProj1 || maxProj1 < minProj2);
        }

        return ret;
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.save();

        ctx.translate(this.center.x, this.center.y);
        ctx.rotate(this.angle);
        ctx.translate(-this.center.x, -this.center.y);

        ctx.fillStyle = `${this.color}`;
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);

        ctx.restore();
    }
}

function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;
    let scaleY = canvas.height / rect.height;

    return new Vec2(
        (evt.clientX - rect.left) * scaleX,
        (evt.clientY - rect.top) * scaleY
    );
}

const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const ctx = canvas?.getContext("2d")!;

canvas.width = 400;
canvas.height = 400;

const GRAVITY = 20;
const GROUND_ACCEL = 10;
const GROUND_FRICT = 5;
const velocity = new Vec2();
const direction = new Vec2();
let mousePos = new Vec2();
let keyState: { [key: string]: boolean } = {};
let isMoving = false;
let isJumping = false;
let framePerSecond = 0;
let frameCounter = 0;
let elapsedTime = 0;
let lastTime = Date.now();
let currentTime = lastTime;
let delta = 0;

const player = new Rect(canvas.width*0.5, canvas.height*0.5, 20, 20, "rgb(0 0 255)");
const platform1 = new Rect(50, 350, 100, 20);
const platform2 = new Rect(250, 330, 100, 20);

window.addEventListener("keydown", (e) => {
    keyState[e.key] = true;
});

window.addEventListener("keyup", (e) => {
    keyState[e.key] = false;
});

canvas.addEventListener("mousemove", (e) => {
    mousePos = getMousePos(canvas, e);
});

canvas.addEventListener("mousedown", () => {
    keyState["m1"] = true;
});

canvas.addEventListener("mouseup", () => {
    keyState["m1"] = false;
});

const loop = () => {
    window.requestAnimationFrame(loop);

    currentTime = Date.now();
    delta = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (keyState[" "] && !isJumping) {
        isJumping = true;
        velocity.y = -8;
    }
    if (keyState["d"] || keyState["a"]) {
        isMoving = true;
        direction.x = 0;
        if (keyState["d"]) { direction.x += 1; }
        if (keyState["a"]) { direction.x += -1; }
    } else {
        isMoving = false;
    }

    if (player.pos.y != canvas.height - 20 || velocity.y < 0) {
        velocity.y += delta * GRAVITY;
        player.pos.y += velocity.y;
        player.pos.y = Math.min(canvas.height - 20, player.pos.y);
    } else {
        isJumping = false;
        velocity.y = 0;
    }

    if (isMoving) {
        velocity.x += delta * GROUND_ACCEL;
        velocity.x = Math.min(velocity.x, 4);
    } else {
        velocity.x += delta * GROUND_ACCEL * -1 * GROUND_FRICT;
        velocity.x = Math.max(0, velocity.x);
    }
    player.pos.x += direction.x * velocity.x;

    if (platform1.collidesWith(player)) {
        platform1.color = "rgb(0 255 0)";
    } else {
        platform1.color = "rgb(255 0 0)";
    }

    if (platform2.collidesWith(player)) {
        platform2.color = "rgb(0 255 0)";
    } else {
        platform2.color = "rgb(255 0 0)";
    }

    if (elapsedTime >= 1) {
        elapsedTime = 0;
        framePerSecond = frameCounter;
        frameCounter = 0;
    } else {
        elapsedTime += delta;
        frameCounter += 1;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    platform2.rotate(15);

    player.render(ctx);
    platform1.render(ctx);
    platform2.render(ctx);

    ctx.font = "15px Arial";
    ctx.fillStyle = "rgb(0 0 0)";
    ctx.fillText(`vel_x: ${velocity.x.toFixed(5)}`, 0, 15);
    ctx.fillText(`vel_y: ${velocity.y.toFixed(5)}`, 0, 30);
    ctx.fillText(`mouse_pos: (${mousePos.x.toFixed(2)}, ${mousePos.y.toFixed(2)})`, 0, 45);
    ctx.fillText(`fps: ${framePerSecond}`, 0, 60);
};

loop();
