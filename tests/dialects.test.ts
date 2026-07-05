import { describe, expect, test } from "bun:test";
import { buildSubstitution } from "../components/dialects";

describe("dialect canonicalization", async () => {
  const { dialects } = await Bun.file(
    "./components/loose_rat_inputs.json",
  ).json();

  test("merges phonemes connected through a dialect's rules", () => {
    // AAVE Non-Rhotic asserts æ~ɛ and ɛ~ɪ, so cat and kit land in one class
    const substitute = buildSubstitution(["AmE : AAVE : Non-Rhotic"], dialects);
    expect(substitute("kæt")).toBe(substitute("kɪt"));
  });

  test("leaves transcriptions unchanged when no dialect is selected", () => {
    const substitute = buildSubstitution([], dialects);
    expect(substitute("kæt")).toBe("kæt");
  });

  test("does not merge phonemes that are in no shared class", () => {
    // p and b are never named in the rules, so they stay distinct
    const substitute = buildSubstitution(["AmE : AAVE : Non-Rhotic"], dialects);
    expect(substitute("pɪn")).not.toBe(substitute("bɪn"));
  });
});
