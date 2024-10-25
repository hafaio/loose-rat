import Mnemonist from "mnemonist/trie";
import { expect, test, describe } from "bun:test";
import { readFile } from "fs/promises";
import TrieSearch from "trie-search";
import { Trie } from "@ethereumjs/trie";
import { bytesToUtf8, MapDB, utf8ToBytes } from "@ethereumjs/util";

describe("trie timing", async () => {
  const rawData = await readFile("./public/word_to_ipas.json", "utf8");
  const { word_to_ipas } = JSON.parse(rawData);
  const ipas = new Set<string>();
  for (const word in word_to_ipas) {
    for (const ipa in word_to_ipas[word]) {
      ipas.add(ipa);
    }
  }
  const [arb] = ipas;

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
      const bytes = utf8ToBytes("test");
      await trie.put(bytes, bytes);
    }
  });
});
