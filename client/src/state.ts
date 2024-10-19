import { Status, Color, Piece } from './types';

export const state = {
  status: 'configuring' as Status,
  ready: {
    dark: false,
    light: false,
  },
  mouse: {
    x: -1,
    y: -1,
    clickX: -1,
    clickY: -1,
  },
  budget: {
    dark: 39,
    light: 39,
  },
  pieceSelector: {
    dark: {
      isOpen: false,
      originRank: -1,
      originFile: -1,
    },
    light: {
      isOpen: false,
      originRank: -1,
      originFile: -1,
    },
  },
  board: [
    {
      piece: 'king' as Piece,
      color: 'light' as Color,
      rank: 7,
      file: 4,
    },
    {
      piece: 'king' as Piece,
      color: 'dark' as Color,
      rank: 0,
      file: 4,
    },
  ],
};

document.addEventListener('mouseout', () => {
  state.mouse.x = -1;
  state.mouse.y = -1;
});

window.addEventListener('mousemove', (event) => {
  state.mouse.x = event.clientX;
  state.mouse.y = event.clientY;
});

window.addEventListener('mousedown', (event) => {
  state.mouse.clickX = event.clientX;
  state.mouse.clickY = event.clientY;
});
