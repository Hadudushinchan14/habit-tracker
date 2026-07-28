const CACHE_NAME = "identity-os-v4";


const FILES = [

    "./",

    "./index.html",

    "./manifest.json",

    "./css/theme.css",
    "./css/layout.css",
    "./css/components.css",
    "./css/pages.css",

    "./js/storage.js",
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


self.addEventListener(
"fetch",
event => {

    event.respondWith(

        fetch(event.request)
        .catch(() => caches.match(event.request))

    );

});
