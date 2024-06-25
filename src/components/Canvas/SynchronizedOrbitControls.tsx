// SynchronizedOrbitControls.tsx
import React, { useRef, useEffect } from 'react';
import { PerspectiveCamera, OrthographicCamera } from 'three';
import { OrbitControls } from '@react-three/drei';
import { useFiles } from '../../FilesContext';
import { useThree } from '@react-three/fiber';

interface SynchronizedOrbitControlsProps {
  controlsRef: React.MutableRefObject<any>;
}

const SynchronizedOrbitControls : React.FC<SynchronizedOrbitControlsProps> = ({ controlsRef }) => {
  const { updateCameraPosition, cameraState } = useFiles();
  const { camera, gl } = useThree();
  useEffect(() => {
    if (controlsRef.current) {
      const handleChange = () => {
        const { x, y, z } = controlsRef.current.object.position;
        updateCameraPosition({
          position: [x, y, z],
          rotation: [camera.rotation.x, camera.rotation.y, camera.rotation.z],
          zoom: camera instanceof PerspectiveCamera ? camera.fov : camera.zoom, // Check if the camera is Perspective to access fov
        });
      };

      controlsRef.current.addEventListener('change', handleChange);

      return () => {
        if (controlsRef.current) {
          controlsRef.current.removeEventListener('change', handleChange);
        }
      };
    }
  }, [updateCameraPosition, cameraState.synchronized, camera, controlsRef]);

  return <OrbitControls ref={controlsRef} args={[camera, gl.domElement]} enableDamping={false}/>;
};

export default SynchronizedOrbitControls;