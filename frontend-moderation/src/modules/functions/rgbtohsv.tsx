export function rgbtohsv(r: number, g: number, b: number): { h: number, s: number, v: number } {
    let v=Math.max(r,g,b), c=v-Math.min(r,g,b);
    let h= c && ((v==r) ? (g-b)/c : ((v==g) ? 2+(b-r)/c : 4+(r-g)/c)); 

    return {
      h: 60*(h<0?h+6:h),
      s: v&&c/v,
      v
    }
  }