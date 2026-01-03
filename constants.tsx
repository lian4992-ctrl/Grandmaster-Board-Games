
import { PieceType, Side, GameMode } from './types';

// Board dimensions
export const BOARD_WIDTH = 9;
export const BOARD_HEIGHT = 10;

export const BOARD_CONFIG = {
  [GameMode.XIANGQI]: { width: 9, height: 10 },
  [GameMode.BANQI]: { width: 8, height: 4 },
  [GameMode.CHESS]: { width: 8, height: 8 },
  [GameMode.GO]: { width: 19, height: 19 },
  [GameMode.GOMOKU]: { width: 15, height: 15 },
};

export const GAME_RULES = {
  [GameMode.XIANGQI]: {
    title: "象棋規則 (Xiangqi Rules)",
    description: "傳統中式象棋。目標是捕獲對方的將/帥。",
    rules: [
      "帥/將：只能在九宮格內移動，每次一格，且不可直接對面。",
      "仕/士：只能在九宮格內斜走，每次一格。",
      "相/象：田字走法，不可過河，且田字中間不能有棋（塞象眼）。",
      "俥/車：橫豎直走，格數不限。",
      "傌/馬：日字走法，注意別馬腿。",
      "炮/砲：移動如車，吃子必須隔一個棋子（炮台）。",
      "兵/卒：過河前只能前進，過河後可左右移動。"
    ]
  },
  [GameMode.CHESS]: {
    title: "西洋棋規則 (Chess Rules)",
    description: "國際象棋。目標是將死(Checkmate)對方的國王。",
    rules: [
      "國王 (King)：周圍八格移動一格。",
      "皇后 (Queen)：橫、豎、斜向無限格。",
      "城堡 (Rook)：橫、豎無限格。",
      "主教 (Bishop)：斜向無限格。",
      "騎士 (Knight)：L型走法（2+1），不受其他棋子阻擋。",
      "兵 (Pawn)：前進一格，吃子需斜前一格；起點可走兩格。"
    ]
  },
  [GameMode.BANQI]: {
    title: "暗棋規則 (Banqi Rules)",
    description: "半盤象棋。翻開棋子，階級制吃子。",
    rules: [
      "移動：上下左右一格。",
      "階級：帥>仕>相>俥>傌>炮>兵. 兵可以吃帥。",
      "翻棋：未翻開的棋子點擊即可揭開。",
      "砲：必須跳過一個棋子才能吃子。"
    ]
  },
  [GameMode.GO]: {
    title: "圍棋規則 (Go Rules)",
    description: "策略博弈。目標是圍地並吃掉對方的棋子。",
    rules: [
      "下棋：棋子落在線的交叉點上，落子後不可移動。",
      "氣：棋子在棋盤上相鄰的空點。若棋子失去所有氣，則被提掉。",
      "打劫：不可立即回提剛被提掉的一個棋子。",
      "勝負：比較雙方圍得的地盤與提掉棋子的數量（通常黑方貼目）。"
    ]
  },
  [GameMode.GOMOKU]: {
    title: "五子棋規則 (Gomoku Rules)",
    description: "策略博弈。先在橫、豎、斜任一方向連成五子者獲勝。",
    rules: [
      "落子：棋子落在交叉點上，黑先白後。",
      "勝負：最先將五個同色棋子連成一線的一方獲勝。",
      "公平：本遊戲採用簡單五子規則，不設禁手。"
    ]
  }
};

export const INITIAL_PIECES = [
  // Black pieces (top)
  { type: PieceType.GENERAL, side: Side.BLACK, x: 4, y: 0 },
  { type: PieceType.ADVISOR, side: Side.BLACK, x: 3, y: 0 },
  { type: PieceType.ADVISOR, side: Side.BLACK, x: 5, y: 0 },
  { type: PieceType.ELEPHANT, side: Side.BLACK, x: 2, y: 0 },
  { type: PieceType.ELEPHANT, side: Side.BLACK, x: 6, y: 0 },
  { type: PieceType.HORSE, side: Side.BLACK, x: 1, y: 0 },
  { type: PieceType.HORSE, side: Side.BLACK, x: 7, y: 0 },
  { type: PieceType.CHARIOT, side: Side.BLACK, x: 0, y: 0 },
  { type: PieceType.CHARIOT, side: Side.BLACK, x: 8, y: 0 },
  { type: PieceType.CANNON, side: Side.BLACK, x: 1, y: 2 },
  { type: PieceType.CANNON, side: Side.BLACK, x: 7, y: 2 },
  { type: PieceType.SOLDIER, side: Side.BLACK, x: 0, y: 3 },
  { type: PieceType.SOLDIER, side: Side.BLACK, x: 2, y: 3 },
  { type: PieceType.SOLDIER, side: Side.BLACK, x: 4, y: 3 },
  { type: PieceType.SOLDIER, side: Side.BLACK, x: 6, y: 3 },
  { type: PieceType.SOLDIER, side: Side.BLACK, x: 8, y: 3 },

  // Red pieces (bottom)
  { type: PieceType.GENERAL, side: Side.RED, x: 4, y: 9 },
  { type: PieceType.ADVISOR, side: Side.RED, x: 3, y: 9 },
  { type: PieceType.ADVISOR, side: Side.RED, x: 5, y: 9 },
  { type: PieceType.ELEPHANT, side: Side.RED, x: 2, y: 9 },
  { type: PieceType.ELEPHANT, side: Side.RED, x: 6, y: 9 },
  { type: PieceType.HORSE, side: Side.RED, x: 1, y: 9 },
  { type: PieceType.HORSE, side: Side.RED, x: 7, y: 9 },
  { type: PieceType.CHARIOT, side: Side.RED, x: 0, y: 9 },
  { type: PieceType.CHARIOT, side: Side.RED, x: 8, y: 9 },
  { type: PieceType.CANNON, side: Side.RED, x: 1, y: 7 },
  { type: PieceType.CANNON, side: Side.RED, x: 7, y: 7 },
  { type: PieceType.SOLDIER, side: Side.RED, x: 0, y: 6 },
  { type: PieceType.SOLDIER, side: Side.RED, x: 2, y: 6 },
  { type: PieceType.SOLDIER, side: Side.RED, x: 4, y: 6 },
  { type: PieceType.SOLDIER, side: Side.RED, x: 6, y: 6 },
  { type: PieceType.SOLDIER, side: Side.RED, x: 8, y: 6 },
];

export const PIECE_LABELS: Record<string, any> = {
  [Side.RED]: {
    [PieceType.GENERAL]: '帥', [PieceType.ADVISOR]: '仕', [PieceType.ELEPHANT]: '相',
    [PieceType.HORSE]: '傌', [PieceType.CHARIOT]: '俥', [PieceType.CANNON]: '炮', [PieceType.SOLDIER]: '兵',
    [PieceType.KING]: '王', [PieceType.QUEEN]: '后', [PieceType.ROOK]: '車',
    [PieceType.BISHOP]: '象', [PieceType.KNIGHT]: '馬', [PieceType.PAWN]: '兵',
    [PieceType.STONE]: '白'
  },
  [Side.BLACK]: {
    [PieceType.GENERAL]: '將', [PieceType.ADVISOR]: '士', [PieceType.ELEPHANT]: '象',
    [PieceType.HORSE]: '馬', [PieceType.CHARIOT]: '車', [PieceType.CANNON]: '砲', [PieceType.SOLDIER]: '卒',
    [PieceType.KING]: '王', [PieceType.QUEEN]: '后', [PieceType.ROOK]: '車',
    [PieceType.BISHOP]: '象', [PieceType.KNIGHT]: '馬', [PieceType.PAWN]: '兵',
    [PieceType.STONE]: '黑'
  },
  [Side.WHITE]: {
    [PieceType.KING]: '王', [PieceType.QUEEN]: '后', [PieceType.ROOK]: '車',
    [PieceType.BISHOP]: '象', [PieceType.KNIGHT]: '馬', [PieceType.PAWN]: '兵',
    [PieceType.STONE]: '白'
  },
  'BLACK_CHESS': {
    [PieceType.KING]: '王', [PieceType.QUEEN]: '后', [PieceType.ROOK]: '車',
    [PieceType.BISHOP]: '象', [PieceType.KNIGHT]: '馬', [PieceType.PAWN]: '兵',
  }
};

export const CHESS_INITIAL = [
  { type: PieceType.ROOK, side: Side.BLACK, x: 0, y: 0 },
  { type: PieceType.KNIGHT, side: Side.BLACK, x: 1, y: 0 },
  { type: PieceType.BISHOP, side: Side.BLACK, x: 2, y: 0 },
  { type: PieceType.QUEEN, side: Side.BLACK, x: 3, y: 0 },
  { type: PieceType.KING, side: Side.BLACK, x: 4, y: 0 },
  { type: PieceType.BISHOP, side: Side.BLACK, x: 5, y: 0 },
  { type: PieceType.KNIGHT, side: Side.BLACK, x: 6, y: 0 },
  { type: PieceType.ROOK, side: Side.BLACK, x: 7, y: 0 },
  ...Array.from({length: 8}, (_, i) => ({ type: PieceType.PAWN, side: Side.BLACK, x: i, y: 1 })),
  
  { type: PieceType.ROOK, side: Side.WHITE, x: 0, y: 7 },
  { type: PieceType.KNIGHT, side: Side.WHITE, x: 1, y: 7 },
  { type: PieceType.BISHOP, side: Side.WHITE, x: 2, y: 7 },
  { type: PieceType.QUEEN, side: Side.WHITE, x: 3, y: 7 },
  { type: PieceType.KING, side: Side.WHITE, x: 4, y: 7 },
  { type: PieceType.BISHOP, side: Side.WHITE, x: 5, y: 7 },
  { type: PieceType.KNIGHT, side: Side.WHITE, x: 6, y: 7 },
  { type: PieceType.ROOK, side: Side.WHITE, x: 7, y: 7 },
  ...Array.from({length: 8}, (_, i) => ({ type: PieceType.PAWN, side: Side.WHITE, x: i, y: 6 })),
];
