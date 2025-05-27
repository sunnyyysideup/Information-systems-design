const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { gql } = require('graphql-tag');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://user:password@db-users:5432/users' });

const typeDefs = gql`
  extend type Query {
    users: [User]
    user(id: ID!): User
  }

  type User @key(fields: "id") {
    id: ID!
    name: String!
    email: String!
  }

  extend type Mutation {
    createUser(name: String!, email: String!): User
  }
`;

const resolvers = {
  User: {
    __resolveReference(ref) {
      return pool.query('SELECT * FROM users WHERE id = $1', [ref.id])
        .then(res => res.rows[0]);
    },
  },
  Query: {
    users: () => pool.query('SELECT * FROM users').then(res => res.rows),
    user: (_, { id }) => pool.query('SELECT * FROM users WHERE id = $1', [id]).then(res => res.rows[0]),
  },
  Mutation: {
    createUser: (_, { name, email }) =>
      pool.query('INSERT INTO users(name, email) VALUES ($1, $2) RETURNING *', [name, email])
        .then(res => res.rows[0])
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }])
});

startStandaloneServer(server, {
  listen: { port: 4001 },
});
