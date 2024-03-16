import "./snake.scss";

class SnakeGame {
  static _instance = null;

  static get instance() {
    if (this._instance == null) {
      this._instance = new SnakeGame();
    }
    return this._instance;
  }

  domHandler = new SnakeGameDomHandler("#snake", this);
  eventHandler = new SnakeGameEventHandler();
  swipeDetector = new SnakeGameSwipeDetector();

  _timer = null;

  _settings = null;
  _defaultSettings = {
    bestScore: 0,
    colorPallette: {
      menu: "rgb(11, 96, 176)",
      board: "rgb(0, 0, 0)",
      snake: "rgb(64, 162, 216)",
      food: "rgb(240, 237, 207)",
      text: "rgb(255, 255, 255)",
    },
  };
  _state = null;
  _defaultState = {
    running: false,
    difficulty: 5,
    score: 0,
    food: null,
    player: {
      heading: "right",
      body: [{ x: 0, y: 0 }], // Start in the center of the board
    },
  };

  get state() {
    if (this._state == null) {
      try {
        if (typeof atob == "undefined" || typeof localStorage == "undefined") {
          throw Error("atob or localStorage is not available.");
        }

        this._state =
          JSON.parse(atob(localStorage.getItem("snake-state"))) ||
          this._defaultState;
      } catch (e) {
        this._state = this._defaultState;
      }

      // If the state is loaded from local storage, and the state is running, pause the game
      if (this._state.running) {
        this.pause();
      }
    }
    return this._state;
  }

  set state(value) {
    this._state = { ...this.state, ...value };

    try {
      if (typeof btoa == "undefined" || typeof localStorage == "undefined") {
        throw Error("btoa or localStorage is not available.");
      }

      localStorage.setItem("snake-state", btoa(JSON.stringify(this._state)));
    } catch (e) {
      console.error("Failed to save state:", e);
    }

    this.emit("state", this.state);
  }

  get settings() {
    if (this._settings == null) {
      try {
        if (typeof atob == "undefined" || typeof localStorage == "undefined") {
          throw Error("atob or localStorage is not available.");
        }

        this._settings =
          JSON.parse(atob(localStorage.getItem("snake-settings"))) ||
          this._defaultSettings;
      } catch (e) {
        this._settings = this._defaultSettings;
      }
    }
    return this._settings;
  }

  set settings(value) {
    this._settings = { ...this.settings, ...value };

    try {
      if (typeof btoa == "undefined" || typeof localStorage == "undefined") {
        throw Error("btoa or localStorage is not available.");
      }

      localStorage.setItem(
        "snake-settings",
        btoa(JSON.stringify(this._settings))
      );
    } catch (e) {
      console.error("Failed to save settings:", e);
    }

    this.emit("state", this.settings);
  }

  constructor() {
    // Set the color pallette
    this.setColorPallette();

    // If the player has previously scored restart the game
    if (this.state.score > 0) {
      this.domHandler.showResumeScreen();
    } else {
      this.state = this._defaultState;
      this.domHandler.showStartScreen();
    }

    // Make sure that the game is not running
    this.state = { running: false };

    this.domHandler.on("click", "#snake-game-start-button", () => this.start());
    this.domHandler.on("click", "#snake-game-restart-button", () =>
      this.restart()
    );
    this.domHandler.on("click", "#snake-game-pause-button", () => this.pause());

    // Update the heading when the user swipes
    this.on("swipe", (data) => {
      this.state = {
        player: { ...this.state.player, ...{ heading: data.direction } },
      };
    });
  }

  start() {
    if (!this.state.running) {
      this.setTickRate(this.state.difficulty);

      this.state = { running: true };

      this.domHandler.showGameBoard();

      this.renderPlayer();

      this.renderFood();
    }

    this.swipeDetector.start();
    this.emit("start", this.state);
  }

  restart() {
    this.state = this._defaultState;

    this.emit("restart", this.state);

    this.start();
  }

  stop() {
    clearInterval(this._timer);
    this.state = this._defaultState;

    this.swipeDetector.stop();
    this.emit("stop", this.state);
  }

  pause() {
    clearInterval(this._timer);
    this.state = { running: false };
    this.swipeDetector.stop();

    this.domHandler.showResumeScreen();

    this.emit("pause", this.state);
  }

  tick() {
    // Move the snake
    const head = { ...this.state.player.body[0] };
    switch (this.state.player.heading) {
      case "up":
        head.y -= 10;
        break;
      case "right":
        head.x += 10;
        break;
      case "down":
        head.y += 10;
        break;
      case "left":
        head.x -= 10;
        break;
    }

    this.state = {
      player: {
        ...this.state.player,
        body: [head, ...this.state.player.body.slice(0, -1)],
      },
    };

    const board = this.domHandler.board;

    // Clear the snake
    board.fillStyle = this.settings.colorPallette.board;
    board.fillRect(
      0,
      0,
      this.domHandler._canvas.width,
      this.domHandler._canvas.height
    );

    this.renderPlayer();

    // If there is no food on the board then spawn one in randomly
    if (this.state.food == null) {
      this.addFood();
    }

    // If the head is outside the game screen, the player dies
    if (
      this.state.player.body[0].x >= this.domHandler._canvas.width ||
      this.state.player.body[0].x < 0 ||
      this.state.player.body[0].y >= this.domHandler._canvas.height ||
      this.state.player.body[0].y < 0
    ) {
      this.gameOver();
    }

    // If the head is inside the any of the player body pieces, the player dies
    this.state.player.body.forEach((part, index) => {
      if (index == 0) {
        return;
      }

      if (
        part.x == this.state.player.body[0].x &&
        part.y == this.state.player.body[0].y
      ) {
        this.gameOver();
      }
    });

    // If the head is on a food piece then add to the score, add a body piece
    // If there is no food, create a food piece
    if (this.state.food != null) {
      if (
        this.state.food.x == this.state.player.body[0].x &&
        this.state.food.y == this.state.player.body[0].y
      ) {
        this.eat();
      }
    }

    this.renderFood();

    this.emit("tick", this.state);
  }

  gameOver() {
    this.domHandler.showStartScreen(true);

    this.emit("gameOver", this.state);

    this.stop();
  }

  renderPlayer() {
    const board = this.domHandler.board;

    board.fillStyle = this.settings.colorPallette.snake;
    this.state.player.body.forEach((part) => {
      board.fillRect(part.x, part.y, 10, 10);
    });

    this.emit("renderPlayer", this.state);
  }

  addFood() {
    const randomizeFood = () => {
      return {
        x:
          Math.floor(
            Math.floor(Math.random() * this.domHandler._canvas.width) / 10
          ) * 10,
        y:
          Math.floor(
            Math.floor(Math.random() * this.domHandler._canvas.height) / 10
          ) * 10,
      };
    };

    let food = randomizeFood();

    const foodPositionIsValid = () => {
      // Ensure food is placed inside the game board
      if (
        food.x < 0 ||
        food.x >= this.domHandler._canvas.width ||
        food.y < 0 ||
        food.x >= this.domHandler._canvas.height
      ) {
        return false;
      }
      // Ensure food is not placed in the player
      for (let i = 0; i > this.state.player.body.length; i++) {
        let part = this.state.player.body[i];
        if (part.x == food.x && part.y == food.y) {
          return false;
        }
      }
      return true;
    };

    while (!foodPositionIsValid()) {
      food = randomizeFood();
    }

    this.state = {
      food: food,
    };

    this.emit("addFood", this.state);
  }

  renderFood() {
    if (this.state.food != null) {
      const board = this.domHandler.board;
      board.fillStyle = this.settings.colorPallette.food;
      board.fillRect(this.state.food.x, this.state.food.y, 10, 10);
      this.emit("renderFood", this.state);
    }
  }

  // Set the game speed. Max is 100 (equates 500ms)
  setTickRate(rate = 5) {
    clearInterval(this._timer);

    this.state = { difficulty: rate };

    this._timer = setInterval(
      () => this.tick(),
      Math.max(500, 1000 - rate * 5)
    );

    this.emit("setTickRate", this.state);
  }

  eat() {
    if (this.state.food == null) {
      return;
    }

    this.state.player.body.push({
      x: this.state.food.x,
      y: this.state.food.y,
    });

    this.state = {
      food: null,
      score: this.state.score + 1,
      player: {
        ...this.state.player,
        body: this.state.player.body,
      },
    };

    // If the score is higher than the high score update the high score
    if (this.state.score > this.settings.bestScore) {
      this.settings = { bestScore: this.state.score };
      this.emit("bestScore", this.settings);
    }

    // Increase the difficulty every 5 points
    this.setTickRate(Math.floor(this.state.score / 5) * 5);

    this.emit("eat", this.state);
  }

  setColorPallette(colorPallette) {
    if (
      colorPallette &&
      (!"menu" in colorPallette ||
        !"board" in colorPallette ||
        !"snake" in colorPallette ||
        !"food" in colorPallette ||
        !"text" in colorPallette)
    ) {
      console.error("Invalid color pallette");
    }

    if (colorPallette) {
      this.settings = { colorPallette: colorPallette };
    }

    document.querySelector("body").style =
      `--snake-game-menu: ${this.settings.colorPallette.menu};` +
      `--snake-game-board: ${this.settings.colorPallette.board};` +
      `--snake-game-snake: ${this.settings.colorPallette.snake};` +
      `--snake-game-food: ${this.settings.colorPallette.food};` +
      `--snake-game-text: ${this.settings.colorPallette.text};`;
  }

  on(event, handler) {
    this.eventHandler.on(event, handler);
  }

  emit(event, data) {
    console.debug("Event:", event, data);
    this.eventHandler.emit(event, data);
  }
}

class SnakeGameEventHandler {
  _listeners = {};

  on(event, handler) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(handler);
  }

  emit(event, data) {
    if (this._listeners[event]) {
      this._listeners[event].forEach((handler) => handler(data));
    }
  }
}

class SnakeGameDomHandler {
  _container = null;
  _canvas = null;
  _controls = null;

  _game = null;

  constructor(selector, game) {
    this._container = document.querySelector(selector);
    this._game = game;

    if (!this._container) {
      throw new Error("Container not found");
    }
  }

  showStartScreen(restart = false) {
    this._canvas = null;

    this._container.innerHTML = `
      <div class="snake-intro">
        <h1>${restart ? "Game over!" : "Snake"}</h1>
        <div>
          ${restart ? 'Score: <span id="snake-game-score">0</span> | ' : ""}
          Best${
            restart ? "" : " Score"
          }: <span id="snake-game-best-score">0</span>
        </div>
        <button id="snake-game-start-button">${
          restart ? "Play again!" : "Play!"
        }</button>
      </div>
    `;

    if (restart) {
      this._container.querySelector("#snake-game-score").innerText =
        this._game.state.score;
    }
    this._container.querySelector("#snake-game-best-score").innerText =
      this._game.settings.bestScore;

    window.addEventListener("resize", () => {
      if (this._canvas) {
        this._canvas.width = this._container.clientWidth;
      }
    });
  }

  showResumeScreen() {
    this._canvas = null;

    this._container.innerHTML = `
      <div class="snake-intro">
        <h5>Snake</h5>
        <h1>Resume</h1>
        <div>
          Score: <span id="snake-game-score">0</span> | 
          Best: <span id="snake-game-best-score">0</span>
        </div>
        <button id="snake-game-start-button">Resume</button>
        <button id="snake-game-restart-button">Restart</button>
      </div>
    `;

    this._container.querySelector("#snake-game-score").innerText =
      this._game.state.score;

    this._container.querySelector("#snake-game-best-score").innerText =
      this._game.settings.bestScore;

    window.addEventListener("resize", () => {
      if (this._canvas) {
        this._canvas.width = this._container.clientWidth;
      }
    });
  }

  showGameBoard() {
    this._container.innerHTML = `
      <div class="snake-game">
        <canvas id="snake-canvas"></canvas>
      </div>
    `;

    this.showControls();

    this._canvas = this._container.querySelector("#snake-canvas");

    // Set the canvas size to the container size
    this._canvas.width = this._container.clientWidth;
    this._canvas.height = this._container.clientHeight;

    // Draw the game board
    const board = this.board;
    board.fillStyle = this._game.settings.colorPallette.board;
    board.fillRect(0, 0, this._canvas.width, this._canvas.height);
  }

  showControls() {
    this._controls = new DOMParser().parseFromString(
      `<div class="snake-game-controls">
        <div>
          Score: <span id="snake-game-score">0</span> | 
          Best: <span id="snake-game-best-score">0</span>
        </div>
        <button id="snake-game-pause-button">Pause</button>
      </div>`,
      "text/html"
    ).body.firstChild;

    this._controls.querySelector("#snake-game-score").innerText =
      this._game.state.score;

    this._controls.querySelector("#snake-game-best-score").innerText =
      this._game.settings.bestScore;

    this._game.on("eat", (state) => {
      this._controls.querySelector("#snake-game-score").innerText = state.score;
    });

    this._game.on("bestScore", (settings) => {
      this._controls.querySelector("#snake-game-best-score").innerText =
        settings.bestScore;
    });

    this._container.prepend(this._controls);
  }

  get board() {
    if (this._canvas != null) {
      return this._canvas.getContext("2d");
    }
    return {};
  }

  on(event, selector, handler) {
    this._container.addEventListener(event, (e) => {
      if (e.target.matches(selector)) {
        handler(e);
      }
    });
  }
}

class SnakeGameSwipeDetector {
  _startX = 0;
  _startY = 0;
  _endX = 0;
  _endY = 0;

  start() {
    this._startX = 0;
    this._startY = 0;
    this._endX = 0;
    this._endY = 0;

    window.addEventListener("touchstart", this._touchStart);
    window.addEventListener("touchend", this._touchEnd);
    window.addEventListener("keyup", this._keyUp);
  }

  stop() {
    window.removeEventListener("touchstart", this._touchStart);
    window.removeEventListener("touchend", this._touchEnd);
    window.removeEventListener("keyup", this._keyUp);

    this._startX = 0;
    this._startY = 0;
    this._endX = 0;
    this._endY = 0;
  }

  _keyUp(e) {
    switch (e.key) {
      case "w":
      case "ArrowUp":
        SnakeGame.instance.emit("swipe", { direction: "up" });
        break;
      case "d":
      case "ArrowRight":
        SnakeGame.instance.emit("swipe", { direction: "right" });
        break;
      case "s":
      case "ArrowDown":
        SnakeGame.instance.emit("swipe", { direction: "down" });
        break;
      case "ArrowLeft":
      case "a":
        SnakeGame.instance.emit("swipe", { direction: "left" });
        break;
    }
  }

  _touchStart(e) {
    if (!e.target.matches("#snake-canvas")) {
      return;
    }

    this._startX = e.touches[0].clientX;
    this._startY = e.touches[0].clientY;
  }

  _touchEnd(e) {
    if (!e.target.matches("#snake-canvas")) {
      return;
    }

    this._endX = e.changedTouches[0].clientX;
    this._endY = e.changedTouches[0].clientY;

    const deltaX = this._endX - this._startX;
    const deltaY = this._endY - this._startY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        SnakeGame.instance.emit("swipe", { direction: "right" });
      } else {
        SnakeGame.instance.emit("swipe", { direction: "left" });
      }
    } else {
      if (deltaY > 0) {
        SnakeGame.instance.emit("swipe", { direction: "down" });
      } else {
        SnakeGame.instance.emit("swipe", { direction: "up" });
      }
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = SnakeGame;
} else {
  window.SnakeGame = SnakeGame;
}
