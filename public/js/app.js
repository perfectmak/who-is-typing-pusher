'use strict';

(function(window, $, Rx){

  var ENTER_KEY = 13;
  var BACKSPACE_KEY = 8;

  /**
   * Generates an anonymous username for a user
   *
   */
  function generateUsername() {
    var usernamePrefixes = ['kitten', 'chiwawa', 'pangolin', 'hippo', 'cheetah', 'slug'];
    var prefixIndex = Math.ceil(Math.random() * 10)% usernamePrefixes.length;

    return usernamePrefixes[prefixIndex] + '-' + cuid.slug();
  }

  /**
   * Callback function for the `user_typing` event
   *
   */
  function handleUserIsTypingEvent(payload) {
    if(payload === null) {
      $('#user-is-typing').html('');
    } else {
      $('#user-is-typing').html(payload.username + 'is typing...');
    }
  }

  /**
   * Callback function for the `user_message` event
   *
   * @param username
   * @param payload
   * @return number
   */
  function handleUserMessageEvent(username, payload) {
    var messageClass = payload.username === username ? 'left' : 'right';

    //build message
    var messageTemplate = $($('.message_template').clone().html());
    messageTemplate.addClass(messageClass);
    messageTemplate.find('.text').html(payload.message)
    messageTemplate.find('.who > em').html(payload.username);

    //append to existing messages
    $('.messages').append(messageTemplate);

    //animate the view
    return setTimeout(function () {
      return messageTemplate.addClass('appeared');
    }, 0);
  }

/**
 * Sends user is typing message to the server for publishing
 *
 * @param username
 * @returns {Promise}
 */
function publishUserTyping(username) {
    return $.post('/userTyping', {username: username}).promise();
  }

  /**
   * Sends user message to server for publishing
   *
   * @param username
   * @param message
   * @returns {Promise}
   */
  function publishUserMessage(username, message) {
    return $.post('/userMessage', {username: username, message: message}).promise();
  }

  /**
   * Creates a pusher Observable Stream
   *
   * @param channel
   * @param event
   * @param pusher
   * @returns {*|Observable}
   */
  function createPusherObservable(pusher, channel, event) {
    var pusherMessageStream = new Rx.Subject();
    pusher.subscribe(channel).bind(event, pusherMessageStream.next.bind(pusherMessageStream));
    return pusherMessageStream;
  }

  function initApplication() {

    var pusher = new Pusher(PUSHER_KEY, {
      encrypted: true,
    });
    var chatChannel = 'anonymous_chat';
    var userIsTypingEvent = 'user_typing';
    var newMessageEvent = 'user_message';
    var currentUsername = generateUsername();
    $('#username').html(currentUsername);

    function ignoreCurrentUsername(payload) { return payload.username != currentUsername};

    var userIsTypingStream = createPusherObservable(pusher, chatChannel, userIsTypingEvent)
      .filter(ignoreCurrentUsername);

    //user is typing clear timer -> emits null
    var clearInterval = 800; //0.8 seconds
    var userIsTypingClearTimer = Rx.Observable.timer(clearInterval, clearInterval)
      .mapTo(null)
      .takeUntil(userIsTypingStream)
      .repeat();

    //subscribe to user_typing events
    userIsTypingStream
      .merge(userIsTypingClearTimer)
      .distinctUntilChanged()
      .subscribe(handleUserIsTypingEvent);

    var messageTextField = $('#message-text-field');
    var messageInputStream = Rx.Observable.fromEvent(messageTextField, 'keyup');

    var typingStream =  messageInputStream
      .filter(function(event){return (event.which !== ENTER_KEY);})
      .throttleTime(200);
    typingStream.mapTo(currentUsername).subscribe(publishUserTyping);



    //subscribe to new_message events
    var newUserMessageStream = createPusherObservable(pusher, chatChannel, newMessageEvent);
    newUserMessageStream.subscribe(handleUserMessageEvent.bind(null, currentUsername));

    // create send button click stream
    var sendButton = $('#send-button');
    var sendClickStream = Rx.Observable.fromEvent(sendButton, 'click');

    //subscribe to sendClickStream and Enter Key Inputs
    Rx.Observable.merge(
      sendClickStream,
      messageInputStream.filter(function(event) {return event.which === ENTER_KEY;})
    ).withLatestFrom(messageInputStream.pluck('target', 'value'))
      .pluck(1)
      .filter(function(message) { return message != ''})
      .subscribe(function(message) {
        publishUserMessage(currentUsername, message)
          .catch(console.err);
        messageTextField.val('');
      });
  }

  Rx.Observable.fromEvent($(window), 'DOMContentLoaded')
    .subscribe(initApplication);
})(window, $, Rx);
