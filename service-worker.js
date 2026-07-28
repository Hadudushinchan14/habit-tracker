const CACHE_NAME = "identity-os-v4";


const FILES = [

    "./",

    "./index.html",

    "./manifest.json",

    "./css/theme.css",
    "./css/layout.css",
    "./css/components.css",
    "./css/pages.css",

    "./js/supabase.js",
    "./js/state.js",
    "./js/database.js",
    "./js/ui.js",
    "./js/pages.js",
    "./js/app.js"

];


self.addEventListener(
"install",
event => {

    self.skipWaiting();

    event.waitUntil(

        caches.open(CACHE_NAME)
        .then(cache =>
            cache.addAll(FILES)
        )

    );

});

    self.addEventListener(
"activate",
event => {

    event.waitUntil(
        self.clients.claim()
    );

});


self.addEventListener("fetch", event => {

    const url = new URL(event.request.url);

    // Never cache Supabase requests
    if (url.hostname.endsWith(".supabase.co")) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );

});
