const Database = {

    async init() {

        const profile = await getProfile();

        if (!profile) {
        console.error("Profile missing");
        return;
    }

State.profile.id = profile.id;
State.profile.identity = profile.identity;

        await this.loadActions();
        await this.loadHistory();
        await this.loadReflections();

    },

    async loadActions() {

        const { data } = await supabaseClient
            .from("actions")
            .select("*")
            .eq("profile_id", State.profile.id)
            .order("id");

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

        const { data } = await supabaseClient
            .from("reflections")
            .select("*")
            .eq("profile_id", State.profile.id);

        State.reflections = data || [];

    }

};