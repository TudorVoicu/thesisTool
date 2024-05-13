import React from 'react';
import { useFiles } from '../../FilesContext';
import Streamlines from './Streamlines';
import StreamlinesProps from "../../FilesContext";
import Heatmap from './Heatmap';
import { useThree } from '@react-three/fiber';


//import HeatmapProjection from './HeatmapProjection';


// This component will render all streamline bundles in a single scene
const CombinedStreamlinesScene: React.FC = () => {
  const { fileGroups, heatmap, streamlines, coloringFiles } = useFiles();
  const { scene } = useThree();

  // Combine all tckFiles from each group into a single array
  const combinedTckFiles = fileGroups.reduce<StreamlinesProps["tckFiles"]>((acc, group) => {
    return acc.concat(group.tckFiles);
  }, []);

  React.useEffect(() => {
    if (!heatmap) {
      // Attempt to find a PlaneHelper object by type
      const planeHelper = scene.children.find(child => child.type === "PlaneHelper");
      if (planeHelper) {
        scene.remove(planeHelper);
      }
    }
  }, [heatmap, scene]);

    return (
      <>
        {heatmap && (<>
          <Heatmap tckFiles={combinedTckFiles}/>
        </>)}
          {streamlines && (
            <>
              {(fileGroups.length === 2 && fileGroups[0].tckFiles.length === 1 && fileGroups[1].tckFiles.length === 1) ? (<>
                {fileGroups.map((group, index) => (
                  <>
                    <Streamlines tckFiles={group.tckFiles} mapping={coloringFiles?.mapping.map(subArray => subArray[index])} distances={coloringFiles?.distances[index]}/>
                  </>
                ))}
              </>) : (<>
                <Streamlines tckFiles={combinedTckFiles} />
              </>)}
            </>
          )}        
      </>
    );
};

export default CombinedStreamlinesScene;