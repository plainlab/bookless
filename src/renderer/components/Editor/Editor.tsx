import classNames from 'classnames';
import { useEffect } from 'react';
import {
  IoAddOutline,
  IoBookmarkOutline,
  IoShareOutline,
} from 'react-icons/io5';
import { ConfigKey } from 'renderer/state/AppState';
import { AppStateProps } from 'renderer/state/reducer';
import Mirror from './Mirror';

const Editor = (props: AppStateProps) => {
  const { state, dispatch } = props;

  const newFile = async () => {
    if (!state.dir) {
      return;
    }

    const filename = await window.ipcAPI?.newFile(state.dir);
    if (filename) {
      let { mdFiles } = state.config;
      mdFiles = mdFiles as string[];
      if (state.doc.fileName) {
        const currentIndex = mdFiles.indexOf(state.doc.fileName);
        mdFiles.splice(currentIndex + 1, 0, filename);
      } else {
        mdFiles.push(filename);
      }

      const files = (await window.ipcAPI?.loadFiles(state.dir, mdFiles)) || [];

      dispatch({ type: 'initFiles', dir: state.dir, files });
      dispatch({
        type: 'updateConfig',
        config: {
          [ConfigKey.currentDir]: state.dir,
          [ConfigKey.mdFiles]: mdFiles,
        },
      });
    }
  };

  useEffect(() => {
    window.ipcAPI?.on.newFile(newFile);
  });

  return (
    <div className="relative flex flex-col flex-1 bg-white">
      <nav
        className={classNames({
          'absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 text-gray-500':
            true,
          'opacity-0 hover:opacity-100': !state.explorer,
        })}
      >
        <section className="flex items-center justify-center space-x-4">
          <IoBookmarkOutline
            title="Toggle chapters"
            onClick={() => state.dir && dispatch({ type: 'toggleExplorer' })}
            className={classNames({
              'w-5 h-5 opacity-70': true,
              'cursor-pointer hover:opacity-100': state.dir,
              'cursor-not-allowed opacity-10': !state.dir,
            })}
          />
          <IoAddOutline
            title="New chapter"
            onClick={newFile}
            className={classNames({
              'w-5 h-5 opacity-70': true,
              'cursor-pointer hover:opacity-100': state.dir,
              'cursor-not-allowed opacity-10': !state.dir,
            })}
          />
        </section>
        <section className="z-0 flex items-center justify-center space-x-4">
          <IoShareOutline
            className={classNames({
              'w-5 h-5 opacity-70': true,
              'cursor-pointer hover:opacity-100': state.doc.filePath,
              'cursor-not-allowed opacity-10': !state.doc.filePath,
            })}
          />
        </section>
      </nav>
      <section className="flex-1 overflow-auto">
        <Mirror state={state} dispatch={dispatch} />
      </section>
    </div>
  );
};

export default Editor;
