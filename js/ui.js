const UI = {

    button(label, className = "primary-button", action = "") {
        return `<button class="${className}" onclick="${action}">${label}</button>`;
    },

    sectionHeader(title, right = "") {
        return `<div class="section-header"><h2>${title}</h2>${right}</div>`;
    },

    identityCard(identity) {
        const safeIdentity = Helpers.escapeHtml(identity || "Not set");
        return `<div class="identity-card"><div class="identity-label">WHO ARE YOU BECOMING?</div><div class="identity-title">${safeIdentity}</div><div class="identity-quote">Every action today is another vote for your future self.</div></div>`;
    },

    actionRow(action) {
        const { id, title, subtitle, completed, is_counter, description, habit_type, target, unit } = action;
        const safeTitle = Helpers.escapeHtml(title || "");
        const safeSubtitle = Helpers.escapeHtml(subtitle || "");
        const safeDescription = Helpers.escapeHtml(description || "");
        const safeLessonTitle = Helpers.escapeHtml(action.lesson_title || "");
        const counterValue = Database.getCounterValue(id);

        let counterDisplay = "";
        if (is_counter) {
            const displayTarget = target ? ` / ${target} ${unit || ""}` : "";
            counterDisplay = `<div class="counter-display"><span class="counter-value">${counterValue}</span><span class="counter-target">${displayTarget}</span></div>`;
        }

        return `
        <div class="action-card ${completed ? "completed" : ""}">
            <div class="action-content">
                <h3>${safeTitle}</h3>
                ${safeSubtitle ? `<p class="action-subtitle">${safeSubtitle}</p>` : ""}
                ${safeDescription ? `<p class="action-description">${safeDescription}</p>` : ""}
                ${safeLessonTitle ? `<small class="habit-source">Created from: ${safeLessonTitle}</small>` : ""}
                ${counterDisplay}
            </div>
            <div class="action-controls">
                <button class="edit-button" onclick="App.openSheet(${id})" aria-label="Edit habit">✏️</button>
                ${is_counter ? `
                <div class="counter-box">
                    <button onclick="App.changeCounter(${id}, -1)" aria-label="Decrement">−</button>
                    <input id="counter-${id}" type="number" value="${counterValue}" min="0" aria-label="Current count">
                    <button onclick="App.changeCounter(${id}, 1)" aria-label="Increment">+</button>
                    <button onclick="App.saveCounterFromInput(${id})">Save</button>
                </div>
                ` : `
                <button class="vote-button ${completed ? "completed" : ""}" onclick="App.toggleAction(${id})" aria-label="${completed ? "Mark incomplete" : "Mark complete"}">${completed ? "✓" : "○"}</button>
                `}
            </div>
        </div>
        `;
    },

    bottomNav(active = "today") {
        const items = [
            { id: "today", icon: "🏠", label: "Today" },
            { id: "learn", icon: "📚", label: "Learn" },
            { id: "journal", icon: "📖", label: "Diary" },
            { id: "identity", icon: "🌱", label: "Identity" },
            { id: "calendar", icon: "📅", label: "Calendar" }
        ];
        return `<nav class="bottom-nav" role="navigation" aria-label="Main navigation">${items.map(item => `<button class="nav-item ${item.id === active ? "active" : ""}" onclick="App.navigate('${item.id}')" aria-current="${item.id === active ? "page" : "false"}"><span class="nav-icon">${item.icon}</span><span class="nav-label">${item.label}</span></button>`).join("")}</nav>`;
    },

    progressRing(completed, total) {
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        return `<div class="progress-ring" role="progressbar" aria-valuenow="${completed}" aria-valuemin="0" aria-valuemax="${total}"><svg width="80" height="80"><circle class="progress-bg" cx="40" cy="40" r="32"></circle><circle class="progress-fill" cx="40" cy="40" r="32" stroke-dasharray="${2 * Math.PI * 32}" stroke-dashoffset="${2 * Math.PI * 32 * (1 - pct / 100)}" style="transition: stroke-dashoffset 0.5s ease;"></circle></svg><div class="progress-text"><span class="progress-pct">${pct}%</span><span class="progress-fraction">${completed}/${total}</span></div></div>`;
    },

    addActionSheet() {
        return `
        <div id="actionSheet" class="bottom-sheet hidden" role="dialog" aria-labelledby="sheetTitle" aria-modal="true">
            <div class="sheet-handle"></div>
            <h2 id="sheetTitle">New Habit</h2>
            <form id="habitForm" onsubmit="App.saveHabit(event)">
                <div class="form-step" data-step="1">
                    <h3>What's the habit?</h3>
                    <div class="form-group">
                        <label for="habitTitle">Habit name</label>
                        <input type="text" id="habitTitle" placeholder="e.g., Walk after dinner" required maxlength="80">
                    </div>
                    <div class="form-group">
                        <label for="habitWhy">Why does this matter?</label>
                        <textarea id="habitWhy" placeholder="Connect to your identity..." rows="2"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Habit type</label>
                        <div class="habit-type-selector">
                            <button type="button" class="habit-type-btn active" data-type="binary" onclick="UI.selectHabitType('binary')">✓ Binary</button>
                            <button type="button" class="habit-type-btn" data-type="count" onclick="UI.selectHabitType('count')">🔢 Count</button>
                            <button type="button" class="habit-type-btn" data-type="duration" onclick="UI.selectHabitType('duration')">⏱ Duration</button>
                        </div>
                        <input type="hidden" id="habitType" name="habitType" value="binary">
                    </div>
                    <div id="counterFields" class="hidden">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="habitTarget">Target</label>
                                <input type="number" id="habitTarget" name="target" min="1" value="1">
                            </div>
                            <div class="form-group">
                                <label for="habitUnit">Unit</label>
                                <input type="text" id="habitUnit" name="unit" placeholder="e.g., glasses, pages, minutes" value="times">
                            </div>
                        </div>
                    </div>
                    <div class="sheet-actions">
                        <button type="button" class="secondary-button" onclick="UI.closeSheet()">Cancel</button>
                        <button type="button" class="primary-button" onclick="UI.nextHabitStep(2)">Next</button>
                    </div>
                </div>

                <div class="form-step hidden" data-step="2">
                    <h3>When & Where</h3>
                    <div class="form-group">
                        <label for="habitTime">Preferred time</label>
                        <input type="time" id="habitTime" name="time">
                    </div>
                    <div class="form-group">
                        <label for="habitDays">Days</label>
                        <div class="day-selector">${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => `<label class="day-btn"><input type="checkbox" name="days" value="${i}" checked> ${d}</label>`).join("")}</div>
                    </div>
                    <div class="form-group">
                        <label for="habitLocation">Location (optional)</label>
                        <input type="text" id="habitLocation" name="location" placeholder="e.g., Living room, Park, Kitchen">
                    </div>
                    <div class="form-group">
                        <label for="habitCue">Cue / Trigger</label>
                        <input type="text" id="habitCue" name="cue" placeholder="After I... (habit stacking)\ "
                    </div>
                    <div class="sheet-actions">
                        <button type="button" class="secondary-button" onclick="UI.prevHabitStep(1)">Back</button>
                        <button type="button" class="primary-button" onclick="UI.nextHabitStep(3)">Next</button>
                    </div>
                </div>

                <div class="form-step hidden" data-step="3">
                    <h3>Make it Easy</h3>
                    <div class="form-group">
                        <label for="habitMinimum">Minimum version (2-min rule)</label>
                        <input type="text" id="habitMinimum" name="minimum" placeholder="e.g., Put on walking shoes">
                    </div>
                    <div class="form-group">
                        <label for="habitNormal">Normal version</label>
                        <input type="text" id="habitNormal" name="normal" placeholder="e.g., Walk 10 minutes">
                    </div>
                    <div class="form-group">
                        <label for="habitStretch">Stretch version (optional)</label>
                        <input type="text" id="habitStretch" name="stretch" placeholder="e.g., Walk 30 minutes">
                    </div>
                    <div class="form-group">
                        <label for="habitEnvironment">Environment prep</label>
                        <textarea id="habitEnvironment" name="environment" placeholder="e.g., Lay out shoes by door night before" rows="2"></textarea>
                    </div>
                    <div class="sheet-actions">
                        <button type="button" class="secondary-button" onclick="UI.prevHabitStep(2)">Back</button>
                        <button type="submit" class="primary-button">Create Habit</button>
                    </div>
                </div>
            </form>
        </div>
        `;
    },

    selectHabitType(type) {
        document.querySelectorAll('.habit-type-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.habit-type-btn[data-type="${type}"]`)?.classList.add('active');
        document.getElementById('habitType').value = type;
        const counterFields = document.getElementById('counterFields');
        if (counterFields) {
            counterFields.classList.toggle('hidden', type === 'binary');
        }
    },

    nextHabitStep(step) {
        document.querySelectorAll('.form-step').forEach(s => s.classList.add('hidden'));
        document.querySelector(`.form-step[data-step="${step}"]`)?.classList.remove('hidden');
    },

    prevHabitStep(step) {
        this.nextHabitStep(step);
    },

    closeSheet() {
        const sheet = document.getElementById('actionSheet');
        if (sheet) sheet.classList.add('hidden');
        State.ui.activeSheet = null;
    },

    openSheet(actionId = null) {
        const sheet = document.getElementById('actionSheet');
        if (sheet) {
            sheet.classList.remove('hidden');
            State.ui.activeSheet = 'habit';
            // Reset form
            document.getElementById('habitForm')?.reset();
            document.querySelectorAll('.form-step').forEach((s, i) => s.classList.toggle('hidden', i !== 0));
            UI.selectHabitType('binary');
            if (actionId) {
                // Edit mode - populate form
                const action = State.actions.find(a => a.id === actionId);
                if (action) {
                    State.editingActionId = actionId;
                    document.getElementById('sheetTitle').textContent = 'Edit Habit';
                    document.getElementById('habitTitle').value = action.title || '';
                    document.getElementById('habitWhy').value = action.subtitle || '';
                    UI.selectHabitType(action.habit_type || (action.is_counter ? 'count' : 'binary'));
                    if (action.target) document.getElementById('habitTarget').value = action.target;
                    if (action.unit) document.getElementById('habitUnit').value = action.unit;
                    if (action.time) document.getElementById('habitTime').value = action.time;
                    if (action.days) {
                        document.querySelectorAll('[name="days"]').forEach(cb => cb.checked = action.days.includes(parseInt(cb.value)));
                    }
                    if (action.location) document.getElementById('habitLocation').value = action.location;
                    if (action.cue) document.getElementById('habitCue').value = action.cue;
                    if (action.minimum) document.getElementById('habitMinimum').value = action.minimum;
                    if (action.normal) document.getElementById('habitNormal').value = action.normal;
                    if (action.stretch) document.getElementById('habitStretch').value = action.stretch;
                    if (action.environment) document.getElementById('habitEnvironment').value = action.environment;
                }
            } else {
                State.editingActionId = null;
                document.getElementById('sheetTitle').textContent = 'New Habit';
            }
        }
    },

    identityDashboard() {
        const identity = State.identities.find(i => i.id === State.currentIdentityId);
        if (!identity) return '<p>No identity selected</p>';

        const habits = State.actions.filter(a => a.identity_id === State.currentIdentityId);
        const totalHabits = habits.length;
        const activeHabits = habits.filter(a => !a.paused && !a.archived).length;
        const today = Helpers.todayISO();
        const completedToday = State.history.filter(h => h.identity_id === State.currentIdentityId && h.date === today).length;

        // Calculate evidence
        const evidence = habits.map(habit => {
            const history = State.history.filter(h => h.action_id === habit.id);
            const completions = history.length;
            const last7 = history.filter(h => {
                const d = Helpers.parseISODate(h.date);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return d >= weekAgo;
            }).length;
            const streak = this.calculateStreak(habit.id);
            return { habit, completions, last7, streak };
        });

        // Lessons applied
        const lessonsApplied = State.lessonProgress.filter(p => p.identity_id === State.currentIdentityId).length;

        return `
        <div class="identity-dashboard">
            <div class="identity-header">
                <h2>${Helpers.escapeHtml(identity.name)}</h2>
                <p class="identity-meta">Created ${Helpers.formatDate(new Date(identity.created_at), { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>

            <div class="identity-stats">
                <div class="stat-mini">
                    <strong>${activeHabits}</strong><span>Active Habits</span>
                </div>
                <div class="stat-mini">
                    <strong>${completedToday}</strong><span>Today's Votes</span>
                </div>
                <div class="stat-mini">
                    <strong>${evidence.reduce((sum, e) => sum + e.completions, 0)}</strong><span>Total Completions</span>
                </div>
                <div class="stat-mini">
                    <strong>${lessonsApplied}</strong><span>Lessons Applied</span>
                </div>
            </div>

            <div class="identity-sections">
                <div class="identity-section">
                    <h3>Habits Supporting This Identity</h3>
                    ${habits.length === 0 ? '<p class="empty-state">No habits yet. Create your first habit to start building evidence.</p>' : ''}
                    ${habits.map(habit => {
                        const e = evidence.find(ev => ev.habit.id === habit.id);
                        const health = this.calculateHabitHealth(habit, e);
                        return `<div class="identity-habit-row">
                            <div class="habit-info">
                                <strong>${Helpers.escapeHtml(habit.title)}</strong>
                                <span class="habit-health ${health.class}">${health.label}</span>
                            </div>
                            <div class="habit-evidence">
                                <span>${e?.completions || 0} completions</span>
                                <span>${e?.streak || 0} day streak</span>
                            </div>
                        </div>`;
                    }).join('')}
                </div>

                <div class="identity-section">
                    <h3>Recent Evidence</h3>
                    ${this.recentEvidence()}
                </div>

                <div class="identity-section">
                    <h3>Lessons Applied</h3>
                    ${this.appliedLessons()}
                </div>
            </div>

            <button class="primary-button" onclick="App.openSheet()" style="margin-top: 16px; width: 100%;">+ Add Habit to This Identity</button>
        </div>
        `;
    },

    calculateStreak(actionId) {
        const history = State.history.filter(h => h.action_id === actionId).sort((a, b) => b.date.localeCompare(a.date));
        if (history.length === 0) return 0;
        let streak = 0;
        let currentDate = Helpers.todayISO();
        for (const record of history) {
            if (record.date === currentDate || (streak === 0 && Helpers.isPast(record.date) && Helpers.isToday(Helpers.formatDate(new Date(record.date), {})))) {
                streak++;
                const d = Helpers.parseISODate(currentDate);
                d.setDate(d.getDate() - 1);
                currentDate = Helpers.formatDate(d, { month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
            } else {
                break;
            }
        }
        return streak;
    },

    calculateHabitHealth(habit, evidence) {
        if (!evidence || evidence.completions === 0) return { class: 'new', label: 'New' };
        const daysSinceStart = Math.max(1, Math.floor((new Date() - Helpers.parseISODate(habit.created_at || Helpers.todayISO())) / 86400000));
        const expected = habit.frequency || 1; // per week
        const completionRate = evidence.completions / Math.max(1, daysSinceStart / 7 * expected);
        const recentRate = evidence.last7 / Math.max(1, expected);

        if (daysSinceStart < 14) return { class: 'building', label: 'Building' };
        if (recentRate >= 0.8 && completionRate >= 0.7) return { class: 'stable', label: 'Stable' };
        if (recentRate >= 0.5) return { class: 'struggling', label: 'Struggling' };
        return { class: 'needs-adjustment', label: 'Needs Adjustment' };
    },

    recentEvidence() {
        const today = Helpers.todayISO();
        const recent = State.history
            .filter(h => h.identity_id === State.currentIdentityId && h.date <= today)
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 10);
        if (recent.length === 0) return '<p class="empty-state">No completions yet. Your first action creates the first vote.</p>';
        return recent.map(r => {
            const action = State.actions.find(a => a.id === r.action_id);
            return `<div class="evidence-row">
                <span class="evidence-date">${Helpers.formatDate(Helpers.parseISODate(r.date), { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <span class="evidence-habit">${Helpers.escapeHtml(action?.title || 'Unknown')}</span>
                ${r.value ? `<span class="evidence-value">${r.value}</span>` : ''}
            </div>`;
        }).join('');
    },

    appliedLessons() {
        const applied = State.lessonProgress
            .filter(p => p.identity_id === State.currentIdentityId)
            .map(p => Lessons.find(l => l.id === p.lesson_id))
            .filter(Boolean);
        if (applied.length === 0) return '<p class="empty-state">No lessons applied yet. Complete a lesson and create a habit from it.</p>';
        return applied.map(l => `<div class="lesson-applied"><strong>${l.title}</strong><span>Module: ${l.module}</span></div>`).join('');
    },

    reflectionHistory() {
        const reflections = State.reflections
            .filter(r => r.identity_id === State.currentIdentityId)
            .sort((a, b) => b.reflection_date.localeCompare(a.reflection_date))
            .slice(0, 7);
        return reflections.map(r => `<div class="reflection-history-item">
            <div class="reflection-date">${Helpers.formatDate(Helpers.parseISODate(r.reflection_date), { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            <div class="reflection-win">${Helpers.escapeHtml(r.win || '')}</div>
        </div>`).join('');
    },

    stats() {
        const today = Helpers.todayISO();
        const habits = State.actions.filter(a => a.identity_id === State.currentIdentityId);
        const totalHabits = habits.length;
        const completedToday = State.history.filter(h => h.identity_id === State.currentIdentityId && h.date === today).length;
        const totalCompletions = State.history.filter(h => h.identity_id === State.currentIdentityId).length;
        const currentStreak = this.calculateOverallStreak();
        const bestStreak = this.calculateBestStreak();

        return `<div class="stats-grid">
            <div class="stat-card"><h3>Today</h3><strong>${completedToday}/${totalHabits}</strong></div>
            <div class="stat-card"><h3>Current Streak</h3><strong>${currentStreak}</strong><span>days</span></div>
            <div class="stat-card"><h3>Best Streak</h3><strong>${bestStreak}</strong><span>days</span></div>
            <div class="stat-card"><h3>Total Votes</h3><strong>${totalCompletions}</strong></div>
        </div>`;
    },

    calculateOverallStreak() {
        const dates = [...new Set(State.history.filter(h => h.identity_id === State.currentIdentityId).map(h => h.date))].sort();
        if (dates.length === 0) return 0;
        let streak = 0;
        let checkDate = Helpers.todayISO();
        for (const date of dates.reverse()) {
            if (date === checkDate) {
                streak++;
                const d = Helpers.parseISODate(checkDate);
                d.setDate(d.getDate() - 1);
                checkDate = Helpers.formatDate(d, { month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
            } else if (date < checkDate) {
                break;
            }
        }
        return streak;
    },

    calculateBestStreak() {
        const dates = [...new Set(State.history.filter(h => h.identity_id === State.currentIdentityId).map(h => h.date))].sort();
        if (dates.length === 0) return 0;
        let best = 1;
        let current = 1;
        for (let i = 1; i < dates.length; i++) {
            const prev = Helpers.parseISODate(dates[i-1]);
            const curr = Helpers.parseISODate(dates[i]);
            const diff = Math.round((curr - prev) / 86400000);
            if (diff === 1) {
                current++;
                best = Math.max(best, current);
            } else {
                current = 1;
            }
        }
        return best;
    },

    calendar() {
        const now = new Date();
        const tz = State.userTimezone || 'UTC';
        const year = parseInt(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric' }).format(now));
        const month = parseInt(new Intl.DateTimeFormat('en-CA', { timeZone: tz, month: '2-digit' }).format(now));
        return UI.renderCalendar(year, month);
    },

    renderCalendar(year, month) {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const startDay = firstDay.getDay(); // 0 = Sunday
        const daysInMonth = lastDay.getDate();
        const today = Helpers.todayISO();

        const completionsByDate = {};
        State.history.filter(h => h.identity_id === State.currentIdentityId).forEach(h => {
            if (!completionsByDate[h.date]) completionsByDate[h.date] = 0;
            completionsByDate[h.date]++;
        });

        let html = `<div class="calendar-header"><button onclick="UI.renderCalendar(${year}, ${month - 1})" aria-label="Previous month">‹</button><h3>${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(firstDay)}</h3><button onclick="UI.renderCalendar(${year}, ${month + 1})" aria-label="Next month">›</button></div><table class="calendar" role="grid" aria-label="${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(firstDay)}"><thead><tr>${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<th scope="col">${d}</th>`).join('')}</tr></thead><tbody><tr>`;

        // Empty cells before first day
        for (let i = 0; i < startDay; i++) html += '<td class="empty"></td>';

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const count = completionsByDate[dateStr] || 0;
            const isToday = dateStr === today;
            const isPast = dateStr < today;
            html += `<td class="${isToday ? "today" : ""} ${isPast ? "past" : ""} ${count > 0 ? "has-completion" : ""}" data-date="${dateStr}" onclick="App.openDayModal('${dateStr}')" role="gridcell" aria-label="${new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(year, month-1, day))}${count > 0 ? `, ${count} completions` : ''}"><span class="day-number">${day}</span>${count > 0 ? `<span class="completion-count">${count}</span>` : ''}</td>`;
            if ((startDay + day) % 7 === 0 && day !== daysInMonth) html += '</tr><tr>';
        }

        html += '</tr></tbody></table>';
        return html;
    },

    historyTimeline() {
        const history = State.history.filter(h => h.identity_id === State.currentIdentityId).sort((a, b) => b.date.localeCompare(a.date));
        if (history.length === 0) return '<p class="empty-state">No history yet. Complete your first habit to start building your timeline.</p>';

        const grouped = {};
        history.forEach(h => {
            if (!grouped[h.date]) grouped[h.date] = [];
            grouped[h.date].push(h);
        });

        return Object.entries(grouped).slice(0, 30).map(([date, records]) => {
            const actions = records.map(r => {
                const action = State.actions.find(a => a.id === r.action_id);
                return action ? (action.is_counter ? `🔢 ${Helpers.escapeHtml(action.title)}: ${r.value ?? 0}` : `✓ ${Helpers.escapeHtml(action.title)}`) : null;
            }).filter(Boolean);
            const reflection = State.reflections.find(r => r.reflection_date === date && r.identity_id === State.currentIdentityId);
            return `<div class="timeline-day" onclick="App.openDayModal('${date}')">
                <div class="timeline-date">${Helpers.formatDate(Helpers.parseISODate(date), { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                <div class="timeline-actions">${actions.map(a => `<div class="timeline-action">${a}</div>`).join('')}</div>
                ${reflection ? `<div class="timeline-reflection">💭 ${Helpers.escapeHtml(r.win || '').substring(0, 60)}</div>` : ''}
            </div>`;
        }).join('');
    },

    dayModal() {
        return `<div id="dayModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="dayModalTitle"><div class="modal-card"><button class="modal-close" onclick="App.closeDayModal()" aria-label="Close">×</button><h2 id="dayModalTitle"></h2><div id="dayModalContent"></div></div></div>`;
    },

    onboarding() {
        return `
        <div class="container onboarding">
            <div class="hero">
                <h1 class="headline">Welcome to Identity OS</h1>
                <p class="daily-quote">Who do you want to become?</p>
            </div>

            <div class="identity-list" id="identityList">
                ${State.identities.map(id => `
                <div class="identity-option" onclick="App.selectIdentity('${id.id}')">
                    <div>${Helpers.escapeHtml(id.name)}</div>
                    <button class="secondary-button" onclick="event.stopPropagation(); App.editIdentity('${id.id}')">Edit</button>
                </div>
                `).join('')}
                <div class="identity-option add" onclick="App.createIdentity()">
                    <span>+ Create Identity</span>
                </div>
            </div>
        </div>
        `;
    },

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    showUpdateBanner(worker) {
        const banner = document.createElement('div');
        banner.className = 'update-banner';
        banner.innerHTML = `<span>Update available</span><button onclick="worker.postMessage({type:'SKIP_WAITING'}); this.parentElement.remove()">Refresh</button>`;
        document.body.appendChild(banner);
    }

};

window.UI = UI;
