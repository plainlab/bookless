import fs from 'fs';
import * as jsYaml from 'js-yaml';
import path from 'path';
import _ from 'lodash';
import { readFile, writeFile } from 'fs/promises';
import { dialog } from 'electron';
import { Meta } from '../renderer/state/AppState';

const bookConfigFile = '_bookless.yaml';

export const bookless2pandoc = (conf: Meta): Meta => {
  const pandoc = {};
  Object.entries(conf).map(([k, v]) =>
    _.set(
      pandoc,
      k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`),
      v
    )
  );
  return pandoc;
};

export const pandoc2bookless = (conf: object): Meta => {
  const bookless: Meta = {};

  (function recurse(obj: object, current?: string) {
    Object.entries(obj).forEach(([key, value]) => {
      const newKey = current ? `${current}.${key}` : key;
      if (value && value instanceof Object && !(value instanceof Array)) {
        recurse(value, newKey);
      } else {
        bookless[newKey] = value;
      }
    });
  })(conf);

  return Object.fromEntries(
    Object.entries(bookless).map(([k, v]) => [
      [k.replace(/-./g, (m) => `${m[1].toUpperCase()}`)],
      v,
    ])
  );
};

const readConfigFile = async (
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

const saveConfigFile = async (filePath: string, conf: Meta) => {
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

export const loadConfig = async (dir: string): Promise<Meta> => {
  if (!dir) {
    return {};
  }

  let conf: Meta = {};
  const confPath = path.join(dir, bookConfigFile);
  if (fs.existsSync(confPath)) {
    conf = (await readConfigFile(dir, bookConfigFile)) || {};
  }

  return pandoc2bookless(conf);
};

export const saveConfig = async (dir: string, conf: Meta) => {
  // Skip currentDir config
  delete conf.currentDir;

  if (!dir) {
    return;
  }
  await saveConfigFile(path.join(dir, bookConfigFile), bookless2pandoc(conf));
};
