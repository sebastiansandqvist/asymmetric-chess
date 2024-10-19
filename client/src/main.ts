import { pieceValues, tileColor } from './constants';
import { pieceSvg } from './pieces';
import { state } from './state';
import { Color, Piece } from './types';

const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d')!;

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function draw() {
  resizeCanvas();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.style.cursor = 'default';

  handleClicks();

  drawBoard();
  drawCircleInHoveredTile();
  drawPieces();
  drawReadyButton('light');
  drawReadyButton('dark');
  drawPieceSelectorMenu('light');
  drawPieceSelectorMenu('dark');

  requestAnimationFrame(draw);
}

draw();

function placePiece({ piece, color, rank, file }: { piece: Piece; color: Color; rank: number; file: number }) {
  const existingPieceIndex = state.board.findIndex((x) => x.rank === rank && x.file === file);
  if (existingPieceIndex !== -1) {
    const existingPiece = state.board[existingPieceIndex]!;
    refundPiece(existingPiece);
  }
  state.board.push({ piece, color, file, rank });
  state.budget[color] -= pieceValues[piece];
}

function refundPiece({ color, rank, file }: { color: Color; rank: number; file: number }) {
  const existingPieceIndex = state.board.findIndex((x) => x.rank === rank && x.file === file);
  if (existingPieceIndex !== -1) {
    const existingPiece = state.board[existingPieceIndex]!;
    state.board.splice(existingPieceIndex, 1);
    state.budget[color] += pieceValues[existingPiece.piece];
  }
}

function handleClicks() {
  const x = state.mouse.clickX;
  const y = state.mouse.clickY;
  if (x === -1 || y === -1) return;
  if (state.status !== 'configuring') return;

  state.mouse.clickX = -1;
  state.mouse.clickY = -1;

  for (const color of ['dark', 'light'] as const) {
    // handle picking pieces
    const rank = state.pieceSelector[color].originRank;
    const file = state.pieceSelector[color].originFile;
    if (state.pieceSelector[color].isOpen) {
      const pickedPiece = getMenuRects(color).piecePositions.find((piece) => piece.isMouseOver);
      if (pickedPiece)
        if (pickedPiece.piece === 'none') {
          refundPiece({ color, rank, file });
        } else {
          placePiece({
            ...pickedPiece,
            piece: pickedPiece.piece as Piece,
            rank,
            file,
          });
        }
      state.pieceSelector[color].isOpen = false;
      return;
    }

    // handle ready button
    const ready = readyButtonRect(color);
    if (ready.isMouseOver) {
      state.ready[color] = true;
      if (state.ready.light && state.ready.dark) {
        state.status = 'playing';
      }
      return;
    }
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
    ctx.drawImage(pieceSvg[piece.color][piece.piece], x, y, tileSize, tileSize);
  }
}

function drawCircleInHoveredTile() {
  // don't draw hover circles if a piece selector is open
  if (state.pieceSelector.dark.isOpen) return;
  if (state.pieceSelector.light.isOpen) return;

  const { tileSize } = getRect();

  const radius = tileSize / 4;
  const validRanks = [0, 1, 2, 5, 6, 7];
  const hoveredFile = Math.floor(state.mouse.x / tileSize);
  const hoveredRank = Math.floor(state.mouse.y / tileSize);

  if (!validRanks.includes(hoveredRank)) {
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

function getMenuRects(color: Color) {
  const { tileSize } = getRect();
  const menu = state.pieceSelector[color];
  const pieces = ['none', 'pawn', 'knight', 'bishop', 'rook', 'queen'] as (Piece | 'none')[];
  const hasKing = state.board.find((tile) => tile.piece === 'king' && tile.color === color);
  if (!hasKing) pieces.push('king');
  if (color === 'dark') pieces.reverse();

  const miniTileSize = tileSize / 2;
  const width = miniTileSize;
  const height = miniTileSize * pieces.length;
  const x = menu.originFile * tileSize + width / 2;
  const bottom = menu.originRank * tileSize + width / 2;
  const top = menu.originRank * tileSize - height + tileSize - miniTileSize / 2;
  const y = color === 'light' ? top : bottom;

  const piecePositions = pieces.map((piece, i) => {
    const offsetY = i * miniTileSize;
    const isMouseOver =
      state.mouse.x >= x &&
      state.mouse.x <= x + miniTileSize &&
      state.mouse.y >= y + offsetY &&
      state.mouse.y <= y + offsetY + miniTileSize;
    return {
      piece,
      color,
      isMouseOver,
      offsetY,
      x,
      y: y + offsetY,
    };
  });

  return { tileSize, miniTileSize, x, y, width, height, top, bottom, piecePositions, pieces };
}

function drawPieceSelectorMenu(color: Color) {
  const menu = state.pieceSelector[color];
  if (!menu.isOpen) return;

  // draw menu bg
  const { x, y, width, height, miniTileSize, piecePositions } = getMenuRects(color);
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 10);
  ctx.fill();

  // draw each piece icon
  for (const { piece, isMouseOver, x, y } of piecePositions) {
    const pieceImage = pieceSvg[color][piece];

    // grayish bg if hovered
    if (isMouseOver) {
      canvas.style.cursor = 'pointer';
      ctx.fillStyle = '#ddd';
      ctx.beginPath();
      ctx.roundRect(x, y, miniTileSize, miniTileSize, 10);
      ctx.fill();
    }

    ctx.drawImage(pieceImage, x, y, miniTileSize, miniTileSize);

    // draw the piece price to the right of the piece image
    if (piece !== 'none') {
      const piecePrice = pieceValues[piece];
      const textX = x + miniTileSize;
      const textY = y + miniTileSize / 2;
      const rectWidth = (miniTileSize * 3) / 4;

      // draw background rectangle
      ctx.fillStyle = isMouseOver ? '#ddd' : 'white';
      ctx.beginPath();
      ctx.roundRect(textX - 1, textY - miniTileSize / 4, rectWidth, miniTileSize / 2, [0, 5, 5, 0]);
      ctx.fill();

      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'green';
      ctx.textAlign = 'left';
      ctx.font = `${miniTileSize / 3}px sans-serif`;
      ctx.fillText(formatMoney(piecePrice), textX + miniTileSize / 7, textY);
    }
  }

  // draw the remaining budget
  const budget = state.budget[color];
  ctx.font = `${miniTileSize / 3}px sans-serif`;
  ctx.textAlign = 'center';

  // background rectangle
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.roundRect(x, y + height + miniTileSize / 6, width, (miniTileSize * 4) / 7, 10);
  ctx.fill();

  // draw text
  const green = '#4ade80';
  const gold = '#fcd34d';
  const red = '#ef4444';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = budget === 0 ? gold : budget < 0 ? red : green;
  ctx.fillText(formatMoney(budget), x + miniTileSize / 2, y + height + (miniTileSize * 4) / 7);
}

function readyButtonRect(color: Color) {
  const { tileSize, w } = getRect();
  const rank = color === 'dark' ? 3 : 4;
  const width = (tileSize * 3) / 2;
  const height = (tileSize * 2) / 3;
  const x = w / 2 - width / 2;
  const y = rank * tileSize + height / 4;
  const isMouseOver =
    state.mouse.x >= x && state.mouse.x <= x + width && state.mouse.y >= y && state.mouse.y <= y + height;

  return { tileSize, rank, width, height, x, y, isMouseOver };
}

function drawReadyButton(color: Color) {
  if (state.status !== 'configuring') return;
  const { tileSize, x, y, width, height, isMouseOver } = readyButtonRect(color);

  const isReady = state.ready[color];

  if (isReady) ctx.globalAlpha = 0.5;
  ctx.fillStyle = color === 'dark' ? 'black' : 'white';
  ctx.fillRect(x, y, width, height);
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${isReady ? 'italic ' : ''}${tileSize / 3}px sans-serif`;
  ctx.fillStyle = color === 'dark' ? 'white' : 'black';
  ctx.fillText(`ready${isReady ? '!' : ''}`, x + width / 2, y + height / 2);

  const isMenuOpen = state.pieceSelector[color].isOpen;

  if (isMouseOver && !isMenuOpen) {
    if (state.budget[color] < 0) {
      canvas.style.cursor = 'not-allowed';
    } else if (state.ready[color]) {
      canvas.style.cursor = 'default';
    } else {
      canvas.style.cursor = 'pointer';
    }
  }
}
