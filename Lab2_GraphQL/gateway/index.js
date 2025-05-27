const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { ApolloGateway } = require('@apollo/gateway');

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'users', url: 'http://localhost:4001' },
    { name: 'items', url: 'http://localhost:4002' },
    { name: 'wishlist', url: 'http://localhost:4003' }
  ],
});

const server = new ApolloServer({ gateway, subscriptions: false });

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`🚀 Gateway ready at ${url}`);
});
