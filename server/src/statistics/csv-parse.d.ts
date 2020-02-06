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

declare module 'csv-parse' {
  import { Transform } from 'stream';
  function parseCsv(options?: {
    columns?: boolean;
    bom?: boolean;
    skip_empty_lines?: boolean;
  }): Transform;
  export = parseCsv;
}
