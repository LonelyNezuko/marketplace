export function random(min, max, isfloat = false) {
    if(!isfloat) {
        if(min === 0 && max === 0)return 0

        let rand = min - 0.5 + Math.random() * (max - min + 1);
        return Math.round(rand);
    }
    else {
        return Math.random() * (max - min) + min;
    }
    return null
}