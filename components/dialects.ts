/**
 * Dialect canonicalization.
 *
 * A dialect's rules declare sets of phonemes pronounced alike. Two words are
 * loose rhymes when their pronunciations can coincide under those swaps. Rather
 * than expand every pronunciation, we canonicalize: union-find every phoneme
 * connected through a rule into one class and rewrite each to its class
 * representative, so words rhyme iff their canonical forms are equal — a fast,
 * order-independent equivalent of the full (transitive) expansion.
 */

type DialectRules = Record<string, Record<string, string[]>>;

export function buildSubstitution(
  selectedDialects: readonly string[],
  dialectRules: DialectRules,
): (ipa: string) => string {
  // union-find the selected dialects' phonemes, counting occurrences to label classes
  const parent = new Map<string, string>();
  const frequency = new Map<string, number>();
  const find = (segment: string): string => {
    let root = segment;
    while (parent.get(root) !== root) {
      root = parent.get(root) as string;
    }
    while (parent.get(segment) !== root) {
      const next = parent.get(segment) as string;
      parent.set(segment, root);
      segment = next;
    }
    return root;
  };
  const touch = (segment: string): void => {
    if (!parent.has(segment)) {
      parent.set(segment, segment);
    }
    frequency.set(segment, (frequency.get(segment) ?? 0) + 1);
  };
  for (const dialect of selectedDialects) {
    const mapping = dialectRules[dialect] ?? {};
    for (const phoneme in mapping) {
      touch(phoneme);
      for (const variant of mapping[phoneme]) {
        touch(variant);
        parent.set(find(phoneme), find(variant));
      }
    }
  }
  if (parent.size === 0) {
    return (ipa) => ipa;
  }

  // a class's representative is its most common member (ties don't matter — the class collapses regardless)
  const representative = new Map<string, string>();
  for (const segment of parent.keys()) {
    const root = find(segment);
    const current = representative.get(root);
    if (current === undefined || frequency.get(segment)! > frequency.get(current)!) {
      representative.set(root, segment);
    }
  }

  // map each phoneme to its representative; reps stay in the pattern so longest-match protects multi-char segments
  const canonical = new Map<string, string>();
  for (const segment of parent.keys()) {
    canonical.set(segment, representative.get(find(segment))!);
  }
  const segments = [...canonical.keys()].sort((a, b) => b.length - a.length);
  const regex = new RegExp(segments.join("|"), "g");
  return (ipa) => ipa.replaceAll(regex, (match) => canonical.get(match) ?? match);
}
