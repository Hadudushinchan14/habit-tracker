const Pages = {

    today() {

        return `

        <div class="container">

            <div class="hero">

                <p class="greeting">
                ${Helpers.greeting()}
                </p>

                <h1 class="headline">
                    Who are you becoming today?
                </h1>

                <p class="daily-quote">
                ${Helpers.quote()}
                </p>

            </div>

            ${UI.identityCard(State.profile.identity)}
            ${UI.progressRing(
            State.actions.filter(a => a.completed).length,
            State.actions.length
            )}

            ${UI.sectionHeader(
            "Today's Votes",
            `<span>${State.actions.filter(a => a.completed).length} / ${State.actions.length}</span>`
)}

            ${State.actions
            .map(action =>
            UI.actionRow(
            action.title,
            action.subtitle,
            action.completed,
            action.id
        )
    )
    .join("")}

            ${UI.button(
            "+ New Action",
            "primary-button",
            "App.openSheet()"
            )}
            ${UI.addActionSheet()}

        </div>

        ${UI.bottomNav("today")}

        `;

    },

    journal() {

    return `

    <div class="container">

        <h1>Journal</h1>

        <p>
            Daily reflection coming soon.
        </p>

    </div>

    ${UI.bottomNav("journal")}

    `;

    },

    identity() {

    return `

    <div class="container">

        <h1>Identity</h1>

        <p>
            Identity dashboard coming soon.
        </p>

    </div>

    ${UI.bottomNav("identity")}

    `;

    },

    more() {

    return `

    <div class="container">

        <h1>More</h1>

        <p>
            Settings coming soon.
        </p>

    </div>

    ${UI.bottomNav("more")}

    `;

    },

    identity() {

    return `

    <div class="container">

        <div class="hero">

            <p class="greeting">
                Your Journey 🌱
            </p>

            <h1 class="headline">
                Who you are becoming
            </h1>

            <p class="daily-quote">
                Your identity grows from the actions
                you repeat.
            </p>

        </div>


        <div class="identity-card">

            <div class="identity-label">
                CURRENT IDENTITY
            </div>

            <div class="identity-title">
                ${State.profile.identity}
            </div>

            <div class="identity-quote">
                Every completed action strengthens
                this identity.
            </div>

        </div>


        ${UI.sectionHeader(
            "Evidence",
            ""
        )}


        <div class="stat-card">

            <h3>
                Votes Cast
            </h3>

            <strong>
                ${State.actions.filter(
                    a => a.completed
                ).length}
            </strong>

            <p>
                Actions that prove who you are becoming.
            </p>

        </div>


        <div class="stat-card">

            <h3>
                Current Focus
            </h3>

            <strong>
                ${State.actions.length}
            </strong>

            <p>
                Habits you're building.
            </p>

        </div>


    </div>


    ${UI.bottomNav("identity")}

    `;

    },

    journal(){

    return `

    <div class="container">

        <div class="hero">

            <p class="greeting">
            ${Helpers.greeting()}
            </p>

            <h1 class="headline">
                Reflect on Today
            </h1>

            <p class="daily-quote">
            Reflection turns actions into identity.
            </p>

        </div>


        ${UI.sectionHeader("Today's Reflection")}


        <div class="journal-card">

            <label>
                What went well today?
            </label>

            <textarea
                id="winReflection"
                placeholder="A small victory..."
            ></textarea>

        </div>


        <div class="journal-card">

            <label>
                What was difficult?
            </label>

            <textarea
                id="challengeReflection"
                placeholder="Something I can improve..."
            ></textarea>

        </div>


        <div class="journal-card">

            <label>
                Tomorrow's vote
            </label>

            <textarea
                id="tomorrowReflection"
                placeholder="One action I will take..."
            ></textarea>

        </div>


        ${UI.button(
    "Save Reflection",
    "primary-button",
    "App.saveReflection()"
        )}


    </div>


    ${UI.bottomNav("journal")}

    `;

    },

    onboarding(){

    return `

    <div class="container">

        <div class="hero">

            <h1 class="headline">
                Who are you becoming?
            </h1>

            <p class="daily-quote">
                Your habits are proof of your identity.
            </p>

        </div>


        <div class="identity-option"
        onclick="App.chooseIdentity('A Healthier Person')">

            🌱 A Healthier Person

        </div>


        <div class="identity-option"
        onclick="App.chooseIdentity('A Disciplined Person')">

            🔥 A Disciplined Person

        </div>


        <div class="identity-option"
        onclick="App.chooseIdentity('A Focused Creator')">

            🚀 A Focused Creator

        </div>


        <div class="identity-option"
        onclick="App.chooseIdentity('Custom')">

            ✨ My Own Identity

        </div>


    </div>

    `;

    },

    calendar(){

    return `

    <div class="container">

        <div class="hero">

            <h1 class="headline">
                Your Progress 📅
            </h1>

            <p class="daily-quote">
                Consistency creates identity.
            </p>

        </div>


        ${UI.calendar()}


    </div>


    ${UI.bottomNav("calendar")}

    `;

    },



    

};
