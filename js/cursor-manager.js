document.addEventListener('DOMContentLoaded', () => {
    const cursorSelector = document.getElementById('cursor-selector');
    const cursorOptions = document.querySelectorAll('.cursor-option');
    const body = document.body;
    
    let currentCursor = 'default';
    let isSelectorVisible = false;

    // Load saved cursor from localStorage
    const savedCursor = localStorage.getItem('selectedCursor');
    if (savedCursor) {
        setCursor(savedCursor);
        updateActiveOption(savedCursor);
    }

    // Function to set cursor
    function setCursor(cursorType) {
        // Remove all cursor classes
        body.classList.remove('cursor-default', 'cursor-pointer', 'cursor-crosshair', 
                             'cursor-text', 'cursor-wait', 'cursor-move', 
                             'cursor-zoom-in', 'cursor-zoom-out');
        
        // Add new cursor class
        body.classList.add(`cursor-${cursorType}`);
        currentCursor = cursorType;
        
        // Save to localStorage
        localStorage.setItem('selectedCursor', cursorType);
        
        // Log cursor change for debugging
        console.log(`Cursor changed to: ${cursorType}`);
    }

    // Function to update active option
    function updateActiveOption(cursorType) {
        cursorOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.cursor === cursorType) {
                option.classList.add('active');
            }
        });
    }

    // Handle cursor option clicks
    cursorOptions.forEach(option => {
        option.addEventListener('click', () => {
            const cursorType = option.dataset.cursor;
            setCursor(cursorType);
            updateActiveOption(cursorType);
            
            // Hide selector after selection
            setTimeout(() => {
                cursorSelector.style.display = 'none';
                isSelectorVisible = false;
            }, 300);
        });
    });

    // Keyboard shortcut to toggle cursor selector (Ctrl + C)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            toggleCursorSelector();
        }
    });

    // Function to toggle cursor selector
    function toggleCursorSelector() {
        if (isSelectorVisible) {
            cursorSelector.style.display = 'none';
            isSelectorVisible = false;
        } else {
            cursorSelector.style.display = 'block';
            isSelectorVisible = true;
        }
    }

    // Click outside to close selector
    document.addEventListener('click', (e) => {
        if (!cursorSelector.contains(e.target) && isSelectorVisible) {
            cursorSelector.style.display = 'none';
            isSelectorVisible = false;
        }
    });

    // Add cursor selector to context menu
    const contextMenu = document.getElementById('context-menu');
    const cursorMenuItem = document.createElement('div');
    cursorMenuItem.className = 'context-menu-item';
    cursorMenuItem.innerHTML = `
        <i class="fas fa-mouse-pointer"></i>
        <span>Change Cursor</span>
    `;
    cursorMenuItem.addEventListener('click', () => {
        toggleCursorSelector();
        contextMenu.style.display = 'none';
    });
    contextMenu.appendChild(cursorMenuItem);

    // Test cursor loading
    function testCursorLoading() {
        const testCursors = [
            '../images/tiny-cursor.svg',
            '../images/tiny-pointer.svg',
            '../images/tiny-crosshair.svg',
            '../images/tiny-text.svg',
            '../images/tiny-wait.svg',
            '../images/tiny-move.svg',
            '../images/tiny-zoom-in.svg',
            '../images/tiny-zoom-out.svg'
        ];
        
        testCursors.forEach((cursorPath, index) => {
            const img = new Image();
            img.onload = () => {
                console.log(`✅ Cursor ${index + 1} loaded successfully: ${cursorPath}`);
            };
            img.onerror = () => {
                console.log(`❌ Cursor ${index + 1} failed to load: ${cursorPath}`);
            };
            img.src = cursorPath;
        });
    }

    // Test cursor loading on startup
    testCursorLoading();

    // Console log for debugging
    console.log('Cursor Manager loaded. Use Ctrl+C to toggle cursor selector.');
    console.log('Available cursors:', Array.from(cursorOptions).map(opt => opt.dataset.cursor));
}); 