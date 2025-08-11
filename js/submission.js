document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('submission-modal');
    const openBtn = document.getElementById('submit-work-btn');
    const closeBtn = document.querySelector('#submission-modal .window-close');
    const minimizeBtn = document.querySelector('#submission-modal .window-minimize');
    const maximizeBtn = document.querySelector('#submission-modal .window-maximize');
    const form = document.getElementById('submission-form');
    const statusDiv = document.getElementById('submission-status');
    const modalContent = document.querySelector('#submission-modal .modal-content');

    // --- Modal Logic ---
    openBtn.onclick = () => {
        modal.style.display = 'block';
    };

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    minimizeBtn.onclick = () => {
        modalContent.style.transform = 'scale(0.8)';
        modalContent.style.opacity = '0.5';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    };

    maximizeBtn.onclick = () => {
        if (modalContent.classList.contains('maximized')) {
            modalContent.classList.remove('maximized');
            modalContent.style.width = '90%';
            modalContent.style.maxWidth = '500px';
            modalContent.style.margin = '10% auto';
        } else {
            modalContent.classList.add('maximized');
            modalContent.style.width = '95%';
            modalContent.style.maxWidth = '90%';
            modalContent.style.margin = '2% auto';
        }
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    // Window dragging functionality
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    const windowHeader = document.querySelector('#submission-modal .window-header');

    windowHeader.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === windowHeader) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, modalContent);
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    // --- Form Submission Logic for Local Server ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('title', document.getElementById('submission-title').value);
        formData.append('description', document.getElementById('submission-description').value);
        formData.append('submission-file', document.getElementById('submission-file').files[0]);

        const submitBtn = document.getElementById('submit-form-btn');

        if (!document.getElementById('submission-file').files[0]) {
            statusDiv.textContent = 'Please select a file.';
            statusDiv.style.color = 'red';
            return;
        }

        submitBtn.disabled = true;
        statusDiv.textContent = 'Uploading...';
        statusDiv.style.color = 'white';

        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                let details = '';
                try { details = await response.text(); } catch (_) {}
                throw new Error(`Server error${details ? ': ' + details : ''}`);
            }

            const result = await response.json();

            statusDiv.textContent = result.message;
            statusDiv.style.color = 'lightgreen';
            form.reset();

            setTimeout(() => {
                modal.style.display = 'none';
                statusDiv.textContent = '';
                submitBtn.disabled = false;
            }, 3000);

        } catch (error) {
            console.error('Error submitting work: ', error);
            statusDiv.textContent = 'Error: ' + error.message;
            statusDiv.style.color = 'red';
            submitBtn.disabled = false;
        }
    });
});
