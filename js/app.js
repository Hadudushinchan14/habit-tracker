const App = {

    currentPage: "today",

    render() {

    
    if(!State.currentIdentityId){

    document.getElementById("app").innerHTML =
        Pages.onboarding();

    return;

    }


    document.getElementById("app").innerHTML =
    Pages[this.currentPage]();


    },

    navigate(page) {
        this.currentPage = page;
        this.render();
    },

    changeIdentity() {

    document.getElementById("app").innerHTML =
    Pages.onboarding();

    },

    async completeLesson(id){

    const lesson = Lessons.find(
        l => l.id === id
    );

    const alreadyCreated =
    State.actions.some(
        a => a.lesson_id === id
    );

if (alreadyCreated) {

    UI.showToast("Habit already created 🌱");

    this.navigate("today");

    return;

}

  
    if (!lesson) return;

    lesson.completed = true;

    this.render();

    },

    async createHabitFromLesson(id){

        
const lesson = Lessons.find(
    l => l.id === id
);


const responseInput =
document.getElementById("lessonResponse");

const response =
responseInput
? responseInput.value.trim()
: "";

const title =
lesson.action || response || lesson.title;


const subtitleInput =
document.getElementById("lessonSubtitle");

const subtitle =
subtitleInput
? subtitleInput.value.trim()
: "";


if(!title){

UI.showToast("Create your habit first");

return;

}


const { data, error } = await supabaseClient
.from("actions")
.insert({

profile_id: State.profile.id,

identity_id: State.currentIdentityId,

title:title,

subtitle:subtitle || lesson.title,

description: lesson.principle,

is_counter:false,

completed:false,

lesson_id: lesson.id,

lesson_title: lesson.title

})
.select()
.single();



if(error){

console.error(error);

UI.showToast("Failed creating habit");

return;

}


const { data: progressData, error: progressError } = await supabaseClient
.from("lesson_progress")
.upsert({
    profile_id: State.profile.id,
    identity_id: State.currentIdentityId,
    lesson_id: lesson.id,
    response: response
},{
    onConflict: "identity_id,lesson_id"
})

.select()
.single();

console.log("PROGRESS SAVED:", progressData);
console.log("PROGRESS ERROR:", progressError);

if (progressError) {
    console.error(progressError);
}

await Database.loadLessonProgress();

await Database.loadActions();

UI.showToast("Habit created 🌱");

this.navigate("today");

},



    openLesson(id){

    const page = UI.lessonDetail(id);

    document.getElementById("app").innerHTML = page;

    },


    async toggleAction(id) {

    const action = State.actions.find(
        a => a.id === id
    );

    if (!action) return;

    action.completed = !action.completed;

    const today = new Date()
        .toISOString()
        .split("T")[0];

    if (action.completed) {

        await supabaseClient
    .from("history")
    .upsert({
        profile_id: State.profile.id,
        identity_id: State.currentIdentityId,
        action_id: id,
        date: today,
        completed: true
    },{
    onConflict: "identity_id,action_id,date"
    });

    } else {

        await supabaseClient
    .from("history")
    .delete()
    .eq("profile_id", State.profile.id)
    .eq("identity_id", State.currentIdentityId)
    .eq("action_id", id)
    .eq("date", today);

    }

    await Database.loadHistory();

    this.render();

    UI.showToast(
    action.completed
    ? "🔥 Action completed"
    : "Action unchecked"
    );

    },

    async saveCounter(actionId, value) {

    const today = new Date()
        .toISOString()
        .split("T")[0];

    await supabaseClient
        .from("history")
        .upsert({
            profile_id: State.profile.id,
            identity_id: State.currentIdentityId,
            action_id: actionId,
            date: today,
            completed: value > 0,
            value: value
        }, {
            onConflict: "identity_id,action_id,date"
        });

    },

    changeCounter(id, amount) {

    const input = document.getElementById(`counter-${id}`);

    if (!input) return;

    let value = Number(input.value) || 0;

    value += amount;

    if (value < 0) value = 0;

    input.value = value;

    },

    async saveCounterFromInput(id) {

    const input = document.getElementById(`counter-${id}`);

    if (!input) return;

    const value = Math.max(0, Number(input.value) || 0);

    await this.saveCounter(id, value);

    await Database.loadHistory();

    this.render();

    UI.showToast("Counter saved 💪");

    },

     openSheet(id = null) {

    State.editingActionId = id;

    const sheet = document.getElementById("addSheet");

    if (id) {

        const action = State.actions.find(a => a.id === id);

        document.getElementById("actionTitle").value =
            action.title;

        document.getElementById("actionSubtitle").value =
    action.lesson_id ? "" : (action.subtitle || "");
        
        document.getElementById("actionDescription").value =
            action.description || "";

        document.getElementById("actionIsCounter").checked =
            action.is_counter || false;

        document.getElementById("deleteAction").style.display =
            "block";

    } else {

        document.getElementById("actionTitle").value = "";

        document.getElementById("actionSubtitle").value = "";

        document.getElementById("actionDescription").value = "";

        document.getElementById("actionIsCounter").checked = false;

        document.getElementById("deleteAction").style.display =
            "none";

    }

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

   async saveAction() {

    const title = document
        .getElementById("actionTitle")
        .value
        .trim();

    const subtitle = document
        .getElementById("actionSubtitle")
        .value
        .trim();

    const description = document
        .getElementById("actionDescription")
        .value
        .trim();

    const isCounter = document
        .getElementById("actionIsCounter")
        .checked;

    if (!title) return;

    if (State.editingActionId) {

    const { error } = await supabaseClient
        .from("actions")
        .update({
            title,
            subtitle,
            description,
            is_counter: isCounter
})
        .eq("id", State.editingActionId);

    if (error) {
        console.error(error);
        return;
    }

} else {

    const { error } = await supabaseClient
         .from("actions")
         .insert({
         profile_id: State.profile.id,
         title: title,
         subtitle: subtitle,
         description: description,
         is_counter: isCounter,
         completed: false,
         identity_id: State.currentIdentityId
});
        

    if (error) {
        console.error(error);
        return;
    }

}
    State.editingActionId = null;

    await Database.loadActions();

    this.closeSheet();

    this.render();

    },

    async deleteAction() {

    if (!State.editingActionId) return;

    const { error } = await supabaseClient
        .from("actions")
        .delete()
        .eq("id", State.editingActionId);

    if (error) {
        console.error(error);
        return;
    }

    State.editingActionId = null;

    await Database.loadActions();

    this.closeSheet();

    this.render();

    },

    async saveReflection() {

    const today = new Date()
    .toISOString()
    .split("T")[0];


const reflection = {

    profile_id: State.profile.id,

    identity_id: State.currentIdentityId,

    reflection_date: today,

    win: document.getElementById("winReflection").value,

    challenge: document.getElementById("challengeReflection").value,

    tomorrow: document.getElementById("tomorrowReflection").value

};
    const { data, error } = await supabaseClient
    .from("reflections")
    .upsert(reflection,{
        onConflict: "identity_id,reflection_date"
    })
    .select()
    .single();

    if (error) {
        console.error(error);
        return;
    }

    State.reflections.unshift(data);

    UI.showToast("Reflection saved 🌱");

},

    async createIdentity() {

    const name = prompt("Identity name:");

    if (!name) return;


    const { data, error } = await supabaseClient
        .from("identities")
        .insert({
            profile_id: State.profile.id,
            name: name
        })
        .select()
        .single();


    if (error) {
        console.error(error);
        return;
    }


    State.identities.push(data);

    State.currentIdentityId = data.id;
    State.profile.identity = data.name;

    await Database.loadActions();
    await Database.loadHistory();
    await Database.loadReflections();
    await Database.loadLessonProgress();

    this.navigate("today");

    },

    async chooseIdentity(identityId) {

        const identity = State.identities.find(
        i => i.id === identityId
    );

         if (!identity) return;

    State.currentIdentityId = identity.id;

    State.profile.identity = identity.name;

    
    await Database.loadActions();
    await Database.loadHistory();
    await Database.loadReflections();
    await Database.loadLessonProgress();

    this.navigate("today");

    
    },

    async editIdentity(identityId) {

        const identity = State.identities.find(
        i => i.id === identityId
    );

          if (!identity) return;

    const name = prompt(
        "Edit identity name:",
        identity.name
    );

    if (!name || name === identity.name) return;


    const { error } = await supabaseClient
        .from("identities")
        .update({
            name
        })
        .eq("id", identityId);


    if (error) {
        console.error(error);
        return;
    }


    await Database.loadIdentities();

    this.render();

    },


async deleteIdentity(identityId) {

    const identity = State.identities.find(
        i => i.id === identityId
    );

    if (!identity) return;


    const confirmDelete = confirm(
        `Delete "${identity.name}"?`
    );

    if (!confirmDelete) return;


    const { error } = await supabaseClient
        .from("identities")
        .delete()
        .eq("id", identityId);


    if (error) {
        console.error(error);
        return;
    }


    if (State.currentIdentityId === identityId) {
        State.currentIdentityId = null;
    }


    await Database.loadIdentities();

    this.render();

    },

    async logout() {

    const confirmLogout = confirm(
        "Are you sure you want to log out?"
    );

    if (!confirmLogout) return;

    const { error } =
        await supabaseClient.auth.signOut();

    if (error) {
        console.error(error);
        UI.showToast("Logout failed");
        return;
    }

    location.reload();

    },

    saveNote(){

const input =
document.getElementById("habitNote");


const note =
input.value.trim();


if(!note) return;


State.notes.unshift(note);


input.value = "";


this.render();


UI.showToast("Note saved 🌱");

    },

    openDay(date){

        const actions = State.history
        .filter(h =>
        h.date === date &&
        h.identity_id === State.currentIdentityId
        )
        .map(h => {

            const action = State.actions.find(
                a => a.id === h.action_id
            );

            return action
                    ? action.is_counter
                    ? `🔢 ${action.title}: ${h.value ?? 0}`
                    : `✓ ${action.title}`
                : null;

        })
        .filter(Boolean);


    const reflection = State.reflections.find(r =>
    r.reflection_date === date &&
    r.identity_id === State.currentIdentityId
    );


    document.getElementById("dayModalTitle")
        .innerHTML = date;


    document.getElementById("dayModalContent")
        .innerHTML = `
            ${
            actions.length
            ?
            actions.map(a => `
                <div class="modal-habit">
                    ${a}
                </div>
            `).join("")
            :
            "<p>No completed actions</p>"
            }


            ${
            reflection
            ?
            `
            <div class="modal-reflection">

                <h3>Reflection</h3>

                <p>
                <strong>Win:</strong><br>
                ${reflection.win || ""}
                </p>

                <p>
                <strong>Challenge:</strong><br>
                ${reflection.challenge || ""}
                </p>

                <p>
                <strong>Tomorrow:</strong><br>
                ${reflection.tomorrow || ""}
                </p>

            </div>
            `
            :
            ""
            }
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

   if ("serviceWorker" in navigator) {

    navigator.serviceWorker
        .register("./service-worker.js")
        .then(registration => {

            registration.addEventListener("updatefound", () => {

                const newWorker = registration.installing;

                if (!newWorker) return;

                newWorker.addEventListener("statechange", () => {

                    if (
                        newWorker.state === "installed" &&
                        navigator.serviceWorker.controller
                    ) {
                        UI.showUpdateBanner(newWorker);
                    }

                });

            });

        });

    navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => {
            window.location.reload();
        }
    );

}





 window.App = App;

(async () => {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {

        document.getElementById("app").innerHTML =
            UI.loginPage();

        return;

    }

    await Database.init();

    App.render();

})();