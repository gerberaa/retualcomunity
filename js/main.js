let windowManager;

document.addEventListener('DOMContentLoaded', () => {
    setupDockMagnification();
    windowManager = new WindowManager();

    // Make all dock icons functional
    document.querySelectorAll('.dock-item').forEach(item => {
        const appId = item.dataset.appId;
        if (!appId) return;
        const title = item.querySelector('.tooltip').textContent;
        const content = `<h2>${title}</h2><p>Content for ${title}.</p>`;
        
        item.addEventListener('click', () => {
            handleAppClick(appId, title, content);
        });
    });

    // Make all desktop icons functional (removes need for inline ondblclick)
    document.querySelectorAll('.desktop-icon').forEach(item => {
        const appId = item.dataset.appId;
        if (!appId) return;
        const title = item.querySelector('span').textContent;
        const content = `<h2>${title}</h2><p>Content for ${title}.</p>`;

        item.addEventListener('dblclick', () => {
            handleAppClick(appId, title, content);
        });
    });

    updateTime();
    updateWeather();
    setInterval(updateTime, 1000);
    setInterval(updateWeather, 600000); // Update weather every 10 minutes
});

class WindowManager {
    constructor() {
        this.openApps = new Map(); // appId -> windowElement
        this.zIndex = 100;
        this.activeWindow = null;
    }

    hideUIElements() {
        const dock = document.querySelector('.dock');
        const widgets = document.querySelector('.widgets');
        const menuBar = document.querySelector('.menu-bar');
        
        if (dock) dock.style.display = 'none';
        if (widgets) widgets.style.display = 'none';
        if (menuBar) menuBar.style.display = 'none';
    }

    showUIElements() {
        const dock = document.querySelector('.dock');
        const widgets = document.querySelector('.widgets');
        const menuBar = document.querySelector('.menu-bar');
        
        if (dock) dock.style.display = 'flex';
        if (widgets) widgets.style.display = 'block';
        if (menuBar) menuBar.style.display = 'flex';
    }

    openWindow(appId, title, content) {
        const windowId = `window-${appId}`;
        const windowElement = document.createElement('div');
        windowElement.className = 'window';
        windowElement.id = windowId;
        windowElement.dataset.appId = appId;
        windowElement.style.zIndex = this.zIndex++;

        // Set initial size and position
        windowElement.style.width = '600px';
        windowElement.style.height = '400px';
        windowElement.style.left = `${(window.innerWidth - 600) / 2}px`;
        windowElement.style.top = `${(window.innerHeight - 400) / 2}px`;

        windowElement.innerHTML = `
            <div class="window-header">
                <div class="window-controls">
                    <button class="window-close"></button>
                    <button class="window-minimize"></button>
                    <button class="window-maximize"></button>
                </div>
                <div class="window-title">${title}</div>
            </div>
            <div class="window-content">${content}</div>
            <div class="resize-handle"></div>
        `;

        document.body.appendChild(windowElement);
        this.openApps.set(appId, windowElement);
        this.setActive(windowElement);
        this.makeDraggable(windowElement);
        this.makeResizable(windowElement);
        this.setupControls(windowElement);
    }

    setActive(windowElement) {
        if (this.activeWindow) {
            this.activeWindow.classList.remove('active');
        }
        this.activeWindow = windowElement;
        this.activeWindow.classList.add('active');
        this.activeWindow.style.zIndex = this.zIndex++;

        // Add listener to bring to front
        windowElement.addEventListener('mousedown', () => this.setActive(windowElement));
    }

    closeWindow(windowElement) {
        const appId = windowElement.dataset.appId;
        this.openApps.delete(appId);
        windowElement.remove();
        if (this.activeWindow === windowElement) {
            this.activeWindow = null;
        }
    }

    setupControls(windowElement) {
        const closeBtn = windowElement.querySelector('.window-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeWindow(windowElement);
        });

        // Placeholder for minimize
        const minimizeBtn = windowElement.querySelector('.window-minimize');
        minimizeBtn.addEventListener('click', (e) => e.stopPropagation());

        const maximizeBtn = windowElement.querySelector('.window-maximize');
        let isMaximized = false;
        let originalState = {};
        maximizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isMaximized) {
                // Restore window
                windowElement.style.width = originalState.width;
                windowElement.style.height = originalState.height;
                windowElement.style.top = originalState.top;
                windowElement.style.left = originalState.left;
                windowElement.style.zIndex = originalState.zIndex || this.zIndex++;
                windowElement.classList.remove('fullscreen');
                
                // Show dock and widgets
                this.showUIElements();
            } else {
                // Maximize window
                originalState = { 
                    width: windowElement.style.width, 
                    height: windowElement.style.height, 
                    top: windowElement.style.top, 
                    left: windowElement.style.left,
                    zIndex: windowElement.style.zIndex
                };
                
                windowElement.style.width = '100vw';
                windowElement.style.height = '100vh';
                windowElement.style.top = '0';
                windowElement.style.left = '0';
                windowElement.style.zIndex = '9999'; // Above everything
                windowElement.classList.add('fullscreen');
                
                // Hide dock and widgets
                this.hideUIElements();
            }
            isMaximized = !isMaximized;
        });
    }

    makeDraggable(windowElement) {
        const header = windowElement.querySelector('.window-header');
        let startX, startY, startLeft, startTop;

        const onMouseDown = (e) => {
            if (e.target.closest('.window-controls')) return;
            e.preventDefault();
            this.setActive(windowElement);

            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(windowElement.style.left, 10) || 0;
            startTop = parseInt(windowElement.style.top, 10) || 0;

            windowElement.classList.add('dragging');

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            e.preventDefault();
            requestAnimationFrame(() => {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                windowElement.style.transform = `translate(${dx}px, ${dy}px)`;
            });
        };

        const onMouseUp = (e) => {
            windowElement.classList.remove('dragging');

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            windowElement.style.left = `${startLeft + dx}px`;
            windowElement.style.top = `${startTop + dy}px`;
            windowElement.style.transform = '';

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        header.addEventListener('mousedown', onMouseDown);
    }

    makeResizable(windowElement) {
        const resizeHandle = windowElement.querySelector('.resize-handle');
        let startX, startY, startWidth, startHeight;

        const onMouseDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(windowElement).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(windowElement).height, 10);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            const newWidth = startWidth + e.clientX - startX;
            const newHeight = startHeight + e.clientY - startY;
            if (newWidth > 300) windowElement.style.width = `${newWidth}px`;
            if (newHeight > 200) windowElement.style.height = `${newHeight}px`;
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        resizeHandle.addEventListener('mousedown', onMouseDown);
    }
}

async function handleAppClick(appId, title, content) {
    // Open external links for specific dock items
    const externalLinks = {
        documentation: 'https://www.ritualfoundation.org/docs/overview/what-is-ritual',
        pinned: 'https://www.ritualfoundation.com/blog/introducing-ritual-foundation',
        book: 'https://ritual.net/'
    };

    if (externalLinks[appId]) {
        window.open(externalLinks[appId], '_blank', 'noopener,noreferrer');
        return;
    }

    if (appId === 'gallery') {
        if (windowManager.openApps.has(appId)) {
            windowManager.setActive(windowManager.openApps.get(appId));
        } else {
            const galleryContent = await createGalleryContent();
            windowManager.openWindow(appId, 'Gallery', galleryContent);
        }
        return;
    }

    if (appId === 'documentation') {
        if (windowManager.openApps.has(appId)) {
            windowManager.setActive(windowManager.openApps.get(appId));
        } else {
            const docContent = createDocumentationContent();
            windowManager.openWindow(appId, 'Documentation', docContent);
        }
        return;
    }

    if (appId === 'game') {
        if (windowManager.openApps.has(appId)) {
            windowManager.setActive(windowManager.openApps.get(appId));
        } else {
            const gameContent = createGameComingSoonContent();
            windowManager.openWindow(appId, 'Game', gameContent);
        }
        return;
    }

    if (windowManager.openApps.has(appId)) {
        const windowElement = windowManager.openApps.get(appId);
        windowManager.setActive(windowElement);
        const dockIcon = document.querySelector(`.dock-item[data-app-id='${appId}']`);
        if (dockIcon) {
            dockIcon.classList.add('jiggle');
            setTimeout(() => dockIcon.classList.remove('jiggle'), 500);
        }
    } else {
        windowManager.openWindow(appId, title, content);
    }
}

// Legacy function for desktop icons, now calls the main handler with the global windowManager instance.
function createWindow(title, content, appId) {
    handleAppClick(appId, title, content);
}

function updateTime() {
    const timeEl = document.querySelector('.time-widget .time');
    const dateEl = document.querySelector('.time-widget .date');
    if (!timeEl || !dateEl) return;
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// Gallery state
let galleryState = {
    data: [],
    filteredData: [],
    currentView: 'masonry',
    currentSort: 'newest',
    searchQuery: '',
    isLoading: false
};

async function createGalleryContent() {
    try {
        // Prefer server data if available (Vercel KV), fallback to local JSON
        let data = [];
        try {
            const apiResp = await fetch('/api/works-public');
            if (apiResp.ok) {
                data = await apiResp.json();
            }
        } catch (e) {
            // ignore, fallback to local
        }
        if (!Array.isArray(data) || data.length === 0) {
            const response = await fetch('gallery-data.json');
            if (!response.ok) throw new Error('Could not load gallery data.');
            data = await response.json();
        }

        galleryState.data = data.filter(item => item.status === 'approved');
        galleryState.filteredData = [...galleryState.data];
        
        // Store gallery data globally for lightbox access
        window.galleryData = galleryState.filteredData;
        
        // Clean up old view history
        cleanupViewHistory();

        return `
            <div class="gallery-wrapper">
                <div class="gallery-controls">
                    <input type="text" class="gallery-search" placeholder="Search artworks..." 
                           oninput="handleGallerySearch(this.value)">
                    
                    <select class="gallery-sort" onchange="handleGallerySort(this.value)">
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="popular">Most Popular</option>
                        <option value="least-popular">Least Popular</option>
                        <option value="title">Title A-Z</option>
                        <option value="title-desc">Title Z-A</option>
                    </select>
                    
                    <div class="gallery-view-toggle">
                        <button class="view-btn active" data-view="masonry" onclick="changeGalleryView('masonry')">
                            <i class="fas fa-th"></i> Masonry
                        </button>
                        <button class="view-btn" data-view="grid" onclick="changeGalleryView('grid')">
                            <i class="fas fa-th-large"></i> Grid
                        </button>
                        <button class="view-btn" data-view="list" onclick="changeGalleryView('list')">
                            <i class="fas fa-list"></i> List
                        </button>
                    </div>
                </div>
                
                <div class="gallery-container">
                    <div class="gallery-masonry" id="gallery-content">
                        ${renderGalleryItems()}
                    </div>
                </div>
            </div>
            
            <div class="image-lightbox" id="image-lightbox" onclick="closeLightbox(event)">
                <div class="lightbox-content" onclick="event.stopPropagation()">
                    <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
                    <img class="lightbox-image" id="lightbox-image" src="" alt="">
                    <div class="lightbox-info">
                        <h3 id="lightbox-title"></h3>
                        <p class="description" id="lightbox-description"></p>
                        <p class="date" id="lightbox-date"></p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error creating gallery:', error);
        return '<div class="gallery-empty"><i class="fas fa-exclamation-triangle"></i><h3>Failed to load gallery</h3><p>Check console for details.</p></div>';
    }
}

function renderGalleryItems() {
    if (galleryState.isLoading) {
        return '<div class="gallery-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    }
    
    if (galleryState.filteredData.length === 0) {
        return `
            <div class="gallery-empty">
                <i class="fas fa-search"></i>
                <h3>No artworks found</h3>
                <p>Try adjusting your search or filters.</p>
            </div>
        `;
    }
    
    return galleryState.filteredData
        .map((item, index) => {
            const listViewClass = galleryState.currentView === 'list' ? 'list-view' : '';
            const views = item.views || 0;
            
            return `
                <div class="gallery-item ${listViewClass}" onclick="openLightbox(${index})" 
                     data-title="${(item.title || '').toLowerCase()}" 
                     data-description="${(item.description || '').toLowerCase()}"
                     data-id="${item.id}">
                    <img src="${item.imageUrl}" 
                         alt="${item.title || 'Gallery image'}" 
                         loading="lazy"
                         onerror="this.src='images/placeholder.jpg'">
                    <div class="gallery-item-overlay"></div>
                    <div class="gallery-item-info">
                        <h3>${item.title || 'Untitled'}</h3>
                        <p class="description">${item.description || 'No description'}</p>
                        <div class="gallery-item-meta">
                            <span class="gallery-item-date">${new Date(item.submittedAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                            })}</span>
                            <span class="gallery-item-views" id="views-${item.id}">
                                <i class="fas fa-eye"></i> ${views}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
}

function handleGallerySearch(query) {
    galleryState.searchQuery = query.toLowerCase();
    filterGalleryData();
}

function handleGallerySort(sortType) {
    galleryState.currentSort = sortType;
    sortGalleryData();
}

function changeGalleryView(viewType) {
    galleryState.currentView = viewType;
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === viewType) {
            btn.classList.add('active');
        }
    });
    
    // Update container class
    const container = document.getElementById('gallery-content');
    if (container) {
        container.className = `gallery-${viewType}`;
        container.innerHTML = renderGalleryItems();
    }
}

function filterGalleryData() {
    if (!galleryState.searchQuery) {
        galleryState.filteredData = [...galleryState.data];
    } else {
        galleryState.filteredData = galleryState.data.filter(item => {
            const title = (item.title || '').toLowerCase();
            const description = (item.description || '').toLowerCase();
            return title.includes(galleryState.searchQuery) || 
                   description.includes(galleryState.searchQuery);
        });
    }
    
    sortGalleryData();
}

function sortGalleryData() {
    switch (galleryState.currentSort) {
        case 'newest':
            galleryState.filteredData.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
            break;
        case 'oldest':
            galleryState.filteredData.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
            break;
        case 'popular':
            galleryState.filteredData.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
        case 'least-popular':
            galleryState.filteredData.sort((a, b) => (a.views || 0) - (b.views || 0));
            break;
        case 'title':
            galleryState.filteredData.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            break;
        case 'title-desc':
            galleryState.filteredData.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
            break;
    }
    
    updateGalleryDisplay();
}

function updateGalleryDisplay() {
    const container = document.getElementById('gallery-content');
    if (container) {
        // Update global data for lightbox
        window.galleryData = galleryState.filteredData;
        container.innerHTML = renderGalleryItems();
    }
}

// Documentation iframe browser
function createDocumentationContent() {
    const defaultUrl = 'https://developer.mozilla.org/en-US/docs/Web';
    
    const quickLinks = {
        'MDN Web Docs': 'https://developer.mozilla.org/en-US/docs/Web',
        'Wikipedia': 'https://en.wikipedia.org',
        'Stack Overflow': 'https://stackoverflow.com',
        'CodePen': 'https://codepen.io',
        'CSS Tricks': 'https://css-tricks.com',
        'W3Schools': 'https://www.w3schools.com',
        'Can I Use': 'https://caniuse.com',
        'JSFiddle': 'https://jsfiddle.net'
    };
    
    const quickLinksHtml = Object.entries(quickLinks).map(([name, url]) => 
        `<button class="quick-link" data-url="${url}" title="${url}">${name}</button>`
    ).join('');
    
    return `
        <div class="iframe-browser">
            <div class="browser-toolbar">
                <div class="browser-navigation">
                    <button class="nav-btn" id="back-btn" title="Back" disabled>
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <button class="nav-btn" id="forward-btn" title="Forward" disabled>
                        <i class="fas fa-arrow-right"></i>
                    </button>
                    <button class="nav-btn" id="refresh-btn" title="Refresh">
                        <i class="fas fa-redo"></i>
                    </button>
                </div>
                <div class="browser-address-bar">
                    <div class="url-container">
                        <i class="fas fa-globe url-icon"></i>
                        <input type="url" id="url-input" value="${defaultUrl}" placeholder="Enter URL...">
                        <button class="go-btn" id="go-btn">
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
                <div class="browser-actions">
                    <button class="action-btn" id="bookmark-btn" title="Bookmark">
                        <i class="fas fa-bookmark"></i>
                    </button>
                    <button class="action-btn" id="external-btn" title="Open in New Tab">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                    <button class="action-btn" id="fullscreen-btn" title="Fullscreen">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="action-btn" id="quick-links-btn" title="Quick Links">
                        <i class="fas fa-star"></i>
                    </button>
                </div>
            </div>
            <div class="quick-links-bar" id="quick-links-bar">
                ${quickLinksHtml}
            </div>
            <div class="iframe-container">
                <iframe 
                    id="doc-iframe" 
                    src="${defaultUrl}" 
                    frameborder="0" 
                    allowfullscreen
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation">
                </iframe>
                <div class="iframe-loading" id="iframe-loading">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Loading...</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Gallery Lightbox Functions
function openLightbox(index) {
    const lightbox = document.getElementById('image-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDescription = document.getElementById('lightbox-description');
    const lightboxDate = document.getElementById('lightbox-date');
    
    if (!lightbox || !window.galleryData || !window.galleryData[index]) return;
    
    const item = window.galleryData[index];
    
    lightboxImage.src = item.imageUrl;
    lightboxImage.alt = item.title || 'Gallery image';
    lightboxTitle.textContent = item.title || 'Untitled';
    lightboxDescription.textContent = item.description || 'No description';
    lightboxDate.textContent = new Date(item.submittedAt).toLocaleDateString('en-US');
    
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Store current index for navigation
    window.currentLightboxIndex = index;
    
    // Record view and update display
    recordView(item.id, index);
    
    // Add keyboard navigation
    document.addEventListener('keydown', handleLightboxKeydown);
}

// Game Coming Soon Content
function createGameComingSoonContent() {
    return `
        <div class="coming-soon">
            <div class="soon-glow">soon</div>
            <div class="soon-shadow">soon</div>
        </div>
    `;
}

// Function to record a view for an artwork
async function recordView(workId, index) {
    // Check if this user has already viewed this work recently (anti-spam)
    const viewedKey = `viewed_${workId}`;
    const lastViewed = localStorage.getItem(viewedKey);
    const now = Date.now();
    const cooldownPeriod = 30 * 60 * 1000; // 30 minutes cooldown
    
    if (lastViewed && (now - parseInt(lastViewed)) < cooldownPeriod) {
        console.log(`View not recorded for work ${workId} - cooldown period active`);
        return;
    }
    
    try {
        const response = await fetch(`/api/works/${workId}/view`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Record the view timestamp to prevent spam
            localStorage.setItem(viewedKey, now.toString());
            
            // Update the view count in the gallery display
            const viewsElement = document.getElementById(`views-${workId}`);
            if (viewsElement) {
                viewsElement.innerHTML = `<i class="fas fa-eye"></i> ${data.views}`;
                
                // Add a small animation to indicate the view was counted
                viewsElement.style.transform = 'scale(1.2)';
                viewsElement.style.color = 'rgba(124, 252, 0, 0.8)';
                setTimeout(() => {
                    viewsElement.style.transform = 'scale(1)';
                    viewsElement.style.color = '';
                }, 300);
            }
            
            // Update the local data
            if (galleryState.filteredData[index]) {
                galleryState.filteredData[index].views = data.views;
            }
            if (galleryState.data) {
                const originalIndex = galleryState.data.findIndex(item => item.id == workId);
                if (originalIndex !== -1) {
                    galleryState.data[originalIndex].views = data.views;
                }
            }
            
            console.log(`✅ View recorded for work ${workId}. Total views: ${data.views}`);
        } else {
            console.error('Failed to record view:', response.statusText);
        }
    } catch (error) {
        console.error('Error recording view:', error);
    }
}

// Function to clean up old view records (optional cleanup)
function cleanupViewHistory() {
    const now = Date.now();
    const expiredTime = 24 * 60 * 60 * 1000; // 24 hours
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('viewed_')) {
            const timestamp = parseInt(localStorage.getItem(key));
            if (now - timestamp > expiredTime) {
                localStorage.removeItem(key);
            }
        }
    }
}

function closeLightbox(event) {
    if (event && event.target !== event.currentTarget && event.type === 'click') return;
    
    const lightbox = document.getElementById('image-lightbox');
    if (lightbox) {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Remove keyboard navigation
        document.removeEventListener('keydown', handleLightboxKeydown);
    }
}

function handleLightboxKeydown(event) {
    if (event.key === 'Escape') {
        closeLightbox();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        navigateLightbox(-1);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        navigateLightbox(1);
    }
}

function navigateLightbox(direction) {
    if (!window.galleryData || window.currentLightboxIndex === undefined) return;
    
    const newIndex = window.currentLightboxIndex + direction;
    
    if (newIndex >= 0 && newIndex < window.galleryData.length) {
        openLightbox(newIndex);
    }
}

function updateWeather() {
    const weatherWidget = document.querySelector('.weather-widget');
    if (!weatherWidget) return;
    
    const weatherIcon = weatherWidget.querySelector('i');
    const tempEl = weatherWidget.querySelector('.temp');
    const locationEl = weatherWidget.querySelector('.location');
    
    if (!weatherIcon || !tempEl || !locationEl) return;
    
    // Use static data instead of API call
    try {
        // Set static weather data
        locationEl.textContent = 'Kyiv';
        tempEl.textContent = '24°C';
        weatherIcon.className = 'fas fa-sun';
        
        // Uncomment and configure this if you want to use real weather data
        /*
        const apiKey = 'YOUR_OPENWEATHERMAP_API_KEY';
        const city = 'Kyiv';
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather data not available');
        const data = await response.json();
        
        locationEl.textContent = data.name;
        tempEl.textContent = `${Math.round(data.main.temp)}°C`;
        const weatherId = data.weather[0].id;
        if (weatherId >= 200 && weatherId < 300) weatherIcon.className = 'fas fa-bolt';
        else if (weatherId >= 300 && weatherId < 400) weatherIcon.className = 'fas fa-cloud-rain';
        else if (weatherId >= 500 && weatherId < 600) weatherIcon.className = 'fas fa-cloud-showers-heavy';
        else if (weatherId >= 600 && weatherState < 700) weatherIcon.className = 'fas fa-snowflake';
        else if (weatherId >= 700 && weatherState < 800) weatherIcon.className = 'fas fa-smog';
        else if (weatherId === 800) weatherIcon.className = 'fas fa-sun';
        else if (weatherId > 800) weatherIcon.className = 'fas fa-cloud';
        */
    } catch (error) {
        console.error('Error in weather widget:', error);
        // Fallback to static data on error
        locationEl.textContent = 'Kyiv';
        tempEl.textContent = '24°C';
        if (weatherIcon) weatherIcon.className = 'fas fa-sun';
    }
}

// Add hover effect to dock items

