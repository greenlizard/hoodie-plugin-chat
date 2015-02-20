/**
 * Dependencies
 */

var async = require('async');
var utils = require('hoodie-utils-plugins')('chat:chat');
var log = utils.debug();
var _ = require('lodash');


module.exports = function (hoodie, pluginDb) {
  var Chat = this;


  var _validAttrs = function (task, attr, cb) {
    log('_validAttrs', task);
    if (!attr || !task[attr]) {
      return cb('Pls, fill the param: ' + attr);
    }
    cb();
  };

  var _get = function (task, cb) {
    log('_get', task);
    var method = (!_.isArray(task.chat.userId)) ? 'find' : 'findSome';
    pluginDb[method]('chatstatus', task.chat.userId, function (err, _doc) {
      if (err) return cb(err);
      task.chatstatus = _doc;
      cb(null, task);
    });
  };


  Chat.getChatStatus = function (db, task) {
    log('chatgetchatstatus', task);
    async.series([
        async.apply(_validAttrs, task, 'chat'),
        async.apply(_validAttrs, task.chat, 'userId'),
        async.apply(_get, task)
      ],
      utils.handleTask(hoodie, 'get', db, task)
    );
  };

  return Chat;
};
