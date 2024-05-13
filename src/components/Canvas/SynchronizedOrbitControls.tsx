// SynchronizedOrbitControls.jsx
//archived
import React from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useFiles } from '../../FilesContext';

const SynchronizedOrbitControls: React.FC = () => {
  const { camera, gl } = useThree();
  const { updateCameraPosition, cameraState } = useFiles();

  const onCameraChange = React.useCallback(() => {
    // Update global camera state only when synchronization is enabled
    if (cameraState.synchronized) {
      updateCameraPosition({
        position: [camera.position.x, camera.position.y, camera.position.z],
        rotation: [camera.rotation.x, camera.rotation.y, camera.rotation.z],
        zoom: 'fov' in camera ? camera.fov : cameraState.zoom, // Adjust based on camera type
      });
    }
  }, [camera, updateCameraPosition, cameraState.synchronized]);

  return <OrbitControls args={[camera, gl.domElement]} onChange={onCameraChange} />;
};

export default SynchronizedOrbitControls;