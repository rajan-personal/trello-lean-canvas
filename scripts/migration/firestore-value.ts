export function firestoreValue(value:Record<string,unknown>):unknown {
  if('nullValue'in value)return null
  if('stringValue'in value)return value.stringValue
  if('booleanValue'in value)return value.booleanValue
  if('integerValue'in value){const n=Number(value.integerValue);if(!Number.isSafeInteger(n))throw new Error('Unsafe Firestore integer.');return n}
  if('doubleValue'in value)return Number(value.doubleValue)
  if('timestampValue'in value){
    const timestamp=String(value.timestampValue),milliseconds=Date.parse(timestamp)
    if(!Number.isFinite(milliseconds))throw new Error('Invalid Firestore timestamp.')
    const fraction=timestamp.match(/\.(\d+)Z$/)?.[1]??''
    return {seconds:Math.floor(milliseconds/1000),nanoseconds:Number(fraction.padEnd(9,'0'))}
  }
  if('arrayValue'in value)return ((value.arrayValue as {values?:Record<string,unknown>[]}).values??[]).map(firestoreValue)
  if('mapValue'in value)return fields((value.mapValue as {fields?:Record<string,Record<string,unknown>>}).fields??{})
  throw new Error('Unsupported Firestore value type. Preserve the export and extend the decoder before importing.')
}
export const fields=(data:Record<string,Record<string,unknown>>)=>Object.fromEntries(Object.entries(data).map(([k,v])=>[k,firestoreValue(v)]))

