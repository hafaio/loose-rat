export default function DialectItem({
  dialect,
  selected,
  setDialects,
}: {
  dialect: string;
  selected: readonly string[];
  setDialects: (newDialects: string[]) => void;
}): React.ReactElement {
  // FIXME these shouldn't update until we hit save, otherwise we send a lot of unnecessary requests
  const isSelcted = selected.indexOf(dialect) >= 0;
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={isSelcted}
          className="mr-2"
          onChange={() =>
            // FIXME this is inefficient, probably want a set style update, or even natively store the booleans
            setDialects(
              isSelcted
                ? selected.filter((d) => d !== dialect)
                : [...selected, dialect]
            )
          }
        />
        <span>{dialect}</span>
      </label>
    </div>
  );
}
