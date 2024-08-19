"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useEffect, useState, useMemo } from "react";
import Trie from "mnemonist/trie";
import Entry, { EntryData } from "./entry";
import { CgSpinner } from "react-icons/cg";

type Mod = "" | "rests";

function multimapAppend<K, V>(map: Map<K, V[]>, key: K, val: V) {
  const res = map.get(key);
  if (res) {
    res.push(val);
  } else {
    map.set(key, [val]);
  }
}

function* extractTriples(
  data: string,
): IterableIterator<readonly [string, string, Mod]> {
  for (const row of data.split("\n")) {
    const [word, ipas] = row.split("\t");
    if (ipas) {
      for (const raw of ipas.split(", ")) {
        const ipa = raw.slice(1, -1);
        yield [word, ipa, ""];

        const rested = ipa.replaceAll(/[ˈˌ]+/g, "");
        if (rested !== ipa) {
          yield [word, ipa, "rests"];
        }
      }
    }
  }
}

export default function Main({
  data,
  ranked,
}: {
  data: string;
  ranked: string;
}): React.ReactElement {
  // This is an ugly hack because iOS sucks
  useEffect(() => {
    const { visualViewport } = window;
    if (visualViewport) {
      visualViewport.addEventListener("resize", () => {
        document.body.style.height = `${visualViewport.height}px`;
      });
    }
  }, []);

  const [animationParent] = useAutoAnimate();
  const ranks = useMemo(() => {
    const ranks = new Map<string, number>();
    for (const [i, word] of ranked.split("\n").entries()) {
      ranks.set(word, i);
    }
    return ranks;
  }, [ranked]);
  const { wordToIpas, ipaToWords, ipaPrefix, ipaSuffix } = useMemo(() => {
    const wordToIpas = new Map<string, (readonly [string, Mod])[]>();
    const ipaToWords = new Map<string, (readonly [string, Mod])[]>();
    const ipaPrefix = new Trie<string>();
    const ipaSuffix = new Trie<string>();
    for (const [word, ipa, mod] of extractTriples(data)) {
      multimapAppend(wordToIpas, word, [ipa, mod]);
      multimapAppend(ipaToWords, ipa, [word, mod]);
      ipaPrefix.add(ipa);
      ipaSuffix.add([...ipa].reverse().join(""));
    }
    return { wordToIpas, ipaToWords, ipaPrefix, ipaSuffix };
  }, [data]);
  const [search, setSearch] = useState("");
  const [ipa, setIpa] = useState("");
  const [results, setResults] = useState<readonly EntryData[]>([]);

  useEffect(() => {
    const ipas = new Set<string>();
    const res = new Map<string, EntryData>();
    for (const [ipa] of wordToIpas.get(search.trim().toLowerCase()) ?? []) {
      ipas.add(ipa);
      // prefix
      for (const prefixed of ipaPrefix.find(ipa)) {
        if (ipaToWords.has(prefixed.slice(ipa.length))) {
          for (const [longer] of ipaToWords.get(prefixed)!) {
            res.set(longer, { word: longer, ipa: prefixed });
          }
        }
      }
      // suffix
      const revIpa = [...ipa].reverse().join("");
      for (const revSuffixed of ipaSuffix.find(revIpa)) {
        const prefix = [...revSuffixed.slice(ipa.length)].reverse().join("");
        if (ipaToWords.has(prefix)) {
          const suffixed = [...revSuffixed].reverse().join("");
          for (const [longer] of ipaToWords.get(suffixed)!) {
            res.set(longer, { word: longer, ipa: suffixed });
          }
        }
      }
    }
    setResults(
      [...res.values()].sort(
        (left, right) =>
          (ranks.get(left.word) ?? ranks.size) -
          (ranks.get(right.word) ?? ranks.size),
      ),
    );
    setIpa([...ipas].join(" · "));
  }, [search, ipaPrefix, ipaSuffix, ipaToWords, ranks, wordToIpas]);

  return (
    <div className="flex flex-col grow basis-0 gap-y-2 text-lg">
      <div
        className="flex flex-col-reverse grow basis-0 gap-y-2 overflow-y-scroll"
        ref={animationParent}
      >
        {results.map((res) => (
          <Entry key={res.word} {...res} />
        ))}
      </div>
      <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded focus:outline outline-2 outline-gap-2 outline-slate-200 dark:outline-slate-600 flex">
        <input
          className="grow outline-none bg-transparent pl-1"
          value={search}
          onChange={(evt) => setSearch(evt.target.value)}
          placeholder="enter word..."
        />
        <span className="text-slate-400 dark:text-slate-600">{ipa}</span>
      </div>
    </div>
  );
}
