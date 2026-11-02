import dgram from "node:dgram";

const server = dgram.createSocket('udp4');
server.bind(8053, '127.0.0.1');

server.on('error', (error) => {
    console.error(`Server Error: \n${error.stack}`);
    server.close();
});

server.on('message', (msg, info) => {
    const id = msg.toString('hex',0,3);
    console.log(`ID: ${id}`);
    
});