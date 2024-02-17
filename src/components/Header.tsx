/*// import HomeIcon from '@mui/icons-material/Home';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PeopleIcon from '@mui/icons-material/People';
// import AdminIcon from '@mui/icons-material/AdminPanelSettings';
import {useNavigate} from 'react-router-dom';
import {Divider} from '@mui/material';
import {History, AccessTime} from '@mui/icons-material';
import BadgeIcon from '@mui/icons-material/Badge';
*/

import React, { useState } from 'react';
import logoImage from '../assets/narghilea-removebg-preview.png';

export default function Header() {
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1vw',
    backgroundColor: '#f0f0f0',
    width: '100%',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 1000,
  };

  const logoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center', // This should vertically center align the items
    fontSize: '4vw',
    fontWeight: 'bold',
    fontFamily: "'Tangerine', cursive",
  };

  // Adjusted container for buttons to add right padding
  const buttonsContainerStyle: React.CSSProperties = {
    paddingRight: '1vw', // Adds padding to the right of the rightmost button
  };

  // Initial button style
  const buttonStyle: React.CSSProperties = {
    padding: '1vw 2vw',
    fontSize: '2vw',
    margin: '0 1vw',
    backgroundColor: 'transparent', // Default background color is transparent
    color: 'black', // Default text color
    border: '1px solid #007bff', // Adding a border for better visibility
    borderRadius: '5px',
    cursor: 'pointer',
  };

  // Function to generate button style with hover effect
  const getButtonStyle = (isHovered: boolean): React.CSSProperties => ({
    ...buttonStyle,
    backgroundColor: isHovered ? '#007bff' : 'transparent', // Changes background color on hover
    color: isHovered ? 'white' : 'black', // Changes text color on hover
  });

  // State hook to manage hover state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Example buttons data
  const buttons = ['Home', 'About', 'Contact'];

  const imageStyle: React.CSSProperties = {
    height: '6vw', // You can adjust the size as needed
    marginRight: '0vw', // Adds some space between the image and the text
  };

  return (
    <div style={headerStyle}>
      <div style={logoStyle}>
        <img src={logoImage} alt="Logo" style={imageStyle} />
        Taisha
        </div>
      <div style={buttonsContainerStyle}>
        {buttons.map((button, index) => (
          <button
            key={index}
            style={getButtonStyle(hoverIndex === index)}
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            {button}
          </button>
        ))}
      </div>
    </div>
  );
};