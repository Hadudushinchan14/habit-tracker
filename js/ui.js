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

    actionRow(title, subtitle, completed = false, id) {

        return `

        <div class="action-card">

            <div>

                <h3>${title}</h3>

                <p>${subtitle}</p>

            </div>

           <button
            class="vote-button ${completed ? "completed" : ""}"
            onclick="App.toggleAction(${id})"
            >

            ${completed ? "✓" : "○"}

            </button>

        </div>

        `;

    },

    bottomNav(active = "today") {

    const items = [

        {
            id:"today",
            icon:"🏠",
            label:"Today"
        },

        {
            id:"journal",
            icon:"📖",
            label:"Journal"
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

        <div class="sheet-actions">

            <button
                class="primary-button"
                onclick="App.saveAction()"
            >
                Save
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
            `${year}-${String(month+1).padStart(2,"0")}-${String(i).padStart(2,"0")}`;


        html += `

            <div 
            class="calendar-day ${Calendar.isCompleted(date) ? "done" : ""}"
            onclick="App.openDay('${date}')"
            >

            ${i}

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

};

