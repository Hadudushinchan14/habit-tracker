const Database = {

    async init() {

    const profile = await getProfile();
    const {
    data: { user }
    } = await supabaseClient.auth.getUser();

State.userEmail = user?.email || "";

    if (!profile) {
        return null;
    }

    State.profile.id = profile.id;
    State.profile.identity = null;

    await this.loadIdentities();

    if (State.identities.length) {
        State.currentIdentityId = State.identities[0].id;
        State.profile.identity = State.identities[0].name;
    }

    await this.loadActions();
    await this.loadHistory();
    await this.loadReflections();
    await this.loadLessonProgress();

    State.completedLessons =
    State.lessonProgress.map(p => p.lesson_id);

    },
    
    async loadActions() {

    if (!State.currentIdentityId) {
        State.actions = [];
        return;
    }

    const { data, error } = await supabaseClient
        .from("actions")
        .select("*")
        .eq("profile_id", State.profile.id)
        .eq("identity_id", State.currentIdentityId)
        .order("id");

    if (error) {
        console.error(error);
        return;
    }

    State.actions = data || [];

    },

  
    async loadHistory() {

        const { data } = await supabaseClient
            .from("history")
            .select("*")
            .eq("profile_id", State.profile.id)
            .eq("identity_id", State.currentIdentityId);

        State.history = data || [];

    },

    async loadLessonProgress(){

const { data, error } = await supabaseClient
.from("lesson_progress")
.select("*")
.eq("identity_id", State.currentIdentityId);


if(error){
console.error(error);
return;
}

    console.log("LESSON PROGRESS:", data);

State.lessonProgress = data || [];

},

    getCounterValue(actionId) {

    const today = new Date()
        .toISOString()
        .split("T")[0];

    const record = State.history.find(h =>
        h.action_id === actionId &&
        h.date === today
    );

    return record?.value ?? 0;

    },

   async loadReflections() {

    const { data, error } = await supabaseClient
        .from("reflections")
        .select("*")
        .eq("profile_id", State.profile.id)
        .eq("identity_id", State.currentIdentityId)

    if (error) {
        console.error(error);
        return;
    }

    State.reflections = data || [];

    },

    async loadIdentities() {

    const { data, error } = await supabaseClient
        .from("identities")
        .select("*")
        .eq("profile_id", State.profile.id)
        .order("created_at");

    if (error) {
        console.error(error);
        return;
    }

    State.identities = data || [];

    }

};

window.Database = Database;