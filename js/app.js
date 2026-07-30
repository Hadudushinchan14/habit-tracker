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

     openSheet(id = null) {

    State.editingActionId = id;

    const sheet = document.getElementById("addSheet");

    if (id) {

        const action = State.actions.find(a => a.id === id);

        document.getElementById("actionTitle").value =
            action.title;

        document.getElementById("actionSubtitle").value =
            action.subtitle || "";

        document.getElementById("deleteAction").style.display =
            "block";

    } else {

        document.getElementById("actionTitle").value = "";

        document.getElementById("actionSubtitle").value = "";

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

    if (!title) return;

    if (State.editingActionId) {

    const { error } = await supabaseClient
        .from("actions")
        .update({
            title,
            subtitle
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
                ? `✓ ${action.title}`
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