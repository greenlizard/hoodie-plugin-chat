suite('network', function () {
  this.timeout(15000);

  suiteSetup(loadUsers);

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

  test('hommer should subscribe bart talks', function (done) {
    hoodie.chat.follow('Bart')
      .fail(function (err) {
        done((err.message !=='You already subscribed.') ? err: null);
        assert.ok(false, err.message);
      })
      .then(function () {
        done();
        assert.ok(true, 'follow with sucess');
      });
  });

  test('hommer should not subscribe bart talks', function (done) {
    hoodie.chat.follow('Bart')
      .fail(function (err) {
        done();
        assert.ok((err.message ==='You already subscribed.'), err.message);
      })
      .then(function () {
        done();
        assert.ok(false, 'should throw error [You already subscribed.] ');
      });
  });

  test('hommer should subscribe marge talks', function (done) {
    hoodie.chat.follow('Margie')
      .fail(function (err) {
        done((err.message !=='You already subscribed.')? err: null);
        assert.ok(false, err.message);
      })
      .then(function () {
        assert.ok(true, 'follow with sucess');
        done();
      });
  });

  test('hommer should subscribe lisa talks', function (done) {
    hoodie.chat.follow('Lisa')
      .fail(function (err) {
        done((err.message !=='You already subscribed.')? err: null);
        assert.ok(false, err.message);
      })
      .then(function () {
        assert.ok(true, 'follow with sucess');
        done();
      });
  });

  test('hommer should show 3 following', function (done) {
    hoodie.chat.following()
      .fail(function (err) {
        done(err);
        assert.ok(false, err.message);
      })
      .then(function (task) {
        assert.ok((task.chat.following.length === 3) , 'following ' + task.chat.following.length + ' with sucess');
        done();
      });
  });

  test('hommer should show 0 followers', function (done) {
    hoodie.chat.followers()
      .fail(function (err) {
        done(err);
        assert.ok(false, err.message);
      })
      .then(function (task) {
        assert.ok((task.chat.followers.length === 0) , 'followers ' + task.chat.followers.length + ' with sucess');
        done();
      });
  });

  test('hommer should unsubscribe bart talks', function (done) {
    hoodie.chat.unfollow('Bart')
      .fail(function (err) {
        done(err);
        assert.ok(false, err.message);
      })
      .then(function () {
        assert.ok(true, 'follow with sucess');
        done();
      });
  });

  test('hommer should show 2 following', function (done) {
    hoodie.chat.following()
      .fail(function (err) {
        done(err);
        assert.ok(false, err.message);
      })
      .then(function (task) {
        assert.ok((task.chat.following.length === 2) , 'following ' + task.chat.following.length + ' with sucess');
        done();
      });
  });

  test('lisa should show 1 followers', function (done) {
    hoodie.chat.followers('Lisa')
      .fail(function (err) {
        done(err);
        assert.ok(false, err.message);
      })
      .then(function (task) {
        assert.ok((task.chat.followers.length === 1) , 'followers ' + task.chat.followers.length + ' with sucess');
        done();
      });
  });


});

