import { platform } from 'os';
import path, { dirname } from 'path';
import appRootDir from 'app-root-dir';

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
  const binariesPath = IS_PROD
    ? path.join(dirname(appRootDir.get()), './bin')
    : path.join(appRootDir.get(), 'resources', getPlatform());
  return path.resolve(
    path.join(binariesPath, `./${lib}${getPlatform() === 'win' ? '.exe' : ''}`)
  );
};
