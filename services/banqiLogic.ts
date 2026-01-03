
import { Piece, PieceType, Side, Position } from '../types';

// Ranking for Banqi: General(7) > Chariot(6) > Horse(5) > Elephant(4) > Advisor(3) > Cannon(2) > Soldier(1)
const RANKS: Record<PieceType, number> = {
  [PieceType.GENERAL]: 7,
  [PieceType.CHARIOT]: 6,
  [PieceType.HORSE]: 5,
  [PieceType.ELEPHANT]: 4,
  [PieceType.ADVISOR]: 3,
  [PieceType.CANNON]: 2,
  [PieceType.SOLDIER]: 1,
  [PieceType.KING]: 0,
  [PieceType.QUEEN]: 0,
  [PieceType.ROOK]: 0,
  [PieceType.BISHOP]: 0,
  [PieceType.KNIGHT]: 0,
  [PieceType.PAWN]: 0,
  [PieceType.STONE]: 0
};

export const isValidBanqiMove = (piece: Piece, target: Position, board: (Piece | null)[][]): boolean => {
  if (!piece.isFlipped) return false;
  
  const { x: x1, y: y1 } = piece.position;
  const { x: x2, y: y2 } = target;
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const targetPiece = board[y2]?.[x2];

  // Most pieces move 1 step orthogonally
  const isOneStep = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);

  if (targetPiece && !targetPiece.isFlipped) {
    // CRITICAL: Cannot capture unrevealed pieces in Banqi
    return false;
  }

  if (piece.type === PieceType.CANNON) {
    // Cannon capture rule: needs exactly one obstacle to jump
    if (targetPiece) {
      if (dx === 0 || dy === 0) {
        let count = 0;
        const stepX = dx === 0 ? 0 : Math.sign(x2 - x1);
        const stepY = dy === 0 ? 0 : Math.sign(y2 - y1);
        let cx = x1 + stepX, cy = y1 + stepY;
        while (cx !== x2 || cy !== y2) {
          if (board[cy][cx]) count++;
          cx += stepX; cy += stepY;
        }
        // targetPiece is already checked to be flipped above
        return count === 1 && targetPiece.side !== piece.side;
      }
      return false;
    }
    return isOneStep && !targetPiece;
  }

  if (isOneStep) {
    if (!targetPiece) return true;
    if (targetPiece.side === piece.side) return false;

    const pRank = RANKS[piece.type];
    const tRank = RANKS[targetPiece.type];

    // General vs Soldier special rule
    if (pRank === 7 && tRank === 1) return false;
    if (pRank === 1 && tRank === 7) return true;
    
    return pRank >= tRank;
  }

  return false;
};
