const App = {

    currentPage: "today",

    render() {
        if (!State.currentIdentityId) {
            document.getElementById("app").innerHTML = Pages.onboarding();
            return;
        }
        document.getElementById("app").innerHTML = Pages[this.currentPage]();
        State.ui.currentPage = this.currentPage;
    },

    navigate(page) {
        this.currentPage = page;
        this.render();
    },

    changeIdentity() {
        document.getElementById("app").innerHTML = Pages.onboarding();
    },

    async completeLesson(id) {
        const lesson = Lessons.find(l => l.id === id);
        const alreadyCreated = State.actions.some(a => a.lesson_id === id);

        if (alreadyCreated) {
            UI.showToast("Habit already created");
            this.navigate("today");
            return;
        }

        if (!lesson) return;

        // Mark lesson as completed in progress
        await this.saveLessonProgress(id, "");
        this.render();
    },

    async createHabitFromLesson(id) {
        const lesson = Lessons.find(l => l.id === id);
        const responseInput = document.getElementById("lessonResponse");
        const response = responseInput ? responseInput.value.trim() : "";
        const subtitleInput = document.getElementById("lessonSubtitle");
        const subtitle = subtitleInput ? subtitleInput.value.trim() : "";
        const title = lesson.action || response || lesson.title;

        if (!title) {
            UI.showToast("Create your habit first");
            return;
        }

        const habitData = {
            profile_id: State.profile.id,
            identity_id: State.currentIdentityId,
            title,
            subtitle: subtitle || lesson.title,
            description: lesson.principle,
            is_counter: false,
            completed: false,
            habit_type: "binary",
            lesson_id: lesson.id,
            lesson_title: lesson.title,
            minimum: "",
            normal: "",
            stretch: "",
            cue: "",
            location: "",
            environment: "",
            time: "",
            days: [0,1,2,3,4,5,6]
        };

        const { data, error } = await supabaseClient.from("actions").insert(habitData).select().single();

        if (error) {
            console.error(error);
            UI.showToast("Failed creating habit");
            return;
        }

        await supabaseClient.from("lesson_progress").upsert({
            profile_id: State.profile.id,
            identity_id: State.currentIdentityId,
            lesson_id: lesson.id,
            response
        }, { onConflict: "identity_id,lesson_id" });

        await Database.loadLessonProgress();
        await Database.loadActions();

        UI.showToast("Habit created");
        this.navigate("today");
    },

    openLesson(id) {
        const lesson = Lessons.find(l => l.id === id);
        if (!lesson) return;
        const page = UI.lessonDetail(id);
        document.getElementById("app").innerHTML = page;
    },

    async toggleAction(id) {
        const action = State.actions.find(a => a.id === id);
        if (!action) return;

        const today = Helpers.todayISO();
        const existing = State.history.find(h => h.action_id === id && h.identity_id === State.currentIdentityId && h.date === today);

        if (existing) {
            // Uncomplete - delete history record
            const { error } = await supabaseClient.from("history").delete().eq("id", existing.id);
            if (error) {
                console.error(error);
                UI.showToast("Failed to update");
                return;
            }
            State.history = State.history.filter(h => h.id !== existing.id);
        } else {
            // Complete - insert history record
            const { data, error } = await supabaseClient.from("history").insert({
                profile_id: State.profile.id,
                identity_id: State.currentIdentityId,
                action_id: id,
                date: today,
                value: action.is_counter ? 1 : null
            }).select().single();

            if (error) {
                console.error(error);
                UI.showToast("Failed to complete");
                return;
            }
            State.history.push(data);
        }

        this.render();
    },

    async changeCounter(id, delta) {
        const input = document.getElementById(`counter-${id}`);
        if (!input) return;
        const current = parseInt(input.value) || 0;
        const next = Math.max(0, current + delta);
        input.value = next;
    },

    async saveCounterFromInput(id) {
        const input = document.getElementById(`counter-${id}`);
        if (!input) return;
        const value = parseInt(input.value) || 0;
        const today = Helpers.todayISO();

        const existing = State.history.find(h => h.action_id === id && h.identity_id === State.currentIdentityId && h.date === today);

        if (existing) {
            const { error } = await supabaseClient.from("history").update({ value }).eq("id", existing.id);
            if (error) {
                console.error(error);
                UI.showToast("Failed to save");
                return;
            }
            existing.value = value;
        } else {
            const { data, error } = await supabaseClient.from("history").insert({
                profile_id: State.profile.id,
                identity_id: State.currentIdentityId,
                action_id: id,
                date: today,
                value
            }).select().single();

            if (error) {
                console.error(error);
                UI.showToast("Failed to save");
                return;
            }
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
            is_counter: ['count', 'duration', 'quantity'].includes(formData.get('habitType')),
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
            completed: false
        };

        if (!habitData.title) {
            UI.showToast("Habit name is required");
            return;
        }

        let result;
        if (State.editingActionId) {
            // Update existing
            const { data, error } = await supabaseClient.from("actions").update(habitData).eq("id", State.editingActionId).select().single();
            if (error) {
                console.error(error);
                UI.showToast("Failed to update habit");
                return;
            }
            result = data;
            UI.showToast("Habit updated");
        } else {
            // Create new
            const { data, error } = await supabaseClient.from("actions").insert(habitData).select().single();
            if (error) {
                console.error(error);
                UI.showToast("Failed to create habit");
                return;
            }
            result = data;
            UI.showToast("Habit created");
        }

        UI.closeSheet();
        await Database.loadActions();
        this.render();
    },

    openSheet(actionId = null) {
        UI.openSheet(actionId);
    },

    closeSheet() {
        UI.closeSheet();
        State.editingActionId = null;
    },

    selectIdentity(identityId) {
        State.currentIdentityId = identityId;
        const identity = State.identities.find(i => i.id === identityId);
        if (identity) State.profile.identity = identity.name;
        this.reloadIdentityData();
    },

    async reloadIdentityData() {
        await Promise.all([
            Database.loadActions(),
            Database.loadHistory(),
            Database.loadReflections(),
            Database.loadLessonProgress()
        ]);
        State.completedLessons = State.lessonProgress.map(p => p.lesson_id);
        this.render();
    },

    async createIdentity() {
        const name = prompt("What identity are you building?", "I am becoming someone who...");
        if (!name?.trim()) return;

        const { data, error } = await supabaseClient.from("identities").insert({
            profile_id: State.profile.id,
            name: name.trim()
        }).select().single();

        if (error) {
            console.error(error);
            UI.showToast("Failed to create identity");
            return;
        }

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
        if (error) {
            console.error(error);
            UI.showToast("Failed to update identity");
            return;
        }

        await Database.loadIdentities();
        if (State.currentIdentityId === identityId) State.profile.identity = name.trim();
        this.render();
    },

    async deleteIdentity(identityId) {
        if (!confirm("Delete this identity and all its habits? This cannot be undone.")) return;
        const { error } = await supabaseClient.from("identities").delete().eq("id", identityId);
        if (error) {
            console.error(error);
            UI.showToast("Failed to delete identity");
            return;
        }
        await Database.loadIdentities();
        if (State.currentIdentityId === identityId) {
            State.currentIdentityId = State.identities[0]?.id || null;
            State.profile.identity = State.identities[0]?.name || null;
        }
        this.render();
    },

    async saveReflection(event) {
        event.preventDefault();
        const form = event.target;
        const today = Helpers.todayISO();

        const reflectionData = {
            profile_id: State.profile.id,
            identity_id: State.currentIdentityId,
            reflection_date: today,
            win: form.win?.value?.trim() || '',
            challenge: form.challenge?.value?.trim() || '',
            tomorrow: form.tomorrow?.value?.trim() || ''
        };

        const existing = State.reflections.find(r => r.reflection_date === today && r.identity_id === State.currentIdentityId);

        if (existing) {
            const { error } = await supabaseClient.from("reflections").update(reflectionData).eq("id", existing.id);
            if (error) {
                console.error(error);
                UI.showToast("Failed to save reflection");
                return;
            }
            Object.assign(existing, reflectionData);
        } else {
            const { data, error } = await supabaseClient.from("reflections").insert(reflectionData).select().single();
            if (error) {
                console.error(error);
                UI.showToast("Failed to save reflection");
                return;
            }
            State.reflections.push(data);
        }

        UI.showToast("Reflection saved");
        this.render();
    },

    async saveLessonProgress(lessonId, response) {
        const { error } = await supabaseClient.from("lesson_progress").upsert({
            profile_id: State.profile.id,
            identity_id: State.currentIdentityId,
            lesson_id: lessonId,
            response
        }, { onConflict: "identity_id,lesson_id" });
        if (error) console.error(error);
        await Database.loadLessonProgress();
        State.completedLessons = State.lessonProgress.map(p => p.lesson_id);
    },

    openDayModal(date) {
        const actions = State.history
            .filter(h => h.date === date && h.identity_id === State.currentIdentityId)
            .map(h => {
                const action = State.actions.find(a => a.id === h.action_id);
                return action ? (action.is_counter ? `🔢 ${Helpers.escapeHtml(action.title)}: ${h.value ?? 0}` : `✓ ${Helpers.escapeHtml(action.title)}`) : null;
            })
            .filter(Boolean);

        const reflection = State.reflections.find(r => r.reflection_date === date && r.identity_id === State.currentIdentityId);

        document.getElementById("dayModalTitle").textContent = Helpers.formatDate(Helpers.parseISODate(date), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

        document.getElementById("dayModalContent").innerHTML = `
            ${actions.length ? actions.map(a => `<div class="modal-habit">${a}</div>`).join('') : '<p>No completed actions</p>'}
            ${reflection ? `
            <div class="modal-reflection">
                <h3>Reflection</h3>
                <p><strong>Win:</strong><br>${Helpers.escapeHtml(reflection.win || '')}</p>
                <p><strong>Challenge:</strong><br>${Helpers.escapeHtml(reflection.challenge || '')}</p>
                <p><strong>Tomorrow:</strong><br>${Helpers.escapeHtml(reflection.tomorrow || '')}</p>
            </div>` : ''}
        `;

        document.getElementById("dayModal").classList.remove("hidden");
    },

    closeDayModal() {
        document.getElementById("dayModal").classList.add("hidden");
    },

    async logout() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) console.error(error);
        // Clear state
        Object.keys(State).forEach(key => {
            if (Array.isArray(State[key])) State[key] = [];
            else if (typeof State[key] === 'object' && State[key] !== null) {
                Object.keys(State[key]).forEach(k => State[key][k] = State[key][k] === State.profile.identity || State[key][k] === State.currentIdentityId ? null : State[key][k]);
            }
        });
        State.profile.id = null;
        State.profile.identity = null;
        State.currentIdentityId = null;
        State.userEmail = '';
        document.getElementById("app").innerHTML = UI.loginPage();
    },

    exportData() {
        const data = {
            profile: State.profile,
            identities: State.identities,
            actions: State.actions,
            history: State.history,
            reflections: State.reflections,
            lessonProgress: State.lessonProgress,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `habit-tracker-export-${Helpers.todayISO()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        UI.showToast("Data exported");
    },

    confirmDeleteAccount() {
        if (confirm("Delete your account and all data? This cannot be undone.")) {
            this.deleteAccount();
        }
    },

    async deleteAccount() {
        const user = await getUser();
        if (!user) return;
        // Delete all user data (cascades if FKs set up)
        await supabaseClient.from("history").delete().eq("profile_id", State.profile.id);
        await supabaseClient.from("reflections").delete().eq("profile_id", State.profile.id);
        await supabaseClient.from("actions").delete().eq("profile_id", State.profile.id);
        await supabaseClient.from("lesson_progress").delete().eq("profile_id", State.profile.id);
        await supabaseClient.from("identities").delete().eq("profile_id", State.profile.id);
        await supabaseClient.from("profiles").delete().eq("id", State.profile.id);
        await supabaseClient.auth.admin.deleteUser(user.id); // Requires service role
        // Fallback: just sign out
        await this.logout();
    },

    openTimezoneSettings() {
        const tz = prompt("Enter timezone (e.g., America/New_York, Europe/London):", State.userTimezone);
        if (tz && Intl.DateTimeFormat().resolvedOptions().timeZone) {
            // Validate timezone
            try {
                new Intl.DateTimeFormat('en-US', { timeZone: tz });
                State.userTimezone = tz;
                UI.showToast("Timezone updated");
                this.render();
            } catch {
                UI.showToast("Invalid timezone");
            }
        }
    }

};

window.App = App;

// Auth initialization
(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        document.getElementById("app").innerHTML = UI.loginPage();
        return;
    }

    // Listen for auth changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
            document.getElementById("app").innerHTML = UI.loginPage();
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Re-initialize
            Database.init().then(() => App.render());
        }
    });

    await Database.init();
    App.render();
})();
