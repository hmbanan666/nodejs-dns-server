import { decode, encode } from 'dns-packet';
import { createSocket } from 'dgram';
import * as dotenv from 'dotenv';
import { handleQuery } from './handlers.js';

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 53;

const socket = createSocket('udp4');

socket.on('listening', function () {
  const address = socket.address();
  console.log(`UDP Server listening on ${address.address}:${address.port}`);
});

socket.on('message', function (message, remote) {
  const request = decode(message);
  const response = handleQuery(request);

  console.log(remote, request?.questions);

  if (!response) return;

  socket.send(encode(response), remote.port, remote.address);
});

socket.bind(PORT);
