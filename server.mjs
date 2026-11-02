import dgram from "node:dgram";
import { Buffer } from "node:buffer";
import { writeLog } from "./utilities.mjs";


const server = dgram.createSocket('udp4');
server.bind(8053, '127.0.0.1');

server.on('error', (error) => {
    console.error(`Server Error: \n${error.stack}`);
    server.close();
});

server.on('message', (msg, rinfo) => {

    try{
        /*
        * Readable text format using toString('hex')
        * Useful for logging and understanding the request
        */
        const id = msg.toString('hex',0,2);
        let position = 12;
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
            position = end;
        };

        position++;
        const domainLabel = labels.join('.');
        const type = msg.readUInt16BE(position);
        writeLog(domainLabel, type, rinfo);

        /*
        * Buffer response
        * What gets sent back to the dig request
        */
        const replyId = msg.subarray(0,2);
        const replyHeader = Buffer.from('84000001000100000000', 'hex');

        if (replyId.length !== 2){
            throw new Error('Reply ID is not 2 bytes');
        }
        if (replyHeader.length !== 10) {
            throw new Error('Reply Header is not 10 bytes');
        }

        const question = msg.subarray(12, position + 4); // refer to README.md
        const answer = Buffer.from('c00c000100010000003c000401020304', 'hex');

        if (answer.length !== 16) {
            throw new Error('Answer is not 16 bytes');
        }

        const response = Buffer.concat([replyId, replyHeader, question, answer]);
        console.log(response);
        server.send(response, rinfo.port, rinfo.address);

    } catch (error) {
        console.error(error);
    }
});