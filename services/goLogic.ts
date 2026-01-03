
import { Piece, PieceType, Side, Position } from '../types';

export const isValidGoMove = (pos: Position, board: (Piece | null)[][]): boolean => {
  const height = board.length;
  const width = board[0]?.length || 0;
  if (pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height) return false;
  return board[pos.y][pos.x] === null;
};

// Simple BFS to find stones in a group and their liberties
export const getGroupInfo = (
  startPos: Position,
  board: (Piece | null)[][],
  visited: Set<string>
) => {
  const height = board.length;
  const width = board[0]?.length || 0;
  const piece = board[startPos.y][startPos.x];
  if (!piece) return { group: [], liberties: 0 };

  const group: Position[] = [];
  const liberties = new Set<string>();
  const queue: Position[] = [startPos];
  const groupSide = piece.side;

  visited.add(`${startPos.x},${startPos.y}`);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    group.push(curr);

    const neighbors = [
      { x: curr.x + 1, y: curr.y },
      { x: curr.x - 1, y: curr.y },
      { x: curr.x, y: curr.y + 1 },
      { x: curr.x, y: curr.y - 1 },
    ];

    for (const n of neighbors) {
      if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
        const neighborPiece = board[n.y][n.x];
        if (!neighborPiece) {
          liberties.add(`${n.x},${n.y}`);
        } else if (neighborPiece.side === groupSide && !visited.has(`${n.x},${n.y}`)) {
          visited.add(`${n.x},${n.y}`);
          queue.push(n);
        }
      }
    }
  }

  return { group, liberties: liberties.size };
};

export const applyGoCaptures = (board: (Piece | null)[][], lastSide: Side): (Piece | null)[][] => {
  const newBoard = board.map(row => [...row]);
  const height = board.length;
  const width = board[0]?.length || 0;
  const opponentSide = lastSide === Side.BLACK ? Side.WHITE : Side.BLACK;

  const capturedAny = false;
  const visited = new Set<string>();

  // Check opponent groups first (standard Go rule: capture opponent first)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = newBoard[y][x];
      if (p && p.side === opponentSide && !visited.has(`${x},${y}`)) {
        const { group, liberties } = getGroupInfo({ x, y }, newBoard, visited);
        if (liberties === 0) {
          group.forEach(stone => {
            newBoard[stone.y][stone.x] = null;
          });
        }
      }
    }
  }

  // Then check own groups (suicide rule usually prevents this, but we'll just check)
  // For simplicity, we don't strictly enforce suicide rule here but we could.
  
  return newBoard;
};
