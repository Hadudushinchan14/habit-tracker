const supabaseClient = window.supabase.createClient(
    "https://wjkqnoygmeymqiuatyyt.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqa3Fub3lnbWV5bXFpdWF0eXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMjM4MjksImV4cCI6MjEwMDc5OTgyOX0.ExZZZdRy87VIMdv6CuUYyLMuv2KPKs6em3fkqKtsl-E"
);

async function getUser() {

    const { data } =
        await supabaseClient.auth.getUser();

    if (!data.user) {
        return null;
    }

    if (!data.user.email) {
        await supabaseClient.auth.signOut();
        return null;
    }

    return data.user;

}

async function getProfile() {

    const user = await getUser();

    if (!user) return null;

    if (!user.email) {
    return null;
}

    let { data: profile } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!profile) {

        const { data, error } = await supabaseClient
            .from("profiles")
            .insert({
            user_id: user.id,
            email: user.email,
            identity: null
        })
            .select()
            .single();

        if (error) {
            console.error(error);
            return null;
        }

        profile = data;
    }

            return profile;

}

async function getIdentities(profileId) {

    const { data, error } = await supabaseClient
        .from("identities")
        .select(`
            *,
            actions (*)
        `)
        .eq("profile_id", profileId);

    if (error) {
        console.error(error);
        return [];
    }

    return data;
}


async function login(email, password) {

    console.log("LOGIN CALLED", email, password);
    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

    if (error) {
        alert(error.message);
        console.error(error);
        return null;
    }

    return data.user;

}


async function createAccount(email, password) {

    const { data, error } =
        await supabaseClient.auth.signUp({
            email,
            password
        });

    if (error) {
        console.error("SIGNUP ERROR:", error);
        return null;
    }

    console.log("SIGNUP SUCCESS:", data);

    return data.user;

}

async function loginWithGoogle() {

    const { data, error } =
        await supabaseClient.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin
            }
        });


    if (error) {
        console.error(error);
        return null;
    }

    return data;

}


window.getProfile = getProfile;
window.supabaseClient = supabaseClient;
window.login = login;
window.createAccount = createAccount;
window.loginWithGoogle = loginWithGoogle;
window.getIdentities = getIdentities;