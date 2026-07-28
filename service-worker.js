const CACHE_NAME = "identity-os-v1";


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

    event.waitUntil(

        caches.open(CACHE_NAME)
        .then(cache =>
            cache.addAll(FILES)
        )

    );

});


self.addEventListener(
"fetch",
event => {

    event.respondWith(

        caches.match(event.request)
        .then(response => {

            return response || fetch(event.request);

        })

    );

});
