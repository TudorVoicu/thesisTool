//FileList.tsx
import React from 'react';
import { useFiles } from '../../FilesContext';
import { Checkbox, FormControlLabel, Slider, TextField, Switch, Button } from '@mui/material';
import PreLoadedFiles from './PreLoadedFiles';

const FileList: React.FC = () => {
  const { fileGroups, toggleTckFileVisibility, changeTckFileColor, changeTckFileOpacity, toggleAllInOneScene, makeHeatmap, 
    makeStreamlines, heatmap, streamlines, setCellSize, setGridSize, changeColoringFiles, setMaxColorDistance, toggleViewDistances } = useFiles();

  const [isColored, setIsColored] = React.useState<boolean>(false);
  const [value, setValue] = React.useState<string>("");

  const handleAllInOneScene = () => {
    toggleAllInOneScene();
  };

  const heatmaps = () => {
    makeHeatmap();
  }

  const streamlinesVis = () => {
    makeStreamlines();
  }

  const cellSizeSlider = (step:number) => {
    setCellSize(getCustomValue(step));
  }

  const gridSizeSlider = (step:number) => {
    setGridSize(step);
  }

  const customValues = [0.2, 0.1, 0.05, 0.02, 0.01];

  const heatmapMarks = customValues.map((value, index) => ({
    value: (100 / (customValues.length - 1)) * index,
    label: value.toString(),
  }));

  const getCustomValue = (sliderValue:any) => {
    const index = Math.round(((customValues.length - 1) * sliderValue) / 100);
    return customValues[index];
  };

  async function processArrays(array1: number[][][], array2: number[][][]) {
    try {
      const response = await fetch('http://127.0.0.1:5000/color_distance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ array1, array2 }),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const data = await response.json();
      console.log(data)
      changeColoringFiles(data.mapping, data.distances);
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
    }
  }

  function processColoring(): void {
    setIsColored(true);
    processArrays(fileGroups[0].tckFiles[0].coordinates, fileGroups[1].tckFiles[0].coordinates);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const newValue = event.target.value;
        // Check if the new value is a non-negative number
        if (!newValue || /^\d*\.?\d*$/.test(newValue)) {
            setValue(newValue);
            setMaxColorDistance(parseInt(newValue));
        }
  }

  return (
    <div className="file-list">
      <PreLoadedFiles />
      <FormControlLabel
        control={<Switch onChange={handleAllInOneScene} />}
        label="Superimposed"
      />
      <FormControlLabel
        control={<Switch onChange={heatmaps} />}
        label="HeatMap"
      />
      <FormControlLabel
        control={<Switch onChange={streamlinesVis} defaultChecked />}
        label="Streamlines"
      />
      <FormControlLabel
        control={<Switch onChange={toggleViewDistances} />}
        label="Distance Coloring"
      />
      {/* <FormControlLabel
        control={<Switch onChange={toggleCenterBundle} />}
        label="Center Bundle"
      /> */}
      {heatmap && (
        <div>
          <Slider
          defaultValue={50}
          step={100 / (customValues.length - 1)} // Equal spacing
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => getCustomValue(value)}
          onChangeCommitted={(_e, value) => cellSizeSlider(value as number)}
          marks={heatmapMarks}
          />  
          <Slider
          defaultValue={200}
          step={100} // Equal spacing
          onChangeCommitted={(_e, value) => gridSizeSlider(value as number)}
          min={100}
          max={500}
          />  
        </div>
      )}
      {streamlines && (
        <>
          {fileGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="file-group-item">
              {group.tckFiles.map((tckFile, fileIndex) => (
                <div key={tckFile.name} className="file-list-item">
                  <div>
                    {tckFile.name}
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={tckFile.isVisible}
                          onChange={() => toggleTckFileVisibility(groupIndex, fileIndex)}
                          name="visible"
                        />
                      }
                      label="Toggle Visibility"
                    />
                    <Slider
                      value={tckFile.opacity}
                      aria-label="Opacity"
                      valueLabelDisplay="auto"
                      min={0}
                      max={1}
                      step={0.01}
                      onChangeCommitted={(_e, value) =>
                        changeTckFileOpacity(groupIndex, fileIndex, value as number)}
                    />
                    <TextField
                      type="color"
                      defaultValue={tckFile.color}
                      label="Line Color"
                      variant="standard"
                      onChange={(e) => changeTckFileColor(groupIndex, fileIndex, e.target.value)}
                      sx={{ width: 150, marginTop: 2 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
      
      {fileGroups.length === 2 && fileGroups[0].tckFiles.length === 1 && fileGroups[1].tckFiles.length === 1 && (
        <>
          <Button
          onClick={() => processColoring()}
          >
            Distance Coloring
          </Button>
        </>
      )}
      {isColored && (
        <>
          <TextField
            type="number"
            label="Set Max Distance"
            variant="outlined"
            value={value}
            onChange={handleChange}
            inputProps={{ min: "0", step: "1" }}  // ensures only numbers >= 0 can be entered
            fullWidth
          />
        </>
      )}
      
    </div>
  );
};

export default FileList;