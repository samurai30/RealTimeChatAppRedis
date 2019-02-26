const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const http = require('http').Server(app);
const io = require('socket.io')(http);

const redis = require('redis');



app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

let client = redis.createClient();





client.on('connect', function () {

    console.log('Connected to redis');
    client.get('chat_users', function (err,reply) {
        if(reply){
            chatters = JSON.parse(reply);
        }
    });

    client.get('chat_app_messages', function (err,reply) {
       if(reply){
           chat_message = JSON.parse(reply);
       }
    });
});

const port = 3000;


app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));

http.listen(port, function () {
    console.log('Server Connected on: '+port);
});


var chatters = [];

var chat_messages = [];

app.get('/', function(req, res, next) {
    res.render('index');
});
//API - Join Chat

app.post('/join', function(req, res) {
    var username = req.body.username;
    if (chatters.indexOf(username) === -1) {
        chatters.push(username);
        client.set('chat_users', JSON.stringify(chatters));
        res.send({
            'chatters': chatters,
            'status': 'OK'
        });
    } else {
        res.send({
            'status': 'FAILED'
        });
    }
});

// API - Leave Chat

app.post('/leave', function(req, res) {
    var username = req.body.username;
    chatters.splice(chatters.indexOf(username), 1);
    client.set('chat_users', JSON.stringify(chatters));
    res.send({
        'status': 'OK'
    });
});

// API - send and store msgs



app.post('/send_message', function(req, res) {
    var username = req.body.username;
    var message = req.body.message;
    chat_messages.push({
        'sender': username,
        'message': message
    });
    client.set('chat_app_messages', JSON.stringify(chat_messages));
    res.send({
        'status': 'OK'
    });
});

// API - Get Messages


app.get('/get_messages', function(req, res) {
    res.send(chat_messages);
});

// API - Get Chatters

app.get('/get_chatters', function(req, res) {
    res.send(chatters);
});


io.on('connection', function(socket) {
    // Fire 'send' event for updating Message list in UI
    socket.on('message', function(data) {
        io.emit('send', data);
    });
    // Fire 'count_chatters' for updating Chatter Count in UI
    socket.on('update_chatter_count', function(data) {
        io.emit('count_chatters', data);
    });
});




