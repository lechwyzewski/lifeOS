import store from '../core/store.js';
import utils from '../core/utils.js';

let currentStep = 1;
const TOTAL_STEPS = 5;
let rootContainer = null;

export function render(container) {
  rootContainer = container;
  
  // Initialize state if not present
  const state = store.getState();
  if (!state.ikigai) {
    store.setState('ikigai', {
      love: [],
      good_at: [],
      paid_for: [],
      world_needs: [],
      reflection: ''
    });
  }

  renderCurrentStep();
}

function renderCurrentStep() {
  if (!rootContainer) return;
  
  const state = store.getState();
  const ikigaiData = state.ikigai;

  const html = `
    <div class="ikigai-container">
      <div class="section-title">
        <h2>Odkryj swoje Ikigai</h2>
      </div>
      
      <div class="ikigai-steps" style="display: flex; gap: 10px; margin-bottom: 20px;">
        ${Array.from({ length: TOTAL_STEPS }).map((_, i) => `
          <div class="step-indicator ${currentStep === i + 1 ? 'active' : ''}" style="flex: 1; height: 4px; background: ${currentStep >= i + 1 ? 'var(--primary, #3b82f6)' : 'var(--border, #333)'}; border-radius: 2px; transition: background 0.3s ease;"></div>
        `).join('')}
      </div>

      <div class="ikigai-content glass-card" style="padding: 24px; min-height: 400px; display: flex; flex-direction: column;">
        ${getStepContent(currentStep, ikigaiData)}
      </div>

      <div class="ikigai-nav" style="display: flex; justify-content: space-between; margin-top: 20px;">
        <button class="btn btn-ghost" id="btn-prev" ${currentStep === 1 ? 'style="visibility: hidden;"' : ''}>
          <i data-lucide="chevron-left"></i> Wstecz
        </button>
        <button class="btn btn-primary" id="btn-next" ${currentStep === TOTAL_STEPS ? 'style="display:none;"' : ''}>
          Dalej <i data-lucide="chevron-right"></i>
        </button>
      </div>
    </div>
  `;

  rootContainer.innerHTML = html;
  
  // Create icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Attach event listeners
  attachEventListeners();
}

function getStepContent(step, data) {
  switch (step) {
    case 1:
      return renderTagInputStep('Co kochasz?', 'love', data.love, 'Wpisz to co sprawia Ci radość i naciśnij Enter...');
    case 2:
      return renderTagInputStep('W czym jesteś dobry?', 'good_at', data.good_at, 'Wpisz swoje talenty, umiejętności i naciśnij Enter...');
    case 3:
      return renderTagInputStep('Za co mogą Ci płacić?', 'paid_for', data.paid_for, 'Wpisz usługi, produkty, kompetencje i naciśnij Enter...');
    case 4:
      return renderTagInputStep('Czego świat potrzebuje?', 'world_needs', data.world_needs, 'Wpisz problemy do rozwiązania, wartości i naciśnij Enter...');
    case 5:
      return renderIkigaiDiagram(data);
    default:
      return '';
  }
}

function renderTagInputStep(title, key, tags, placeholder) {
  return `
    <h3 style="margin-top: 0;">${title}</h3>
    <div class="form-group" style="margin-top: 20px; flex: 1;">
      <div class="tag-input-container form-control" style="display: flex; flex-wrap: wrap; gap: 8px; min-height: 120px; align-items: flex-start; height: auto;">
        ${(tags || []).map((tag, index) => `
          <span class="tag badge badge-info" style="display: flex; align-items: center; gap: 6px; font-size: 0.9rem; padding: 6px 12px; border-radius: 16px;">
            ${tag}
            <i data-lucide="x" class="remove-tag" data-key="${key}" data-index="${index}" style="cursor: pointer; width: 14px; height: 14px;"></i>
          </span>
        `).join('')}
        <input type="text" id="ikigai-tag-input" data-key="${key}" placeholder="${placeholder}" style="flex: 1; min-width: 200px; border: none; background: transparent; outline: none; color: inherit; padding: 4px; font-size: 1rem;" />
      </div>
    </div>
  `;
}

function renderIkigaiDiagram(data) {
  return `
    <h3 style="text-align: center; margin-top: 0;">Twoje Ikigai</h3>
    <div style="display: flex; justify-content: center; align-items: center; padding: 10px 0;">
      <svg width="340" height="340" viewBox="0 0 400 400" style="max-width: 100%; height: auto; font-family: system-ui, sans-serif; font-weight: bold; text-anchor: middle;">
        <!-- Circles -->
        
        <!-- Love -->
        <circle cx="200" cy="130" r="110" fill="rgba(236, 72, 153, 0.2)" stroke="rgba(236, 72, 153, 0.6)" stroke-width="2"/>
        <text x="200" y="50" fill="rgba(236, 72, 153, 1)" font-size="14">Co kochasz</text>
        
        <!-- Good At -->
        <circle cx="130" cy="200" r="110" fill="rgba(59, 130, 246, 0.2)" stroke="rgba(59, 130, 246, 0.6)" stroke-width="2"/>
        <text x="45" y="200" fill="rgba(59, 130, 246, 1)" font-size="14" transform="rotate(-90 45 200)">W czym jesteś dobry</text>

        <!-- World Needs -->
        <circle cx="270" cy="200" r="110" fill="rgba(245, 158, 11, 0.2)" stroke="rgba(245, 158, 11, 0.6)" stroke-width="2"/>
        <text x="355" y="200" fill="rgba(245, 158, 11, 1)" font-size="14" transform="rotate(90 355 200)">Czego świat potrzebuje</text>

        <!-- Paid For -->
        <circle cx="200" cy="270" r="110" fill="rgba(34, 197, 94, 0.2)" stroke="rgba(34, 197, 94, 0.6)" stroke-width="2"/>
        <text x="200" y="365" fill="rgba(34, 197, 94, 1)" font-size="14">Za co mogą Ci płacić</text>

        <!-- Intersections Texts -->
        <!-- Love + Good At = Pasja (Top Left) -->
        <text x="135" y="125" fill="#a8a29e" font-size="11">Pasja</text>

        <!-- Love + World Needs = Misja (Top Right) -->
        <text x="265" y="125" fill="#a8a29e" font-size="11">Misja</text>

        <!-- Good At + Paid For = Profesja (Bottom Left) -->
        <text x="135" y="280" fill="#a8a29e" font-size="11">Profesja</text>

        <!-- Paid For + World Needs = Powołanie (Bottom Right) -->
        <text x="265" y="280" fill="#a8a29e" font-size="11">Powołanie</text>

        <!-- Center = IKIGAI -->
        <text x="200" y="205" fill="#ffffff" font-size="16" font-weight="900" style="text-shadow: 0 1px 4px rgba(0,0,0,0.8);">IKIGAI</text>
      </svg>
    </div>
    
    <div class="form-group" style="margin-top: 10px;">
      <label>Twoja refleksja</label>
      <textarea id="ikigai-reflection" class="form-control" rows="3" placeholder="Twoje przemyślenia...">${data.reflection || ''}</textarea>
    </div>
  `;
}

function attachEventListeners() {
  const prevBtn = rootContainer.querySelector('#btn-prev');
  const nextBtn = rootContainer.querySelector('#btn-next');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        renderCurrentStep();
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentStep < TOTAL_STEPS) {
        currentStep++;
        renderCurrentStep();
      }
    });
  }

  const tagInput = rootContainer.querySelector('#ikigai-tag-input');
  if (tagInput) {
    // Prevent form submission on enter if inside a form, though we don't have one here.
    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = tagInput.value.trim();
        if (value !== '') {
          const key = tagInput.getAttribute('data-key');
          
          const state = store.getState();
          const currentList = state.ikigai[key] || [];
          
          if (!currentList.includes(value)) {
            store.setState(`ikigai.${key}`, [...currentList, value]);
            renderCurrentStep();
            
            // Focus input again after render
            const newInput = rootContainer.querySelector('#ikigai-tag-input');
            if (newInput) {
              newInput.focus();
            }
          } else {
            tagInput.value = '';
          }
        }
      }
    });
  }

  const removeTags = rootContainer.querySelectorAll('.remove-tag');
  removeTags.forEach(icon => {
    icon.addEventListener('click', (e) => {
      const target = e.currentTarget;
      const key = target.getAttribute('data-key');
      const index = parseInt(target.getAttribute('data-index'), 10);
      
      const state = store.getState();
      const currentList = [...(state.ikigai[key] || [])];
      currentList.splice(index, 1);
      
      store.setState(`ikigai.${key}`, currentList);
      renderCurrentStep();
    });
  });

  const reflectionTextarea = rootContainer.querySelector('#ikigai-reflection');
  if (reflectionTextarea) {
    reflectionTextarea.addEventListener('input', utils.debounce((e) => {
      store.setState('ikigai.reflection', e.target.value);
    }, 300));
  }
}
