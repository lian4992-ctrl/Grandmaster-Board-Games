
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Piece, Side, Position, GameState, GameMode, PieceType } from './types';
import { INITIAL_PIECES, BOARD_CONFIG, CHESS_INITIAL, GAME_RULES, PIECE_LABELS } from './constants';
import { initializeBoard, getValidMoves, isValidMove, isKingCaptured } from './services/gameLogic';
import { isValidChessMove } from './services/chessLogic';
import { isValidBanqiMove } from './services/banqiLogic';
import { isValidGoMove, applyGoCaptures } from './services/goLogic';
import { checkWin, getGomokuScore } from './services/gomokuLogic';
import { getGameAnalysis } from './services/geminiService';
import BoardComponent from './components/BoardComponent';
import Modal from './components/Modal';
import PieceComponent from './components/PieceComponent';

type SelectionStep = 'GAME_TYPE' | 'PLAY_MODE';

const BANQI_RANKS: Record<string, number> = {
  [PieceType.GENERAL]: 7,
  [PieceType.CHARIOT]: 6,
  [PieceType.HORSE]: 5,
  [PieceType.ELEPHANT]: 4,
  [PieceType.ADVISOR]: 3,
  [PieceType.CANNON]: 2,
  [PieceType.SOLDIER]: 1,
};

const TIME_LIMIT_OPTIONS = [
  { label: '5秒', value: 5 },
  { label: '10秒', value: 10 },
  { label: '20秒', value: 20 },
  { label: '25秒', value: 25 },
  { label: '1分鐘', value: 60 },
  { label: '10分鐘', value: 600 },
  { label: '不限時間', value: 0 },
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    mode: GameMode.XIANGQI,
    board: initializeBoard(INITIAL_PIECES),
    turn: Side.RED,
    selectedPiece: null,
    validMoves: [],
    history: [],
    winner: null,
    isAiMode: false,
    timeLimit: 0,
    remainingTime: 0,
    capturedRed: [],
    capturedBlack: [],
  });

  const [isGameStarted, setIsGameStarted] = useState(false);
  const [selectionStep, setSelectionStep] = useState<SelectionStep>('GAME_TYPE');
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>(GameMode.XIANGQI);
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<number>(20); // Default 20s

  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startNewGame = (mode: GameMode, isAi: boolean) => {
    let board;
    const { width, height } = BOARD_CONFIG[mode];
    if (mode === GameMode.CHESS) {
      board = initializeBoard(CHESS_INITIAL);
    } else if (mode === GameMode.BANQI) {
      const pieces = [...INITIAL_PIECES].sort(() => Math.random() - 0.5);
      const bGrid = Array(4).fill(null).map(() => Array(8).fill(null));
      pieces.forEach((p, i) => {
        const x = i % 8;
        const y = Math.floor(i / 8);
        bGrid[y][x] = { ...p, id: `bq-${i}-${Math.random()}`, position: { x, y }, isFlipped: false };
      });
      board = bGrid;
    } else if (mode === GameMode.GO || mode === GameMode.GOMOKU) {
      board = Array(height).fill(null).map(() => Array(width).fill(null));
    } else {
      board = initializeBoard(INITIAL_PIECES);
    }

    const initialTurn = (mode === GameMode.CHESS || mode === GameMode.GO || mode === GameMode.GOMOKU) 
      ? (mode === GameMode.CHESS ? Side.WHITE : Side.BLACK) 
      : Side.RED;

    setGameState({
      mode,
      board,
      turn: initialTurn,
      selectedPiece: null,
      validMoves: [],
      history: [],
      winner: null,
      isAiMode: isAi,
      timeLimit: selectedTimeLimit,
      remainingTime: selectedTimeLimit,
      capturedRed: [],
      capturedBlack: [],
    });
    setAnalysis('');
    setIsGameStarted(true);
    setShowRules(true);
  };

  useEffect(() => {
    if (isGameStarted && !gameState.winner && gameState.timeLimit > 0) {
      timerRef.current = setInterval(() => {
        setGameState(prev => {
          if (prev.remainingTime <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            const loserSide = prev.turn;
            let winner;
            if (prev.mode === GameMode.CHESS || prev.mode === GameMode.GO || prev.mode === GameMode.GOMOKU) {
              winner = loserSide === Side.BLACK ? Side.WHITE : Side.BLACK;
            } else {
              winner = loserSide === Side.RED ? Side.BLACK : Side.RED;
            }
            return { ...prev, remainingTime: 0, winner };
          }
          return { ...prev, remainingTime: prev.remainingTime - 1 };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGameStarted, gameState.turn, gameState.winner, gameState.timeLimit]);

  const handlePieceClick = (piece: Piece) => {
    if (gameState.winner) return;
    if (gameState.isAiMode && (gameState.turn === Side.BLACK || (gameState.mode === GameMode.GO && gameState.turn === Side.WHITE) || (gameState.mode === GameMode.GOMOKU && gameState.turn === Side.WHITE))) return;

    if (gameState.mode === GameMode.GO || gameState.mode === GameMode.GOMOKU) return;

    if (gameState.mode === GameMode.BANQI && !piece.isFlipped) {
      const newBoard = [...gameState.board.map(r => [...r])];
      newBoard[piece.position.y][piece.position.x] = { ...piece, isFlipped: true };
      const nextTurn = gameState.turn === Side.RED ? Side.BLACK : Side.RED;
      setGameState(prev => ({ 
        ...prev, 
        board: newBoard, 
        turn: nextTurn,
        remainingTime: prev.timeLimit,
        selectedPiece: null,
        validMoves: [],
        history: [`翻開 ${PIECE_LABELS[piece.side][piece.type]}`, ...prev.history]
      }));
      return;
    }

    if (piece.side === gameState.turn) {
      const moves: Position[] = [];
      const { width, height } = BOARD_CONFIG[gameState.mode];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let valid = false;
          if (gameState.mode === GameMode.XIANGQI) valid = isValidMove(piece, { x, y }, gameState.board);
          else if (gameState.mode === GameMode.CHESS) valid = isValidChessMove(piece, { x, y }, gameState.board);
          else if (gameState.mode === GameMode.BANQI) valid = isValidBanqiMove(piece, { x, y }, gameState.board);
          if (valid) moves.push({ x, y });
        }
      }
      setGameState(prev => ({ ...prev, selectedPiece: piece, validMoves: moves }));
    } else if (gameState.selectedPiece) {
      handleMove(gameState.selectedPiece, piece.position);
    }
  };

  const handleMove = (piece: Piece, target: Position) => {
    const newBoard = gameState.board.map(row => [...row]);
    const targetPiece = newBoard[target.y][target.x];
    
    let newCapturedRed = [...gameState.capturedRed];
    let newCapturedBlack = [...gameState.capturedBlack];
    
    if (targetPiece) {
      if (targetPiece.side === Side.RED || targetPiece.side === Side.WHITE) {
        newCapturedRed.push(targetPiece);
      } else {
        newCapturedBlack.push(targetPiece);
      }
    }

    newBoard[piece.position.y][piece.position.x] = null;
    newBoard[target.y][target.x] = { ...piece, position: target };

    const getNextTurn = (current: Side, mode: GameMode): Side => {
      if (mode === GameMode.CHESS || mode === GameMode.GO || mode === GameMode.GOMOKU) return current === Side.WHITE ? Side.BLACK : Side.WHITE;
      return current === Side.RED ? Side.BLACK : Side.RED;
    };

    const nextTurn = getNextTurn(gameState.turn, gameState.mode);
    const win = isKingCaptured(newBoard, nextTurn);

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      turn: nextTurn,
      remainingTime: prev.timeLimit,
      selectedPiece: null,
      validMoves: [],
      winner: win ? gameState.turn : null,
      capturedRed: newCapturedRed,
      capturedBlack: newCapturedBlack,
      history: [`${PIECE_LABELS[piece.side][piece.type]} 移至 (${target.x},${target.y})`, ...prev.history]
    }));
  };

  const handlePlacement = (pos: Position) => {
    if (gameState.winner || gameState.board[pos.y][pos.x] !== null) return;
    if (gameState.isAiMode && gameState.turn === Side.WHITE) return;

    const newPiece: Piece = {
      id: `${gameState.mode}-${Date.now()}`,
      type: PieceType.STONE,
      side: gameState.turn,
      position: pos
    };

    let newBoard = gameState.board.map(row => [...row]);
    newBoard[pos.y][pos.x] = newPiece;

    if (gameState.mode === GameMode.GO) {
      newBoard = applyGoCaptures(newBoard, gameState.turn);
    }

    const hasWon = gameState.mode === GameMode.GOMOKU ? checkWin(newBoard, pos, gameState.turn) : false;
    const nextTurn = gameState.turn === Side.BLACK ? Side.WHITE : Side.BLACK;

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      turn: nextTurn,
      remainingTime: prev.timeLimit,
      winner: hasWon ? gameState.turn : null,
      history: [`${newPiece.side === Side.BLACK ? '黑方' : '白方'} 落子於 (${pos.x},${pos.y})`, ...prev.history]
    }));
  };

  const performAiMove = useCallback(() => {
    if (gameState.winner) return;

    const height = gameState.board.length;
    const width = gameState.board[0]?.length || 0;

    if (gameState.mode === GameMode.GO || gameState.mode === GameMode.GOMOKU) {
      const empties: Position[] = [];
      let bestMove: Position | null = null;
      let maxScore = -1;

      for(let y=0; y<height; y++) {
        for(let x=0; x<width; x++) {
          if(!gameState.board[y][x]) {
            empties.push({x, y});
            if (gameState.mode === GameMode.GOMOKU) {
              // AI Gomoku logic: attack and defend
              const attackScore = getGomokuScore(gameState.board, {x, y}, Side.WHITE);
              const defendScore = getGomokuScore(gameState.board, {x, y}, Side.BLACK);
              const totalScore = attackScore + defendScore * 1.1; // Slightly prioritize defense
              if (totalScore > maxScore) {
                maxScore = totalScore;
                bestMove = {x, y};
              }
            }
          }
        }
      }
      
      const move = bestMove || (empties.length > 0 ? empties[Math.floor(Math.random() * empties.length)] : null);
      if (move) {
        const newPiece: Piece = { id: `${gameState.mode}-ai-${Date.now()}`, type: PieceType.STONE, side: Side.WHITE, position: move };
        let newBoard = gameState.board.map(row => [...row]);
        newBoard[move.y][move.x] = newPiece;
        
        if (gameState.mode === GameMode.GO) {
          newBoard = applyGoCaptures(newBoard, Side.WHITE);
        }

        const hasWon = gameState.mode === GameMode.GOMOKU ? checkWin(newBoard, move, Side.WHITE) : false;

        setGameState(prev => ({ 
          ...prev, 
          board: newBoard, 
          turn: Side.BLACK, 
          winner: hasWon ? Side.WHITE : null,
          remainingTime: prev.timeLimit,
          history: [`AI 落子於 (${move.x},${move.y})`, ...prev.history] 
        }));
      }
      return;
    }

    const possibleMoves: { piece: Piece; target: Position; isFlip?: boolean; score: number }[] = [];
    
    gameState.board.forEach(row => {
      row.forEach(p => {
        if (!p) return;
        
        if (gameState.mode === GameMode.BANQI && !p.isFlipped) {
          const aiPiecesCount = gameState.board.flat().filter(piece => piece?.side === Side.BLACK && piece.isFlipped).length;
          const score = 15 - aiPiecesCount; 
          possibleMoves.push({ piece: p, target: p.position, isFlip: true, score });
          return;
        }

        const aiSide = Side.BLACK;
        
        if (p.side === aiSide) {
           for (let y = 0; y < height; y++) {
             for (let x = 0; x < width; x++) {
               let valid = false;
               if (gameState.mode === GameMode.XIANGQI) valid = isValidMove(p, { x, y }, gameState.board);
               else if (gameState.mode === GameMode.CHESS) valid = isValidChessMove(p, { x, y }, gameState.board);
               else if (gameState.mode === GameMode.BANQI) valid = isValidBanqiMove(p, { x, y }, gameState.board);
               
               if (valid) {
                 const targetPiece = gameState.board[y][x];
                 let score = 5;

                 if (gameState.mode === GameMode.BANQI) {
                   if (targetPiece) {
                     const targetRank = BANQI_RANKS[targetPiece.type] || 1;
                     score = targetRank * 10;
                   }
                   const neighbors = [[0,1],[0,-1],[1,0],[-1,0]];
                   neighbors.forEach(([dx, dy]) => {
                     const nx = x + dx, ny = y + dy;
                     const enemy = gameState.board[ny]?.[nx];
                     if (enemy && enemy.side !== p.side && enemy.isFlipped) {
                       const enemyRank = BANQI_RANKS[enemy.type] || 1;
                       const myRank = BANQI_RANKS[p.type] || 1;
                       if (enemyRank >= myRank && !(myRank === 7 && enemyRank === 1)) {
                         score -= (myRank * 5);
                       }
                     }
                   });
                 } else {
                   if (targetPiece) score = 50;
                 }

                 possibleMoves.push({ piece: p, target: { x, y }, score });
               }
             }
           }
        }
      });
    });

    if (possibleMoves.length > 0) {
      possibleMoves.sort((a, b) => b.score - a.score);
      const topMoves = possibleMoves.filter(m => m.score === possibleMoves[0].score);
      const move = topMoves[Math.floor(Math.random() * topMoves.length)];

      if (move.isFlip) {
         const newBoard = [...gameState.board.map(r => [...r])];
         newBoard[move.piece.position.y][move.piece.position.x] = { ...move.piece, isFlipped: true };
         const nextTurn = gameState.turn === Side.RED ? Side.BLACK : Side.RED;
         setGameState(prev => ({ 
           ...prev, 
           board: newBoard, 
           turn: nextTurn,
           remainingTime: prev.timeLimit,
           history: [`AI 翻開了棋子`, ...prev.history] 
         }));
      } else {
         handleMove(move.piece, move.target);
      }
    } else {
      const winSide = (gameState.mode === GameMode.CHESS) ? Side.WHITE : Side.RED;
      setGameState(prev => ({ ...prev, winner: winSide }));
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState.isAiMode && !gameState.winner && isGameStarted) {
      const isAiTurn = (gameState.mode === GameMode.GO || gameState.mode === GameMode.GOMOKU) ? gameState.turn === Side.WHITE : gameState.turn === Side.BLACK;
      if (isAiTurn) {
        const timer = setTimeout(performAiMove, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState.turn, gameState.isAiMode, gameState.winner, isGameStarted, performAiMove, gameState.mode]);

  const getPlayerSideText = () => {
    if (!gameState.isAiMode) return "雙人本地對弈 (輪流操作)";
    if (gameState.mode === GameMode.GO || gameState.mode === GameMode.GOMOKU) return "您的陣營：黑方 (先手)";
    if (gameState.mode === GameMode.CHESS) return "您的陣營：白方 (先手)";
    return "您的陣營：紅方 (先手)";
  };

  const getWinnerDisplayText = () => {
    if (!gameState.winner) return "";
    const { mode, winner } = gameState;
    if (mode === GameMode.GO || mode === GameMode.GOMOKU) return winner === Side.BLACK ? "黑方勝利" : "白方勝利";
    if (mode === GameMode.CHESS) return winner === Side.WHITE ? "白方勝利" : "黑方勝利";
    return winner === Side.RED ? "紅方勝利" : "黑方勝利";
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "時間到";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isGameStarted) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full border-t-8 border-amber-800 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-5xl font-black text-amber-900 mb-2">棋藝大師</h1>
          <p className="text-stone-400 mb-12 tracking-widest uppercase text-sm">Grandmaster Board Games</p>

          {selectionStep === 'GAME_TYPE' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-stone-800 mb-8">請選擇棋類遊戲</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => { setSelectedGameMode(GameMode.GO); setSelectionStep('PLAY_MODE'); }}
                  className="group flex flex-col items-center justify-center p-6 bg-stone-50 rounded-2xl border-2 border-stone-200 hover:border-amber-800 hover:bg-amber-50 transition-all aspect-square"
                >
                  <span className="text-3xl font-black text-stone-800 group-hover:scale-110 transition-transform mb-2">圍棋</span>
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Go</span>
                </button>
                <button 
                  onClick={() => { setSelectedGameMode(GameMode.GOMOKU); setSelectionStep('PLAY_MODE'); }}
                  className="group flex flex-col items-center justify-center p-6 bg-stone-50 rounded-2xl border-2 border-stone-200 hover:border-amber-800 hover:bg-amber-50 transition-all aspect-square"
                >
                  <span className="text-3xl font-black text-blue-900 group-hover:scale-110 transition-transform mb-2">五子棋</span>
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Gomoku</span>
                </button>
                <button 
                  onClick={() => { setSelectedGameMode(GameMode.XIANGQI); setSelectionStep('PLAY_MODE'); }}
                  className="group flex flex-col items-center justify-center p-6 bg-stone-50 rounded-2xl border-2 border-stone-200 hover:border-amber-800 hover:bg-amber-50 transition-all aspect-square"
                >
                  <span className="text-3xl font-black text-amber-900 group-hover:scale-110 transition-transform mb-2">象棋</span>
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Xiangqi</span>
                </button>
                <button 
                  onClick={() => { setSelectedGameMode(GameMode.CHESS); setSelectionStep('PLAY_MODE'); }}
                  className="group flex flex-col items-center justify-center p-6 bg-stone-50 rounded-2xl border-2 border-stone-200 hover:border-amber-800 hover:bg-amber-50 transition-all aspect-square"
                >
                  <span className="text-3xl font-black text-indigo-900 group-hover:scale-110 transition-transform mb-2">西洋棋</span>
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Chess</span>
                </button>
              </div>
              <button 
                  onClick={() => { setSelectedGameMode(GameMode.BANQI); setSelectionStep('PLAY_MODE'); }}
                  className="text-stone-400 text-sm font-bold hover:text-amber-800 transition-colors mt-6 py-2 px-6 border border-stone-100 rounded-full hover:bg-stone-50"
                >
                  暗棋模式 (Banqi)
                </button>
            </div>
          )}

          {selectionStep === 'PLAY_MODE' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-start mb-2">
                <button 
                  onClick={() => setSelectionStep('GAME_TYPE')}
                  className="flex items-center gap-2 text-stone-400 hover:text-amber-800 font-bold transition-colors py-2 px-4 rounded-lg hover:bg-stone-50"
                >
                  <span className="text-xl">←</span> 返回選擇棋種
                </button>
              </div>
              
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 mb-6 text-left">
                <h2 className="text-3xl font-black text-amber-900 mb-2">
                  {selectedGameMode === GameMode.XIANGQI ? '象棋' : selectedGameMode === GameMode.CHESS ? '西洋棋' : selectedGameMode === GameMode.GO ? '圍棋' : selectedGameMode === GameMode.GOMOKU ? '五子棋' : '暗棋'}
                </h2>
                <p className="text-stone-500 font-medium">設定思考時間與對戰模式</p>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-black text-stone-700 text-left px-2 mb-4">每回合思考時間 (玩家與AI通用)</h3>
                  <div className="flex flex-wrap gap-2 justify-center bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    {TIME_LIMIT_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setSelectedTimeLimit(opt.value)}
                        className={`py-3 px-6 rounded-xl text-sm font-bold transition-all ${
                          selectedTimeLimit === opt.value
                            ? 'bg-amber-800 text-white shadow-md scale-105'
                            : 'bg-white text-stone-500 border border-stone-200 hover:border-amber-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => startNewGame(selectedGameMode, false)}
                    className="flex flex-col items-center justify-center gap-2 py-8 bg-stone-800 text-white rounded-2xl font-black hover:bg-stone-900 shadow-xl transition-transform active:scale-95"
                  >
                    <span className="text-3xl">👥</span>
                    <span className="text-xl">雙人本地對戰</span>
                  </button>
                  <button 
                    onClick={() => startNewGame(selectedGameMode, true)}
                    className="flex flex-col items-center justify-center gap-2 py-8 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl transition-transform active:scale-95"
                  >
                    <span className="text-3xl">🤖</span>
                    <span className="text-xl">AI 單機挑戰</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-200 p-4 md:p-8 relative font-sans">
      <div className="fixed top-4 right-4 z-40 flex gap-2">
        <button 
          onClick={() => setShowSettings(true)}
          className="bg-white/95 backdrop-blur shadow-xl w-14 h-14 rounded-full flex items-center justify-center hover:bg-stone-50 transition-all border border-stone-200 text-2xl"
          title="設定與規則"
        >
          ⚙️
        </button>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start justify-center">
        <div className="w-full lg:w-72 flex flex-col gap-4 order-2 lg:order-1">
          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-8 border-amber-900 animate-in fade-in slide-in-from-left-4 duration-500">
            <h2 className="text-2xl font-black text-amber-900 mb-6">
              {gameState.mode === GameMode.XIANGQI ? '象棋' : gameState.mode === GameMode.CHESS ? '西洋棋' : gameState.mode === GameMode.GO ? '圍棋' : gameState.mode === GameMode.GOMOKU ? '五子棋' : '暗棋'}
            </h2>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 border border-stone-200 mb-4 shadow-inner">
              <div>
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">目前回合</p>
                <p className={`text-xl font-black ${gameState.turn === Side.BLACK ? 'text-stone-800' : 'text-red-600'}`}>
                   {(gameState.mode === GameMode.GO || gameState.mode === GameMode.GOMOKU)
                     ? (gameState.turn === Side.BLACK ? '黑方' : '白方')
                     : (gameState.turn === Side.RED ? '紅方' : gameState.turn === Side.WHITE ? '白方' : '黑方')
                   }
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full shadow-lg ${(gameState.turn === Side.BLACK || gameState.turn === Side.WHITE) ? (gameState.turn === Side.BLACK ? 'bg-stone-800' : 'bg-white border') : 'bg-red-500'} animate-pulse`} />
            </div>

            {gameState.timeLimit > 0 && (
              <div className={`p-4 rounded-xl border mb-6 text-center shadow-inner transition-colors duration-500 ${gameState.remainingTime < 5 ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-100'}`}>
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">剩餘時間</p>
                <p className={`text-3xl font-black font-mono ${gameState.remainingTime < 5 ? 'text-red-600 animate-pulse' : 'text-indigo-900'}`}>
                  {formatTime(gameState.remainingTime)}
                </p>
              </div>
            )}

            <button
              onClick={() => startNewGame(gameState.mode, gameState.isAiMode)}
              className="w-full py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-all font-bold shadow-lg active:scale-95"
            >
              重新開始
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-5 h-64 overflow-hidden flex flex-col border border-white/50">
            <h3 className="font-black mb-3 text-stone-300 text-[10px] uppercase tracking-widest">對局歷史</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-stone-200">
              {gameState.history.length === 0 && <p className="text-stone-300 italic text-xs text-center mt-4">尚無移動紀錄</p>}
              {gameState.history.map((h, i) => (
                <div key={i} className="text-xs font-medium border-b border-stone-50 pb-2 text-stone-500 flex justify-between">
                  <span className="text-stone-300 font-mono">{gameState.history.length - i}.</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative group overflow-auto max-w-full order-1 lg:order-2">
          <BoardComponent
            mode={gameState.mode}
            board={gameState.board}
            selectedPiece={gameState.selectedPiece}
            validMoves={gameState.validMoves}
            onPieceClick={handlePieceClick}
            onSquareClick={(pos) => {
              if (gameState.mode === GameMode.GO || gameState.mode === GameMode.GOMOKU) handlePlacement(pos);
              else if (gameState.selectedPiece) handleMove(gameState.selectedPiece, pos);
            }}
          />
          {gameState.winner && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 rounded-lg backdrop-blur-md">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center animate-in zoom-in duration-300 border-t-8 border-amber-800 max-w-xs w-full">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-4xl font-black text-amber-900 mb-2">對局結束</h2>
                <p className="text-stone-500 mb-8 font-bold text-2xl text-amber-700">
                  {getWinnerDisplayText()}
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => startNewGame(gameState.mode, gameState.isAiMode)}
                    className="w-full py-4 bg-amber-800 text-white rounded-2xl font-black text-lg hover:bg-amber-900 transition-all shadow-lg active:scale-95"
                  >
                    再玩一局
                  </button>
                  <button 
                    onClick={() => { setIsGameStarted(false); setSelectionStep('GAME_TYPE'); }}
                    className="w-full py-4 bg-stone-100 text-stone-600 rounded-2xl font-black text-lg hover:bg-stone-200 transition-all active:scale-95"
                  >
                    回到選單
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-4 self-stretch order-3 lg:order-3">
          {(gameState.mode === GameMode.XIANGQI || gameState.mode === GameMode.BANQI) && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 border-l-4 border-amber-900 flex flex-col h-full max-h-[600px]">
               <h2 className="text-lg font-black text-amber-900 mb-4 border-b border-stone-200 pb-2 flex items-center gap-2">
                 ⚔️ 已捕獲棋子
               </h2>
               <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
                  <div className="flex flex-col items-center gap-2 overflow-hidden">
                    <p className="text-[10px] font-black text-stone-500 bg-stone-100 px-2 py-1 rounded w-full text-center uppercase tracking-widest">黑方戰損</p>
                    <div className="flex flex-col gap-1 overflow-y-auto w-full items-center p-2 scrollbar-thin scrollbar-thumb-stone-200">
                      {gameState.capturedBlack.map((p) => (
                        <div key={p.id} className="w-10 h-10 flex-shrink-0">
                          <PieceComponent piece={p} isSelected={false} gameMode={gameState.mode} onClick={() => {}} />
                        </div>
                      ))}
                      {gameState.capturedBlack.length === 0 && <div className="text-[10px] italic text-stone-300">無</div>}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 overflow-hidden border-l border-stone-100 pl-2">
                    <p className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded w-full text-center uppercase tracking-widest">紅方戰損</p>
                    <div className="flex flex-col gap-1 overflow-y-auto w-full items-center p-2 scrollbar-thin scrollbar-thumb-stone-200">
                      {gameState.capturedRed.map((p) => (
                        <div key={p.id} className="w-10 h-10 flex-shrink-0">
                          <PieceComponent piece={p} isSelected={false} gameMode={gameState.mode} onClick={() => {}} />
                        </div>
                      ))}
                      {gameState.capturedRed.length === 0 && <div className="text-[10px] italic text-stone-300">無</div>}
                    </div>
                  </div>
               </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-8 border-indigo-600 flex flex-col flex-1 min-h-[300px]">
            <h2 className="text-xl font-black text-indigo-900 mb-4 flex items-center gap-3"><span className="text-2xl">⚡</span> 盤勢分析</h2>
            <button 
              onClick={async () => {
                setIsAnalyzing(true);
                const res = await getGameAnalysis(gameState);
                setAnalysis(res);
                setIsAnalyzing(false);
              }}
              disabled={isAnalyzing}
              className={`w-full py-3 rounded-xl font-black shadow-lg transition-all ${isAnalyzing ? 'bg-indigo-100 text-indigo-300' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}`}
            >
              {isAnalyzing ? '分析中...' : '獲取大師建議'}
            </button>
            <div className="mt-4 flex-1 bg-indigo-50/30 p-4 rounded-xl border border-indigo-100 text-sm overflow-y-auto shadow-inner leading-relaxed">
              {analysis || <p className="text-indigo-300 opacity-60 text-center mt-10 italic">點擊按鈕獲取盤勢分析</p>}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showRules} onClose={() => setShowRules(false)} title={GAME_RULES[gameState.mode].title}>
        <div className="space-y-6">
          <div className="bg-amber-800 text-white p-5 rounded-2xl shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">您的角色狀態</p>
              <p className="text-xl font-black">{getPlayerSideText()}</p>
            </div>
            <div className="text-3xl">👤</div>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border-l-4 border-amber-800">
             <p className="font-bold text-amber-900">{GAME_RULES[gameState.mode].description}</p>
          </div>
          <ul className="space-y-3">
            {GAME_RULES[gameState.mode].rules.map((r, i) => (
              <li key={i} className="flex gap-4 text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200 shadow-sm text-sm">
                <span className="bg-amber-100 text-amber-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">{i+1}</span>
                <span className="font-medium leading-relaxed">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </Modal>

      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="對局設定與暫停">
        <div className="space-y-6">
          <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">目前模式</p>
            <p className="text-xl font-black text-stone-800">
              {gameState.mode === GameMode.XIANGQI ? '象棋' : gameState.mode === GameMode.CHESS ? '西洋棋' : gameState.mode === GameMode.GO ? '圍棋' : gameState.mode === GameMode.GOMOKU ? '五子棋' : '暗棋'}
              <span className="mx-2 text-stone-300">|</span>
              <span className="text-amber-800">{gameState.isAiMode ? 'AI 對戰' : '雙人對戰'}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => { startNewGame(gameState.mode, gameState.isAiMode); setShowSettings(false); }} className="py-4 bg-stone-100 text-stone-800 rounded-2xl font-black hover:bg-stone-200 transition-all flex flex-col items-center gap-1">
              <span className="text-xl">🔄</span><span className="text-xs">重新對局</span>
            </button>
            <button onClick={() => { setShowRules(true); setShowSettings(false); }} className="py-4 bg-amber-50 text-amber-800 rounded-2xl font-black hover:bg-amber-100 transition-all border border-amber-200 flex flex-col items-center gap-1">
              <span className="text-xl">📜</span><span className="text-xs">查看規則</span>
            </button>
          </div>
          <button onClick={() => { setIsGameStarted(false); setSelectionStep('GAME_TYPE'); setShowSettings(false); }} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-100 transition-all border border-red-200 flex items-center justify-center gap-2">
            <span>🏠</span> 回到主選單
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default App;
