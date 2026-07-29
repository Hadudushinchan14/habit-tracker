const Database = {

    async init() {

        const profile = await getProfile();

         if (!profile) {
        return null;
        }

State.profile.id = profile.id;
State.profile.identity = null;
State.currentIdentityId = null;
        
        await this.loadIdentities();
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
            .eq("profile_id", State.profile.id);

        State.history = data || [];

    },

   async loadReflections() {

    const { data, error } = await supabaseClient
        .from("reflections")
        .select("*")
        .eq("profile_id", State.profile.id)
        .order("created_at", { ascending: false });

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