type Color = 'dark' | 'light';
type Piece = 'pawn' | 'knight' | 'king' | 'rook' | 'queen' | 'bishop';

export const state = {
  budget: {
    dark: 39,
    light: 39,
  },
  board: [
    {
      color: 'dark' as Color,
      type: 'pawn' as Piece,
      rank: 3,
      file: 4,
    },
    {
      color: 'light' as Color,
      type: 'king' as Piece,
      rank: 0,
      file: 4,
    },
  ],
};
