import classNames from 'classnames';
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
        mdFiles.splice(currentIndex, 0, filename);
      } else {
        mdFiles.unshift(filename);
      }

      const files = (await window.ipcAPI?.loadFiles(state.dir, mdFiles)) || [];

      dispatch({ type: 'initFiles', dir: state.dir, files });
      dispatch({
        type: 'updateConfig',
        key: ConfigKey.mdFiles,
        value: mdFiles,
      });
    }
  };

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
            onClick={() => dispatch({ type: 'toggleExplorer' })}
            className="w-5 h-5 cursor-pointer hover:opacity-70"
          />
          <IoAddOutline
            title="New chapter"
            onClick={newFile}
            className={classNames({
              'w-5 h-5': true,
              'cursor-pointer hover:opacity-70': state.dir,
              'cursor-not-allowed opacity-30': !state.dir,
            })}
          />
        </section>
        <section className="z-0 flex items-center justify-center space-x-4">
          <IoShareOutline className="w-5 h-5 cursor-pointer hover:opacity-70" />
        </section>
      </nav>
      <section className="flex-1 overflow-auto">
        <Mirror state={state} dispatch={dispatch} />
      </section>
    </div>
  );
};

export default Editor;
