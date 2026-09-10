import { defineRelations } from 'drizzle-orm';
import { commentsTable, postsTable, usersTable } from './schema';

export const relations = defineRelations(
  {
    users: usersTable,
    posts: postsTable,
    comments: commentsTable,
  },
  (r) => ({
    users: {
      posts: r.many.posts(),
      comments: r.many.comments(),
    },
    posts: {
      author: r.one.users({
        from: r.posts.userId,
        to: r.users.id,
        optional: false,
      }),
      comments: r.many.comments(),
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
    },
  }),
);
