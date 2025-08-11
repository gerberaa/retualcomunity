document.addEventListener('DOMContentLoaded', () => {
    const wallpapers = [
        
        'geleri/1.png',
        'geleri/2.png',
        'geleri/3.png',
        'geleri/4.png',
        'geleri/5.png',
       
    ];

    let currentWallpaperIndex = -1;

    function changeWallpaper() {
        if (wallpapers.length === 0) {
            console.log('Wallpapers array is empty. Please add images to the geleri folder and update the list in js/wallpaper.js.');
            return;
        }

        // Random wallpaper on first load, sequential on subsequent changes
        if (currentWallpaperIndex === -1) {
            currentWallpaperIndex = Math.floor(Math.random() * wallpapers.length);
        } else {
            currentWallpaperIndex = (currentWallpaperIndex + 1) % wallpapers.length;
        }
        const newWallpaperUrl = wallpapers[currentWallpaperIndex];

        // Preload the image to ensure it's cached before setting as background
        const img = new Image();
        img.src = newWallpaperUrl;
        img.onload = () => {
            // Create or update background element with blur
            let bgElement = document.getElementById('blurred-background');
            if (!bgElement) {
                bgElement = document.createElement('div');
                bgElement.id = 'blurred-background';
                bgElement.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: -1;
                    filter: blur(4px);
                    background-size: cover;
                    background-position: center;
                    background-attachment: fixed;
                    transform: scale(1.05);
                `;
                document.body.insertBefore(bgElement, document.body.firstChild);
            }
            
            // Set the background image
            bgElement.style.backgroundImage = `url('${newWallpaperUrl}')`;
            
            // Remove any existing background from body
            document.body.style.backgroundImage = 'none';
        };
        img.onerror = () => {
            console.error(`Failed to load wallpaper: ${newWallpaperUrl}`);
        }
    }

    // Change wallpaper immediately on load
    changeWallpaper();

    // Set interval to change wallpaper every 1 minute (60000 milliseconds)
    setInterval(changeWallpaper, 60000);
});
