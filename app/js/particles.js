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

function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
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

  lifespan;

  /** @type {Array} */
  arrayReference;

  life;

  constructor(pos, vel, acc, ctx, life = 0, arr) {
    this.position = pos;
    this.velocity = vel;
    this.acceleration = acc;
    this.contextReference = ctx;
    this.lifespan = life;
    this.arrayReference = arr;
  }

  update(deltaTime) {
    this.life = this.lifespan - +new Date();
    if (this.life <= 0) {
      this.arrayReference.splice(this.arrayReference.indexOf(this), 1);
      return;
    }

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
  constructor(position, context, array) {
    // The super calls the parent's constructor with the passed in parameters
    super(
      {
        x: position.x + randomFloat(-10, 10),
        y: position.y + randomFloat(-10, 10),
      },
      { x: randomFloat(-1.5, 1.5), y: randomFloat(-1.5, 1.5) },
      { x: 0, y: 0.003 },
      context,
      +new Date() + 1000,
      array
    );
  }

  draw() {
    this.contextReference.fillStyle = "red";
    this.contextReference.save();
    this.contextReference.globalAlpha = this.life / 1000;
    this.contextReference.fillRect(this.position.x, this.position.y, 10, 10);
    this.contextReference.restore();
  }
}

const particleRegistry = {
  example: Example,
};

class ParticleEmitter {
  particleClass;

  particles = new Array();

  time;
  #prevTime;
  #leftoverTime;
  position;
  max;

  /** @type {CanvasRenderingContext2D} */
  context;

  startTime;

  arrayReference;

  interval;

  spawn;

  /**
   *
   * @param {String} name Name of the particle to spawn
   * @param {Number} time How long the particle should spawn for (in seconds)
   * @param {Number} frequency Frequency of particle spawns
   * @param {Number} max The max number of particles to spawn total
   * @param {Object} position Origin point of the particles
   * @param {CanvasRenderingContext2D} context Context to render with
   * @param {Array} array activeEmitter array
   */
  constructor(name, time, frequency, max, position, context, array) {
    if (typeof max !== "number") throw new Error("Possible overflow");

    this.startTime = +new Date();

    this.particleClass = particleRegistry[name];
    this.time = this.startTime + time * 1000;
    this.max = max;
    this.position = position;

    this.context = context;

    this.arrayReference = array;

    this.interval = 1000 / frequency;

    this.#prevTime = this.startTime;
    this.#leftoverTime = 0;

    this.spawn = true;

    console.log(this.interval);
  }

  update(deltaTime) {
    const currTime = +new Date();

    if (this.spawn) {
      for (
        let i = this.#prevTime + this.#leftoverTime;
        i < currTime;
        i += this.interval
      ) {
        this.#leftoverTime = this.interval - (currTime - i);
        if (this.particles.length >= this.max) continue;

        console.log("new");
        this.particles.push(
          new this.particleClass(this.position, this.context, this.particles)
        );
        this.#prevTime = currTime;
      }
    }

    if (currTime > this.time) {
      this.spawn = false;
      if (this.particles.length === 0) {
        this.arrayReference.splice(this.arrayReference.indexOf(this), 1);
        return;
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
