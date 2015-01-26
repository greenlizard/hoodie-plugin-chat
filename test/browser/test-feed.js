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

  test('hommer should talk', function (done) {
    hoodie.chat.talk({text: 'dooh!'})
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
      .then(function (task) {
        this.hommerTalk = task.chat.feed[0];
        done();
        assert.ok(true, 'feed with success');
      }.bind(this));
  });

  test('hommer should edit talk', function (done) {
    var hommerTalk = this.hommerTalk;
    hommerTalk.title = 'D\'oh Homer';
    hommerTalk.text = 'Hmm... Donuts!';

    hoodie.chat.updateTalk(hommerTalk)
      .fail(done)
      .then(function () {
        done();
        assert.ok(true, 'talk with success');
      });
  });

  test('lisa should talk', function (done) {
    signinUser('Lisa', '123', function () {
      hoodie.chat.talk({text: 'i m vegan!'})
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


  test('lisa should not edit hommer talk', function (done) {
    var hommerTalk = this.hommerTalk;
    hommerTalk.title = 'D\'oh Homer';
    hommerTalk.text = 'vegan daddy!!';

    hoodie.chat.updateTalk(hommerTalk)
      .fail(function () {
        done();
        assert.ok(true, 'talk should not edit by lisa');
      })
      .then(function () {
        done();
        assert.ok(false, 'talk hould edit only by owner');
      });
  });


  test('lisa should not delete hommer talk', function (done) {
    var hommerTalk = this.hommerTalk;

    hoodie.chat.deleteTalk(hommerTalk)
      .fail(function () {
        done();
        assert.ok(true, 'talk should not delete by lisa');
      })
      .then(function () {
        done();
        assert.ok(false, 'talk hould delete only by owner');
      });
  });

  test('hommer should get 2 talk in his feed', function (done) {
    signinUser('Hommer', '123', function () {
      hoodie.chat.feed()
        .fail(function (err) {
          done(err);
          assert.ok(false, err.message);
        })
        .then(function (feed) {
          done();
          assert.ok(feed.rows.length == 2, 'feed with success');
        });
    })
  });

  test('hommer should get lisa feed', function (done) {
    hoodie.chat.feed('Lisa')
      .fail(function (err) {
        done(err);
        assert.ok(false, err.message);
      })
      .then(function (task) {
        this.lisaTalk = task.chat.feed[0];
        done();
        assert.ok(task.chat.feed.length == 1, 'feed with success');
      }.bind(this));
  });


 test('hommer should not edit lisa talk', function (done) {
    var lisaTalk = this.lisaTalk;
    lisaTalk.title = 'Lisaaa';
    lisaTalk.text = 'vegan?? chamed!';

    hoodie.chat.updateTalk(lisaTalk)
      .fail(function () {
        done();
        assert.ok(true, 'talk should not edit by hommer');
      })
      .then(function () {
        done();
        assert.ok(false, 'talk hould edit only by owner');
      });
  });


  test('hommer should not delete lisa talk', function (done) {
    var lisaTalk = this.lisaTalk;

    hoodie.chat.deleteTalk(lisaTalk)
      .fail(function () {
        done();
        assert.ok(true, 'talk should not delete by hommer');
      })
      .then(function () {
        done();
        assert.ok(false, 'talk hould delete only by owner');
      });
  });

  test('hommer should message lisa talk', function (done) {
    var lisaTalk = this.lisaTalk;

    hoodie.chat.message(lisaTalk, {text: 'vegan means eat bacon right?!'})
      .fail(done)
      .then(function (task) {
        this.hommerMessage = task.chat.message;
        assert.ok(true, 'message with success');
        done();
      }.bind(this));
  });

  test('lisa should message lisa talk', function (done) {
    var lisaTalk = this.lisaTalk;
    signinUser('Lisa', '123', function () {
      hoodie.chat.message(lisaTalk, {text: 'no daddy bacon is an animal!'})
        .fail(done)
        .then(function (task) {
          this.lisaMessage = task.chat.message;
          assert.ok(true, 'message with success');
          done();
        }.bind(this));
    }.bind(this));
  });

  test('bart should message lisa talk', function (done) {
    var lisaTalk = this.lisaTalk;
    signinUser('Bart', '123', function () {
      hoodie.chat.message(lisaTalk, {text: 'bacon is not animal, right hommer?'})
      .fail(done)
      .then(function () {
        assert.ok(true, 'message with success');
        done();
      });
    })
  });

  test('homer should message again lisa talk', function (done) {
    var lisaTalk = this.lisaTalk;
    signinUser('Hommer', '123', function () {
      hoodie.chat.message(lisaTalk, {text: 'sure bacon is happynes!'})
      .fail(done)
      .then(function () {
        assert.ok(true, 'message with success');
        done();
      });
    })
  });

  test('homer should like lisa talk', function (done) {
    var lisaTalk = this.lisaTalk;
    hoodie.chat.count(lisaTalk, 'like')
      .fail(done)
      .then(function () {
        assert.ok(true, 'message with success');
        done();
      });
  });


  test('lisa should like lisa talk', function (done) {
    var lisaTalk = this.lisaTalk;
    signinUser('Lisa', '123', function () {
      hoodie.chat.count(lisaTalk, 'like')
      .fail(done)
      .then(function () {
        assert.ok(true, 'message with success');
        done();
      });
    })
  });


  test('bart should like lisa talk', function (done) {
    var lisaTalk = this.lisaTalk;
    signinUser('Bart', '123', function () {
      hoodie.chat.count(lisaTalk, 'like')
      .fail(done)
      .then(function () {
        assert.ok(true, 'message with success');
        done();
      });
    })
  });


  test('hommer should unlike lisa talk', function (done) {
    var lisaTalk = this.lisaTalk;
    signinUser('Hommer', '123', function () {
      hoodie.chat.uncount(lisaTalk, 'like')
      .fail(done)
      .then(function () {
        assert.ok(true, 'message with success');
        done();
      });
    })
  });

  test('cat should like with like lisa talk', function (done) {
    var lisaTalk = this.lisaTalk;
    signinUser('Cat', '123', function () {
      hoodie.chat.like(lisaTalk)
      .fail(done)
      .then(function () {
        assert.ok(true, 'message with success');
        done();
      });
    })
  });

  test('dog should like with like lisa talk', function (done) {
    var lisaTalk = this.lisaTalk;
    signinUser('Dog', '123', function () {
      hoodie.chat.like(lisaTalk)
      .fail(done)
      .then(function () {
        assert.ok(true, 'message with success');
        done();
      });
    })
  });

  test('Dog should unlike with unlike lisa talk', function (done) {
    var lisaTalk = this.lisaTalk;
    signinUser('Dog', '123', function () {
      hoodie.chat.unlike(lisaTalk)
      .fail(done)
      .then(function () {
        assert.ok(true, 'message with success');
        done();
      });
    })
  });

  test('hommer should get lisa talk', function (done) {
    var lisaTalk = this.lisaTalk;
    signinUser('Hommer', '123', function () {
      hoodie.chat.getTalk(lisaTalk)
        .fail(done)
        .then(function (task) {
          assert.ok(task.chat.talk.countType.like.length === 3, 'message with success');
          done();
        });
    })
  });

  test('hommer should not update lisa message', function (done) {
    var lisaTalk = this.lisaTalk;
    var lisaMessage = this.lisaMessage;
    signinUser('Hommer', '123', function () {
      hoodie.chat.updateMessage(lisaTalk, lisaMessage)
        .fail(function (err) {
          assert.ok(err, 'message with success');
          done();
        })
        .then(function () {
          assert.ok(false, 'wrong message update');
          done();
        });
    })
  });

  test('hommer should not delete lisa message', function (done) {
    var lisaTalk = this.lisaTalk;
    var lisaMessage = this.lisaMessage;
    signinUser('Hommer', '123', function () {
      hoodie.chat.deleteMessage(lisaTalk, lisaMessage)
        .fail(function (err) {
          assert.ok(err, 'message with success');
          done();
        })
        .then(function () {
          assert.ok(false, 'wrong message update');
          done();
        });
    })
  });

  test('hommer should update his message', function (done) {
    var lisaTalk = this.lisaTalk;
    var hommerMessage = this.hommerMessage;
    hommerMessage.text = 'D\'oh!!!!!!!';
    signinUser('Hommer', '123', function () {
      hoodie.chat.updateMessage(lisaTalk, hommerMessage)
        .fail(done)
        .then(function (task) {
          assert.ok(task.chat.message.text === hommerMessage.text, 'message with success');
          done();
        });
    })
  });

  test('hommer should delete his message', function (done) {
    var lisaTalk = this.lisaTalk;
    var hommerMessage = this.hommerMessage;
    signinUser('Hommer', '123', function () {
      hoodie.chat.deleteMessage(lisaTalk, hommerMessage)
        .fail(function (err) {
          done(err);
        })
        .then(function () {
          assert.ok(true, 'delete message with success');
          done();
        });
    })
  });

  test('hommer should share lisa talk', function (done) {
    var lisaTalk = this.lisaTalk;
    signinUser('Hommer', '123', function () {
      hoodie.chat.share(lisaTalk)
        .fail(function (err) {
          done(err);
        })
        .then(function () {
          assert.ok(true, 'share talk with success');
          done();
        });
    })
  });

});
