const keypress = require("keypress"),
  ansi = require("ansi"),
  cursor = ansi(process.stdout),
  clear = require("clear");

const DIRECTION_UP = { x: 0, y: -1 },
  DIRECTION_DOWN = { x: 0, y: 1 },
  DIRECTION_LEFT = { x: -1, y: 0 },
  DIRECTION_RIGHT = { x: 1, y: 0 };

const windowSize = process.stdout.getWindowSize(),
  AREA_HEIGHT = Math.min(10, windowSize[1] - 1),
  AREA_WIDTH = Math.min(30, windowSize[0]);

const area = [...new Array(AREA_HEIGHT)].map(() =>
  [...new Array(AREA_WIDTH)].map(() => false)
);

let currentDirection = DIRECTION_RIGHT,
  running = true,
  snake = [{ x: AREA_WIDTH / 2, y: AREA_HEIGHT / 2 }];

if (!windowSize || !windowSize.length) {
  console.error("Process not running inside a console window");
  process.exit();
}

const getSpeed = () => Math.max(200, (20 - snake.length) * 20 + 300);

const drawArea = () => {
  cursor
    .reset()
    .goto(0)
    .buffer();
  for (let i = 0; i < area.length; i++) {
    const row = area[i];
    for (let j = 0; j < row.length; j++) {
      const col = row[j];
      if (col) {
        cursor
          .reset()
          .bg.hex("#5b0004")
          .write(" ")
          .bg.reset()
          .reset();
      } else {
        if (i == 0 || j == 0 || i == AREA_HEIGHT - 1 || j == AREA_WIDTH - 1) {
          cursor.bg
            .hex("#666666")
            .write(" ")
            .bg.reset()
            .reset();
        } else {
          cursor
            .reset()
            .bg.hex("#ffffff")
            .write(" ")
            .bg.reset();
        }
      }
    }
    cursor.reset().write("\n");
  }
  cursor.flush().goto(0);
};

const drawSnake = () => {
  for (const part of snake) {
    cursor
      .buffer()
      .reset()
      .bg.green()
      .goto(part.x, part.y)
      .write(" ")
      .bg.reset()
      .reset();
  }
  cursor
    .flush()
    .goto(0)
    .bg.reset();
};

const printLoseScreen = loseMessage => {
  running = false;
  loseMessage = ` ${loseMessage} `.toUpperCase();
  cursor
    .goto((AREA_WIDTH - loseMessage.length) / 2 + 1, AREA_HEIGHT / 2)
    .fg.reset()
    .bg.reset()
    .bg.hex("#666666")
    .write(loseMessage)
    .flush()
    .reset()
    .bg.reset();
  setTimeout(() => {
    process.stdout.write("\x1B[?25h"); // show cursor
    process.stdout.write("\x1Bc"); // clear screen
    clear();
    process.exit();
  }, 2000);
};

const moveSnake = () => {
  snake.unshift({
    x: snake[0].x + currentDirection.x,
    y: snake[0].y + currentDirection.y
  });
  const head = snake[0];
  //   cursor.write(JSON.stringify({ head, area: { area: area[head.y] } })).flush();
  if (area[head.y - 1] && area[head.y - 1][head.x - 1]) {
    area[head.y - 1][head.x - 1] = false;
    cursor.beep();
    placeApple();
  } else {
    snake.pop();
  }
  if (
    head.x <= 1 ||
    head.y <= 1 ||
    head.x >= AREA_WIDTH ||
    head.y >= AREA_HEIGHT
  ) {
    throw new Error("Game Over");
  }
  for (let i = 1; i < snake.length; i++) {
    if (snake[i].x == head.x && snake[i].y == head.y) {
      throw new Error("Game Over");
    }
  }
};

const placeApple = () => {
  const y = Math.floor(Math.random() * (AREA_WIDTH - 2)) + 1,
    x = Math.floor(Math.random() * (AREA_HEIGHT - 2)) + 1;
  area[x][y] = true;
};

const drawScore = () => {
  cursor
    .goto(0)
    .bg.hex("#666666")
    .write(`Points: ${snake.length} Speed: ${getSpeed()}ms`)
    .reset()
    .flush();
};

const loop = () => {
  if (!running) return;
  try {
    drawArea();
    moveSnake();
    drawSnake();
    drawScore();
    setTimeout(loop, getSpeed());
  } catch (error) {
    printLoseScreen(error.message);
  }
};

process.stdin.on("keypress", function(ch, key) {
  if (key && key.ctrl && key.name == "c") {
    printLoseScreen();
  }
  if (key && key.name == "escape") {
    printLoseScreen();
  }
  switch (key && key.name) {
    case "left":
      currentDirection = DIRECTION_LEFT;
      break;
    case "right":
      currentDirection = DIRECTION_RIGHT;
      break;
    case "up":
      currentDirection = DIRECTION_UP;
      break;
    case "down":
      currentDirection = DIRECTION_DOWN;
      break;
  }
});

process.stdin.setRawMode(true);
process.stdin.resume();
keypress(process.stdin);

clear();
process.stdout.write("\x1Bc"); // clear screen
process.stdout.write("\x1B[?25l"); // hide cursor

placeApple();
loop();
