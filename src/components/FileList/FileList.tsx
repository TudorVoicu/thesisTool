//FileList.tsx
import React from 'react';
import { useFiles } from '../../FilesContext';
import { Checkbox, FormControlLabel, Slider, TextField, Switch, Button, Box, FormGroup, AccordionDetails, Accordion, Typography, AccordionSummary } from '@mui/material';
import PreLoadedFiles from './PreLoadedFiles';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

const FileList: React.FC = () => {
  const { fileGroups, toggleTckFileVisibility, changeTckFileColor, changeTckFileOpacity, toggleAllInOneScene, makeHeatmap, 
    makeStreamlines, heatmap, streamlines, setCellSize, setGridSize, changeColoringFiles, setMaxColorDistance, toggleViewDistances, 
    synchronizeCameras, cameraState, toggleViewFlow, viewDistances, viewFlow, viewDirColoring, toggleViewDirColoring } = useFiles();

  const [isColored, setIsColored] = React.useState<boolean>(false);

  const [internalViewFlow, setInternalViewFlow] = React.useState(viewFlow);
  const [internalViewDistances, setInternalViewDistnaces] = React.useState(viewDistances);
  const [internalViewDirColoring, setInternalViewDirColoring] = React.useState(viewDirColoring);

  const [internalDistanceMeter, setInternalDistanceMeter] = React.useState(20);
  const [internalFlowMeter, setInternalFlowMeter] = React.useState(0.25);
  const [internalMeter, setInternalMeter] = React.useState(0);
  const [inputValue, setInputValue] = React.useState(internalMeter.toString()); // Input field value

  React.useEffect(() => {
    setInternalViewDistnaces(viewDistances);
    if(viewDistances) setInternalMeter(internalDistanceMeter);
  }, [viewDistances]);

  React.useEffect(() => {
    setInternalViewFlow(viewFlow);
    if(viewFlow)  setInternalMeter(internalFlowMeter);
  }, [viewFlow]);

  React.useEffect(() => {
    setInternalViewDirColoring(viewDirColoring);
  })

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

  const dirColoring = () => {
    toggleViewDirColoring()
  }

  const customValues = [0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002];

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
    const value = event.target.value;
    setInputValue(value);

    // Attempt to parse the input value to a number
    const numberValue = parseFloat(value);

          // Check if the new value is a non-negative number
        if (numberValue && !isNaN(numberValue) && numberValue > 0) {
            if(internalViewDistances) setInternalDistanceMeter(numberValue);
            else  setInternalFlowMeter(numberValue);
            setInternalMeter(numberValue);
        }
  }

  React.useEffect(() => {
    setMaxColorDistance(internalMeter);
  }, [internalMeter])

  return (
    <Box sx={{mr:1, ml:1}}>
    <div className="file-list">
      <PreLoadedFiles />
      <FormGroup>
      <Accordion>
        <AccordionSummary
          expandIcon={<ArrowDownwardIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
        <Typography>Streamlines Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup sx={{ ml: 2 }}>
            <FormControlLabel
              control={<Switch onChange={streamlinesVis} defaultChecked />}
              label="Streamlines"
            />
            <FormControlLabel
              control={<Switch onChange={handleAllInOneScene} />}
              label="Superimposed"
            />
            <FormControlLabel
              control={<Switch onChange={dirColoring} checked={internalViewDirColoring}/>}
              label="Directional Coloring"
            />
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      <FormControlLabel
        control={<Switch onChange={heatmaps} />}
        sx={{mt:'0.5rem'}}
        label="HeatMap"
      />
      
      <FormControlLabel
        control={<Switch onChange={toggleViewDistances} checked={internalViewDistances} />}
        label="Distance Coloring"
      />
      <FormControlLabel
        control={<Switch onChange={toggleViewFlow} checked={internalViewFlow} />}
        label="Flow Coloring"
      />
    </FormGroup>
    {(viewDistances || viewFlow) && (
      <TextField
        type="text" // Use text to allow empty input
        label="Set Max Distance"
        variant="outlined"
        value={inputValue}
        onChange={handleChange}
        fullWidth
        sx={{ marginTop: '1rem', marginBottom: '1rem' }}
      />
    )}
    
      {heatmap && (
        <Box sx={{marginRight:'1rem'}}> 
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
        </Box>
      )}
      <Box sx={{mt:'1rem'}}></Box>
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
      
      {/* {fileGroups.length === 2 && fileGroups[0].tckFiles.length === 1 && fileGroups[1].tckFiles.length === 1 && (
        <>
          <Button
          onClick={() => processColoring()}
          >
            Distance Coloring
          </Button>
        </>
      )} */}

      
    </div>
    </Box>
  );
};

export default FileList;