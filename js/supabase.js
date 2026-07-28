const supabaseClient = window.supabase.createClient(
    "https://wjkqnoygmeymqiuatyyt.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqa3Fub3lnbWV5bXFpdWF0eXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMjM4MjksImV4cCI6MjEwMDc5OTgyOX0.ExZZZdRy87VIMdv6CuUYyLMuv2KPKs6em3fkqKtsl-E"
);

async function getUser() {

    let { data } = await supabaseClient.auth.getUser();

    if (data.user) {
        return data.user;
    }


    const { data: authData, error } =
        await supabaseClient.auth.signInAnonymously();


    if (error) {
        console.error(error);
        return null;
    }


    return authData.user;

}