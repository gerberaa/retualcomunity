function setupDockMagnification() {
    const dockContainer = document.querySelector('.dock-container');
    if (!dockContainer) return;

    const icons = Array.from(dockContainer.children);
    const iconSize = 52; // As defined in CSS
    const maxMagnification = 2.5;
    const magnificationRange = 2; // How many icons to the left/right are affected

    dockContainer.addEventListener('mousemove', (e) => {
        const rect = dockContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;

        icons.forEach((icon, index) => {
            const iconRect = icon.getBoundingClientRect();
            const iconCenterX = iconRect.left - rect.left + iconRect.width / 2;
            const distance = Math.abs(mouseX - iconCenterX);

            let scale = 1;
            if (distance < iconSize * magnificationRange) {
                const effect = (1 - (distance / (iconSize * magnificationRange)));
                scale = 1 + (maxMagnification - 1) * Math.pow(effect, 2);
            }
            
            icon.style.transform = `scale(${scale}) translateY(-${(scale - 1) * 10}px)`;
            icon.style.zIndex = scale > 1 ? '1' : '0';
        });
    });

    dockContainer.addEventListener('mouseleave', () => {
        icons.forEach(icon => {
            icon.style.transform = 'scale(1) translateY(0)';
            icon.style.zIndex = '0';
        });
    });
}
