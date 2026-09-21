const UI = {
    button(label, className = "btn btn-primary", action = "") { return `<button class="${className}" onclick="${action}">${label}</button>`; },
    sectionHeader(title, right = "") { return `<div class="section-header"><h2>${title}</h2>${right}</div>`; },
    identityCard(identity) { const safeIdentity = Helpers.escapeHtml(identity || "Not set"); return `<div class="identity-card"><div class="identity-label">WHO ARE YOU BECOMING?</div><div class="identity-title">${safeIdentity}</div><div class="identity-quote">Every action today is another vote for your future self.</div></div>`; },

    actionRow(action) {
        const { id, title, subtitle, completed, is_counter, description, habit_type, target, unit, minimum, normal, stretch, cue, location } = action;
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
        let contextHtml = "";
        if (cue || minimum || normal || stretch) {
            contextHtml = `<div class="action-context">`;
            if (cue) contextHtml += `<small class="meta-cue">Cue: ${Helpers.escapeHtml(cue)}</small>`;
            if (minimum) contextHtml += `<small class="meta-min">Min: ${Helpers.escapeHtml(minimum)}</small>`;
            if (normal) contextHtml += `<small class="meta-norm">Normal: ${Helpers.escapeHtml(normal)}</small>`;
            if (stretch) contextHtml += `<small class="meta-str">Stretch: ${Helpers.escapeHtml(stretch)}</small>`;
            contextHtml += `</div>`;
        }
        return `<div class="action-card ${completed ? "completed" : ""}"><div class="action-content"><h3>${safeTitle}</h3>${safeSubtitle ? `<p class="action-subtitle">${safeSubtitle}</p>` : ""}${safeDescription ? `<p class="action-description">${safeDescription}</p>` : ""}${safeLessonTitle ? `<small class="habit-source">Created from: ${safeLessonTitle}</small>` : ""}${contextHtml}${counterDisplay}</div><div class="action-controls"><button class="btn-icon" onclick="App.openSheet(${id})" aria-label="Edit habit">Edit</button>${is_counter ? `<div class="counter-box"><button onclick="App.changeCounter(${id}, -1)" aria-label="Decrement">−</button><input id="counter-${id}" type="number" value="${counterValue}" min="0" aria-label="Current count"><button onclick="App.changeCounter(${id}, 1)" aria-label="Increment">+</button><button onclick="App.saveCounterFromInput(${id})">Save</button></div>` : `<button class="vote-btn ${completed ? "completed" : ""}" onclick="App.toggleAction(${id})" aria-label="${completed ? "Mark incomplete" : "Mark complete"}">${completed ? "Done" : "○"}</button>`}</div></div>`;
    },

    bottomNav(active = "today") {
        const items = [{ id: "today", icon: "🏠", label: "Today" },{ id: "learn", icon: "📚", label: "Learn" },{ id: "journal", icon: "📖", label: "Diary" },{ id: "identity", icon: "🌱", label: "Identity" },{ id: "calendar", icon: "📅", label: "Calendar" }];
        return `<nav class="bottom-nav" role="navigation" aria-label="Main navigation">${items.map(item => `<button class="nav-item ${item.id === active ? "active" : ""}" onclick="App.navigate('${item.id}')" aria-current="${item.id === active ? "page" : "false"}"><span class="nav-icon">${item.icon}</span><span class="nav-label">${item.label}</span></button>`).join("")}</nav>`;
    },

    todayPerformance(completed, total) {
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        const circumference = 2 * Math.PI * 36;
        const offset = circumference * (1 - pct / 100);
        const remaining = total - completed;
        return `<section class="today-performance" aria-label="Today's habit performance">
            <div class="today-performance-header">
                <div class="today-performance-title">
                    <span class="eyebrow">TODAY</span>
                    <h2>Habit performance</h2>
                </div>
            </div>
            <div class="today-performance-body">
                <div class="performance-ring">
                    <svg viewBox="0 0 100 100" class="performance-ring-svg">
                        <circle class="performance-track" cx="50" cy="50" r="36"></circle>
                        <circle class="performance-progress" cx="50" cy="50" r="36" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
                    </svg>
                    <div class="performance-ring-content">
                        <strong class="performance-percent">${pct}%</strong>
                        <span class="performance-label">complete</span>
                    </div>
                </div>
                <div class="performance-summary">
                    <div class="performance-stat">
                        <strong class="performance-count">${completed} of ${total} habits</strong>
                        <span class="performance-subtitle">completed today</span>
                    </div>
                    ${remaining > 0 ? `<div class="performance-stat">
                        <span class="performance-remaining">${remaining} remaining</span>
                        <span class="performance-subtitle">to go</span>
                    </div>` : ''}
                </div>
            </div>
        </section>`;
    },

    addActionSheet() {
        return `<div id="actionSheet" class="bottom-sheet hidden" role="dialog" aria-labelledby="sheetTitle" aria-modal="true"><div class="sheet-handle"></div><h2 id="sheetTitle">New Habit</h2><form id="habitForm" onsubmit="App.saveHabit(event)"><div class="form-step" data-step="1"><h3>What's the habit?</h3><div class="form-group"><label for="habitTitle">Habit name</label><input type="text" id="habitTitle" name="habitTitle" placeholder="e.g., Walk after dinner" required maxlength="80"></div><div class="form-group"><label for="habitWhy">Why does this matter?</label><textarea id="habitWhy" placeholder="Connect to your identity..." rows="2"></textarea></div><div class="form-group"><label>Habit type</label><div class="habit-type-grid"><button type="button" class="habit-type-btn active" data-type="binary" onclick="UI.selectHabitType('binary')">✓ Binary</button><button type="button" class="habit-type-btn" data-type="count" onclick="UI.selectHabitType('count')">🔢 Count</button><button type="button" class="habit-type-btn" data-type="duration" onclick="UI.selectHabitType('duration')">⏱ Duration</button><button type="button" class="habit-type-btn" data-type="quantity" onclick="UI.selectHabitType('quantity')">📦 Quantity</button></div><input type="hidden" id="habitType" name="habitType" value="binary"></div><div id="counterFields" class="hidden"><div class="form-row"><div class="form-group"><label for="habitTarget">Target</label><input type="number" id="habitTarget" name="target" min="1" value="1"></div><div class="form-group"><label for="habitUnit">Unit</label><input type="text" id="habitUnit" name="unit" placeholder="e.g., glasses, pages, minutes" value="times"></div></div></div><div class="sheet-actions"><button type="button" class="btn btn-secondary" onclick="UI.closeSheet()">Cancel</button><button type="button" class="btn btn-primary" onclick="UI.nextHabitStep(2)">Next</button></div></div><div class="form-step hidden" data-step="2"><h3>When & Where</h3><div class="form-group"><label for="habitTime">Preferred time</label><input type="time" id="habitTime" name="time"></div><div class="form-group"><label>Days</label><div class="day-selector">${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => `<label class="day-btn"><input type="checkbox" name="days" value="${i}" ${i < 6 ? 'checked' : ''}> ${d}</label>`).join("")}</div></div><div class="form-group"><label for="habitLocation">Location (optional)</label><input type="text" id="habitLocation" name="location" placeholder="e.g., Living room, Park, Kitchen"></div><div class="form-group"><label for="habitCue">Cue / Trigger</label><input type="text" id="habitCue" name="cue" placeholder="After I... (habit stacking)"></div><div class="sheet-actions"><button type="button" class="btn btn-secondary" onclick="UI.prevHabitStep(1)">Back</button><button type="button" class="btn btn-primary" onclick="UI.nextHabitStep(3)">Next</button></div></div><div class="form-step hidden" data-step="3"><h3>Make it Easy</h3><div class="form-group"><label for="habitMinimum">Minimum version (2-min rule)</label><input type="text" id="habitMinimum" name="minimum" placeholder="e.g., Put on walking shoes"></div><div class="form-group"><label for="habitNormal">Normal version</label><input type="text" id="habitNormal" name="normal" placeholder="e.g., Walk 10 minutes"></div><div class="form-group"><label for="habitStretch">Stretch version (optional)</label><input type="text" id="habitStretch" name="stretch" placeholder="e.g., Walk 30 minutes"></div><div class="form-group"><label for="habitEnvironment">Environment prep</label><textarea id="habitEnvironment" name="environment" placeholder="e.g., Lay out shoes by door night before" rows="2"></textarea></div><div class="sheet-actions"><button type="button" class="btn btn-secondary" onclick="UI.prevHabitStep(2)">Back</button><button type="submit" class="btn btn-primary">Create Habit</button></div></div></form></div>`;
    },

    selectHabitType(type) {
        document.querySelectorAll('.habit-type-btn').forEach(btn => btn.classList.remove('active'));
        const btn = document.querySelector(`.habit-type-btn[data-type="${type}"]`);
        if (btn) btn.classList.add('active');
        const hidden = document.getElementById('counterFields');
        if (hidden) hidden.classList.toggle('hidden', ['binary'].includes(type));
        const typeInput = document.getElementById('habitType');
        if (typeInput) typeInput.value = type;
    },

    nextHabitStep(step) { document.querySelectorAll('.form-step').forEach(s => s.classList.add('hidden')); const target = document.querySelector(`.form-step[data-step="${step}"]`); if (target) target.classList.remove('hidden'); },
    prevHabitStep(step) { this.nextHabitStep(step); },
    closeSheet() { const sheet = document.getElementById('actionSheet'); if (sheet) sheet.classList.add('hidden'); State.ui.activeSheet = null; },

    openSheet(actionId = null) {
        const sheet = document.getElementById('actionSheet');
        if (sheet) {
            sheet.classList.remove('hidden');
            State.ui.activeSheet = 'habit';
            document.getElementById('habitForm')?.reset();
            document.querySelectorAll('.form-step').forEach((s, i) => s.classList.toggle('hidden', i !== 0));
            UI.selectHabitType('binary');
            if (actionId) {
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
                    if (action.days) document.querySelectorAll('[name="days"]').forEach(cb => cb.checked = action.days.includes(parseInt(cb.value)));
                    if (action.location) document.getElementById('habitLocation').value = action.location;
                    if (action.cue) document.getElementById('habitCue').value = action.cue;
                    if (action.minimum) document.getElementById('habitMinimum').value = action.minimum;
                    if (action.normal) document.getElementById('habitNormal').value = action.normal;
                    if (action.stretch) document.getElementById('habitStretch').value = action.stretch;
                    if (action.environment) document.getElementById('habitEnvironment').value = action.environment;
                }
            } else { State.editingActionId = null; document.getElementById('sheetTitle').textContent = 'New Habit'; }
        }
    },

    /**
     * Today page with execution context.
     * Filters actions by schedule (days, paused, archived, start_date).
     * Shows min/normal/stretch and cue for each habit.
     */
    todayPage() {
        const today = Helpers.todayISO();
        const activeActions = State.actions.filter(a => a.identity_id === State.currentIdentityId && !a.archived && !a.paused && App.isHabitDueToday(a));
        const completedToday = State.history.filter(h => h.identity_id === State.currentIdentityId && h.date === today).length;
        const overdueActions = State.actions.filter(a => App.wasHabitMissedYesterday(a) && !a.archived);
        const recommendations = App.getRecommendations();

        let recoveryHtml = "";
        if (overdueActions.length > 0) {
            recoveryHtml = `<div class="recovery-section"><div class="section-header"><h2>Recovery</h2><p class="recovery-intro">You missed some habits yesterday. Start with the minimum:</p></div>${overdueActions.map(action => `<div class="recovery-card"><div class="recovery-card-header"><h3>${Helpers.escapeHtml(action.title)}</h3><span class="badge badge-outline">${Helpers.escapeHtml(action.minimum || 'minimum')}</span></div><button class="btn btn-primary" onclick="App.toggleAction(${action.id})">Do minimum</button></div>`).join("")}</div>`;
        }

        let intelHtml = "";
        if (recommendations.length > 0) {
            intelHtml = `<div class="intelligence-section"><div class="section-header"><h2>Suggestions</h2></div>${recommendations.slice(0, 3).map(r => `<div class="intel-card"><p>${Helpers.escapeHtml(r.message)}</p><small>${Helpers.escapeHtml(r.suggestedAction)}</small></div>`).join("")}</div>`;
        }

        return `<div class="container"><div class="today-hero"><div class="today-date">${Helpers.formatDate(Helpers.parseISODate(today), { weekday: 'long', month: 'long', day: 'numeric' })}</div>${UI.todayPerformance(completedToday, activeActions.length)}</div><div class="section-header"><h2>Today's Actions</h2><span class="action-count">${completedToday} of ${activeActions.length} done</span></div>${recoveryHtml}${activeActions.length === 0 ? '<div class="empty-state"><p>No actions scheduled for today.</p><p class="empty-hint">Add habits in the builder to get started.</p></div>' : ''}${activeActions.map(action => { const completed = State.history.some(h => h.action_id === action.id && h.identity_id === State.currentIdentityId && h.date === today); return UI.actionRow({ ...action, completed }); }).join("")}${intelHtml}${UI.button("+ New Action", "btn btn-primary", "App.openSheet()")}${UI.addActionSheet()}</div>${UI.bottomNav("today")}`;
    },

    identityDashboard() {
        const identity = State.identities.find(i => i.id === State.currentIdentityId);
        if (!identity) return '<p>No identity selected</p>';
        const habits = State.actions.filter(a => a.identity_id === State.currentIdentityId);
        const totalHabits = habits.length;
        const activeHabits = habits.filter(a => !a.paused && !a.archived).length;
        const today = Helpers.todayISO();
        const completedToday = State.history.filter(h => h.identity_id === State.currentIdentityId && h.date === today).length;
        const evidence = habits.map(habit => { const history = State.history.filter(h => h.action_id === habit.id); const completions = history.length; const last7 = history.filter(h => { const d = Helpers.parseISODate(h.date); const weekAgo = Helpers.addDays(today, -7); return d >= weekAgo; }).length; const streak = UI.calculateStreak(habit.id); return { habit, completions, last7, streak }; });
        const lessonsApplied = State.lessonProgress.filter(p => p.identity_id === State.currentIdentityId).length;
        return `<div class="identity-dashboard"><div class="identity-header"><h2>${Helpers.escapeHtml(identity.name)}</h2><p class="identity-meta">Created ${Helpers.formatDate(new Date(identity.created_at), { month: 'long', day: 'numeric', year: 'numeric' })}</p></div><div class="identity-stats"><div class="stat-mini"><strong>${activeHabits}</strong><span>Active Habits</span></div><div class="stat-mini"><strong>${completedToday}</strong><span>Today's Votes</span></div><div class="stat-mini"><strong>${evidence.reduce((sum, e) => sum + e.completions, 0)}</strong><span>Total Completions</span></div><div class="stat-mini"><strong>${lessonsApplied}</strong><span>Lessons Applied</span></div></div><div class="identity-sections"><div class="identity-section"><h3>Habits & Evidence</h3>${evidence.map(e => `<div class="evidence-row"><span class="evidence-habit">${Helpers.escapeHtml(e.habit.title)}</span><span class="evidence-streak">${e.streak} day streak</span><span class="evidence-count">${e.completions} total</span></div>`).join("")}</div><div class="identity-section"><h3>Identity Evidence</h3><p>Every completion adds a piece of evidence to who you are becoming.</p></div><div class="identity-section"><h3>Lessons Applied</h3>${UI.appliedLessons()}</div></div><button class="btn btn-primary" onclick="App.openSheet()" style="margin-top: 16px; width: 100%;">+ Add Habit to This Identity</button></div>`;
    },

    /**
     * Deterministic streak calculation using timezone-safe date arithmetic.
     */
    calculateStreak(actionId) {
        const history = State.history.filter(h => h.action_id === actionId).sort((a, b) => b.date.localeCompare(a.date));
        if (history.length === 0) return 0;
        let streak = 0;
        let currentDate = Helpers.todayISO();
        for (const record of history) {
            if (record.date === currentDate || (streak === 0 && Helpers.isYesterday(record.date))) {
                streak++;
                currentDate = Helpers.addDays(currentDate, -1);
            } else { break; }
        }
        return streak;
    },

    /**
     * Deterministic habit health based on actual evidence.
     */
    calculateHabitHealth(habit, evidence) {
        if (!evidence || evidence.completions === 0) return { class: 'new', label: 'New' };
        const daysSinceStart = Math.max(1, Math.floor((new Date(Helpers.todayISO() + "T00:00:00").getTime() - new Date((habit.created_at || Helpers.todayISO()) + "T00:00:00").getTime()) / 86400000));
        const expected = habit.days && habit.days.length > 0 ? habit.days.length / 7 : 1;
        const completionRate = evidence.completions / Math.max(1, daysSinceStart / 7 * expected);
        const recentRate = evidence.last7 / Math.max(1, expected);
        if (daysSinceStart < 14) return { class: 'building', label: 'Building' };
        if (recentRate >= 0.8 && completionRate >= 0.7) return { class: 'stable', label: 'Stable' };
        if (recentRate >= 0.5) return { class: 'struggling', label: 'Struggling' };
        return { class: 'needs-adjustment', label: 'Needs Adjustment' };
    },

    recentEvidence() {
        const today = Helpers.todayISO();
        const recent = State.history.filter(h => h.identity_id === State.currentIdentityId && h.date <= today).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
        if (recent.length === 0) return '<p class="empty-state">No completions yet. Your first action creates the first vote.</p>';
        return recent.map(r => { const action = State.actions.find(a => a.id === r.action_id); return `<div class="evidence-row"><span class="evidence-date">${Helpers.formatDate(Helpers.parseISODate(r.date), { weekday: 'short', month: 'short', day: 'numeric' })}</span><span class="evidence-habit">${Helpers.escapeHtml(action?.title || 'Unknown')}</span>${r.value ? `<span class="evidence-value">${r.value}</span>` : ''}</div>`; }).join('');
    },

    appliedLessons() {
        const applied = State.lessonProgress.filter(p => p.identity_id === State.currentIdentityId).map(p => Lessons.find(l => l.id === p.lesson_id)).filter(Boolean);
        if (applied.length === 0) return '<p class="empty-state">No lessons applied yet.</p>';
        return applied.map(l => `<div class="lesson-applied"><strong>${l.title}</strong><span>Module: ${l.module}</span></div>`).join('');
    },

    reflectionHistory() {
        const reflections = State.reflections.filter(r => r.identity_id === State.currentIdentityId).sort((a, b) => b.reflection_date.localeCompare(a.reflection_date)).slice(0, 7);
        return reflections.map(r => `<div class="reflection-history-item"><div class="reflection-date">${Helpers.formatDate(Helpers.parseISODate(r.reflection_date), { weekday: 'short', month: 'short', day: 'numeric' })}</div><div class="reflection-win">${Helpers.escapeHtml(r.win || '')}</div></div>`).join('');
    },

    /**
     * Stats with deterministic calculations.
     */
    stats() {
        const today = Helpers.todayISO();
        const habits = State.actions.filter(a => a.identity_id === State.currentIdentityId);
        const totalHabits = habits.length;
        const completedToday = State.history.filter(h => h.identity_id === State.currentIdentityId && h.date === today).length;
        const totalCompletions = State.history.filter(h => h.identity_id === State.currentIdentityId).length;
        const currentStreak = UI.calculateOverallStreak();
        const bestStreak = UI.calculateBestStreak();
        return `<div class="stats-grid"><div class="stat-card"><h3>Today</h3><strong>${completedToday}/${totalHabits}</strong></div><div class="stat-card"><h3>Current Streak</h3><strong>${currentStreak}</strong><span>days</span></div><div class="stat-card"><h3>Best Streak</h3><strong>${bestStreak}</strong><span>days</span></div><div class="stat-card"><h3>Total Votes</h3><strong>${totalCompletions}</strong></div></div>`;
    },

    calculateOverallStreak() {
        const dates = [...new Set(State.history.filter(h => h.identity_id === State.currentIdentityId).map(h => h.date))].sort();
        if (dates.length === 0) return 0;
        let streak = 0;
        let checkDate = Helpers.todayISO();
        for (const date of dates.reverse()) {
            if (date === checkDate) { streak++; checkDate = Helpers.addDays(checkDate, -1); }
            else if (date < checkDate) { break; }
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
            const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
            if (diff === 1) { current++; best = Math.max(best, current); }
            else { current = 1; }
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
        const tz = State.userTimezone || 'UTC';
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const startDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = lastDay.getDate();
        const today = Helpers.todayISO();
        const completionsByDate = {};
        State.history.filter(h => h.identity_id === State.currentIdentityId).forEach(h => { if (!completionsByDate[h.date]) completionsByDate[h.date] = 0; completionsByDate[h.date]++; });
        let html = `<div class="calendar-header"><button class="calendar-nav-btn" onclick="UI.renderCalendar(${year}, ${month - 1})" aria-label="Previous month">‹</button><h3>${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(firstDay)}</h3><button class="calendar-nav-btn" onclick="UI.renderCalendar(${year}, ${month + 1})" aria-label="Next month">›</button></div><div class="calendar-grid" role="grid">`;
        for (const d of ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']) {
            html += `<div class="calendar-day-header" role="columnheader">${d}</div>`;
        }
        for (let i = 0; i < startDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const count = completionsByDate[dateStr] || 0;
            const isToday = dateStr === today;
            const isPast = dateStr < today;
            const classes = ['calendar-day'];
            if (isToday) classes.push('today');
            if (count > 0) classes.push('completed');
            html += `<div class="${classes.join(' ')}" data-date="${dateStr}" role="gridcell" tabindex="0" onclick="App.openDayModal('${dateStr}')"><span class="day-number">${day}</span>${count > 0 ? `<span class="completion-count">${count}</span>` : ''}</div>`;
        }
        html += '</div>';
        return html;
    },

    historyTimeline() {
        const history = State.history.filter(h => h.identity_id === State.currentIdentityId).sort((a, b) => b.date.localeCompare(a.date));
        if (history.length === 0) return '<div class="empty-state"><p>No history yet.</p></div>';
        const grouped = {};
        history.forEach(h => { if (!grouped[h.date]) grouped[h.date] = []; grouped[h.date].push(h); });
        return Object.entries(grouped).slice(0, 30).map(([date, records]) => { const actions = records.map(r => { const action = State.actions.find(a => a.id === r.action_id); return action ? (action.habit_type === 'count' || action.habit_type === 'duration' || action.habit_type === 'quantity' ? `🔢 ${Helpers.escapeHtml(action.title)}: ${r.value ?? 0}` : `✓ ${Helpers.escapeHtml(action.title)}`) : null; }).filter(Boolean); const reflection = State.reflections.find(r => r.reflection_date === date && r.identity_id === State.currentIdentityId); return `<div class="timeline-day" onclick="App.openDayModal('${date}')"><div class="timeline-date">${Helpers.formatDate(Helpers.parseISODate(date), { weekday: 'long', month: 'long', day: 'numeric' })}</div><div class="timeline-actions">${actions.map(a => `<div class="timeline-action">${a}</div>`).join('')}</div>${reflection ? `<div class="timeline-reflection">💭 ${Helpers.escapeHtml(reflection.win || '').substring(0, 60)}</div>` : ''}</div>`; }).join('');
    },

    /**
     * Weekly review page with deterministic data.
     */
    weeklyReview() {
        const review = App.getWeeklyReview();
        if (!review.hasData) { return `<div class="container"><div class="hero"><h1 class="headline">Weekly Review</h1></div><div class="empty-state"><p>Not enough data yet. Complete at least a few habits to generate a weekly review.</p></div></div>`; }
        return `<div class="container"><div class="hero"><h1 class="headline">Weekly Review</h1><p class="daily-quote">Week of ${Helpers.formatDate(Helpers.parseISODate(review.weekStart), { month: 'long', day: 'numeric' })} – ${Helpers.formatDate(Helpers.parseISODate(review.weekEnd), { month: 'long', day: 'numeric' })}</p></div><div class="stats-grid"><div class="stat-card"><h3>Habits Done</h3><strong>${review.completedHabits}/${review.totalHabits}</strong></div><div class="stat-card"><h3>Completions</h3><strong>${review.totalCompletions}</strong></div><div class="stat-card"><h3>Missed</h3><strong>${review.missed}</strong></div><div class="stat-card"><h3>Reflections</h3><strong>${review.reflections}</strong></div></div><div class="identity-sections"><div class="identity-section"><h3>Strongest Habit</h3>${review.strongest ? `<p>${Helpers.escapeHtml(review.strongest)} (${Math.round(review.strongestRate * 100)}% consistency)</p>` : '<p>No strong data yet.</p>'}</div><div class="identity-section"><h3>Struggling Habit</h3>${review.struggling ? `<p>${Helpers.escapeHtml(review.struggling)} (${Math.round(review.strugglingRate * 100)}% consistency)</p><small>Consider reducing the normal target or changing the cue.</small>` : '<p>No struggling habits detected.</p>'}</div><div class="identity-section"><h3>What Worked</h3><textarea id="reviewWhatWorked" placeholder="What went well this week?"></textarea></div><div class="identity-section"><h3>What Got in the Way</h3><textarea id="reviewObstacles" placeholder="What obstacles did you face?"></textarea></div><div class="identity-section"><h3>Change Next Week</h3><textarea id="reviewChanges" placeholder="Your plan for next week..."></textarea></div><div class="sheet-actions" style="margin-top: 16px;"><button class="btn btn-primary" onclick="UI.saveReview()">Save Review</button></div></div></div>`;
    },

    async saveReview() {
        const whatWorked = document.getElementById('reviewWhatWorked')?.value || '';
        const obstacles = document.getElementById('reviewObstacles')?.value || '';
        const changes = document.getElementById('reviewChanges')?.value || '';
        const today = Helpers.todayISO();
        const reviewData = { week_start: Helpers.addDays(today, -7), summary: { whatWorked, obstacles, changes }, adjustments: '' };
        try {
            const { data, error } = await supabaseClient.from("weekly_reviews").insert({ profile_id: State.profile.id, identity_id: State.currentIdentityId, week_start: reviewData.week_start, summary: reviewData.summary }).select().single();
            if (error) { console.error(error); UI.showToast("Review saved locally (sync pending)"); }
            else { UI.showToast("Review saved"); }
        } catch(e) {
            // Fallback to localStorage if table doesn't exist
            const stored = JSON.parse(localStorage.getItem('weekly_reviews') || '[]');
            stored.push({ ...reviewData, identity_id: State.currentIdentityId });
            localStorage.setItem('weekly_reviews', JSON.stringify(stored));
            UI.showToast("Review saved locally");
        }
        App.navigate("today");
    },

    loginPage() {
        return `<div class="login-page"><h1>Identity OS</h1><input id="loginEmail" type="email" placeholder="Email" aria-label="Email"><input id="loginPassword" type="password" placeholder="Password" aria-label="Password"><button class="btn btn-primary" onclick="UI.login()">Sign In</button><button class="google-btn" onclick="UI.loginWithGoogle()"><span>🔵</span><span>Sign in with Google</span></button><p style="margin-top:16px;text-align:center;"><a href="#" onclick="event.preventDefault(); UI.showSignup();">Create an account</a></p></div>`;
    },

    onboarding() {
        const identities = State.identities.map(i => `<div class="identity-option"><div>${Helpers.escapeHtml(i.name)}</div><button onclick="App.selectIdentity(${i.id})" aria-label="Select ${Helpers.escapeHtml(i.name)}">✓</button></div>`).join("");
        return `<div class="login-page"><h1>Identity OS</h1><div class="identity-list">${identities}${State.identities.length === 0 ? '' : ''}<div class="identity-option" style="cursor:pointer;" onclick="App.createIdentity()"><div>+ Add Identity</div></div></div></div>`;
    },

    lessonDetail(id) {
        const lesson = Lessons.find(l => l.id === id);
        if (!lesson) return '<div class="container"><p>Lesson not found.</p></div>';
        const completed = State.completedLessons.includes(id);
        const alreadyCreated = State.actions.some(a => a.lesson_id === id);
        const dd = lesson.designDefaults || {};
        return `<div class="container"><div class="hero"><h1 class="headline">${Helpers.escapeHtml(lesson.title)}</h1><p class="daily-quote">${Helpers.escapeHtml(lesson.principle)}</p></div><div class="stat-card"><h3>Challenge</h3><p>${Helpers.escapeHtml(lesson.action)}</p></div>${dd.minimum || dd.normal || dd.stretch ? `<div class="stat-card"><h3>Suggested Design</h3><p>Minimum: ${Helpers.escapeHtml(dd.minimum || 'N/A')}</p><p>Normal: ${Helpers.escapeHtml(dd.normal || 'N/A')}</p>${dd.stretch ? `<p>Stretch: ${Helpers.escapeHtml(dd.stretch)}</p>` : ''}</div>` : ''}<div class="sheet-actions"><button class="btn btn-primary" onclick="App.createHabitFromLesson(${id})">${alreadyCreated ? 'Habit Already Created' : 'Create Habit from This Lesson'}</button><button class="btn btn-secondary" onclick="App.navigate('learn')">Back to Lessons</button></div></div>`;
    },

    showSignup() { const sheet = document.getElementById('signupSheet'); if (sheet) { sheet.classList.remove('hidden'); setTimeout(() => sheet.classList.add('show'), 10); } },
    closeSignup() { const sheet = document.getElementById('signupSheet'); if (sheet) { sheet.classList.remove('show'); setTimeout(() => sheet.classList.add('hidden'), 250); } },
    async login() { const email = document.getElementById('loginEmail')?.value.trim(); const password = document.getElementById('loginPassword')?.value.trim(); if (!email || !password) { UI.showToast('Enter email and password.'); return; } const result = await window.login(email, password); if (result.error) { UI.showToast(result.error); return; } location.reload(); },
    async signup() { const email = document.getElementById('signupEmail')?.value.trim(); const password = document.getElementById('signupPassword')?.value.trim(); const confirm = document.getElementById('signupConfirm')?.value.trim(); if (!email) { UI.showToast('Enter your email.'); return; } if (!password) { UI.showToast('Enter your password.'); return; } if (password !== confirm) { UI.showToast('Passwords do not match.'); return; } const result = await createAccount(email, password); if (result.error) { UI.showToast(result.error); return; } UI.showToast('Account created. Check your email.'); this.closeSignup(); },
    signupSheet() { return `<div id="signupSheet" class="bottom-sheet hidden"><div class="sheet-handle"></div><h2>Create Account</h2><input id="signupEmail" type="email" placeholder="Email"><input id="signupPassword" type="password" placeholder="Password"><input id="signupConfirm" type="password" placeholder="Confirm Password"><div class="sheet-actions"><button class="btn btn-primary" onclick="UI.signup()">Create Account</button><button class="btn btn-secondary" onclick="UI.closeSignup()">Cancel</button></div></div>`; },
    showToast(message) { const toast = document.createElement('div'); toast.className = 'toast'; toast.textContent = message; toast.setAttribute('role', 'alert'); toast.setAttribute('aria-live', 'polite'); document.body.appendChild(toast); requestAnimationFrame(() => toast.classList.add('show')); setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000); },
    showUpdateBanner(worker) { const banner = document.createElement('div'); banner.className = 'update-banner'; banner.innerHTML = `<span>Update available</span><button onclick="worker.postMessage({type:'SKIP_WAITING'}); this.parentElement.remove()">Refresh</button>`; document.body.appendChild(banner); }
};
window.UI = UI;
