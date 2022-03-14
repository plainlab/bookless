import fs from 'fs';
import path from 'path';
import { Meta } from '../renderer/state/AppState';
import { readConfigFile, saveConfigFile } from './file';

const bookConfigFile = '_bookless.yaml';

export const loadConfig = async (dir: string): Promise<Meta> => {
  if (!dir) {
    return {};
  }

  let conf: Meta = {};
  const confPath = path.join(dir, bookConfigFile);
  if (fs.existsSync(confPath)) {
    conf = (await readConfigFile(dir, bookConfigFile)) || {};
  }

  return conf;
};

export const dumpConfig = async (dir: string, conf: Meta) => {
  if (!dir) {
    return;
  }
  await saveConfigFile(path.join(dir, bookConfigFile), conf);
};
