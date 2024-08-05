// src/pages/pageElement.ts
var createPageElement = (element) => {
  const el = document.createElement(element.tag);
  if (element.class) {
    el.className = element.class;
  }
  if (element.id) {
    el.id = element.id;
  }
  if (element.value) {
    const val = element.value.toString();
    const inputEl = el;
    inputEl.value = val;
    inputEl.setAttribute("value", val);
  }
  if (element.text) {
    el.textContent = element.text;
  }
  if (element.params) {
    Object.entries(element.params).forEach(([key, value]) => el[key] = value);
  }
  element.children?.forEach((child) => {
    el.appendChild(createPageElement(child));
  });
  return el;
};

// src/pages/pageSwitcher.ts
class PageSwitcher {
  entryPoint;
  currentPage;
  pages;
  constructor(props) {
    this.entryPoint = props.entryPoint;
    this.pages = props.pages;
    if (props.initialPage) {
      this.changePage(props.initialPage, props.initialParams);
    }
  }
  buildLayout() {
    this.entryPoint.innerHTML = "";
    const currentPage = this.pages[this.currentPage];
    this.entryPoint.appendChild(createPageElement(currentPage.render()));
  }
  changePage(pageName, params) {
    if (pageName === this.currentPage) {
      return;
    }
    const prevPage = this.pages[this.currentPage];
    if (prevPage && prevPage.onUnload) {
      prevPage.onUnload();
    }
    this.currentPage = pageName;
    this.buildLayout();
    const currentPage = this.pages[this.currentPage];
    if (currentPage.onLoad) {
      currentPage.onLoad(params);
    }
  }
}

// src/pages/loadingPage.ts
class LoadingPage {
  onLoad({ switcher, ROWS, COLS, MINES }) {
    const progress = document.querySelector("progress");
    const percentIndicator = document.getElementById("percent-indicator");
    if (progress === null) {
      throw new Error("no progress bar on page");
    }
    progress.max = 100;
    if (percentIndicator === null) {
      throw new Error("no percent indicator on page");
    }
    const mapGenerationWorker = new Worker("build/gameMapGeneratorWorker.js");
    mapGenerationWorker.onmessage = (evt) => {
      const data = evt.data;
      if (data.type === "percent") {
        const val = Math.floor(data.value);
        progress.value = val;
        percentIndicator.textContent = `${val}%`;
      } else if (data.type === "result") {
        mapGenerationWorker.terminate();
        switcher.changePage("playing", {
          ROWS,
          COLS,
          MINES,
          mapData: data.value,
          switcher
        });
      } else {
        console.log(data);
      }
    };
    mapGenerationWorker.postMessage({
      cols: COLS,
      rows: ROWS,
      mines: MINES
    });
  }
  render() {
    return {
      tag: "div",
      class: "progressbar-container",
      children: [
        {
          tag: "label",
          text: "Generating map"
        },
        {
          tag: "div",
          class: "progressbar",
          children: [
            {
              tag: "progress"
            },
            {
              tag: "span",
              id: "percent-indicator",
              text: "0%"
            }
          ]
        }
      ]
    };
  }
}

// src/pages/components/toggleBtnBlock.ts
class ToggleBtnBlock {
  name;
  currentVal;
  buttons;
  events;
  handler;
  class;
  constructor(props) {
    this.name = props.name;
    this.buttons = props.buttons;
    this.handler = props.handler;
    this.currentVal = props.defaultValue;
    this.class = props.class;
  }
  setSunken(el) {
    el.classList.remove("bulging");
    el.classList.add("sunken");
  }
  setBulging(el) {
    el.classList.remove("sunken");
    el.classList.add("bulging");
  }
  setCurrentSunken() {
    this.buttons.forEach((btn) => {
      const el = document.getElementById(`${btn.id}-btn`);
      if (btn.id === this.currentVal) {
        this.setSunken(el);
      } else {
        this.setBulging(el);
      }
    });
  }
  setCurrentValue(value) {
    console.log("set value", value);
    this.currentVal = value;
    this.setCurrentSunken();
  }
  onLoad() {
    this.setCurrentSunken();
    this.events = this.buttons.map((btn) => ({
      name: "click",
      target: document.getElementById(`${btn.id}-btn`),
      listener: () => {
        this.currentVal = btn.id;
        this.handler(btn.id);
        this.setCurrentSunken();
      }
    }));
    this.events.forEach(({ name, target, listener }) => {
      target.addEventListener(name, listener);
    });
  }
  onUnload() {
    this.events.forEach(({ name, target, listener }) => {
      target.removeEventListener(name, listener);
    });
  }
  render() {
    const renderBtn = (btn) => ({
      tag: "button",
      id: `${btn.id}-btn`,
      text: `${btn.id}`,
      class: `btn ${btn.class || ""}`
    });
    return {
      tag: "div",
      class: `bulging ${this.class || ""}`,
      children: [
        {
          tag: "h3",
          text: this.name
        },
        ...this.buttons.map(renderBtn)
      ]
    };
  }
}

// src/pages/menuPage.ts
var numberInputBlock = (label, inputParams) => ({
  tag: "div",
  class: "input-block",
  children: [
    {
      tag: "label",
      text: label
    },
    {
      tag: "input",
      params: {
        type: "number",
        ...inputParams
      }
    }
  ]
});
var gameModes = {
  easy: {
    cols: 9,
    rows: 9,
    mines: 10
  },
  medium: {
    cols: 16,
    rows: 16,
    mines: 40
  },
  hard: {
    cols: 30,
    rows: 16,
    mines: 99
  }
};

class MenuPage {
  events;
  cols;
  rows;
  mines;
  gameModeBtnBlock;
  constructor() {
    this.cols = 9;
    this.rows = 9;
    this.mines = 10;
    this.gameModeBtnBlock = new ToggleBtnBlock({
      buttons: [
        {
          id: "easy",
          class: "filled"
        },
        {
          id: "medium",
          class: "filled"
        },
        {
          id: "hard",
          class: "filled"
        }
      ],
      name: "Game Mode",
      class: "main-menu__gamemode-btn-block",
      handler: this.setGameMode.bind(this),
      defaultValue: undefined
    });
  }
  setGameMode(gameMode) {
    const colsInput = document.getElementById("cols-input");
    const rowsInput = document.getElementById("rows-input");
    const minesInput = document.getElementById("mines-input");
    this.cols = gameModes[gameMode].cols;
    this.rows = gameModes[gameMode].rows;
    this.mines = gameModes[gameMode].mines;
    colsInput.value = this.cols.toString();
    rowsInput.value = this.rows.toString();
    minesInput.value = this.mines.toString();
  }
  onLoad(switcher) {
    const colsInput = document.getElementById("cols-input");
    const rowsInput = document.getElementById("rows-input");
    const minesInput = document.getElementById("mines-input");
    const submitBtn = document.getElementById("submit");
    const setNewMinesInputMax = () => {
      const minesInput2 = document.getElementById("mines-input");
      const newMax = this.rows * this.cols - 1;
      minesInput2.max = newMax.toString();
      if (parseInt(minesInput2.value) > newMax) {
        minesInput2.value = newMax.toString();
      }
    };
    this.events = [
      {
        name: "change",
        target: colsInput,
        listener: (ev) => {
          this.cols = parseInt(ev.target.value);
          setNewMinesInputMax();
        }
      },
      {
        name: "change",
        target: rowsInput,
        listener: (ev) => {
          this.rows = parseInt(ev.target.value);
          setNewMinesInputMax();
        }
      },
      {
        name: "change",
        target: minesInput,
        listener: (ev) => {
          this.mines = parseInt(ev.target.value);
        }
      },
      {
        name: "click",
        target: submitBtn,
        listener: () => {
          switcher.changePage("loading", {
            COLS: this.cols,
            ROWS: this.rows,
            MINES: this.mines,
            switcher
          });
        }
      }
    ];
    this.events.forEach(({ name, target, listener }) => {
      target.addEventListener(name, listener);
    });
    this.gameModeBtnBlock.onLoad();
  }
  onUnload() {
    this.events.forEach(({ name, target, listener }) => {
      target.removeEventListener(name, listener);
    });
    this.gameModeBtnBlock.onUnload();
  }
  render() {
    return {
      tag: "div",
      class: "main-menu",
      children: [
        this.gameModeBtnBlock.render(),
        {
          tag: "div",
          class: "main-menu__input-block",
          children: [
            numberInputBlock("cols", {
              id: "cols-input",
              min: 9,
              value: this.cols
            }),
            numberInputBlock("rows", {
              id: "rows-input",
              min: 9,
              value: this.rows
            }),
            numberInputBlock("mines", {
              id: "mines-input",
              value: this.mines,
              min: 0,
              max: 80
            })
          ]
        },
        {
          tag: "button",
          class: "btn filled bulging",
          id: "submit",
          text: "\u041D\u0430\u0447\u0430\u0442\u044C \u0438\u0433\u0440\u0443"
        }
      ]
    };
  }
}

// src/models.ts
var makeCoords = (x, y) => ({ x, y });
var unfoldCoords = (coords) => {
  return [coords.x, coords.y];
};

// src/utils.ts
var clamp = (min, num, max) => {
  return Math.min(Math.max(num, min), max);
};
var clampCoords = (min, coords, max) => {
  return {
    x: clamp(min.x, coords.x, max.x),
    y: clamp(min.y, coords.y, max.y)
  };
};
var addVectors = (first, second) => {
  return makeCoords(first.x + second.x, first.y + second.y);
};
var substractVectors = (first, second) => {
  return makeCoords(first.x - second.x, first.y - second.y);
};
var range = (n, m) => {
  if (m === undefined) {
    return [...Array(n).keys()];
  }
  return range(m - n).map((x) => x + n);
};
var permutations = (a, b) => {
  let res = [];
  for (let i = 0;i < a.length; i++) {
    for (let j = 0;j < b.length; j++) {
      res.push([a[i], b[j]]);
    }
  }
  return res;
};
var randInt = (max) => {
  return Math.floor(Math.random() * max);
};
var getCollisionPos = (pos, rect) => {
  return {
    x: pos.x - rect.x,
    y: pos.y - rect.y,
    collision: pos.x > rect.x && pos.y > rect.y && pos.x < rect.x2 && pos.y < rect.y2
  };
};

// src/display/display.ts
var display = {
  tag: "div",
  class: "s7s",
  children: [
    {
      tag: "input",
      params: {
        hidden: true
      }
    },
    ...range(7).map(() => ({
      tag: "seg"
    }))
  ]
};
var displayBlock = (id, displayCnt = 3) => ({
  tag: "div",
  id,
  class: "s7s-container",
  children: [
    ...range(displayCnt).map(() => display)
  ]
});
var setValue = (element, value) => {
  element.value = value;
  element.setAttribute("value", value);
};
var setDisplayValue = (display2, value) => {
  const displaySize = display2.children.length;
  const str = (value % Math.pow(10, displaySize)).toString();
  const padding = displaySize - str.length;
  for (let i = 0;i < padding; i++) {
    setValue(display2.children[i].children[0], "0");
  }
  for (let i = 0;i < str.length; i++) {
    setValue(display2.children[padding + i].children[0], str[i]);
  }
};

// src/consts.ts
var MINE_VALUE = 10;
var FLAG_OVERFLOW = 50;
var HIDDEN_OVERFLOW = 100;
var ROWL = 50;
var COLL = 50;
var CHUNKW = 40;
var CHUNKH = 40;

// src/core/matrix.ts
class Matrix {
  data;
  rows;
  cols;
  dataRows;
  constructor(props) {
    this.rows = props.rows;
    this.cols = props.cols;
    if (props.data) {
      this.data = props.data;
    } else {
      this.data = new Uint8Array(this.rows * this.cols);
    }
    this.dataRows = [];
    for (let i = 0;i < this.rows; i++) {
      this.dataRows.push(new Uint8Array(this.data.buffer, this.cols * i, this.cols));
    }
    return new Proxy(this, {
      get: (obj, key) => {
        if (typeof key === "string" && Number.isInteger(Number(key)))
          return obj.dataRows[key];
        else
          return obj[key];
      }
    });
  }
}

// src/core/mapGeneration.ts
class MapGenerator {
  matrix;
  cols;
  rows;
  mines;
  neighbourDeltas;
  constructor(props) {
    this.cols = props.cols;
    this.rows = props.rows;
    this.mines = props.mines;
    const indices = range(-1, 2);
    this.neighbourDeltas = permutations(indices, indices).filter(([i, j]) => !(i === 0 && j === 0));
  }
  hasBomb(i, j) {
    if (i < 0 || i >= this.rows || j < 0 || j >= this.cols) {
      return false;
    }
    const mapValue = this.matrix[i][j];
    return mapValue === MINE_VALUE || mapValue === MINE_VALUE + HIDDEN_OVERFLOW;
  }
  calcValue(y, x) {
    if (this.matrix[y][x] === MINE_VALUE) {
      return MINE_VALUE;
    }
    const bombCnt = this.neighbourDeltas.map(([i, j]) => this.hasBomb(y + i, x + j) ? 1 : 0).reduce((sum, n) => sum + n, 0);
    return bombCnt;
  }
  repositionMine(row, col) {
    const [newRow, newCol] = this.findMinePlace();
    this.matrix[row][col] = this.calcValue(row, col) + HIDDEN_OVERFLOW;
    this.matrix[newRow][newCol] = MINE_VALUE + HIDDEN_OVERFLOW;
    const handleNotMines = (baseRow, baseCol, cb) => {
      return ([y, x]) => {
        const i = baseRow + y;
        const j = baseCol + x;
        if (i < 0 || i >= this.rows || j < 0 || j >= this.cols || this.matrix[i][j] === MINE_VALUE || this.matrix[i][j] === MINE_VALUE + HIDDEN_OVERFLOW) {
          return;
        }
        cb(i, j);
      };
    };
    this.neighbourDeltas.forEach(handleNotMines(row, col, (i, j) => this.matrix[i][j]--));
    this.neighbourDeltas.forEach(handleNotMines(newRow, newCol, (i, j) => this.matrix[i][j]++));
  }
  findMinePlace() {
    let row = randInt(this.rows);
    let col = randInt(this.cols);
    let tries = 0;
    const maxTries = 10;
    while (this.matrix[row][col] === MINE_VALUE + HIDDEN_OVERFLOW && tries < maxTries) {
      row = randInt(this.rows);
      col = randInt(this.cols);
      tries++;
    }
    return [row, col];
  }
  generateMap(cb) {
    this.matrix = new Matrix({
      rows: this.rows,
      cols: this.cols
    });
    let currNumOfOperations = 0;
    const totalNumOfOperations = this.cols * this.rows + this.mines;
    const list = [];
    let index = 0;
    for (let row = 0;row < this.matrix.rows; row++) {
      for (let col = 0;col < this.matrix.cols; col++) {
        const thisIndex = index;
        index++;
        if (index < this.mines) {
          list.push([row, col]);
        } else {
          const j = randInt(thisIndex);
          if (j < this.mines) {
            list[j] = [row, col];
          }
        }
      }
    }
    list.forEach(([row, col]) => this.matrix[row][col] = MINE_VALUE);
    for (let row = 0;row < this.matrix.rows; row++) {
      currNumOfOperations += this.matrix.rows;
      if (cb) {
        cb(currNumOfOperations / totalNumOfOperations * 100);
      }
      for (let col = 0;col < this.matrix.cols; col++) {
        this.matrix[row][col] = this.calcValue(row, col) + HIDDEN_OVERFLOW;
      }
    }
    return this.matrix;
  }
}

// src/core/gameEngine.ts
class GameEngine {
  map;
  view;
  renderer;
  minesVisible;
  firstTileOpen;
  gameGoing;
  onGameOver;
  openedTiles;
  constructor(props) {
    this.map = props.map;
    this.view = props.view;
    this.renderer = props.renderer;
    this.minesVisible = false;
    this.firstTileOpen = true;
    this.gameGoing = true;
    this.openedTiles = 0;
  }
  stopGame(status = "lose") {
    this.gameGoing = false;
    this.showAllMines();
    this.onGameOver(status);
  }
  updateOffset() {
    this.renderer.updateOffset(this.map, this.view.offset);
  }
  update() {
    this.view.updateViewSize();
    this.renderer.render({
      viewportSize: this.view.viewSize,
      view: this.view,
      COLS: this.map.COLS,
      ROWS: this.map.ROWS,
      minesVisible: this.minesVisible,
      map: this.map
    });
    requestAnimationFrame(() => this.update());
  }
  getTileFromMouseCoords(coords) {
    return {
      x: Math.floor((coords.x + this.view.offset.x) / this.map.COLL),
      y: Math.floor((this.view.viewSize.y - coords.y + this.view.offset.y) / this.map.ROWL)
    };
  }
  processLeftClick(coords) {
    const collision = this.view.processScrollClick(coords);
    if (!collision && this.gameGoing) {
      const tile = this.getTileFromMouseCoords(coords);
      this.openTile(tile);
    }
  }
  showAllMines() {
    this.minesVisible = true;
  }
  processRightClick(coords) {
    if (!this.gameGoing) {
      return;
    }
    const tile = this.getTileFromMouseCoords(coords);
    this.map.toggleFlagAt(tile);
    this.updateOffset();
  }
  updateOpenedTilesCnt(cnt = 1) {
    this.openedTiles++;
    if (this.openedTiles === this.map.tilesCnt - this.map.minesTotal) {
      this.stopGame("win");
    }
  }
  openTile(tileCoords) {
    const val = this.map.getMapVal(tileCoords);
    if (this.firstTileOpen) {
      this.firstTileOpen = false;
      if (val === MINE_VALUE + HIDDEN_OVERFLOW) {
        const mapGenerator = new MapGenerator({
          cols: this.map.COLS,
          rows: this.map.ROWS,
          mines: this.map.minesTotal
        });
        mapGenerator.matrix = this.map.matrix;
        mapGenerator.repositionMine(tileCoords.y, tileCoords.x);
        this.openTile(tileCoords);
        return;
      }
    }
    if (this.map.isHidden(val) && val !== HIDDEN_OVERFLOW) {
      this.map.matrix[tileCoords.y][tileCoords.x] -= HIDDEN_OVERFLOW;
      if (this.map.getMapVal(tileCoords) === MINE_VALUE) {
        this.stopGame();
      }
      this.updateOpenedTilesCnt();
      this.updateOffset();
    } else if (val === HIDDEN_OVERFLOW) {
      const q = [];
      q.push(tileCoords);
      const coordsDeltas = [
        makeCoords(-1, 0),
        makeCoords(0, -1),
        makeCoords(1, 0),
        makeCoords(0, 1)
      ];
      const processTile = (tileCoords2) => {
        this.map.matrix[tileCoords2.y][tileCoords2.x] -= HIDDEN_OVERFLOW;
        this.updateOpenedTilesCnt();
        if (this.map.matrix[tileCoords2.y][tileCoords2.x] > 0) {
          return;
        }
        const coords = coordsDeltas.map((delta) => addVectors(tileCoords2, delta));
        coords.forEach((coord) => {
          if (this.map.tileInBounds(coord)) {
            const val2 = this.map.getMapVal(coord);
            if (val2 >= HIDDEN_OVERFLOW && val2 !== HIDDEN_OVERFLOW + MINE_VALUE) {
              q.push(coord);
            }
          }
        });
      };
      const processTilesFromQueue = (queue, num) => {
        for (let i = 0;i < num && queue.length > 0; i++) {
          const curr = q.shift();
          if (curr === undefined || this.map.matrix[curr.y][curr.x] < HIDDEN_OVERFLOW) {
            continue;
          }
          processTile(curr);
        }
        if (queue.length > 0) {
          setTimeout(() => processTilesFromQueue(queue, num), 0);
        }
        this.updateOffset();
      };
      processTilesFromQueue(q, 1000);
    }
  }
  processMouseMove(mouseCoords) {
    this.view.processScrollMove(mouseCoords);
  }
  processMouseUp() {
    this.view.processMouseUp();
  }
  processWheel(offsetDelta) {
    this.view.updateOffset(offsetDelta);
  }
}

// src/core/gameMap.ts
class GameMap {
  matrix;
  ROWS;
  COLS;
  ROWL;
  COLL;
  CHUNKW;
  CHUNKH;
  onMinesRemainingUpdate;
  minesTotal;
  minesRemaining;
  constructor(props) {
    this.ROWS = props.ROWS;
    this.COLS = props.COLS;
    this.ROWL = props.ROWL;
    this.COLL = props.COLL;
    this.CHUNKW = props.CHUNKW || 0;
    this.CHUNKH = props.CHUNKH || 0;
    this.minesRemaining = 0;
  }
  calcChunkSize(viewSize) {
    this.CHUNKW = Math.floor(viewSize.x / this.COLL) + 1;
    this.CHUNKH = Math.floor(viewSize.y / this.ROWL) + 1;
  }
  generateMap(mines) {
    this.minesTotal = mines;
    this.minesRemaining = mines;
    const mapGenerator = new MapGenerator({
      cols: this.COLS,
      rows: this.ROWS,
      mines
    });
    let prevPercent = 0;
    const minPercentDiff = 2;
    this.matrix = mapGenerator.generateMap((percent) => {
      if (Math.floor(percent) - prevPercent > minPercentDiff) {
        prevPercent = Math.floor(percent);
        console.log(percent);
      }
    });
  }
  createVertexGridChunk(chunk) {
    const grid = [];
    const width = this.COLL;
    const height = this.ROWL;
    const mask = [
      [0, 0],
      [0, 1],
      [1, 0],
      [0, 1],
      [1, 0],
      [1, 1]
    ];
    for (let i = chunk.y * this.CHUNKH;i < Math.min((chunk.y + 1) * this.CHUNKH, this.ROWS); i++) {
      const y = i * height;
      for (let j = chunk.x * this.CHUNKW;j < Math.min((chunk.x + 1) * this.CHUNKW, this.COLS); j++) {
        const x = j * width;
        grid.push(...mask.flatMap(([a, b]) => [x + a * width, y + b * height]));
      }
    }
    return grid;
  }
  createTextureCoordsChunk(chunk) {
    const coords = [];
    const mask = [
      [0, 0],
      [0, 1],
      [1, 0],
      [0, 1],
      [1, 0],
      [1, 1]
    ];
    const width = 0.09090909090909091;
    for (let i = chunk.y * this.CHUNKH;i < Math.min((chunk.y + 1) * this.CHUNKH, this.ROWS); i++) {
      for (let j = chunk.x * this.CHUNKW;j < Math.min((chunk.x + 1) * this.CHUNKW, this.COLS); j++) {
        coords.push(...mask.flatMap(([a, b]) => [(this.matrix[i][j] + a) * width, b]));
      }
    }
    return coords;
  }
  getMapVal(coords) {
    return this.matrix[coords.y][coords.x];
  }
  isHidden(val) {
    return val >= HIDDEN_OVERFLOW && val < FLAG_OVERFLOW + HIDDEN_OVERFLOW;
  }
  isFlag(val) {
    return val >= FLAG_OVERFLOW && val < HIDDEN_OVERFLOW || val >= FLAG_OVERFLOW + HIDDEN_OVERFLOW;
  }
  isHiddenAt(tile) {
    return this.isHidden(this.getMapVal(tile));
  }
  isFlagAt(tile) {
    return this.isFlag(this.getMapVal(tile));
  }
  setFlagAt(tile) {
    this.matrix[tile.y][tile.x] += FLAG_OVERFLOW;
    this.minesRemaining--;
    if (this.onMinesRemainingUpdate) {
      this.onMinesRemainingUpdate(this.minesRemaining);
    }
  }
  removeFlagAt(tile) {
    this.minesRemaining++;
    this.matrix[tile.y][tile.x] -= FLAG_OVERFLOW;
    if (this.onMinesRemainingUpdate) {
      this.onMinesRemainingUpdate(this.minesRemaining);
    }
  }
  tileInBounds(coords) {
    return coords.x >= 0 && coords.y >= 0 && coords.x < this.COLS && coords.y < this.ROWS;
  }
  toggleFlagAt(tile) {
    const val = this.getMapVal(tile);
    if (!this.isHidden(val) && !this.isFlag(val)) {
      return;
    }
    if (this.isFlag(val)) {
      this.removeFlagAt(tile);
    } else {
      this.setFlagAt(tile);
    }
  }
  getChunk(coords) {
    return {
      x: Math.floor(coords.x / this.COLL / this.CHUNKW),
      y: Math.floor(coords.y / this.ROWL / this.CHUNKH)
    };
  }
  get tilesCnt() {
    return this.ROWS * this.COLS;
  }
}

// src/pages/components/menu.ts
class GameMenu {
  minesDisplay;
  timerDisplay;
  restartBtn;
  restartBtnStatus;
  gameTickTimer;
  constructor(props) {
    this.minesDisplay = props.minesDisplay;
    this.timerDisplay = props.timerDisplay;
    this.restartBtn = props.restartBtn;
  }
  setMinesDisplayValue(value) {
    setDisplayValue(this.minesDisplay, value);
  }
  setTimerDisplayValue(value) {
    setDisplayValue(this.timerDisplay, value);
  }
  startTimer() {
    let time = 0;
    this.gameTickTimer = setInterval(() => {
      time++;
      setDisplayValue(this.timerDisplay, time);
    }, 1000);
  }
  stopTimer() {
    clearInterval(this.gameTickTimer);
  }
  get restartBtnSrc() {
    return `/textures/smiles/${this.restartBtnStatus}.png`;
  }
  setRestartBtnStatus(status) {
    this.restartBtnStatus = status;
    this.restartBtn.children[0].src = this.restartBtnSrc;
  }
}

// src/renderers/buffer.ts
class GLBuffer {
  gl;
  location;
  size;
  type;
  dataType;
  buf;
  constructor(props) {
    this.gl = props.gl;
    this.location = props.location;
    this.size = props.size;
    this.type = props.type;
    this.dataType = props.dataType;
    const buf = this.gl.createBuffer();
    if (buf === null) {
      throw new Error("buf was not be created");
    }
    this.buf = buf;
    this.bind();
    this.gl.vertexAttribPointer(props.location, props.size, this.dataType, false, 0, 0);
    this.gl.enableVertexAttribArray(this.location);
  }
  setData(data, usage) {
    this.bind();
    this.gl.bufferData(this.type, data, usage || this.gl.STATIC_DRAW);
  }
  bind() {
    this.gl.bindBuffer(this.type, this.buf);
  }
}

// src/renderers/texture.ts
var isPowerOf2 = function(value) {
  return (value & value - 1) === 0;
};
var loadTexture = (gl, url) => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);
  const image = new Image;
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.crossOrigin = "anonymous";
  image.src = url;
  return texture;
};

// src/caching.ts
class Cacher {
  db;
  scheduledReads;
  scheduledPuts;
  constructor(props) {
    this.scheduledReads = [];
    this.scheduledPuts = [];
    const openRequest = indexedDB.open(props.dbname, props.version);
    openRequest.onupgradeneeded = (event) => {
      this.db = openRequest.result;
      if (event.oldVersion === 0) {
        if (!this.db.objectStoreNames.contains("Settings")) {
          this.db.createObjectStore("Settings", { keyPath: "id" });
          this.db.createObjectStore("Session", { keyPath: "id" });
        }
      }
    };
    openRequest.onerror = () => {
      console.error("Error", openRequest.error);
    };
    openRequest.onsuccess = () => {
      this.db = openRequest.result;
      this.performScheduledReads();
      this.performScheduledPuts();
    };
  }
  performScheduledPuts() {
    this.scheduledPuts.forEach(({ store, obj }) => {
      this.put(store, obj);
    });
  }
  performScheduledReads() {
    this.scheduledReads.forEach(({ transaction, store, id, resolve, reject }) => {
      if (transaction === undefined) {
        this.read(store, id).then((value) => resolve(value)).catch((reason) => reject(reason));
      } else {
        this.readInsideTransaction(transaction, store, id).then((value) => resolve(value)).catch((reason) => reject(reason));
      }
    });
  }
  scheduleRead(store, id, transaction) {
    return new Promise((resolve, reject) => {
      this.scheduledReads.push({
        store,
        id,
        resolve,
        reject
      });
    });
  }
  schedulePut(store, obj) {
    this.scheduledPuts.push({
      store,
      obj
    });
  }
  put(store, obj) {
    let transaction = this.db.transaction(store, "readwrite");
    let storeObj = transaction.objectStore(store);
    let request = storeObj.put(obj);
    request.onsuccess = function() {
      console.log("Setting added to store", request.result);
    };
    request.onerror = function() {
      console.log("Error while inserting setting into store", request.error);
    };
  }
  safePut(store, obj) {
    if (this.db) {
      this.put(store, obj);
    } else {
      this.schedulePut(store, obj);
    }
  }
  putSetting(setting) {
    this.safePut("Settings", setting);
  }
  readInsideTransaction(transaction, store, id) {
    return new Promise((resolve, reject) => {
      let storeObj = transaction.objectStore(store);
      const request = storeObj.get(id);
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.value);
        } else {
          resolve(undefined);
        }
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  read(store, id) {
    let transaction = this.db.transaction(store, "readonly");
    return this.readInsideTransaction(transaction, store, id);
  }
  remove(store, id) {
    let transaction = this.db.transaction(store, "readwrite");
    let storeObj = transaction.objectStore(store);
    storeObj.delete(id);
  }
  safeRead(store, id, transaction) {
    if (this.db) {
      return this.read(store, id);
    }
    return this.scheduleRead(store, id, transaction);
  }
  readSetting(id) {
    return this.safeRead("Settings", id);
  }
  saveCurrentSession(session) {
    let transaction = this.db.transaction("Session", "readwrite");
    const sessionObj = transaction.objectStore("Session");
    sessionObj.put({ id: "cols", value: session.cols });
    sessionObj.put({ id: "rows", value: session.rows });
    sessionObj.put({ id: "mines", value: session.mines });
    sessionObj.put({ id: "mapData", value: session.mapData });
    sessionObj.put({ id: "offset", value: session.offset });
  }
  async loadPrevSession() {
    const readSessionProp = (id) => this.safeRead("Session", id);
    const cols = readSessionProp("cols");
    const row = readSessionProp("rows");
    const mines = readSessionProp("mines");
    const mapData = readSessionProp("mapData");
    const offset = readSessionProp("offset");
    const session = await Promise.all([cols, row, mines, mapData, offset]);
    return {
      cols: session[0],
      rows: session[1],
      mines: session[2],
      mapData: session[3],
      offset: session[4]
    };
  }
}
var cacher = new Cacher({
  dbname: "test",
  version: 1
});

// src/themes.ts
var themes = {
  main: {
    pageBgColor: [204, 204, 204],
    bgColor: [204, 196, 179],
    borderBlack: [0, 0, 0],
    borderWhite: [255, 255, 255],
    gridBorderColor: [179, 179, 179],
    scrollbarColor: [77, 77, 77]
  },
  dark: {
    pageBgColor: [60, 60, 60],
    bgColor: [57, 57, 57],
    borderBlack: [0, 0, 0],
    borderWhite: [110, 110, 110],
    gridBorderColor: [179, 179, 179],
    scrollbarColor: [77, 77, 77]
  }
};
var getStyleFromColor = ([r, g, b]) => {
  return `rgb(${r}, ${g}, ${b})`;
};

class ThemeChangesMediator {
  callbacks;
  constructor() {
    this.callbacks = new Map;
  }
  publishChangeTheme(themeName) {
    this.callbacks.forEach((cb) => {
      cb({
        themeName,
        theme: themes[themeName]
      });
    });
  }
  subscribe(key, cb) {
    this.callbacks.set(key, cb);
  }
  unsubscribe(key) {
    this.callbacks.delete(key);
  }
}

class ThemeProcessor {
  currentTheme;
  cssVars;
  mediator;
  constructor(props) {
    this.mediator = new ThemeChangesMediator;
    this.cssVars = {
      "--page-bg-color": "pageBgColor",
      "--bg-color": "bgColor",
      "--border-gradient-black": "borderBlack",
      "--border-gradient-white": "borderWhite"
    };
    this.setTheme(props.defaultTheme, false);
    cacher.readSetting("theme").then((theme) => {
      this.setTheme(theme || "main", false);
    }).catch((error) => console.error(error));
  }
  setCSSVars() {
    Object.entries(this.cssVars).forEach(([cssVar, color]) => {
      const styledColor = getStyleFromColor(themes[this.currentTheme][color]);
      document.documentElement.style.setProperty(cssVar, styledColor);
    });
  }
  setTheme(theme, save = true) {
    if (theme === this.currentTheme) {
      return;
    }
    this.currentTheme = theme;
    this.setCSSVars();
    this.mediator.publishChangeTheme(theme);
    if (save) {
      cacher.putSetting({
        id: "theme",
        value: theme
      });
    }
  }
}
var createThemeObj = (defaultTheme) => {
  const theme = new ThemeProcessor({ defaultTheme });
  const attrs = Object.keys(Object.values(themes)[0]);
  const properties = Object.fromEntries(attrs.map((attr) => [
    attr,
    {
      get: function() {
        return themes[theme.currentTheme][attr];
      }
    }
  ]));
  Object.defineProperties(theme, properties);
  const styleObj = {};
  const styleProperties = Object.fromEntries(attrs.map((attr) => [
    attr,
    {
      get: function() {
        return getStyleFromColor(themes[theme.currentTheme][attr]);
      }
    }
  ]));
  Object.defineProperties(styleObj, styleProperties);
  Object.defineProperty(theme, "style", {
    value: styleObj
  });
  return theme;
};
var theme = createThemeObj("main");

// src/renderers/glRenderer.ts
class GLRenderer {
  vBuf;
  textureBuffer;
  dataArray;
  dataLength;
  gl;
  program;
  currentBaseChunk;
  constructor(props) {
    this.gl = props.gl;
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    const program = this.gl.createProgram();
    if (program === null) {
      throw new Error("program is null");
    }
    this.program = program;
    this.loadShaders(props.vertexShaderSource, props.fragmenShaderSource);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const linkErrLog = this.gl.getProgramInfoLog(program);
      console.error(`Shader program did not link successfully. Error log: ${linkErrLog}`);
      return;
    }
    const locations = {
      vertexCoords: this.gl.getAttribLocation(program, "aPosition"),
      textureCoords: this.gl.getAttribLocation(program, "aTextureCoord"),
      digitNum: this.gl.getAttribLocation(program, "digitNum"),
      sampler: this.gl.getUniformLocation(program, "uSampler")
    };
    this.gl.useProgram(this.program);
    this.onChangeTheme({ themeName: theme.currentTheme });
    theme.mediator.subscribe("gl", this.onChangeTheme.bind(this));
    this.vBuf = new GLBuffer({
      gl: this.gl,
      location: locations.vertexCoords,
      size: 2,
      type: this.gl.ARRAY_BUFFER,
      dataType: this.gl.FLOAT
    });
    this.textureBuffer = new GLBuffer({
      gl: this.gl,
      location: locations.textureCoords,
      size: 2,
      type: this.gl.ARRAY_BUFFER,
      dataType: this.gl.FLOAT
    });
    this.currentBaseChunk = makeCoords(0, 0);
    this.dataLength = 0;
  }
  onChangeTheme({ themeName }) {
    const samplerLocation = this.gl.getUniformLocation(this.program, "uSampler");
    if (themeName === "dark") {
      this.loadTexture(samplerLocation, "/textures/dark_digits.png");
    } else {
      this.loadTexture(samplerLocation, "/textures/digits.png");
    }
  }
  destruct() {
    this.gl.useProgram(null);
    if (this.program) {
      this.gl.deleteProgram(this.program);
    }
  }
  compileShader(source, type) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    let error_log = this.gl.getShaderInfoLog(shader);
    console.log(error_log);
    return shader;
  }
  loadShaders(vertexShaderSource, fragmenShaderSource) {
    const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmenShaderSource, this.gl.FRAGMENT_SHADER);
    this.attachShaders(vertexShader, fragmentShader);
  }
  attachShaders(vertexShader, fragmentShader) {
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);
    this.gl.detachShader(this.program, vertexShader);
    this.gl.detachShader(this.program, fragmentShader);
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      const linkErrLog = this.gl.getProgramInfoLog(this.program);
      console.error(`Shader program did not link successfully. Error log: ${linkErrLog}`);
      return false;
    }
    return true;
  }
  loadChunk(map, chunk) {
    this.dataArray = map.createVertexGridChunk(chunk);
    this.dataLength = this.dataArray.length;
    const textureCoords = map.createTextureCoordsChunk(chunk);
    this.vBuf.setData(new Float32Array(this.dataArray));
    this.textureBuffer.setData(new Float32Array(textureCoords));
  }
  loadChunks(map, chunks) {
    this.dataArray = chunks.flatMap(map.createVertexGridChunk.bind(map));
    this.dataLength = this.dataArray.length;
    const textureCoords = chunks.flatMap((chunk) => map.createTextureCoordsChunk(chunk));
    this.vBuf.setData(new Float32Array(this.dataArray));
    this.textureBuffer.setData(new Float32Array(textureCoords));
  }
  updateOffset(map, offset) {
    const chunkDeltas = [
      makeCoords(0, 0),
      makeCoords(0, 1),
      makeCoords(1, 0),
      makeCoords(1, 1)
    ];
    const chunk = map.getChunk(offset);
    if (chunk !== this.currentBaseChunk) {
      this.currentBaseChunk = chunk;
      this.loadChunks(map, chunkDeltas.map((delta) => addVectors(chunk, delta)));
    }
  }
  setFUniform(location, value) {
    const glLocation = this.gl.getUniformLocation(this.program, location);
    this.gl.uniform1f(glLocation, value);
  }
  setVec2FUniform(location, value) {
    const glLocation = this.gl.getUniformLocation(this.program, location);
    this.gl.uniform2fv(glLocation, value);
  }
  setVec3FUniform(location, value) {
    const glLocation = this.gl.getUniformLocation(this.program, location);
    this.gl.uniform3fv(glLocation, value);
  }
  loadTexture(samplerLocation, texturePath) {
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
    const texture2 = loadTexture(this.gl, texturePath);
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture2);
    this.gl.uniform1i(samplerLocation, 0);
  }
  render(props) {
    this.gl.viewport(0, 0, props.viewportSize.x, props.viewportSize.y);
    this.setVec2FUniform("fullSize", [props.view.fullSize.x, props.view.fullSize.y]);
    this.setVec2FUniform("viewSize", [props.view.viewSize.x, props.view.viewSize.y]);
    this.setVec2FUniform("offset", [props.view.offset.x, props.view.offset.y]);
    this.setVec2FUniform("matrixSize", [props.COLS, props.ROWS]);
    this.setFUniform("minesVisible", props.minesVisible ? 1 : 0);
    this.setVec3FUniform("bgColor", theme.bgColor);
    this.setVec3FUniform("gridBorderColor", theme.gridBorderColor);
    this.setVec3FUniform("scrollbarColor", theme.scrollbarColor);
    this.setVec3FUniform("borderBlack", theme.borderBlack);
    this.setVec3FUniform("borderWhite", theme.borderWhite);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.dataLength / 2);
  }
}

// src/core/view.ts
class MinesweeperView {
  fullSize;
  viewSize;
  offset;
  HScrollClickPos;
  VScrollClickPos;
  originalOffset;
  canvasCoords;
  canvas;
  onOffsetUpdate;
  constructor(props) {
    this.fullSize = props.fullSize;
    this.viewSize = props.viewSize;
    this.offset = props.offset || { x: 0, y: 0 };
    this.HScrollClickPos = undefined;
    this.VScrollClickPos = undefined;
    this.canvas = props.canvas;
    this.canvasCoords = this.getCanvasCoords();
  }
  getCanvasCoords() {
    const coords = this.canvas.getBoundingClientRect();
    return {
      x: coords.x,
      y: coords.y
    };
  }
  updateCanvasCoords() {
    this.canvasCoords = this.getCanvasCoords();
  }
  get HScrollCoords() {
    const x = this.offset.x / this.fullSize.x * this.viewSize.x;
    const y = this.viewSize.y - 10;
    const x2 = (this.offset.x + this.viewSize.x) / this.fullSize.x * this.viewSize.x;
    const y2 = this.viewSize.y;
    return {
      x,
      y,
      x2,
      y2,
      width: x2 - x,
      height: y2 - y
    };
  }
  get VScrollCoords() {
    const x = this.viewSize.x - 10;
    const y2 = this.viewSize.y - this.offset.y / this.fullSize.y * this.viewSize.y;
    const x2 = this.viewSize.x;
    const y = this.viewSize.y - (this.offset.y + this.viewSize.y) / this.fullSize.y * this.viewSize.y;
    return {
      x,
      y,
      x2,
      y2,
      width: x2 - x,
      height: y2 - y
    };
  }
  getHCollisionPos(pos) {
    return getCollisionPos(pos, this.HScrollCoords);
  }
  getVCollisionPos(pos) {
    return getCollisionPos(pos, this.VScrollCoords);
  }
  setOffsetX(x) {
    this.offset.x = clamp(0, x, this.fullSize.x - this.viewSize.x);
    if (this.onOffsetUpdate !== undefined) {
      this.onOffsetUpdate();
    }
  }
  setOffsetY(y) {
    this.offset.y = clamp(0, y, this.fullSize.y - this.viewSize.y);
    if (this.onOffsetUpdate !== undefined) {
      this.onOffsetUpdate();
    }
  }
  setOffset(update) {
    const minCoords = makeCoords(0, 0);
    const maxCoords = substractVectors(this.fullSize, this.viewSize);
    this.offset = clampCoords(minCoords, update, maxCoords);
    if (this.onOffsetUpdate !== undefined) {
      this.onOffsetUpdate();
    }
  }
  updateOffset(update) {
    this.setOffset(addVectors(this.offset, update));
  }
  updateViewSize() {
    this.viewSize = {
      x: this.canvas.clientWidth,
      y: this.canvas.clientHeight
    };
    this.canvas.width = this.viewSize.x;
    this.canvas.height = this.viewSize.y;
  }
  processScrollClick(coords) {
    const HCollisionCoords = this.getHCollisionPos(coords);
    const VCollisionCoords = this.getVCollisionPos(coords);
    let collision = false;
    if (HCollisionCoords.collision) {
      this.HScrollClickPos = coords;
      this.originalOffset = {
        x: this.offset.x,
        y: this.offset.y
      };
      collision = true;
    } else {
      this.HScrollClickPos = undefined;
    }
    if (VCollisionCoords.collision) {
      this.VScrollClickPos = coords;
      this.originalOffset = {
        x: this.offset.x,
        y: this.offset.y
      };
      collision = true;
    } else {
      this.VScrollClickPos = undefined;
    }
    return collision;
  }
  processScrollMove(mouseCoords) {
    if (this.HScrollClickPos === undefined && this.VScrollClickPos === undefined) {
      return;
    }
    const coords = {
      x: mouseCoords.x - this.canvasCoords.x,
      y: mouseCoords.y - this.canvasCoords.y
    };
    if (this.HScrollClickPos) {
      const newOffset = {
        x: this.HScrollClickPos.x - coords.x,
        y: this.HScrollClickPos.y - coords.y
      };
      this.setOffsetX(this.originalOffset.x - newOffset.x * this.fullSize.x / this.viewSize.x);
    } else if (this.VScrollClickPos) {
      const newOffset = {
        x: this.VScrollClickPos.x - coords.x,
        y: this.VScrollClickPos.y - coords.y
      };
      this.setOffsetY(this.originalOffset.y + newOffset.y * this.fullSize.y / this.viewSize.y);
    }
  }
  processMouseUp() {
    this.HScrollClickPos = undefined;
    this.VScrollClickPos = undefined;
  }
}

// src/renderers/canvasRenderer.ts
class CanvasRenderer {
  ctx;
  img;
  cellW;
  stroke;
  constructor(props) {
    this.ctx = props.ctx;
    this.img = new Image;
    this.img.addEventListener("load", () => {
      this.cellW = this.img.naturalWidth / 11;
    });
    this.onThemeChange({ themeName: theme.currentTheme });
    theme.mediator.subscribe("canvas", this.onThemeChange.bind(this));
    this.stroke = 2;
  }
  onThemeChange({ themeName }) {
    if (themeName === "dark") {
      this.img.src = "/textures/dark_digits.png";
    } else {
      this.img.src = "/textures/digits.png";
    }
  }
  updateOffset(map, offset) {
  }
  drawClosedTile(pos) {
    const s = this.stroke / 2;
    this.ctx.lineWidth = this.stroke;
    this.ctx.fillStyle = theme.style.bgColor;
    this.ctx.fillRect(pos.x, pos.y, COLL, ROWL);
    this.ctx.strokeStyle = theme.style.borderBlack;
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x + s, pos.y + ROWL - s);
    this.ctx.lineTo(pos.x + COLL - s, pos.y + ROWL - s);
    this.ctx.lineTo(pos.x + COLL - s, pos.y + s);
    this.ctx.stroke();
    this.ctx.strokeStyle = theme.style.borderWhite;
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x + COLL - s, pos.y + s);
    this.ctx.lineTo(pos.x + s, pos.y + s);
    this.ctx.lineTo(pos.x + s, pos.y + ROWL - s);
    this.ctx.stroke();
  }
  drawTile(n, pos, minesVisible) {
    const s = this.stroke / 2;
    if (n === HIDDEN_OVERFLOW + MINE_VALUE && minesVisible) {
      n = MINE_VALUE;
    }
    if (n >= HIDDEN_OVERFLOW) {
      this.drawClosedTile(pos);
      if (n <= HIDDEN_OVERFLOW + MINE_VALUE) {
        return;
      }
      n = 9;
    }
    this.ctx.drawImage(this.img, this.cellW * n, 0, this.cellW, this.img.naturalHeight, pos.x, pos.y, COLL, ROWL);
    if (n !== 9) {
      this.ctx.lineWidth = this.stroke;
      this.ctx.strokeStyle = theme.style.gridBorderColor;
      this.ctx.strokeRect(pos.x + s, pos.y + s, COLL - this.stroke, ROWL - this.stroke);
    }
  }
  drawScrollbars(props) {
    const HScrollCoords = props.view.HScrollCoords;
    const VScrollCoords = props.view.VScrollCoords;
    this.ctx.fillStyle = theme.style.scrollbarColor;
    if (HScrollCoords.width < props.view.viewSize.x) {
      this.ctx.fillRect(HScrollCoords.x, HScrollCoords.y, HScrollCoords.width, HScrollCoords.height);
    }
    if (VScrollCoords.height < props.view.viewSize.y) {
      this.ctx.fillRect(VScrollCoords.x, VScrollCoords.y, VScrollCoords.width, VScrollCoords.height);
    }
  }
  render(props) {
    this.ctx.fillStyle = theme.style.bgColor;
    this.ctx.fillRect(0, 0, props.view.viewSize.x, props.view.viewSize.y);
    const topLeft = {
      x: Math.floor(props.view.offset.x / COLL),
      y: Math.floor(props.view.offset.y / ROWL)
    };
    const bottomRight = {
      x: Math.min(Math.floor((props.view.offset.x + props.view.viewSize.x) / COLL) + 1, props.COLS),
      y: Math.min(Math.floor((props.view.offset.y + props.view.viewSize.y) / ROWL) + 1, props.ROWS)
    };
    for (let i = topLeft.y;i < bottomRight.y; i++) {
      for (let j = topLeft.x;j < bottomRight.x; j++) {
        const val = props.map.matrix[i][j];
        const pos = {
          x: j * COLL - props.view.offset.x,
          y: props.view.viewSize.y - (i + 1) * ROWL + props.view.offset.y
        };
        this.drawTile(val, pos, props.minesVisible);
      }
    }
    this.drawScrollbars(props);
  }
  destruct() {
  }
}

// src/pages/playingPage.ts
class PlayingPage {
  events;
  engine;
  renderer;
  rendererType;
  shiftPressed;
  themeBtnBlock;
  rendererBtnBlock;
  constructor() {
    this.shiftPressed = false;
    this.rendererBtnBlock = new ToggleBtnBlock({
      name: "Renderer",
      class: "options-container",
      buttons: [
        {
          id: "gl"
        },
        {
          id: "canvas"
        }
      ],
      handler: this.setRenderer.bind(this),
      defaultValue: "gl"
    });
    this.themeBtnBlock = new ToggleBtnBlock({
      name: "Theme",
      class: "options-container",
      buttons: [
        {
          id: "main"
        },
        {
          id: "dark"
        }
      ],
      handler: (id) => theme.setTheme(id),
      defaultValue: theme.currentTheme
    });
    theme.mediator.subscribe("theme-options", ({ themeName }) => {
      this.themeBtnBlock.currentVal = themeName;
    });
  }
  setupEvents(engine, { ROWS, COLS, MINES, switcher }) {
    const mainView = engine.view;
    const canvas = mainView.canvas;
    const restartBtn = document.getElementById("restart-btn");
    const mainMenuBtn = document.getElementById("main-menu-btn");
    const saveBtn = document.getElementById("save-btn");
    this.events = [
      {
        name: "keydown",
        target: document,
        listener: (event) => {
          if (event.code === "ArrowLeft") {
            mainView.updateOffset(makeCoords(-10, 0));
          } else if (event.code === "ArrowRight") {
            mainView.updateOffset(makeCoords(10, 0));
          } else if (event.code === "ArrowDown") {
            mainView.updateOffset(makeCoords(0, -10));
          } else if (event.code === "ArrowUp") {
            mainView.updateOffset(makeCoords(0, 10));
          }
        }
      },
      {
        name: "mousedown",
        target: canvas,
        listener: (event) => {
          const coords = {
            x: event.clientX - mainView.canvasCoords.x,
            y: event.clientY - mainView.canvasCoords.y
          };
          if (event.button === 0) {
            engine.processLeftClick(coords);
          } else if (event.button === 2) {
            engine.processRightClick(coords);
          }
        }
      },
      {
        name: "mousemove",
        target: window,
        listener: (event) => {
          engine.processMouseMove(makeCoords(event.clientX, event.clientY));
        }
      },
      {
        name: "mouseup",
        target: window,
        listener: () => {
          engine.processMouseUp();
        }
      },
      {
        name: "wheel",
        target: canvas,
        listener: (event) => {
          if (this.shiftPressed) {
            engine.processWheel(makeCoords(-event.deltaY, 0));
          } else {
            engine.processWheel(makeCoords(event.deltaX, -event.deltaY));
          }
        }
      },
      {
        name: "resize",
        target: window,
        listener: () => {
          engine.view.updateCanvasCoords();
          engine.map.calcChunkSize(engine.view.viewSize);
          engine.updateOffset();
        }
      },
      {
        name: "click",
        target: restartBtn,
        listener: () => {
          switcher.changePage("loading", {
            ROWS,
            COLS,
            MINES,
            switcher
          });
        }
      },
      {
        name: "keydown",
        target: window,
        listener: (evt) => {
          if (evt.code === "ShiftLeft") {
            this.shiftPressed = true;
          }
        }
      },
      {
        name: "keyup",
        target: window,
        listener: (evt) => {
          if (evt.code === "ShiftLeft") {
            this.shiftPressed = false;
          }
        }
      },
      {
        name: "click",
        target: mainMenuBtn,
        listener: () => {
          switcher.changePage("mainMenu", switcher);
        }
      },
      {
        name: "click",
        target: saveBtn,
        listener: () => {
          this.saveCurrentSession();
        }
      }
    ];
    this.events.forEach(({ name, target, listener }) => {
      target.addEventListener(name, listener);
    });
  }
  async setupWebGL(canvas) {
    const gl = canvas.getContext("webgl");
    if (!gl) {
      throw new Error("your browser does not support WebGL");
    }
    const vSourceP = fetch("/src/shaders/vertexShader.vs");
    const fSourceP = fetch("/src/shaders/fragmentShader.fs");
    const vSource = await vSourceP.then((source) => source.text());
    const fSource = await fSourceP.then((source) => source.text());
    const renderer = new GLRenderer({
      gl,
      vertexShaderSource: vSource,
      fragmenShaderSource: fSource
    });
    return renderer;
  }
  async setupCanvasRenderer(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("no 2d canvas context");
    }
    const renderer = new CanvasRenderer({
      ctx
    });
    return renderer;
  }
  saveCurrentSession() {
    if (!this.engine) {
      console.error("can't save: no engine");
      return;
    }
    cacher.saveCurrentSession({
      cols: this.engine.map.COLS,
      rows: this.engine.map.ROWS,
      mines: this.engine.map.minesTotal,
      mapData: this.engine.map.matrix.data,
      offset: unfoldCoords(this.engine.view.offset)
    });
  }
  onLoad({ ROWS, COLS, MINES, mapData, switcher, offset }) {
    const canvas = document.querySelector("canvas");
    document.documentElement.style.setProperty("--max-view-width", `${COLL * COLS + 14}px`);
    document.documentElement.style.setProperty("--max-view-height", `${ROWL * ROWS + 14}px`);
    if (canvas === null) {
      throw new Error("canvas is null");
    }
    const map = new GameMap({
      ROWS,
      COLS,
      ROWL,
      COLL,
      CHUNKH,
      CHUNKW
    });
    map.minesRemaining = MINES;
    map.minesTotal = MINES;
    const timerDisplay = document.getElementById("timer-display");
    const minesCntDisplay = document.getElementById("mines-cnt-display");
    const restartBtn = document.getElementById("restart-btn");
    this.rendererBtnBlock.onLoad();
    this.themeBtnBlock.onLoad();
    const menu2 = new GameMenu({
      minesDisplay: minesCntDisplay,
      timerDisplay,
      restartBtn
    });
    menu2.setMinesDisplayValue(map.minesRemaining);
    menu2.setTimerDisplayValue(0);
    menu2.startTimer();
    map.onMinesRemainingUpdate = menu2.setMinesDisplayValue.bind(menu2);
    map.matrix = new Matrix({
      rows: ROWS,
      cols: COLS,
      data: mapData
    });
    this.rendererType = "gl";
    this.setupWebGL(canvas).then((renderer) => {
      if (renderer === undefined) {
        throw new Error("no renderer");
      }
      canvas.oncontextmenu = () => false;
      const mainView = new MinesweeperView({
        fullSize: {
          x: COLL * COLS,
          y: ROWL * ROWS
        },
        viewSize: {
          x: canvas.clientWidth,
          y: canvas.clientHeight
        },
        canvas
      });
      if (offset) {
        mainView.offset = makeCoords(...offset);
      }
      map.calcChunkSize(mainView.viewSize);
      this.engine = new GameEngine({
        map,
        view: mainView,
        renderer
      });
      mainView.onOffsetUpdate = () => this.engine.updateOffset();
      this.setupEvents(this.engine, {
        ROWS,
        COLS,
        MINES,
        mapData,
        offset,
        switcher
      });
      this.engine.onGameOver = (status) => {
        menu2.stopTimer();
        if (status === "win") {
          menu2.setRestartBtnStatus("cool");
        } else {
          menu2.setRestartBtnStatus("dead");
        }
      };
      this.startGame(this.engine);
      cacher.readSetting("renderer").then((rendererName) => {
        console.log("rendererName", rendererName);
        if (rendererName === undefined) {
          return;
        }
        this.setRenderer(rendererName);
        this.rendererBtnBlock.setCurrentValue(rendererName);
      }).catch((reason) => {
        console.error(reason);
      });
    });
  }
  changeCanvas() {
    const origCanvas = this.engine.view.canvas;
    const newCanvas = origCanvas.cloneNode();
    newCanvas.oncontextmenu = () => false;
    for (const event of this.events) {
      if (event.target !== origCanvas) {
        continue;
      }
      origCanvas.removeEventListener(event.name, event.listener);
      event.target = newCanvas;
      newCanvas.addEventListener(event.name, event.listener);
    }
    origCanvas.parentNode?.replaceChild(newCanvas, origCanvas);
    const canvas = newCanvas;
    return canvas;
  }
  setRenderer(rendererName) {
    if (this.engine === undefined || this.rendererType === rendererName) {
      return;
    }
    const canvas = this.changeCanvas();
    this.engine.view.canvas = canvas;
    this.renderer?.destruct();
    cacher.putSetting({
      id: "renderer",
      value: rendererName
    });
    if (rendererName === "gl") {
      this.setupWebGL(canvas).then((renderer) => {
        this.renderer = renderer;
        this.rendererType = "gl";
        this.engine.renderer = renderer;
        this.engine?.updateOffset();
      });
      return;
    }
    if (rendererName === "canvas") {
      this.setupCanvasRenderer(canvas).then((renderer) => {
        this.renderer = renderer;
        this.rendererType = "canvas";
        this.engine.renderer = renderer;
        this.engine?.updateOffset();
      });
      return;
    }
  }
  onUnload() {
    this.events.forEach(({ name, target, listener }) => {
      target.removeEventListener(name, listener);
    });
    if (this.renderer) {
      this.renderer.destruct();
      this.renderer = undefined;
    }
    this.rendererBtnBlock.onUnload();
    this.themeBtnBlock.onUnload();
  }
  startGame(engine) {
    engine.updateOffset();
    requestAnimationFrame(() => engine.update());
  }
  render() {
    return {
      tag: "div",
      class: "main-container",
      children: [
        {
          tag: "div",
          class: "game-container bulging",
          children: [
            {
              tag: "div",
              class: "menu sunken",
              children: [
                displayBlock("mines-cnt-display"),
                {
                  tag: "button",
                  id: "restart-btn",
                  class: "bulging",
                  children: [
                    {
                      tag: "img",
                      params: {
                        src: "textures/smiles/regular.png",
                        alt: "you win. Restart"
                      }
                    }
                  ]
                },
                displayBlock("timer-display")
              ]
            },
            {
              tag: "div",
              class: "canvas-container sunken",
              children: [
                {
                  tag: "canvas",
                  id: "canvas"
                }
              ]
            }
          ]
        },
        {
          tag: "section",
          class: "options-section",
          children: [
            {
              tag: "button",
              text: "Main Menu",
              id: "main-menu-btn",
              class: "bulging btn"
            },
            this.rendererBtnBlock.render(),
            this.themeBtnBlock.render(),
            {
              tag: "button",
              text: "Save",
              id: "save-btn",
              class: "bulging pressable btn"
            }
          ]
        }
      ]
    };
  }
}

// src/index.ts
var main = () => {
  const entryPoint = document.getElementById("main");
  if (entryPoint === null) {
    throw new Error("entrypoint not found");
  }
  const pages = {
    mainMenu: new MenuPage,
    loading: new LoadingPage,
    playing: new PlayingPage
  };
  const switcher = new PageSwitcher({
    entryPoint,
    pages
  });
  switcher.changePage("mainMenu", switcher);
  cacher.loadPrevSession().then((session) => {
    if (Object.values(session).includes(undefined)) {
      console.log("previous session not found");
      return;
    }
    switcher.changePage("playing", {
      ROWS: session.rows,
      COLS: session.cols,
      MINES: session.mines,
      mapData: session.mapData,
      offset: session.offset,
      switcher
    });
  }).catch((reason) => {
    console.error(reason);
  });
};
window.addEventListener("load", function onLoadListener() {
  window.removeEventListener("load", onLoadListener, false);
  main();
});
