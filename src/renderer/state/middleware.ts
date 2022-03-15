import { Action } from './Action';
import { AppState } from './AppState';

export default function saveToDiskMiddleware(
  action: Action | undefined,
  state: AppState
): void {
  if (!action) {
    return;
  }

  switch (action.type) {
    case 'updateMd': {
      window.ipcAPI?.saveFile(state.doc);
      break;
    }
    case 'updateConfig': {
      window.ipcAPI?.saveConfig(state.dir, state.config);
      break;
    }
    default:
      break;
  }
}
