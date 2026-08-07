const UI = {

   button(label, className = "primary-button", action = "") {

    return `
        <button
            class="${className}"
            onclick="${action}"
        >
            ${label}
        </button>
    `;

},

    sectionHeader(title, right = "") {

        return `
            <div class="section-header">

                <h2>${title}</h2>

                ${right}

            </div>
        `;

    },

    identityCard(identity) {

        return `

        <div class="identity-card">

            <div class="identity-label">
                WHO ARE YOU BECOMING?
            </div>

            <div class="identity-title">
                ${identity}
            </div>

            <div class="identity-quote">
                Every action today is another vote
                for your future self.
            </div>

        </div>

        `;

    },

    actionRow(action){

    const {
        id,
        title,
        subtitle,
        completed,
        is_counter
    } = action;

    const counterValue = Database.getCounterValue(id);

    return `

        <div class="action-card ${completed ? "completed" : ""}">

            <div>

                <h3>${title}</h3>

                <p>
                    ${action.description || subtitle || ""}
                </p>

${
action.lesson_title
?
`
<small class="habit-source">
Created from: ${action.lesson_title}
</small>
`
:
""
}

            </div>

            <button
            class="edit-button"
            onclick="App.openSheet(${id})"
            >
            ✏️
            </button>

           ${is_counter ? `
            <div class="counter-box">

            <button onclick="App.changeCounter(${id}, -1)">-</button>

            <input
                id="counter-${id}"
                type="number"
                value="${counterValue}"
    >

            <button onclick="App.changeCounter(${id}, 1)">+</button>

            <button onclick="App.saveCounterFromInput(${id})">
                Save
            </button>

        </div>
        ` : `
        <button
            class="vote-button ${completed ? "completed" : ""}"
            onclick="App.toggleAction(${id})"
        >
            ${completed ? "✓" : "○"}
        </button>
        `},

        </div>

        `;

    },

    bottomNav(active = "Daily") {

    const items = [

        {
            id:"today",
            icon:"🏠",
            label:"Today"
        },

        {
            id: "learn",
            icon: "📚",
            label: "Learn"
        },

        {
            id:"journal",
            icon:"📖",
            label:"Diary"
        },

        {
            id:"identity",
            icon:"🌱",
            label:"Identity"
        },

        {
            id:"calendar",
            icon:"📅",
            label:"Calendar"
        },

        {
            id:"more",
            icon:"⚙️",
            label:"More"
        }

    ];

    return `

    <nav class="bottom-nav">

        ${items.map(item=>`

            <button
            class="nav-item ${active === item.id ? "active" : ""}"
            onclick="App.navigate('${item.id}')"
>

            <span class="nav-icon">
             ${item.icon}
         </span>

        <span class="nav-label">
        ${item.label}
            </span>

            </button>

        `).join("")}

    </nav>

    `;

    },

    journalPage() {

    return `

    <div class="container">

        <div class="hero">

            <p class="greeting">
                Good Evening 🌙
            </p>

            <h1 class="headline">

                Reflect on Today

            </h1>

            <p class="daily-quote">

                Growth begins with honest reflection.

            </p>

        </div>

        ${this.sectionHeader("Today's Reflection")}

        <div class="journal-card">

            <label>

                What went well today?

            </label>

            <textarea
                placeholder="Small wins matter..."
            ></textarea>

        </div>

        <div class="journal-card">

            <label>

                What got in the way?

            </label>

            <textarea
                placeholder="Be honest..."
            ></textarea>

        </div>

        <div class="journal-card">

            <label>

                One promise for tomorrow

            </label>

            <textarea
                placeholder="Tomorrow I will..."
            ></textarea>

        </div>

        ${this.button("Save Reflection")}

    </div>

    ${this.bottomNav("journal")}

    `;

    },

    addActionSheet() {

    return `

    <div id="addSheet" class="bottom-sheet hidden">

        <div class="sheet-handle"></div>

        <h2>New Action</h2>

        <input
            id="actionTitle"
            type="text"
            placeholder="Action name"
        >

        <input
            id="actionSubtitle"
            type="text"
            placeholder="Why does this matter?"
        >

        <textarea
            id="actionDescription"
            placeholder="Description"
        ></textarea>

        <label class="counter-toggle">
            <input
                id="actionIsCounter"
                type="checkbox"
            >
            Counter
        </label>

        <div class="sheet-actions">

            <button
                class="primary-button"
                type="button"
                onclick="App.saveAction()"
            >
                Save
            </button>

              <button
        id="deleteAction"
        class="danger-button"
        type="button"
        onclick="App.deleteAction()"
        style="display:none;"
            >
             Delete
            </button>

            <button
                class="secondary-button"
                onclick="App.closeSheet()"
            >
                Cancel
            </button>

        </div>

    </div>

    `;

    },

    showToast(message){

    const toast =
        document.createElement("div");

    toast.className="toast";

    toast.innerText=message;

    document.body.appendChild(toast);


    setTimeout(()=>{

        toast.remove();

    },2000);

    },

    showUpdateBanner(worker){

    const banner = document.createElement("div");

    banner.className = "update-banner";

    banner.innerHTML = `
        <span>
            🚀 New version available
        </span>

        <button id="updateApp">
            Update
        </button>
    `;

    document.body.appendChild(banner);

    document
        .getElementById("updateApp")
        .onclick = () => {

            worker.postMessage("SKIP_WAITING");

        };

    },

    progressRing(completed, total) {

    const percent = total === 0
        ? 0
        : Math.round((completed / total) * 100);


    return `

    <div class="progress-card">

            <div 
            class="progress-ring"
            style="--progress:${percent * 3.6}deg"
            >

            <div class="progress-number">
                ${percent}%
            </div>

        </div>


        <h3>
            ${completed} of ${total} votes cast
        </h3>


        <p>
            Every action strengthens your identity.
        </p>


    </div>

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


const modules = [
    ...new Set(
        Lessons.map(l => l.module)
    )
];


return `

<div class="container">

<div class="hero">

<p class="greeting">
Learn 🌱
</p>

<h1 class="headline">
Atomic Habits Training
</h1>

<p class="daily-quote">
Build your identity one action at a time.
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



${modules.map(module=>`

<div class="learn-module">

<h2>
${module}
</h2>


${Lessons
.filter(l => l.module === module)
.map(lesson=>`

<div class="journal-card 
${completed.includes(lesson.id) ? "completed" : ""}"
>


<h3>
${lesson.id}. ${lesson.title}
</h3>


<p>
${lesson.principle}
</p>


<div class="lesson-action">

<strong>
Challenge:
</strong>

${lesson.action}

</div>


<button
class="${completed.includes(lesson.id)
? "secondary-button"
: "primary-button"}"

onclick="App.openLesson(${lesson.id})"

>

${completed.includes(lesson.id)
? "✓ Completed"
: "Complete Lesson"}

</button>


</div>


`).join("")}


</div>


`).join("")}



</div>


${UI.bottomNav("learn")}

`;

    },

    calendar(){

    const now = new Date();

    const year = now.getFullYear();

    const month = now.getMonth();

    const days =
        new Date(year, month + 1, 0)
        .getDate();


    let html = "";


    for(let i = 1; i <= days; i++){

        const date =
        `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

        const total = State.history
    .filter(h =>
        h.date === date &&
        h.identity_id === State.currentIdentityId
    )
    .reduce((sum, h) => sum + (h.value || 0), 0);

html += `
<div
    class="calendar-day ${Calendar.isCompleted(date) ? "done" : ""}"
    onclick="App.openDay('${date}')"
>

    <div>${i}</div>

    ${total > 0
        ? `<small>${total}</small>`
        : ""
    }

</div>
`;

    }


    return `

    <div class="calendar-card">

        <h2>
            ${now.toLocaleString(
                "default",
                {month:"long"}
            )} ${year}
        </h2>


        <div class="calendar-grid">

        <div class="weekday">M</div>
        <div class="weekday">T</div>
        <div class="weekday">W</div>
        <div class="weekday">T</div>
        <div class="weekday">F</div>
        <div class="weekday">S</div>
        <div class="weekday">S</div>

        ${html}

        </div>

    </div>

    `;

    },

    historyTimeline() {

    if (!State.history.length && !State.reflections.length) {

        return `
            <div class="empty-state">
                No history yet.
            </div>
        `;

    }


    const identityHistory = State.history
    .filter(h => h.identity_id === State.currentIdentityId);

const dates = [
    ...new Set([
        ...identityHistory.map(h => h.date),
        ...State.reflections.map(r =>
            r.created_at.split("T")[0]
        )
        ])
        ]
        .sort((a,b) => b.localeCompare(a));


    return dates.map(date => {

            const actions = identityHistory
    .filter(h => h.date === date)
    .map(h => {

        const action = State.actions.find(
            a => a.id === h.action_id
        );

        if(!action) return "";

        return action.is_counter

?
`
<div>
➕ ${action.title}: ${h.value}
</div>
`

:

`
<div>
✓ ${action.title}

${
action.lesson_title
?
`<small>Built from: ${action.lesson_title}</small>`
:
""
}

</div>
`;

        })
        .join("");


            const reflection = State.reflections.find(r =>
            r.reflection_date === date &&
            r.identity_id === State.currentIdentityId
        );

        return `

        <div class="history-card">

            <div class="history-date">
                ${date}
            </div>


            <div class="history-actions">

                ${actions || "No completed actions"}

            </div>


            ${
            reflection
            ? `

            <div class="history-reflection">

                <h4>Reflection</h4>

                <p>
                <strong>Win:</strong>
                ${reflection.win || ""}
                </p>

                <p>
                <strong>Challenge:</strong>
                ${reflection.challenge || ""}
                </p>

                <p>
                <strong>Tomorrow:</strong>
                ${reflection.tomorrow || ""}
                </p>

            </div>

            `
            : ""
            }


        </div>

        `;


    }).join("");

    },

        stats() {

    const completedDates = [
    ...new Set(
        State.history
        .filter(h => h.identity_id === State.currentIdentityId)
        .map(h => h.date)
    )
]
    .sort();


    let currentStreak = 0;

    let checkDate = new Date();

const today = checkDate
    .toISOString()
    .split("T")[0];

if(!completedDates.includes(today)){

    checkDate.setDate(
        checkDate.getDate() - 1
    );

    }


    while(true){

        const date = checkDate
            .toISOString()
            .split("T")[0];


        if(completedDates.includes(date)){

            currentStreak++;

            checkDate.setDate(
                checkDate.getDate() - 1
            );

        } else {

            break;

        }

    }


    let bestStreak = 0;
    let tempStreak = 0;


    completedDates.forEach((date, index) => {

        if(index === 0){

            tempStreak = 1;

        } else {

            const previous = new Date(
                completedDates[index - 1]
            );

            const current = new Date(date);


            const diff =
                (current - previous)
                /
                (1000 * 60 * 60 * 24);


            if(diff === 1){

                tempStreak++;

            } else {

                tempStreak = 1;

            }

        }


        if(tempStreak > bestStreak){

            bestStreak = tempStreak;

        }

    });


    const uniqueHistory = [
    ...new Map(
        State.history
        .filter(h => h.identity_id === State.currentIdentityId)
        .map(h => [
            `${h.date}-${h.action_id}`,
            h
        ])
    ).values()
    ];


const totalPossible =
    State.actions.length *
    completedDates.length;


const completion =
    totalPossible === 0
    ? 0
    : Math.min(
        100,
        Math.round(
            (uniqueHistory.length / totalPossible) * 100
        )
    );


    return `

    <div class="stats-grid">


        <div class="stat-card">

            <h3>
            🔥 Current Streak
            </h3>

            <strong>
            ${currentStreak}
            </strong>

            <p>
            Days consistent
            </p>

        </div>


        <div class="stat-card">

            <h3>
            🏆 Best Streak
            </h3>

            <strong>
            ${bestStreak}
            </strong>

            <p>
            Personal record
            </p>

        </div>


        <div class="stat-card">

            <h3>
            ✅ Completion
            </h3>

            <strong>
            ${completion}%
            </strong>

            <p>
            Habit consistency
            </p>

        </div>


    </div>

    `;

    },

        dayModal() {

return `

<div id="dayModal" class="modal hidden">

    <div class="modal-card">

        <button 
        class="modal-close"
        onclick="App.closeDayModal()">
            ✕
        </button>


        <h2 id="dayModalTitle"></h2>


        <div id="dayModalContent"></div>


    </div>

</div>

    `;

    },

        loginPage() {

return `

<div class="login-page">

    <img 
    class="login-logo"
    src="assets/icons/icon-192.png"
    alt="Logo"
>

<h1>Identity OS</h1>

    <p class="login-subtitle">
        Build your identity one day at a time.
    </p>

    <input
        id="loginEmail"
        type="email"
        placeholder="Email"
    >

    <input
        id="loginPassword"
        type="password"
        placeholder="Password"
    >

    <button
        class="primary-button"
        onclick="UI.login()"
    >
        Login
    </button>

            
    <button
        class="secondary-button"
        onclick="UI.openSignup()"
    >
        Create Account
    </button>

    <button
        class="google-btn"
        onclick="loginWithGoogle()"
    >
        Continue with <span class="google-brand">Google</span>
    </button>

    ${this.signupSheet()}

</div>

`;

},

    

    openSignup() {

        
    const sheet =
        document.getElementById("signupSheet");

    sheet.classList.remove("hidden");
    sheet.classList.add("show");

    setTimeout(() => {
        sheet.classList.add("show");
     }, 10);

},


closeSignup() {

    const sheet =
        document.getElementById("signupSheet");

    sheet.classList.add("hidden");
    sheet.classList.add("hidden");

    setTimeout(() => {
        sheet.classList.add("hidden");
    }, 250);

    },

   async login() {

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        UI.showToast("Enter email and password.");
        return;
    }

    const user = await window.login(email, password);

    if (user) {
        location.reload();
    }

},



async signup() {

    const email =
        document.getElementById("signupEmail")
        .value
        .trim();

    const password =
        document.getElementById("signupPassword")
        .value
        .trim();

    const confirm =
        document.getElementById("signupConfirm")
        .value
        .trim();


    console.log({ email, password });


    if (!email) {
        UI.showToast("Enter your email.");
        return;
    }


    if (!password) {
        UI.showToast("Enter your password.");
        return;
    }


    if (password !== confirm) {
        UI.showToast("Passwords do not match.");
        return;
    }


    const user = await createAccount(email, password);


    if (user) {

        UI.showToast(
            "Account created. Check your email."
        );

        this.closeSignup();

    }

    },

    signupSheet() {

return `

<div id="signupSheet" class="bottom-sheet">

    <div class="sheet-handle"></div>

    <h2>
        Create Account
    </h2>

    <input
        id="signupEmail"
        type="email"
        placeholder="Email"
    >

    <input
        id="signupPassword"
        type="password"
        placeholder="Password"
    >

    <input
        id="signupConfirm"
        type="password"
        placeholder="Confirm Password"
    >

    <div class="sheet-actions">

        <button
            class="primary-button"
            onclick="UI.signup()"
        >
            Create Account
        </button>

        <button
            class="secondary-button"
            onclick="UI.closeSignup()"
        >
            Cancel
        </button>

    </div>

</div>

`;

},



    lessonDetail(id){

const lesson = Lessons.find(
    l => l.id === id
);

const progress =
    (State.lessonProgress || [])
    .find(
        p => p.lesson_id === id
    );

const savedResponse =
    progress?.response || "";

if(!lesson) return "";


let exercise = "";


if(lesson.type === "identity"){

exercise = `

<input
id="lessonResponse"
class="lesson-input"
value="${savedResponse}"
placeholder="I am becoming someone who..."
>

`;

}


if(lesson.type === "reflection"){

exercise = `

<textarea
id="lessonResponse"
class="lesson-input"
placeholder="Write your reflection..."
></textarea>

`;

}


if(lesson.type === "habit"){

exercise = `

<input
id="lessonResponse"
class="lesson-input"
placeholder="My new habit..."
>


<input
id="lessonSubtitle"
class="lesson-input"
placeholder="Why does this matter?"
>

`;

}


if(lesson.type === "challenge"){

exercise = `

<label class="challenge-box">

<input
type="checkbox"
id="lessonChallenge"
>

I completed this challenge

</label>

`;

}



return `

<div class="container">


<div class="hero">

<p class="greeting">
${lesson.module}
</p>


<h1 class="headline">
${lesson.title}
</h1>


<p class="daily-quote">
Lesson ${lesson.id} of ${Lessons.length}
</p>

</div>



<div class="stat-card">

<h3>
💡 Principle
</h3>

<p>
${lesson.principle}
</p>

</div>



<div class="journal-card">

<h3>
🎯 Challenge
</h3>

<p>
${lesson.action}
</p>


${exercise}


</div>


${
lesson.type === "habit"

?

`
<button

class="primary-button"

onclick="App.createHabitFromLesson(${lesson.id})"

>
Create Habit
</button>
`

:

`
<button
class="primary-button"
onclick="App.createHabitFromLesson(${lesson.id})"
>
Create Habit From Lesson
</button>
`

}



</div>


${UI.bottomNav("learn")}

`;

}


};

