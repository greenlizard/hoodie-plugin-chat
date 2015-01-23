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
  hoodie.task.on('chatfollow:add', chat.follow);
  hoodie.task.on('chatunfollow:add', chat.unfollow);
  hoodie.task.on('chatpost:add', chat.post);
  hoodie.task.on('chatgetpost:add', chat.getPost);
  hoodie.task.on('chatupdatepost:add', chat.updatePost);
  hoodie.task.on('chatdeletepost:add', chat.deletePost);
  hoodie.task.on('chatcomment:add', chat.comment);
  hoodie.task.on('chatupdatecomment:add', chat.updateComment);
  hoodie.task.on('chatdeletecomment:add', chat.deleteComment);
  hoodie.task.on('chatcount:add', chat.count);
  hoodie.task.on('chatuncount:add', chat.uncount);
  hoodie.task.on('chatfeed:add', chat.feed);
  hoodie.task.on('chatshare:add', chat.sharePost);
  hoodie.task.on('chatdualfollow:add', chat.dualFollow);

  hoodie.task.on('chatnotification:add', chat.createNotification);



  callback();
};
