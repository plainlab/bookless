import fs from 'fs';
import * as jsYaml from 'js-yaml';
import { readFile, rename, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { dialog } from 'electron';
import { truncate, pathToName } from '../helpers/string';
import { Doc, DocFile, Meta } from '../renderer/state/AppState';

const mdExtensions = ['md', 'txt', 'markdown'];

export const loadFile = async (
  dir: string,
  fileName: string
): Promise<Pick<Doc, 'md' | 'fileName' | 'filePath'> | undefined> => {
  const filePath = path.join(dir, fileName);

  try {
    const md = await readFile(filePath, 'utf-8');
    return { md, fileName, filePath };
  } catch (err) {
    dialog.showMessageBox({
      type: 'error',
      message: `Could not load file: ${fileName}`,
      detail: (err as Error).message,
    });
    return undefined;
  }
};

export const loadFiles = async (
  dir: string,
  filenames: string[]
): Promise<DocFile[]> => {
  const docFiles = await Promise.all(
    filenames.map(async (name) => {
      try {
        return {
          name,
          body: truncate(await readFile(path.join(dir, name), 'utf-8')),
        };
      } catch (err) {
        return { name: '', body: '' };
      }
    })
  );
  return docFiles.filter(({ name }) => name !== '');
};

export const newFile = async (dir: string): Promise<string> => {
  const res = await dialog.showSaveDialog({
    defaultPath: 'Untitled.md',
    filters: [{ name: 'Markdown', extensions: ['md', 'txt', 'markdown'] }],
  });
  let { filePath } = res;

  if (!filePath) {
    return '';
  }

  const filename = pathToName(filePath) || '';
  filePath = path.join(dir, filename);

  if (!filePath.startsWith(dir)) {
    dialog.showMessageBox({
      type: 'error',
      message: `Could not create file outside of ${dir}`,
    });
    return '';
  }

  try {
    await writeFile(filePath, `# ${filename}`);
    return filename;
  } catch (err) {
    dialog.showMessageBox({
      type: 'error',
      message: `Could not create file: ${filename}`,
      detail: (err as Error).message,
    });
    return '';
  }
};

export const saveFile = async (doc: Doc) => {
  if (!doc.filePath) {
    return;
  }

  try {
    await writeFile(doc.filePath, doc.md);
  } catch (err) {
    dialog.showMessageBox({
      type: 'error',
      message: `Could not save file: ${doc.fileName}`,
      detail: (err as Error).message,
    });
  }
};

export const renameFile = async (
  dir: string,
  oldName: string
): Promise<string> => {
  const res = await dialog.showSaveDialog({
    defaultPath: oldName,
    filters: [{ name: 'Markdown', extensions: ['md', 'txt', 'markdown'] }],
  });
  let { filePath } = res;

  if (!filePath) {
    return '';
  }

  const filename = pathToName(filePath) || '';
  filePath = path.join(dir, filename);

  const newPath = path.join(dir, filename);
  const oldPath = path.join(dir, oldName);
  try {
    await rename(oldPath, newPath);
    return filename;
  } catch (err) {
    dialog.showMessageBox({
      type: 'error',
      message: `Could not rename file: ${oldName}`,
      detail: (err as Error).message,
    });
    return '';
  }
};

export const deleteFile = async (
  dir: string,
  filename: string
): Promise<boolean> => {
  const response = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Yes', 'No'],
    title: 'Confirm',
    message: `Are you sure you want to delete ${filename}? This action can not be undone.`,
  });

  if (response.response !== 0) {
    return false;
  }

  try {
    await unlink(path.join(dir, filename));
    return true;
  } catch (err) {
    dialog.showMessageBox({
      type: 'error',
      message: `Could not delete file: ${filename}`,
      detail: (err as Error).message,
    });
    return false;
  }
};

export const openDir = async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (!filePaths[0]) {
    return {};
  }

  // TODO: Watch folder using chokidar
  const dir = filePaths[0];
  const filenames = fs
    .readdirSync(dir)
    .filter(
      (file: string) =>
        mdExtensions.includes(path.extname(file).substring(1)) &&
        fs.lstatSync(path.join(dir, file)).isFile()
    );
  return { dir, filenames };
};

export const readConfigFile = async (
  dirName: string,
  fileName: string
): Promise<Meta | undefined> => {
  try {
    const str = await readFile(path.join(dirName, fileName), 'utf8');
    const yaml = jsYaml.load(str);
    return typeof yaml === 'object' ? (yaml as Meta) : {};
  } catch (err) {
    dialog.showMessageBox({
      type: 'error',
      message: `Error loading config file: ${fileName}`,
      detail: (err as Error).message,
    });
    return undefined;
  }
};

export const saveConfigFile = async (filePath: string, conf: Meta) => {
  try {
    const yaml = jsYaml.dump(conf);
    await writeFile(filePath, yaml, 'utf8');
  } catch (err) {
    dialog.showMessageBox({
      type: 'error',
      message: `Error saving config file: ${filePath}`,
      detail: (err as Error).message,
    });
  }
};
