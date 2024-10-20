import { Status, Color, Piece } from './types';

const canvas = document.querySelector('canvas')!;

export const state = {
  // cursor: { light: { x, y }, dark: { x, y } } // if we add gamepad input
  keysPressed: new Set<string>(),
  status: 'configuring' as Status,
  turn: 'light' as Color,
  selectedPiece: null as { rank: number; file: number } | null,
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

canvas.addEventListener('mousemove', (event) => {
  state.mouse.x = event.offsetX;
  state.mouse.y = event.offsetY;
});

canvas.addEventListener('mousedown', (event) => {
  if (event.button === 2) return; // ignore right click
  state.mouse.clickX = event.offsetX;
  state.mouse.clickY = event.offsetY;
});

document.addEventListener('keypress', (event) => {
  console.log(event.key);
  state.keysPressed.add(event.key);
});
