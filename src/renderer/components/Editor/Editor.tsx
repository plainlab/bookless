/* eslint-disable no-nested-ternary */
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import {
  IoAddOutline,
  IoBookmarkOutline,
  IoCodeOutline,
  IoEyeOutline,
  IoShareOutline,
} from 'react-icons/io5';
import { ConfigKey } from 'renderer/state/AppState';
import { AppStateProps } from 'renderer/state/reducer';
import Mirror from './Mirror';
import Preview from './Preview';

const Editor = (props: AppStateProps) => {
  const { state, dispatch } = props;
  const [preview, setPreview] = useState(false);

  const newFile = async () => {
    if (!state.dir) {
      return;
    }

    const filename = await window.ipcAPI?.newFile(state.dir);
    if (filename) {
      let { inputFiles } = state.config;
      inputFiles = inputFiles as string[];
      if (state.doc.fileName) {
        const currentIndex = inputFiles.indexOf(state.doc.fileName);
        inputFiles.splice(currentIndex + 1, 0, filename);
      } else {
        inputFiles.push(filename);
      }

      const files =
        (await window.ipcAPI?.loadFiles(state.dir, inputFiles)) || [];

      dispatch({ type: 'initFiles', dir: state.dir, files });
      dispatch({
        type: 'updateConfig',
        config: {
          [ConfigKey.currentDir]: state.dir,
          [ConfigKey.inputFiles]: inputFiles,
        },
      });
    }
  };

  useEffect(() => {
    window.ipcAPI?.on.newFile(newFile);
  });

  return (
    <div className="relative flex flex-col flex-1">
      <nav
        className={classNames({
          'absolute w-full z-30 flex flex-col duration-300 transition-opacity text-gray-500':
            true,
          'opacity-0 hover:opacity-100': !state.explorer,
        })}
        onDoubleClick={() => state.dir && dispatch({ type: 'toggleExplorer' })}
      >
        <section className="flex items-center justify-between flex-1 px-4 pt-4 bg-white">
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
            {preview ? (
              <IoCodeOutline
                title="Edit chapter"
                className={classNames({
                  'w-5 h-5 opacity-70': true,
                  'cursor-pointer hover:opacity-100': state.doc.filePath,
                  'cursor-not-allowed opacity-10': !state.doc.filePath,
                })}
                onClick={() => setPreview(false)}
              />
            ) : (
              <IoEyeOutline
                title="Preview chapter"
                className={classNames({
                  'w-5 h-5 opacity-70': true,
                  'cursor-pointer hover:opacity-100': state.doc.filePath,
                  'cursor-not-allowed opacity-10': !state.doc.filePath,
                })}
                onClick={() => setPreview(true)}
              />
            )}
            <IoShareOutline
              title="Export chapter"
              className={classNames({
                'w-5 h-5 opacity-70': true,
                'cursor-pointer hover:opacity-100': state.doc.filePath,
                'cursor-not-allowed opacity-10': !state.doc.filePath,
              })}
              onClick={() =>
                state.doc.filePath &&
                state.doc.fileName &&
                window.ipcAPI?.exportChapter(state.dir, state.doc.fileName)
              }
            />
          </section>
        </section>
        <section className="h-4 bg-gradient-to-b from-white to-transparent" />
      </nav>
      <section className="relative z-20 flex-1 bg-white">
        {state.dir ? (
          preview ? (
            <Preview state={state} dispatch={dispatch} />
          ) : (
            <Mirror state={state} dispatch={dispatch} />
          )
        ) : (
          <div className="px-10 mt-16 text-base">
            Choose a folder to get started by clicking the open icon on the top
            left!
          </div>
        )}
      </section>
    </div>
  );
};

export default Editor;
