import { Trie, TrieMap } from "mnemonist";
import type { EntryData, Query, Result } from "../utils/types";
import { buildSubstitution } from "./dialects";

const MAX_RESULTS = 200;
const CACHE_SIZE = 3;

interface RawData {
  baseIpas: Record<string, readonly string[]>;
  popularity: Record<string, number>;
  dialectRules: Record<string, Record<string, string[]>>;
}

async function load(): Promise<RawData> {
  // load raw data
  const { word_to_ipas, popularity, dialects } = await import("./loose_rat_inputs.json") as unknown as  {
    word_to_ipas: Record<string, string[]>;
    popularity: Record<string, number>;
    dialects: Record<string, Record<string, string[]>>;
  };

  return { baseIpas: word_to_ipas, popularity, dialectRules: dialects };
}

const dataProm = load();

interface Indices {
  wordToIpas: Map<string, string[]>;
  // canonical ipa -> words with that pronunciation, keyed as a prefix trie
  ipaToWords: TrieMap<string, string[]>;
  // reversed canonical ipas, for suffix lookups
  ipaSuffix: Trie<string>;
}

const indexMap = new Map<string, Indices>();

function getIndices(
  selectedDialects: readonly string[],
  baseIpas: Record<string, readonly string[]>,
  dialectRules: Record<string, Record<string, string[]>>,
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

  const substitute = buildSubstitution(selectedDialects, dialectRules);
  const wordToIpas = new Map<string, string[]>();
  const ipaToWords = new TrieMap<string, string[]>();
  const ipaSuffix = new Trie<string>();
  for (const word in baseIpas) {
    const uniqIpas = new Set<string>();
    for (const ipa of baseIpas[word]) {
      // canonicalize so dialect-equivalent pronunciations collapse together
      uniqIpas.add(substitute(ipa));
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
      ipaSuffix.add([...ipa].reverse().join(""));
    }
  }

  const indices = { wordToIpas, ipaToWords, ipaSuffix };
  indexMap.set(key, indices);
  return indices;
}

addEventListener("message", async (event: MessageEvent<Query>) => {
  const { dialects, query } = event.data;
  try {
    await handleQuery(dialects, query);
  } catch (err) {
    // surface the failure so the UI can stop waiting instead of spinning forever
    const result: Result = {
      results: [],
      ipa: "",
      dialects,
      query,
      error: err instanceof Error ? err.message : String(err),
    };
    postMessage(result);
  }
});

async function handleQuery(
  dialects: readonly string[],
  query: string,
): Promise<void> {
  const { baseIpas, popularity, dialectRules } = await dataProm;
  const { wordToIpas, ipaToWords, ipaSuffix } = getIndices(
    dialects,
    baseIpas,
    dialectRules,
  );

  const res = new Map<string, EntryData>();
  const normed = query.trim().toLowerCase();
  const found = wordToIpas.get(normed) ?? [];
  const ipas = baseIpas[normed] ?? [];
  for (const ipa of found) {
    // prefix
    for (const [prefixed, words] of ipaToWords.find(ipa)) {
      // find valid words that match prefix
      const prefixWords = ipaToWords.get(prefixed.slice(ipa.length)) ?? [];

      // if such a prefix exists, set to the longer word too
      if (prefixWords.length) {
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
}
