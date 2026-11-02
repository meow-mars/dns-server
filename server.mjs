import dgram from "node:dgram";

const server = dgram.createSocket('udp4');
server.bind(8053, '127.0.0.1');

server.on('error', (error) => {
    console.error(`Server Error: \n${error.stack}`);
    server.close();
});

server.on('message', (msg, info) => {
    const id = msg.toString('hex',0,2); // id extracted from msg
    let position = 12; // position of domain length
    let length = msg[position];
    const labels = [];

    while (true){
        length = msg[position];
        if (length === 0){
            break;
        }
        let start = ++position;
        let end = start + length;
        const label = msg.toString('ascii', start, end);
        labels.push(label);

        // new run 
        position = end;
    };
    position++; // move past '00'
    const domainLabel = labels.join('.');
    console.log(`ID: ${id}\nPosition: ${position}\nLength: ${length}\nDomain: ${domainLabel}`);
});