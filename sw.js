// ================================================================
// کتێبخانەی سۆز — Service Worker
// ئەم فایلە لە هەمان فۆڵدەری index.html دابنێ
// ================================================================

const CACHE_NAME = 'soz-library-v1';

// فایلەکانی ئۆفلاین
const STATIC_ASSETS = [
    '/',
    '/index.html',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700;800&display=swap',
];

// ================================================================
// Install — فایلە گرینگەکان Cache بکە
// ================================================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// ================================================================
// Activate — Cache ی کۆن پاک بکەرەوە
// ================================================================
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// ================================================================
// Fetch — Network First، پاشان Cache
// ================================================================
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Supabase API calls — هەرگیز Cache مەکە
    if (url.hostname.includes('supabase.co')) {
        return;
    }

    // Google Fonts و CDN — Cache First
    if (
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com') ||
        url.hostname.includes('cdnjs.cloudflare.com')
    ) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                return cached || fetch(event.request).then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // HTML فایل — Network First
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/index.html');
            })
        );
        return;
    }

    // هەموو شتی تر — Network First، پاشان Cache
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
