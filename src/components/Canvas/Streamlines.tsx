import React from 'react';
import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, Line } from 'three';
import StreamlinesProps from "../../FilesContext";
import { extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useFiles } from '../../FilesContext';
import { ColorUtils } from './ColorUtils';

const DistanceBasedShaderMaterial = shaderMaterial(
  // Uniforms
  {
    colorStart: new THREE.Color('red'),
    colorEnd: new THREE.Color('blue'),
    maxDist: 50,
    opacity: 1.0,
  },
  // Vertex Shader
  `attribute float distance;
   varying float vDistance;
   void main() {
     vDistance = distance;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  // Fragment Shader
  `uniform vec3 colorStart;
   uniform vec3 colorEnd;
   uniform float maxDist;
   uniform float opacity;
   varying float vDistance;
   void main() {
     float distanceRatio = clamp(vDistance / maxDist, 0.0, 1.0);
     vec3 color = mix(colorStart, colorEnd, distanceRatio);
     gl_FragColor = vec4(color, opacity);
   }`
);

// Make sure to extend drei with the custom shader material
extend({ DistanceBasedShaderMaterial });

const Streamline: React.FC<{ points: number[][]; opacity: number; visibility: boolean; color: string }> = ({ points, opacity, visibility, color }) => {
  
  const geometry = useMemo(() => {
    const vertices = points.flat();
    return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(vertices, 3));
  }, [points]);

  const material = useMemo(() => {
    return new LineBasicMaterial({ color, opacity, transparent: true, visible: visibility });
  }, [color, opacity, visibility]);

  return <primitive object={new Line(geometry, material)} />;
};

const StreamlineColor: React.FC<{ points: number[][]; opacity: number; visibility: boolean; distances: number[]; colorStart: string; colorEnd:string, maxColor:number }> = ({ points, opacity, visibility, distances, colorStart, colorEnd, maxColor }) => {
  const geometry = useMemo(() => {
    const vertices = points.flat();
    const distanceAttr = []; // Calculate per-segment distances for shader
    for (let i = 0; i < distances.length; i++) {
      distanceAttr.push(distances[i]); // Push twice for start and end of each segment
    }
    const geom = new BufferGeometry().setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geom.setAttribute('distance', new Float32BufferAttribute(distanceAttr, 1)); // Add distance as an attribute
    return geom;
  }, [points, distances]);

  return (
    <primitive object={new Line(geometry)}>
      <distanceBasedShaderMaterial
        attach="material"
        colorStart={new THREE.Color(colorStart)}
        colorEnd={new THREE.Color(colorEnd)}
        maxDist={maxColor}  
        opacity={opacity}
        transparent={true}
        visible={visibility}
      />
    </primitive>
  );
};

const Streamlines: React.FC<StreamlinesProps> = ({ tckFiles }) => {
  const {maxColorDistance, viewDistances, viewFlow} = useFiles();

  React.useEffect(() => {

    for(let i =0; i<tckFiles.length; i++){
      let count = 0;
      if(tckFiles[i].distance)  for(let j=0; j<tckFiles[i].distance?.length; j++){
        for(let k =0; k<tckFiles[i].distance[j].length; k++){
          if(tckFiles[i].distance[j][k] > 40) count++;
        }
      }
    }
  }, [maxColorDistance])
  

  return (
    <>
      {(viewDistances) ? (<>
        {tckFiles.map((file, fileIndex) =>
        
        file.isVisible ? file.coordinates.map((streamline, streamlineIndex) => (
          <StreamlineColor
            key={`${fileIndex}-${streamlineIndex}`}
            points={streamline}
            distances={file.distance && file.mapping ? file.distance[file.mapping[file.mapping[streamlineIndex]]] : []} // Pass the correct distances array
            opacity={file.opacity}
            visibility={file.isVisible}
            colorStart={file.color}
            colorEnd={ColorUtils.getComplementaryColorHex(file.color)}
            maxColor={maxColorDistance}
          />
          
        )) : null
      )}
      </>) : (<>
        {(viewFlow) ? (<>
          {tckFiles.map((file, fileIndex) =>
        
          file.isVisible ? file.coordinates.map((streamline, streamlineIndex) => (
            <StreamlineColor
              key={`${fileIndex}-${streamlineIndex}`}
              points={streamline}
              distances={file.colorDiff && file.mapping ? file.colorDiff[file.mapping[file.mapping[streamlineIndex]]] : []} // Pass the correct distances array
              opacity={file.opacity}
              visibility={file.isVisible}
              colorStart={file.color}
              colorEnd={ColorUtils.getComplementaryColorHex(file.color)}
              maxColor={maxColorDistance}
            />
            
            )) : null
          )}
        </>) : (<>
          {tckFiles.map((file, fileIndex) =>
            file.isVisible ? file.coordinates.map((streamline, streamlineIndex) => (
              <Streamline
                key={`${fileIndex}-${streamlineIndex}`}
                points={streamline}
                opacity={file.opacity}
                visibility={file.isVisible}
                color={file.color}
              />
            )) : null
          )}
        </>)}
      </>)}
      
    </>
  );
};

export default Streamlines;