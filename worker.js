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

  hoodie.task.on('chatlookup:add', chat.lookup);

  hoodie.task.on('chatdualfollow:add', chat.dualFollow);

  callback();
};
