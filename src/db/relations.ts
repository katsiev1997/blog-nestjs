import { defineRelations } from 'drizzle-orm';
import {
  chatsTable,
  commentLikesTable,
  commentsTable,
  messagesTable,
  postLikesTable,
  postsTable,
  usersTable,
} from './schema';

export const relations = defineRelations(
  {
    users: usersTable,
    posts: postsTable,
    comments: commentsTable,
    postLikes: postLikesTable,
    commentLikes: commentLikesTable,
    chats: chatsTable,
    messages: messagesTable,
  },
  (r) => ({
    users: {
      posts: r.many.posts(),
      comments: r.many.comments(),
      postLikes: r.many.postLikes(),
      commentLikes: r.many.commentLikes(),
      messages: r.many.messages(),
      chatsAsLow: r.many.chats({
        from: r.users.id,
        to: r.chats.userLowId,
        alias: 'chat_user_low',
      }),
      chatsAsHigh: r.many.chats({
        from: r.users.id,
        to: r.chats.userHighId,
        alias: 'chat_user_high',
      }),
    },
    posts: {
      author: r.one.users({
        from: r.posts.userId,
        to: r.users.id,
        optional: false,
      }),
      comments: r.many.comments(),
      likes: r.many.postLikes(),
    },
    comments: {
      author: r.one.users({
        from: r.comments.userId,
        to: r.users.id,
        optional: false,
      }),
      post: r.one.posts({
        from: r.comments.postId,
        to: r.posts.id,
        optional: false,
      }),
      parent: r.one.comments({
        from: r.comments.parentId,
        to: r.comments.id,
        alias: 'comment_replies',
      }),
      replies: r.many.comments({
        alias: 'comment_replies',
      }),
      likes: r.many.commentLikes(),
    },
    postLikes: {
      user: r.one.users({
        from: r.postLikes.userId,
        to: r.users.id,
        optional: false,
      }),
      post: r.one.posts({
        from: r.postLikes.postId,
        to: r.posts.id,
        optional: false,
      }),
    },
    commentLikes: {
      user: r.one.users({
        from: r.commentLikes.userId,
        to: r.users.id,
        optional: false,
      }),
      comment: r.one.comments({
        from: r.commentLikes.commentId,
        to: r.comments.id,
        optional: false,
      }),
    },
    chats: {
      userLow: r.one.users({
        from: r.chats.userLowId,
        to: r.users.id,
        optional: false,
        alias: 'chat_user_low',
      }),
      userHigh: r.one.users({
        from: r.chats.userHighId,
        to: r.users.id,
        optional: false,
        alias: 'chat_user_high',
      }),
      messages: r.many.messages(),
    },
    messages: {
      chat: r.one.chats({
        from: r.messages.chatId,
        to: r.chats.id,
        optional: false,
      }),
      sender: r.one.users({
        from: r.messages.senderId,
        to: r.users.id,
        optional: false,
      }),
    },
  }),
);
