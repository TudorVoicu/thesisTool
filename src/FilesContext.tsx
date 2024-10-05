//FileContext.tsx
import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { Flow } from 'three/examples/jsm/Addons.js';

interface TckFile {
  name: string;
  coordinates: number[][][];
  isVisible: boolean;
  color: string;
  opacity: number;
  mapping :number[];
  distance : number[][] | [];
  colorDiff: number[];
  counterCoords: number[][] | [];
}

interface FileGroup {
  niiFile?: File;
  tckFiles: TckFile[];
  apiResponse?: any;
}

interface StreamlinesProps {
  tckFiles: TckFile[];
  mapping?: number[];
  distances?: number[][];
  colorDiff?: number[];
}

interface CameraState {
  position: [number, number, number];
  rotation?: [number, number, number];
  zoom: number;
  synchronized: boolean;
}

interface ColoringFiles {
  mapping: number[][];
  distances: number[][][];
}

export default StreamlinesProps;

interface FilesContextType {
  coloringFiles: ColoringFiles | undefined;
  changeColoringFiles: (mapping: number[][], distances: number[][][]) => void;
  fileGroups: FileGroup[];
  addFileGroup: (tckFiles: TckFile[], niiFile?: File, apiResponse?: any) => void;
  emptyFileGroup: () => void;
  // Updated methods for handling TckFile properties
  toggleTckFileVisibility: (groupIndex: number, fileIndex: number) => void;
  changeTckFileColor: (groupIndex: number, fileIndex: number, color: string) => void;
  changeTckFileOpacity: (groupIndex: number, fileIndex: number, opacity: number) => void;
  cameraState: CameraState;
  synchronizeCameras: (synchronize: boolean) => void;
  updateCameraPosition: (cameraStateUpdate: { 
    position: [number, number, number]; 
    rotation?: [number, number, number]; 
    zoom?: number;
  }) => void;
  allInOneScene: boolean; // New state for displaying all in one scene
  toggleAllInOneScene: () => void; // Method to toggle the allInOneScene state
  heatmap: boolean;
  makeHeatmap: () => void;
  streamlines: boolean;
  makeStreamlines: () => void;
  cellSize:number;
  gridSize:number;
  setCellSize:Dispatch<SetStateAction<number>>;
  setGridSize:Dispatch<SetStateAction<number>>;
  center: [number, number, number] | null;
  setACenter: (x:number, y:number, z:number) => void;
  toggleCenter:boolean;
  setToggleCenter:Dispatch<SetStateAction<boolean>>;
  maxColorDistance:number;
  setMaxColorDistance:Dispatch<SetStateAction<number>>;
  viewDistances: boolean;
  viewFlow:boolean;
  toggleViewDistances: () => void;
  toggleViewFlow: () => void;
  viewDirColoring:boolean;
  toggleViewDirColoring: () => void;
}

const FilesContext = createContext<FilesContextType | undefined>(undefined);

export const FilesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  const [cameraState, setCameraState] = useState<CameraState>({
    position: [0, 0, 50], 
    synchronized: true,
    zoom: 1,
    rotation: [0,0,0],
  });

  const [allInOneScene, setAllInOneScene] = useState<boolean>(false);

  const toggleAllInOneScene = () => {
    setAllInOneScene(prevState => !prevState);
  };

  const [viewDistances, setViewDistances] = useState<boolean>(false);
  const [viewFlow, setViewFlow] = useState<boolean>(false);
  const [viewDirColoring, setViewDirColoring] = useState<boolean>(false);

  const toggleViewDirColoring = () => {
    setViewDirColoring(!viewDirColoring)
    setViewFlow(false)
    setViewDistances(false)
  }

  const toggleViewDistances = () => {
    setViewDistances(!viewDistances);
    setViewFlow(false);
    setViewDirColoring(false);
  }

  const toggleViewFlow = () => {
    setViewFlow(!viewFlow);
    setViewDistances(false);
    setViewDirColoring(false);
  }

  const [cellSize, setCellSize] = useState<number>(0.05);
  const [gridSize, setGridSize] = useState<number>(200);

  const [heatmap, setHeatmap] = useState<boolean>(false);

  const makeHeatmap = () => {
    setHeatmap(prevState => !prevState);
  }

  const [maxColorDistance, setMaxColorDistance] = useState<number>(20);
  const [toggleCenter, setToggleCenter] = useState<boolean>(false);
  const [center, setCenter] = useState<[number, number, number] | null>(null);

  const setACenter = (x:number, y:number, z:number) => {
    setCenter([x, y, z]);
  }
  
  const [streamlines, setStreamlines] = useState<boolean>(true);

  const makeStreamlines = () => {
    setStreamlines(prevState => !prevState);
  }

  const synchronizeCameras = (synchronize : boolean) => {
    setCameraState(prevState => ({ ...prevState, synchronized: synchronize }));
  };
  
  const updateCameraPosition = (cameraStateUpdate: { position: [number, number, number], rotation?: [number, number, number], zoom?: number }) => {
  if (cameraState.synchronized) {
    setCameraState(prevState => ({
      ...prevState,
      ...cameraStateUpdate
    }));
  }
};

  const [coloringFiles, setColoringFiles] = useState<ColoringFiles>();

  const changeColoringFiles = (mapping:number[][], distances:number[][][]) => {
    setColoringFiles({mapping, distances})
  }

  const [fileGroups, setFileGroups] = useState<FileGroup[]>([]);

  const addFileGroup = (tckFiles: TckFile[] , niiFile?: File, apiResponse?: any) => {
    const newGroup = { niiFile, tckFiles, apiResponse };
    setFileGroups(prevGroups => [...prevGroups, newGroup]);
  };

  const emptyFileGroup = () => {
    setFileGroups([]);
  }

  const toggleTckFileVisibility = (groupIndex: number, fileIndex: number) => {
    setFileGroups(prevGroups =>
      prevGroups.map((group, i) =>
        i === groupIndex ? {
          ...group,
          tckFiles: group.tckFiles.map((file, j) =>
            j === fileIndex ? { ...file, isVisible: !file.isVisible } : file
          )
        } : group
      )
    );
  };

  const changeTckFileColor = (groupIndex: number, fileIndex: number, color: string) => {
    setFileGroups(prevGroups =>
      prevGroups.map((group, i) =>
        i === groupIndex ? {
          ...group,
          tckFiles: group.tckFiles.map((file, j) =>
            j === fileIndex ? { ...file, color } : file
          )
        } : group
      )
    );
  };

  const changeTckFileOpacity = (groupIndex: number, fileIndex: number, opacity: number) => {
    setFileGroups(prevGroups =>
      prevGroups.map((group, i) =>
        i === groupIndex ? {
          ...group,
          tckFiles: group.tckFiles.map((file, j) =>
            j === fileIndex ? { ...file, opacity } : file
          )
        } : group
      )
    );
  };

  return (
    <FilesContext.Provider value={{
      fileGroups,
      addFileGroup,
      toggleTckFileVisibility,
      changeTckFileColor,
      changeTckFileOpacity,
      cameraState,
      synchronizeCameras,
      updateCameraPosition,
      toggleAllInOneScene,
      allInOneScene,
      heatmap,
      makeHeatmap,
      makeStreamlines,
      streamlines,
      cellSize,
      gridSize,
      setCellSize,
      setGridSize,
      changeColoringFiles,
      coloringFiles,
      center,
      setACenter,
      setToggleCenter,
      toggleCenter,
      setMaxColorDistance,
      maxColorDistance,
      emptyFileGroup,
      toggleViewDistances,
      toggleViewFlow,
      toggleViewDirColoring,
      viewDistances,
      viewFlow,
      viewDirColoring
    }}>
      {children}
    </FilesContext.Provider>
  );
};

export const useFiles = () => {
  const context = useContext(FilesContext);
  if (!context) throw new Error('useFiles must be used within a FilesProvider');
  return context;
};