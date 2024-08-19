import Main from "../components/main";
import { readFile } from "fs/promises";

export default async function Home(): Promise<React.ReactElement> {
  const [data, ranked] = await Promise.all([
    readFile("./public/ipa.txt", "utf8"),
    readFile("./public/ranked.txt", "utf8"),
  ]);

  return (
    // FIXME the viewport doesn't seem to be resizing with a keyboard, but idk why
    <main className="mx-auto max-w-lg h-full flex flex-col p-4 space-y-4">
      <h1 className="text-3xl bold text-center">🐀 Loose RAT Helper</h1>
      <Main data={data} ranked={ranked} />
    </main>
  );
}
