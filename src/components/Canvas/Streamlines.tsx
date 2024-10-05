import React, { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, Line } from 'three';
import StreamlinesProps from "../../FilesContext";
import { extend, ReactThreeFiber } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useFiles } from '../../FilesContext';
import { ColorUtils } from './ColorUtils';

const DirectionalColorShaderMaterial = shaderMaterial(
  // Uniforms
  {
    opacity: 1.0,
  },
  // Vertex Shader
  `attribute vec3 previousPosition;
   varying vec3 vDirection;
   void main() {
     vDirection = normalize(position - previousPosition);
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  // Fragment Shader
  `uniform float opacity;
   varying vec3 vDirection;
   void main() {
     vec3 color = abs(vDirection); // Take absolute to handle negative directions
     gl_FragColor = vec4(color, opacity);
   }`
);

// Extend drei with the new shader material
extend({ DirectionalColorShaderMaterial });

const DistanceBasedShaderMaterial = shaderMaterial(
  // Uniforms
  {
    colorStart: new THREE.Color('red'),
    colorEnd: new THREE.Color('blue'),
    maxDist: 20,
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


const FlowShader = shaderMaterial(
  {
    opacity: 1.0,
    deviationFactor: 0.5,
  },
  // Vertex Shader
  `
    attribute float colorDifference;
    attribute vec3 previousPosition;
    varying float vColorDifference;
    varying vec3 vDirection;

    void main() {
      vColorDifference = colorDifference;
      vDirection = normalize(position - previousPosition);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float opacity;
    uniform float deviationFactor;
    varying float vColorDifference;
    varying vec3 vDirection;

    void main() {
      // Map deviationFactor (0 to 1) to sensitivity (10.0 to 0.1)
      float sensitivity = mix(10.0, 0.1, deviationFactor);

      // Compute adjusted opacity
      float adjustedOpacity = 1.0 - pow(1.0 - vColorDifference, sensitivity);

      // Set color based on direction
      vec3 color = abs(vDirection); // Directional coloring

      // Final fragment color
      gl_FragColor = vec4(color, adjustedOpacity * opacity);
    }
  `
);

extend({ FlowShader });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      flowShader: ReactThreeFiber.ShaderMaterialProps & {
        opacity?: number;
        deviationFactor?: number;
        color?: THREE.Color | string;
      };
    }
  }
}
declare global {
  namespace JSX {
    interface IntrinsicElements {
      line_: ReactThreeFiber.Object3DNode<THREE.Line, typeof THREE.Line>;
      // ... other intrinsic elements
    }
  }
}

extend({ Line_: THREE.Line });


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
  // if (!hasDistanceLessThanOne) {
  //   // If none of the distances are less than 1, do not render the component
  //   return null;
  // }
  // console.log(points)
  // console.log(distances)
  const geometry = useMemo(() => {
    const vertices = points.flat();
    const distanceAttr = [];

    // Ensure that distances align with points
    for (let i = 0; i < distances.length; i++) {
      distanceAttr.push(distances[i]);
    }

    const geom = new BufferGeometry().setAttribute(
      'position',
      new Float32BufferAttribute(vertices, 3)
    );
    geom.setAttribute(
      'distance',
      new Float32BufferAttribute(distanceAttr, 1)
    );
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

type SimilarityStreamlineProps = {
  points: number[][];
  colorDifferences: number[]; // Length n - 1
  opacity: number;
  visibility: boolean;
  deviationFactor: number;
};

const SimilarityStreamline: React.FC<SimilarityStreamlineProps> = ({
  points,
  colorDifferences,
  opacity,
  visibility,
  deviationFactor,
}) => {
  const geometry = useMemo(() => {
    const vertices = points.flat();
    const n = points.length;

    let adjustedColorDifferences: number[] = [];

    if (colorDifferences.length === n - 1) {
      // Map segment-based colorDifferences to per-vertex attributes
      for (let i = 0; i < n; i++) {
        if (i === 0) {
          // First vertex: assign the first segment's value
          adjustedColorDifferences.push(colorDifferences[0]);
        } else if (i === n - 1) {
          // Last vertex: assign the last segment's value
          adjustedColorDifferences.push(colorDifferences[n - 2]);
        } else {
          // Intermediate vertices: average adjacent segments
          const average = (colorDifferences[i - 1] + colorDifferences[i]) / 2;
          adjustedColorDifferences.push(average);
        }
      }
    } else {
      console.warn(
        `Attribute lengths mismatch: colorDifferences (${colorDifferences.length}), expected ${n - 1} for points length ${n}`
      );
    }

    // Compute previous positions for direction calculation
    const prevVertices = [...points];

    // Create a pseudo previous point for the first point by extrapolating backwards
    if (points.length > 1) {
      const firstPoint = points[0];
      const secondPoint = points[1];
      const backwardDirection = firstPoint.map(
        (_val, idx) => firstPoint[idx] - (secondPoint[idx] - firstPoint[idx])
      );
      prevVertices.unshift(backwardDirection); // Prepend to the start
    }

    prevVertices.pop(); // Remove the last to match the number of points

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geom.setAttribute('previousPosition', new Float32BufferAttribute(prevVertices.flat(), 3));
    geom.setAttribute(
      'colorDifference',
      new Float32BufferAttribute(adjustedColorDifferences, 1)
    );

    return geom;
  }, [points, colorDifferences]);

  return (
    <primitive object={new Line(geometry)} visible={visibility}>
      <flowShader
        attach="material"
        opacity={opacity}
        deviationFactor={deviationFactor}
        transparent={true}
      />
    </primitive>
  );
};

const DirectionalStreamline: React.FC<{ points: number[][]; opacity: number; visibility: boolean; useDirectionalColor: boolean }> = ({ points, opacity, visibility, useDirectionalColor }) => {
  const geometry = useMemo(() => {
    const vertices = points.flat();
    const prevVertices = [...points]; // Copy points to manipulate for previous positions

    // Create a pseudo previous point for the first point by extrapolating backwards
    if (points.length > 1) {
      const firstPoint = points[0];
      const secondPoint = points[1];
      const backwardDirection = firstPoint.map((_val, idx) => firstPoint[idx] - (secondPoint[idx] - firstPoint[idx]));
      prevVertices.unshift(backwardDirection); // Prepend to the start
    }

    prevVertices.pop(); // Remove the last to match the number of points, if more than 1 point exists

    const geom = new BufferGeometry().setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geom.setAttribute('previousPosition', new Float32BufferAttribute(prevVertices.flat(), 3)); // Previous position attribute
    return geom;
  }, [points]);

  const material = useMemo(() => {
      return new DirectionalColorShaderMaterial({ opacity, transparent: true, visible: visibility });
  }, [opacity, visibility, useDirectionalColor]);

  return <primitive object={new Line(geometry, material)} />;
};

const Streamlines: React.FC<StreamlinesProps> = ({ tckFiles }) => {
  const {maxColorDistance, viewDistances, viewFlow, viewDirColoring} = useFiles();
  const directional = viewDirColoring;
  React.useEffect(() => {

    for(let i =0; i<tckFiles.length; i++){
      let count = 0;
      if(tckFiles[i].distance)  for(let j=0; j<tckFiles[i].distance?.length; j++){
        for(let k =0; k<tckFiles[i].distance[j].length; k++){
          if(tckFiles[i].distance[j][k] < 1) count++;
        }
      }

    }

  }, [viewDistances])

  return (
    <>
      {(viewDistances) ? (<>
        {tckFiles.map((file, fileIndex) =>
      file.isVisible ? file.coordinates.map((streamline, streamlineIndex) => {
        // Find the correct index in mapping that matches the streamlineIndex
        let distanceArray:number[] = []
        if(file.name.substring(0,3) === 'POS'){
          const mappingIndex = file.mapping.indexOf(streamlineIndex);
          distanceArray = mappingIndex !== -1 ? file.distance[mappingIndex] : [];
        }else{
          distanceArray = file.distance[streamlineIndex]
        }

        return (
          <StreamlineColor
            key={`${fileIndex}-${streamlineIndex}`}
            points={streamline}
            distances={distanceArray} // Pass the correct distances array
            opacity={file.opacity}
            visibility={file.isVisible}
            colorStart={file.color}
            colorEnd={ColorUtils.getComplementaryColorHex(file.color)}
            maxColor={maxColorDistance}
          />
        );
      }) : null
      )}
      </>) : (<>
        {(viewFlow) ? (<>
          {tckFiles.map((file, fileIndex) =>
          file.isVisible ? file.coordinates.map((streamline, streamlineIndex) => {
            let colorArray:number[] = []
            if(file.name.substring(0,3) === 'POS'){
              const mappingIndex = file.mapping.indexOf(streamlineIndex);
              colorArray = mappingIndex !== -1 ? file.counterCoords[mappingIndex] : [];
            }else{
              colorArray = file.counterCoords[streamlineIndex]
            }

            return(
            <SimilarityStreamline
              key={`${fileIndex}-${streamlineIndex}`}
              points={streamline}
              colorDifferences={colorArray}
              opacity={file.opacity}
              visibility={file.isVisible}
              deviationFactor={maxColorDistance}
            />
            
          );}) : null
          )}
        </>) : (<>
        {(directional) ? (<>
          {tckFiles.map((file, fileIndex) =>
          file.isVisible ? file.coordinates.map((streamline, streamlineIndex) => (
            <DirectionalStreamline
              key={`${fileIndex}-${streamlineIndex}`}
              points={streamline}
              opacity={file.opacity}
              visibility={file.isVisible}
              useDirectionalColor={true} // Or toggle based on some other state or prop
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
      </>)}
      
    </>
  );
};

export default Streamlines;