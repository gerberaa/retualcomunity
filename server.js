const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();

// --- Basic Auth Middleware ---
// IMPORTANT: Change these credentials!
const ADMIN_USER = '401483';
const ADMIN_PASS = '401483';

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
        return res.status(401).send('Authentication required.');
    }

    try {
        const [username, password] = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
        if (username === ADMIN_USER && password === ADMIN_PASS) {
            return next();
        }
    } catch (error) {
        // Ignore errors from malformed headers
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
    return res.status(401).send('Authentication failed.');
};
const PORT = 3000;

// --- Middleware ---
app.use(bodyParser.json());
// Serve static files like CSS and JS
app.use(express.static(__dirname));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Protect admin.html
app.get('/admin.html', auth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// --- Storage Configuration for Multer ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Append extension
    }
});

const upload = multer({ storage: storage });

// --- Database File ---
const DB_PATH = path.join(__dirname, 'gallery-data.json');

const readDB = () => {
    if (!fs.existsSync(DB_PATH)) {
        return [];
    }
    const data = fs.readFileSync(DB_PATH);
    return JSON.parse(data);
};

const writeDB = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// --- API Routes ---

// Route to handle work submission
app.post('/api/submit', upload.single('submission-file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('File not uploaded.');
    }

    const db = readDB();
    const newWork = {
        id: Date.now(),
        title: req.body.title,
        description: req.body.description,
        imageUrl: `/uploads/${req.file.filename}`,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        views: 0
    };

    db.push(newWork);
    writeDB(db);

    res.status(200).json({ message: 'Work submitted successfully!', work: newWork });
});

// Route to get all works (protected)
app.get('/api/works', auth, (req, res) => {
    const db = readDB();
    res.status(200).json(db.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))); // Sort by newest first
});

// Route to update work status (protected)
app.post('/api/works/:id/status', auth, (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).send('Invalid status.');
    }

    const db = readDB();
    const workIndex = db.findIndex(work => work.id == id);

    if (workIndex === -1) {
        return res.status(404).send('Work not found.');
    }

    db[workIndex].status = status;
    writeDB(db);

    res.status(200).json(db[workIndex]);
});

// Route for admin to add content directly (protected)
app.post('/api/admin-add', auth, upload.single('submission-file'), (req, res) => {
    const { title, description, 'image-type': imageType, 'image-url': imageUrl } = req.body;
    const db = readDB();
    
    let finalImageUrl;
    
    if (imageType === 'url') {
        // Using URL image
        if (!imageUrl) {
            return res.status(400).send('Image URL is required.');
        }
        finalImageUrl = imageUrl;
    } else {
        // Using uploaded file
        if (!req.file) {
            return res.status(400).send('File not uploaded.');
        }
        finalImageUrl = `/uploads/${req.file.filename}`;
    }

    const newWork = {
        id: Date.now(),
        title: title || 'Untitled',
        description: description || 'No description',
        imageUrl: finalImageUrl,
        status: 'approved', // Auto-approve admin additions
        submittedAt: new Date().toISOString(),
        addedBy: 'admin',
        imageSource: imageType, // Track whether it's from file or URL
        views: 0
    };

    db.push(newWork);
    writeDB(db);

    res.status(200).json({ message: 'Content added successfully!', work: newWork });
});

// Route to delete work (protected)
app.delete('/api/works/:id', auth, (req, res) => {
    const { id } = req.params;
    const db = readDB();
    
    const workIndex = db.findIndex(work => work.id == id);
    
    if (workIndex === -1) {
        return res.status(404).send('Work not found.');
    }
    
    // Optional: Delete the associated file if it's a local upload
    const work = db[workIndex];
    if (work.imageSource === 'file' && work.imageUrl && work.imageUrl.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, work.imageUrl);
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            // Continue with database deletion even if file deletion fails
        }
    }
    
    // Remove from database
    db.splice(workIndex, 1);
    writeDB(db);
    
    res.status(200).json({ message: 'Work deleted successfully!' });
});

// Route to increment views for a work
app.post('/api/works/:id/view', (req, res) => {
    const { id } = req.params;
    const db = readDB();
    
    const workIndex = db.findIndex(work => work.id == id);
    
    if (workIndex === -1) {
        return res.status(404).json({ error: 'Work not found.' });
    }
    
    // Initialize views if not present
    if (!db[workIndex].views) {
        db[workIndex].views = 0;
    }
    
    // Increment views
    db[workIndex].views++;
    
    // Save to database
    writeDB(db);
    
    res.status(200).json({ 
        message: 'View recorded successfully!', 
        views: db[workIndex].views,
        workId: id 
    });
});

// Route to get current views for a work
app.get('/api/works/:id/views', (req, res) => {
    const { id } = req.params;
    const db = readDB();
    
    const work = db.find(work => work.id == id);
    
    if (!work) {
        return res.status(404).json({ error: 'Work not found.' });
    }
    
    res.status(200).json({ 
        views: work.views || 0,
        workId: id 
    });
});

// --- Server Start ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server is running on:`);
    console.log(`   Local:    http://localhost:${PORT}`);
    console.log(`   Network:  http://${getLocalIP()}:${PORT}`);
    console.log('');
    console.log('📱 Access from other devices on your network:');
    console.log(`   Use: http://${getLocalIP()}:${PORT}`);
    console.log('');
    console.log('🔒 Admin panel: /admin.html');
    console.log('👤 Login: 401483 / 401483');
});

// Function to get local IP address
function getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    
    return 'localhost';
}
