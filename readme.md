# Snake

This is a simple snake game made with vanilla javascript.

## Demo

[![Netlify Status](https://api.netlify.com/api/v1/badges/75138c7d-5d8f-4ccc-a2a2-4e07d68471bf/deploy-status)](https://app.netlify.com/sites/snake-by-jf/deploys)

You can play the game [here](https://snake-by-jf.netlify.app/).

## Accessing the game instance

The game runs in a single instance, to access the game instance you need to import the game and access the `instance` property.

```javascript
import SnakeGame from "./snake.js";
```

or

```html
<script src="snake.js"></script>
```

then

```javascript
const game = SnakeGame.instance;
```

## Settings object

The settings object is a simple object that contains the settings for the game. It has the following properties:

- **bestScore**: The best score of the player. Default is `0`.
- **colorPallette**: The color pallette of the game. It has the following properties:
  - **menu**: The color of the menu. Default is `"rgb(11, 96, 176)"`.
  - **board**: The color of the board. Default is `"rgb(0, 0, 0)"`.
  - **snake**: The color of the snake. Default is `"rgb(64, 162, 216)"`.
  - **food**: The color of the food. Default is `"rgb(240, 237, 207)"`.
  - **text**: The color of the text. Default is `"rgb(255, 255, 255)"`.

Accessing the game settings:

```javascript
const settings = SnakeGame.instance.settings;
```

Updating the game settings, you need to pass an object with the properties you want to update, any properties not set in the object will remain the same, in this example we are only updating the `bestScore` property, the `colorPallette` property will remain the same:

```javascript
SnakeGame.instance.settings = {
  bestScore: 10,
};
```

## State object

The state object is a simple object that contains the state of the game. It has the following properties:

- **running**: A boolean that indicates if the game is running or not. Default is `false`.
- **difficulty**: The difficulty of the game. Default is `5`.
- **score**: The score of the player. Default is `0`.
- **food**: The position of the food. Default is `null`.
- **player**: The player object. It has the following properties:
  - **heading**: The heading of the player. Default is `"right"`.
  - **body**: An array of objects that represents the body of the player. Default is `[{ x: 0, y: 0 }]`.

Accessing the game state:

```javascript
const state = SnakeGame.instance.state;
```

Updating the game state, you need to pass an object with the properties you want to update, any properties not set in the object will remain the same, in this example we are only updating the `score` property, all the other properties will remain the same:

```javascript
SnakeGame.instance.state = {
  score: 10,
};
```

## Methods

The game runs on a defined interval. With the default difficulty of `5`, the game runs at 975ms _(1000ms - 5 \* 5)_ intervals.

When the game state and settings is accessed for the first time it checks if local storage has a saved version of the previous state and settings. If it does, it loads the saved state and settings.

The game has the following methods:

- **start**: Starts the game.
- **restart**: Clears the game state and starts a new game.
- **stop**: Stops the game.
- **pause**: Pauses the game.
- **tick**: Updates the game state and renders the game.
- **gameOver**: Ends the game and saves the best score.
- **renderPlayer**: Renders the player.
- **renderFood**: Renders the food.
- **addFood**: Calculates a new position for the food and adds it to the game state.
- **setTickRate**: Sets the tick rate of the game and saves the new difficulty in the game state. The tick rate is calculated by `1000ms - rate * 5`.
- **eat**: Removes the current food and adds a new one, updates the score and the player body.
- **setColorPallette**: Updates the color pallette of the game and saves the new color pallette in the game settings.

## Events

Each method will fire an event when it is called. You can listen to the events by adding an event listener to the game instance.

```javascript
SnakeGame.instance.on("start", () => {
  console.log("Game started");
});
```

You can fire custom events by calling the `emit` method.

```javascript
SnakeGame.instance.emit("customEvent", "Custom event fired");
```

The event handler will listen to and respond to events internally. The event handler can directly be accessed through the `eventHandler` property of the game instance.

```javascript
const eventHandler = SnakeGame.instance.eventHandler;
```

## DOM Handler

The game has a dom handler class that can be used to update the dom. It can be accessed through the `domHandler` property of the game instance.

```javascript
const domHandler = SnakeGame.instance.domHandler;
```

The dom handler has the following methods:

- **showStartScreen**: Shows the start screen.
- **showResumeScreen**: Shows the resume screen.
- **showGameBoard**: Shows the game board.
- **showControls**: Shows the controls.

You can access the game board canvas through the `board` property of the dom handler.

```javascript
const board = SnakeGame.instance.domHandler.board;
```

## Input

The game can be controlled with the arrow keys, the `W`, `A`, `S`, and `D` keys, or by swiping on on the game board on a touch device.

When an input is detected, the game will update the player heading to the new direction on the next tick using the `swipe` event.

## Development

To build the game, you need to run the following command:

Development build:
```bash
npm run watch
```

Production build:
```bash
npm run build
```

## Conclusion

This game was written in under a day and is a simple implementation of the classic snake game. It is not perfect and has a lot of room for improvement. Feel free to fork the repository and make your own changes.
