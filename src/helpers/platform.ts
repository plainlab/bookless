import { platform } from 'os';
import path, { dirname } from 'path';
import { app } from 'electron';

const IS_PROD = process.env.NODE_ENV === 'production';

export const getPlatform = () => {
  switch (platform()) {
    case 'aix':
    case 'freebsd':
    case 'linux':
    case 'openbsd':
    case 'android':
      return 'linux';
    case 'darwin':
    case 'sunos':
      return 'mac';
    default:
      return 'win';
  }
};

export const getExecPath = (lib: string) => {
  const rootDir = dirname(app.getAppPath());
  const binariesPath = IS_PROD
    ? path.join(rootDir, './bin')
    : path.join(rootDir, '..', 'resources', getPlatform());
  return path.resolve(
    path.join(binariesPath, `./${lib}${getPlatform() === 'win' ? '.exe' : ''}`)
  );
};
