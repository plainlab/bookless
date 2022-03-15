import { Action } from './Action';
import { AppState, ConfigKey } from './AppState';

export default function saveToDiskMiddleware(
  action: Action | undefined,
  state: AppState
): void {
  if (!action) {
    return;
  }

  switch (action.type) {
    case 'updateMd': {
      if (state.doc.filePath?.startsWith(state.dir)) {
        window.ipcAPI?.saveFile(state.doc);
      }
      break;
    }
    case 'updateConfig': {
      if (state.dir === action.config[ConfigKey.currentDir]) {
        window.ipcAPI?.saveConfig(state.dir, state.config);
      }
      break;
    }
    default:
      break;
  }
}
