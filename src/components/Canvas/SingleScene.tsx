// SingleScene.tsx
import React from 'react';
import Streamlines from './Streamlines';
import StreamlinesProps from "../../FilesContext";
import { useFiles } from '../../FilesContext';
import Heatmap from './Heatmap';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';


const SingleScene: React.FC<StreamlinesProps> = ({ tckFiles, mapping, distances }) => {
  const { heatmap, streamlines} = useFiles();
  const { scene } = useThree();
  
  useEffect(() => {
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
          <Heatmap tckFiles={tckFiles}/>
        </>)}
        {streamlines && (<>
          <Streamlines tckFiles={tckFiles} mapping = {mapping} distances = {distances}/>
        </>)}
      </>
    );
  //}
};

export default SingleScene;