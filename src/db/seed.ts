import 'dotenv/config';
import { faker } from '@faker-js/faker';
import * as argon2 from 'argon2';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  chatsTable,
  commentLikesTable,
  commentsTable,
  messagesTable,
  postLikesTable,
  postsTable,
  usersTable,
} from './schema';

const USER_COUNT = 8;
const POSTS_PER_USER = 3;
const COMMENTS_PER_POST = 4;
const DEFAULT_PASSWORD = 'password123';

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }

  const client = postgres(url);
  const db = drizzle({ client });

  console.log('Clearing existing data…');
  await db.delete(messagesTable);
  await db.delete(chatsTable);
  await db.delete(commentLikesTable);
  await db.delete(postLikesTable);
  await db.delete(commentsTable);
  await db.delete(postsTable);
  await db.delete(usersTable);

  const passwordHash = await argon2.hash(DEFAULT_PASSWORD);

  console.log(`Creating ${USER_COUNT} users…`);
  const users = await db
    .insert(usersTable)
    .values(
      Array.from({ length: USER_COUNT }, () => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const username = faker.internet
          .username({ firstName, lastName })
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 24);

        return {
          name: `${firstName} ${lastName}`,
          age: faker.number.int({ min: 18, max: 70 }),
          email: faker.internet.email({ firstName, lastName }).toLowerCase(),
          username: username || faker.string.alphanumeric(8).toLowerCase(),
          password: passwordHash,
          imageUrl: faker.image.avatar(),
        };
      }),
    )
    .returning();

  console.log(`Creating ~${USER_COUNT * POSTS_PER_USER} posts…`);
  const postValues = users.flatMap((user) =>
    Array.from({ length: POSTS_PER_USER }, () => ({
      title: faker.lorem.sentence({ min: 3, max: 8 }).slice(0, 255),
      content: faker.lorem.paragraphs({ min: 2, max: 5 }, '\n\n'),
      imageUrl: faker.datatype.boolean(0.4)
        ? faker.image.urlPicsumPhotos({ width: 800, height: 450 })
        : null,
      userId: user.id,
    })),
  );

  const posts = await db.insert(postsTable).values(postValues).returning();

  console.log(`Creating comments (incl. nested replies)…`);
  const allComments: (typeof commentsTable.$inferSelect)[] = [];
  for (const post of posts) {
    const topLevel = await db
      .insert(commentsTable)
      .values(
        Array.from({ length: COMMENTS_PER_POST }, () => ({
          content: faker.lorem.sentences({ min: 1, max: 3 }),
          postId: post.id,
          userId: faker.helpers.arrayElement(users).id,
          parentId: null,
        })),
      )
      .returning();

    allComments.push(...topLevel);

    const parentsWithReplies = faker.helpers.arrayElements(topLevel, {
      min: 1,
      max: Math.min(2, topLevel.length),
    });

    if (parentsWithReplies.length > 0) {
      const replies = await db
        .insert(commentsTable)
        .values(
          parentsWithReplies.map((parent) => ({
            content: faker.lorem.sentence(),
            postId: post.id,
            userId: faker.helpers.arrayElement(users).id,
            parentId: parent.id,
          })),
        )
        .returning();
      allComments.push(...replies);
    }
  }

  console.log('Creating post likes…');
  const postLikePairs = new Set<string>();
  const postLikeValues: { userId: number; postId: number }[] = [];
  for (const post of faker.helpers.arrayElements(posts, {
    min: Math.min(8, posts.length),
    max: Math.min(16, posts.length),
  })) {
    for (const user of faker.helpers.arrayElements(users, {
      min: 1,
      max: 3,
    })) {
      const key = `${user.id}:${post.id}`;
      if (postLikePairs.has(key)) continue;
      postLikePairs.add(key);
      postLikeValues.push({ userId: user.id, postId: post.id });
    }
  }
  if (postLikeValues.length > 0) {
    await db.insert(postLikesTable).values(postLikeValues);
  }

  console.log('Creating comment likes…');
  const commentLikePairs = new Set<string>();
  const commentLikeValues: { userId: number; commentId: number }[] = [];
  for (const comment of faker.helpers.arrayElements(allComments, {
    min: Math.min(10, allComments.length),
    max: Math.min(20, allComments.length),
  })) {
    for (const user of faker.helpers.arrayElements(users, {
      min: 1,
      max: 2,
    })) {
      const key = `${user.id}:${comment.id}`;
      if (commentLikePairs.has(key)) continue;
      commentLikePairs.add(key);
      commentLikeValues.push({ userId: user.id, commentId: comment.id });
    }
  }
  if (commentLikeValues.length > 0) {
    await db.insert(commentLikesTable).values(commentLikeValues);
  }

  if (users.length >= 2) {
    const [a, b] = users;
    const userLowId = Math.min(a.id, b.id);
    const userHighId = Math.max(a.id, b.id);
    console.log('Creating sample chat…');
    const [chat] = await db
      .insert(chatsTable)
      .values({ userLowId, userHighId })
      .returning();

    if (chat) {
      await db.insert(messagesTable).values([
        {
          chatId: chat.id,
          senderId: a.id,
          content: 'Hey! Saw your latest post — great read.',
        },
        {
          chatId: chat.id,
          senderId: b.id,
          content: 'Thanks! Glad you enjoyed it.',
        },
        {
          chatId: chat.id,
          senderId: a.id,
          content: 'Want to chat about a collab sometime?',
        },
      ]);
    }
  }

  console.log('Seed complete.');
  console.log(`Default password for all users: ${DEFAULT_PASSWORD}`);
  console.log(`Sample login: ${users[0]?.email} / ${DEFAULT_PASSWORD}`);

  await client.end();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
