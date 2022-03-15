import { contextBridge, ipcRenderer } from 'electron';
import { AppState, Doc, DocFile, Meta } from 'renderer/state/AppState';
import { Action } from 'renderer/state/Action';

export type IpcAPI = typeof ipcAPI;
type Disp = (a: Action) => void;

let state: AppState | undefined;
let dispatch: Disp | undefined;

ipcRenderer.on('getDoc', (_e, replyChannel: string) => {
  if (state) {
    ipcRenderer.send(replyChannel, state.doc);
  }
});

export type Message =
  | {
      type: 'initDoc';
      doc: Pick<Doc, 'md' | 'fileName' | 'filePath'>;
    }
  | {
      type: 'initConfig';
      config: Meta;
    };

ipcRenderer.on('dispatch', (_e, action: Message) => {
  if (dispatch) {
    dispatch(action);
  }
});

const chooseFormat = async (fmt: string): Promise<boolean> =>
  ipcRenderer.invoke('chooseFormat', fmt);

const readDataDirFile = async (fileName: string): Promise<Meta | undefined> =>
  ipcRenderer.invoke('readDataDirFile', fileName);

const openDir = async (): Promise<{ dir: string; filenames: string[] }> =>
  ipcRenderer.invoke('openDir');

const loadFile = async (dir: string, filename: string): Promise<Doc> =>
  ipcRenderer.invoke('loadFile', dir, filename);

const renameFile = async (dir: string, filename: string): Promise<string> =>
  ipcRenderer.invoke('renameFile', dir, filename);

const deleteFile = async (dir: string, filename: string): Promise<boolean> =>
  ipcRenderer.invoke('deleteFile', dir, filename);

const loadFiles = async (
  dir: string,
  filenames: string[]
): Promise<DocFile[]> => ipcRenderer.invoke('loadFiles', dir, filenames);

const saveFile = async (doc: Doc) => ipcRenderer.invoke('saveFile', doc);

const newFile = async (dir: string): Promise<string> =>
  ipcRenderer.invoke('newFile', dir);

const loadConfig = async (dir: string): Promise<Meta> =>
  ipcRenderer.invoke('loadConfig', dir);

const saveConfig = async (dir: string, conf: Meta) =>
  ipcRenderer.invoke('saveConfig', dir, conf);

const ipcAPI = {
  openDir,
  loadFile,
  loadFiles,
  newFile,
  deleteFile,
  saveFile,
  loadConfig,
  saveConfig,
  renameFile,
  setStateAndDispatch: (s: AppState, d: Disp) => {
    state = s;
    dispatch = d;
  },
  send: {
    openLink: (lnk: string) => {
      if (typeof lnk === 'string') ipcRenderer.send('openLink', lnk);
    },
  },
  on: {
    addBold: (cb: () => void) => ipcRenderer.on('addBold', cb),
    addItalic: (cb: () => void) => ipcRenderer.on('addItalic', cb),
    addStrikethrough: (cb: () => void) =>
      ipcRenderer.on('addStrikethrough', cb),
    find: (cb: () => void) => ipcRenderer.on('find', cb),
    findNext: (cb: () => void) => ipcRenderer.on('findNext', cb),
    findPrevious: (cb: () => void) => ipcRenderer.on('findPrevious', cb),
    printFile: (cb: () => void) => ipcRenderer.on('printFile', cb),
    openDir: (cb: () => void) => ipcRenderer.on('openDir', cb),
    sendPlatform: (cb: (p: string) => void) =>
      ipcRenderer.once('sendPlatform', (_e, p) => cb(p)),
  },
  chooseFormat,
  readDataDirFile,
};

contextBridge.exposeInMainWorld('ipcAPI', ipcAPI);
