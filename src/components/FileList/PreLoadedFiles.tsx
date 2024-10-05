import React, { useEffect, useState } from 'react';
import { Select, MenuItem, Checkbox, ListItemText, OutlinedInput, InputLabel, FormControl, SelectChangeEvent } from '@mui/material';
import { useFiles } from  '../../FilesContext';
import { CircularProgress } from '@mui/material';


type FourDimArray = number[][][][];
interface Items {
    value: FourDimArray[],
    label: string
    selected: boolean;
    mapping: number[][];
    distances: number[][][];
    colorDiff: number[][][];
}

const PreLoadedFiles: React.FC = () => {
    const { fileGroups, addFileGroup, emptyFileGroup } = useFiles();
    const [items, setItems] = useState<Items[]>([]);  // Items will hold label and four-dimensional arrays
    const [loadedData, setLoadedData] = useState<{[key: string]: FourDimArray[]}>({});

    useEffect(() => {
        const base = import.meta.env.BASE_URL;
        const loadJsonData = async (folder: string) => {
            const pre = await fetch(`${base}dist/preloadedArrays/${folder}/pre.json`).then(res => res.json());
            const post = await fetch(`${base}dist/preloadedArrays/${folder}/post.json`).then(res => res.json());
            const distancesLeft = await fetch(`${base}dist/preloadedArrays/${folder}/distances_left.json`).then(res => res.json());
            const distancesRight = await fetch(`${base}dist/preloadedArrays/${folder}/distances_right.json`).then(res => res.json());
            const mappingsLeft = await fetch(`${base}dist/preloadedArrays/${folder}/mapping_left.json`).then(res => res.json());
            const mappingsRight = await fetch(`${base}dist/preloadedArrays/${folder}/mapping_right.json`).then(res => res.json());
            const colorLeft = await fetch(`${base}dist/preloadedArrays/${folder}/color_left.json`).then(res => res.json());
            const colorRight = await fetch(`${base}dist/preloadedArrays/${folder}/color_right.json`).then(res => res.json());
            return [
                {label: folder + "_left", value: [[post[0]], [pre[0]]], distances: distancesLeft, mapping: mappingsLeft, selected: false, colorDiff: colorLeft},
                {label: folder + "_right", value: [[post[1]], [pre[1]]], distances: distancesRight, mapping: mappingsRight, selected: false, colorDiff: colorRight}
            ];
        };
    
        const loadData = async () => {
            //const folders = ['AF_100', 'CST', 'CG', 'IFO', 'IFO_right', 'SCP'];  // Example folder names, adjust as needed
            const folders = ['AF', 'AF_100','CG','CST', 'IFO'];
            const promises = folders.map(async folder => await loadJsonData(folder));
            const itemsArray = await Promise.all(promises);
            setItems(itemsArray.flat());
        };
    
        loadData();
    }, []);

    const morphMapping = (mapping: [number[], number[]]): [number[], number[]] => {
        const [array0, array1] = mapping;
      
        // Create a map to store positions of each element in array0
        const positionInArray0: Record<number, number> = {};
        array0.forEach((value, index) => {
          positionInArray0[value] = index;
        });
      
        // Create a map to store positions of each element in array1
        const positionInArray1: Record<number, number> = {};
        array1.forEach((value, index) => {
          positionInArray1[value] = index;
        });
      
        // Create the transformed arrays
        const transformedArray0 = array0.map(value => positionInArray1[value]);
        const transformedArray1 = array1.map(value => positionInArray0[value]);
      
        return [transformedArray0, transformedArray1];
      };
    
    //loads the files onto the context's filelist
    useEffect(() => {
        emptyFileGroup();
        items.forEach((item) => {
            if (item.selected) {
                item.value.forEach((patient, indexit) => {
                    const label = indexit === 0 ? `POST_` : `PRE_`;
                    const perFile = patient.map((tck, index) => ({
                        name: `${label}${item.label}_${index}`,
                        coordinates: tck,
                        distance: item.distances[(indexit+1)%2],
                        mapping: item.mapping[(indexit+1)%2],
                        isVisible: true,
                        opacity: 0.5,
                        color: '#fc0328',
                        colorDiff: morphMapping([item.mapping[0], item.mapping[1]])[indexit],
                        counterCoords: item.colorDiff[(indexit+1)%2] //this is shady af...
                    }));
                    addFileGroup(perFile);
                });
            }
        });
    }, [items]);

    useEffect(() => {
        for(let i=0; i<fileGroups.length; i+=2){
            computeCenterAndSubtract(i);
        }
    }, [fileGroups])

    const handleChange = (event: SelectChangeEvent<string[]>) => {
        const {
            target: { value },
        } = event;
        setItems(prevItems =>
            prevItems.map(item => ({
                ...item,
                selected: value.includes(item.label),
            }))
        );

        // Update loaded data state
        const newLoadedData = { ...loadedData };
        items.forEach(item => {
            if (value.includes(item.label)) {
                newLoadedData[item.label] = item.value;
            } else {
                delete newLoadedData[item.label];
            }
        });
        setLoadedData(newLoadedData);
    };

    function computeCenterAndSubtract(index: number): void {
        // Validate indices
        if (
          !fileGroups[index] || 
          !fileGroups[index + 1] || 
          !fileGroups[index].tckFiles || 
          !fileGroups[index + 1].tckFiles
        ) {
          throw new Error("Invalid indices or fileGroups structure.");
        }
      
        let bundles = [
          fileGroups[index].tckFiles[0],
          fileGroups[index + 1].tckFiles[0],
        ];
        // Calculate the center
        let voxel = [0, 0, 0];
        for (let k = 0; k < bundles.length; k++) {
          let array = bundles[k].coordinates;
          let voxelBundle = [0, 0, 0];
      
          for (let i = 0; i < array.length; i++) {
            let voxelStreamline = [0, 0, 0];
      
            for (let j = 0; j < array[i].length; j++) {
              voxelStreamline[0] += array[i][j][0];
              voxelStreamline[1] += array[i][j][1];
              voxelStreamline[2] += array[i][j][2];
            }
      
            voxelBundle[0] += voxelStreamline[0] / array[i].length;
            voxelBundle[1] += voxelStreamline[1] / array[i].length;
            voxelBundle[2] += voxelStreamline[2] / array[i].length;
          }
      
          voxel[0] += voxelBundle[0] / array.length;
          voxel[1] += voxelBundle[1] / array.length;
          voxel[2] += voxelBundle[2] / array.length;
        }
      
        voxel[0] /= bundles.length;
        voxel[1] /= bundles.length;
        voxel[2] /= bundles.length;
      
        // Subtract center from each voxel of each TCK file
        for (let k = 0; k < bundles.length; k++) {
          for (let i = 0; i < bundles[k].coordinates.length; i++) {
            for (let j = 0; j < bundles[k].coordinates[i].length; j++) {
              bundles[k].coordinates[i][j][0] -= voxel[0];
              bundles[k].coordinates[i][j][1] -= voxel[1];
              bundles[k].coordinates[i][j][2] -= voxel[2];
            }
          }
        }

        fileGroups[index].tckFiles[0] = bundles[0];
        fileGroups[index + 1].tckFiles[0] = bundles[1];
    }

    const renderValue = (selected: string[]) => selected.join(', ');

    return (
        <FormControl fullWidth sx={{marginTop : "1rem", marginBottom: '1rem'}}>
            <InputLabel>Subfolders</InputLabel>
            <Select
                multiple
                value={items.filter(item => item.selected).map(item => item.label)}
                onChange={handleChange}
                input={<OutlinedInput label="Subfolders" />}
                renderValue={renderValue}
                MenuProps={{
                    PaperProps: {
                        style: {
                            maxHeight: 224,
                            width: 250,
                        },
                    },
                }}
            >
                {items.map((item) => (
                    <MenuItem key={item.label} value={item.label}>
                        <Checkbox checked={items.filter(item => item.selected).map(item => item.label).includes(item.label)} />
                        <ListItemText primary={item.label} />
                    </MenuItem>
                ))}
            </Select>
            {items.length === 0 && (<>
                <CircularProgress sx={{ml:'1rem', mt:'1.5rem'}} color="primary" />
            </>)}
        </FormControl>
    );
};

export default PreLoadedFiles;