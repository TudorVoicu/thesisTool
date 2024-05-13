// src/components/UploadArea/Upload.tsx
import React from 'react';
import { Button } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
//import { useFiles } from '../../FilesContext'; // Ensure this path is correct
import './Upload.css';

const UploadBox: React.FC = () => {
  //const { addFileGroup } = useFiles(); // Adjusted to use addFileGroup

  const processFiles = async (files:FileList) => {
    // Filter .tck and find .nii.gz files using the file name
    const tckFiles = Array.from(files).filter(file => file.name.endsWith('.tck'));
    const niiFile = Array.from(files).find(file => file.name.endsWith('.nii.gz'));
  
    // Check if both file types are present
    if (!niiFile || tckFiles.length === 0) {
      alert('Please upload at least one .tck file and one .nii.gz file.');
      return;
    }
  
    // Prepare form data
    let formData = new FormData();
    formData.append("nii", niiFile); // Add .nii.gz file with key "nii"
    tckFiles.forEach(file => formData.append("tck", file)); // Add .tck files with key "tck"
  
    try {
      // Post form data to server
      const response = await fetch('http://127.0.0.1:5000/py', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      // Process JSON response
      const jsonData = await response.json();
      //console.log(jsonData); // Log the response data
      
      const processedTckFiles = tckFiles.map((file, index) => {
        // Assuming jsonData[index] is the streamline data corresponding to tckFiles[index]
        const streamlineData = jsonData[index] || []; // Fallback to an empty array if undefined
        return {
          name: file.name,
          coordinates: streamlineData.slice(0, 50),
          //coordinates: streamlineData,
          isVisible: true,
          opacity: 0.5,
          color: '#fc0328',
          distance: null,
          mapping: null
        };
      });
      console.log(processedTckFiles);
      //addFileGroup( processedTckFiles, niiFile, jsonData );
      // Add your logic here to handle the response, such as updating the UI
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    processFiles(files);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      processFiles(event.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent default behavior
  };

  return (
    <div 
      className="dropzone"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="files"
        id="file-input"
        accept=".tck, .nii.gz"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <label htmlFor="file-input">
        <Button
          variant="contained"
          component="span"
          startIcon={<UploadIcon />}
          color="primary"
        >
          Choose files
        </Button>
      </label>
      <h3>or drag & drop your files</h3>
      <h5 className="file-notice">The expected files are .tck files</h5>
      <h5 className="file-notice">together with the associated .nii.gz file</h5>
    </div>
  );
};

export default UploadBox;