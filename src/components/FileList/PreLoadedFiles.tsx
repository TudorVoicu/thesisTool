import React, { useEffect, useState } from 'react';
import { Select, MenuItem, Checkbox, ListItemText, OutlinedInput, InputLabel, FormControl, SelectChangeEvent } from '@mui/material';
import { useFiles } from  '../../FilesContext';

type FourDimArray = number[][][][];
interface Items {
    value: FourDimArray[],
    label: string
    selected: boolean;
    mapping: number[][][];
    distances: number[][][][];
}

const PreLoadedFiles: React.FC = () => {
    const { fileGroups, addFileGroup, emptyFileGroup } = useFiles();
    const [items, setItems] = useState<Items[]>([]);  // Items will hold label and four-dimensional arrays
    const [loadedData, setLoadedData] = useState<{[key: string]: FourDimArray[]}>({});

    useEffect(() => {
        const loadJsonData = async (folder: string) => {
            const pre = await fetch(`/preloadedArrays/${folder}/pre.json`).then(res => res.json());
            const post = await fetch(`/preloadedArrays/${folder}/post.json`).then(res => res.json());
            const distancesLeft = await fetch(`/preloadedArrays/${folder}/distances_left.json`).then(res => res.json());
            const distancesRight = await fetch(`/preloadedArrays/${folder}/distances_right.json`).then(res => res.json());
            const mappingsLeft = await fetch(`/preloadedArrays/${folder}/mapping_left.json`).then(res => res.json());
            const mappingsRight = await fetch(`/preloadedArrays/${folder}/mapping_right.json`).then(res => res.json());
            
            return [[post, pre], [distancesLeft, distancesRight], [mappingsLeft, mappingsRight]];
        };

        const loadData = async () => {
            const folders = ['AF_100', 'AF'];  // Example folder names, adjust as needed
            const promises = folders.map(folder => loadJsonData(folder).then(data => ({
                label: folder,
                value: data[0],
                distances: data[1],
                mapping: data[2],
                selected:false
            })));
            const items = await Promise.all(promises);
            setItems(items);
        };

        loadData();
    }, []);
    
    //loads the files onto the context's filelist
    useEffect(() => {
        emptyFileGroup();
        let counter = 0;
        items.map((item) => {
            if(item.selected){
            item.value.map((patient, indexit) => {
                const label = indexit === 0? "POST_" : "PRE_"
                const perFile = patient.map((tck, index) => {
                    return {
                        name: index === 0 ? (label + item.label + "_left") : (label + item.label + "_right"),
                        coordinates: tck,
                        distance: item.distances[indexit][index],
                        mapping: item.mapping[indexit][index],
                        isVisible: true,
                        opacity: 0.5,
                        color: '#fc0328',
                    };
                })
                console.log(perFile);
                addFileGroup( perFile );
            })
            counter+=2;
        }
        })
    }, [items])

    useEffect(() => {
        console.log(fileGroups)
        for(let i=0; i<fileGroups.length; i+=2){
            computeCenterAndSubtract;
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
        console.log(fileGroups)
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
          fileGroups[index].tckFiles[1],
          fileGroups[index + 1].tckFiles[0],
          fileGroups[index + 1].tckFiles[1],
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
        fileGroups[index].tckFiles[1] = bundles[1];
        fileGroups[index + 1].tckFiles[0] = bundles[2];
        fileGroups[index + 1].tckFiles[1] = bundles[3];
    }

    const renderValue = (selected: string[]) => selected.join(', ');

    return (
        <FormControl fullWidth>
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
        </FormControl>
    );
};

export default PreLoadedFiles;