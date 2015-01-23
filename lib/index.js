var ChatApi = require('./chat');
//var Db = require('./db');
var _ = require('underscore');
//var async = require('async');
var utils = require('hoodie-utils-plugins')('chat:index');
var ExtendedDatabaseAPI = utils.ExtendedDatabaseAPI;

module.exports = function (hoodie) {
  var chat = {};
//  var usersDb = new ExtendedDatabaseAPI(hoodie, hoodie.database('_users'));
//  var pluginDb = new Db(hoodie, 'plugins/hoodie-plugin-chat', usersDb);
  var dbPluginProfile = new ExtendedDatabaseAPI(hoodie, hoodie.database('plugins/hoodie-plugin-profile'));

  _.extend(chat,  new ChatApi(hoodie, dbPluginProfile));



  return chat;
};
