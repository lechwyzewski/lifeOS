import store from '../core/store.js';
import utils from '../core/utils.js';

let updateInterval = null;

export function render(container) {
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  const hourHeight = 47;
  const startHour = 6;
  const endHour = 23;
  const totalHours = endHour - startHour + 1;

  container.innerHTML = `
    <div class="time-blocking-view animate-fade-in" style="padding-bottom: 80px;">
      <header class="view-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
        <div>
          <h1 class="section-title">Time Blocking</h1>
          <p class="text-muted">${utils.formatDate(new Date())}</p>
        </div>
        <div class="category-legend" style="display: flex; gap: 1rem; flex-wrap: wrap;">
          ${utils.getBlockCategories().map(cat => `
            <div class="legend-item" style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem;">
              <span class="legend-dot" style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${cat.color};"></span>
              <span class="legend-label">${cat.label}</span>
            </div>
          `).join('')}
        </div>
      </header>

      <div class="timeline-container glass-card" style="padding: 1.5rem; position: relative;">
        <div class="time-axis" style="position: relative; min-height: ${totalHours * hourHeight}px;">
          
          <!-- Hours -->
          ${Array.from({ length: totalHours }, (_, i) => startHour + i).map(hour => `
            <div class="time-hour" style="position: absolute; top: ${(hour - startHour) * hourHeight}px; width: 100%; display: flex; align-items: flex-start;">
              <span class="time-hour-label" style="width: 50px; font-size: 0.8rem; color: var(--text-muted, #888); transform: translateY(-50%); text-align: right; padding-right: 10px;">${hour}:00</span>
              <div class="time-hour-line" style="flex: 1; border-top: 1px dashed rgba(255,255,255,0.1);"></div>
            </div>
          `).join('')}
          
          <!-- Current Time Indicator -->
          <div id="current-time-indicator" class="current-time-line" style="position: absolute; left: 50px; right: 0; border-top: 2px solid var(--danger-color, #ef4444); z-index: 10; display: none;">
             <span id="current-time-label" style="position: absolute; top: -10px; left: -50px; color: var(--danger-color, #ef4444); font-size: 0.75rem; font-weight: bold; background: var(--bg-color, #1a1a1a); padding: 0 4px; border-radius: 4px;"></span>
          </div>

          <!-- Blocks Container -->
          <div id="blocks-container" style="position: absolute; top: 0; left: 60px; right: 10px; bottom: 0;"></div>
        </div>
      </div>

      <!-- Add Block Button -->
      <button id="add-block-btn" class="btn btn-primary" style="position: fixed; bottom: 30px; right: 30px; border-radius: 50px; padding: 15px 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); z-index: 100; display: flex; align-items: center; gap: 0.5rem;">
        <i data-lucide="plus"></i> Dodaj blok
      </button>

      <!-- Edit/Add Dialog -->
      <div id="block-dialog" class="dialog-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="glass-card dialog-content animate-fade-in" style="width: 400px; max-width: 90vw; padding: 2rem; border-radius: 12px;">
          <h2 id="dialog-title" class="section-title" style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="calendar"></i> <span>Dodaj blok</span>
          </h2>
          <form id="block-form">
            <input type="hidden" id="block-id">
            <div class="form-group" style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Etykieta</label>
              <input type="text" id="block-label" class="form-control" required style="width: 100%;">
            </div>
            <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group" style="flex: 1;">
                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Od</label>
                <select id="block-start" class="form-control" required style="width: 100%;"></select>
              </div>
              <div class="form-group" style="flex: 1;">
                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Do</label>
                <select id="block-end" class="form-control" required style="width: 100%;"></select>
              </div>
            </div>
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Kategoria</label>
              <select id="block-category" class="form-control" style="width: 100%;">
                ${utils.getBlockCategories().map(cat => `<option value="${cat.key}">${cat.label}</option>`).join('')}
              </select>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2rem;">
              <div>
                <button type="button" id="btn-delete" class="btn btn-danger" style="display: none;">Usuń</button>
              </div>
              <div style="display: flex; gap: 0.75rem;">
                <button type="button" id="btn-cancel" class="btn btn-ghost">Anuluj</button>
                <button type="submit" class="btn btn-primary">Zapisz</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Populate time selects (every 15 mins)
  const startSelect = utils.$('#block-start', container);
  const endSelect = utils.$('#block-end', container);
  let timeOptions = '';
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += 15) {
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      timeOptions += `<option value="${timeStr}">${timeStr}</option>`;
    }
  }
  startSelect.innerHTML = timeOptions;
  endSelect.innerHTML = timeOptions;

  const renderBlocks = () => {
    const blocks = store.getTodayTimeBlocks();
    const containerEl = utils.$('#blocks-container', container);
    containerEl.innerHTML = '';

    blocks.forEach(block => {
      const startTotalMinutes = block.startHour * 60 + block.startMinute;
      const endTotalMinutes = block.endHour * 60 + block.endMinute;
      const duration = endTotalMinutes - startTotalMinutes;
      
      const topPos = ((startTotalMinutes - startHour * 60) / 60) * hourHeight;
      const height = (duration / 60) * hourHeight;

      if (topPos + height < 0 || topPos > totalHours * hourHeight) return;

      const categoryInfo = utils.getBlockCategories().find(c => c.key === block.category) || {};
      const bgColor = categoryInfo.color || 'var(--primary-color)';

      const blockEl = utils.createElement('div', `time-block ${block.category}`);
      blockEl.style.position = 'absolute';
      blockEl.style.top = `${topPos}px`;
      blockEl.style.height = `${Math.max(height, 20)}px`;
      blockEl.style.left = '0';
      blockEl.style.right = '0';
      blockEl.style.padding = '4px 8px';
      blockEl.style.overflow = 'hidden';
      blockEl.style.cursor = 'pointer';
      blockEl.style.borderRadius = '6px';
      blockEl.style.backgroundColor = bgColor;
      blockEl.style.color = '#fff';
      blockEl.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      blockEl.style.borderLeft = '4px solid rgba(255,255,255,0.3)';

      blockEl.innerHTML = `
        <div style="font-weight: 600; font-size: 0.85rem; line-height: 1.2; margin-bottom: 2px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${block.label}</div>
        ${height >= 30 ? `
        <div style="font-size: 0.75rem; opacity: 0.9;">
          ${String(block.startHour).padStart(2, '0')}:${String(block.startMinute).padStart(2, '0')} - 
          ${String(block.endHour).padStart(2, '0')}:${String(block.endMinute).padStart(2, '0')}
        </div>
        ` : ''}
      `;

      blockEl.addEventListener('click', () => openDialog(block));
      containerEl.appendChild(blockEl);
    });
  };

  const updateCurrentTime = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const indicator = utils.$('#current-time-indicator', container);
    const label = utils.$('#current-time-label', container);
    if (!indicator || !label) return;

    if (h >= startHour && h <= endHour) {
      indicator.style.display = 'block';
      const topPos = ((h - startHour) * 60 + m) / 60 * hourHeight;
      indicator.style.top = `${topPos}px`;
      label.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } else {
      indicator.style.display = 'none';
    }
  };

  const dialog = utils.$('#block-dialog', container);
  const form = utils.$('#block-form', container);
  const btnCancel = utils.$('#btn-cancel', container);
  const btnDelete = utils.$('#btn-delete', container);
  const titleText = utils.$('#dialog-title span', container);
  
  const openDialog = (block = null) => {
    if (block) {
      titleText.textContent = 'Edytuj blok';
      utils.$('#block-id', container).value = block.id;
      utils.$('#block-label', container).value = block.label;
      utils.$('#block-start', container).value = `${String(block.startHour).padStart(2, '0')}:${String(block.startMinute).padStart(2, '0')}`;
      utils.$('#block-end', container).value = `${String(block.endHour).padStart(2, '0')}:${String(block.endMinute).padStart(2, '0')}`;
      utils.$('#block-category', container).value = block.category;
      btnDelete.style.display = 'block';
    } else {
      titleText.textContent = 'Dodaj blok';
      form.reset();
      utils.$('#block-id', container).value = '';
      
      const now = new Date();
      let h = now.getHours();
      let m = Math.ceil(now.getMinutes() / 15) * 15;
      if (m === 60) {
          m = 0;
          h += 1;
      }
      h = utils.clamp(h, startHour, endHour);
      let endH = utils.clamp(h + 1, startHour, endHour);
      
      utils.$('#block-start', container).value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      utils.$('#block-end', container).value = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      
      btnDelete.style.display = 'none';
    }
    dialog.style.display = 'flex';
  };

  const closeDialog = () => {
    dialog.style.display = 'none';
  };

  utils.$('#add-block-btn', container).addEventListener('click', () => openDialog());
  btnCancel.addEventListener('click', closeDialog);
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = utils.$('#block-id', container).value;
    const label = utils.$('#block-label', container).value;
    const category = utils.$('#block-category', container).value;
    const startTime = utils.$('#block-start', container).value.split(':');
    const endTime = utils.$('#block-end', container).value.split(':');

    const startHourNum = parseInt(startTime[0], 10);
    const startMinNum = parseInt(startTime[1], 10);
    const endHourNum = parseInt(endTime[0], 10);
    const endMinNum = parseInt(endTime[1], 10);
    
    // validation
    if (startHourNum * 60 + startMinNum >= endHourNum * 60 + endMinNum) {
        alert('Czas zakończenia musi być późniejszy niż czas rozpoczęcia.');
        return;
    }

    const data = {
      label,
      category,
      startHour: startHourNum,
      startMinute: startMinNum,
      endHour: endHourNum,
      endMinute: endMinNum,
      date: utils.todayISO()
    };

    if (id) {
      store.updateTimeBlock(id, data);
    } else {
      store.addTimeBlock(data);
    }

    closeDialog();
    renderBlocks();
  });

  btnDelete.addEventListener('click', () => {
    const id = utils.$('#block-id', container).value;
    if (id && confirm('Czy na pewno chcesz usunąć ten blok?')) {
      store.deleteTimeBlock(id);
      closeDialog();
      renderBlocks();
    }
  });

  renderBlocks();
  updateCurrentTime();
  updateInterval = setInterval(updateCurrentTime, 60000);

  if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
      lucide.createIcons({ root: container });
  } else if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons({ root: container });
  }
}
