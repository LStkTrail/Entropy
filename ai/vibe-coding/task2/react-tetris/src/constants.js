// 游戏区域：10 列 x 20 行
export const COLS = 10
export const ROWS = 20
export const BLOCK_SIZE = 28

// 七种标准俄罗斯方块形状（每个形状的旋转状态）
// 1 表示有方块，0 表示空
export const SHAPES = [
  [[1, 1, 1, 1]], // I
  [
    [1, 1],
    [1, 1],
  ], // O
  [
    [0, 1, 0],
    [1, 1, 1],
  ], // T
  [
    [0, 1, 1],
    [1, 1, 0],
  ], // S
  [
    [1, 1, 0],
    [0, 1, 1],
  ], // Z
  [
    [1, 0, 0],
    [1, 1, 1],
  ], // J
  [
    [0, 0, 1],
    [1, 1, 1],
  ], // L
]

export const COLORS = [
  '#00f0f0', // I - 青
  '#f0f000', // O - 黄
  '#a000f0', // T - 紫
  '#00f000', // S - 绿
  '#f00000', // Z - 红
  '#0000f0', // J - 蓝
  '#f0a000', // L - 橙
]

// 下落间隔（毫秒）
export const DROP_INTERVAL = 800
