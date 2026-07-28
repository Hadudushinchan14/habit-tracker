const App = {

    currentPage: "today",

    render() {

    Storage.save(State);

    if(!State.profile.identity){

    document.getElementById("app").innerHTML =
        Pages.onboarding();

    return;

    }


    document.getElementById("app").innerHTML = `
<div style="
position:fixed;
top:20px;
right:20px;
background:red;
color:white;
padding:15px;
z-index:9999;
border-radius:10px;
font-size:20px;
">
CLOUD TEST 3 🚀
</div>

${Pages[this.currentPage]()}
`;

    },

    navigate(page) {
        this.currentPage = page;
        this.render();
    },


    toggleAction(id) {

    const action = State.actions.find(
        a => a.id === id
    );

    if (!action) return;


    action.completed = !action.completed;


    const today = new Date()
        .toISOString()
        .split("T")[0];


    const existing = State.history.find(
        h =>
        h.date === today &&
        h.actionId === id
    );


    if(action.completed){

        if(!existing){

            State.history.push({

                date: today,

                actionId:id,

                completed:true

            });

        }

    } else {

        State.history =
        State.history.filter(
            h =>
            !(h.date === today &&
              h.actionId === id)
        );

    }


    Storage.save(State);


    this.render();

    },

    openSheet() {

    const sheet = document.getElementById("addSheet");

    sheet.classList.remove("hidden");

    requestAnimationFrame(() => {
        sheet.classList.add("show");
    });

    },

closeSheet() {

    const sheet = document.getElementById("addSheet");

    sheet.classList.remove("show");

    setTimeout(() => {
        sheet.classList.add("hidden");
    },300);

    },

    saveAction() {

    const title = document
        .getElementById("actionTitle")
        .value
        .trim();

    const subtitle = document
        .getElementById("actionSubtitle")
        .value
        .trim();

    if (!title) return;

    State.actions.push({

        id: Date.now(),

        title,

        subtitle,

        completed: false

    });

    this.closeSheet();

    this.render();

    },

    saveReflection(){

    const reflection = {

        date:new Date().toISOString(),

        win:
        document.getElementById("winReflection").value,

        challenge:
        document.getElementById("challengeReflection").value,

        tomorrow:
        document.getElementById("tomorrowReflection").value

    };


    State.reflections.push(reflection);


    Storage.save(State);


    UI.showToast(
        "Reflection saved 🌱"
    );


    },

    chooseIdentity(identity){

    State.profile.identity = identity;

    Storage.save(State);

    this.navigate("today");

    },

    openDay(date){

    const entries = State.history.filter(
        h => h.date === date
    );


    const habits = entries.map(entry => {

        const action = State.actions.find(
            a => a.id === entry.actionId
        );

        return action
            ? action.title
            : "";

    });


    document.getElementById("dayModalTitle")
    .innerHTML = date;


    document.getElementById("dayModalContent")
    .innerHTML = habits.length

    ? habits.map(h => `
    
        <div class="modal-habit">
            ✓ ${h}
        </div>

    `).join("")

    : `
        <p>No habits completed</p>
    `;


    document
    .getElementById("dayModal")
    .classList.remove("hidden");

    },

    closeDayModal(){

    document
    .getElementById("dayModal")
    .classList.add("hidden");

    }
};

App.render();