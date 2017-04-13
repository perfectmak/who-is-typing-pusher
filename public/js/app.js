'use strict';

(function(window, $){

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
    messageTemplate.find('.text').html(payload.message);
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
    var clearTimerId;
    channel.bind(userIsTypingEvent, function(data) {
      if(data.username !== currentUsername) {
        $('#user-is-typing').html(data.username + 'is typing...');

        clearTimeout(clearTimerId);
        clearTimerId = setTimeout(function () {
          $('#user-is-typing').html('');
        }, clearInterval);
      }
    });


    var messageTextField = $('#message-text-field');
    var canPublish = true;
    var throttleTime = 200; //0.2 seconds

    messageTextField.on('keyup', function(event) {
      if(canPublish) {
        publishUserTyping(currentUsername)
          .catch(console.error);

        canPublish = false;
        setTimeout(function() {
          canPublish = true;
        }, throttleTime);
      }
    });

    //subscribe to new_message events
    channel.bind(newMessageEvent, handleUserMessageEvent.bind(null, currentUsername));

    var sendButton = $('#send-button');
    sendButton.on('click', function(event) {
      var message = messageTextField.val();
      sendButton.attr('disabled', true);
      publishUserMessage(currentUsername, message)
        .then(function() {
          messageTextField.val('');
          sendButton.attr('disabled', false);
        })
        .catch(function() {
          console.error.apply(console, arguments);
          sendButton.attr('disabled', true);
        });
    });
  }

  $(window).on('DOMContentLoaded', initApplication);
})(window, $);
