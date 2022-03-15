import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { AppState } from 'renderer/state/AppState';
import saveToDiskMiddleware from 'renderer/state/middleware';
import appStateReducer from 'renderer/state/reducer';
import useReducerWithMiddleware from 'renderer/state/reducerWithMiddleware';
import { IpcAPI } from '../../../main/preload';
import ConfigEditor from '../Config/Config';
import Editor from '../Editor/Editor';
import Explorer from '../Explorer/Explorer';
import Sidebar from '../Sidebar/Sidebar';
import './App.css';

const initialState: AppState = {
  dir: '',
  files: [],
  doc: {
    md: '',
    yaml: '',
    bodyMd: '',
    meta: {},
    html: '',
    fileName: 'Untitled',
    filePath: undefined,
  },
  configOpen: false,
  config: {
    bookFilename: '',
    mdFiles: [],
  },
  paginated: false,
  explorer: true,
};

declare global {
  interface Window {
    ipcAPI?: IpcAPI;
  }
}

const Main = () => {
  const [state, dispatch] = useReducerWithMiddleware(
    appStateReducer,
    initialState,
    [],
    [saveToDiskMiddleware]
  );

  return (
    <div className="absolute inset-0 flex overflow-hidden text-sm text-gray-700">
      {state.configOpen ? (
        <ConfigEditor state={state} dispatch={dispatch} />
      ) : (
        <>
          <Explorer state={state} dispatch={dispatch} />
          <Editor state={state} dispatch={dispatch} />
        </>
      )}
      <Sidebar />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
      </Routes>
    </Router>
  );
}
