const supabaseClient = window.supabase.createClient(
    "https://wjkqnoygmeymqiuatyyt.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqa3Fub3lnbWV5bXFpdWF0eXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMjM4MjksImV4cCI6MjEwMDc5OTgyOX0.ExZZZdRy87VIMdv6CuUYyLMuv2KPKs6em3fkqKtsl-E"
);

async function getUser() {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) { console.error("getUser error:", error); return null; }
    if (!data.user) return null;
    if (!data.user.email) { await supabaseClient.auth.signOut(); return null; }
    return data.user;
}

async function getProfile() {
    const user = await getUser();
    if (!user) return null;
    if (!user.email) return null;
    let { data: profile, error } = await supabaseClient
        .from("profiles")
        .upsert({ user_id: user.id, email: user.email, identity: null, timezone: State.userTimezone || 'UTC' }, { onConflict: "user_id", ignoreDuplicates: false })
        .select()
        .single();
    if (error) {
        if (error.code === 'PGRST204' || (error.message && error.message.includes('timezone'))) {
            // Timezone column missing in schema — retry without timezone
            console.warn("getProfile: timezone column missing, retrying without timezone");
            const retry = await supabaseClient
                .from("profiles")
                .upsert({ user_id: user.id, email: user.email, identity: null }, { onConflict: "user_id", ignoreDuplicates: false })
                .select()
                .single();
            profile = retry.data;
            error = retry.error;
        }
    }
    if (error) {
        console.error("getProfile upsert error:", error);
        const { data: existing } = await supabaseClient.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
        return existing;
    }
    if (profile && profile.timezone) State.userTimezone = profile.timezone;
    return profile;
}

async function getIdentities(profileId) {
    const { data, error } = await supabaseClient.from("identities").select(`*, actions (*)`).eq("profile_id", profileId);
    if (error) { console.error(error); return []; }
    return data;
}

async function login(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) { console.error("Login error:", error); return { error: error.message }; }
    return { user: data.user };
}

async function createAccount(email, password) {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) { console.error("SIGNUP ERROR:", error); return { error: error.message }; }
    console.log("SIGNUP SUCCESS:", data);
    return { user: data.user };
}

async function loginWithGoogle() {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) { console.error("Google login error:", error); return { error: error.message }; }
    return data;
}

async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) { console.error("Logout error:", error); return { error: error.message }; }
    return { success: true };
}

async function updateProfile(updates) {
    const user = await getUser();
    if (!user) return { error: "Not authenticated" };
    const { data, error } = await supabaseClient.from("profiles").update(updates).eq("user_id", user.id).select().single();
    if (error) { console.error("Update profile error:", error); return { error: error.message }; }
    return { data };
}

window.getProfile = getProfile;
window.supabaseClient = supabaseClient;
window.login = login;
window.createAccount = createAccount;
window.loginWithGoogle = loginWithGoogle;
window.getIdentities = getIdentities;
window.logout = logout;
window.updateProfile = updateProfile;
