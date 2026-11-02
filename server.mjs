import dgram from "node:dgram";

const server = dgram.createSocket('udp4');
server.bind(8053);

server.on('error', (error) => {
    console.error(`Server Error: \n${error.stack}`);
    server.close();
});

server.on('message', (msg, info) => {
    console.log(msg.toString('hex'));
});