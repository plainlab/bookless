import { ipcMain, shell, BrowserWindow } from 'electron';
import { Doc, Meta } from 'renderer/state/AppState';
import {
  openDir,
  newFile,
  deleteFile,
  loadFile,
  saveFile,
  loadFiles,
  renameFile,
} from './file';
import { Message } from './preload';
import { dumpConfig, loadConfig } from './config';

export const init = () => {
  ipcMain.handle('openDir', openDir);
  ipcMain.handle('newFile', (_event, dir: string) => newFile(dir));
  ipcMain.handle('loadFile', (_event, dir: string, filePath: string) =>
    loadFile(dir, filePath)
  );
  ipcMain.handle('loadFiles', (_event, dir: string, filenames: string[]) =>
    loadFiles(dir, filenames)
  );
  ipcMain.handle('saveFile', (_event, doc: Doc) => saveFile(doc));
  ipcMain.handle('renameFile', (_event, dir: string, filename: string) =>
    renameFile(dir, filename)
  );
  ipcMain.handle('deleteFile', (_event, dir: string, filename: string) =>
    deleteFile(dir, filename)
  );
  ipcMain.handle('loadConfig', (_event, dir: string) => loadConfig(dir));
  ipcMain.handle('dumpConfig', (_event, dir: string, conf: Meta) =>
    dumpConfig(dir, conf)
  );
  ipcMain.on('openLink', (_event, link: string) => {
    shell.openExternal(link);
  });
};

export const sendMessage = (win: BrowserWindow, msg: Message) => {
  win.webContents.send('dispatch', msg);
};

export const sendPlatform = (win: BrowserWindow) => {
  win.webContents.send('sendPlatform', process.platform);
};

export type Command =
  | 'printFile'
  | 'openDir'
  | 'find'
  | 'findNext'
  | 'findPrevious'
  | 'addBold'
  | 'addItalic'
  | 'addStrikethrough';

export const sendCommand = (win: BrowserWindow, cmd: Command) => {
  win.webContents.send(cmd);
};
