/**
 * Dependencies
 */

var async = require('async');
var PubSub = require('hoodie-plugin-pubsub/lib');
var Profile = require('hoodie-plugin-profile/lib');
var utils = require('hoodie-utils-plugins')('chat:chat');
var log = utils.debug();



module.exports = function (hoodie) {
  var Chat = this;
  var pubsub = new PubSub(hoodie);
  var profile = new Profile(hoodie);

  var _lookup = function (task, db, cb) {
    log('_lookup', task);
    task.profile = task.chat;
    return profile.getByUserName(db, task, cb);
  };

  var _verifyAttrs = function (task, attr, cb) {
    log('_verifyAttrs', task);
    if (!attr || !task[attr]) {
      return cb('Pls, fill the param: ' + attr);
    }
    cb();
  };

  var subscribe = function (task, db, cb) {
    log('subscribe', task);

    task.pubsub = task.profile;
    task.pubsub.subject = 'chat';
    task.pubsub.exclusive = true;
    return pubsub.subscribe(db, task, cb);
  };
/*
  var unsubscribe = function (task, db, cb) {
    log('unsubscribe', task);
    task.pubsub = {
      userId: task.profile.userId,
      subject: 'chat'
    };
    return pubsub.unsubscribe(db, task, cb);
  };
*/


  var _mimicTaskSubscribe = function (task, userId, cb) {
    task.profile = {
      userId: userId
    };
    cb();
  };


  Chat.lookup = function (db, task, cb) {
    log('lookup', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'userName'),
        async.apply(_lookup, task, db)
      ],
      utils.handleTask(hoodie, 'lookup', db, task, cb)
    );
  };

  Chat.dualFollow = function (db, task) {
    log('dualFollow', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'dualFollow'),
        async.apply(_verifyAttrs, task.chat.dualFollow, 'to'),
        async.apply(_verifyAttrs, task.chat.dualFollow, 'from'),
        async.apply(_mimicTaskSubscribe, task, task.chat.dualFollow.to),
        async.apply(subscribe, task, 'user/' + task.chat.dualFollow.from),
        async.apply(_mimicTaskSubscribe, task, task.chat.dualFollow.from),
        async.apply(subscribe, task, 'user/' + task.chat.dualFollow.to),
      ],
      utils.handleTask(hoodie, 'dualFollow', db, task)
    );
  };

  return Chat;
};
