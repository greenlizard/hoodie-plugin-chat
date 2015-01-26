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
  hoodie.task.on('chattalk:add', chat.talk);
  hoodie.task.on('chatgettalk:add', chat.getTalk);
  hoodie.task.on('chatupdatetalk:add', chat.updateTalk);
  hoodie.task.on('chatdeletetalk:add', chat.deleteTalk);
  hoodie.task.on('chatmessage:add', chat.message);
  hoodie.task.on('chatupdatemessage:add', chat.updateMessage);
  hoodie.task.on('chatdeletemessage:add', chat.deleteMessage);
  hoodie.task.on('chatfeed:add', chat.feed);
  hoodie.task.on('chatshare:add', chat.shareTalk);

  hoodie.task.on('chatnotification:add', chat.createNotification);



  callback();
};
