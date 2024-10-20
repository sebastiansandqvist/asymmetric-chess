import { state } from './state';
import { Piece } from './types';

export function legalMoves(piece: Piece, rank: number, file: number) {
  const moves: { rank: number; file: number }[] = [];
  const { board } = state;

  const isValidMove = (r: number, f: number) =>
    r >= 0 &&
    r < 8 &&
    f >= 0 &&
    f < 8 &&
    (!board.some((p) => p.rank === r && p.file === f) ||
      board.some((p) => p.rank === r && p.file === f && p.color !== state.turn));

  switch (piece) {
    case 'pawn':
      {
        const direction = state.turn === 'light' ? -1 : 1;
        // Forward move
        if (isValidMove(rank + direction, file) && !board.some((p) => p.rank === rank + direction && p.file === file)) {
          moves.push({ rank: rank + direction, file: file });
        }
        // Initial double forward move
        if (
          (state.turn === 'light' && rank === 6 && !board.some((p) => p.rank === rank - 1 && p.file === file)) ||
          (state.turn === 'dark' && rank === 1 && !board.some((p) => p.rank === rank + 1 && p.file === file))
        ) {
          if (
            isValidMove(rank + 2 * direction, file) &&
            !board.some((p) => p.rank === rank + 2 * direction && p.file === file)
          ) {
            moves.push({ rank: rank + 2 * direction, file: file });
          }
        }
        // Capture moves
        if (
          isValidMove(rank + direction, file - 1) &&
          board.some((p) => p.rank === rank + direction && p.file === file - 1 && p.color !== state.turn)
        ) {
          moves.push({ rank: rank + direction, file: file - 1 });
        }
        if (
          isValidMove(rank + direction, file + 1) &&
          board.some((p) => p.rank === rank + direction && p.file === file + 1 && p.color !== state.turn)
        ) {
          moves.push({ rank: rank + direction, file: file + 1 });
        }
      }
      break;
    case 'knight':
      {
        const knightMoves = [
          { rank: rank + 2, file: file + 1 },
          { rank: rank + 2, file: file - 1 },
          { rank: rank - 2, file: file + 1 },
          { rank: rank - 2, file: file - 1 },
          { rank: rank + 1, file: file + 2 },
          { rank: rank + 1, file: file - 2 },
          { rank: rank - 1, file: file + 2 },
          { rank: rank - 1, file: file - 2 },
        ];
        for (const move of knightMoves) {
          if (isValidMove(move.rank, move.file)) moves.push(move);
        }
      }
      break;
    case 'king':
      {
        const kingMoves = [
          { rank: rank + 1, file: file },
          { rank: rank - 1, file: file },
          { rank: rank, file: file + 1 },
          { rank: rank, file: file - 1 },
          { rank: rank + 1, file: file + 1 },
          { rank: rank + 1, file: file - 1 },
          { rank: rank - 1, file: file + 1 },
          { rank: rank - 1, file: file - 1 },
        ];
        for (const move of kingMoves) {
          if (isValidMove(move.rank, move.file)) moves.push(move);
        }
      }
      break;
    case 'rook':
      {
        for (let i = 1; i < 8; i++) {
          if (isValidMove(rank + i, file)) {
            moves.push({ rank: rank + i, file: file });
            if (board.some((p) => p.rank === rank + i && p.file === file && p.color !== state.turn)) break;
          } else break;
        }
        for (let i = 1; i < 8; i++) {
          if (isValidMove(rank - i, file)) {
            moves.push({ rank: rank - i, file: file });
            if (board.some((p) => p.rank === rank - i && p.file === file && p.color !== state.turn)) break;
          } else break;
        }
        for (let i = 1; i < 8; i++) {
          if (isValidMove(rank, file + i)) {
            moves.push({ rank: rank, file: file + i });
            if (board.some((p) => p.rank === rank && p.file === file + i && p.color !== state.turn)) break;
          } else break;
        }
        for (let i = 1; i < 8; i++) {
          if (isValidMove(rank, file - i)) {
            moves.push({ rank: rank, file: file - i });
            if (board.some((p) => p.rank === rank && p.file === file - i && p.color !== state.turn)) break;
          } else break;
        }
      }
      break;
    case 'queen':
      {
        // Combine rook and bishop moves
        for (let i = 1; i < 8; i++) {
          if (isValidMove(rank + i, file)) {
            moves.push({ rank: rank + i, file: file });
            if (board.some((p) => p.rank === rank + i && p.file === file && p.color !== state.turn)) break;
          } else break;
        }
        for (let i = 1; i < 8; i++) {
          if (isValidMove(rank - i, file)) {
            moves.push({ rank: rank - i, file: file });
            if (board.some((p) => p.rank === rank - i && p.file === file && p.color !== state.turn)) break;
          } else break;
        }
        for (let i = 1; i < 8; i++) {
          if (isValidMove(rank, file + i)) {
            moves.push({ rank: rank, file: file + i });
            if (board.some((p) => p.rank === rank && p.file === file + i && p.color !== state.turn)) break;
          } else break;
        }
        for (let i = 1; i < 8; i++) {
          if (isValidMove(rank, file - i)) {
            moves.push({ rank: rank, file: file - i });
            if (board.some((p) => p.rank === rank && p.file === file - i && p.color !== state.turn)) break;
          } else break;
        }
        for (let i = 1; i < 8; i++) {
          if (isValidMove(rank + i, file + i)) {
            moves.push({ rank: rank + i, file: file + i });
            if (board.some((p) => p.rank === rank + i && p.file === file + i && p.color !== state.turn)) break;
          } else break;
        }
        for (let i = 1; i < 8; i++) {
          if (isValidMove(rank - i, file - i)) {
            moves.push({ rank: rank - i, file: file - i });
            if (board.some((p) => p.rank === rank - i && p.file === file - i && p.color !== state.turn)) break;
          } else break;
        }
        for (let i = 1; i < 8; i++) {
          if (isValidMove(rank + i, file - i)) {
            moves.push({ rank: rank + i, file: file - i });
            if (board.some((p) => p.rank === rank + i && p.file === file - i && p.color !== state.turn)) break;
          } else break;
        }
        for (let i = 1; i < 8; i++) {
          if (isValidMove(rank - i, file + i)) {
            moves.push({ rank: rank - i, file: file + i });
            if (board.some((p) => p.rank === rank - i && p.file === file + i && p.color !== state.turn)) break;
          } else break;
        }
      }
      break;
    case 'bishop':
      {
        for (let i = 1; i < 8; i++) {
          if (isValidMove(rank + i, file + i)) {
            moves.push({ rank: rank + i, file: file + i });
            if (board.some((p) => p.rank === rank + i && p.file === file + i && p.color !== state.turn)) break;
          } else break;
        }
        for (let i = 1; i < 8; i++) {
          if (isValidMove(rank - i, file - i)) {
            moves.push({ rank: rank - i, file: file - i });
            if (board.some((p) => p.rank === rank - i && p.file === file - i && p.color !== state.turn)) break;
          } else break;
        }
        for (let i = 1; i < 8; i++) {
          if (isValidMove(rank + i, file - i)) {
            moves.push({ rank: rank + i, file: file - i });
            if (board.some((p) => p.rank === rank + i && p.file === file - i && p.color !== state.turn)) break;
          } else break;
        }
        for (let i = 1; i < 8; i++) {
          if (isValidMove(rank - i, file + i)) {
            moves.push({ rank: rank - i, file: file + i });
            if (board.some((p) => p.rank === rank - i && p.file === file + i && p.color !== state.turn)) break;
          } else break;
        }
      }
      break;
  }

  return moves;
}
