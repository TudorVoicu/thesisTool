declare module 'three.meshline' {
    import * as THREE from 'three';
  
    export class MeshLine extends THREE.BufferGeometry {
      geometry: any;
      constructor();
      setGeometry(geometry: THREE.BufferGeometry | Float32Array | THREE.Vector3[]): void;
      // You can add other properties and methods here if needed
    }
  
    export class MeshLineMaterial extends THREE.ShaderMaterial {
      constructor(parameters?: THREE.ShaderMaterialParameters & {
        lineWidth?: number;
        map?: THREE.Texture;
        useMap?: boolean;
        color?: THREE.Color | number | string;
        opacity?: number;
        resolution?: THREE.Vector2;
        sizeAttenuation?: boolean;
        dashArray?: number;
        dashOffset?: number;
        dashRatio?: number;
        useDash?: boolean;
        visibility?: number;
        alphaTest?: number;
        repeat?: THREE.Vector2;
      });
      // You can add other properties and methods here if needed
    }
  }