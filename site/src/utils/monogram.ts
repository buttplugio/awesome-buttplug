export const GRADIENTS: [string, string][] = [
  ["#276b5b", "#123329"],
  ["#7a5f1a", "#3f320d"],
  ["#41693f", "#1f361e"],
  ["#4a5a9e", "#232c52"],
  ["#5b4e7a", "#2c2540"],
  ["#3d6b85", "#1e3540"],
  ["#6b6b2e", "#363616"],
  ["#8a5a32", "#452d19"],
];

export function gradientForId(id: string): [string, string] {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 33) ^ id.charCodeAt(i);
  }
  return GRADIENTS[(hash >>> 0) % GRADIENTS.length];
}
