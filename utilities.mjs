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

export function processResourceRecord(splittedLine, previousName, previousTtl, origin, defaultTtl){
    
    /**
     * Supported Types
     */
    const supportedTypes = ['A', 'NS', 'CNAME', 'MX'];
    let typeIndex;
    let type;
    /**
     * Retrieving the type index of the resource record
     */
    for (const element of splittedLine){
        if (supportedTypes.includes(element)){
            typeIndex = splittedLine.indexOf(element);
            type = element;
            break;
        }
    }
    if (!type) return null;
    const before = splittedLine.slice(0,typeIndex);
    const after = splittedLine.slice(typeIndex+1);
    /**
     * Warning is printed
     * before can only hold three things: a name, a TTL and a class. 
     * Each one is optional, but none can appear twice
     */
    if(before.length > 3){
        console.warn(`Before array's length more than 3: ${splittedLine}`);
        return null;
    }
}