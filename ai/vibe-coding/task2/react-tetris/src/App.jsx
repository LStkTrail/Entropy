import { useCallback, useEffect, useRef, useState } from 'react'
import { COLS, ROWS, BLOCK_SIZE, SHAPES, COLORS, DROP_INTERVAL } from './constants'
import './App.css'

function createEmptyBoard() {
  return Array(ROWS)
    .fill(null)
    .map(() => Array(COLS).fill(0))
}

function getRandomPiece() {
  const index = Math.floor(Math.random() * SHAPES.length)
  return {
    shape: SHAPES[index].map((row) => [...row]),
    colorIndex: index,
  }
}

function rotate(matrix) {
  const rows = matrix.length
  const cols = matrix[0].length
  const rotated = Array(cols)
    .fill(null)
    .map(() => Array(rows).fill(0))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = matrix[r][c]
    }
  }
  return rotated
}

function checkCollision(board, shape, pos) {
  const { row, col } = pos
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const newR = row + r
        const newC = col + c
        if (newR < 0 || newR >= ROWS || newC < 0 || newC >= COLS) return true
        if (board[newR][newC]) return true
      }
    }
  }
  return false
}

function mergePiece(board, shape, pos, colorIndex) {
  const newBoard = board.map((row) => [...row])
  const { row, col } = pos
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const targetR = row + r
        const targetC = col + c
        if (targetR >= 0 && targetR < ROWS && targetC >= 0 && targetC < COLS) {
          newBoard[targetR][targetC] = colorIndex + 1
        }
      }
    }
  }
  return newBoard
}

function clearFullLines(board) {
  let newBoard = board.filter((row) => row.some((cell) => cell === 0))
  const cleared = board.length - newBoard.length
  while (newBoard.length < ROWS) {
    newBoard.unshift(Array(COLS).fill(0))
  }
  return { board: newBoard, lines: cleared }
}

function getDisplayBoard(board, piece, pos, colorIndex) {
  const display = board.map((row) => row.map((c) => (c ? COLORS[c - 1] : null)))
  if (!piece) return display
  const { row, col } = pos
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const tr = row + r
        const tc = col + c
        if (tr >= 0 && tr < ROWS && tc >= 0 && tc < COLS) {
          display[tr][tc] = COLORS[colorIndex]
        }
      }
    }
  }
  return display
}

export default function App() {
  const [board, setBoard] = useState(createEmptyBoard)
  const [piece, setPiece] = useState(null)
  const [pos, setPos] = useState({ row: 0, col: 0 })
  const [colorIndex, setColorIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const dropTimerRef = useRef(null)
  const lastDropRef = useRef(0)

  const spawnPiece = useCallback(() => {
    const { shape, colorIndex: ci } = getRandomPiece()
    const col = Math.floor((COLS - shape[0].length) / 2)
    const startPos = { row: 0, col }
    if (checkCollision(board, shape, startPos)) {
      setGameOver(true)
      return
    }
    setPiece({ shape })
    setPos(startPos)
    setColorIndex(ci)
  }, [board])

  const lockPiece = useCallback(
    (overridePos) => {
      if (!piece) return
      const usePos = overridePos ?? pos
      const newBoard = mergePiece(board, piece.shape, usePos, colorIndex)
    const { board: afterClear, lines } = clearFullLines(newBoard)
    setBoard(afterClear)
    if (lines > 0) {
      const add = lines * 100 * level
      setScore((s) => {
        const newScore = s + add
        setLevel(() => Math.min(Math.floor(newScore / 500) + 1, 10))
        return newScore
      })
    }
    setPiece(null)
    spawnPiece()
  },
    [board, piece, pos, colorIndex, level, score, spawnPiece]
  )

  const move = useCallback(
    (dRow, dCol) => {
      if (!piece || gameOver) return
      const newPos = { row: pos.row + dRow, col: pos.col + dCol }
      if (checkCollision(board, piece.shape, newPos)) {
        if (dRow > 0) lockPiece()
        return
      }
      setPos(newPos)
    },
    [board, piece, pos, gameOver, lockPiece]
  )

  const rotatePiece = useCallback(() => {
    if (!piece || gameOver) return
    const rotated = rotate(piece.shape)
    if (checkCollision(board, rotated, pos)) return
    setPiece({ shape: rotated })
  }, [board, piece, pos, gameOver])

  const startGame = useCallback(() => {
    setBoard(createEmptyBoard())
    setPiece(null)
    setScore(0)
    setLevel(1)
    setGameOver(false)
    setIsPlaying(true)
    lastDropRef.current = Date.now()
  }, [])

  // 游戏循环：自动下落
  useEffect(() => {
    if (!isPlaying || gameOver) return
    const interval = DROP_INTERVAL / level
    dropTimerRef.current = setInterval(() => {
      const now = Date.now()
      if (now - lastDropRef.current >= interval) {
        lastDropRef.current = now
        move(1, 0)
      }
    }, 100)
    return () => clearInterval(dropTimerRef.current)
  }, [isPlaying, gameOver, level, move])

  // 开局生成第一个方块
  useEffect(() => {
    if (isPlaying && !piece && !gameOver) {
      spawnPiece()
    }
  }, [isPlaying, piece, gameOver, spawnPiece])

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying || gameOver) return
      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault()
          move(0, -1)
          break
        case 'ArrowRight':
          e.preventDefault()
          move(0, 1)
          break
        case 'ArrowDown':
          e.preventDefault()
          move(1, 0)
          break
        case 'ArrowUp':
          e.preventDefault()
          rotatePiece()
          break
        case 'Space':
          e.preventDefault()
          if (piece) {
            let dropRow = pos.row
            while (!checkCollision(board, piece.shape, { row: dropRow + 1, col: pos.col })) {
              dropRow += 1
            }
            lockPiece({ row: dropRow, col: pos.col })
          }
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, gameOver, move, rotatePiece, lockPiece, board, piece, pos])

  const displayBoard = getDisplayBoard(board, piece, pos, colorIndex)

  return (
    <div className="game-container">
      <div className="info-panel">
        <h1>俄罗斯方块</h1>
        <div className="stat">分数: {score}</div>
        <div className="stat">等级: {level}</div>
        {!isPlaying && (
          <button className="btn-start" onClick={startGame}>
            {gameOver ? '再来一局' : '开始游戏'}
          </button>
        )}
        {gameOver && isPlaying && <p className="game-over-text">游戏结束</p>}
        <div className="controls">
          <p>↑ 旋转</p>
          <p>← → 左右</p>
          <p>↓ 下落</p>
          <p>空格 硬降</p>
        </div>
      </div>
      <div
        className="board"
        style={{
          width: COLS * BLOCK_SIZE,
          height: ROWS * BLOCK_SIZE,
          gridTemplateColumns: `repeat(${COLS}, ${BLOCK_SIZE}px)`,
          gridTemplateRows: `repeat(${ROWS}, ${BLOCK_SIZE}px)`,
        }}
      >
        {displayBoard.flat().map((color, i) => (
          <div
            key={i}
            className="cell"
            style={{
              backgroundColor: color || 'transparent',
              borderColor: color ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
