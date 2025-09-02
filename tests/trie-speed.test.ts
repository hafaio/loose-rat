import { describe, expect, test } from "bun:test";
import { Trie } from "@ethereumjs/trie";
import { MapDB, utf8ToBytes } from "@ethereumjs/util";
import { Trie as Mnemonist } from "mnemonist";
import TrieSearch from "trie-search";

describe("trie timing", async () => {
  const { word_to_ipas } = await Bun.file(
    "./public/loose_rat_inputs.json",
  ).json();
  const ipas = new Set<string>();
  for (const word in word_to_ipas) {
    for (const ipa in word_to_ipas[word]) {
      ipas.add(ipa);
    }
  }

  test("mnemonist", () => {
    const trie = new Mnemonist<string>();
    for (const ipa of ipas) {
      trie.add(ipa);
    }
    expect(trie.size).toBe(ipas.size);
  });

  test("mnemonist small", () => {
    const trie = new Mnemonist<string>();
    for (const word in word_to_ipas) {
      const ipas = word_to_ipas[word];
      for (const ipa in ipas) {
        if (ipas[ipa] === 0) {
          trie.add(ipa);
        }
      }
    }
  });

  test("trie-search", () => {
    const trie = new TrieSearch<string>();
    for (const ipa of ipas) {
      trie.map(ipa, ipa);
    }
  });

  test("etherium", async () => {
    const trie = await Trie.create({ db: new MapDB() });
    for (const ipa of ipas) {
      const bytes = utf8ToBytes(ipa);
      await trie.put(bytes, bytes);
    }
  });
});
