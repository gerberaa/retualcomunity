// Iframe Browser Controller
class IframeBrowser {
    constructor() {
        this.currentUrl = '';
        this.history = [];
        this.historyIndex = -1;
        this.bookmarks = this.loadBookmarks();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Wait for DOM to be ready, then setup listeners when documentation window opens
        document.addEventListener('DOMContentLoaded', () => {
            // Use event delegation for dynamically created elements
            document.addEventListener('click', (e) => {
                if (e.target.closest('#back-btn')) {
                    this.goBack();
                } else if (e.target.closest('#forward-btn')) {
                    this.goForward();
                } else if (e.target.closest('#refresh-btn')) {
                    this.refresh();
                } else if (e.target.closest('#go-btn')) {
                    this.navigateToUrl();
                } else if (e.target.closest('#bookmark-btn')) {
                    this.toggleBookmark();
                } else if (e.target.closest('#fullscreen-btn')) {
                    this.toggleFullscreen();
                } else if (e.target.closest('#quick-links-btn')) {
                    this.toggleQuickLinks();
                } else if (e.target.closest('#external-btn')) {
                    this.openInNewTab();
                } else if (e.target.closest('.quick-link')) {
                    const url = e.target.closest('.quick-link').dataset.url;
                    this.loadUrl(url);
                }
            });

            // URL input enter key
            document.addEventListener('keydown', (e) => {
                if (e.target.id === 'url-input' && e.key === 'Enter') {
                    this.navigateToUrl();
                }
            });

            // Listen for iframe load events
            document.addEventListener('load', (e) => {
                if (e.target.id === 'doc-iframe') {
                    this.onIframeLoad();
                }
            }, true);
        });
    }

    navigateToUrl() {
        const urlInput = document.getElementById('url-input');
        if (!urlInput) return;

        let url = urlInput.value.trim();
        
        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        this.loadUrl(url);
    }

    loadUrl(url) {
        const iframe = document.getElementById('doc-iframe');
        const loading = document.getElementById('iframe-loading');
        const urlInput = document.getElementById('url-input');
        
        if (!iframe || !loading) return;

        // Show loading
        loading.style.opacity = '1';
        loading.style.pointerEvents = 'auto';

        // Update URL input
        if (urlInput) {
            urlInput.value = url;
        }

        // Add to history (only if different from current)
        if (this.currentUrl !== url) {
            this.historyIndex++;
            this.history = this.history.slice(0, this.historyIndex);
            this.history.push(url);
            this.currentUrl = url;
        }

        // Initialize history if empty
        if (this.history.length === 0) {
            this.history.push(url);
            this.historyIndex = 0;
            this.currentUrl = url;
        }

        // Add error handling for iframe
        iframe.onerror = () => {
            this.handleIframeError(url);
        };

        // Load the URL
        iframe.src = url;

        // Update navigation buttons
        this.updateNavigationButtons();

        // Update bookmark button state
        this.updateBookmarkButton();

        // Hide loading after delay (fallback)
        setTimeout(() => {
            this.onIframeLoad();
        }, 5000);
    }

    updateBookmarkButton() {
        const bookmarkBtn = document.getElementById('bookmark-btn');
        if (!bookmarkBtn) return;

        const isBookmarked = this.bookmarks.includes(this.currentUrl);
        
        if (isBookmarked) {
            bookmarkBtn.classList.add('active');
            bookmarkBtn.title = 'Remove Bookmark';
        } else {
            bookmarkBtn.classList.remove('active');
            bookmarkBtn.title = 'Add Bookmark';
        }
    }

    onIframeLoad() {
        const loading = document.getElementById('iframe-loading');
        if (loading) {
            loading.style.opacity = '0';
            loading.style.pointerEvents = 'none';
        }

        // Try to get the current URL from iframe (may be blocked by CORS)
        try {
            const iframe = document.getElementById('doc-iframe');
            if (iframe && iframe.contentWindow && iframe.contentWindow.location) {
                const iframeUrl = iframe.contentWindow.location.href;
                if (iframeUrl !== 'about:blank') {
                    this.currentUrl = iframeUrl;
                    const urlInput = document.getElementById('url-input');
                    if (urlInput) {
                        urlInput.value = iframeUrl;
                    }
                }
            }
        } catch (e) {
            // CORS blocked - this is expected for external sites
            console.log('Cannot access iframe URL due to CORS policy');
        }
    }

    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const url = this.history[this.historyIndex];
            this.loadUrlFromHistory(url);
        }
    }

    goForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const url = this.history[this.historyIndex];
            this.loadUrlFromHistory(url);
        }
    }

    loadUrlFromHistory(url) {
        const iframe = document.getElementById('doc-iframe');
        const urlInput = document.getElementById('url-input');
        
        if (iframe) {
            iframe.src = url;
        }
        if (urlInput) {
            urlInput.value = url;
        }
        
        this.currentUrl = url;
        this.updateNavigationButtons();
    }

    refresh() {
        const iframe = document.getElementById('doc-iframe');
        if (iframe) {
            const loading = document.getElementById('iframe-loading');
            if (loading) {
                loading.style.opacity = '1';
                loading.style.pointerEvents = 'auto';
            }
            iframe.src = iframe.src;
        }
    }

    updateNavigationButtons() {
        const backBtn = document.getElementById('back-btn');
        const forwardBtn = document.getElementById('forward-btn');
        
        if (backBtn) {
            backBtn.disabled = this.historyIndex <= 0;
        }
        if (forwardBtn) {
            forwardBtn.disabled = this.historyIndex >= this.history.length - 1;
        }
    }

    toggleBookmark() {
        const bookmarkBtn = document.getElementById('bookmark-btn');
        if (!bookmarkBtn || !this.currentUrl) return;

        const isBookmarked = this.bookmarks.includes(this.currentUrl);
        
        if (isBookmarked) {
            this.bookmarks = this.bookmarks.filter(url => url !== this.currentUrl);
            bookmarkBtn.classList.remove('active');
            bookmarkBtn.title = 'Bookmark';
        } else {
            this.bookmarks.push(this.currentUrl);
            bookmarkBtn.classList.add('active');
            bookmarkBtn.title = 'Remove Bookmark';
        }
        
        this.saveBookmarks();
    }

    toggleFullscreen() {
        const iframe = document.getElementById('doc-iframe');
        if (!iframe) return;

        if (!document.fullscreenElement) {
            iframe.requestFullscreen().catch(err => {
                console.log('Error entering fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    openInNewTab() {
        if (this.currentUrl) {
            window.open(this.currentUrl, '_blank');
        } else {
            const urlInput = document.getElementById('url-input');
            if (urlInput && urlInput.value) {
                let url = urlInput.value.trim();
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
                window.open(url, '_blank');
            }
        }
    }

    toggleQuickLinks() {
        const quickLinksBar = document.getElementById('quick-links-bar');
        const quickLinksBtn = document.getElementById('quick-links-btn');
        
        if (!quickLinksBar || !quickLinksBtn) return;

        const isVisible = quickLinksBar.classList.contains('visible');
        
        if (isVisible) {
            quickLinksBar.classList.remove('visible');
            quickLinksBtn.classList.remove('active');
            quickLinksBtn.title = 'Show Quick Links';
        } else {
            quickLinksBar.classList.add('visible');
            quickLinksBtn.classList.add('active');
            quickLinksBtn.title = 'Hide Quick Links';
        }
    }

    handleIframeError(url) {
        const iframe = document.getElementById('doc-iframe');
        const loading = document.getElementById('iframe-loading');
        
        if (!iframe) return;

        // Hide loading
        if (loading) {
            loading.style.opacity = '0';
            loading.style.pointerEvents = 'none';
        }

        // Show error message with option to open in new tab
        const errorHtml = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                padding: 40px;
                text-align: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                    max-width: 400px;
                ">
                    <div style="font-size: 48px; margin-bottom: 20px;">🚫</div>
                    <h3 style="margin: 0 0 15px 0; color: #333;">Cannot load this website</h3>
                    <p style="color: #666; margin: 0 0 20px 0; line-height: 1.5;">
                        This website blocks iframe access for security reasons.
                    </p>
                    <button 
                        onclick="window.open('${url}', '_blank')" 
                        style="
                            background: rgba(124, 252, 0, 0.8);
                            color: #333;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            transition: all 0.2s ease;
                        "
                        onmouseover="this.style.background='rgba(124, 252, 0, 1)'"
                        onmouseout="this.style.background='rgba(124, 252, 0, 0.8)'"
                    >
                        Open in New Tab
                    </button>
                </div>
            </div>
        `;

        // Create a data URL with the error message
        const errorDataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml);
        iframe.src = errorDataUrl;
    }

    loadBookmarks() {
        try {
            const saved = localStorage.getItem('iframe-bookmarks');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    saveBookmarks() {
        try {
            localStorage.setItem('iframe-bookmarks', JSON.stringify(this.bookmarks));
        } catch (e) {
            console.error('Error saving bookmarks:', e);
        }
    }

    // Predefined useful URLs
    getQuickLinks() {
        return {
            'MDN Web Docs': 'https://developer.mozilla.org/en-US/docs/Web',
            'GitHub': 'https://github.com',
            'Stack Overflow': 'https://stackoverflow.com',
            'CodePen': 'https://codepen.io',
            'CSS Tricks': 'https://css-tricks.com',
            'W3Schools': 'https://www.w3schools.com',
            'Can I Use': 'https://caniuse.com',
            'Google Fonts': 'https://fonts.google.com'
        };
    }
}

// Initialize iframe browser when script loads
const iframeBrowser = new IframeBrowser();

console.log('Iframe Browser Controller loaded');