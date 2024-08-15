String.prototype.duplicateLetters = function(letter: string): number {
    if(this.indexOf(letter) === -1)return 0
    return this.split('').reduce((acc: number, el: string) => {
        if(el === letter) acc ++
        return acc
    })
}