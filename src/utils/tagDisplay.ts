export interface TagDisplayResult {
  visible: [string, number][];
  hiddenCount: number;
}

export function computeTagDisplay(
  counts: Map<string, number>,
  selected: string[],
  expanded: boolean,
  limit = 12,
): TagDisplayResult {
  const sorted = Array.from(counts.entries()).sort(
    ([tagA, countA], [tagB, countB]) => countB - countA || tagA.localeCompare(tagB),
  );

  if (expanded) {
    return { visible: sorted, hiddenCount: 0 };
  }

  const visible = sorted.filter(
    ([tag], index) => index < limit || selected.includes(tag),
  );

  return { visible, hiddenCount: sorted.length - visible.length };
}
