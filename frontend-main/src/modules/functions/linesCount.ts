String.prototype.linesCount = function(): number {
    if(!this.length)return 1
    return this.split('\n').length
}