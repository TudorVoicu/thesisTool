import React from 'react';
import { MeshBasicMaterial, PlaneGeometry, Mesh, GridHelper, PlaneHelper, Object3DEventMap, LineBasicMaterial, Line  } from 'three';
import { useThree } from '@react-three/fiber';
import { Vector3, Plane } from 'three';
import * as THREE from 'three';
import { useFiles } from '../../FilesContext';
import {ProjectedPoints} from './Heatmap'


interface RenderHeatmapProps {
    projectedCoordinates: ProjectedPoints[];
    onRender?: (cleanup: () => void) => void;
}

interface Cell {
    mesh: Mesh<PlaneGeometry, MeshBasicMaterial, Object3DEventMap>;
    pointDensity: number;
}

const RenderHeatmap: React.FC<RenderHeatmapProps> = ({ projectedCoordinates, onRender  }) => {
    const { scene, camera } = useThree();
    const plHelperRef = React.useRef<PlaneHelper | null>(null);
    const cellMap = new Map();
    const { cellSize, gridSize, fileGroups} = useFiles();

    // //const [cells, setCells] = React.useState<Cell[]>([]);
    
    // function isInside(refx:number, refy:number, x:number, y:number){
    //     if(refx -0.05 <= -1*x/100 && -1*x/100< refx+0.05 && refy-0.05 <= y/100 && y/100<refy + 0.05)    {return true;}
    //     //console.log(refx -0.05, x/100);
    //     return false;
    // }

    function computeDensity() {
        const updateDensity = (point: Number[], prefix:string) => {
            // Calculate the cell key directly from the point coordinates
            const xIndex = Math.floor(((-Number(point[0]) / (gridSize/2)) + 1) / cellSize);
            const yIndex = Math.floor(((Number(point[1]) / (gridSize/2)) + 1) / cellSize);
            const key = `${xIndex},${yIndex}`;
            const cell = cellMap.get(key);
            if (cell) {
                prefix === "POS" ? cell.pointDensity++ : cell.pointDensity--;
            }
        };
    

        projectedCoordinates.forEach(file => {
            console.log(file)
            let prefix = file.name.slice(0, 3);
            let visible = false;
            fileGroups.forEach(f => f.tckFiles.forEach(tckFile => {
                if(tckFile.name === file.name)  {visible = tckFile.isVisible;}
            }))
            if(visible)
                file.coordinates.forEach(streamline => streamline.forEach(point => updateDensity(point, prefix)))
        });

    }

    function assignCol(helper:PlaneHelper, cells:Cell[]){
        let max = 0;
        let min = 0;
        cells.forEach(cell => {
            if(cell.pointDensity>max)   max = cell.pointDensity;
            if(cell.pointDensity<min)   min = cell.pointDensity;
        });
        cells.forEach(cell => {
            if (cell.pointDensity === 0) {
                cell.mesh.visible = false;
              } else {
                cell.mesh.visible = true;
              }
            if(cell.pointDensity < 0){
                cell.mesh.material.color = new THREE.Color('blue');
                cell.mesh.material.opacity = cell.pointDensity/min;
                helper.add(cell.mesh);
            }else{
                cell.mesh.material.opacity = cell.pointDensity/max;
                helper.add(cell.mesh);
            }
        })
    }

    function addCells(){
        const cellsTemp :Cell[] = [];
        for(let i = -1; i<1; i+=cellSize){
            for(let j=-1; j<1; j+=cellSize){
                const geometry = new PlaneGeometry(cellSize, cellSize);
                const material = new MeshBasicMaterial({ color: 'red', transparent: true, opacity: Math.random() });
                const mesh = new Mesh(geometry, material);
                
            
                // Position the cell. This is an example; you'll calculate this based on the cell's position in the grid.
                mesh.position.set(-(cellSize / 2 + i), cellSize / 2 + j, 0);
                mesh.rotation.x = Math.PI
                const cell :Cell = {
                    mesh : mesh,
                    pointDensity : 0,
                }
                cellsTemp.push(cell);
                const key = `${Math.floor((mesh.position.x + 1) / cellSize)},${Math.floor((mesh.position.y + 1) / cellSize)}`;
                cellMap.set(key, cell);
                //helper.add(mesh);
            }
        }
        return cellsTemp;
    }


  React.useEffect(() => {
    console.log(cellSize)
    console.log(gridSize)
    // Your heatmap rendering logic here...
    // Once everything is added to the scene, call onRendered with a cleanup function
    if (onRender) {
        onRender(() => {
            const lookAtDirection = new Vector3();
            camera.getWorldDirection(lookAtDirection);
            const plane = new Plane(lookAtDirection);
            const helper = new PlaneHelper(plane, gridSize, 0xffffff);
            helper.position.set(camera.position.x, camera.position.y, helper.position.z);

            if (plHelperRef.current) {
                scene.remove(plHelperRef.current); // Remove the current helper from the scene
            }
            let gridHelper = new GridHelper(2, 2/cellSize);
            gridHelper.rotation.x = Math.PI * .5;
            gridHelper.traverse((object) => {
                if (object instanceof Line) {
                    // Now that we've asserted the object is a Line, we can safely access its material
                    object.material = new LineBasicMaterial({
                        opacity: 0.4,
                        transparent: true,
                    });
                }
            });
            helper.add(gridHelper);
            const cells = addCells();
            computeDensity();
            assignCol(helper, cells);
            plHelperRef.current = helper; // Assign the new helper to the ref
            scene.add(helper);
        });
    }
}, [projectedCoordinates, scene, onRender, cellSize, gridSize]);

  return <></>; 
};

export default RenderHeatmap;