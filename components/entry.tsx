import type { EntryData } from "../utils/types";

export default function Entry({
  word,
  ipa,
  other,
}: EntryData): React.ReactElement {
  const others = other.join(" · ");
  return (
    <div className="px-1 flex justify-between gap-x-4 items-center">
      <span className="space-x-2 shrink-0">
        <span>{word}</span>
        <span className="text-slate-400 dark:text-slate-600">{ipa}</span>
      </span>
      <span className="text-slate-400 dark:text-slate-600 text-right">
        {others}
      </span>
    </div>
  );
}
