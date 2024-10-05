import { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useFiles } from '../../FilesContext';
import SingleScene from './SingleScene';
import CombinedStreamlinesScene from './CombinedStreamlinesScene';
import SynchronizedOrbitControls from './SynchronizedOrbitControls';

const ThreeCanvas = () => {
  const { fileGroups, cameraState, allInOneScene, coloringFiles, center, toggleCenter, updateCameraPosition } = useFiles();

  const controls = useRef<any>(null);

  useEffect(() => {
    if (controls.current) {
      const handleChange = () => {
        if(!controls.current)  return;
        const { x, y, z } = controls.current.object.position;
        updateCameraPosition({ position: [x, y, z] });
      };
      controls.current.addEventListener('change', handleChange);
  
      return () => {
        if (controls.current) {
          controls.current.removeEventListener('change', handleChange);
        }
      };
    }
  }, [updateCameraPosition, cameraState.position]); 
  
  //consider removing this
  useEffect(() => {
    if(controls.current)
      if(toggleCenter && center){
        controls.current.target.set(center[0], center[1], center[2]);
        controls.current.update();
      } else {
        controls.current.target.set(0, 0, 0);
        controls.current.update();
      }
  }, [toggleCenter]);
  return (
    <div className="canvasContainer" style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
      {allInOneScene? (<>
        <Canvas camera={{ position: [cameraState.position[0], cameraState.position[1], cameraState.position[2] - 150] }}>
            <ambientLight intensity={0.5} />
            <CombinedStreamlinesScene />
            <OrbitControls ref={controls} enableDamping={false}/>
          </Canvas>
        </>) : (<>
          {fileGroups.map((group, index) => (
            <div key={index} style={{ flex: 1, minWidth: 0 }}>
              <Canvas camera={{ position: [cameraState.position[0], cameraState.position[1], cameraState.position[2] + 150] }}>
                <ambientLight intensity={0.5} />
                {index < 2 ? (
                  <>
                    <SingleScene tckFiles={group.tckFiles} mapping={coloringFiles?.mapping.map(subArray => subArray[index])} distances={coloringFiles?.distances[index]}/>
                  </>
                ) : (<>
                    <SingleScene tckFiles={group.tckFiles}/>
                </>)}
                
                <SynchronizedOrbitControls controlsRef={controls}/>
              </Canvas>
            </div>
          ))}
        </>)}
    </div>
  );
};

export default ThreeCanvas;