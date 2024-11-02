import DialectGroup from "./dialect-group";
import DialectItem from "./dialect-item";

// Dialect information from:
// https://en.wikipedia.org/wiki/Sound_correspondences_between_English_accents
const ALL_DIALECTS = [
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

const GROUP_NAMES: Record<string, string> = {
  AmE: "American English",
  AuE: "Australian English",
  BahE: "Bahamian English",
  BarE: "Barbadian English",
  CIE: "Channel Island English",
  CaE: "Canadian English",
  "Cameroonian English": "Cameroonian English",
  EnE: "English English",
  FiE: "Fiji English",
  InE: "Indian English",
  IrE: "Irish English",
  NZE: "New Zealand English",
  PaE: "Palauan English",
  SAE: "South African English",
  SIE: "Solomon Islands English",
  SSE: "Standard Singapore English",
  ScE: "Scottish English",
  WaE: "Welsh English",
};

const DIALECT_GROUPS = new Map<string, [string, string][]>();
for (const dialect of ALL_DIALECTS) {
  const [abbrevKey, ...rest] = dialect.split(" : ");
  const key = GROUP_NAMES[abbrevKey];
  const name = rest.join(" > ");
  const init = DIALECT_GROUPS.get(key);
  if (init) {
    init.push([name, dialect]);
  } else {
    DIALECT_GROUPS.set(key, [[name, dialect]]);
  }
}

export default function DialectMenu({
  isOpen,
  setOpen,
  selected,
  setSelected,
}: {
  isOpen: boolean;
  setOpen: (state: boolean) => void;
  selected: Set<string>;
  setSelected: (state: Set<string>) => void;
}): React.ReactElement {
  const menuItems = [...DIALECT_GROUPS].map(([name, gdialects]) => (
    <DialectGroup
      key={name}
      name={name}
      dialects={gdialects}
      selected={selected}
      setSelected={setSelected}
    />
  ));

  return (
    <div
      className={`fixed h-full w-full left-0 ${isOpen ? "top-0" : "top-full"} bg-slate-100 dark:bg-slate-900 transition-all duration-300`}
    >
      <div className="mx-auto max-w-lg p-4 flex flex-col gap-2 h-full">
        <h1 className="text-3xl bold text-center">Dialect Choices</h1>
        <div className="grow overflow-y-scroll px-1 gap-y-2 flex flex-col">
          <DialectItem
            dialects={ALL_DIALECTS}
            selected={selected}
            setSelected={setSelected}
          >
            <h2 className="text-2xl">All Dialects</h2>
          </DialectItem>
          {menuItems}
        </div>
        <button
          className="bg-slate-400 dark:bg-slate-600 rounded-lg p-1"
          onClick={() => setOpen(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
}
