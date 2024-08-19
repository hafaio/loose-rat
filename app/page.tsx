import Main from "../components/main";

export default function Home(): React.ReactElement {
  return (
    // FIXME the viewport doesn't seem to be resizing with a keyboard, but idk why
    <main className="mx-auto max-w-lg h-full flex flex-col p-4">
      <h1 className="text-3xl bold text-center">🐀 Loose-RAT Helper</h1>
      <Main />
    </main>
  );
}
