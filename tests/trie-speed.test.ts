import { describe, expect, test } from "bun:test";
import { Trie } from "@ethereumjs/trie";
import { MapDB, utf8ToBytes } from "@ethereumjs/util";
import { Trie as Mnemonist } from "mnemonist";
import TrieSearch from "trie-search";

// build-time comparison of trie libraries to justify the worker's use of mnemonist
describe("trie timing", async () => {
  const { word_to_ipas } = await Bun.file(
    "./components/loose_rat_inputs.json",
  ).json();
  const ipas = new Set<string>();
  for (const word in word_to_ipas) {
    for (const ipa of word_to_ipas[word]) {
      ipas.add(ipa);
    }
  }

  function time(label: string, build: () => void): void {
    const start = performance.now();
    build();
    console.log(`${label}: ${(performance.now() - start).toFixed(0)}ms`);
  }

  test("mnemonist", () => {
    const trie = new Mnemonist<string>();
    time("mnemonist", () => {
      for (const ipa of ipas) {
        trie.add(ipa);
      }
    });
    expect(trie.size).toBe(ipas.size);
  });

  // same library, but inserting per word (with duplicates) rather than the deduped set
  test("mnemonist small", () => {
    const trie = new Mnemonist<string>();
    time("mnemonist small", () => {
      for (const word in word_to_ipas) {
        for (const ipa of word_to_ipas[word]) {
          trie.add(ipa);
        }
      }
    });
  });

  test("trie-search", () => {
    const trie = new TrieSearch<string>();
    time("trie-search", () => {
      for (const ipa of ipas) {
        trie.map(ipa, ipa);
      }
    });
  });

  // ethereum is orders of magnitude slower here, so it needs far more than bun's 5s default
  test("ethereum", async () => {
    const trie = await Trie.create({ db: new MapDB() });
    const start = performance.now();
    for (const ipa of ipas) {
      const bytes = utf8ToBytes(ipa);
      await trie.put(bytes, bytes);
    }
    console.log(`ethereum: ${(performance.now() - start).toFixed(0)}ms`);
  }, 60000);
});
