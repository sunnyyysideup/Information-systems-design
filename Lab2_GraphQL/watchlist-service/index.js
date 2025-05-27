const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { gql } = require('graphql-tag');
const { MongoClient, ObjectId } = require('mongodb');

const client = new MongoClient('mongodb://db-wishlist:27017');
let collection;

async function init() {
  await client.connect();
  const db = client.db('wishlist');
  collection = db.collection('entries');
}

const typeDefs = gql`
  extend type Query {
    wishlist(userId: ID!): [WishlistEntry]
  }

  type WishlistEntry {
    id: ID!
    userId: ID!
    itemId: ID!
    note: String
  }

  extend type Mutation {
    addToWishlist(userId: ID!, itemId: ID!, note: String): WishlistEntry
  }
`;

const resolvers = {
  Query: {
    wishlist: async (_, { userId }) => await collection.find({ userId }).toArray()
  },
  Mutation: {
    addToWishlist: async (_, { userId, itemId, note }) => {
      const entry = { userId, itemId, note };
      const result = await collection.insertOne(entry);
      return { id: result.insertedId, ...entry };
    }
  }
};

init().then(() => {
  const server = new ApolloServer({
    schema: buildSubgraphSchema([{ typeDefs, resolvers }])
  });

  startStandaloneServer(server, {
    listen: { port: 4003 },
  });
});
