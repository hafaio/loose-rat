import DialectItem from "./dialect-item";

export default function DialectGroup({
  name,
  dialects,
  selected,
  setSelected,
}: {
  name: string;
  dialects: readonly [string, string][];
  selected: Set<string>;
  setSelected: (newDialects: Set<string>) => void;
}): React.ReactElement {
  const menuItems =
    dialects.length > 1
      ? dialects.map(([name, dialect]) => (
          <DialectItem
            key={dialect}
            dialects={[dialect]}
            selected={selected}
            setSelected={setSelected}
          >
            <span className="text-lg">{name}</span>
          </DialectItem>
        ))
      : null;
  return (
    <div>
      <DialectItem
        dialects={dialects.map(([, d]) => d)}
        selected={selected}
        setSelected={setSelected}
      >
        <h2 className="text-2xl">{name}</h2>
      </DialectItem>
      {menuItems}
    </div>
  );
}
