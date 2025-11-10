// TypeScript-first GraphQL with Pothos
import { createApp } from '@morojs/moro';
// Import Pothos directly for full TypeScript support
import SchemaBuilder from '@pothos/core';

const app = createApp();

// Define context type
interface Context {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// Create Pothos schema builder with full TypeScript inference
const builder = new SchemaBuilder<{
  Context: Context;
}>({});

// Define User type
const User = builder.objectRef<{
  id: string;
  name: string;
  email: string;
}>('User');

User.implement({
  fields: t => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    email: t.exposeString('email'),
    posts: t.field({
      type: [Post],
      resolve: async user => {
        // Fetch user's posts with full type safety
        return [
          {
            id: '1',
            title: 'First Post',
            content: 'Hello from ' + user.name,
            authorId: user.id,
          },
        ];
      },
    }),
  }),
});

// Define Post type
const Post = builder.objectRef<{
  id: string;
  title: string;
  content: string;
  authorId: string;
}>('Post');

Post.implement({
  fields: t => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    content: t.exposeString('content'),
    author: t.field({
      type: User,
      resolve: async post => {
        // Fetch post author
        return {
          id: post.authorId,
          name: 'Alice',
          email: 'alice@example.com',
        };
      },
    }),
  }),
});

// Define Query type
builder.queryType({
  fields: t => ({
    hello: t.string({
      args: {
        name: t.arg.string(),
      },
      resolve: (_parent, args) => {
        return `Hello ${args.name || 'World'}!`;
      },
    }),
    users: t.field({
      type: [User],
      resolve: async () => {
        return [
          { id: '1', name: 'Alice', email: 'alice@example.com' },
          { id: '2', name: 'Bob', email: 'bob@example.com' },
        ];
      },
    }),
    user: t.field({
      type: User,
      nullable: true,
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_parent, args) => {
        // Type-safe database query
        return {
          id: args.id,
          name: 'Alice',
          email: 'alice@example.com',
        };
      },
    }),
    me: t.field({
      type: User,
      nullable: true,
      resolve: (_parent, _args, ctx) => {
        // Access auth context with full type safety
        return ctx.user || null;
      },
    }),
  }),
});

// Define Mutation type
builder.mutationType({
  fields: t => ({
    createUser: t.field({
      type: User,
      args: {
        name: t.arg.string({ required: true }),
        email: t.arg.string({ required: true }),
      },
      resolve: async (_parent, args) => {
        // Type-safe mutation with validated args
        return {
          id: '3',
          name: args.name,
          email: args.email,
        };
      },
    }),
    createPost: t.field({
      type: Post,
      args: {
        title: t.arg.string({ required: true }),
        content: t.arg.string({ required: true }),
      },
      resolve: async (_parent, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Authentication required');
        }

        return {
          id: '1',
          title: args.title,
          content: args.content,
          authorId: ctx.user.id,
        };
      },
    }),
  }),
});

// Configure GraphQL with Pothos schema
app.graphqlInit({
  pothosSchema: builder,
  context: async (req, res) => ({
    request: req,
    response: res,
    user: req.auth?.user,
  }),
  enableJIT: true,
  enablePlayground: true,
});

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
  console.log('GraphQL API: http://localhost:3000/graphql');
  console.log('GraphQL Playground: http://localhost:3000/graphql/playground');
});

// TypeScript provides full type inference for all queries and mutations!
