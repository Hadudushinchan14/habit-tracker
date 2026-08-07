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
            <button 
                class="secondary-button"
                onclick="App.changeIdentity()"
            >
                Change Identity
            </button>

           ${UI.progressRing(
            State.history.filter(
            h => h.identity_id === State.currentIdentityId &&
             h.date === new Date().toISOString().split("T")[0]
            ).length,
            State.actions.length
            )}

            ${UI.sectionHeader(
            "Today's Votes",
            `<span>${
            State.history.filter(
            h => h.identity_id === State.currentIdentityId &&
            h.date === new Date().toISOString().split("T")[0]
            ).length
            } / ${State.actions.length}</span>`
            )}

            ${State.actions
.map(action => {

    const today = new Date()
        .toISOString()
        .split("T")[0];

            const completed = State.history.some(
                h =>
                h.action_id === action.id &&
                h.identity_id === State.currentIdentityId &&
                h.date === today
            );
            
            action.completed = completed;

            return UI.actionRow(action);

            })
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

        <div class="stat-card">

    <h3>
        Lessons Completed 📚
    </h3>

    <strong>
        ${(State.lessonProgress || []).length}/${Lessons.length}
    </strong>

    <p>
        Knowledge turned into action.
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


        ${State.identities.map(identity => `

<div class="identity-option">

    <div onclick="App.chooseIdentity('${identity.id}')">
        ${identity.name}
    </div>

    <button onclick="App.editIdentity('${identity.id}')">
        ✏️
    </button>

    <button onclick="App.deleteIdentity('${identity.id}')">
        🗑️
    </button>

</div>

`).join("")}


<div class="identity-option"
onclick="App.createIdentity()">

    ✨ Add Identity

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

        ${UI.stats()}

        ${UI.calendar()}
        
        ${UI.sectionHeader("History")}

        ${UI.historyTimeline()}

        ${UI.dayModal()}


    </div>


    ${UI.bottomNav("calendar")}

    `;


        },


   learn(){

const completed =
    (State.lessonProgress || [])
    .map(p => p.lesson_id);


const total =
    Lessons.length;


const progress =
    total === 0
    ? 0
    : Math.round(
        (completed.length / total) * 100
    );


const nextLesson =
    Lessons.find(
        l => !completed.includes(l.id)
    );


const modules = [
    ...new Set(
        Lessons.map(l => l.module)
    )
];

return `

<div class="container">

<div class="hero">

<p class="greeting">
Atomic Habits Training 📚
</p>

<h1 class="headline">
Build better systems.
</h1>

<p class="daily-quote">
Small changes create remarkable results.
</p>

   
</div>

<div class="stat-card">

<h3>
📚 Learning Progress
</h3>

<strong>
${completed.length}/${total}
</strong>

<p>
${progress}% completed
</p>

</div>

${nextLesson ? `

<div class="stat-card">

<h3>
Continue Learning 🌱
</h3>

<p>
Next: ${nextLesson.title}
</p>

<button
class="primary-button"
onclick="App.openLesson(${nextLesson.id})"
>
Continue Lesson
</button>

</div>

` : `

<div class="stat-card">

<h3>
🎉 Course Complete
</h3>

<p>
You completed all 20 lessons.
</p>

</div>

`}


${modules.map(module => `

<div class="stat-card">

<h3>
${module}
</h3>


${Lessons
.filter(l => l.module === module)
.map(lesson => {

const unlocked =
    lesson.id === 1 ||
    completed.includes(lesson.id) ||
    completed.includes(lesson.id - 1);

return `

<div class="journal-card">


<h3>
${lesson.id}. ${lesson.title}
</h3>


<p>
${lesson.principle}
</p>


<p>
<strong>
Challenge:
</strong>

${lesson.action}

</p>


<button
class="${
completed.includes(lesson.id)
? "secondary-button"
: unlocked
? "primary-button"
: "disabled-button"
}"
onclick="${
unlocked
? `App.openLesson(${lesson.id})`
: ""
}"
${unlocked ? "" : "disabled"}
>

${
completed.includes(lesson.id)
? "✓ Review Lesson"
: unlocked
? "Start Lesson"
: "🔒 Locked"
}

</button>


</div>


`;
})
.join("")}


</div>


`).join("")}


${UI.bottomNav("learn")}

`;

},



    

};

window.Pages = Pages;