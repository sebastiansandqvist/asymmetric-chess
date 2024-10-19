import { tileColor } from './constants';
import { pieceSvg } from './pieces';
import { state } from './state';

const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d')!;

function draw() {
  resizeCanvas();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBoard();
  drawPieces();

  requestAnimationFrame(draw);
}

draw();

function resizeCanvas() {
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  ctx.resetTransform();
  ctx.scale(devicePixelRatio, devicePixelRatio);
}

function getRect() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const min = Math.min(w, h);
  const tileSize = min / 8;
  return { w, h, min, tileSize };
}

function drawBoard() {
  const { tileSize } = getRect();
  for (let i = 0; i < 64; i++) {
    const x = (i % 8) * tileSize;
    const y = Math.floor(i / 8) * tileSize;
    const isLightTile = (Math.floor(i / 8) + (i % 8)) % 2 === 0;
    ctx.fillStyle = isLightTile ? tileColor.light : tileColor.dark;
    ctx.fillRect(x, y, tileSize, tileSize);
  }
}

function drawPieces() {
  const { tileSize } = getRect();
  for (const piece of state.board) {
    const x = piece.file * tileSize;
    const y = piece.rank * tileSize;
    ctx.drawImage(pieceSvg[piece.color][piece.type], x, y, tileSize, tileSize);
  }
}
