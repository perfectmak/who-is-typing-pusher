'use strict';

(function(window, $){

  var ENTER_KEY = 13;

  /**
   * Generates an anonymous username for a user
   *
   */
  function getCurrentUsername() {
    var usernamePrefixes = ['kitten', 'chiwawa', 'pangolin', 'hippo', 'cheetah', 'slug'];
    var prefixIndex = Math.ceil(Math.random() * 10)% usernamePrefixes.length;

    return usernamePrefixes[prefixIndex] + '-' + cuid.slug();
  }

  /**
   * Callback function for the `user_typing` event
   *
   */
  function handleUserIsTypingEvent(payload) {
    $('#user-is-typing').html(payload.username + 'is typing...');
  }

  /**
   * Clears the user's typing message
   */
  function clearUserIsTyping() {
    $('#user-is-typing').html('');
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
   * Returns a function that invokes 'timeoutfn' after 'time' milliseconds from the last time
   * 'fn' was invoked.
   *
   * @param fn
   * @param timeoutFn
   * @param timeout
   * @returns {Function}
   */
function convertToTimeoutFn(fn, timeoutFn, timeout) {
  var timeoutId;

  return function() {
    fn.apply(null, arguments);

    //reset clear time
    clearTimeout(timeoutId);
    timeoutId = setTimeout(timeoutFn, timeout);
  }
}

  /**
   * Returns a throttled version of function that ensures 'fn' is called a most once every 'timeout'
   * milliseconds
   *
   * @param fn
   * @param timeout
   * @returns {Function}
   */
  function throttle(fn, timeout) {
    var canCall = true;
    return function() {
      if(canCall) {
        fn.apply(null, arguments);
        canCall = false;
        setTimeout(function() {
          canCall = true;
        }, timeout);
      }

    }
  }

  function initApplication() {

    var pusher = new Pusher(PUSHER_KEY, {
      encrypted: true,
    });
    var chatChannelName = 'anonymous_chat';
    var userIsTypingEvent = 'user_typing';
    var newMessageEvent = 'user_message';
    var currentUsername = getCurrentUsername();
    $('#username').html(currentUsername);

    var channel = pusher.subscribe(chatChannelName);
    var clearInterval = 900; //0.9 seconds
    var clearingIsTypingEventHandler = convertToTimeoutFn(handleUserIsTypingEvent,
                                          clearUserIsTyping, clearInterval);

    channel.bind(userIsTypingEvent, function(data) {
      if(data.username !== currentUsername) {
        clearingIsTypingEventHandler(data);
      }
    });


    var messageTextField = $('#message-text-field');
    var throttleTime = 200; //0.2 seconds
    var throttledPublishUserTyping = throttle(publishUserTyping, throttleTime);

    messageTextField.on('keyup', function(event) {
      if(event.which !== ENTER_KEY) {
        throttledPublishUserTyping(currentUsername);
      }
    });

    //subscribe to new_message events
    channel.bind(newMessageEvent, handleUserMessageEvent.bind(null, currentUsername));

    var sendButton = $('#send-button');
    sendButton.on('click', function(event) {
      var message = messageTextField.val();
      publishUserMessage(currentUsername, message)
        .catch(console.err);
      messageTextField.val('');
    });
  }

  $(window).on('DOMContentLoaded', initApplication);
})(window, $);
