/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const CANVAS_WIDTH = (canvas.width = window.innerWidth);
const CANVAS_HEIGHT = (canvas.height = window.innerHeight);

const collisionCanvas = document.getElementById("collisionCanvas");
const collisionCanvasCtx = collisionCanvas.getContext("2d");
const COLLISION_CANVAS_WIDTH = (collisionCanvas.width = window.innerWidth);
const COLLOSION_CANVAS_HEIGHT = (collisionCanvas.height = window.innerHeight);

ctx.font = "50px Impact";

let score = 0;
let timeToNextRaven = 0;
let ravenInterval = 500;
let lastTime = 0;
let gameOver = false;

let ravens = [];
let hits = [];
let particles = [];

const createColor = (r, g, b) => {
  return "rgb(" + r + "," + g + "," + b + ")";
};

class Raven {
  constructor() {
    this.spriteHeight = 194;
    this.spriteWidth = 271;
    this.sizeModifier = Math.random() * 0.5 + 0.2;
    this.width = this.spriteWidth * this.sizeModifier;
    this.height = this.spriteHeight * this.sizeModifier;
    this.x = CANVAS_WIDTH;
    this.y = Math.random() * (CANVAS_HEIGHT - this.height);
    this.directionX = Math.random() * 2 + 4;
    this.directionY = Math.random() * 10 - 5;
    this.markedForRemoval = false;
    this.image = new Image();
    this.image.src = "raven.png";
    this.frame = 0;
    this.maxFrames = 4;
    this.timeSinceFlap = 0;
    this.flapInterval = Math.random() * 50 + 50;
    this.randomColor = [
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
    ];
    this.color = createColor(
      this.randomColor[0],
      this.randomColor[1],
      this.randomColor[2]
    );
    this.hasTrail = Math.random() > 0.5;
  }
  update(deltaTime) {
    if (this.y < 0 || this.y > canvas.height - this.height) {
      this.directionY *= -1;
    }
    this.x -= this.directionX;
    this.y += this.directionY;
    if (this.x + this.width < 0) this.markedForRemoval = true;

    this.timeSinceFlap += deltaTime;
    if (this.timeSinceFlap > this.flapInterval) {
      if (this.frame > this.maxFrames) this.frame = 0;
      else this.frame++;
      this.timeSinceFlap = 0;
      if (this.hasTrail) {
        for (let i = 0; i < 5; i++)
          particles.push(
            new Particle(
              this.x + Math.random() * 50,
              this.y + Math.random() * 50,
              this.width
            )
          );
      }
    }
    if (this.x + this.width < 0) gameOver = true;
  }
  draw() {
    collisionCanvasCtx.fillStyle = this.color;
    collisionCanvasCtx.fillRect(this.x, this.y, this.width, this.height);
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

class Hit {
  constructor(x, y, size) {
    this.spriteHeight = 179;
    this.spriteWidth = 200;
    this.size = size;
    this.x = x - this.size / 4;
    this.y = y - this.size / 4;
    this.frame = 0;
    this.maxFrames = 10;
    this.nextFrame = Math.random() * 50 + 50;
    this.timer = 0;
    this.image = new Image();
    this.image.src = "boom.png";
    this.sound = new Audio();
    this.sound.src = "birdsKill.mp3";
    this.markedForRemoval = false;
  }
  update(deltaTime) {
    this.timer += deltaTime;
    if (this.frame === 0) this.sound.play();
    if (this.timer > this.nextFrame) {
      if (this.frame > this.maxFrames) this.markedForRemoval = true;
      else this.frame++;
      this.timer = 0;
    }
  }
  draw() {
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.size,
      this.size
    );
  }
}

class Particle {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.speedX = Math.random() * 1 + 0.5;
    this.size = size;
    this.radius = Math.random() * 2 + this.size / 30;
    this.markedForRemoval = false;
  }
  update() {
    this.x += this.speedX;
    this.radius -= 0.1;
    if (this.radius < 0) this.markedForRemoval = true;
  }
  draw() {
    if (this.radius > 0) {
      ctx.save();
      ctx.globalAlpha = this.radius;
      ctx.beginPath();
      ctx.fillStyle = "#000";
      ctx.arc(
        this.x + this.size / 2,
        this.y + this.size / 4,
        this.radius,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
  }
}

const r = new Raven();

function drawScore() {
  ctx.fillStyle = "#000";
  ctx.fillText("Score: " + score, 25, 75);
  ctx.fillStyle = "#fff";
  ctx.fillText("Score: " + score, 30, 80);
}

function drawGameOver() {
  ctx.font = "80px Impact";
  ctx.textAlign = "center";
  ctx.fillStyle = "#000";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = "#fff";
  ctx.fillText("GAME OVER", canvas.width / 2 + 5, canvas.height / 2 + 5);
  canvas.style = "background-color: red";
}

window.addEventListener("click", (e) => {
  const detectPixelColor = collisionCanvasCtx.getImageData(e.x, e.y, 1, 1).data;
  const currentColor = createColor(
    detectPixelColor[0],
    detectPixelColor[1],
    detectPixelColor[2]
  );
  ravens.forEach((raven) => {
    if (raven.color === currentColor) {
      hits.push(new Hit(raven.x, raven.y, raven.width));
      raven.markedForRemoval = true;
      score++;
    }
  });
});

function animate(timestamp) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  collisionCanvasCtx.clearRect(
    0,
    0,
    COLLISION_CANVAS_WIDTH,
    COLLOSION_CANVAS_HEIGHT
  );

  let deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  timeToNextRaven += deltaTime;

  if (timeToNextRaven > ravenInterval) {
    timeToNextRaven = 0;
    ravens.push(new Raven());
    ravens.sort((a, b) => {
      return a.width - b.width;
    });
  }
  drawScore();
  [...particles, ...ravens, ...hits].forEach((obj) => {
    obj.update(deltaTime);
    obj.draw();
  });

  ravens = ravens.filter((raven) => !raven.markedForRemoval);
  hits = hits.filter((exp) => !exp.markedForRemoval);
  particles = particles.filter((par) => !par.markedForRemoval);

  if (!gameOver) requestAnimationFrame(animate);
  else drawGameOver();
}

animate(0);
