
export enum Side {
  RED = 'RED',
  BLACK = 'BLACK',
  WHITE = 'WHITE'
}

export enum GameMode {
  XIANGQI = 'XIANGQI',
  BANQI = 'BANQI',
  CHESS = 'CHESS',
  GO = 'GO',
  GOMOKU = 'GOMOKU'
}

export enum PieceType {
  // Xiangqi / Banqi
  GENERAL = 'GENERAL',
  ADVISOR = 'ADVISOR',
  ELEPHANT = 'ELEPHANT',
  HORSE = 'HORSE',
  CHARIOT = 'CHARIOT',
  CANNON = 'CANNON',
  SOLDIER = 'SOLDIER',
  
  // International Chess
  KING = 'KING',
  QUEEN = 'QUEEN',
  ROOK = 'ROOK',
  BISHOP = 'BISHOP',
  KNIGHT = 'KNIGHT',
  PAWN = 'PAWN',

  // Go / Gomoku
  STONE = 'STONE'
}

export interface Position {
  x: number;
  y: number;
}

export interface Piece {
  id: string;
  type: PieceType;
  side: Side;
  position: Position;
  isFlipped?: boolean; // For Banqi
}

export interface GameState {
  mode: GameMode;
  board: (Piece | null)[][];
  turn: Side;
  selectedPiece: Piece | null;
  validMoves: Position[];
  history: string[];
  winner: Side | null;
  isAiMode: boolean;
  timeLimit: number; // 0 means unlimited
  remainingTime: number; // countdown in seconds
  capturedRed: Piece[];
  capturedBlack: Piece[];
  // Fix: Added aiThinkingTime to satisfy references in geminiService.ts
  aiThinkingTime?: number;
}
