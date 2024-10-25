import { Query, EntryData, Result } from "./utils/types";
import Trie from "mnemonist/trie";

const MAX_RESULTS = 100;
const CACHE_SIZE = 3;

interface RawData {
  baseIpas: Record<string, readonly string[]>;
  popularity: Record<string, number>;
  dialectRegexes: Map<string, readonly [RegExp, string][]>;
}

async function load(): Promise<RawData> {
  // load raw data
  const resp = await fetch(
    new URL("public/loose_rat_inputs.json", import.meta.url)
  );
  const { word_to_ipas, popularity, dialects } = await resp.json();

  // parse dialects into regexes
  const dialectRegexes = new Map<string, [RegExp, string][]>();
  for (const dialect in dialects) {
    const mapping = dialects[dialect];
    const arr: [RegExp, string][] = [];
    for (const rep in mapping) {
      const base = [...mapping[rep], rep].sort((a, b) =>
        a.length == b.length ? a.localeCompare(b) : b.length - a.length
      );
      const replace = base.pop() ?? "";
      const reg = base.map((v) => `(${v})`).join("|");
      arr.push([new RegExp(reg, "g"), replace]);
    }
    dialectRegexes.set(dialect, arr);
  }

  return {
    baseIpas: word_to_ipas,
    popularity,
    dialectRegexes,
  };
}

const dataProm = load();

interface Indices {
  wordToIpas: Map<string, string[]>;
  ipaToWords: Map<string, string[]>;
  ipaPrefix: Trie<string>;
  ipaSuffix: Trie<string>;
}

const indexMap = new Map<string, Indices>();

function getIndices(
  selectedDialects: readonly string[],
  baseIpas: Record<string, readonly string[]>,
  dialectRegexes: Map<string, readonly [RegExp, string][]>
): Indices {
  const key = JSON.stringify(selectedDialects.toSorted());
  const res = indexMap.get(key);
  if (res) {
    // these steps ensure that key is the last key, e.g. LRU
    indexMap.delete(key);
    indexMap.set(key, res);
    return res;
  }
  if (indexMap.size === CACHE_SIZE) {
    // need to pop the oldest thing
    // guaranteed to exist
    const oldest = indexMap.keys().next().value!;
    indexMap.delete(oldest);
  }

  const wordToIpas = new Map<string, string[]>();
  const ipaToWords = new Map<string, string[]>();
  const ipaPrefix = new Trie<string>();
  const ipaSuffix = new Trie<string>();
  for (const word in baseIpas) {
    const uniqIpas = new Set<string>();
    for (let ipa of baseIpas[word]) {
      // apply dialects
      for (const dialect of selectedDialects) {
        for (const [reg, rep] of dialectRegexes.get(dialect) ?? []) {
          ipa = ipa.replaceAll(reg, rep);
        }
      }
      uniqIpas.add(ipa);
    }
    const ipas = [...uniqIpas];
    wordToIpas.set(word, ipas);
    for (const ipa of ipas) {
      const words = ipaToWords.get(ipa);
      if (words) {
        words.push(word);
      } else {
        ipaToWords.set(ipa, [word]);
      }
      ipaPrefix.add(ipa);
      ipaSuffix.add([...ipa].reverse().join(""));
    }
  }

  const indices = { wordToIpas, ipaToWords, ipaPrefix, ipaSuffix };
  indexMap.set(key, indices);
  return indices;
}

addEventListener("message", async (event: MessageEvent<Query>) => {
  const { baseIpas, popularity, dialectRegexes } = await dataProm;
  const { dialects, query } = event.data;
  const { wordToIpas, ipaToWords, ipaPrefix, ipaSuffix } = getIndices(
    dialects,
    baseIpas,
    dialectRegexes
  );

  const res = new Map<string, EntryData>();
  const normed = query.trim().toLowerCase();
  const found = wordToIpas.get(normed) ?? [];
  const ipas = baseIpas[normed] ?? [];
  for (const ipa of found) {
    // prefix
    for (const prefixed of ipaPrefix.find(ipa)) {
      // find valid words that match prefix
      const prefixWords = ipaToWords.get(prefixed.slice(ipa.length)) ?? [];

      // if such a prefix exists, set to the longer word too
      if (prefixWords.length) {
        const words = ipaToWords.get(prefixed) ?? [];
        for (const longer of words) {
          // TODO maybe we could merge, but it seems like we don't care a ton
          res.set(longer, {
            word: longer,
            ipa: prefixed,
            rank: popularity[longer],
            other: prefixWords,
          });
        }
      }
    }

    // suffix
    const revIpa = [...ipa].reverse().join("");
    for (const revSuffixed of ipaSuffix.find(revIpa)) {
      // find valid words that match suffix
      const prefix = [...revSuffixed.slice(ipa.length)].reverse().join("");
      const suffixWords = ipaToWords.get(prefix) ?? [];

      // if such a suffix exists, set to the longer word too
      if (suffixWords.length) {
        const suffixed = [...revSuffixed].reverse().join("");
        const words = ipaToWords.get(suffixed) ?? [];
        for (const longer of words) {
          res.set(longer, {
            word: longer,
            // TODO we should really get the ipa that when modified gave us
            // this, but we'd need to keep track of that...
            ipa: baseIpas[longer][0],
            rank: popularity[longer],
            other: suffixWords,
          });
        }
      }
    }
  }
  const ipa = [...ipas].join(" · ");
  const results = [...res.values()]
    .sort((left, right) => (left.rank ?? Infinity) - (right.rank ?? Infinity))
    .slice(0, MAX_RESULTS); // return at most MAX_RESULTS
  const result: Result = { results, ipa, dialects, query };
  postMessage(result);
});
