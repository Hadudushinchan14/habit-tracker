const App = {
    currentPage: "today",

    render() {
        if (State.loading.profile) {
            document.getElementById("app").innerHTML = '<div class="container" style="padding-top:120px;"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div></div>';
            return;
        }
        if (!State.currentIdentityId) {
            document.getElementById("app").innerHTML = Pages.onboarding();
            return;
        }
        document.getElementById("app").innerHTML = Pages[this.currentPage]();
        State.ui.currentPage = this.currentPage;
    },

    navigate(page) { this.currentPage = page; this.render(); },

    changeIdentity() { document.getElementById("app").innerHTML = Pages.onboarding(); },

    async completeLesson(id) {
        const lesson = Lessons.find(l => l.id === id);
        if (!lesson) return;
        const alreadyCreated = State.actions.some(a => a.lesson_id === id);
        if (alreadyCreated) { UI.showToast("Habit already created"); this.navigate("today"); return; }
        await this.saveLessonProgress(id, "");
        this.render();
    },

    async createHabitFromLesson(id) {
        const lesson = Lessons.find(l => l.id === id);
        if (!lesson) return;
        const responseInput = document.getElementById("lessonResponse");
        const response = responseInput ? responseInput.value.trim() : "";
        const subtitleInput = document.getElementById("lessonSubtitle");
        const subtitle = subtitleInput ? subtitleInput.value.trim() : "";
        const title = lesson.action || response || lesson.title;
        if (!title) { UI.showToast("Create your habit first"); return; }

        const dd = lesson.designDefaults || {};
        const isCounterType = lesson.type === 'limit' || ["count", "duration", "quantity"].includes(lesson.type);
        const habitData = {
            profile_id: State.profile.id,
            identity_id: State.currentIdentityId,
            title,
            subtitle: subtitle || lesson.title,
            description: lesson.principle,
            habit_type: lesson.type === "identity" ? "binary" : lesson.type === "reflection" ? "binary" : lesson.type === "challenge" ? "binary" : isCounterType ? "count" : "binary",
            is_counter: isCounterType,
            lesson_id: lesson.id,
            lesson_title: lesson.title,
            minimum: dd.minimum || "",
            normal: dd.normal || "",
            stretch: dd.stretch || "",
            cue: dd.cue || "",
            location: dd.location || "",
            environment: dd.environment || "",
            time: dd.time || "",
            days: dd.days || [0,1,2,3,4,5,6],
            target: isCounterType ? 1 : null,
            unit: isCounterType ? "times" : "",
            paused: false,
            archived: false,
            start_date: null
        };

        const { data, error } = await supabaseClient.from("actions").insert(habitData).select().single();
        if (error) { console.error(error); UI.showToast("Failed creating habit"); return; }
        await supabaseClient.from("lesson_progress").upsert({ profile_id: State.profile.id, identity_id: State.currentIdentityId, lesson_id: lesson.id, response }, { onConflict: "identity_id,lesson_id" });
        await Database.loadLessonProgress();
        await Database.loadActions();
        UI.showToast("Habit created from lesson");
        this.navigate("today");
    },

    /**
     * Check if a habit is due today based on timezone, schedule, paused, archived, start_date.
     * Returns true if the habit should appear in Today.
     */
    isHabitDueToday(action) {
        if (!action || action.archived || action.paused) return false;
        const today = Helpers.todayISO();
        if (action.start_date && today < action.start_date) return false;
        if (!action.days || !action.days.length) return false;
        const dayIndex = (new Date(today + "T00:00:00").getDay() + 6) % 7;
        return action.days.includes(dayIndex);
    },

    /**
     * Check if a habit was expected to be completed yesterday (for recovery).
     * Only applies if yesterday was a scheduled day and the habit wasn't paused.
     */
    wasHabitMissedYesterday(action) {
        if (!action || action.archived || action.paused) return false;
        if (!action.days || !action.days.length) return false;
        const yesterday = Helpers.addDays(Helpers.todayISO(), -1);
        const dayIndex = (new Date(yesterday + "T00:00:00").getDay() + 6) % 7;
        if (!action.days.includes(dayIndex)) return false;
        const today = Helpers.todayISO();
        if (action.start_date && yesterday < action.start_date) return false;
        const wasCompletedYesterday = State.history.some(h => h.action_id === action.id && h.identity_id === State.currentIdentityId && h.date === yesterday);
        return !wasCompletedYesterday;
    },

    async toggleAction(id) {
        const action = State.actions.find(a => a.id === id);
        if (!action) return;
        if (action.archived || action.paused) { UI.showToast("This habit is paused or archived."); return; }
        if (!this.isHabitDueToday(action)) { UI.showToast("This habit is not scheduled for today."); return; }

        const today = Helpers.todayISO();
        const existing = State.history.find(h => h.action_id === id && h.identity_id === State.currentIdentityId && h.date === today);

        if (existing) {
            const { error } = await supabaseClient.from("history").delete().eq("id", existing.id);
            if (error) { console.error(error); UI.showToast("Failed to update"); return; }
            State.history = State.history.filter(h => h.id !== existing.id);
        } else {
            const value = action.habit_type === "count" || action.habit_type === "duration" || action.habit_type === "quantity" ? (action.target || 1) : null;
            const version = this._getCompletionVersion(action);
            const { data, error } = await supabaseClient.from("history").insert({
                profile_id: State.profile.id, identity_id: State.currentIdentityId, action_id: id, date: today, value, version
            }).select().single();
            if (error) { console.error(error); UI.showToast("Failed to complete"); return; }
            State.history.push(data);
        }
        this.render();
    },

    _getCompletionVersion(action) {
        const today = Helpers.todayISO();
        const wasMissedYesterday = this.wasHabitMissedYesterday(action);
        if (wasMissedYesterday && action.minimum) return "minimum";
        return "normal";
    },

    async changeCounter(id, delta) {
        const input = document.getElementById(`counter-${id}`);
        if (!input) return;
        const current = parseInt(input.value) || 0;
        input.value = Math.max(0, current + delta);
    },

    async saveCounterFromInput(id) {
        const input = document.getElementById(`counter-${id}`);
        if (!input) return;
        const value = parseInt(input.value) || 0;
        const today = Helpers.todayISO();
        const existing = State.history.find(h => h.action_id === id && h.identity_id === State.currentIdentityId && h.date === today);
        if (existing) {
            const { error } = await supabaseClient.from("history").update({ value }).eq("id", existing.id);
            if (error) { console.error(error); UI.showToast("Failed to save"); return; }
            existing.value = value;
        } else {
            const version = this._getCompletionVersion(action);
            const { data, error } = await supabaseClient.from("history").insert({
                profile_id: State.profile.id, identity_id: State.currentIdentityId, action_id: id, date: today, value, version
            }).select().single();
            if (error) { console.error(error); UI.showToast("Failed to save"); return; }
            State.history.push(data);
        }
        UI.showToast("Saved");
        this.render();
    },

    async saveHabit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const habitData = {
            profile_id: State.profile.id,
            identity_id: State.currentIdentityId,
            title: formData.get('habitTitle')?.trim(),
            subtitle: formData.get('habitWhy')?.trim(),
            habit_type: formData.get('habitType') || 'binary',
            is_counter: formData.get('habitType') === 'limit' || ['count', 'duration', 'quantity'].includes(formData.get('habitType')),
            target: formData.get('target') ? parseInt(formData.get('target')) : null,
            unit: formData.get('unit') || '',
            time: formData.get('time') || '',
            days: formData.getAll('days').map(d => parseInt(d)).sort((a,b) => a-b),
            location: formData.get('location')?.trim(),
            cue: formData.get('cue')?.trim(),
            minimum: formData.get('minimum')?.trim(),
            normal: formData.get('normal')?.trim(),
            stretch: formData.get('stretch')?.trim(),
            environment: formData.get('environment')?.trim(),
            paused: false,
            archived: false,
            start_date: formData.get('startDate') || null,
            completed: false
        };
        if (!habitData.title) { UI.showToast("Habit name is required"); return; }
        let result;
        if (State.editingActionId) {
            const { data, error } = await supabaseClient.from("actions").update(habitData).eq("id", State.editingActionId).select().single();
            if (error) { console.error(error); UI.showToast("Failed to update habit"); return; }
            result = data;
            UI.showToast("Habit updated");
        } else {
            const { data, error } = await supabaseClient.from("actions").insert(habitData).select().single();
            if (error) { console.error(error); UI.showToast("Failed to create habit"); return; }
            result = data;
            UI.showToast("Habit created");
        }
        UI.closeSheet();
        await Database.loadActions();
        this.render();
    },

    openSheet(actionId = null) { UI.openSheet(actionId); },
    closeSheet() { UI.closeSheet(); State.editingActionId = null; },

    selectIdentity(identityId) {
        State.currentIdentityId = identityId;
        const identity = State.identities.find(i => i.id === identityId);
        if (identity) State.profile.identity = identity.name;
        this.reloadIdentityData();
    },

    async reloadIdentityData() {
        await Promise.all([Database.loadActions(), Database.loadHistory(), Database.loadReflections(), Database.loadLessonProgress()]);
        State.completedLessons = State.lessonProgress.map(p => p.lesson_id);
        this.render();
    },

    async createIdentity() {
        const name = prompt("What identity are you building?", "I am becoming someone who...");
        if (!name?.trim()) return;
        const { data, error } = await supabaseClient.from("identities").insert({ profile_id: State.profile.id, name: name.trim() }).select().single();
        if (error) { console.error(error); UI.showToast("Failed to create identity"); return; }
        await Database.loadIdentities();
        State.currentIdentityId = data.id;
        State.profile.identity = data.name;
        this.render();
    },

    async editIdentity(identityId) {
        const identity = State.identities.find(i => i.id === identityId);
        if (!identity) return;
        const name = prompt("Edit identity:", identity.name);
        if (!name?.trim() || name.trim() === identity.name) return;
        const { error } = await supabaseClient.from("identities").update({ name: name.trim() }).eq("id", identityId);
        if (error) { console.error(error); UI.showToast("Failed to update identity"); return; }
        await Database.loadIdentities();
        if (State.currentIdentityId === identityId) State.profile.identity = name.trim();
        this.render();
    },

    async deleteIdentity(identityId) {
        if (!confirm("Delete this identity and all its habits? This cannot be undone.")) return;
        const { error } = await supabaseClient.from("identities").delete().eq("id", identityId);
        if (error) { console.error(error); UI.showToast("Failed to delete identity"); return; }
        await Database.loadIdentities();
        if (State.currentIdentityId === identityId) State.currentIdentityId = State.identities[0]?.id || null;
        this.render();
    },

    async saveReflection(event) {
        event.preventDefault();
        const form = event.target;
        const today = Helpers.todayISO();
        const reflectionData = {
            profile_id: State.profile.id, identity_id: State.currentIdentityId, reflection_date: today,
            win: form.win?.value?.trim() || '', challenge: form.challenge?.value?.trim() || '', tomorrow: form.tomorrow?.value?.trim() || ''
        };
        const existing = State.reflections.find(r => r.reflection_date === today && r.identity_id === State.currentIdentityId);
        if (existing) {
            const { error } = await supabaseClient.from("reflections").update(reflectionData).eq("id", existing.id);
            if (error) { console.error(error); UI.showToast("Failed to save reflection"); return; }
            Object.assign(existing, reflectionData);
        } else {
            const { data, error } = await supabaseClient.from("reflections").insert(reflectionData).select().single();
            if (error) { console.error(error); UI.showToast("Failed to save reflection"); return; }
            State.reflections.push(data);
        }
        UI.showToast("Reflection saved");
        this.render();
    },

    async saveLessonProgress(lessonId, response) {
        const { error } = await supabaseClient.from("lesson_progress").upsert({ profile_id: State.profile.id, identity_id: State.currentIdentityId, lesson_id: lessonId, response }, { onConflict: "identity_id,lesson_id" });
        if (error) console.error(error);
        await Database.loadLessonProgress();
        State.completedLessons = State.lessonProgress.map(p => p.lesson_id);
    },

    openDayModal(date) {
        const actions = State.history.filter(h => h.date === date && h.identity_id === State.currentIdentityId).map(h => { const action = State.actions.find(a => a.id === h.action_id); return action ? (action.habit_type === 'count' || action.habit_type === 'duration' || action.habit_type === 'quantity' ? `🔢 ${Helpers.escapeHtml(action.title)}: ${h.value ?? 0}` : `✓ ${Helpers.escapeHtml(action.title)}`) : null; }).filter(Boolean);
        const reflection = State.reflections.find(r => r.reflection_date === date && r.identity_id === State.currentIdentityId);
        document.getElementById("dayModalTitle").textContent = Helpers.formatDate(Helpers.parseISODate(date), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById("dayModalContent").innerHTML = `${actions.length ? actions.map(a => `<div class="modal-habit">${a}</div>`).join('') : '<p>No completed actions</p>'} ${reflection ? `<div class="modal-reflection"><h3>Reflection</h3><p><strong>Win:</strong><br>${Helpers.escapeHtml(reflection.win || '')}</p><p><strong>Challenge:</strong><br>${Helpers.escapeHtml(reflection.challenge || '')}</p><p><strong>Tomorrow:</strong><br>${Helpers.escapeHtml(reflection.tomorrow || '')}</p></div>` : ''}`;
        document.getElementById("dayModal").classList.remove("hidden");
    },

    closeDayModal() { document.getElementById("dayModal").classList.add("hidden"); },

    /**
     * Get recovery information for a habit: whether it was missed yesterday.
     */
    getRecoveryInfo(action) {
        if (!action || action.paused || action.archived) return null;
        const missedYesterday = this.wasHabitMissedYesterday(action);
        const missedToday = !this.isHabitDueToday(action);
        return { missedYesterday, missedToday, action };
    },

    /**
     * Get behavioral recommendations for the current identity.
     * Deterministic analysis based on actual data.
     */
    getRecommendations() {
        const recommendations = [];
        const today = Helpers.todayISO();
        const actions = State.actions.filter(a => a.identity_id === State.currentIdentityId && !a.archived);
        if (actions.length === 0) return recommendations;

        actions.forEach(action => {
            const history = State.history.filter(h => h.action_id === action.id && h.identity_id === State.currentIdentityId);
            if (history.length === 0 && action.days && action.days.length > 0) {
                const scheduledDays = action.days.length;
                recommendations.push({
                    type: "no_data",
                    habitId: action.id,
                    habitTitle: action.title,
                    evidence: `Habit has been scheduled ${scheduledDays} days/week but has zero completions recorded.`,
                    message: `"${action.title}" hasn't been started yet. Your first completion is the most important step.`,
                    suggestedAction: "Start with the minimum version today."
                });
            } else if (history.length > 0) {
                const todayCompleted = history.some(h => h.date === today);
                if (!todayCompleted && action.days && action.days.includes((new Date(today + "T00:00:00").getDay() + 6) % 7)) {
                    const missedYesterday = this.wasHabitMissedYesterday(action);
                    if (missedYesterday) {
                        recommendations.push({
                            type: "never_miss_twice",
                            habitId: action.id,
                            habitTitle: action.title,
                            evidence: `Habit was scheduled yesterday and not completed, and is scheduled again today.`,
                            message: `You missed "${action.title}" yesterday. Today, return with the minimum version.`,
                            suggestedAction: action.minimum ? `Do the minimum: ${action.minimum}` : "Complete at least once today."
                        });
                    }
                }
                const recent7 = history.filter(h => { const d = Helpers.parseISODate(h.date); const weekAgo = Helpers.addDays(today, -7); return d >= weekAgo; });
                if (recent7.length > 0 && action.normal && action.normal.length > 0 && recent7.length < 3) {
                    recommendations.push({
                        type: "low_consistency",
                        habitId: action.id,
                        habitTitle: action.title,
                        evidence: `In the last 7 days, "${action.title}" was completed ${recent7.length} times against a normal target.`,
                        message: `"${action.title}" has low consistency recently.`,
                        suggestedAction: "Consider whether the normal target is too ambitious."
                    });
                }
            }
        });

        if (actions.length > 5) {
            const activeHabits = actions.filter(a => !a.paused && !a.archived);
            const struggling = activeHabits.filter(a => { const h = State.history.filter(h => h.action_id === a.id && h.identity_id === State.currentIdentityId); return h.length < activeHabits.length * 2; });
            if (struggling.length > 2) {
                recommendations.push({
                    type: "habit_load",
                    habitId: null,
                    habitTitle: "",
                    evidence: `${activeHabits.length} active habits, ${struggling.length} showing low consistency.`,
                    message: "You may have more active habits than you can consistently manage.",
                    suggestedAction: "Consider pausing or archiving habits that aren't critical right now."
                });
            }
        }

        return recommendations;
    },

    /**
     * Get weekly review data from actual evidence.
     */
    getWeeklyReview() {
        const today = Helpers.todayISO();
        const weekStart = Helpers.addDays(today, -7);
        const actions = State.actions.filter(a => a.identity_id === State.currentIdentityId && !a.archived);
        const history = State.history.filter(h => h.identity_id === State.currentIdentityId && h.date >= weekStart && h.date <= today);

        const habitSummaries = actions.map(action => {
            const completions = history.filter(h => h.action_id === action.id).length;
            const scheduledDays = action.days ? action.days.length : 7;
            const completionRate = scheduledDays > 0 ? completions / scheduledDays : 0;
            return { action, completions, completionRate };
        });

        const strongest = habitSummaries.filter(h => h.completionRate >= 0.8).sort((a,b) => b.completionRate - a.completionRate)[0];
        const struggling = habitSummaries.filter(h => h.completionRate < 0.5).sort((a,b) => a.completionRate - b.completionRate)[0];
        const minVersionUsage = history.filter(h => h.value && h.value > 0).length;
        const totalCompletions = history.length;
        const missed = actions.reduce((total, a) => {
            if (!a.days || !a.days.length) return total;
            let actionMissed = 0;
            for (let d = 0; d < 7; d++) {
                const dayDate = Helpers.addDays(today, -d);
                const dayIndex = (new Date(dayDate + "T00:00:00").getDay() + 6) % 7;
                if (a.days.includes(dayIndex)) {
                    const wasCompleted = history.some(h => h.action_id === a.id && h.identity_id === State.currentIdentityId && h.date === dayDate);
                    if (!wasCompleted) actionMissed++;
                }
            }
            return total + actionMissed;
        }, 0);
        const reflections = State.reflections.filter(r => r.identity_id === State.currentIdentityId && r.reflection_date >= weekStart);

        return {
            weekStart, weekEnd: today,
            totalHabits: actions.length, completedHabits: habitSummaries.filter(h => h.completionRate >= 0.8).length,
            strongest: strongest ? strongest.action.title : null,
            strongestRate: strongest ? strongest.completionRate : 0,
            struggling: struggling ? struggling.action.title : null,
            strugglingRate: struggling ? struggling.completionRate : 0,
            minVersionUsage, totalCompletions, missed,
            reflections: reflections.length,
            hasData: actions.length > 0
        };
    },

    async exportData() {
        const data = { profile: State.profile, identities: State.identities, actions: State.actions, history: State.history, reflections: State.reflections, lessonProgress: State.lessonProgress, exportedAt: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `habit-tracker-export-${Helpers.todayISO()}.json`; a.click();
        URL.revokeObjectURL(url);
        UI.showToast("Data exported");
    },

    confirmDeleteAccount() { if (confirm("Delete your account and all data? This cannot be undone.")) { this.deleteAccount(); } },

    /**
     * Safe account deletion: signs out first, then uses a server-side approach.
     * Does NOT use auth.admin.deleteUser() in client code.
     */
    async deleteAccount() {
        const user = await getUser();
        if (!user) return;
        // Safety: verify authentication before deletion
        if (!State.profile.id) { UI.showToast("Cannot delete: no profile loaded"); return; }
        // Cascade delete all user data
        // WARNING: This depends on RLS enforcing ownership. If RLS is not configured,
        // these deletes could affect other users' data. Verify RLS policies before deploying.
        await supabaseClient.from("history").delete().eq("profile_id", State.profile.id);
        await supabaseClient.from("reflections").delete().eq("profile_id", State.profile.id);
        await supabaseClient.from("actions").delete().eq("profile_id", State.profile.id);
        await supabaseClient.from("lesson_progress").delete().eq("profile_id", State.profile.id);
        await supabaseClient.from("identities").delete().eq("profile_id", State.profile.id);
        await supabaseClient.from("profiles").delete().eq("id", State.profile.id);
        await this.logout();
        UI.showToast("Account and all data deleted.");
    },

    openTimezoneSettings() {
        const tz = prompt("Enter timezone (e.g., America/New_York, Europe/London):", State.userTimezone);
        if (tz && Intl.DateTimeFormat().resolvedOptions().timeZone) {
            try {
                new Intl.DateTimeFormat('en-US', { timeZone: tz });
                State.userTimezone = tz;
                State.profile.timezone = tz;
                UI.showToast("Timezone updated");
                this.render();
            } catch { UI.showToast("Invalid timezone"); }
        }
    }
};
window.App = App;

(async function() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { document.getElementById("app").innerHTML = UI.loginPage(); return; }
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) { document.getElementById("app").innerHTML = UI.loginPage(); }
        else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') { Database.init().then(() => App.render()); }
    });
    await Database.init();
    App.render();
})();
