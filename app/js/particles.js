// Utility functions and variables
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

function clipDefending() {
  let longX = defBoard.x + defBoard.sideLength;
  let longY = defBoard.y + defBoard.sideLength;
  ctx.beginPath();
  ctx.moveTo(defBoard.x, defBoard.y);
  ctx.lineTo(longX, defBoard.y);
  ctx.lineTo(longX, longY);
  ctx.lineTo(defBoard.x, longY);
  ctx.clip();
}

/**
 * Small class for managing canvas bezier curves
 */
class BezierCurve {
  points;
  scale;
  /**
   * @param {Array.<{x:number, y:number}>} positions
   */
  constructor(...positions) {
    if (positions.length < 4 || positions.length % 3 !== 1)
      throw new Error("Invalid point length");
    this.points = positions;
  }
  /**
   *
   * @param {CanvasRenderingContext2D} context Canvas Context
   * @param {{x:number, y:number}} referencePoint Object with an x and a y
   * @param {number} widthScale New scale value
   */
  draw(context, referencePoint, widthScale) {
    context.beginPath();
    context.moveTo(
      referencePoint.x + this.#rescale(this.points[0].x, widthScale),
      referencePoint.y + this.#rescale(this.points[0].y, widthScale)
    );
    for (let index = 1; index < this.points.length - 1; index += 3) {
      context.bezierCurveTo(
        referencePoint.x + this.#rescale(this.points[index].x, widthScale),
        referencePoint.y + this.#rescale(this.points[index].y, widthScale),
        referencePoint.x + this.#rescale(this.points[index + 1].x, widthScale),
        referencePoint.y + this.#rescale(this.points[index + 1].y, widthScale),
        referencePoint.x + this.#rescale(this.points[index + 2].x, widthScale),
        referencePoint.y + this.#rescale(this.points[index + 2].y, widthScale)
      );
    }
  }
  /**
   * Assuming a default scale of 1000, rescale a value relative to a new scale
   * @param {number}
   * @param {number} newScale
   */
  #rescale(value, newScale) {
    return (value / 1000) * newScale;
  }
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

  /**
   *
   * @param {{x:number, y:number}} pos Starting Position
   * @param {{x:number, y:number}} vel Starting Velocity
   * @param {{x:number, y:number}} acc Constant Acceleration
   * @param {number} drag Constant drag multiplier
   * @param {*} ctx
   * @param {*} life
   * @param {*} arr
   */
  constructor(pos, vel, acc, drag, ctx, life = 0, arr) {
    this.position = pos;
    this.velocity = vel;
    this.acceleration = acc;
    this.drag = drag;
    this.contextReference = ctx;
    this.lifespan = Date.now() + life;
    this.arrayReference = arr;
  }

  update(deltaTime) {
    this.life = this.lifespan - Date.now();
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

    this.velocity.x = this.velocity.x * this.drag ** (deltaTime / 1000);
    this.velocity.y = this.velocity.y * this.drag ** (deltaTime / 1000);
  }

  draw() {
    // Empty method simply to exist
  }
}

class attackBoardClick extends Particle {
  constructor(position, context, array) {
    super(position, { x: 0, y: 0 }, { x: 0, y: 0 }, 1, context, 4000, array);
  }

  draw() {
    let width = attBoard.sideLength / 75;
    let currLife = 1 - this.life / 4000;

    let additive = (-1 / (5 * currLife + 1) + 1) * 3.75 * width;
    let opacity = -25.81 * currLife * (currLife - 1) ** 9;

    let length = attBoard.sideLength / 10 - width * 2 + 2 * additive;

    this.contextReference.strokeStyle = `rgba(255,0,0,${opacity})`;
    this.contextReference.lineJoin = "bevel";
    this.contextReference.lineWidth = width;

    let multiplier = attBoard.sideLength / 10;

    this.contextReference.strokeRect(
      attBoard.x + width - additive + this.position.x * multiplier,
      attBoard.y + width - additive + this.position.y * multiplier,
      length,
      length
    );
  }
}

class attackBoardImpact extends Particle {
  constructor(position, context, array) {
    let width = randomInt(10, 100);
    let length = randomInt(10, 66);

    super(
      {
        x: position.x + randomFloat(0.05, 0.95) - 5 / width,
        y: position.y + randomFloat(0.05, 0.95) - 5 / length,
      },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      1,
      context,
      6,
      array
    );
    this.color = `rgb(${randomInt(100, 230)},0,0)`;
    this.width = attBoard.sideLength / width;
    this.length = attBoard.sideLength / length;
  }

  draw() {
    this.contextReference.fillStyle = this.color;

    let multiplier = attBoard.sideLength / 10;

    this.contextReference.fillRect(
      attBoard.x + this.position.x * multiplier,
      attBoard.y + this.position.y * multiplier,
      this.width,
      this.length
    );
  }
}

class defendBoardSmoke extends Particle {
  constructor(position, context, array) {
    let xMult = randomFloat(0.00000005, 0.0000001);
    let yMult = randomFloat(0.00000001, 0.0000001);
    super(
      {
        x: position.x + randomFloat(0.42, 0.58),
        y: position.y + randomFloat(0.42, 0.58),
      },
      { x: 0, y: 0 },
      { x: -5 * xMult, y: -1.75 * yMult },
      0.95,
      context,
      7000,
      array
    );

    this.size = randomFloat(0.01, 0.3);
    this.color = randomInt(10, 40);
  }

  draw() {
    let currLife = 1 - this.life / 7000;
    let fireGlow = clamp(
      this.color + clamp(0.1 / (currLife + 0.087) - 0.17, 0, 1) * 255,
      0,
      255
    );

    let opacity = -25.81 * currLife * (currLife - 1) ** 9;
    this.contextReference.fillStyle = `rgba(${fireGlow},${fireGlow / 2},${
      this.color
    },${opacity})`;

    let multiplier = defBoard.sideLength / 10;

    this.contextReference.beginPath();
    this.contextReference.arc(
      defBoard.x + this.position.x * multiplier,
      defBoard.y + this.position.y * multiplier,
      (multiplier * this.size + multiplier * 0.75 * currLife) * 0.75,
      0,
      2 * Math.PI
    );
    this.contextReference.fill();
  }
}

class defendBoardFireShot extends Particle {
  constructor(position, context, array) {
    super(
      {
        x: -0.5,
        y: position.y + randomFloat(0.25, 0.75),
      },
      { x: 0.15, y: 0 },
      { x: 0, y: 0 },
      0.99999,
      context,
      750,
      array
    );

    this.curve = new BezierCurve(
      { x: 50, y: 0 },
      { x: 50, y: 10 },
      { x: 25, y: 25 },
      { x: -750, y: 0 },
      { x: 25, y: -25 },
      { x: 50, y: -10 },
      { x: 50, y: 0 }
    );
  }

  draw() {
    this.contextReference.save();

    clipDefending();

    let position = {
      x: defBoard.x + (this.position.x * defBoard.sideLength) / 10,
      y: defBoard.y + (this.position.y * defBoard.sideLength) / 10,
    };

    this.contextReference.filter = "blur(1.5px)";

    this.contextReference.fillStyle = "#b36f4d";
    this.curve.draw(this.contextReference, position, defBoard.sideLength);
    this.contextReference.fill();

    this.contextReference.fillStyle = "#de9e62";
    this.curve.draw(
      this.contextReference,
      position,
      defBoard.sideLength * 0.85
    );
    this.contextReference.fill();

    this.contextReference.fillStyle = "#fce36f";
    this.curve.draw(this.contextReference, position, defBoard.sideLength * 0.4);
    this.contextReference.fill();

    this.contextReference.restore();
  }
}

const particleRegistry = {
  attackClick: attackBoardClick,
  attackImpact: attackBoardImpact,
  defendSmoke: defendBoardSmoke,
  defendShoot: defendBoardFireShot,
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

  under;

  name;

  /**
   *
   * @param {String} name Name of the particle to spawn
   * @param {Number} time How long the particle should spawn for (in seconds)
   * @param {Number} frequency Frequency of particle spawns
   * @param {Number} max The max number of particles to spawn total
   * @param {Object} position Origin point of the particles
   * @param {CanvasRenderingContext2D} context Context to render with
   * @param {Array} array activeEmitter array
   * @param {boolean} under Whether or not to display UNDER previous particles
   */
  constructor(name, time, frequency, max, position, context, array, under) {
    if (typeof max !== "number") throw new Error("Possible overflow");

    this.startTime = Date.now();

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

    this.under = under;

    this.name = name;
  }

  update(deltaTime) {
    const currTime = Date.now();

    if (this.spawn) {
      for (
        let i = this.#prevTime + this.#leftoverTime;
        i < currTime;
        i += this.interval
      ) {
        this.#leftoverTime = this.interval - (currTime - i);
        if (this.particles.length >= this.max) continue;

        if (this.under) {
          this.particles.unshift(
            new this.particleClass(this.position, this.context, this.particles)
          );
        } else {
          this.particles.push(
            new this.particleClass(this.position, this.context, this.particles)
          );
        }

        this.#prevTime = currTime;
      }
    }

    if (currTime > this.time || !this.spawn) {
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

  kill() {
    this.spawn = false;
    if (this.particles.length === 0) {
      this.arrayReference.splice(this.arrayReference.indexOf(this), 1);
      return;
    }
  }
}
