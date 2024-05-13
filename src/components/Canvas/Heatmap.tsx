import React, { useEffect, useState, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3, Matrix4 } from 'three';
import { useFiles } from '../../FilesContext';
import StreamlinesProps from "../../FilesContext";
import { interpolateStreamlines, InterpolatedTckFile } from '../interpolationUtils';
import RenderHeatmap from './RenderHeatmap'


 export interface ProjectedPoints{
  coordinates: number[][][],
  name:string
}

// Function to project a point onto a plane and then flatten to 2D
const projectPointOntoCameraViewPlane = (point:any, camera:any) => {
    // Create a new Matrix4 and invert it to get the inverse of the camera's world matrix
    const inverseCameraMatrix = new Matrix4().copy(camera.matrixWorld).invert();
    
    // Transform point to camera space
    const pointInCameraSpace = point.clone().applyMatrix4(inverseCameraMatrix);
    
    // Project onto camera's view plane (effectively the local xy-plane in camera space)
    const projectedPoint = new Vector3(pointInCameraSpace.x, pointInCameraSpace.y, 0);
    
    // If needed, transform back to world space (optional, likely not needed for 2D visualization)
    // const pointInWorldSpace = projectedPoint.clone().applyMatrix4(camera.matrixWorld);
    
    // Return the 2D coordinates (in camera space, for simplicity)
    return [projectedPoint.x, projectedPoint.y];
  };

const Heatmap: React.FC<StreamlinesProps> = ({ tckFiles }) => {
  const { heatmap } = useFiles();
  const { camera } = useThree();
  const [interpolatedStreamlines, setInterpolatedStreamlines] = useState<InterpolatedTckFile[] | null>(null)
  const [projectedCoords, setProjectedCoords] = useState<ProjectedPoints[] | null>(null); // Adjusted type for 2D coordinates
  const cleanupRef = useRef<(() => void) | null>(null);
  const [key, setKey] = useState<number>(0);

  useEffect(() => {
    if (heatmap) {
      const x = tckFiles.map(file => interpolateStreamlines(file, 1));
      
      setInterpolatedStreamlines(x);
      setKey(key=>key+1);
    }
  }, []);

  useEffect(() => {
    // Function to be called when the mouse is released
      const handleMouseUp = () => {
          // Implement re-projection and re-rendering logic here
          console.log("Camera drag ended, updating visualization...");
          setKey(key=>key+1);
      };

      // Add event listener
      window.addEventListener('mouseup', handleMouseUp);

      // Remove event listener on cleanup
      return () => {
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [camera])

  useEffect(() => {
    if (!interpolatedStreamlines || !heatmap) return;

    // Adjusted logic to use the new projection function
    const projectedStreamlines = interpolatedStreamlines.map((file) => {
      const projectedCoordinates = file.interpolatedCoordinates.map((streamline) =>
        streamline.map((point) => {
          const pointVector = new Vector3(...point);
          return projectPointOntoCameraViewPlane(pointVector, camera);
        })
      );

      return {
        ...file,
        projectedCoordinates,
      };
    });

    setProjectedCoords(projectedStreamlines.map(proj => ({
      coordinates: proj.projectedCoordinates,
      name: proj.name,
    })));
  }, [key]);

  // useEffect(() => {
  //   console.log("haery");
  // })

  useEffect(() => {
    console.log(projectedCoords);
    if (cleanupRef.current) {
      cleanupRef.current(); // Cleanup previous visualization if exists
  }
  }, [projectedCoords]);

//fix pls
  return (
    <>
      {projectedCoords ? (
        <>
          {projectedCoords && (
                <RenderHeatmap
                    projectedCoordinates={projectedCoords}
                    onRender={(cleanup) => {
                        cleanupRef.current = cleanup; // Store the cleanup function
                    }}
                />
            )}
        </>
      ) : (
        <></>
      )}
    </>
  );
}

export default Heatmap;