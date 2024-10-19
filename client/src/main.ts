import { tileColor } from './constants';
import { pieceSvg } from './pieces';
import { state } from './state';

const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d')!;

function draw() {
  resizeCanvas();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // TODO: should events go in a different loop?
  handleClicks();

  drawBoard();
  // highlightHoveredTile();
  drawCircleInHoveredTile();
  drawPieces();
  drawPieceSelectorMenus();

  requestAnimationFrame(draw);
}

draw();

function handleClicks() {
  const x = state.mouse.clickX;
  const y = state.mouse.clickY;
  if (x === -1 || y === -1) return;
  if (state.status !== 'configuring') return; // TODO: eventually, move pieces

  state.mouse.clickX = -1;
  state.mouse.clickY = -1;

  // TODO: handle if clicking in a menu
  if (state.pieceSelector.dark.isOpen) {
    return (state.pieceSelector.dark.isOpen = false);
  }

  if (state.pieceSelector.light.isOpen) {
    return (state.pieceSelector.light.isOpen = false);
  }

  const { tileSize } = getRect();
  const file = Math.floor(x / tileSize);
  const rank = Math.floor(y / tileSize);

  if (rank < 3) {
    state.pieceSelector.dark.isOpen = true;
    state.pieceSelector.dark.originFile = file;
    state.pieceSelector.dark.originRank = rank;
  }
  if (rank > 4) {
    state.pieceSelector.light.isOpen = true;
    state.pieceSelector.light.originFile = file;
    state.pieceSelector.light.originRank = rank;
  }
}

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

function drawCircleInHoveredTile() {
  const { tileSize } = getRect();

  const radius = 20;
  const validRanks = [0, 1, 2, 5, 6, 7];
  const hoveredFile = Math.floor(state.mouse.x / tileSize);
  const hoveredRank = Math.floor(state.mouse.y / tileSize);

  if (!validRanks.includes(hoveredRank)) {
    canvas.style.cursor = 'default';
    return;
  }

  const hasPiece = state.board.some((piece) => piece.file === hoveredFile && piece.rank === hoveredRank);
  if (hasPiece) {
    canvas.style.cursor = 'alias';
    return;
  }

  const centerX = hoveredFile * tileSize + tileSize / 2;
  const centerY = hoveredRank * tileSize + tileSize / 2;

  ctx.fillStyle = hoveredRank <= 2 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  canvas.style.cursor = 'pointer';
}

function highlightHoveredTile() {
  const { tileSize } = getRect();
  const hoveredFile = Math.floor(state.mouse.x / tileSize);
  const hoveredRank = Math.floor(state.mouse.y / tileSize);
  resizeCanvas();
  drawBoard();
  drawPieces();
  ctx.fillStyle = 'rgba(255, 255, 0, 0.5)'; // yellowish
  ctx.fillRect(hoveredFile * tileSize, hoveredRank * tileSize, tileSize, tileSize);
}

function drawPieceSelectorMenus() {}
