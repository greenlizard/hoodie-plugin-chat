/**
 * Hoodie plugin chat
 * Lightweight and easy chat
 */

/* global Hoodie */

Hoodie.extend(function (hoodie) {
  'use strict';

  hoodie.chat = {

    getProfile: function (userName) {
      var defer = window.jQuery.Deferred();
      defer.notify('getProfile', arguments, false);
      if (!userName) {
        hoodie.profile.get()
          .then(defer.resolve)
          .fail(defer.reject);
      } else {
        hoodie.profile.getByUserName(userName)
          .then(function (task) {
            defer.resolve({
              profile: task.profile
            });
          })
          .fail(defer.reject);
      }
      return defer.promise();
    },

    talk: function (talkObject, userName) {
      var defer = window.jQuery.Deferred();
      defer.notify('talk', arguments, false);
      hoodie.chat.getProfile(userName)
        .fail(defer.reject)
        .then(function (task) {
          task.chat = task.profile;
          task.chat.talk = talkObject;
          hoodie.task('chattalk').start(task)
            .then(defer.resolve)
            .fail(defer.reject);
        });
      return defer.promise();
    },
    updateTalk: function (talkObject, userName) {
      var defer = window.jQuery.Deferred();
      defer.notify('updateTalk', arguments, false);
      hoodie.chat.getProfile(userName)
        .fail(defer.reject)
        .then(function (task) {
          task.chat = task.profile;
          task.chat.talk = talkObject;
          hoodie.task('chatupdatetalk').start(task)
            .then(defer.resolve)
            .fail(defer.reject);
        });
      return defer.promise();
    },
    deleteTalk: function (talkObject, userName) {
      var defer = window.jQuery.Deferred();
      defer.notify('deleteTalk', arguments, false);
      hoodie.chat.getProfile(userName)
        .fail(defer.reject)
        .then(function (task) {
          task.chat = task.profile;
          task.chat.talk = talkObject;
          hoodie.task('chatdeletetalk').start(task)
            .then(defer.resolve)
            .fail(defer.reject);
        });
      return defer.promise();
    },
    feed: function (userName) {
      var defer = window.jQuery.Deferred();
      defer.notify('feed', arguments, false);
      hoodie.chat.getProfile(userName)
        .fail(defer.reject)
        .then(function (task) {
          task.chat = task.profile;
          hoodie.task('chatfeed').start(task)
            .then(defer.resolve)
            .fail(defer.reject);
        });
      return defer.promise();
    },
    message: function (talkObject, messageObject) {
      var defer = window.jQuery.Deferred();
      defer.notify('message', arguments, false);
      var task = {
        chat: {
          talk: talkObject,
          message: messageObject
        }
      };
      hoodie.task('chatmessage').start(task)
        .then(defer.resolve)
        .fail(defer.reject);
      return defer.promise();
    },
    updateMessage: function (talkObject, messageObject) {
      var defer = window.jQuery.Deferred();
      defer.notify('updateMessage', arguments, false);
      var task = {
        chat: {
          talk: talkObject,
          message: messageObject
        }
      };
      hoodie.task('chatupdatemessage').start(task)
        .then(defer.resolve)
        .fail(defer.reject);
      return defer.promise();
    },
    deleteMessage: function (talkObject, messageObject) {
      var defer = window.jQuery.Deferred();
      defer.notify('', arguments, false);
      var task = {
        chat: {
          talk: talkObject,
          message: messageObject
        }
      };
      hoodie.task('chatdeletemessage').start(task)
        .then(defer.resolve)
        .fail(defer.reject);
      return defer.promise();
    },
    getTalk: function (talkObject) {
      var defer = window.jQuery.Deferred();
      defer.notify('getTalk', arguments, false);
      var task = {
        chat: {
          talk: talkObject
        }
      };
      hoodie.task('chatgettalk').start(task)
        .then(defer.resolve)
        .fail(defer.reject);
      return defer.promise();
    },
    share: function (talkObject) {
      var defer = window.jQuery.Deferred();
      defer.notify('share', arguments, false);
      var task = {
        chat: {
          talk: talkObject
        }
      };
      hoodie.task('chatshare').start(task)
        .then(defer.resolve)
        .fail(defer.reject);
      return defer.promise();
    },
  };

  // var debugPromisseGstart = function (text) {
  //   var defer = window.jQuery.Deferred();
  //   (window.debug === 'chat') && console.groupCollapsed(text);
  //   defer.resolve({});
  //   return defer.promise();
  // };

  // var debugPromisseGend = function () {
  //   var defer = window.jQuery.Deferred();
  //   (window.debug === 'chat') && console.groupEnd();
  //   defer.resolve({});
  //   return defer.promise();
  // };

  function out(name, obj, task) {
    if (window.debug === 'chat') {
      var group = (task) ? 'task: ' + task + '(' + name + ')': 'method: ' + name;

      console.groupCollapsed(group);
      if (!!obj)
        console.table(obj);
      console.groupEnd();
    }
  }

  if (window.debug === 'chat') {
    hoodie.task.on('start', function () {
      out('start', arguments[0], arguments[0].type);
    });

    // task aborted
    hoodie.task.on('abort', function () {
      out('abort', arguments[0], arguments[0].type);
    });

    // task could not be completed
    hoodie.task.on('error', function () {
      out('error', arguments, arguments[1].type);
    });

    // task completed successfully
    hoodie.task.on('success', function () {
      out('success', arguments[0], arguments[0].type);
    });
  }
});
