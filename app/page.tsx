import Search from "../components/search";
import { readFile } from "fs/promises";

export default function Home(): React.ReactElement {
  return (
    <main className="relative mx-auto max-w-lg h-full flex flex-col p-4 space-y-4">
      <h1 className="text-3xl bold text-center">🐀 Loose RAT Helper</h1>
      <Search />
    </main>
  );
}
