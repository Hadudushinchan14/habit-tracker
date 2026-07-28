const supabaseClient = window.supabase.createClient(
    "https://wjkqnoygmeymqiuatyyt.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqa3Fub3lnbWV5bXFpdWF0eXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMjM4MjksImV4cCI6MjEwMDc5OTgyOX0.ExZZZdRy87VIMdv6CuUYyLMuv2KPKs6em3fkqKtsl-E"
);

async function getUser() {

    const { data } =
        await supabaseClient.auth.getUser();

    if (data.user) {
        return data.user;
    }

    return null;

}

async function getProfile() {

    const user = await getUser();

    if (!user) return null;

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


async function login(email, password) {

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

    if (error) {
        console.error(error);
        return null;
    }

    return data.user;

}


async function signup(email, password) {

    const { data, error } =
        await supabaseClient.auth.signUp({
            email,
            password
        });

    if (error) {
        console.error(error);
        return null;
    }

    return data.user;

}


window.getProfile = getProfile;
window.supabaseClient = supabaseClient;
window.login = login;
window.signup = signup;
window.loginWithGoogle = loginWithGoogle;