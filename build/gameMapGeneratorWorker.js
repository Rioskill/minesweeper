// src/consts.ts
var MINE_VALUE = 10;
var FLAG_OVERFLOW = 50;
var HIDDEN_OVERFLOW = 100;
var ROWL = 50;
var COLL = 50;
var CHUNKW = 40;
var CHUNKH = 40;

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
    if (n <= 0) {
      return [];
    }
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

// src/gameMapGeneratorWorker.ts
onmessage = (ev) => {
  const data = ev.data;
  const generator = new MapGenerator(data);
  let prevPercent = 0;
  const minPercentDiff = 2;
  const res = generator.generateMap((percent) => {
    if (Math.floor(percent) - prevPercent > minPercentDiff) {
      prevPercent = Math.floor(percent);
      postMessage({
        type: "percent",
        value: percent
      });
    }
  });
  postMessage({
    type: "result",
    value: res.data
  });
};
