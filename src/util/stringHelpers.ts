export function encodeAsFirebaseKey(key: string) {
  return key.replace(/%/g, '_').replace(/\./g, '_').replace(/#/g, '_').replace(/\$/g, '_').replace(/\//g, '_').replace(/\[/g, '_').replace(/\]/g, '_');
}
