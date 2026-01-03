
import { Piece, Side, Position } from '../types';

export const checkWin = (board: (Piece | null)[][], lastPos: Position, side: Side): boolean => {
  const height = board.length;
  const width = board[0].length;
  
  const directions = [
    { dx: 1, dy: 0 },  // Horizontal
    { dx: 0, dy: 1 },  // Vertical
    { dx: 1, dy: 1 },  // Diagonal \
    { dx: 1, dy: -1 }, // Diagonal /
  ];

  for (const { dx, dy } of directions) {
    let count = 1;

    // Positive direction
    let x = lastPos.x + dx;
    let y = lastPos.y + dy;
    while (x >= 0 && x < width && y >= 0 && y < height && board[y][x]?.side === side) {
      count++;
      x += dx;
      y += dy;
    }

    // Negative direction
    x = lastPos.x - dx;
    y = lastPos.y - dy;
    while (x >= 0 && x < width && y >= 0 && y < height && board[y][x]?.side === side) {
      count++;
      x -= dx;
      y -= dy;
    }

    if (count >= 5) return true;
  }

  return false;
};

export const getGomokuScore = (board: (Piece | null)[][], pos: Position, side: Side): number => {
  // Simple heuristic for AI: count nearby stones and potential lines
  let score = 0;
  const height = board.length;
  const width = board[0].length;

  const directions = [
    { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
  ];

  for (const { dx, dy } of directions) {
    let count = 0;
    let openEnds = 0;

    // Check one side
    let x = pos.x + dx;
    let y = pos.y + dy;
    while (x >= 0 && x < width && y >= 0 && y < height && board[y][x]?.side === side) {
      count++;
      x += dx;
      y += dy;
    }
    if (x >= 0 && x < width && y >= 0 && y < height && board[y][x] === null) openEnds++;

    // Check other side
    x = pos.x - dx;
    y = pos.y - dy;
    while (x >= 0 && x < width && y >= 0 && y < height && board[y][x]?.side === side) {
      count++;
      x -= dx;
      y -= dy;
    }
    if (x >= 0 && x < width && y >= 0 && y < height && board[y][x] === null) openEnds++;

    if (count >= 4) score += 10000; // Winning move
    else if (count === 3 && openEnds === 2) score += 5000; // Open four
    else if (count === 3 && openEnds === 1) score += 1000;
    else if (count === 2 && openEnds === 2) score += 500;
    else score += count * 10;
  }

  return score;
};
