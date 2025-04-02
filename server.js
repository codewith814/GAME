const express = require('express');
const path = require('path');
const app = express();
let port = 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Try to start the server, if port 3000 is in use, try the next port
const startServer = () => {
    const server = app.listen(port)
        .on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${port} is busy, trying port ${port + 1}...`);
                port++;
                server.close();
                startServer();
            } else {
                console.error('Server error:', err);
            }
        })
        .on('listening', () => {
            console.log(`Game server running at http://localhost:${port}`);
            console.log('Press Ctrl+C to stop the server');
        });
};

startServer(); 