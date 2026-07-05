"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CgMenu, CgSpinner } from "react-icons/cg";
import type { EntryData, Query, Result } from "../utils/types";
import DialectMenu from "./dialect-menu";
import Entry from "./entry";

const DIALECT_KEY = "dialects";

export default function Search(): React.ReactElement {
  // This is an ugly hack because iOS sucks
  // TODO should I maybe just make it statically positioned, and adjust it's
  // height that way? that might prevent scroll
  useEffect(() => {
    const { visualViewport } = window;
    if (visualViewport) {
      visualViewport.addEventListener("resize", () => {
        document.body.style.height = `${visualViewport.height}px`;
      });
    }
  }, []);
  const [animationParent] = useAutoAnimate();

  // selected dialects and other states
  const [dialects, setDialects] = useState(new Set<string>());
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [ipa, setIpa] = useState("");
  const [results, setResults] = useState<readonly EntryData[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  // load dialects from storage
  useEffect(() => {
    const lastDialects = JSON.parse(localStorage.getItem(DIALECT_KEY) ?? "[]");
    if (
      Array.isArray(lastDialects) &&
      lastDialects.every((d) => typeof d === "string")
    ) {
      setDialects(new Set(lastDialects));
    }
  }, []);

  // safe to loca storage on change
  useEffect(() => {
    localStorage.setItem(DIALECT_KEY, JSON.stringify([...dialects]));
  }, [dialects]);

  // a dead worker caches its rejected data-load promise, so recovery means a fresh one
  const workerRef = useRef<Worker>(null);
  const spawnWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
  }, []);
  useEffect(() => {
    spawnWorker();
    return () => workerRef.current?.terminate();
  }, [spawnWorker]);

  // dispatch each query and listen for its result on the current worker
  useEffect(() => {
    // if we have the menu open, don't search
    if (menuOpen) return;
    const worker = workerRef.current;
    if (!worker) return;

    // respawn but don't repost — the next query retries, so a broken worker can't loop
    const onFailure = () => {
      setSearching(false);
      setFailed(true);
      spawnWorker();
    };
    const onResult = (event: MessageEvent<Result>) => {
      const { dialects: edialects, query, results, ipa, error } = event.data;
      // ignore results for a query or dialect set we've since moved past
      if (
        query !== search ||
        edialects.length !== dialects.size ||
        !edialects.every((dialect) => dialects.has(dialect))
      ) {
        return;
      }
      setSearching(false);
      if (error) {
        onFailure();
      } else {
        setResults(results);
        setIpa(ipa);
      }
    };

    worker.addEventListener("message", onResult);
    worker.addEventListener("error", onFailure);
    worker.addEventListener("messageerror", onFailure);

    setResults([]);
    setIpa("");
    setFailed(false);
    setSearching(true);
    const query: Query = { dialects: [...dialects], query: search };
    worker.postMessage(query);

    return () => {
      worker.removeEventListener("message", onResult);
      worker.removeEventListener("error", onFailure);
      worker.removeEventListener("messageerror", onFailure);
    };
  }, [search, dialects, menuOpen, spawnWorker]);

  let tail: React.ReactElement;
  if (failed) {
    tail = (
      <span
        className="text-red-500 dark:text-red-400 text-sm mt-auto mb-auto"
        title="search failed — keep typing to retry"
      >
        error
      </span>
    );
  } else if (searching) {
    tail = <CgSpinner className="animate-spin mt-auto mb-auto" />;
  } else {
    tail = <span className="text-slate-400 dark:text-slate-600">{ipa}</span>;
  }

  return (
    <div className="grow basis-0">
      <div className="flex flex-col gap-y-2 text-lg h-full">
        <div
          className="flex flex-col-reverse grow basis-0 gap-y-2 overflow-y-auto overscroll-none"
          ref={animationParent}
        >
          {results.map((res) => (
            <Entry key={res.word} {...res} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded focus-within:outline outline-2 outline-slate-200 dark:outline-slate-600 flex grow">
            <input
              className="grow outline-none bg-transparent pl-1"
              value={search}
              onChange={(evt) => setSearch(evt.target.value)}
              onKeyDown={(evt) =>
                evt.key === "Enter" && evt.currentTarget.blur()
              }
              placeholder={"enter word..."}
            />
            {tail}
          </div>
          <button
            className="text-2xl"
            onClick={() => setMenuOpen(true)}
            type="button"
          >
            <CgMenu />
          </button>
        </div>
      </div>
      <DialectMenu
        isOpen={menuOpen}
        setOpen={setMenuOpen}
        selected={dialects}
        setSelected={setDialects}
      />
    </div>
  );
}
