if (globalThis.innerWidth > 768) {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
  script.integrity = 'sha384-d+vyQ0dYcymoP8ndq2hW7FGC50nqGdXUEgoOUGxbbkAJwZqL7h+jKN0GGgn9hFDS';
  script.crossOrigin = 'anonymous';
  script.defer = true;
  document.head.appendChild(script);
}