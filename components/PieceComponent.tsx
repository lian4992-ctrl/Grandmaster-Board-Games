
import React from 'react';
import { Piece, Side, GameMode, PieceType } from '../types';
import { PIECE_LABELS } from '../constants';

interface PieceComponentProps {
  piece: Piece;
  isSelected: boolean;
  gameMode: GameMode;
  onClick: (piece: Piece) => void;
}

const PieceComponent: React.FC<PieceComponentProps> = ({ piece, isSelected, gameMode, onClick }) => {
  // Banqi Hidden State
  if (gameMode === GameMode.BANQI && !piece.isFlipped) {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onClick(piece); }}
        className={`w-full h-full rounded-full cursor-pointer bg-amber-900 border-2 border-amber-950 flex items-center justify-center shadow-md hover:scale-105 transition-transform aspect-square`}
      >
        <div className="w-[60%] h-[60%] border border-amber-800 rounded-full opacity-20" />
      </div>
    );
  }

  const label = PIECE_LABELS[piece.side][piece.type];

  const getContainerStyles = () => {
    if (gameMode === GameMode.GO) {
      return piece.side === Side.BLACK 
        ? 'bg-zinc-900 text-zinc-300 border-zinc-950 shadow-black/40' 
        : 'bg-zinc-50 text-zinc-600 border-zinc-300 shadow-zinc-400/50';
    }
    
    if (gameMode === GameMode.CHESS) {
      return piece.side === Side.WHITE 
        ? 'bg-white text-stone-800 border-stone-300 shadow-sm' 
        : 'bg-stone-800 text-stone-100 border-stone-900 shadow-md';
    }

    // Default (Xiangqi / Flipped Banqi)
    return piece.side === Side.RED 
      ? 'bg-red-50 text-red-700 border-red-700' 
      : 'bg-white text-gray-900 border-gray-900';
  };

  // Dynamic font sizing based on board density
  const getFontSize = () => {
    if (gameMode === GameMode.GO) return 'text-[0.8em] md:text-[0.9em] font-black';
    if (gameMode === GameMode.CHESS) return 'text-[1.1em] md:text-[1.3em] font-black';
    return 'text-[1.2em] md:text-[1.5em] font-bold';
  };

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(piece); }}
      className={`
        w-full h-full flex items-center justify-center cursor-pointer select-none transition-all duration-200 aspect-square
        rounded-full border-2 shadow-sm
        ${getFontSize()}
        ${getContainerStyles()}
        ${isSelected ? 'scale-110 ring-2 ring-yellow-400 z-10' : 'hover:scale-105'}
      `}
    >
      {label}
    </div>
  );
};

export default PieceComponent;
