var async = require('async'),
    utils = require('hoodie-utils-plugins')('chat:db'),
    ExtendedDatabaseAPI = utils.ExtendedDatabaseAPI;

module.exports = function (hoodie, dbname) {

  /**
   * Profile _dbname
   */

  var db = new ExtendedDatabaseAPI(hoodie, hoodie.database(dbname));

  /**
   * Profile dbAdd
   */

  var dbAdd = function (hoodie, callback) {
    hoodie.database.add(dbname, function (err) {
      callback(err);
    });
  };

  var addLookupByUserName = function (callback) {

    var index = {
      map: function (doc) {
        if (doc.userName)
          emit(doc.userName, doc.userId);
      }
    };

    db.addIndex('by_userName', index, function (err) {
      if (err) {
        return callback(err);
      }

      return callback();
    });
  };

  async.series([
    async.apply(dbAdd, hoodie),
    async.apply(addLookupByUserName),
  ],
  function (err) {
    if (err) {
      console.error(
        'setup db error() error:\n' + (err.stack || err.message || err.toString())
      );
    }
  });

  return db;
};
