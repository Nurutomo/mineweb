const express = require('express');
const app = express();
const SocketIO = require('socket.io');
const path = require('path');
const port = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
});

var server = app.listen(port, () => console.log('Listening to port', port));
var io = SocketIO(server);
    io.serveClient(true);