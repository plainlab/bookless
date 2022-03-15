import { Doc, DocFile, JSON, Meta } from './AppState';

export type Action =
  | {
      type: 'initFiles';
      dir: string;
      files: DocFile[];
    }
  | {
      type: 'initDoc';
      doc: Pick<Doc, 'md' | 'fileName' | 'filePath'>;
    }
  | {
      type: 'updateMd';
      md: string;
    }
  | {
      type: 'initConfig';
      config: Meta;
    }
  | {
      type: 'updateConfig';
      key: string;
      value: JSON;
    }
  | {
      type: 'toggleConfig';
    }
  | {
      type: 'togglePaginated';
    }
  | {
      type: 'toggleExplorer';
    };
