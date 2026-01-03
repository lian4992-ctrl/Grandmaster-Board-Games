
import { Piece, PieceType, Side, Position } from '../types';

export const isValidChessMove = (piece: Piece, target: Position, board: (Piece | null)[][]): boolean => {
  const { x: x1, y: y1 } = piece.position;
  const { x: x2, y: y2 } = target;
  const targetPiece = board[y2]?.[x2];

  if (targetPiece && targetPiece.side === piece.side) return false;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  switch (piece.type) {
    case PieceType.PAWN: {
      const direction = piece.side === Side.WHITE ? -1 : 1;
      const startRow = piece.side === Side.WHITE ? 6 : 1;
      
      // Move forward
      if (dx === 0 && dy === direction && !targetPiece) return true;
      // Double move from start
      if (dx === 0 && dy === 2 * direction && y1 === startRow && !targetPiece && !board[y1 + direction][x1]) return true;
      // Capture
      if (absDx === 1 && dy === direction && targetPiece) return true;
      return false;
    }
    case PieceType.ROOK:
      if (dx !== 0 && dy !== 0) return false;
      return isPathClear(piece.position, target, board);
    case PieceType.KNIGHT:
      return (absDx === 1 && absDy === 2) || (absDx === 2 && absDy === 1);
    case PieceType.BISHOP:
      if (absDx !== absDy) return false;
      return isPathClear(piece.position, target, board);
    case PieceType.QUEEN:
      if (dx !== 0 && dy !== 0 && absDx !== absDy) return false;
      return isPathClear(piece.position, target, board);
    case PieceType.KING:
      return absDx <= 1 && absDy <= 1;
    default:
      return false;
  }
};

const isPathClear = (start: Position, end: Position, board: (Piece | null)[][]): boolean => {
  const dx = Math.sign(end.x - start.x);
  const dy = Math.sign(end.y - start.y);
  let x = start.x + dx;
  let y = start.y + dy;
  while (x !== end.x || y !== end.y) {
    if (board[y][x]) return false;
    x += dx;
    y += dy;
  }
  return true;
};
