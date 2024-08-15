export default function stringToBool(str) {
    if(typeof str !== 'string')return str

    const truePattern = /^(true|yes|1)$/i;
    return truePattern.test(str.trim());
}