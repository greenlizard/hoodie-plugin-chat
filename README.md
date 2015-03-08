hoodie-plugin-chat
====================
[![Build Status](https://travis-ci.org/greenlizard/hoodie-plugin-chat.svg?branch=master)](https://travis-ci.org/greenlizard/hoodie-plugin-chat) [![Dependencies](https://david-dm.org/greenlizard/hoodie-plugin-chat.png)](https://david-dm.org/greenlizard/hoodie-plugin-chat) [![devDependency Status](https://david-dm.org/greenlizard/hoodie-plugin-chat/dev-status.svg)](https://david-dm.org/greenlizard/hoodie-plugin-chat#info=devDependencies) [![Code Climate](https://codeclimate.com/github/greenlizard/hoodie-plugin-chat/badges/gpa.svg)](https://codeclimate.com/github/greenlizard/hoodie-plugin-chat)

## Dependencies
```shell
  hoodie install hoodie-plugin-chat
```
for cordova/phonegap users
```shell
  bower install hoodie-plugin-chat
```

## Setup client
```html
 <script src="/_api/_files/hoodie.js"></script>
```
for cordova/phonegap users

```html
  <script src="<bowerdir>/hoodie/dist/hoodie.js"></script>
  <script src="<bowerdir>/hoodie-plugin-chat/hoodie.chat.js"></script>
```

## API (Dream Code)
-  [x] hoodie.chat.follow(login)
-  [x] hoodie.chat.unfollow(login)
-  [x] hoodie.chat.post({text: 'text'}, /*opitional*/ {type: [mediaplugin.enum]})
-  [x] hoodie.chat.getPost({id: 'postId')
-  [x] hoodie.chat.updatePost({id: 'postId',text: 'text'}, /*opitional*/ {type: [mediaplugin.enum]})
-  [x] hoodie.chat.deletePost({id: 'postId'}, /*opitional*/ {type: [mediaplugin.enum]})
-  [x] hoodie.chat.comment(postId, {text:'text'})
-  [x] hoodie.chat.updateComment({ id: 'postId'}, {id: 'commentId'})
-  [x] hoodie.chat.deleteComment({ id: 'postId'}, {id: 'commentId'})
-  [x] hoodie.chat.count(postId, [type.enum]) 
-  [x] hoodie.chat.uncount(postId, [type.enum])
-  [x] hoodie.chat.like(postId) 
-  [x] hoodie.chat.unlike(postId)
-  [x] hoodie.chat.feed(postId)
-  [x] hoodie.chat.share(postId)
-  [x] hoodie.chat.abuse(postId)
-  [x] hoodie.chat.following(/*opitional*/ login)
-  [x] hoodie.chat.followers(/*opitional*/ login)
-  [x] hoodie.chat.getProfile(/*opitional*/ login)
-  [x] hoodie.chat.updateProfile(/*opitional*/ login, profileObject)
