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
  // State settings
  currentDir: 'currentDir',
  // Pandoc defaults
  inputFiles: 'inputFiles',
  title: 'variables.title',
  author: 'variables.author',
  date: 'variables.date',
  lang: 'variables.lang',
  font: 'variables.mainfont',
  fontSize: 'variables.fontsize',
  lineHeight: 'variables.linestretch',
  headerIncludes: 'variables.headerIncludes',
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

export const initialState: AppState = {
  dir: '',
  files: [],
  doc: {
    md: 'Choose a **folder** to get started by clicking the open icon on the top left!',
    yaml: '',
    bodyMd: '',
    meta: {},
    html: '',
    fileName: '',
    filePath: undefined,
  },
  configOpen: false,
  config: {
    inputFiles: [],
  },
  paginated: false,
  explorer: true,
};
