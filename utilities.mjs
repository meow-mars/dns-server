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