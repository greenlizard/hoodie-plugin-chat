/**
 * Hoodie plugin chat
 * Lightweight and easy chat
 */

/* global Hoodie */

Hoodie.extend(function (hoodie) {
  'use strict';
  var _talks = {};

  var genFake = function (profile, talks) {
    if (profile.id !== hoodie.id()) {
      talks['fake-' + profile.id] = {
        profile: profile
      };
    }
  };

  var cleanFake = function (talk, talks) {
    talk.exclusive.map(function (userId) {
      if (userId !== hoodie.id()) {
        talk.profile = talk.profiles[userId];
        talks[talk.id] = talk;
        delete talks['fake-' + userId];
      }
    });
  };

  hoodie.store.on('profile:add', function (profile) {
    genFake(profile, _talks);
    hoodie.trigger('ontalk', _talks);
  });

  hoodie.store.on('talk:add', function (talk) {
    cleanFake(talk, _talks);
    hoodie.trigger('ontalk', _talks);
  });

  hoodie.store.on('message:add', function (message) {
    if (!!_talks && _talks[message.talkId]) {
      _talks[message.talkId].messages = _talks[message.talkId].messages || [];
      _talks[message.talkId].messages.push(message);
    }
    if (hoodie.chat.currentTalk && message.talkId === hoodie.chat.currentTalk.id)
      hoodie.trigger('onmessage', message);
  });


  function checkChatStatus() {
    setTimeout(function () {
      hoodie.profile.update({lastChatCheck: new Date()})
        .then(function () {
          var defer = window.jQuery.Deferred();
          hoodie.store.findAll('profile')
            .then(defer.resolve)
            .fail(defer.reject);
          return defer.promise();
        })
        .then(function (profiles) {

          return window.jQuery.when(profiles.map(function (profile) {
            var check = window.moment(profile.lastChatCheck)._d,
            now = window.moment()._d;
            profile.online = window.moment.duration(check, now, 'm') < 5;
            return hoodie.profile.update(profile, profile.id);
          }));

        })
        .always(function () {
          checkChatStatus();
        });
    }, 10000);
  }
  checkChatStatus();

  hoodie.chat = {

    currentTalk: null,
    pubsubtypes: ['talk', 'message'],

    getProfile: function (userId) {
      var defer = window.jQuery.Deferred();
      defer.notify('getProfile', arguments, false);
      hoodie.profile.get(userId)
        .then(defer.resolve)
        .fail(defer.reject);
      return defer.promise();
    },
    setCurrentTalk: function (talk) {
      var defer = window.jQuery.Deferred();
      defer.notify('getProfile', arguments, false);
      hoodie.chat.currentTalk = talk;
      defer.resolve(talk);
      return defer.promise();
    },

    talk: function (userId) {
      var defer = window.jQuery.Deferred();
      defer.notify('talk', arguments, false);

      hoodie.remote.sync();
      var participants = [ userId, hoodie.id() ];
      hoodie.profile.getAsObjects(participants)
        .then(function (profiles) {
          var chat = {
            userId: hoodie.id(),
            exclusive: participants,
            profiles: profiles
          };

          hoodie.pubsub.bidirectional(userId, hoodie.chat.pubsubtypes)
            .then(function () {
              hoodie.store.add('talk', chat)
                .then(function (talk) {
                  hoodie.chat.currentTalk = talk;
                  defer.resolve(talk);
                })
                .fail(defer.reject);
            })
            .fail(function (err) {
              if (err.err !== 'You already subscribed.')
                defer.reject(err);
              else
                hoodie.chat.getTalkByUserId(userId)
                .then(function (talk) {
                  hoodie.chat.currentTalk = talk;
                  defer.resolve(talk);
                })
                .fail(defer.reject);
            });
        })
        .fail(defer.reject);

      return defer.promise();
    },
    deleteTalk: function (id) {
      var defer = window.jQuery.Deferred();
      defer.notify('deleteTalk', arguments, false);
      if (!id) {
        hoodie.store.removeAll('talk')
          .then(defer.resolve)
          .fail(defer.reject);
      } else {
        hoodie.store.remove('talk', id)
          .then(defer.resolve)
          .fail(defer.reject);
      }
      return defer.promise();
    },
    feed: function () {
      var defer = window.jQuery.Deferred();
      defer.notify('feed', arguments, false);
      var result = {};
      hoodie.store.findAll('profile')
        .then(function (profiles) {
          profiles.map(function (profile) {
            genFake(profile, result);
          });
          return hoodie.store.findAll('talk');
        })
        .then(function (talks) {
          talks.map(function (_talk) {
            cleanFake(_talk, result);
          });
          defer.resolve(result);
        })
        .fail(defer.reject);

      return defer.promise();
    },
    message: function (talkObject, messageObject) {
      var defer = window.jQuery.Deferred();
      defer.notify('message', arguments, false);

      messageObject.talkId = talkObject.id;
      messageObject.exclusive = talkObject.exclusive;
      messageObject.userId = hoodie.id();

      hoodie.store.add('message', messageObject)
        .then(defer.resolve)
        .fail(defer.reject);
      return defer.promise();
    },
    setMessages: function (talkId, talk) {
      var defer = window.jQuery.Deferred();
      defer.notify('setMessages', arguments, false);
      hoodie.chat.getMessages(talkId)
        .then(function (messages) {
          talk.messages = messages;
          defer.resolve(talk);
        })
        .fail(defer.reject);
      return defer.promise();
    },
    getMessages: function (talkId) {
      var defer = window.jQuery.Deferred();
      defer.notify('getMessages', arguments, false);
      hoodie.store.findAll('message')
        .then(function (messages) {
          var filteredMessages = messages.filter(function (message) {
            return (message.talkId === talkId);
          })
          .reverse();
          defer.resolve(filteredMessages);
        })
        .fail(function () {
          defer.resolve([]);
        });
      return defer.promise();
    },
    getTalk: function (talkId) {
      var defer = window.jQuery.Deferred();
      defer.notify('getTalk', arguments, false);
      hoodie.store.find('talk', talkId)
        .then(function (talk) {
          return hoodie.chat.setMessages(talkId, talk);
        })
        .then(function (talk) {
          hoodie.chat.currentTalk = talk;
          defer.resolve(talk);
        })
        .fail(defer.reject);
      return defer.promise();
    },
    getTalkByUserId: function (userId) {
      var defer = window.jQuery.Deferred();
      defer.notify('getTalkByUserId', arguments, false);
      var find = false;
      hoodie.store.findAll('talk')
        .then(function (talks) {
          var talk = talks.filter(function (_talk) {

            return _talk.exclusive
              .map(function (v) {
                return (v === userId);
              })
              .reduce(function (b, c) {
                return b || c;
              }, false);

          });
          if (talk.length > 0) {
            hoodie.chat.setMessages(talk.id, talk)
              .then(function (talk) {
                hoodie.chat.currentTalk = talk;
                defer.resolve(talk);
              })
              .fail(defer.reject);
          } else {
            defer.reject('chat not found');
          }
        })
        .fail(defer.reject);
      return defer.promise();
    },
    onTalk: function (cb) {
      hoodie.on('ontalk', cb);
    },
    onMessage: function (cb) {
      hoodie.on('onmessage', cb);
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
