document.addEventListener('DOMContentLoaded', () => {
    const desktop = document.querySelector('.desktop');
    const selectionBox = document.getElementById('selection-box');
    const desktopIcons = document.querySelectorAll('.desktop-icon');
    
    let isSelecting = false;
    let startX, startY;
    let selectedIcons = new Set();

    // Mouse down event
    desktop.addEventListener('mousedown', (e) => {
        // Only start selection on left mouse button
        if (e.button !== 0) return;
        
        // Don't start selection if clicking on an icon
        if (e.target.closest('.desktop-icon')) return;
        
        isSelecting = true;
        startX = e.clientX;
        startY = e.clientY;
        
        // Clear previous selections
        clearSelection();
        
        // Show selection box
        selectionBox.style.display = 'block';
        selectionBox.style.left = startX + 'px';
        selectionBox.style.top = startY + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        
        // Prevent text selection
        e.preventDefault();
    });

    // Mouse move event
    document.addEventListener('mousemove', (e) => {
        if (!isSelecting) return;
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        // Calculate selection box dimensions
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const left = Math.min(currentX, startX);
        const top = Math.min(currentY, startY);
        
        // Update selection box
        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';
        
        // Check which icons are in selection
        checkIconSelection(left, top, width, height);
    });

    // Mouse up event
    document.addEventListener('mouseup', (e) => {
        if (!isSelecting) return;
        
        isSelecting = false;
        
        // Hide selection box after a short delay
        setTimeout(() => {
            selectionBox.style.display = 'none';
        }, 100);
        
        // Log selected icons
        if (selectedIcons.size > 0) {
            console.log('Selected icons:', Array.from(selectedIcons).map(icon => icon.querySelector('span').textContent));
        }
    });

    // Function to check which icons are in selection
    function checkIconSelection(boxLeft, boxTop, boxWidth, boxHeight) {
        desktopIcons.forEach(icon => {
            const rect = icon.getBoundingClientRect();
            const iconLeft = rect.left;
            const iconTop = rect.top;
            const iconWidth = rect.width;
            const iconHeight = rect.height;
            
            // Check if icon intersects with selection box
            const intersects = !(
                iconLeft > boxLeft + boxWidth ||
                iconLeft + iconWidth < boxLeft ||
                iconTop > boxTop + boxHeight ||
                iconTop + iconHeight < boxTop
            );
            
            if (intersects) {
                if (!selectedIcons.has(icon)) {
                    selectedIcons.add(icon);
                    icon.classList.add('selected');
                }
            } else {
                if (selectedIcons.has(icon)) {
                    selectedIcons.delete(icon);
                    icon.classList.remove('selected');
                }
            }
        });
    }

    // Function to clear selection
    function clearSelection() {
        selectedIcons.forEach(icon => {
            icon.classList.remove('selected');
        });
        selectedIcons.clear();
    }

    // Click on desktop to clear selection
    desktop.addEventListener('click', (e) => {
        if (!e.target.closest('.desktop-icon')) {
            clearSelection();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+A to select all
        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            clearSelection();
            desktopIcons.forEach(icon => {
                selectedIcons.add(icon);
                icon.classList.add('selected');
            });
        }
        
        // Escape to clear selection
        if (e.key === 'Escape') {
            clearSelection();
        }
    });
}); 