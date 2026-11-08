// Exact numeric interpolation from the supplied index.html prototypes.
export const numberPattern=/-?\d*\.?\d+(?:[eE][+-]?\d+)?/g;
export function interpolator(start:string,end:string){
  const a=start.match(numberPattern)!.map(Number),b=end.match(numberPattern)!.map(Number);
  if(a.length!==b.length||start.replace(numberPattern,'#')!==end.replace(numberPattern,'#'))throw new Error('Incompatible morph paths');
  return (t:number)=>{let i=0;return start.replace(numberPattern,()=>{const k=i++;return String(a[k]+(b[k]-a[k])*t);});};
}
