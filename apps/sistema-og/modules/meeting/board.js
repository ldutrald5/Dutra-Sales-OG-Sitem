import { icon } from './icons.js';

export const boardMarkup = `<div class="board-toolbar">
  <label>Ferramenta <select id="board-tool"><option value="pen">Caneta</option><option value="text">Texto</option><option value="arrow">Seta</option><option value="rect">Retângulo</option><option value="circle">Círculo</option><option value="eraser">Borracha</option></select></label>
  <label id="board-text-label" hidden>Texto <input id="board-text" maxlength="100" placeholder="Digite e toque no quadro"></label>
  <label>Cor <input id="board-color" type="color" value="#ffde17"></label>
  <label>Traço <input id="board-width" type="range" min="1" max="15" value="4"></label>
  <button class="text-button" type="button" id="undo-board">${icon('reset', 15)} Desfazer</button>
  <button class="text-button" type="button" id="clear-board">Limpar quadro</button>
</div>
<canvas class="board" width="1200" height="540" aria-label="Área de desenho"></canvas>
<label class="field board-notes"><span>Notas da reunião</span><textarea id="board-notes" rows="3" maxlength="12000" placeholder="Conclusões e próximos passos"></textarea></label>`;

export function activateBoard(root, board, notes, persist) {
  const canvas = root.querySelector('canvas');
  const context = canvas.getContext('2d');
  const tool = root.querySelector('#board-tool');
  const text = root.querySelector('#board-text');
  let draft = null;
  let backup = null;

  const undoButton = root.querySelector('#undo-board');
  const clearButton = root.querySelector('#clear-board');
  const notesInput = root.querySelector('#board-notes');
  notesInput.value = notes;
  notesInput.addEventListener('input', () => persist({ notes: notesInput.value }));

  function draw({ type, points, color, width, text: caption }) {
    const first = points[0];
    const last = points.at(-1);
    context.save();
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = type === 'eraser' ? width * 6 : width;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    switch (type) {
      case 'rect':
        context.rect(first.x, first.y, last.x - first.x, last.y - first.y);
        break;
      case 'circle':
        context.arc(first.x, first.y, Math.hypot(last.x - first.x, last.y - first.y), 0, Math.PI * 2);
        break;
      case 'arrow': {
        const angle = Math.atan2(last.y - first.y, last.x - first.x);
        context.moveTo(first.x, first.y);
        context.lineTo(last.x, last.y);
        for (const offset of [-0.48, 0.48]) {
          context.moveTo(last.x, last.y);
          context.lineTo(last.x - 22 * Math.cos(angle + offset), last.y - 22 * Math.sin(angle + offset));
        }
        break;
      }
      case 'text':
        context.font = `${Math.max(24, width * 5)}px sans-serif`;
        context.fillText(caption, first.x, first.y);
        break;
      default:
        if (type === 'eraser') context.globalCompositeOperation = 'destination-out';
        context.moveTo(first.x, first.y);
        context.lineTo(first.x + 0.1, first.y);
        for (const point of points.slice(1)) context.lineTo(point.x, point.y);
    }
    context.stroke();
    context.restore();
  }

  function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    board.forEach(draw);
    if (draft) draw(draft);
    undoButton.disabled = !board.length && !backup;
    clearButton.disabled = !board.length;
  }

  function appendPoint(event) {
    const { left, top, width, height } = canvas.getBoundingClientRect();
    draft.points.push({
      x: (event.clientX - left) * canvas.width / width,
      y: (event.clientY - top) * canvas.height / height,
    });
  }

  function commit() {
    board.push(draft);
    draft = null;
    persist({ board });
    render();
  }

  tool.addEventListener('change', () => {
    root.querySelector('#board-text-label').hidden = tool.value !== 'text';
  });
  canvas.addEventListener('pointerdown', event => {
    if (draft || event.button !== 0 || (tool.value === 'text' && !text.value.trim())) return;
    draft = { type: tool.value, points: [], color: root.querySelector('#board-color').value, width: +root.querySelector('#board-width').value, text: text.value.trim() };
    appendPoint(event);
    if (draft.type === 'text') commit();
    else {
      canvas.setPointerCapture(event.pointerId);
      render();
    }
  });
  canvas.addEventListener('pointermove', event => {
    if (!draft || !canvas.hasPointerCapture(event.pointerId)) return;
    appendPoint(event);
    render();
  });
  canvas.addEventListener('pointerup', event => {
    if (!draft || !canvas.hasPointerCapture(event.pointerId)) return;
    appendPoint(event);
    commit();
  });
  canvas.addEventListener('pointercancel', () => { draft = null; render(); });
  undoButton.addEventListener('click', () => {
    if (board.length) board.pop();
    else if (backup) {
      board.push(...backup);
      backup = null;
    }
    persist({ board });
    render();
  });
  clearButton.addEventListener('click', () => {
    backup = board.splice(0);
    persist({ board });
    render();
  });
  render();
}
