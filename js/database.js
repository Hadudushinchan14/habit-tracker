const Database = {

    async init() {
        State.loading.profile = true;
        try {
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

            if (State.currentIdentityId) {
                await Promise.all([
                    this.loadActions(),
                    this.loadHistory(),
                    this.loadReflections(),
                    this.loadLessonProgress()
                ]);
            }

            State.completedLessons =
                State.lessonProgress.map(p => p.lesson_id);

        } catch (error) {
            console.error("Database init error:", error);
            State.errors.profile = error.message;
        } finally {
            State.loading.profile = false;
        }
    },

    async loadActions() {
        State.loading.actions = true;
        try {
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
                State.errors.actions = error.message;
                return;
            }

            State.actions = data || [];
            State.errors.actions = null;
        } finally {
            State.loading.actions = false;
        }
    },

    async loadHistory() {
        State.loading.history = true;
        try {
            if (!State.currentIdentityId) {
                State.history = [];
                return;
            }

            const { data, error } = await supabaseClient
                .from("history")
                .select("*")
                .eq("profile_id", State.profile.id)
                .eq("identity_id", State.currentIdentityId);

            if (error) {
                console.error(error);
                State.errors.history = error.message;
                State.history = [];
                return;
            }

            State.history = data || [];
            State.errors.history = null;
        } finally {
            State.loading.history = false;
        }
    },

    async loadLessonProgress() {
        State.loading.lessonProgress = true;
        try {
            if (!State.currentIdentityId) {
                State.lessonProgress = [];
                return;
            }

            const { data, error } = await supabaseClient
                .from("lesson_progress")
                .select("*")
                .eq("identity_id", State.currentIdentityId);

            if (error) {
                console.error(error);
                State.errors.lessonProgress = error.message;
                return;
            }

            console.log("LESSON PROGRESS:", data);
            State.lessonProgress = data || [];
            State.errors.lessonProgress = null;
        } finally {
            State.loading.lessonProgress = false;
        }
    },

    getCounterValue(actionId) {
        const today = Helpers.todayISO();

        const record = State.history.find(h =>
            h.action_id === actionId &&
            h.date === today
        );

        return record?.value ?? 0;
    },

    async loadReflections() {
        State.loading.reflections = true;
        try {
            if (!State.currentIdentityId) {
                State.reflections = [];
                return;
            }

            const { data, error } = await supabaseClient
                .from("reflections")
                .select("*")
                .eq("profile_id", State.profile.id)
                .eq("identity_id", State.currentIdentityId);

            if (error) {
                console.error(error);
                State.errors.reflections = error.message;
                return;
            }

            State.reflections = data || [];
            State.errors.reflections = null;
        } finally {
            State.loading.reflections = false;
        }
    },

    async loadIdentities() {
        State.loading.identities = true;
        try {
            const { data, error } = await supabaseClient
                .from("identities")
                .select("*")
                .eq("profile_id", State.profile.id)
                .order("created_at");

            if (error) {
                console.error(error);
                State.errors.identities = error.message;
                return;
            }

            State.identities = data || [];
            State.errors.identities = null;
        } finally {
            State.loading.identities = false;
        }
    }
};

window.Database = Database;
