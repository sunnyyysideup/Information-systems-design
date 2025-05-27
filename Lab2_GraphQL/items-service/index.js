const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { gql } = require('graphql-tag');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://user:password@db-items:5432/items' });

const typeDefs = gql`
  extend type Query {
    items: [Item]
    item(id: ID!): Item
  }

  type Item @key(fields: "id") {
    id: ID!
    title: String!
    type: String! # movie or book
  }

  extend type Mutation {
    createItem(title: String!, type: String!): Item
  }
`;

const resolvers = {
  Item: {
    __resolveReference(ref) {
      return pool.query('SELECT * FROM items WHERE id = $1', [ref.id])
        .then(res => res.rows[0]);
    },
  },
  Query: {
    items: () => pool.query('SELECT * FROM items').then(res => res.rows),
    item: (_, { id }) => pool.query('SELECT * FROM items WHERE id = $1', [id]).then(res => res.rows[0]),
  },
  Mutation: {
    createItem: (_, { title, type }) =>
      pool.query('INSERT INTO items(title, type) VALUES ($1, $2) RETURNING *', [title, type])
        .then(res => res.rows[0])
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }])
});

startStandaloneServer(server, {
  listen: { port: 4002 },
});
