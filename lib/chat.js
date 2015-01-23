/**
 * Dependencies
 */

var async = require('async');
var PubSub = require('hoodie-plugin-pubsub/lib');
var Profile = require('hoodie-plugin-profile/lib');
var utils = require('hoodie-utils-plugins')('chat:chat');
var log = utils.debug();
var ExtendedDatabaseAPI = utils.ExtendedDatabaseAPI;
var _ = require('underscore');

module.exports = function (hoodie, dbPluginProfile) {
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
    task.pubsub.subject = 'post';
    return pubsub.subscribe(db, task, cb);
  };

  var unsubscribe = function (task, db, cb) {
    log('unsubscribe', task);
    task.pubsub = {
      userId: task.profile.userId,
      subject: 'post'
    };
    return pubsub.unsubscribe(db, task, cb);
  };

  var _post = function (task, db, cb) {
    log('_post', task);
    var _db = new ExtendedDatabaseAPI(hoodie, hoodie.database(db));

    // @fix _db.add not generating id
    task.chat.post.id = (Date.now()).toString(36);
    task.chat.post.owner = {
      db: db,
      userName: task.chat.userName,
      userId: db.split('/').pop()
    };
    _db.add('post', task.chat.post, function (err, doc) {
      task.chat.post = doc;
      cb(err, task);
    });
  };

  // @todo update only if owner
  var _updatePost = function (task, db, cb) {
    log('_updatePost', task);
    var _db = new ExtendedDatabaseAPI(hoodie, hoodie.database(db));
    _db.update('post', task.chat.post.id, task.chat.post, function (err, doc) {
      task.chat.post = doc;
      cb(err, task);
    });
  };

  // @todo delete only if owner
  var _deletePost = function (task, db, cb) {
    log('_deletePost', task);
    var _db = new ExtendedDatabaseAPI(hoodie, hoodie.database(db));
    if (!task.chat.post || !task.chat.post.id) {
      _db.removeAll('post', function (err, doc) {
        task.chat.post = doc;
        cb(err, task);
      });
    } else {
      _validateOwner(task, db, function (err) {
        if (err) return cb(err, task);
        _db.remove('post', task.chat.post.id, function (err, doc) {
          task.chat.post = doc;
          cb(err, task);
        });
      });
    }
  };

  var _feed = function (task, db, cb) {
    log('_feed', task);
    var _db = new ExtendedDatabaseAPI(hoodie, hoodie.database('user/' + task.chat.userId));
    _db.findAll('post', function (err, doc) {
      task.chat.feed = doc;
      if (err && err.error === 'not_found') return cb(null, task);
      cb(err, task);
    });
  };

  var _validateOwner = function (task, db, cb) {
    log('_validateOwner', task);
    _findPost(task, db, function (err) {
      if (task.chat.post.owner.db !== db) return cb('you should not pass! <|>:-|>', task);
      cb(err, task);
    });
  };

  var _findPost = function (task, db, cb) {
    log('_findPost', task);
    var _db = new ExtendedDatabaseAPI(hoodie, hoodie.database(db));
    _db.find('post', task.chat.post.id, function (err, doc) {
      if (err && err.error === 'not_found') return cb(null, task);
      task.chat.post = doc;
      cb(err, task);
    });
  };

  var _comment = function (task, db, cb) {
    log('_comment', task);
    _findPost(task, task.chat.post.owner.db, function (err, _task) {
      var doc = _task.chat.post;
      if (!doc.comments) doc.comments = [];
      task.chat.comment.id = (Date.now()).toString(36);
      task.chat.comment.owner = {
        db: db,
        userName: task.chat.userName,
        userId: db.split('/').pop()
      };
      task.chat.comment.createdAt = new Date();
      doc.comments.push(task.chat.comment);
      _updatePost(task, task.chat.post.owner.db, cb);
    });
  };

  var _updateComment = function (task, db, cb) {
    log('_updateComment', task);
    var commentId = task.chat.comment.id;

    _findPost(task, task.chat.post.owner.db, function (err, _task) {
      var doc = _task.chat.post;

      if (!doc.comments) return cb('Comment not found.', task);

      doc.comments.map(function (comment, i) {
        if (comment.id !== commentId) return;
        if (!comment.owner || comment.owner.db !== db) return cb('you should not pass! <|>:-|>');

        doc.comments[i] = task.chat.comment;
        doc.comments[i].id = comment.id;

        return _updatePost(task, task.chat.post.owner.db, cb);
      });
    });
  };

  var _deleteComment = function (task, db, cb) {
    log('_deleteComment', task);
    var commentId = task.chat.comment.id;

    _findPost(task, task.chat.post.owner.db, function (err, _task) {
      var doc = _task.chat.post;

      if (!doc.comments) return cb('Comment not found.', task);

      doc.comments.map(function (comment, i) {
        if (comment.id !== commentId) return;
        if (!comment.owner || comment.owner.db !== db) return cb('you should not pass! <|>:-|>');

        doc.comments.splice(i, 1);

        return _updatePost(task, task.chat.post.owner.db, cb);
      });
    });
  };

  var _count = function (task, db, cb) {
    log('_count', task);
    _findPost(task, task.chat.post.owner.db, function (err, _task) {
      var doc = _task.chat.post;
      if (!doc.countType) doc.countType = {};
      if (!doc.countType[task.chat.countType]) doc.countType[task.chat.countType] = [];
      doc.countType[task.chat.countType].push(db);
      _updatePost(task, task.chat.post.owner.db, cb);
    });
  };

  var _uncount = function (task, db, cb) {
    log('_uncount', task);
    _findPost(task, task.chat.post.owner.db, function (err, _task) {
      var doc = _task.chat.post;
      if (!doc.countType) return cb(null, task);
      if (!doc.countType[task.chat.countType]) cb(null, task);
      doc.countType[task.chat.countType].splice(doc.countType[task.chat.countType].indexOf(db), 1);
      _updatePost(task, task.chat.post.owner.db, cb);
    });
  };

  var _sharePost = function (task, db, cb) {
    log('_sharePost', task);
    _findPost(task, task.chat.post.owner.db, function (err, _task) {
      var doc = _task.chat.post;
      doc.sourceId = _task.chat.post.id;
      delete doc._rev;
      _post(task, db, cb);
    });
  };

  var _mimicTaskSubscribe = function (task, userId, cb) {
    task.profile = {
      userId: userId
    };
    cb();
  };

  var _getProfilesAsObject = function (task, db, cb) {
    log('_getProfilesAsObject', task);
    var ids =  task.chat.feed.map(function (v, k, a) {
      return v.owner && v.owner.userId;
    })
    dbPluginProfile.findSome('profile', ids, function (err, rows) {
      if (err) return cb(err);
      task.chat.profiles = {};
      rows.map(function (v) {
        task.chat.profiles[v.doc.userId] = v.doc;
      })
      cb();
    });
  };

  var _setProfilesIntoPost = function (task, db, cb) {
    log('_setProfilesIntoPost', task);
    task.chat.feed.map(function (v, k, a) {
      a[k].owner = task.chat.profiles[v.owner.userId];
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

  Chat.follow = function (db, task) {
    log('follow', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'userName'),
        async.apply(_lookup, task, db),
        async.apply(subscribe, task, db)
      ],
      utils.handleTask(hoodie, 'follow', db, task)
    );
  };


  Chat.unfollow = function (db, task) {
    log('unfollow', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'userName'),
        async.apply(_lookup, task, db),
        async.apply(unsubscribe, task, db)
      ],
      utils.handleTask(hoodie, 'unfollow', db, task)
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

  Chat.post = function (db, task) {
    log('post', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'userName'),
        async.apply(_verifyAttrs, task.chat, 'post'),
        async.apply(_post, task, db)
      ],
      utils.handleTask(hoodie, 'post', db, task)
    );
  };

  Chat.getPost = function (db, task) {
    log('getPost', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'post'),
        async.apply(_verifyAttrs, task.chat.post, 'id'),
        async.apply(_findPost, task, db)
      ],
      utils.handleTask(hoodie, 'getPost', db, task)
    );
  };

  Chat.updatePost = function (db, task) {
    log('updatePost', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'userName'),
        async.apply(_verifyAttrs, task.chat, 'post'),
        async.apply(_verifyAttrs, task.chat.post, 'id'),
        async.apply(_validateOwner, task, db),
        async.apply(_updatePost, task, db)
      ],
      utils.handleTask(hoodie, 'updatePost', db, task)
    );
  };

  Chat.deletePost = function (db, task) {
    log('deletePost', task);

    async.series([
//        async.apply(_verifyAttrs, task, 'userId'),
        async.apply(_deletePost, task, db)
      ],
      utils.handleTask(hoodie, 'deletePost', db, task)
    );
  };

  Chat.feed = function (db, task) {
    log('feed', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'userId'),
        async.apply(_feed, task, db),
        async.apply(_getProfilesAsObject, task, db),
        async.apply(_setProfilesIntoPost, task, db),
      ],
      utils.handleTask(hoodie, 'feed', db, task)
    );
  };

  Chat.comment = function (db, task) {
    log('comment', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'post'),
        async.apply(_verifyAttrs, task.chat.post, 'id'),
        async.apply(_verifyAttrs, task.chat, 'comment'),
        async.apply(_findPost, task, db),
        async.apply(_comment, task, db)
      ],
      utils.handleTask(hoodie, 'comment', db, task)
    );
  };

  Chat.count = function (db, task) {
    log('count', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'post'),
        async.apply(_verifyAttrs, task.chat.post, 'id'),
        async.apply(_verifyAttrs, task.chat, 'countType'),
        async.apply(_findPost, task, db),
        async.apply(_count, task, db)
      ],
      utils.handleTask(hoodie, 'count', db, task)
    );
  };

  Chat.uncount = function (db, task) {
    log('uncount', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'post'),
        async.apply(_verifyAttrs, task.chat.post, 'id'),
        async.apply(_verifyAttrs, task.chat, 'countType'),
        async.apply(_findPost, task, db),
        async.apply(_uncount, task, db)
      ],
      utils.handleTask(hoodie, 'uncount', db, task)
    );
  };

  Chat.updateComment = function (db, task) {
    log('updateComment', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'post'),
        async.apply(_verifyAttrs, task.chat.post, 'id'),
        async.apply(_verifyAttrs, task.chat, 'comment'),
        async.apply(_verifyAttrs, task.chat.comment, 'id'),
        async.apply(_updateComment, task, db)
      ],
      utils.handleTask(hoodie, 'updateComment', db, task)
    );
  };

  Chat.deleteComment = function (db, task) {
    log('deleteComment', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'post'),
        async.apply(_verifyAttrs, task.chat.post, 'id'),
        async.apply(_verifyAttrs, task.chat, 'comment'),
        async.apply(_verifyAttrs, task.chat.comment, 'id'),
        async.apply(_deleteComment, task, db)
      ],
      utils.handleTask(hoodie, 'deleteComment', db, task)
    );
  };

  Chat.sharePost = function (db, task) {
    log('sharePost', task);

    async.series([
        async.apply(_verifyAttrs, task, 'chat'),
        async.apply(_verifyAttrs, task.chat, 'post'),
        async.apply(_verifyAttrs, task.chat.post, 'id'),
        async.apply(_sharePost, task, db)
      ],
      utils.handleTask(hoodie, 'sharePost', db, task)
    );
  };

  return Chat;
};
