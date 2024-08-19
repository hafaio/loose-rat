export interface EntryData {
  word: string;
  ipa: string;
}

export default function Entry({ word, ipa }: EntryData): React.ReactElement {
  return (
    <div className="px-1 flex">
      <span className="grow">{word}</span>
      <span className="text-slate-400 dark:text-slate-600">{ipa}</span>
    </div>
  );
}
