// Basic GraphQL example with MoroJS
import { createApp } from '@morojs/moro';

const app = createApp();

// Configure GraphQL endpoint
app.graphqlInit({
  typeDefs: `
    type Query {
      hello(name: String): String!
      users: [User!]!
      user(id: ID!): User
    }

    type User {
      id: ID!
      name: String!
      email: String!
      posts: [Post!]!
    }

    type Post {
      id: ID!
      title: String!
      content: String!
      author: User!
    }

    type Mutation {
      createUser(name: String!, email: String!): User!
      createPost(userId: ID!, title: String!, content: String!): Post!
    }
  `,
  resolvers: {
    Query: {
      hello: (_parent, args) => {
        return `Hello ${args.name || 'World'}!`;
      },
      users: async () => {
        // In a real app, fetch from database
        return [
          { id: '1', name: 'Alice', email: 'alice@example.com' },
          { id: '2', name: 'Bob', email: 'bob@example.com' },
        ];
      },
      user: async (_parent, args) => {
        // Fetch single user
        return { id: args.id, name: 'Alice', email: 'alice@example.com' };
      },
    },
    Mutation: {
      createUser: async (_parent, args) => {
        // Create user in database
        return {
          id: '3',
          name: args.name,
          email: args.email,
        };
      },
      createPost: async (_parent, args) => {
        // Create post in database
        return {
          id: '1',
          title: args.title,
          content: args.content,
          userId: args.userId,
        };
      },
    },
    User: {
      posts: async user => {
        // Fetch user's posts
        return [
          {
            id: '1',
            title: 'My First Post',
            content: 'Hello World!',
            userId: user.id,
          },
        ];
      },
    },
    Post: {
      author: async post => {
        // Fetch post author
        return {
          id: post.userId,
          name: 'Alice',
          email: 'alice@example.com',
        };
      },
    },
  },
  // Custom context with request info
  context: async (req, res) => ({
    request: req,
    response: res,
    user: req.auth?.user,
  }),
  // Enable GraphQL JIT for performance
  enableJIT: true,
  // Enable GraphQL Playground in development
  enablePlayground: true,
});

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
  console.log('GraphQL API: http://localhost:3000/graphql');
  console.log('GraphQL Playground: http://localhost:3000/graphql/playground');
});

// Example queries to test:

// Query 1: Simple hello
// {
//   hello(name: "MoroJS")
// }

// Query 2: Get all users
// {
//   users {
//     id
//     name
//     email
//     posts {
//       id
//       title
//     }
//   }
// }

// Mutation: Create user
// mutation {
//   createUser(name: "Charlie", email: "charlie@example.com") {
//     id
//     name
//     email
//   }
// }
