import { legalMoves } from './chess';
import { colors, oppositeColor, pieceValues, tileColor } from './constants';
import { pieceSvg } from './pieces';
import { state } from './state';
import { Color, Piece } from './types';
import { formatMoney } from './util';

const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d')!;

function draw() {
  resizeCanvas();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.style.cursor = 'default';

  handleClicks();
  handleKeyPresses();

  drawBoard();
  drawCircleInHoveredTile();
  drawLegalMoves();
  drawPieceHighlights();
  drawPieces();
  drawReadyButton('light');
  drawReadyButton('dark');
  drawBudget(3, 5, 'dark');
  drawBudget(4, 5, 'light');
  drawPieceSelectorMenu('light');
  drawPieceSelectorMenu('dark');

  requestAnimationFrame(draw);
}

draw();

function handleKeyPresses() {
  if (state.status !== 'configuring') return;

  // disable if a piece selector is open
  if (state.pieceSelector.dark.isOpen) return;
  if (state.pieceSelector.light.isOpen) return;

  const { tileSize } = getRect();
  const validLightRanks = state.ready.light ? [] : [5, 6, 7];
  const validDarkRanks = state.ready.dark ? [] : [0, 1, 2];
  const validRanks = [...validDarkRanks, ...validLightRanks];
  const hoveredFile = Math.floor(state.mouse.x / tileSize);
  const hoveredRank = Math.floor(state.mouse.y / tileSize);
  const color = validLightRanks.includes(hoveredRank) ? 'light' : 'dark';

  if (!validRanks.includes(hoveredRank)) return;

  const piecesMap = [
    ['p', 'pawn'],
    ['q', 'queen'],
    ['n', 'knight'],
    ['r', 'rook'],
    ['b', 'bishop'],
  ] as const;

  for (const [key, piece] of piecesMap) {
    if (state.keysPressed.has(key)) {
      placePiece({ piece, color, rank: hoveredRank, file: hoveredFile });
      state.keysPressed.delete(key);
    }
  }
}

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

function handleConfigClicks() {
  const x = state.mouse.clickX;
  const y = state.mouse.clickY;
  if (x === -1 || y === -1) return;

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

    if (state.pieceSelector.light.isOpen) continue;
    if (state.pieceSelector.dark.isOpen) continue;

    // handle ready button
    const ready = readyButtonRect(color);
    if (ready.isMouseOver) {
      if (state.ready[color]) {
        state.ready[color] = false;
      } else if (state.budget[color] >= 0) {
        state.ready[color] = true;
      }
      if (state.ready.light && state.ready.dark) {
        state.status = 'playing';
      }
      return;
    }
  }

  const { tileSize } = getRect();
  const file = Math.floor(x / tileSize);
  const rank = Math.floor(y / tileSize);

  if (rank < 3 && !state.ready.dark) {
    state.pieceSelector.dark.isOpen = true;
    state.pieceSelector.dark.originFile = file;
    state.pieceSelector.dark.originRank = rank;
  }
  if (rank > 4 && !state.ready.light) {
    state.pieceSelector.light.isOpen = true;
    state.pieceSelector.light.originFile = file;
    state.pieceSelector.light.originRank = rank;
  }
}
function handlePlayClicks() {
  const x = state.mouse.clickX;
  const y = state.mouse.clickY;
  if (x === -1 || y === -1) return;

  state.mouse.clickX = -1;
  state.mouse.clickY = -1;

  const { tileSize } = getRect();
  const rank = Math.floor(y / tileSize);
  const file = Math.floor(x / tileSize);

  if (!state.selectedPiece) {
    const clickedPiece = state.board.find((x) => x.rank === rank && x.file === file && x.color === state.turn);
    if (!clickedPiece) return;
    state.selectedPiece = {
      rank: clickedPiece.rank,
      file: clickedPiece.file,
    };
  } else {
    const { file: selectedFile, rank: selectedRank } = state.selectedPiece;
    const selectedPiece = state.board.find((x) => x.file === selectedFile && x.rank === selectedRank);
    if (!selectedPiece) return;
    const moves = legalMoves(selectedPiece.piece, selectedRank, selectedFile);
    const isLegalMove = moves.some((move) => move.rank === rank && move.file === file);
    const isCapture =
      isLegalMove && state.board.some((p) => p.rank === rank && p.file === file && p.color !== state.turn);
    state.selectedPiece = null;

    if (isCapture) {
      const captureIdx = state.board.findIndex((p) => p.rank === rank && p.file === file && p.color !== state.turn);
      if (captureIdx !== -1) {
        state.board.splice(captureIdx, 1);
      }
    }
    if (isLegalMove) {
      selectedPiece.rank = rank;
      selectedPiece.file = file;
      state.turn = oppositeColor[state.turn];
    }
  }
}

function handleClicks() {
  if (state.status === 'playing') handlePlayClicks();
  if (state.status === 'configuring') handleConfigClicks();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  ctx.resetTransform();
  ctx.scale(devicePixelRatio, devicePixelRatio);
}

function getRect() {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
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

function drawLegalMoves() {
  if (state.status !== 'playing') return;
  if (!state.selectedPiece) return;

  const { file, rank } = state.selectedPiece;
  const selectedPiece = state.board.find((x) => x.file === file && x.rank === rank);
  if (!selectedPiece) return;
  const moves = legalMoves(selectedPiece.piece, rank, file);

  const { tileSize } = getRect();

  for (const move of moves) {
    const centerX = move.file * tileSize + tileSize / 2;
    const centerY = move.rank * tileSize + tileSize / 2;
    const radius = tileSize / 4;

    const isMouseOver =
      state.mouse.x >= move.file * tileSize &&
      state.mouse.x < (move.file + 1) * tileSize &&
      state.mouse.y >= move.rank * tileSize &&
      state.mouse.y < (move.rank + 1) * tileSize;

    if (isMouseOver) {
      canvas.style.cursor = 'pointer';
    }

    ctx.fillStyle = state.turn === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCircleInHoveredTile() {
  if (state.status !== 'configuring') return;

  // don't draw hover circles if a piece selector is open
  if (state.pieceSelector.dark.isOpen) return;
  if (state.pieceSelector.light.isOpen) return;

  const { tileSize } = getRect();

  const radius = tileSize / 4;

  const validLightRanks = state.ready.light ? [] : [5, 6, 7];
  const validDarkRanks = state.ready.dark ? [] : [0, 1, 2];
  const validRanks = [...validDarkRanks, ...validLightRanks];
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

function drawPieceHighlights() {
  if (!state.selectedPiece) return;
  const { tileSize } = getRect();
  const { rank, file } = state.selectedPiece;

  const x = file * tileSize;
  const y = rank * tileSize;

  ctx.lineWidth = 4;
  ctx.strokeStyle = colors.green;
  ctx.beginPath();
  ctx.roundRect(x, y, tileSize, tileSize, 4); // add rounding with a radius of 10
  ctx.stroke();
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

  const isRightEdge = menu.originFile === 7;
  const budget = state.budget[color];

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

    // draw piece image
    // (and at reduced opacity if overbudget)
    ctx.save();
    if (piece !== 'none') {
      const piecePrice = pieceValues[piece];
      const overBudget = budget - piecePrice < 0;
      if (overBudget) ctx.globalAlpha = 0.5;
    }
    ctx.drawImage(pieceImage, x, y, miniTileSize, miniTileSize);
    ctx.restore();

    // draw the piece price to the right of the piece image
    if (piece !== 'none') {
      const piecePrice = pieceValues[piece];
      const overBudget = budget - piecePrice < 0;
      const rectWidth = (miniTileSize * 3) / 4;
      const textX = isRightEdge ? x - rectWidth : x + miniTileSize;
      const textY = y + miniTileSize / 2;
      const textLabelX = isRightEdge ? textX + (miniTileSize * 2) / 11 : textX + miniTileSize / 7;

      // draw background rectangle
      const borderRadii = isRightEdge ? [5, 0, 0, 5] : [0, 5, 5, 0];
      const labelX = isRightEdge ? textX + 1 : textX - 1;
      ctx.fillStyle = isMouseOver ? '#ddd' : 'white';
      ctx.beginPath();
      ctx.roundRect(labelX, textY - miniTileSize / 4, rectWidth, miniTileSize / 2, borderRadii);
      ctx.fill();

      ctx.textBaseline = 'middle';
      ctx.fillStyle = overBudget ? colors.red : colors.darkGreen;
      ctx.textAlign = 'left';
      ctx.font = `${miniTileSize / 3}px sans-serif`;
      ctx.fillText(formatMoney(piecePrice), textLabelX, textY);
    }
  }

  // draw the remaining budget
  ctx.font = `${miniTileSize / 3}px sans-serif`;
  ctx.textAlign = 'center';

  // background rectangle
  const budgetY = color === 'light' ? y - (miniTileSize * 3) / 4 : y + height + miniTileSize / 6;
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.roundRect(x, budgetY, width, (miniTileSize * 4) / 7, 10);
  ctx.fill();

  // draw text
  ctx.textBaseline = 'top';
  ctx.fillStyle = budget === 0 ? colors.gold : budget < 0 ? colors.red : colors.green;
  ctx.fillText(formatMoney(budget), x + miniTileSize / 2, budgetY + miniTileSize / 8);
}

function readyButtonRect(color: Color) {
  const { tileSize, min } = getRect();
  const rank = color === 'dark' ? 3 : 4;
  const width = (tileSize * 3) / 2;
  const height = (tileSize * 2) / 3;
  const x = min / 2 - width / 2;
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

function drawBudget(rank: number, file: number, color: Color) {
  if (state.status !== 'configuring') return;

  const { tileSize } = getRect();
  const x = file * tileSize - (tileSize * 6) / 11;
  const y = rank * tileSize + tileSize / 20;
  const budget = state.budget[color];

  if (budget === 0) return;

  if (budget > 0) {
    ctx.fillStyle = colors.green;
  } else {
    ctx.fillStyle = colors.red;
  }

  ctx.beginPath();
  ctx.roundRect(x, y, tileSize / 2, tileSize / 4, tileSize);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `500 ${tileSize / 7}px sans-serif`;
  ctx.fillText(formatMoney(budget), x + tileSize / 4, y + tileSize / 8);
}
