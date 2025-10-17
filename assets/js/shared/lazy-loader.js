class LazyLoader {
    constructor() {
        this.observer = null;
        this.init();
    }
    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.dataset.src;
                        if (src) {
                            img.src = src;
                            img.removeAttribute('data-src');
                            this.observer.unobserve(img);
                        }
                    }
                });
            }, {
                rootMargin: '50px'
            });
        }
    }
    observe(img) {
        if (this.observer && img.dataset.src) {
            this.observer.observe(img);
        } else if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        }
    }
    observeAll(selector = 'img[data-src]') {
        document.querySelectorAll(selector).forEach(img => this.observe(img));
    }
}
window.lazyLoader = new LazyLoader();
