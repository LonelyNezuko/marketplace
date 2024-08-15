export function chunkString(str, len) {
    var padded = str.padEnd(Math.ceil(str.length / len) * len, '.');
    
    for(var i = 0; i < padded.length / len; i++) {
        padded.substring(i * len, (i + 1) * len);
    }

    return padded
}