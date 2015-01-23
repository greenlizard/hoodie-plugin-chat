/**
 * Hoodie plugin chat
 * Lightweight and easy chat
 */

/* global Hoodie */

Hoodie.extend(function (hoodie) {
  'use strict';

  var _subscribers = function (task) {
    var defer = window.jQuery.Deferred();
    defer.notify('_subscribers', arguments, false);
    hoodie.pubsub.subscribers(task.profile.userId)
      .then(defer.resolve)
      .fail(defer.reject);
    return defer.promise();
  };

  var _subscriptions = function (task) {
    var defer = window.jQuery.Deferred();
    defer.notify('_subscriptions', arguments, false);
    hoodie.pubsub.subscriptions(task.profile.userId)
      .then(defer.resolve)
      .fail(defer.reject);
    return defer.promise();
  };

  var _handleFollowing = function (task) {
    var defer = window.jQuery.Deferred();
    var ids = pluck(pluck(task.pubsub.subscriptions, 'doc'), 'userId');
    hoodie.profile.get(ids)
      .then(function (_task) {
        task.chat = (!task.chat) ? {} : task.chat;
        task.chat.following = pluck(_task.profile, 'doc');
        defer.resolve(task);
      })
      .fail(defer.reject);
    return defer.promise();
  };

  var _handleAttr = function (task, attr) {
    var defer = window.jQuery.Deferred();
    var ids = pluck(pluck(task.pubsub.subscribers, 'doc'), 'userId');
    hoodie.profile.get(ids)
      .then(function (_task) {
        task.chat = (!task.chat) ? {} : task.chat;
        task.chat[attr] = pluck(_task.profile, 'doc');
        defer.resolve(task);
      })
      .fail(defer.reject);
    return defer.promise();
  };

  var _handleFollowers = function (task) {
    return _handleAttr(task, 'followers');
  };

  var _handleFriends = function (task) {
    return _handleAttr(task, 'friends');
  };

  function partialRight(fn /*, args...*/) {
    // A reference to the Array#slice method.
    var slice = Array.prototype.slice;
    // Convert arguments object to an array, removing the first argument.
    var args = slice.call(arguments, 1);

    return function () {
      // Invoke the originally-specified function, passing in all just-
      // specified arguments, followed by any originally-specified arguments.
      return fn.apply(this, slice.call(arguments, 0).concat(args));
    };
  }

  function pluck(originalArr, prop) {
    var newArr = [];
    for (var i = 0; i < originalArr.length; i++) {
      newArr[i] = originalArr[i][prop];
    }
    return newArr;
  }

  hoodie.chat = {

    follow: function (userName) {
      var defer = window.jQuery.Deferred();
      defer.notify('follow', arguments, false);
      var task = {
        chat: {
          userName: userName
        }
      };
      hoodie.task('chatfollow').start(task)
        .then(defer.resolve)
        .fail(defer.reject);
      return defer.promise();
    },

    unfollow: function (userName) {
      var defer = window.jQuery.Deferred();
      defer.notify('unfollow', arguments, false);
      var task = {
        chat: {
          userName: userName
        }
      };
      hoodie.task('chatunfollow').start(task)
        .then(defer.resolve)
        .fail(defer.reject);
      return defer.promise();
    },

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

    following: function (userName) {
      return hoodie.chat.getProfile(userName)
        .then(_subscriptions)
        .then(_handleFollowing);
    },

    followers: function (userName) {
      return hoodie.chat.getProfile(userName)
        .then(_subscribers)
        .then(_handleFollowers);
    },
    friends: function (userName) {
      return hoodie.chat.getProfile(userName)
        .then(_subscribers)
        .then(_handleFriends);
    },
    post: function (postObject, userName) {
      var defer = window.jQuery.Deferred();
      defer.notify('post', arguments, false);
      hoodie.chat.getProfile(userName)
        .fail(defer.reject)
        .then(function (task) {
          task.chat = task.profile;
          task.chat.post = postObject;
          hoodie.task('chatpost').start(task)
            .then(defer.resolve)
            .fail(defer.reject);
        });
      return defer.promise();
    },
    updatePost: function (postObject, userName) {
      var defer = window.jQuery.Deferred();
      defer.notify('updatePost', arguments, false);
      hoodie.chat.getProfile(userName)
        .fail(defer.reject)
        .then(function (task) {
          task.chat = task.profile;
          task.chat.post = postObject;
          hoodie.task('chatupdatepost').start(task)
            .then(defer.resolve)
            .fail(defer.reject);
        });
      return defer.promise();
    },
    deletePost: function (postObject, userName) {
      var defer = window.jQuery.Deferred();
      defer.notify('deletePost', arguments, false);
      hoodie.chat.getProfile(userName)
        .fail(defer.reject)
        .then(function (task) {
          task.chat = task.profile;
          task.chat.post = postObject;
          hoodie.task('chatdeletepost').start(task)
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
    comment: function (postObject, commentObject) {
      var defer = window.jQuery.Deferred();
      defer.notify('comment', arguments, false);
      var task = {
        chat: {
          post: postObject,
          comment: commentObject
        }
      };
      hoodie.task('chatcomment').start(task)
        .then(defer.resolve)
        .fail(defer.reject);
      return defer.promise();
    },
    updateComment: function (postObject, commentObject) {
      var defer = window.jQuery.Deferred();
      defer.notify('updateComment', arguments, false);
      var task = {
        chat: {
          post: postObject,
          comment: commentObject
        }
      };
      hoodie.task('chatupdatecomment').start(task)
        .then(defer.resolve)
        .fail(defer.reject);
      return defer.promise();
    },
    deleteComment: function (postObject, commentObject) {
      var defer = window.jQuery.Deferred();
      defer.notify('', arguments, false);
      var task = {
        chat: {
          post: postObject,
          comment: commentObject
        }
      };
      hoodie.task('chatdeletecomment').start(task)
        .then(defer.resolve)
        .fail(defer.reject);
      return defer.promise();
    },
    getPost: function (postObject) {
      var defer = window.jQuery.Deferred();
      defer.notify('getPost', arguments, false);
      var task = {
        chat: {
          post: postObject
        }
      };
      hoodie.task('chatgetpost').start(task)
        .then(defer.resolve)
        .fail(defer.reject);
      return defer.promise();
    },
    share: function (postObject) {
      var defer = window.jQuery.Deferred();
      defer.notify('share', arguments, false);
      var task = {
        chat: {
          post: postObject
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
