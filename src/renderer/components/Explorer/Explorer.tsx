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
import { ConfigKey, DocFile } from 'renderer/state/AppState';
import { useEffect } from 'react';

const Explorer = (props: AppStateProps) => {
  const { state, dispatch } = props;

  const chooseDir = async () => {
    // eslint-disable-next-line prefer-const
    let { dir, filenames } = (await window.ipcAPI?.openDir()) || {};
    if (dir) {
      const conf = (await window.ipcAPI?.loadConfig(dir)) || {};
      let { mdFiles, bookFilename } = conf;

      // Set default values
      mdFiles = (mdFiles as string[]) || filenames;
      bookFilename = bookFilename || 'my-book';
      dispatch({
        type: 'updateConfig',
        key: ConfigKey.mdFiles,
        value: mdFiles,
      });
      dispatch({
        type: 'updateConfig',
        key: ConfigKey.bookFilename,
        value: bookFilename,
      });

      // Load chapters
      dispatch({
        type: 'initConfig',
        config: { ...conf, mdFiles, bookFilename },
      });
      const docFiles = (await window.ipcAPI?.loadFiles(dir, mdFiles)) || [];
      dispatch({ type: 'initFiles', dir, files: docFiles });
    }
  };

  const chooseFile = async (filename: string) => {
    const doc = await window.ipcAPI?.loadFile(state.dir, filename);
    if (doc) {
      dispatch({ type: 'initDoc', doc });
    }
  };

  const renameFile = async (filename: string) => {
    const newFilename = await window.ipcAPI?.renameFile(state.dir, filename);
    if (!newFilename || !state.dir) {
      return;
    }

    let { mdFiles } = state.config;
    mdFiles = mdFiles as string[];
    const currentIndex = mdFiles.indexOf(filename);
    mdFiles.splice(currentIndex, 1, newFilename);

    const files = (await window.ipcAPI?.loadFiles(state.dir, mdFiles)) || [];
    dispatch({ type: 'initFiles', dir: state.dir, files });
    dispatch({
      type: 'updateConfig',
      key: ConfigKey.mdFiles,
      value: mdFiles,
    });
  };

  const deleteFile = async (filename: string) => {
    const deleted = await window.ipcAPI?.deleteFile(state.dir, filename);
    if (!deleted) {
      return;
    }

    let { mdFiles } = state.config;
    mdFiles = mdFiles as string[];
    const currentIndex = mdFiles.indexOf(filename);
    mdFiles.splice(currentIndex, 1);

    const files = (await window.ipcAPI?.loadFiles(state.dir, mdFiles)) || [];
    dispatch({ type: 'initFiles', dir: state.dir, files });
    dispatch({ type: 'updateConfig', key: ConfigKey.mdFiles, value: mdFiles });
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
      const mdFiles = files.map((f) => f.name);

      dispatch({ type: 'initFiles', dir: state.dir, files });
      dispatch({
        type: 'updateConfig',
        key: ConfigKey.mdFiles,
        value: mdFiles,
      });
    }
  };

  useEffect(() => {
    window.ipcAPI?.on.openDir(chooseDir);
  });

  return (
    <div
      className={classNames({
        'flex flex-col w-64 bg-gray-100 transition-all duration-300': true,
        'w-0': !state.explorer,
      })}
    >
      <nav className="flex items-center justify-between p-4 text-gray-500">
        <section className="flex items-center justify-center space-x-4">
          <IoFolderOpenOutline
            title="Open book folder"
            onClick={chooseDir}
            className="w-5 h-5 cursor-pointer hover:opacity-70"
          />
          <IoSettingsOutline
            title="Book config"
            className={classNames({
              'w-5 h-5': true,
              'cursor-pointer hover:opacity-70': state.dir,
              'cursor-not-allowed opacity-30': !state.dir,
            })}
            onClick={() => dispatch({ type: 'toggleConfig' })}
          />
        </section>
        <section>
          <IoShareOutline className="w-5 h-5 cursor-pointer hover:opacity-70" />
        </section>
      </nav>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="explorer">
          {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={classNames({
                'flex-1 p-2 space-y-2 overflow-y-auto overflow-x-hidden': true,
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
                          'bg-blue-300 rounded': snapshot_.isDragging,
                        })}
                      >
                        <div
                          key={file.name}
                          role="button"
                          tabIndex={0}
                          onClick={() => chooseFile(file.name)}
                          onDoubleClick={() => renameFile(file.name)}
                          onKeyPress={() => chooseFile(file.name)}
                          className={classNames({
                            'h-28 w-60 p-4 flex flex-col justify-between transition-all items-stretch rounded text-xs cursor-pointer':
                              true,
                            'text-white bg-blue-500':
                              file.name === state.doc.fileName,
                            'hover:bg-gray-200':
                              file.name !== state.doc.fileName,
                          })}
                        >
                          <section className="space-y-1">
                            <h1 className="font-semibold">{file.name}</h1>
                            <p>{file.body}</p>
                          </section>
                          <span className="flex items-center justify-start mt-2 space-x-2 transition-opacity duration-300 opacity-0 hover:opacity-100">
                            <IoTrashOutline
                              className="w-4 h-4 transition-opacity hover:opacity-70"
                              title="Delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFile(file.name);
                              }}
                            />
                            <IoCreateOutline
                              className="w-4 h-4 transition-opacity hover:opacity-70"
                              title="Rename"
                              onClick={(e) => {
                                e.stopPropagation();
                                renameFile(file.name);
                              }}
                            />
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
