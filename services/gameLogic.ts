
// Fix: Import BOARD_WIDTH and BOARD_HEIGHT from constants instead of types
import { Piece, PieceType, Side, Position, GameMode } from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../constants';

export const isValidMove = (piece: Piece, target: Position, board: (Piece | null)[][]): boolean => {
  const { x: x1, y: y1 } = piece.position;
  const { x: x2, y: y2 } = target;

  // Boundary check
  if (x2 < 0 || x2 >= BOARD_WIDTH || y2 < 0 || y2 >= BOARD_HEIGHT) return false;

  // Same spot
  if (x1 === x2 && y1 === y2) return false;

  // Friendly fire check
  const targetPiece = board[y2][x2];
  if (targetPiece && targetPiece.side === piece.side) return false;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  switch (piece.type) {
    case PieceType.GENERAL: {
      const isInPalace = x2 >= 3 && x2 <= 5 && (piece.side === Side.RED ? y2 >= 7 : y2 <= 2);
      if (!isInPalace) return false;
      return (absDx === 1 && absDy === 0) || (absDx === 0 && absDy === 1);
    }

    case PieceType.ADVISOR: {
      const isInPalace = x2 >= 3 && x2 <= 5 && (piece.side === Side.RED ? y2 >= 7 : y2 <= 2);
      if (!isInPalace) return false;
      return absDx === 1 && absDy === 1;
    }

    case PieceType.ELEPHANT: {
      if (piece.side === Side.RED && y2 < 5) return false;
      if (piece.side === Side.BLACK && y2 > 4) return false;
      if (absDx === 2 && absDy === 2) {
        const eyeX = (x1 + x2) / 2;
        const eyeY = (y1 + y2) / 2;
        return board[eyeY][eyeX] === null;
      }
      return false;
    }

    case PieceType.HORSE: {
      if ((absDx === 1 && absDy === 2) || (absDx === 2 && absDy === 1)) {
        let legX = x1;
        let legY = y1;
        if (absDx === 1) legY += dy / 2;
        else legX += dx / 2;
        return board[legY][legX] === null;
      }
      return false;
    }

    case PieceType.CHARIOT: {
      if (x1 !== x2 && y1 !== y2) return false;
      const stepX = x1 === x2 ? 0 : (dx / absDx);
      const stepY = y1 === y2 ? 0 : (dy / absDy);
      let currX = x1 + stepX;
      let currY = y1 + stepY;
      while (currX !== x2 || currY !== y2) {
        if (board[currY][currX] !== null) return false;
        currX += stepX;
        currY += stepY;
      }
      return true;
    }

    case PieceType.CANNON: {
      if (x1 !== x2 && y1 !== y2) return false;
      const stepX = x1 === x2 ? 0 : (dx / absDx);
      const stepY = y1 === y2 ? 0 : (dy / absDy);
      let currX = x1 + stepX;
      let currY = y1 + stepY;
      let count = 0;
      while (currX !== x2 || currY !== y2) {
        if (board[currY][currX] !== null) count++;
        currX += stepX;
        currY += stepY;
      }
      return targetPiece === null ? count === 0 : count === 1;
    }

    case PieceType.SOLDIER: {
      const isForward = piece.side === Side.RED ? dy === -1 : dy === 1;
      const hasCrossedRiver = piece.side === Side.RED ? y1 < 5 : y1 > 4;
      if (isForward && absDx === 0) return true;
      if (hasCrossedRiver && absDy === 0 && absDx === 1) return true;
      return false;
    }
  }
  return false;
};

export const getValidMoves = (piece: Piece, board: (Piece | null)[][]): Position[] => {
  const moves: Position[] = [];
  const height = board.length;
  const width = board[0]?.length || 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isValidMove(piece, { x, y }, board)) {
        moves.push({ x, y });
      }
    }
  }
  return moves;
};

export const initializeBoard = (initialPieces: any[]): (Piece | null)[][] => {
  const maxX = Math.max(...initialPieces.map(p => p.x), BOARD_WIDTH - 1);
  const maxY = Math.max(...initialPieces.map(p => p.y), BOARD_HEIGHT - 1);
  const width = maxX + 1;
  const height = maxY + 1;

  const board = Array(height).fill(null).map(() => Array(width).fill(null));
  initialPieces.forEach((p, idx) => {
    board[p.y][p.x] = {
      id: `${p.side}-${p.type}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
      ...p,
      position: { x: p.x, y: p.y }
    };
  });
  return board;
};

export const isKingCaptured = (board: (Piece | null)[][], side: Side): boolean => {
  // 注意：在暗棋中，未翻開的將帥不應算作被捕獲
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const p = board[y][x];
      if (p && (p.type === PieceType.GENERAL || p.type === PieceType.KING) && p.side === side) {
        return false;
      }
    }
  }
  return true;
};

export const isFlyingGeneralRuleViolated = (board: (Piece | null)[][]): boolean => {
  let redGen: Position | null = null;
  let blackGen: Position | null = null;

  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const p = board[y][x];
      if (p?.type === PieceType.GENERAL) {
        if (p.side === Side.RED) redGen = p.position;
        else blackGen = p.position;
      }
    }
  }

  if (redGen && blackGen && redGen.x === blackGen.x) {
    const x = redGen.x;
    let minY = Math.min(redGen.y, blackGen.y);
    let maxY = Math.max(redGen.y, blackGen.y);
    let countBetween = 0;
    for (let y = minY + 1; y < maxY; y++) {
      if (board[y][x] !== null) countBetween++;
    }
    return countBetween === 0;
  }
  return false;
};
