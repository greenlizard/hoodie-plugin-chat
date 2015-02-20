var ChatApi = require('./chat');
var Db = require('./db');
var _ = require('underscore');
var async = require('async');
var utils = require('hoodie-utils-plugins')('chat:index');
var ProfileApi = require('hoodie-plugin-profile/lib');
var ExtendedDatabaseAPI = utils.ExtendedDatabaseAPI;

module.exports = function (hoodie) {
  var profile = new ProfileApi(hoodie);
  var chat = {};
  var usersDb = new ExtendedDatabaseAPI(hoodie, hoodie.database('_users'));
  var dbPluginName = 'plugins/hoodie-plugin-chat';
  var pluginDb = new Db(hoodie, dbPluginName, usersDb);

  _.extend(chat,  new ChatApi(hoodie, pluginDb));

  chat.addChatStatusEachUser = function (_doc) {
    if (_doc.$error) {
      // don't do any further processing to user docs with $error
      return;
    } else if (_doc._deleted && !_doc.$newUsername) {
      return;
    } else if (_doc.roles && _doc.roles.indexOf('confirmed') >= 0) {
      var userDbName = 'user/' + _doc.hoodieId;
      var userDb = new ExtendedDatabaseAPI(hoodie, hoodie.database(userDbName));

      var task2plugin = {
        profile: {
          subject: 'chatstatus',
          filter: 'profile_by_type',
          sourceDbName: userDbName,
          targetDbName: dbPluginName
        }
      };

      var _chatStatus = {
        id: _doc.hoodieId,
        db: userDbName,
        userId: _doc.hoodieId,
        userName: _doc.name.split('/').pop(),
        lastChatCheck: new Date(),
      };

      async.series([
        async.apply(profile.createReplication, userDbName, task2plugin),
        async.apply(userDb.add, 'chatstatus', _chatStatus)
      ],
      function (err) {
        var outerr = err && err.response && err.response.req && 'method: ' + err.response.req.method + ' ';
        outerr += err && err.response && err.response.req && 'path: ' + err.response.req.path + ' ';
        if (err) console.error('Chat.addChatStatusEachUser:', userDbName, err.error, outerr);
      });
    }
  };

  return chat;
};
