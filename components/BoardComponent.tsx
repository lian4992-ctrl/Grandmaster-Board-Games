
import React from 'react';
import { Piece, Position, Side, GameMode } from '../types';
import { BOARD_CONFIG } from '../constants';
import PieceComponent from './PieceComponent';

interface BoardComponentProps {
  mode: GameMode;
  board: (Piece | null)[][];
  selectedPiece: Piece | null;
  validMoves: Position[];
  onSquareClick: (pos: Position) => void;
  onPieceClick: (piece: Piece) => void;
}

const BoardComponent: React.FC<BoardComponentProps> = ({
  mode,
  board,
  selectedPiece,
  validMoves,
  onSquareClick,
  onPieceClick,
}) => {
  const { width, height } = BOARD_CONFIG[mode];
  const isValidTarget = (x: number, y: number) => validMoves.some(m => m.x === x && m.y === y);

  const getBoardBg = () => {
    switch(mode) {
      case GameMode.CHESS: return '#fef3c7'; // amber-100
      case GameMode.BANQI: return '#d2b48c';
      case GameMode.GO: return '#eec688';
      case GameMode.GOMOKU: return '#f3d6a4';
      default: return '#f5deb3';
    }
  };

  const getDimensions = () => {
    if (mode === GameMode.GO) return { w: 'min(90vw, 600px)', h: 'min(90vw, 600px)' };
    if (mode === GameMode.GOMOKU) return { w: 'min(90vw, 550px)', h: 'min(90vw, 550px)' };
    if (mode === GameMode.CHESS) return { w: 'min(90vw, 500px)', h: 'min(90vw, 500px)' };
    if (mode === GameMode.BANQI) return { w: 'min(90vw, 500px)', h: 'min(45vw, 250px)' };
    return { w: 'min(90vw, 450px)', h: 'min(100vw, 500px)' };
  };

  const dim = getDimensions();

  return (
    <div className="relative wood-texture p-2 md:p-4 rounded-lg shadow-2xl border-4 border-amber-900 mx-auto max-w-full overflow-hidden">
      <div 
        className="relative border border-black shadow-inner overflow-hidden"
        style={{ backgroundColor: getBoardBg() }}
      >
        {/* Visual Overlays for Grid-based Games */}
        {(mode === GameMode.XIANGQI || mode === GameMode.GO || mode === GameMode.GOMOKU) && (
          <svg 
            viewBox={`0 0 ${width - 1} ${height - 1}`} 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            style={{ 
              padding: mode === GameMode.GO ? '2.63%' : (mode === GameMode.GOMOKU ? '3.33%' : '5.55%'), 
              boxSizing: 'border-box' 
            }}
          >
            {mode === GameMode.XIANGQI && (
              <>
                {Array.from({ length: 10 }).map((_, i) => (
                  <line key={`h-${i}`} x1={0} y1={i} x2={8} y2={i} stroke="black" strokeWidth="0.03" />
                ))}
                {Array.from({ length: 9 }).map((_, i) => (
                  <React.Fragment key={`v-${i}`}>
                    <line x1={i} y1={0} x2={i} y2={4} stroke="black" strokeWidth="0.03" />
                    <line x1={i} y1={5} x2={i} y2={9} stroke="black" strokeWidth="0.03" />
                    {(i === 0 || i === 8) && (
                      <line x1={i} y1={4} x2={i} y2={5} stroke="black" strokeWidth="0.03" />
                    )}
                  </React.Fragment>
                ))}
                <line x1={3} y1={0} x2={5} y2={2} stroke="black" strokeWidth="0.03" />
                <line x1={5} y1={0} x2={3} y2={2} stroke="black" strokeWidth="0.03" />
                <line x1={3} y1={7} x2={5} y2={9} stroke="black" strokeWidth="0.03" />
                <line x1={5} y1={7} x2={3} y2={9} stroke="black" strokeWidth="0.03" />
              </>
            )}
            {(mode === GameMode.GO || mode === GameMode.GOMOKU) && (
               <>
                 {Array.from({ length: width }).map((_, i) => (
                   <line key={`v-${i}`} x1={i} y1={0} x2={i} y2={height - 1} stroke="black" strokeWidth="0.015" />
                 ))}
                 {Array.from({ length: height }).map((_, i) => (
                   <line key={`h-${i}`} x1={0} y1={i} x2={width - 1} y2={i} stroke="black" strokeWidth="0.015" />
                 ))}
                 {mode === GameMode.GO && [3, 9, 15].map(x => [3, 9, 15].map(y => (
                    <circle key={`star-${x}-${y}`} cx={x} cy={y} r="0.06" fill="black" />
                 )))}
                 {mode === GameMode.GOMOKU && [3, 7, 11].map(x => [3, 7, 11].map(y => (
                    <circle key={`star-${x}-${y}`} cx={x} cy={y} r="0.08" fill="black" />
                 )))}
               </>
            )}
          </svg>
        )}

        {/* Board Cells Grid */}
        <div 
          className={`grid ${mode !== GameMode.GO && mode !== GameMode.XIANGQI && mode !== GameMode.GOMOKU ? 'border border-black' : ''}`}
          style={{ 
            gridTemplateColumns: `repeat(${width}, 1fr)`,
            gridTemplateRows: `repeat(${height}, 1fr)`,
            width: dim.w,
            height: dim.h,
          }}
        >
          {Array.from({ length: height }).map((_, y) =>
            Array.from({ length: width }).map((_, x) => {
              const piece = board[y][x];
              const isTarget = isValidTarget(x, y);
              const isDark = (x + y) % 2 === 1;

              return (
                <div
                  key={`${x}-${y}`}
                  onClick={() => onSquareClick({ x, y })}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors duration-200
                    ${mode === GameMode.CHESS ? (isDark ? 'bg-amber-800/20' : 'bg-transparent') : (mode === GameMode.GO || mode === GameMode.XIANGQI || mode === GameMode.GOMOKU ? '' : 'border-[0.5px] border-black/10')}
                    ${isTarget ? 'bg-blue-400/30' : ''}
                  `}
                >
                  {mode === GameMode.XIANGQI && y === 4 && x === 4 && (
                    <div className="absolute inset-0 flex items-center justify-center text-amber-900/40 font-bold select-none text-base md:text-xl pointer-events-none whitespace-nowrap z-0">
                      楚河 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 漢界
                    </div>
                  )}

                  {piece && (
                    <div className="w-full h-full flex items-center justify-center p-[10%] z-10">
                      <PieceComponent
                        piece={piece}
                        isSelected={selectedPiece?.id === piece.id}
                        onClick={onPieceClick}
                        gameMode={mode}
                      />
                    </div>
                  )}
                  {isTarget && !piece && (
                    <div className="absolute w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500/50 animate-pulse z-10" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardComponent;
