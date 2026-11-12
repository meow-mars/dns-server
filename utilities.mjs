import fs from 'fs';

export function writeLog(domainLabel, type, rinfo){
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${domainLabel} type: ${type} from ${rinfo.address}:${rinfo.port}\n`;

    try {
        fs.appendFileSync('app.log', logMessage);
    } catch (err) {
        console.error('Failed to write to log file:', err);
    }
}

export function processResourceRecord(splittedLine){
    let resourceRecord;
    let totalLength = splittedLine.length;

    /**
     * Processing the record
     * e.g @ IN A 192.0.2.1, 
     * @ IN MX 10 mail.example.com.
     * www 300 IN A 192.0.2.3
     */

    
}