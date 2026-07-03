export const GRADIENTS: [string, string][] = [
  ["#e5484d", "#7f2b2e"],
  ["#e5734c", "#7f3f2b"],
  ["#d9a521", "#77590f"],
  ["#3fa66b", "#1f5c3a"],
  ["#3aa6a6", "#1f5c5c"],
  ["#4c6fe5", "#2b3d7f"],
  ["#8a4ce5", "#4c2b7f"],
  ["#d44c9e", "#752b57"],
];

export function gradientForId(id: string): [string, string] {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 33) ^ id.charCodeAt(i);
  }
  return GRADIENTS[(hash >>> 0) % GRADIENTS.length];
}
