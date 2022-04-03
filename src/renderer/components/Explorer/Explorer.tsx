/* eslint-disable react/jsx-props-no-spreading */
import classNames from 'classnames';
import {
  IoCreateOutline,
  IoFolderOpenOutline,
  IoSettingsOutline,
  IoShareOutline,
  IoTrashOutline,
} from 'react-icons/io5';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DraggableProvided,
  DroppableStateSnapshot,
  DroppableProvided,
  DraggableStateSnapshot,
  DropResult,
} from 'react-beautiful-dnd';

import { AppStateProps } from 'renderer/state/reducer';
import { ConfigKey, DocFile, initialState } from 'renderer/state/AppState';
import { useEffect } from 'react';

const Explorer = (props: AppStateProps) => {
  const { state, dispatch } = props;

  const chooseFile = async (dir: string, filename: string) => {
    const doc = await window.ipcAPI?.loadFile(dir, filename);
    if (doc) {
      dispatch({ type: 'initDoc', doc });
    }
  };

  const reloadDoc = (dir: string, inputFiles: string[]) => {
    if (inputFiles.length) {
      chooseFile(dir, inputFiles[0]);
    } else {
      dispatch({
        type: 'initDoc',
        doc: {
          ...initialState.doc,
          md: 'You do not any files in the folder yet. **Create** a new one using the + button!',
        },
      });
    }
  };

  const chooseDir = async () => {
    // eslint-disable-next-line prefer-const
    let { dir, filenames } = (await window.ipcAPI?.openDir()) || {};
    if (dir) {
      const config = (await window.ipcAPI?.loadConfig(dir)) || {};
      let { inputFiles } = config;

      // Load files
      inputFiles = (inputFiles as string[]) || filenames;
      const docFiles = (await window.ipcAPI?.loadFiles(dir, inputFiles)) || [];

      // Init state
      dispatch({ type: 'initFiles', dir, files: docFiles });
      dispatch({
        type: 'initConfig',
        config: { ...config, inputFiles, currentDir: dir },
      });
      if (config.inputFiles !== inputFiles) {
        dispatch({
          type: 'updateConfig',
          config: {
            [ConfigKey.currentDir]: dir,
            [ConfigKey.inputFiles]: inputFiles,
          },
        });
      }

      // Reload doc if needed
      reloadDoc(dir, inputFiles);
    }
  };

  const renameFile = async (dir: string, filename: string) => {
    const newFilename = await window.ipcAPI?.renameFile(dir, filename);
    if (!newFilename || !dir) {
      return;
    }

    // Load files
    let { inputFiles } = state.config;
    inputFiles = inputFiles as string[];
    const currentIndex = inputFiles.indexOf(filename);
    inputFiles.splice(currentIndex, 1, newFilename);
    const files = (await window.ipcAPI?.loadFiles(dir, inputFiles)) || [];

    // Update state
    dispatch({ type: 'initFiles', dir, files });
    dispatch({
      type: 'updateConfig',
      config: {
        [ConfigKey.currentDir]: dir,
        [ConfigKey.inputFiles]: inputFiles,
      },
    });

    // Reload doc if needed
    if (filename === state.doc.fileName) {
      chooseFile(dir, newFilename);
    }
  };

  const deleteFile = async (dir: string, filename: string) => {
    const deleted = await window.ipcAPI?.deleteFile(dir, filename);
    if (!deleted) {
      return;
    }

    // Update files
    let { inputFiles } = state.config;
    inputFiles = inputFiles as string[];
    const currentIndex = inputFiles.indexOf(filename);
    inputFiles.splice(currentIndex, 1);
    const files = (await window.ipcAPI?.loadFiles(dir, inputFiles)) || [];

    // Set states
    dispatch({ type: 'initFiles', dir, files });
    dispatch({
      type: 'updateConfig',
      config: {
        [ConfigKey.currentDir]: dir,
        [ConfigKey.inputFiles]: inputFiles,
      },
    });

    // Reload doc if needed
    if (filename === state.doc.fileName) {
      reloadDoc(dir, inputFiles);
    }
  };

  const reorderFiles = (
    list: DocFile[],
    startIndex: number,
    endIndex: number
  ): DocFile[] => {
    const result = [...list];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const onDragEnd = async (result: DropResult) => {
    if (
      result.destination &&
      result.source.index !== result.destination.index
    ) {
      const [from, to] = [result.source.index, result.destination.index];
      const files = reorderFiles(state.files, from, to);
      const inputFiles = files.map((f) => f.name);

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
    window.ipcAPI?.on.openDir(chooseDir);
  });

  return (
    <div
      className={classNames({
        'flex flex-col w-64 transition-all duration-300 overflow-x-hidden overflow-y-auto bg-local bg-gradient-to-t from-gray-100 to-gray-200':
          true,
        'w-0': !state.explorer,
      })}
    >
      <nav className="sticky top-0 z-10 flex flex-col text-gray-500">
        <section className="flex items-center justify-between flex-1 p-4 bg-gray-200">
          <section className="flex items-center justify-center space-x-4">
            <IoFolderOpenOutline
              title="Open book folder"
              onClick={chooseDir}
              className="w-5 h-5 cursor-pointer hover:opacity-100 opacity-70"
            />
            <IoSettingsOutline
              title="Book config"
              className={classNames({
                'w-5 h-5 opacity-70': true,
                'cursor-pointer hover:opacity-100': state.dir,
                'cursor-not-allowed opacity-10': !state.dir,
              })}
              onClick={() => state.dir && dispatch({ type: 'toggleConfig' })}
            />
          </section>
          <section>
            <IoShareOutline
              title="Export book"
              className={classNames({
                'w-5 h-5 opacity-70': true,
                'cursor-pointer hover:opacity-100':
                  state.files && state.files.length,
                'cursor-not-allowed opacity-10': !(
                  state.files && state.files.length
                ),
              })}
              onClick={() => window.ipcAPI?.exportBook(state.dir)}
            />
          </section>
        </section>
        <section className="h-4 bg-gradient-to-b from-gray-200 to-transparent" />
      </nav>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="explorer">
          {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={classNames({
                'flex-1 p-2 space-y-2 relative': true,
                'opacity-50': snapshot.isDraggingOver,
              })}
            >
              {state.files &&
                state.files.map((file, index) => (
                  <Draggable
                    key={file.name}
                    draggableId={file.name}
                    index={index}
                  >
                    {(
                      provided_: DraggableProvided,
                      snapshot_: DraggableStateSnapshot
                    ) => (
                      <div
                        ref={provided_.innerRef}
                        {...provided_.draggableProps}
                        {...provided_.dragHandleProps}
                        className={classNames({
                          'rounded border hover:shadow-lg transition-all cursor-pointer':
                            true,
                          'bg-blue-300 border-blue-400': snapshot_.isDragging,
                          'text-white bg-blue-500 border-none':
                            file.name === state.doc.fileName,
                          'border-gray-300 hover:opacity-70':
                            file.name !== state.doc.fileName,
                        })}
                      >
                        <div
                          key={file.name}
                          role="button"
                          tabIndex={0}
                          onClick={() => chooseFile(state.dir, file.name)}
                          onDoubleClick={() => renameFile(state.dir, file.name)}
                          onKeyPress={() => chooseFile(state.dir, file.name)}
                          className="flex flex-col items-stretch justify-between h-32 p-4 text-xs w-60"
                        >
                          <section className="space-y-1">
                            <h1 className="font-semibold">{file.name}</h1>
                            <p>{file.body}</p>
                          </section>
                          <span className="flex items-center justify-between opacity-70">
                            <span>
                              {file.count} word
                              {file.count === '1' ? '' : 's'}
                            </span>
                            <span className="flex items-center justify-end flex-1 space-x-2 transition-opacity duration-300 opacity-0 hover:opacity-100">
                              <IoTrashOutline
                                className="w-4 h-4 transition-opacity duration-300 hover:opacity-70"
                                title="Delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFile(state.dir, file.name);
                                }}
                              />
                              <IoCreateOutline
                                className="w-4 h-4 transition-opacity duration-300 hover:opacity-70"
                                title="Rename"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  renameFile(state.dir, file.name);
                                }}
                              />
                            </span>
                          </span>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Explorer;
