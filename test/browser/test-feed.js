suite('feed', function () {
  this.timeout(50000);

  suiteSetup(loadUsers);
  suiteSetup(cleanAllTalks);

  test('signIn hommer', function (done) {
    hoodie.account.signIn('Hommer', '123')
      .fail(function (err) {
        done();
        assert.ok(false, err.message);
      })
      .done(function () {
        assert.equal(
          hoodie.account.username,
          'hommer',
          'should be logged in after signup'
        );
        done();
      });
  });

  test('hommer should talk lisa', function (done) {
    hoodie.chat.talk(_.find(window.fixtures.users, { username: 'Lisa' }).hoodieId)
      .fail(function (err) {
        done(err);
        assert.ok(false, err.message);
      })
      .then(function () {
        assert.ok(true, 'talk with success');
        done();
      });
  });

  test('hommer should get talk/text feed', function (done) {
    hoodie.chat.feed()
      .fail(done)
      .then(function (tasks) {
        this.hommerTalk = tasks[0];
        done();
        assert.ok(true, 'feed with success');
      }.bind(this));
  });

  test('lisa should talk', function (done) {
    signinUser('Lisa', '123', function () {
      hoodie.chat.talk(_.find(window.fixtures.users, { username: 'Hommer' }).hoodieId)
        .fail(function (err) {
          done((err.message !== 'conflict') ? err: null);
          assert.ok(false, err.message);
        })
        .then(function (talk) {
          assert.ok(true, 'talk with success');
          done();
        });
    })
  });

  test('lisa should delete hommer talk', function (done) {
    var hommerTalk = this.hommerTalk;

    hoodie.chat.deleteTalk(hommerTalk)
      .fail(function () {
        done();
        assert.ok(false, 'talk hould delete only by owner');
      })
      .then(function () {
        done();
        assert.ok(true, 'talk should delete by lisa');
      });
  });

  test('hommer should get 0 talk in his feed', function (done) {
    signinUser('Hommer', '123', function () {
      hoodie.chat.feed()
        .fail(function (err) {
          done(err);
          assert.ok(false, err.message);
        })
        .then(function (feed) {
          done();
          assert.ok(feed.rows.length === 0, 'feed with success');
        });
    })
  });


  test('hommer should talk lisa', function (done) {
    hoodie.chat.talk(_.find(window.fixtures.users, { username: 'Lisa' }).hoodieId)
      .fail(function (err) {
        done(err);
        assert.ok(false, err.message);
      })
      .then(function (chat) {
        this.hommerTalk = chat;
        assert.ok(true, 'talk with success');
        done();
      }.bind(this));
  });

  test('hommer should message lisa talk', function (done) {
    var hommerTalk = this.hommerTalk;

    hoodie.chat.message(hommerTalk, {text: 'vegan means eat bacon right?!'})
      .fail(done)
      .then(function (message) {
        this.hommerMessage = message;
        assert.ok(true, 'message with success');
        done();
      }.bind(this));
  });

  test('lisa should message lisa talk', function (done) {
    var hommerTalk = this.hommerTalk;
    signinUser('Lisa', '123', function () {
      hoodie.chat.message(hommerTalk, {text: 'no daddy bacon is an animal!'})
        .fail(done)
        .then(function (message) {
          this.lisaMessage = message;
          assert.ok(true, 'message with success');
          done();
        }.bind(this));
    }.bind(this));
  });

  test('bart should message lisa talk', function (done) {
    var hommerTalk = this.hommerTalk;
    signinUser('Bart', '123', function () {
      hoodie.chat.message(hommerTalk, {text: 'bacon is not animal, right hommer?'})
      .fail(done)
      .then(function () {
        assert.ok(true, 'message with success');
        done();
      });
    })
  });

  test('homer should message again lisa talk', function (done) {
    var hommerTalk = this.hommerTalk;
    signinUser('Hommer', '123', function () {
      hoodie.chat.message(hommerTalk, {text: 'sure bacon is happynes!'})
      .fail(done)
      .then(function () {
        assert.ok(true, 'message with success');
        done();
      });
    })
  });


  test('hommer should get lisa talk', function (done) {
    var hommerTalk = this.hommerTalk;
    signinUser('Hommer', '123', function () {
      hoodie.chat.getTalk(hommerTalk)
        .fail(done)
        .then(function (task) {
          assert.ok(true, 'message with success');
          done();
        });
    })
  });


  test('hommer should delete his message', function (done) {
    var hommerTalk = this.hommerTalk;
    var hommerMessage = this.hommerMessage;
    signinUser('Hommer', '123', function () {
      hoodie.chat.deleteMessage(hommerTalk, hommerMessage)
        .fail(function (err) {
          done(err);
        })
        .then(function () {
          assert.ok(true, 'delete message with success');
          done();
        });
    })
  });

});
