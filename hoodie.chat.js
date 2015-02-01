/**
 * Hoodie plugin chat
 * Lightweight and easy chat
 */

/* global Hoodie */

Hoodie.extend(function (hoodie) {
  'use strict';

  var dualFollow = function (task) {
    var defer = window.jQuery.Deferred();
    defer.notify('dualFollow', arguments, false);
    hoodie.task('chatdualfollow').start(task)
      .then(defer.resolve)
      .fail(defer.reject);
    hoodie.remote.push();
    return defer.promise();
  };

  var findTalkByParticipant = function (participants) {
    var defer = window.jQuery.Deferred();
    defer.notify('findTalkByParticipant', arguments, false);
    hoodie.store.findAll('chat')
      .then(function (chats) {
        var chat = chats.map(function (cv) {
          var found = cv.participants
            .map(function (cpv) {
              return (participants.indexOf(cpv) >= 0);
            })
            .reduce(function (a, c) {
              return a && c;
            });
          if (found)
            return cv;
        });
        defer.resolve(chat[0]);
      })
      .fail(defer.reject);
    return defer.promise();
  };

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

    talk: function (userName) {
      var defer = window.jQuery.Deferred();
      defer.notify('talk', arguments, false);
      hoodie.chat.getProfile(userName)
        .fail(defer.reject)
        .then(function (task) {
          task.chat = {
            dualFollow: {
              to: task.profile.userId,
              from: hoodie.id()
            }
          };
          var participants = [task.chat.dualFollow.to, task.chat.dualFollow.from];
          var chat = {
            participants: participants,
            messages: []
          };
          dualFollow(task)
            .then(function () {
              hoodie.store.add('chat', chat)
                .then(defer.resolve)
                .fail(defer.reject);
            })
            .fail(function (err) {
              if (err.err !== 'You already subscribed.')
                defer.reject(err);
              else
                findTalkByParticipant(participants)
                  .then(function (talk) {
                    if (talk) {
                      defer.resolve(talk);
                    } else {
                      hoodie.store.add('chat', chat)
                        .then(defer.resolve)
                        .fail(defer.reject);
                    }
                  })
                  .fail(defer.reject);
            });
        });
      return defer.promise();
    },
    updateTalk: function (talkObject) {
      var defer = window.jQuery.Deferred();
      defer.notify('updateTalk', arguments, false);
      hoodie.store.save('chat', talkObject.id, talkObject)
        .then(defer.resolve)
        .fail(defer.reject);
      return defer.promise();
    },
    deleteTalk: function (id) {
      var defer = window.jQuery.Deferred();
      defer.notify('deleteTalk', arguments, false);
      if (!id) {
        hoodie.store.removeAll('chat')
          .then(defer.resolve)
          .fail(defer.reject);
      } else {
        hoodie.store.remove('chat', id)
          .then(defer.resolve)
          .fail(defer.reject);
      }
      return defer.promise();
    },
    feed: function () {
      var defer = window.jQuery.Deferred();
      defer.notify('feed', arguments, false);
      hoodie.store.findAll('chat')
        .then(function (chats) {
          var task = {
            chat: {
              feed: chats
            }
          };
          defer.resolve(task);
        })
        .fail(defer.reject);

      return defer.promise();
    },
    message: function (talkObject, messageObject) {
      var defer = window.jQuery.Deferred();
      defer.notify('message', arguments, false);
      messageObject.id = (Date.now()).toString(36);
      messageObject.owner = {
        userId: hoodie.id()
      };
      talkObject.messages.push(messageObject);
      hoodie.store.save('chat', talkObject.id, talkObject)
        .then(function (chat) {
          var task = {
            chat: chat
          };
          task.chat.message = messageObject;
          defer.resolve(task)
        })
        .fail(defer.reject);
      return defer.promise();
    },
    updateMessage: function (talkObject, messageObject) {
      var defer = window.jQuery.Deferred();
      defer.notify('message', arguments, false);
      var index;
      talkObject.messages
        .map(function (v, k) {
          if (v.id === messageObject.id)
            index = k;
        });
      if (talkObject.messages[index].owner.userId !== hoodie.id()) {
        defer.reject('you is not the owner of the message')
      } else {
        talkObject.messages[index] = messageObject;
        hoodie.store.save('chat', talkObject.id, talkObject)
          .then(function (chat) {
            var task = {
              chat: chat
            };
            task.chat.message = messageObject;
            defer.resolve(task)
          })
          .fail(defer.reject);
      }
      return defer.promise();
    },
    deleteMessage: function (talkObject, messageObject) {
      var defer = window.jQuery.Deferred();
      defer.notify('message', arguments, false);
      var index;
      talkObject.messages
        .map(function (v, k) {
          if (v.id === messageObject.id)
            index = k;
        });
      if (talkObject.messages[index].owner.userId !== hoodie.id()) {
        defer.reject('you is not the owner of the message')
      } else {
        talkObject.messages.splice(index, 1);
        hoodie.store.save('chat', talkObject.id, talkObject)
          .then(function (chat) {
            var task = {
              chat: chat
            };
            task.chat.message = messageObject;
            defer.resolve(task)
          })
          .fail(defer.reject);
      }
      return defer.promise();
    },
    getTalk: function (talkObject) {
      var defer = window.jQuery.Deferred();
      defer.notify('getTalk', arguments, false);
      hoodie.store.find('chat', talkObject.id)
        .then(defer.resolve)
        .fail(defer.reject);
      return defer.promise();
    },
    on: function(cb) {
      hoodie.store.on('chat:change', cb);
    }
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
