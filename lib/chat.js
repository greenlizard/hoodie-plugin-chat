/**
 * Dependencies
 */

var async = require('async');

var Profile = require('hoodie-plugin-profile/lib');
var utils = require('hoodie-utils-plugins')('chat:chat');
var log = utils.debug();
var ExtendedDatabaseAPI = utils.ExtendedDatabaseAPI;


module.exports = function (hoodie, dbPluginProfile) {
  var Chat = this;

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

  var _talk = function (task, db, cb) {
    log('_talk', task);
    var _db = new ExtendedDatabaseAPI(hoodie, hoodie.database(db));

    // @fix _db.add not generating id
    task.chat.talk.id = (Date.now()).toString(36);
    task.chat.talk.owner = {
      db: db,
      userName: task.chat.userName,
      userId: db.split('/').pop()
    };
    _db.add('talk', task.chat.talk, function (err, doc) {
      task.chat.talk = doc;
      cb(err, task);
    });
  };

  // @todo update only if owner
  var _updateTalk = function (task, db, cb) {
    log('_updateTalk', task);
    var _db = new ExtendedDatabaseAPI(hoodie, hoodie.database(db));
    _db.update('talk', task.chat.talk.id, task.chat.talk, function (err, doc) {
      task.chat.talk = doc;
      cb(err, task);
    });
  };

  // @todo delete only if owner
  var _deleteTalk = function (task, db, cb) {
    log('_deleteTalk', task);
    var _db = new ExtendedDatabaseAPI(hoodie, hoodie.database(db));
    if (!task.chat.talk || !task.chat.talk.id) {
      _db.removeAll('talk', function (err, doc) {
        task.chat.talk = doc;
        cb(err, task);
      });
    } else {
      _validateOwner(task, db, function (err) {
        if (err) return cb(err, task);
        _db.remove('talk', task.chat.talk.id, function (err, doc) {
          task.chat.talk = doc;
          cb(err, task);
        });
      });
    }
  };

  var _feed = function (task, db, cb) {
    log('_feed', task);
    var _db = new ExtendedDatabaseAPI(hoodie, hoodie.database('user/' + task.chat.userId));
    _db.findAll('talk', function (err, doc) {
      task.chat.feed = doc;
      if (err && err.error === 'not_found') return cb(null, task);
      cb(err, task);
    });
  };

  var _validateOwner = function (task, db, cb) {
    log('_validateOwner', task);
    _findTalk(task, db, function (err) {
      if (task.chat.talk.owner.db !== db) return cb('you should not pass! <|>:-|>', task);
      cb(err, task);
    });
  };

  var _findTalk = function (task, db, cb) {
    log('_findTalk', task);
    var _db = new ExtendedDatabaseAPI(hoodie, hoodie.database(db));
    _db.find('talk', task.chat.talk.id, function (err, doc) {
      if (err && err.error === 'not_found') return cb(null, task);
      task.chat.talk = doc;
      cb(err, task);
    });
  };

  var _message = function (task, db, cb) {
    log('_message', task);
    _findTalk(task, task.chat.talk.owner.db, function (err, _task) {
      var doc = _task.chat.talk;
      if (!doc.messages) doc.messages = [];
      task.chat.message.id = (Date.now()).toString(36);
      task.chat.message.owner = {
        db: db,
        userName: task.chat.userName,
        userId: db.split('/').pop()
      };
      task.chat.message.createdAt = new Date();
      doc.messages.push(task.chat.message);
      _updateTalk(task, task.chat.talk.owner.db, cb);
    });
  };

  var _updateMessage = function (task, db, cb) {
    log('_updateMessage', task);
    var messageId = task.chat.message.id;

    _findTalk(task, task.chat.talk.owner.db, function (err, _task) {
      var doc = _task.chat.talk;

      if (!doc.messages) return cb('Message not found.', task);

      doc.messages.map(function (message, i) {
        if (message.id !== messageId) return;
        if (!message.owner || message.owner.db !== db) return cb('you should not pass! <|>:-|>');

        doc.messages[i] = task.chat.message;
        doc.messages[i].id = message.id;

        return _updateTalk(task, task.chat.talk.owner.db, cb);
      });
    });
  };

  var _deleteMessage = function (task, db, cb) {
    log('_deleteMessage', task);
    var messageId = task.chat.message.id;

    _findTalk(task, task.chat.talk.owner.db, function (err, _task) {
      var doc = _task.chat.talk;

      if (!doc.messages) return cb('Message not found.', task);

      doc.messages.map(function (message, i) {
        if (message.id !== messageId) return;
        if (!message.owner || message.owner.db !== db) return cb('you should not pass! <|>:-|>');

        doc.messages.splice(i, 1);

        return _updateTalk(task, task.chat.talk.owner.db, cb);
      });
    });
  };

  var _shareTalk = function (task, db, cb) {
    log('_shareTalk', task);
    _findTalk(task, task.chat.talk.owner.db, function (err, _task) {
      var doc = _task.chat.talk;
      doc.sourceId = _task.chat.talk.id;
      delete doc._rev;
      _talk(task, db, cb);
    });
  };


  var _getProfilesAsObject = function (task, db, cb) {
    log('_getProfilesAsObject', task);
    if (!task.chat.feed)
      return cb();
    var ids =  task.chat.feed.map(function (v) {
      return v.owner && v.owner.userId;
    });
    dbPluginProfile.findSome('profile', ids, function (err, rows) {
      if (err) return cb(err);
      task.chat.profiles = {};
      rows.map(function (v) {
        task.chat.profiles[v.doc.userId] = v.doc;
      });
      cb();
    });
  };

  var _setProfilesIntoTalk = function (task, db, cb) {
    log('_setProfilesIntoTalk', task);
    if (!task.chat.feed)
      return cb();
    task.chat.feed.map(function (v) {
      v.owner = task.chat.profiles[v.owner.userId];
    });
    delete task.chat.profiles;
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


  Chat.talk = function (db, task) {
    log('talk', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'userName'),
        async.apply(_verifyAttrs, task.chat, 'talk'),
        async.apply(_talk, task, db)
      ],
      utils.handleTask(hoodie, 'talk', db, task)
    );
  };

  Chat.getTalk = function (db, task) {
    log('getTalk', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'talk'),
        async.apply(_verifyAttrs, task.chat.talk, 'id'),
        async.apply(_findTalk, task, db)
      ],
      utils.handleTask(hoodie, 'getTalk', db, task)
    );
  };

  Chat.updateTalk = function (db, task) {
    log('updateTalk', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'userName'),
        async.apply(_verifyAttrs, task.chat, 'talk'),
        async.apply(_verifyAttrs, task.chat.talk, 'id'),
        async.apply(_validateOwner, task, db),
        async.apply(_updateTalk, task, db)
      ],
      utils.handleTask(hoodie, 'updateTalk', db, task)
    );
  };

  Chat.deleteTalk = function (db, task) {
    log('deleteTalk', task);

    async.series([
//        async.apply(_verifyAttrs, task, 'userId'),
        async.apply(_deleteTalk, task, db)
      ],
      utils.handleTask(hoodie, 'deleteTalk', db, task)
    );
  };

  Chat.feed = function (db, task) {
    log('feed', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'userId'),
        async.apply(_feed, task, db),
        async.apply(_getProfilesAsObject, task, db),
        async.apply(_setProfilesIntoTalk, task, db),
      ],
      utils.handleTask(hoodie, 'feed', db, task)
    );
  };

  Chat.message = function (db, task) {
    log('message', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'talk'),
        async.apply(_verifyAttrs, task.chat.talk, 'id'),
        async.apply(_verifyAttrs, task.chat, 'message'),
        async.apply(_findTalk, task, db),
        async.apply(_message, task, db)
      ],
      utils.handleTask(hoodie, 'message', db, task)
    );
  };

  Chat.updateMessage = function (db, task) {
    log('updateMessage', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'talk'),
        async.apply(_verifyAttrs, task.chat.talk, 'id'),
        async.apply(_verifyAttrs, task.chat, 'message'),
        async.apply(_verifyAttrs, task.chat.message, 'id'),
        async.apply(_updateMessage, task, db)
      ],
      utils.handleTask(hoodie, 'updateMessage', db, task)
    );
  };

  Chat.deleteMessage = function (db, task) {
    log('deleteMessage', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'talk'),
        async.apply(_verifyAttrs, task.chat.talk, 'id'),
        async.apply(_verifyAttrs, task.chat, 'message'),
        async.apply(_verifyAttrs, task.chat.message, 'id'),
        async.apply(_deleteMessage, task, db)
      ],
      utils.handleTask(hoodie, 'deleteMessage', db, task)
    );
  };

  Chat.shareTalk = function (db, task) {
    log('shareTalk', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'talk'),
        async.apply(_verifyAttrs, task.chat.talk, 'id'),
        async.apply(_shareTalk, task, db)
      ],
      utils.handleTask(hoodie, 'shareTalk', db, task)
    );
  };

  return Chat;
};
