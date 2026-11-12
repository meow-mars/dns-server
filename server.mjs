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
                l = m[0].trim();;
            } else {
                commentedLine = true;
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
                        /**
                         * SOA Entry Record
                         * @ IN SOA ns1.example.com. hostmaster.example.com. ( 2026110301 21600 3600 604800 86400 )
                         * previousName: @ 
                         * mname: The <domain-name> of the name server that was the original or primary source of data for this zone. e.g (ns1.example.com)
                         * rname:  A <domain-name> which specifies the mailbox of the person responsible for this zone. e.g (hostmaster.example.com)
                         * 
                         * Definitions obtained from RFC1035 documentation [refer to README.md]
                         */
                        if (splittedLine.includes('SOA')){
                            previousName = splittedLine[0];
                            soa.mname = splittedLine[3];
                            soa.rname = splittedLine[4];
    
                            /**
                             * Only applied to single line record, all record values are stored in parentheses, detects specifically for end-bracket ')'
                             * e.g ( 2026110301 21600 3600 604800 86400 )
                             * serial: unsigned 32-bit version number of the original copy of the zone 
                             * refresh: 32-bit time interval before the zone should be refreshed
                             * retry: 32-bit time interval relapse time before zone should be retried upon refresh fail
                             * expire: 32-bit time value that specifies the upper time limit interval a zone has before it is no longer authoritative
                             * 
                             * Definitions obtained from RFC1035 documentation [refer to README.md]
                             */
                            if (splittedLine.includes(')')){
                                soa.serial = splittedLine[6];
                                soa.refresh = splittedLine[7];
                                soa.retry = splittedLine[8];
                                soa.expire = splittedLine[9];
                                soa.ttl = splittedLine[10];
                            }
    
                            else{
                                // Setting multiline mode to true
                                multiLineSoa = true;
                                soaLine++;
                            }
                        }

                        /**
                             * Multiline SOA record handling
                             * soaLine starts with 0, on first multiline run, increments to 1
                             * no case for 1, this is to check for endbracket in the current iteration, 
                             * counter is then iterated to 2 and so on until an endbracket is found, 
                             * multiline flag is then switched off
                             */
                        if (multiLineSoa) {
                            switch (soaLine){
                                case 2:
                                    soa.serial = splittedLine[0];
                                    break;
                                case 3: 
                                    soa.refresh = splittedLine[0];
                                    break;
                                case 4: 
                                    soa.retry = splittedLine[0];
                                    break;
                                case 5: 
                                    soa.expire = splittedLine[0];
                                    break;
                                case 6:
                                    soa.ttl = splittedLine[0];
                                    break;
                                default:
                                    // Skip
                                    break;
                            }

                            /**
                             * Switching the flag off
                             */
                            if (splittedLine.includes(')')){
                                multiLineSoa = false;
                            }
                            soaLine++;
                        }
                }
    
                /**
                 * Resource Record Handling - TYPE values
                 * [Refer to 3.2.2 TYPE values in RFC 1035]
                 */
                recordsType.forEach(type => {
                    if (splittedLine.includes(type)){
                        let recordType = type;
                        let resourceRecord;
                        /**
                         * TO-DO: Process the record
                         */
                    }
                })
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