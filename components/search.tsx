"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Entry from "./entry";
import { CgSpinner, CgMenu } from "react-icons/cg";
import { Query, Result, EntryData } from "../utils/types";
import DialectItem from "./dialect-item";

// FIXME move into menu
const DIALECTS = [
  "AmE : AAVE : Non-Rhotic",
  "AmE : AAVE : Rhotic",
  "AmE : Boston accent : Older",
  "AmE : Boston accent : Younger",
  "AmE : Cajun English",
  "AmE : California English : Northern",
  "AmE : California English : Southern",
  "AmE : Chicano English",
  "AmE : General American",
  "AmE : Inland Northern American English",
  "AmE : Miami accent",
  "AmE : Mid-Atlantic English",
  "AmE : New York accent : Non-Rhotic",
  "AmE : New York accent : Older",
  "AmE : New York accent : Rhotic",
  "AmE : Philadelphia accent",
  "AmE : Southern American English : Non-Rhotic",
  "AmE : Southern American English : Older",
  "AmE : Southern American English : Rhotic",
  "AuE : Broad",
  "AuE : Cultivated",
  "AuE : General",
  "BahE",
  "BarE",
  "CIE",
  "CaE",
  "Cameroonian English",
  "EnE : Brummie",
  "EnE : Northern England English : Cumbrian",
  "EnE : Northern England English : Geordie",
  "EnE : Northern England English : Lancashire",
  "EnE : Northern England English : Manchester",
  "EnE : Northern England English : Pitmatic",
  "EnE : Northern England English : Scouse",
  "EnE : Northern England English : Yorkshire",
  "EnE : RP : Conservative",
  "EnE : RP : Contemporary (SSBE)",
  "EnE : Southern England English : Cockney",
  "EnE : Southern England English : Estuary English (EE)",
  "EnE : Southern England English : MLE",
  "EnE : Southern England English : West Country",
  "FiE",
  "InE",
  "IrE : Dublin English : Local Dublin English",
  "IrE : Dublin English : New Dublin English",
  "IrE : Supraregional southern Irish English",
  "IrE : Ulster English : Belfast",
  "IrE : Ulster English : Mid-Ulster",
  "IrE : Ulster English : Ulster Scots",
  "IrE : Ulster English : traditional",
  "IrE : West & South-West Irish English",
  "NZE : Broad",
  "NZE : Cultivated",
  "NZE : General",
  "PaE",
  "SAE : Broad",
  "SAE : Cultivated",
  "SAE : General",
  "SIE",
  "SSE",
  "ScE",
  "WaE : Abercraf English",
  "WaE : Cardiff English",
  "WaE : Port Talbot English",
];

export default function Search(): React.ReactElement {
  // This is an ugly hack because iOS sucks
  // FIXME should I maybe just make it statically positioned, and adjust it's
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

  // selected dialects
  const [selectedDialects, setSelectedDialects] = useState<readonly string[]>(
    []
  );
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [ipa, setIpa] = useState("");
  const [results, setResults] = useState<readonly EntryData[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  // initialize worker
  const workerRef = useRef<Worker>();
  useEffect(() => {
    workerRef.current = new Worker(new URL("../worker.ts", import.meta.url), {
      type: "module",
    });
    return () => {
      workerRef.current?.terminate();
    };
  }, []);
  useEffect(() => {
    const listener = (event: MessageEvent<Result>) => {
      const { dialects, query, results, ipa } = event.data;
      if (
        query === search &&
        dialects.length === selectedDialects.length &&
        dialects.every((d, i) => d === selectedDialects[i])
      ) {
        setResults(results);
        setIpa(ipa);
        setSearching(false);
      }
    };
    workerRef.current?.addEventListener("message", listener);
    return () => {
      workerRef.current?.removeEventListener("message", listener);
    };
  }, [search, selectedDialects]);

  useEffect(() => {
    // if we have the menu open, don't search
    if (menuOpen) return;

    const query: Query = {
      dialects: selectedDialects,
      query: search,
    };
    setResults([]);
    setIpa("");
    setSearching(true);
    workerRef.current?.postMessage(query);
  }, [search, selectedDialects, menuOpen]);

  const tail = searching ? (
    <CgSpinner className="animate-spin mt-auto mb-auto" />
  ) : (
    <span className="text-slate-400 dark:text-slate-600">{ipa}</span>
  );

  // FIXME these should be grouped with other options to toggle groups, and should probably be pulled into it's own menu class
  const menuItems = DIALECTS.map((dialect) => (
    <DialectItem
      key={dialect}
      dialect={dialect}
      selected={selectedDialects}
      setDialects={setSelectedDialects}
    />
  ));

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
          <button className="text-2xl" onClick={() => setMenuOpen(true)}>
            <CgMenu />
          </button>
        </div>
      </div>
      <div
        className={`fixed h-full w-full left-0 ${menuOpen ? "top-0" : "top-full"} backdrop-blur-lg transition-all duration-300`}
      >
        <div className="mx-auto max-w-lg p-4 flex flex-col gap-2 h-full">
          <h1 className="text-3xl bold text-center">Dialects</h1>
          <div className="grow overflow-y-scroll px-1">{menuItems}</div>
          <button
            className="bg-slate-400 dark:bg-slate-600 rounded-lg p-1"
            onClick={() => setMenuOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
