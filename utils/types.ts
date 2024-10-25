export interface Query {
  dialects: readonly string[];
  query: string;
}

export interface EntryData {
  word: string;
  ipa: string;
  rank?: number;
  other: readonly string[];
}

export interface Result extends Query {
  results: EntryData[];
  ipa: string;
}
