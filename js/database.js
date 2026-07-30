const Database = {

    async init() {

    const profile = await getProfile();

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