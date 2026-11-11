import dgram from "node:dgram";
import { Buffer } from "node:buffer";
import { writeLog } from "./utilities.mjs";
import fs from 'fs';
import readline from 'readline';

const server = dgram.createSocket('udp4');

/*
 * Read from file path
 * Creates an empty list for each type of record supported
 */
async function processBindFile(filePath) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })

    /**
     * origin: base domain
     * ttl: default time-to-live (ttl)
     * previousName: last domain name
     * previousTtl: last TTL used
     */
    let origin;
    let ttl;
    let previousTtl;
    let previousName;

    /**
     * Type classification
     */
    let records = [];
    let recordsType = ['NS', 'A', 'CNAME', 'MX'];
    recordsType.forEach(element => {
        records[element] = [];
    })

    /**
     * DNS Start of Authority Record
     * soaLine tracks the current record the parser is on
     */
    let soa = {};
    let soaLine = 0;
    let multiLineSoa = false;
    let containsTtl = false;

    /**
     * Parsing file line by line
     * Replaces tabs and whitespaces with a single space ' '
     * Locates the comment ; if there is any
     * If ; is not at the start, separate and ignore the comment [right side]
     * If ; is at the start, it means that whole line is commented, hence commentedLine is true [IMPORTANT]
     */
    for await (const line of rl) {  
        if (line.length > 1){
            let commentedLine = false;
            let l = line.trim()
             .replace(/\t/g, ' ')
             .replace(/\s+/g, ' ');
            let commentIndex = l.indexOf(';'); 
            if (commentIndex != 0) {
                let m = l.split(';');
                l = m[0];
            } else {
                commentedLine = true;
            }
        }

        if (!commentedLine) {
            let splittedLine = l.split(' ');
            /**
             * Extracting details from DNS file entry
             * e.g $ORIGIN example.com.
             * switch-case used to determine properties of entry
             * variables are defined at start - look line 26-29
             */
            switch (splittedLine[0]){
                case '$ORIGIN':
                    origin = splittedLine[1];
                    break;
                case '$TTL':
                    ttl = splittedLine[1];
                    break;
                case '$INCLUDE':
                    break;
                default: 
                    
            }
        }

    }
}

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