'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const path = require('path');
const Pusher = require('pusher');
const config = require('./config');

const app = express();

//Initialize Pusher
const pusherConfig = config.pusher;
const pusher = new Pusher({
  appId: pusherConfig.appId,
  key: pusherConfig.key,
  secret: pusherConfig.secret,
  encrypted: true,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  res.render('index', {
    //pass pusher key to index.ejs for pusher client
    pusherKey: pusherConfig.key
  });
});

const chatChannel = 'anonymous_chat';
const userIsTypingEvent = 'user_typing';
const newMessageEvent = 'user_message';

app.post('/userTyping', function(req, res) {
  const username = req.body.username;
  pusher.trigger(chatChannel, userIsTypingEvent, {username});
  res.status(200).send();
});

app.post('/userMessage', function(req, res) {
  const username = req.body.username;
  const message = req.body.message;
  pusher.trigger(chatChannel, newMessageEvent, {username, message});
  res.status(200).send();
});

app.listen(config.appPort, function () {
  console.log('Node server running on port 3000');
});
