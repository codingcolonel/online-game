// * Utility functions and variables

/**
 * Return a random float between min and max
 * @param {number} min Minimum (inclusive)
 * @param {number} max Maximum (exclusive)
 * @returns {number} Random float
 */
function randomFloat(min, max) {
  if (typeof min !== "number" || typeof max !== "number") return NaN;
  if (min > max) throw new RangeError("min is larger than max");

  return Math.random() * (max - min) + min;
}

/**
 * Return a random integer between min and max
 * @param {number} min Minimum (inclusive)
 * @param {number} max Maximum (exclusive)
 * @returns {number} Random integer
 */
function randomInt(min, max) {
  if (!Number.isInteger(min) || !Number.isInteger(max)) return NaN;

  return Math.floor(randomFloat(min, max));
}

/**
 * Return a value clamped between a max and a min
 * @param {number} num Value to clamp
 * @param {number} min Minimum value
 * @param {number} max Maximum value
 * @returns {number} Clamped value
 */
function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
}

/**
 * Utility function which applies a clipping path to the defending board
 * @returns {void} Does not return anything
 */
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
   * @param {Array.<{x:number, y:number}>} positions List of {x, y} positions. Must be a valid bezier path. {x, y} positions will be scaled with the assumption that default scale is on a canvas 1000px across.
   */
  constructor(...positions) {
    if (positions.length < 4 || positions.length % 3 !== 1)
      throw new Error("Invalid point length");
    this.points = positions;
  }

  /**
   * Create the bezier curve on a canvas, ready to be drawn. Bezier curve is scaled to fit
   * @param {CanvasRenderingContext2D} context Canvas Context
   * @param {{x:number, y:number}} referencePoint {x, y} reference position for drawing (represents {0, 0})
   * @param {number} widthScale New scale value
   * @returns {void} Does not return anything
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
   * @param {number} value Input value
   * @param {number} newScale New scale value
   * @returns {number} Rescaled value
   */
  #rescale(value, newScale) {
    return (value / 1000) * newScale;
  }
}

/**
 * Parent particle class
 * ! Do not modify this class
 */
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

  /** @type {array} */
  arrayReference;

  life;

  /**
   * @param {{x:number, y:number}} pos Starting Position
   * @param {{x:number, y:number}} vel Starting Velocity
   * @param {{x:number, y:number}} acc Constant Acceleration
   * @param {number} drag Constant drag multiplier
   * @param {CanvasRenderingContext2D} ctx Canvas to draw on
   * @param {number} life Particle lifespan (ms)
   * @param {Array<Particle>} arr Array containing this particle
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

  /**
   *
   * @param {number} deltaTime DeltaTime since last update frame
   * @returns {void} Does not return anything
   */
  update(deltaTime) {
    // Decrease life from starting life down to 0
    this.life = this.lifespan - Date.now();
    // If life is negative, kill this particle
    if (this.life <= 0) {
      this.arrayReference.splice(this.arrayReference.indexOf(this), 1);
      return;
    }

    // FinalVelocity = InitialVelocity + Acceleration * Time
    let finalVelocity = {
      x: this.velocity.x + this.acceleration.x * deltaTime,
      y: this.velocity.y + this.acceleration.y * deltaTime,
    };

    // FinalPosition = InitialPosition + Time * ((FinalVelocity + InitalVelocity)/2)
    this.position.x += ((finalVelocity.x + this.velocity.x) / 2) * deltaTime;
    this.position.y += ((finalVelocity.y + this.velocity.y) / 2) * deltaTime;

    // No longer need FinalVelocity, set velocity to new velocity
    this.velocity = finalVelocity;

    // FinalVelocity = Velocity * (Drag ^ Time)
    this.velocity.x = this.velocity.x * this.drag ** (deltaTime / 1000);
    this.velocity.y = this.velocity.y * this.drag ** (deltaTime / 1000);
  }

  /**
   * Empty draw method to avoid errors from missing method
   */
  draw() {}
}

/**
 * Growing outline applied when the user clicks an enemy tile
 */
class attackBoardClick extends Particle {
  /**
   * @param {{x:number, y:number}} position {x, y} position of the particle
   * @param {CanvasRenderingContext2D} context Canvas to draw to
   * @param {Array<Particle>} array Array containing this particle
   */
  constructor(position, context, array) {
    super(position, { x: 0, y: 0 }, { x: 0, y: 0 }, 1, context, 4000, array);
  }

  /**
   * Draw the particle
   * @returns {void} Does not return anything
   */
  draw() {
    let width = attBoard.sideLength / 75;

    // Value from 0 to 1
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

/**
 * Glitch effect applied to enemy tile on impact
 */
class attackBoardImpact extends Particle {
  /**
   * @param {{x:number, y:number}} position {x, y} position of the particle
   * @param {CanvasRenderingContext2D} context Canvas to draw to
   * @param {Array<Particle>} array Array containing this particle
   */
  constructor(position, context, array) {
    let width = randomInt(10, 100);
    let height = randomInt(10, 66);

    // Randomize position within the tile
    super(
      {
        x: position.x + randomFloat(0.05, 0.95) - 5 / width,
        y: position.y + randomFloat(0.05, 0.95) - 5 / height,
      },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      1,
      context,
      6,
      array
    );

    // Random red color, width and height saved to fields
    this.color = `rgb(${randomInt(100, 230)},0,0)`;
    this.width = attBoard.sideLength / width;
    this.height = attBoard.sideLength / height;
  }

  /**
   * Draw the particle
   * @returns {void} Does not return anything
   */
  draw() {
    this.contextReference.fillStyle = this.color;

    let multiplier = attBoard.sideLength / 10;

    this.contextReference.fillRect(
      attBoard.x + this.position.x * multiplier,
      attBoard.y + this.position.y * multiplier,
      this.width,
      this.height
    );
  }
}

/**
 * Rising smoke for impacted friendly ships
 */
class defendBoardSmoke extends Particle {
  /**
   * @param {{x:number, y:number}} position {x, y} position of the particle
   * @param {CanvasRenderingContext2D} context Canvas to draw to
   * @param {Array<Particle>} array Array containing this particle
   */
  constructor(position, context, array) {
    // Random "wind"
    let xMult = randomFloat(0.00000005, 0.0000001);
    let yMult = randomFloat(0.00000001, 0.0000001);

    // Randomize position within the tile
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

    // Random size and color saved to fields
    this.size = randomFloat(0.01, 0.3);
    this.color = randomInt(10, 40);
  }

  /**
   * Draw the particle
   * @returns {void} Does not return anything
   */
  draw() {
    // Value from 0 to 1
    let currLife = 1 - this.life / 7000;

    // Very particular formula to create a smooth transition from bright to dark color
    let fireGlow = clamp(
      this.color + clamp(0.1 / (currLife + 0.087) - 0.17, 0, 1) * 255,
      0,
      255
    );

    // Very particular formula to create smooth opacity transition
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

/**
 * Used when friendly shot is fired
 */
class defendBoardFireShot extends Particle {
  /**
   * @param {{x:number, y:number}} position {x, y} position of the particle
   * @param {CanvasRenderingContext2D} context Canvas to draw to
   * @param {Array<Particle>} array Array containing this particle
   */
  constructor(position, context, array) {
    // Randomize vertical position within row
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

    // Bezier curve saved to field
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

  /**
   * Draw the particle
   * @returns {void} Does not return anything
   */
  draw() {
    this.contextReference.save();

    clipDefending();

    // Position used for bezier drawing
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

class defendBoardRecieveShot extends Particle {
  constructor(position, context, array) {
    let yPos = position.y + randomFloat(0.25, 0.75);
    super(
      {
        x: position.x + 10.5,
        y: yPos,
      },
      { x: -0.08, y: 0 },
      { x: 0, y: 0 },
      0.99999,
      context,
      7000,
      array
    );

    this.curve = new BezierCurve(
      { x: -50, y: 0 },
      { x: -50, y: 10 },
      { x: -25, y: 25 },
      { x: 750, y: 0 },
      { x: -25, y: -25 },
      { x: -50, y: -10 },
      { x: -50, y: 0 }
    );
    this.target = position;
  }

  draw() {
    this.contextReference.save();

    let multiplier = clamp(
      (this.position.x - this.target.x) / 10,
      -Infinity,
      1
    );

    clipDefending();

    let position = {
      x: defBoard.x + (this.position.x * defBoard.sideLength) / 10,
      y: defBoard.y + (this.position.y * defBoard.sideLength) / 10,
    };

    this.contextReference.filter = `blur(${1.5 * multiplier}px)`;

    this.contextReference.fillStyle = "#b36f4d";
    this.curve.draw(
      this.contextReference,
      position,
      defBoard.sideLength * (multiplier * 1.1 + 0.15)
    );
    this.contextReference.fill();

    this.contextReference.fillStyle = "#de9e62";
    this.curve.draw(
      this.contextReference,
      position,
      defBoard.sideLength * 0.85 * (multiplier * 1.1 + 0.15)
    );
    this.contextReference.fill();

    this.contextReference.fillStyle = "#fce36f";
    this.curve.draw(
      this.contextReference,
      position,
      defBoard.sideLength * 0.4 * (multiplier * 1.1 + 0.15)
    );
    this.contextReference.fill();

    this.contextReference.restore();
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

    finalVelocity.x = finalVelocity.x * this.drag ** (deltaTime / 1000);
    finalVelocity.y = finalVelocity.y * this.drag ** (deltaTime / 1000);

    this.position.x += ((finalVelocity.x + this.velocity.x) / 2) * deltaTime;
    this.position.y += ((finalVelocity.y + this.velocity.y) / 2) * deltaTime;

    this.velocity = finalVelocity;

    if (this.position.x < this.target.x + 0.2) {
      this.arrayReference.splice(this.arrayReference.indexOf(this), 1);
      return;
    }
  }
}

class defendBoardHit extends Particle {
  constructor(position, context, array) {
    let xMult = randomFloat(0.00000005, 0.0000001);
    let yMult = randomFloat(0.00000001, 0.0000001);
    let direction = randomFloat(0, 2 * Math.PI);

    let type = randomInt(1, 3);

    let velocity = randomFloat(0.001, 0.009) / 1.5;

    super(
      {
        x: position.x + randomFloat(0.42, 0.58),
        y: position.y + randomFloat(0.42, 0.58),
      },
      {
        x:
          (Math.round(Math.cos(direction) * 100000) / 100000) * velocity * type,
        y:
          (Math.round(Math.sin(direction) * 100000) / 100000) * velocity * type,
      },
      { x: -5 * xMult, y: -1.75 * yMult },
      0.01 * type,
      context,
      2400 / type ** 2,
      array
    );

    this.size = randomFloat(0.01, 0.3);
    this.color = randomInt(10, 40);
    this.direction = direction;
    this.type = type;
  }

  draw() {
    if (this.type == 1) {
      let currLife = 1 - this.life / 2400;
      let fireGlow = clamp(
        this.color + clamp(0.5 / (currLife + 0.48) - 0.37, 0, 1) * 255,
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
        (multiplier * this.size + multiplier * 0.25 * currLife) * 0.75,
        0,
        2 * Math.PI
      );
      this.contextReference.fill();
    } else {
      let currLife = 1 - this.life / 2400;

      this.contextReference.fillStyle = `rgb(${255},${125},${this.color})`;

      let multiplier = defBoard.sideLength / 10;

      this.contextReference.beginPath();
      this.contextReference.ellipse(
        defBoard.x + this.position.x * multiplier,
        defBoard.y + this.position.y * multiplier,
        multiplier * this.size * 1.85 * (1 - currLife),
        multiplier * this.size * 0.75 * (1 - currLife),
        this.direction,
        0,
        2 * Math.PI
      );
      this.contextReference.fill();
    }
  }
}

class defendBoardMiss extends Particle {
  constructor(position, context, array) {
    let xMult = randomFloat(0.00000005, 0.0000001);
    let yMult = randomFloat(0.00000001, 0.0000001);
    let direction = randomFloat(0, 2 * Math.PI);

    let type = randomInt(1, 3);

    let velocity = randomFloat(0.001, 0.009) / 1.5;

    super(
      {
        x: position.x + randomFloat(0.42, 0.58),
        y: position.y + randomFloat(0.42, 0.58),
      },
      {
        x:
          (Math.round(Math.cos(direction) * 100000) / 100000) * velocity * type,
        y:
          (Math.round(Math.sin(direction) * 100000) / 100000) * velocity * type,
      },
      { x: -5 * xMult, y: -1.75 * yMult },
      0.01 * type,
      context,
      1800 / type,
      array
    );

    this.size = randomFloat(0.01, 0.3);
    this.color = randomInt(100, 140);
    this.direction = direction;
    this.type = type;
  }

  draw() {
    if (this.type == 1) {
      let currLife = 1 - this.life / 1200;
      let waterClr = clamp(-0.75 / (currLife - 1.75), 0, 1);

      this.contextReference.fillStyle = `rgb(${clamp(
        this.color + 255 * waterClr ** 5,
        0,
        255
      )},${clamp(this.color + 255 * waterClr ** 3, 0, 255)},${clamp(
        this.color + 255 * waterClr,
        0,
        255
      )})`;

      let multiplier = defBoard.sideLength / 10;

      this.contextReference.beginPath();
      this.contextReference.ellipse(
        defBoard.x + this.position.x * multiplier,
        defBoard.y + this.position.y * multiplier,
        multiplier * this.size * 0.85 * (1 - currLife),
        multiplier * this.size * 0.5 * (1 - currLife),
        this.direction,
        0,
        2 * Math.PI
      );
      this.contextReference.fill();
    } else {
      let currLife = 1 - this.life / 2400;

      this.contextReference.fillStyle = `rgb(${this.color},${125},${255})`;

      let multiplier = defBoard.sideLength / 10;

      this.contextReference.beginPath();
      this.contextReference.ellipse(
        defBoard.x + this.position.x * multiplier,
        defBoard.y + this.position.y * multiplier,
        multiplier * this.size * 1.85 * (1 - currLife),
        multiplier * this.size * 0.75 * (1 - currLife),
        this.direction,
        0,
        2 * Math.PI
      );
      this.contextReference.fill();
    }
  }
}

// The particle registry that the particle emitters read from
const particleRegistry = {
  attackClick: attackBoardClick,
  attackImpact: attackBoardImpact,
  defendSmoke: defendBoardSmoke,
  defendShoot: defendBoardFireShot,
  defendIncoming: defendBoardRecieveShot,
  defendHit: defendBoardHit,
  defendMiss: defendBoardMiss,
};

/**
 * Class for managing and emitting particles
 */
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
   * @param {string} name Name of the particle to spawn
   * @param {number} time How long the particle should spawn for (in seconds)
   * @param {number} frequency Frequency of particle spawns
   * @param {number} max The max number of particles to spawn total
   * @param {object} position Origin point of the particles
   * @param {CanvasRenderingContext2D} context Context to render with
   * @param {Array<ParticleEmitter>} array activeEmitter array
   * @param {boolean} under Whether or not to display UNDER previous particles
   */
  constructor(name, time, frequency, max, position, context, array, under) {
    // Prevent overflow from excessive particle quantities
    if (typeof max !== "number") throw new Error("Possible overflow");

    this.startTime = Date.now();

    // Get particle from the particle registry
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

  /**
   * Update all particles, and generate any new ones
   * @param {number} deltaTime DeltaTime since last update frame (ms)
   * @returns {void} Does not return anything
   */
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
