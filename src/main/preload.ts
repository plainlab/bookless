import { contextBridge, ipcRenderer } from 'electron';
import { Doc, DocFile, Meta } from 'renderer/state/AppState';

export type IpcAPI = typeof ipcAPI;

export type Message =
  | {
      type: 'initDoc';
      doc: Pick<Doc, 'md' | 'fileName' | 'filePath'>;
    }
  | {
      type: 'initConfig';
      config: Meta;
    };

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

const exportBook = async (dir: string) => ipcRenderer.invoke('exportBook', dir);
const exportChapter = async (dir: string, filename: string) =>
  ipcRenderer.invoke('exportChapter', dir, filename);

const pasteImageToAssets = async (dir: string, from: string) =>
  ipcRenderer.invoke('pasteImageToAssets', dir, from);

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
  exportBook,
  exportChapter,
  pasteImageToAssets,
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
    openDir: (cb: () => void) => ipcRenderer.on('openDir', cb),
    newFile: (cb: () => void) => ipcRenderer.on('newFile', cb),
    sendPlatform: (cb: (p: string) => void) =>
      ipcRenderer.once('sendPlatform', (_e, p) => cb(p)),
  },
};

contextBridge.exposeInMainWorld('ipcAPI', ipcAPI);
