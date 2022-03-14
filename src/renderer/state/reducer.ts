import { truncate } from 'helpers/string';
import { AppState } from './AppState';
import { Action } from './Action';
import parseYaml from '../export/convertYaml';

export interface AppStateProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const appStateReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'initFiles': {
      const { dir, files } = action;
      return { ...state, dir, files };
    }
    case 'initDoc': {
      const { md } = action.doc;
      const doc = { ...state.doc, ...action.doc, ...parseYaml(md) };
      return { ...state, doc };
    }
    case 'initConfig': {
      const { config } = action;
      return { ...state, config };
    }
    case 'updateConfig': {
      const { key, value } = action;
      const config = { ...state.config };
      config[key] = value;

      // FIXME: Should we put save here?
      window.ipcAPI?.dumpConfig(state.dir, config);

      return { ...state, config };
    }
    case 'setMd': {
      const { md } = action;
      const doc = {
        ...state.doc,
        ...parseYaml(md),
        md,
      };

      // FIXME: Should we put save here?
      window.ipcAPI?.saveFile(doc);

      const files = state.files.map((file) => {
        if (file.name === doc.fileName) {
          return { ...file, body: truncate(doc.md) };
        }
        return file;
      });

      return { ...state, doc, files };
    }
    case 'toggleConfig': {
      return { ...state, configOpen: !state.configOpen };
    }
    case 'togglePaginated': {
      return { ...state, paginated: !state.paginated };
    }
    case 'toggleExplorer': {
      return { ...state, explorer: !state.explorer };
    }
    default:
      return state;
  }
};

export default appStateReducer;
