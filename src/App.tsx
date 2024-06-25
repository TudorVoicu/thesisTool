import { FilesProvider } from './FilesContext'; // Adjust the import path as necessary
// import Upload from './components/UploadArea/Upload';
import FileList from './components/FileList/FileList';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import './App.css';
import ThreeCanvas from './components/Canvas/Canvas';

const App = () => {
  return (
    <FilesProvider> {/* Wrap the component tree that needs access to the files context */}
      <PanelGroup direction="horizontal" style={{width: '100vw', display: 'flex' }}>
        <Panel defaultSize={15} minSize={5} className="upload-area" style={{ overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* <Upload /> Assuming Upload component does not need to scroll */}
            <FileList /> {/* FileList will have the scrolling capability if it overflows */}
        </Panel>
        <PanelResizeHandle className="panel-resize-handle" />
        <Panel defaultSize={85} minSize={20} style={{ display: 'flex', flexDirection: 'column' }}>
            <ThreeCanvas />
        </Panel>
    </PanelGroup>
    </FilesProvider>
  );
};

export default App;