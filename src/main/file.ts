import fs from 'fs';
import { readFile, rename, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { clipboard, dialog } from 'electron';
import { nanoid } from 'nanoid';
import { words, truncate, pathToName } from '../helpers/string';
import { Doc, DocFile } from '../renderer/state/AppState';

const mdExtensions = ['md', 'txt', 'markdown'];

const IS_MAC = process.platform === 'darwin';
const IS_WIN32 = process.platform === 'win32';

function getFilePathFromClipboard() {
  if (IS_WIN32) {
    const rawFilePath = clipboard.read('FileNameW');
    return rawFilePath.replace(new RegExp(String.fromCharCode(0), 'g'), '');
  }
  if (IS_MAC) {
    return clipboard.read('public.file-url').replace('file://', '');
  }
  return clipboard.readText();
}

export const loadFile = async (
  dir: string,
  filename: string
): Promise<Pick<Doc, 'md' | 'fileName' | 'filePath'> | undefined> => {
  const filePath = path.join(dir, filename);

  try {
    const md = await readFile(filePath, 'utf-8');
    return { md, fileName: filename, filePath };
  } catch (err) {
    dialog.showMessageBox({
      type: 'error',
      message: `Could not load file: ${filename}`,
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
        const content = await readFile(path.join(dir, name), 'utf-8');
        return {
          name,
          body: truncate(content),
          count: words(content),
        };
      } catch (err) {
        return { name: '', body: '', count: '' };
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

export const pasteImageToAssets = async (dir: string): Promise<string[]> => {
  // Detect image on clipboard (image file path or real image)
  const fromPath = decodeURIComponent(getFilePathFromClipboard());
  const containsImage =
    clipboard.availableFormats().some((p) => p.includes('image')) ||
    fromPath.toLowerCase().endsWith('.png') ||
    fromPath.toLowerCase().endsWith('.jpeg') ||
    fromPath.toLowerCase().endsWith('.jpg');

  if (containsImage) {
    const containsPng =
      clipboard.availableFormats().some((p) => p.includes('image/png')) ||
      fromPath.toLowerCase().endsWith('.png');

    const filename = `${nanoid()}.${containsPng ? 'png' : 'jpg'}`;
    const filePath = path.join('assets', filename);
    const dest = path.join(dir, filePath);
    const assetsRoot = path.dirname(dest);
    await fs.promises.mkdir(assetsRoot, { recursive: true });

    // Support copy image from path
    if (fromPath) {
      await fs.promises.copyFile(fromPath, dest);
      return [filename, filePath];
    }

    // Support copy image on clipboard
    const nImg = clipboard.readImage();
    if (nImg && !nImg.isEmpty()) {
      if (containsPng) {
        await fs.promises.writeFile(dest, nImg.toPNG());
      } else {
        await fs.promises.writeFile(dest, nImg.toJPEG(100));
      }
      return [filename, filePath];
    }
  }

  return [fromPath || clipboard.readText(), ''];
};
