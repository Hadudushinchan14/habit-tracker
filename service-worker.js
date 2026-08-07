const CACHE_NAME = "identity-os-v2.5";


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
    "./js/app.js",
    "/icon-192.png",
    "/icon-512.png"

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

    self.addEventListener("message", event => {

    if (event.data === "SKIP_WAITING") {
        self.skipWaiting();
    }

});

self.addEventListener(
"activate",
event => {

event.waitUntil(

    caches.keys().then(keys =>
        Promise.all(

            keys.map(key => {

                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }

            })

        )
    ).then(() => self.clients.claim())

);

    });


self.addEventListener("fetch", event => {

    const url = new URL(event.request.url);

    if (url.hostname.endsWith(".supabase.co")) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        fetch(event.request)
        .catch(() => caches.match(event.request))
    );

});