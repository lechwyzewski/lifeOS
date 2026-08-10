import store from '../core/store.js';
import * as utils from '../core/utils.js';

export function render(container) {
    let currentTab = 'daily';

    function renderView() {
        const state = store.getState();
        const reviews = state.reviews || [];
        
        let streak = calculateStreak(reviews);
        
        container.innerHTML = `
            <div class="review-view" style="padding: 1rem;">
                <div class="review-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 class="section-title" style="margin: 0;">Review</h2>
                    <div class="streak-counter badge badge-warning" style="font-size: 1rem; padding: 0.5rem 1rem;">🔥 ${streak} dni z rzędu</div>
                </div>
                
                <div class="tabs" style="display: flex; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                    <button class="tab btn ${currentTab === 'daily' ? 'btn-primary' : 'btn-ghost'}" data-tab="daily">Daily Review</button>
                    <button class="tab btn ${currentTab === 'history' ? 'btn-primary' : 'btn-ghost'}" data-tab="history">Historia</button>
                </div>
                
                <div class="tab-content">
                    ${currentTab === 'daily' ? renderDailyTab() : renderHistoryTab(reviews)}
                </div>
            </div>
        `;
        
        attachListeners();
        
        if (window.lucide) {
            lucide.createIcons();
        }
    }
    
    function calculateStreak(reviews) {
        if (!reviews || reviews.length === 0) return 0;
        
        const sortedDates = [...new Set(reviews.map(r => r.date || (r.createdAt && r.createdAt.substring(0, 10))).filter(Boolean))].sort((a, b) => b.localeCompare(a));
        if (sortedDates.length === 0) return 0;
        
        const today = utils.todayISO();
        let streak = 0;
        let currentDate = new Date(today);
        
        let startIndex = 0;
        if (sortedDates[0] === today) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
            startIndex = 1;
        } else {
            let yesterday = new Date(currentDate);
            yesterday.setDate(yesterday.getDate() - 1);
            if (sortedDates[0] === yesterday.toISOString().split('T')[0]) {
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                return 0; 
            }
        }
        
        for (let i = startIndex; i < sortedDates.length; i++) {
            const expectedDate = currentDate.toISOString().split('T')[0];
            if (sortedDates[i] === expectedDate) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    function renderDailyTab() {
        let completedSuggestion = '';
        if (typeof store.getTodaysTasks === 'function') {
            const completedTasks = store.getTodaysTasks().filter(t => t.done);
            if (completedTasks.length > 0) {
                const taskList = completedTasks.map(t => `• ${t.title}`).join('\n');
                completedSuggestion = `
                    <div class="suggestion-text" style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                        <strong>Sugerowane z dzisiejszych zadań:</strong><br/>
                        ${taskList.replace(/\n/g, '<br>')}
                    </div>
                `;
            }
        }

        return `
            <form id="review-form" class="review-form">
                <div class="glass-card review-card" style="margin-bottom: 1rem;">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0;"><i data-lucide="trophy"></i> Co osiągnąłeś dziś?</h3>
                    ${completedSuggestion}
                    <textarea id="achieved" class="form-control" rows="3" required placeholder="Napisz o swoich sukcesach..."></textarea>
                </div>
                
                <div class="glass-card review-card" style="margin-bottom: 1rem;">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0;"><i data-lucide="trending-up"></i> Co możesz zrobić lepiej?</h3>
                    <textarea id="improve" class="form-control" rows="3" required placeholder="Czego się nauczyłeś?"></textarea>
                </div>
                
                <div class="glass-card review-card" style="margin-bottom: 1rem;">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0;"><i data-lucide="heart"></i> Za co jesteś wdzięczny?</h3>
                    <textarea id="grateful" class="form-control" rows="3" required placeholder="Drobne rzeczy mają znaczenie..."></textarea>
                </div>
                
                <div class="glass-card review-card" style="margin-bottom: 1.5rem;">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0;"><i data-lucide="target"></i> Najważniejsze zadanie na jutro</h3>
                    <input type="text" id="tomorrowFocus" class="form-control" required placeholder="Jeden najważniejszy cel..." />
                </div>
                
                <div id="review-success" class="badge badge-success" style="display: none; margin-bottom: 1rem; padding: 0.5rem;">Review zapisane pomyślnie!</div>
                <button type="submit" class="btn btn-primary" style="width: 100%; display: flex; justify-content: center;">Zapisz review</button>
            </form>
        `;
    }
    
    function renderHistoryTab(reviews) {
        if (!reviews || reviews.length === 0) {
            return `<div class="empty-state glass-card" style="text-align: center; padding: 2rem;">Brak zapisanych review. Zacznij od dzisiejszego podsumowania!</div>`;
        }
        
        const sorted = [...reviews].sort((a, b) => {
            const dateA = a.date || a.createdAt || '';
            const dateB = b.date || b.createdAt || '';
            return dateB.localeCompare(dateA);
        });
        
        let html = '<div class="review-history">';
        sorted.forEach(r => {
            let displayDate = 'Nieznana data';
            if (r.date) {
                displayDate = utils.formatDate(new Date(r.date));
            } else if (r.createdAt) {
                displayDate = utils.formatDate(new Date(r.createdAt));
            }
            
            html += `
                <div class="glass-card review-entry" style="margin-bottom: 1rem;">
                    <h4 style="margin-top: 0; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; color: var(--primary-color); display: flex; justify-content: space-between;">
                        <span>${displayDate}</span>
                        ${r.type === 'daily' ? '<span class="badge badge-info" style="font-size: 0.75rem;">Daily</span>' : ''}
                    </h4>
                    <div style="margin-bottom: 0.75rem;">
                        <strong style="color: var(--text-secondary); display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="trophy" style="width: 16px; height: 16px;"></i> Co osiągnąłeś dziś:</strong>
                        <div style="margin-top: 0.25rem;">${r.achieved || '-'}</div>
                    </div>
                    <div style="margin-bottom: 0.75rem;">
                        <strong style="color: var(--text-secondary); display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="trending-up" style="width: 16px; height: 16px;"></i> Co możesz zrobić lepiej:</strong>
                        <div style="margin-top: 0.25rem;">${r.improve || '-'}</div>
                    </div>
                    <div style="margin-bottom: 0.75rem;">
                        <strong style="color: var(--text-secondary); display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="heart" style="width: 16px; height: 16px;"></i> Za co jesteś wdzięczny:</strong>
                        <div style="margin-top: 0.25rem;">${r.grateful || '-'}</div>
                    </div>
                    <div>
                        <strong style="color: var(--text-secondary); display: flex; align-items: center; gap: 0.25rem;"><i data-lucide="target" style="width: 16px; height: 16px;"></i> Najważniejsze zadanie na jutro:</strong>
                        <div style="margin-top: 0.25rem;">${r.tomorrowFocus || '-'}</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        return html;
    }
    
    function attachListeners() {
        const tabs = container.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                currentTab = e.target.getAttribute('data-tab');
                renderView();
            });
        });
        
        const form = container.querySelector('#review-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const achieved = container.querySelector('#achieved').value;
                const improve = container.querySelector('#improve').value;
                const grateful = container.querySelector('#grateful').value;
                const tomorrowFocus = container.querySelector('#tomorrowFocus').value;
                
                const reviewData = {
                    type: 'daily',
                    achieved,
                    improve,
                    grateful,
                    tomorrowFocus,
                    date: utils.todayISO()
                };

                if (typeof store.addReview === 'function') {
                    store.addReview(reviewData);
                } else {
                    const state = store.getState();
                    const reviews = state.reviews || [];
                    store.setState('reviews', [...reviews, {
                        ...reviewData,
                        id: utils.generateId(),
                        createdAt: new Date().toISOString()
                    }]);
                }
                
                const successMsg = container.querySelector('#review-success');
                if (successMsg) {
                    successMsg.style.display = 'block';
                    setTimeout(() => {
                        successMsg.style.display = 'none';
                        form.reset();
                        currentTab = 'history';
                        renderView();
                    }, 1500);
                }
            });
        }
    }

    renderView();
}
