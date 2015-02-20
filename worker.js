/**
 * Hoodie plugin chat
 * Lightweight and easy chat
 */

/**
 * Dependencies
 */
var Chat = require('./lib');


/**
 * Chat worker
 */

module.exports = function (hoodie, callback) {
  var chat = new Chat(hoodie);

  hoodie.task.on('chatgetchatstatus:add', chat.getChatStatus);
  hoodie.account.on('user:change', chat.addChatStatusEachUser);
  callback();
};
