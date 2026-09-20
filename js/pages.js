const Pages = {

    today() {
        const today = Helpers.todayISO();
        const completedToday = State.history.filter(
            h => h.identity_id === State.currentIdentityId && h.date === today
        ).length;

        return `
        <div class="container">
            <div class="hero">
                <p class="greeting">${Helpers.greeting()}</p>
                <h1 class="headline">Who are you becoming today?</h1>
                <p class="daily-quote">${Helpers.quote()}</p>
            </div>

            ${UI.identityCard(State.profile.identity)}
            <button class="secondary-button" onclick="App.changeIdentity()">Change Identity</button>

            ${UI.progressRing(completedToday, State.actions.length)}

            ${UI.sectionHeader(
                "Today's Votes",
                `<span>${completedToday} / ${State.actions.length}</span>`
            )}

            ${State.actions.map(action => {
                const completed = State.history.some(
                    h => h.action_id === action.id &&
                         h.identity_id === State.currentIdentityId &&
                         h.date === today
                );
                // Don't mutate state - pass completed as parameter
                return UI.actionRow({ ...action, completed });
            }).join("")}

            ${UI.button("+ New Action", "primary-button", "App.openSheet()")}
            ${UI.addActionSheet()}
        </div>
        ${UI.bottomNav("today")}
        `;
    },

    identity() {
        return `
        <div class="container">
            <div class="hero">
                <p class="greeting">${Helpers.greeting()}</p>
                <h1 class="headline">Identity</h1>
                <p class="daily-quote">Who you are becoming shapes what you do.</p>
            </div>

            ${UI.identityDashboard()}
        </div>
        ${UI.bottomNav("identity")}
        `;
    },

    more() {
        return `
        <div class="container">
            <div class="hero">
                <p class="greeting">Settings</p>
                <h1 class="headline">More</h1>
                <p class="daily-quote">Manage your account and preferences.</p>
            </div>

            <div class="stat-card">
                <h3>Account</h3>
                <p>Signed in as:<br>${State.userEmail || ""}</p>
            </div>

            <div class="stat-card">
                <h3>Timezone</h3>
                <p>Current: ${State.userTimezone || "Auto-detected"}</p>
                <button class="secondary-button" onclick="App.openTimezoneSettings()">Change Timezone</button>
            </div>

            <div class="stat-card">
                <h3>Data</h3>
                <button class="secondary-button" onclick="App.exportData()">Export Data</button>
                <button class="danger-button" onclick="App.confirmDeleteAccount()">Delete Account</button>
            </div>

            <button class="danger-button" onclick="App.logout()">Logout</button>
        </div>
        ${UI.bottomNav("more")}
        `;
    },

    journal() {
        const today = Helpers.todayISO();
        const reflection = State.reflections.find(r => r.reflection_date === today && r.identity_id === State.currentIdentityId);

        return `
        <div class="container">
            <div class="hero">
                <p class="greeting">${Helpers.greeting()}</p>
                <h1 class="headline">Daily Reflection</h1>
                <p class="daily-quote">Reflection turns experience into insight.</p>
            </div>

            <div class="journal-card">
                <h3>Today's Reflection</h3>
                <form id="reflectionForm" onsubmit="App.saveReflection(event)">
                    <div class="form-group">
                        <label>What went well today?</label>
                        <textarea id="reflectionWin" placeholder="Celebrate your wins, big or small...">${Helpers.escapeHtml(reflection?.win || '')}</textarea>
                    </div>
                    <div class="form-group">
                        <label>What got in the way?</label>
                        <textarea id="reflectionChallenge" placeholder="Obstacles, friction, surprises...">${Helpers.escapeHtml(reflection?.challenge || '')}</textarea>
                    </div>
                    <div class="form-group">
                        <label>What will you do tomorrow?</label>
                        <textarea id="reflectionTomorrow" placeholder="One small adjustment...">${Helpers.escapeHtml(reflection?.tomorrow || '')}</textarea>
                    </div>
                    <button type="submit" class="primary-button">Save Reflection</button>
                </form>
            </div>

            ${reflection ? `
            <div class="stat-card">
                <h3>Previous Reflections</h3>
                ${UI.reflectionHistory()}
            </div>
            ` : ''}
        </div>
        ${UI.bottomNav("journal")}
        `;
    },

    calendar() {
        return `
        <div class="container">
            <div class="hero">
                <h1 class="headline">Your Progress</h1>
                <p class="daily-quote">Consistency creates identity.</p>
            </div>

            ${UI.stats()}
            ${UI.calendar()}
            ${UI.sectionHeader("History")}
            ${UI.historyTimeline()}
        </div>
        ${UI.bottomNav("calendar")}
        `;
    },

    learn() {
        const completed = (State.lessonProgress || []).map(p => p.lesson_id);
        const total = Lessons.length;
        const progress = total === 0 ? 0 : Math.round((completed.length / total) * 100);
        const nextLesson = Lessons.find(l => !completed.includes(l.id));
        const modules = [...new Set(Lessons.map(l => l.module))];

        return `
        <div class="container">
            <div class="hero">
                <p class="greeting">Atomic Habits Training</p>
                <h1 class="headline">Build better systems.</h1>
                <p class="daily-quote">Small changes create remarkable results.</p>
            </div>

            <div class="stat-card">
                <h3>Learning Progress</h3>
                <strong>${completed.length}/${total}</strong>
                <p>${progress}% completed</p>
            </div>

            ${nextLesson ? `
            <div class="stat-card">
                <h3>Continue Learning</h3>
                <p>Next: ${nextLesson.title}</p>
                <button class="primary-button" onclick="App.openLesson(${nextLesson.id})">Continue Lesson</button>
            </div>
            ` : `
            <div class="stat-card">
                <h3>Course Complete</h3>
                <p>You completed all 20 lessons.</p>
            </div>
            `}

            ${modules.map(module => `
            <div class="stat-card">
                <h3>${module}</h3>
                ${Lessons.filter(l => l.module === module).map(lesson => {
                    const unlocked = lesson.id === 1 || completed.includes(lesson.id) || completed.includes(lesson.id - 1);
                    return `
                    <div class="journal-card">
                        <h3>${lesson.id}. ${lesson.title}</h3>
                        <p>${Helpers.escapeHtml(lesson.principle)}</p>
                        <p><strong>Challenge:</strong> ${Helpers.escapeHtml(lesson.action)}</p>
                        <button class="${completed.includes(lesson.id) ? "secondary-button" : unlocked ? "primary-button" : "disabled-button"}"
                            onclick="${unlocked ? `App.openLesson(${lesson.id})` : ""}"
                            ${unlocked ? "" : "disabled"}>
                            ${completed.includes(lesson.id) ? "Review Lesson" : unlocked ? "Start Lesson" : "Locked"}
                        </button>
                    </div>
                    `;
                }).join("")}
            </div>
            `).join("")}

            ${UI.bottomNav("learn")}
        `;
    },

    onboarding() {
        return UI.onboarding();
    }

};

window.Pages = Pages;
