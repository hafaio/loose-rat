import { useRef } from "react";

export default function DialectItem({
  dialects,
  selected,
  setSelected,
  children,
}: React.PropsWithChildren<{
  dialects: readonly string[];
  selected: Set<string>;
  setSelected: (newDialects: Set<string>) => void;
}>): React.ReactElement {
  const ref = useRef<HTMLInputElement>(null);
  const statuses = dialects.map((d) => selected.has(d));
  const allChecked = statuses.every((h) => h);
  const noneChecked = !statuses.some((h) => h);
  const isSelected = allChecked;
  if (ref.current) {
    ref.current.indeterminate = !allChecked && !noneChecked;
  }
  return (
    <div>
      <label className="flex w-full gap-x-2">
        <div className="grow">{children}</div>
        <input
          type="checkbox"
          checked={isSelected}
          className="w-4 h-4 accent-slate-600 dark:accent-slate-400"
          onChange={() => {
            // TODO this is inefficient because we clone the set every time, and
            // we'd be better off use a reducer that took the updates
            const clone = new Set([...selected]);
            if (isSelected) {
              for (const dialect of dialects) {
                clone.delete(dialect);
              }
            } else {
              for (const dialect of dialects) {
                clone.add(dialect);
              }
            }
            setSelected(clone);
          }}
          ref={ref}
        />
      </label>
    </div>
  );
}
