import bishopDark from './assets/pieces/chess_b_dark.svg';
import bishopLight from './assets/pieces/chess_b_light.svg';
import kingDark from './assets/pieces/chess_k_dark.svg';
import kingLight from './assets/pieces/chess_k_light.svg';
import queenDark from './assets/pieces/chess_q_dark.svg';
import queenLight from './assets/pieces/chess_q_light.svg';
import rookDark from './assets/pieces/chess_r_dark.svg';
import rookLight from './assets/pieces/chess_r_light.svg';
import knightDark from './assets/pieces/chess_n_dark.svg';
import knightLight from './assets/pieces/chess_n_light.svg';
import pawnDark from './assets/pieces/chess_p_dark.svg';
import pawnLight from './assets/pieces/chess_p_light.svg';

function toImage(svg: string) {
  const img = new Image();
  img.src = svg;
  return img;
}

export const pieceSvg = {
  dark: {
    bishop: toImage(bishopDark),
    king: toImage(kingDark),
    queen: toImage(queenDark),
    rook: toImage(rookDark),
    knight: toImage(knightDark),
    pawn: toImage(pawnDark),
  },
  light: {
    bishop: toImage(bishopLight),
    king: toImage(kingLight),
    queen: toImage(queenLight),
    rook: toImage(rookLight),
    knight: toImage(knightLight),
    pawn: toImage(pawnLight),
  },
};
