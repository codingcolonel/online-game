function registerErrorLogger() {
  const body = document.querySelector("body");

  const styler = document.createElement("link");
  styler.href = "/css/errorLog.css";
  styler.rel = "stylesheet";
  body.prepend(styler);

  const logger = new errorLogger(body);

  window.logger = logger;
  return logger;
}

class errorLogger {
  /** @type {HTMLDivElement} */
  #body;
  #grid;
  #queue = [];

  constructor(bodyElement) {
    this.#body = document.createElement("div");
    this.#body.id = "erL_body";
    this.#grid = document.createElement("div");
    this.#grid.id = "erL_bodyGrid";
    this.#body.append(this.#grid);

    bodyElement.append(this.#body);
  }

  #createElement(className, message) {
    const main = document.createElement("div");
    main.classList.add("erL_messageMain");
    main.classList.add(`erL_${className}`);

    const head = document.createElement("div");
    head.classList.add("erL_messageHead");
    head.innerHTML = className === "generic" ? "message" : className;

    const body = document.createElement("div");
    body.classList.add("erL_messageBody");
    body.innerHTML = message;

    const svg = `<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
          <path
            d="m12.002 2.005c5.518 0 9.998 4.48 9.998 9.997 0 5.518-4.48 9.998-9.998 9.998-5.517 0-9.997-4.48-9.997-9.998 0-5.517 4.48-9.997 9.997-9.997zm0 8.933-2.721-2.722c-.146-.146-.339-.219-.531-.219-.404 0-.75.324-.75.749 0 .193.073.384.219.531l2.722 2.722-2.728 2.728c-.147.147-.22.34-.22.531 0 .427.35.75.751.75.192 0 .384-.073.53-.219l2.728-2.728 2.729 2.728c.146.146.338.219.53.219.401 0 .75-.323.75-.75 0-.191-.073-.384-.22-.531l-2.727-2.728 2.717-2.717c.146-.147.219-.338.219-.531 0-.425-.346-.75-.75-.75-.192 0-.385.073-.531.22z"
            fill-rule="nonzero"
          />
        </svg>`;

    main.append(head, body);
    main.innerHTML += svg;
    main.classList.add("running");

    main.addEventListener(
      "animationend",
      function (event) {
        switch (event.animationName) {
          case "slider":
            main.classList.remove("running");
            main.classList.add("done");
            break;
          case "squishOut":
            main.remove();
            if (this.#queue.length) this.#grid.prepend(this.#queue.shift());
            break;
        }
      }.bind(this)
    );

    main.querySelector("svg").addEventListener("click", function () {
      main.classList.remove("running");
      main.classList.add("done");
    });

    if (this.#grid.children.length < 6) this.#grid.prepend(main);
    else this.#queue.push(main);
  }

  generic(msg = "") {
    this.#createElement("generic", msg);
  }

  success(msg = "") {
    this.#createElement("success", msg);
  }

  warn(msg = "") {
    this.#createElement("warn", msg);
  }

  error(msg = "") {
    this.#createElement("error", msg);
  }
}

export { registerErrorLogger };
