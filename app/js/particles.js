function randomFloat(min, max) {
  if (typeof min !== "number" || typeof max !== "number") return NaN;
  if (min > max) throw new RangeError("min is larger than max");

  return Math.random() * (max - min) + min;
}

// Return a random integer between min and max
function randomInt(min, max) {
  if (!Number.isInteger(min) || !Number.isInteger(max)) return NaN;

  return Math.floor(randomFloat(min, max));
}

// Return a random RGB code
function randomRGB() {
  return `rgb(${randomInt(0, 256)}, ${randomInt(0, 256)}, ${randomInt(
    0,
    256
  )})`;
}

// Return a random Hex code
function randomHex() {
  return (
    "#" +
    randomInt(0, 256).toString(16).padStart(2, "0") +
    randomInt(0, 256).toString(16).padStart(2, "0") +
    randomInt(0, 256).toString(16).padStart(2, "0")
  );
}

// ! Do not modify this class, it is the basis from which all other particles are created
class Particle {
  position = {
    x: undefined,
    y: undefined,
  };
  velocity = {
    x: undefined,
    y: undefined,
  };
  acceleration = {
    x: undefined,
    y: undefined,
  };
  /** @type {CanvasRenderingContext2D} */
  contextReference;

  constructor(pos, vel, acc, ctx) {
    this.position = pos;
    this.velocity = vel;
    this.acceleration = acc;
    this.contextReference = ctx;
  }

  update(deltaTime) {
    let finalVelocity = {
      x: this.velocity.x + this.acceleration.x * deltaTime,
      y: this.velocity.y + this.acceleration.y * deltaTime,
    };

    this.position.x += ((finalVelocity.x + this.velocity.x) / 2) * deltaTime;
    this.position.y += ((finalVelocity.y + this.velocity.y) / 2) * deltaTime;

    this.velocity = finalVelocity;
  }

  draw() {
    // Empty method simply to exist
  }
}

// * This is an example of how to create your own particle
class Example extends Particle {
  constructor(position, context) {
    // The super calls the parent's constructor with the passed in parameters
    super(
      {
        x: position.x + randomInt(-10, 10),
        y: position.y + randomInt(-10, 10),
      },
      { x: 50, y: 50 },
      { x: 0, y: 0 },
      context
    );
  }

  draw() {
    this.contextReference.fillStyle = "red";
    this.contextReference.fillRect(this.position.x, this.position.y, 10, 10);
  }
}

const particleRegistry = {
  example: Example,
};

class ParticleEmitter {
  particleClass;

  particles = new Array();

  time;
  frequency;
  position;
  max;

  /** @type {CanvasRenderingContext2D} */
  context;

  startTime;

  /**
   *
   * @param {String} name Name of the particle to spawn
   * @param {Number} time How long the particle should spawn for (in seconds)
   * @param {Number} frequency How many particles to spawn over the amount of time (0 to spawn the max number)
   * @param {Number} max The max number of particles to spawn total
   * @param {Object} position Origin point of the particles
   */
  constructor(name, time, frequency, max, position, context) {
    if (typeof max !== "number") throw new Error("Possible overflow");

    this.particleClass = particleRegistry[name];
    this.time = time;
    this.frequency = frequency;
    this.max = max;
    this.position = position;

    this.context = context;

    this.startTime = +new Date();
  }

  update(deltaTime) {
    if ((+new Date() - this.startTime) / 1000 < this.time) {
      let particlesToSpawn = Math.min(
        Math.max(this.max - this.particles.length, 0),
        deltaTime / this.frequency
      );
      for (let i = 0; i < particlesToSpawn; i++) {
        this.particles.push(
          new this.particleClass(this.position, this.context)
        );
      }
    }

    this.particles.forEach((particle) => {
      particle.update(deltaTime);
    });
  }

  draw() {
    this.particles.forEach((particle) => {
      particle.draw();
    });
  }
}

export { ParticleEmitter };
