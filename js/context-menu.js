document.addEventListener('DOMContentLoaded', () => {
    const contextMenu = document.getElementById('context-menu');
    const desktop = document.querySelector('.desktop');

    // Show context menu on right click
    desktop.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        // Position the menu at cursor
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.top = e.pageY + 'px';
        contextMenu.style.display = 'block';
        
        // Ensure menu doesn't go off screen
        const rect = contextMenu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if (rect.right > windowWidth) {
            contextMenu.style.left = (e.pageX - rect.width) + 'px';
        }
        
        if (rect.bottom > windowHeight) {
            contextMenu.style.top = (e.pageY - rect.height) + 'px';
        }
    });

    // Hide context menu on left click
    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });

    // Handle context menu item clicks
    contextMenu.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.context-menu-item');
        if (menuItem) {
            const url = menuItem.dataset.url;
            if (url) {
                window.open(url, '_blank');
            }
            contextMenu.style.display = 'none';
        }
    });

    // Hide context menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            contextMenu.style.display = 'none';
        }
    });
}); 