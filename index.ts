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

    norm(): Vec2 {
        let length = Math.sqrt(this.x*this.x + this.y*this.y);
        return new Vec2(this.x/length, this.y/length);
    }

    scale(s: number): Vec2 {
        return new Vec2(this.x * s, this.y * s);
    }
};

class Rect {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "rgb(255 0 0)";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width /rect.width;
    let scaleY = canvas.height /rect.height;

    return new Vec2(
        (evt.clientX - rect.left) * scaleX,
        (evt.clientY - rect.top) * scaleY
    );
}

const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const ctx = canvas?.getContext("2d")!;

canvas.width = 400;
canvas.height = 400;

const gravity = 20;
const accel = 10;
const friction = 5;
const position = new Vec2(canvas.width/2, canvas.height/2);
const velocity = new Vec2();
const direction = new Vec2();
const platform = new Rect(150, 350, 100, 20);
let mousePos = new Vec2();
let keyState: { [key: string]: boolean } = {};
let isMoving = false;
let isJumping = false;
let isGrappling = false;
let framePerSecond = 0;
let frameCounter = 0;
let elapsedTime = 0;
let lastTime = Date.now();
let currentTime = lastTime;
let delta = 0;
let lag = 0;

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
    delta = (currentTime - lastTime)/1000;
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
    if (keyState["m1"] && !isGrappling) {
        isGrappling = true;
        let mouseVecFromPly = mousePos.sub(position);
        direction.x = mouseVecFromPly.x < 0 ? -1 : 1;
        mouseVecFromPly = mouseVecFromPly.norm().scale(12);
        velocity.x = Math.abs(mouseVecFromPly.x);
        velocity.y = mouseVecFromPly.y;
    }

    if (position.y != canvas.height - 20 || velocity.y < 0) {
        velocity.y += delta * gravity;
        position.y += velocity.y;
        position.y = Math.min(canvas.height - 20, position.y);
    } else {
        isJumping = false;
        isGrappling = false;
        velocity.y = 0;
    }

    if (isMoving) {
        velocity.x += delta * accel;
        velocity.x = Math.min(velocity.x, 4);
    } else {
        velocity.x += delta * accel * -1 * friction;
        velocity.x = Math.max(0, velocity.x);
    }
    position.x += direction.x * velocity.x;

    if (elapsedTime >= 1) {
        elapsedTime = 0;
        framePerSecond = frameCounter;
        frameCounter = 0;
    } else {
        elapsedTime += delta;
        frameCounter += 1;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgb(0 0 255)";
    ctx.fillRect(position.x, position.y, 20, 20);

    platform.render(ctx);

    ctx.font = "15px Arial";
    ctx.fillText(`vel_x: ${velocity.x.toFixed(5)}`, 0, 15);
    ctx.fillText(`vel_y: ${velocity.y.toFixed(5)}`, 0, 30);
    ctx.fillText(`mouse_pos: (${mousePos.x.toFixed(2)}, ${mousePos.y.toFixed(2)})`, 0, 45);
    ctx.fillText(`fps: ${framePerSecond}`, 0, 60);
};

loop();
