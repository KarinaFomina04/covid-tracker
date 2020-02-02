declare module 'csv-parse/lib/sync' {
  function parseCsv(
    input: string,
    options?: {
      columns?: boolean;
      bom?: boolean;
      skip_empty_lines?: boolean;
    },
  ): Array<Record<string, string>>;

  export = parseCsv;
}
