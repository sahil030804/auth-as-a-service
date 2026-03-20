const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.resolve(__dirname, '../../../../proto/token.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const tokenProto = grpc.loadPackageDefinition(packageDefinition).token;

const client = new tokenProto.TokenService(
  process.env.TOKEN_SERVICE_URL || 'localhost:50051',
  grpc.credentials.createInsecure()
);

const generateToken = (userId, email) => {
  return new Promise((resolve, reject) => {
    client.GenerateToken({ user_id: userId, email }, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
};

module.exports = {
  generateToken,
};
