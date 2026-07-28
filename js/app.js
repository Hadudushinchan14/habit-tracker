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


       this.render();

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


   
    UI.showToast(
        "Reflection saved 🌱"
    );


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