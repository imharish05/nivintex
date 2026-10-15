function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = resolve;
    document.body.appendChild(script);
  });
}

export async function loadAllScripts() {
  const scripts = [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/wow/1.1.2/wow.min.js',
  ];

  for (const src of scripts) {
    await loadScript(src);
  }

  // Init WOW animations after scripts load
  if (window.WOW) {
    new window.WOW({ live: false }).init();
  }
}
