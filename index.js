"use strict";
class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    norm() {
        let magnitude = Math.sqrt(this.x * this.x + this.y * this.y);
        this.x = this.x / magnitude;
        this.y = this.y / magnitude;
    }
    mult(s) {
        this.x *= s;
        this.y *= s;
    }
}
;
class Rect {
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    render(ctx) {
        ctx.fillStyle = "rgb(255 0 0)";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
function getMousePos(canvas, evt) {
    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;
    let scaleY = canvas.height / rect.height;
    return new Vec2((evt.clientX - rect.left) * scaleX, (evt.clientY - rect.top) * scaleY);
}
const canvas = document.getElementById("canvas");
const ctx = canvas === null || canvas === void 0 ? void 0 : canvas.getContext("2d");
canvas.width = 400;
canvas.height = 400;
const gravity = 0.02;
const accel = 0.01;
const fps = 60;
const requiredElapsed = 1000 / fps;
const position = new Vec2(canvas.width / 2, canvas.height / 2);
const velocity = new Vec2();
const direction = new Vec2();
const platform = new Rect(0, 200, 20, 100);
let mousePos = new Vec2();
let keyState = {};
let isMoving = false;
let isJumping = false;
let isGrappling = false;
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
    delta = currentTime - lastTime;
    lastTime = currentTime;
    lag += delta;
    while (lag >= requiredElapsed) {
        if (keyState[" "] && !isJumping) {
            isJumping = true;
            velocity.y = -8;
        }
        if (keyState["d"] || keyState["a"]) {
            isMoving = true;
            direction.x = 0;
            if (keyState["d"]) {
                direction.x += 1;
            }
            if (keyState["a"]) {
                direction.x += -1;
            }
        }
        else {
            isMoving = false;
        }
        if (keyState["m1"] && !isGrappling) {
            isGrappling = true;
            let mouseVecFromPly = new Vec2(mousePos.x - position.x, mousePos.y - position.y);
            direction.x = mouseVecFromPly.x < 0 ? -1 : 1;
            mouseVecFromPly.norm();
            mouseVecFromPly.mult(12);
            velocity.x = Math.abs(mouseVecFromPly.x);
            velocity.y = mouseVecFromPly.y;
        }
        if (position.y != canvas.height - 20 || velocity.y < 0) {
            velocity.y += delta * gravity;
            position.y += velocity.y;
            position.y = Math.min(canvas.height - 20, position.y);
        }
        else {
            isJumping = false;
            isGrappling = false;
            velocity.y = 0;
        }
        if (isMoving) {
            velocity.x += delta * accel;
            velocity.x = Math.min(velocity.x, 4);
        }
        else {
            velocity.x += delta * accel * -1;
            velocity.x = Math.max(0, velocity.x);
        }
        position.x += direction.x * velocity.x;
        lag -= requiredElapsed;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgb(0 0 255)";
    ctx.fillRect(position.x, position.y, 20, 20);
    platform.render(ctx);
    ctx.font = "15px Arial";
    ctx.fillText(`vel_x: ${velocity.x.toFixed(5)}`, 0, 15);
    ctx.fillText(`vel_y: ${velocity.y.toFixed(5)}`, 0, 30);
    ctx.fillText(`mouse_pos: (${mousePos.x.toFixed(2)}, ${mousePos.y.toFixed(2)})`, 0, 45);
};
loop();
