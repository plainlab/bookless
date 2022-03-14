export interface AppState {
  dir: string;
  files: DocFile[];
  doc: Doc;
  config: Meta;
  paginated: boolean;
  explorer: boolean;
  configOpen: boolean;
}

export interface Doc {
  md: string;
  yaml: string;
  bodyMd: string;
  meta: Meta;
  html: string;

  fileName?: string;
  filePath?: string;
}

export interface DocFile {
  name: string;
  body: string;
}

export const ConfigKey = {
  // Render
  bookFilename: 'bookFilename',
  mdFiles: 'mdFiles',
  // Meta
  title: 'title',
  author: 'author',
  date: 'date',
  lang: 'lang',
  // Layout
  font: 'font',
  fontSize: 'fontSize',
  lineHeight: 'lineHeight',
  headerIncludes: 'headerIncludes',
};

export type Meta = Record<string, JSON>;
export type JSON =
  | string
  | string[]
  | number
  | boolean
  | null
  | Meta[]
  | { [key: string]: JSON };
