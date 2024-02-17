// import HomeIcon from '@mui/icons-material/Home';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PeopleIcon from '@mui/icons-material/People';
// import AdminIcon from '@mui/icons-material/AdminPanelSettings';
import {useNavigate} from 'react-router-dom';
import {Divider} from '@mui/material';
import {History, AccessTime} from '@mui/icons-material';
import BadgeIcon from '@mui/icons-material/Badge';

export default function Header() {
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1vw',
    backgroundColor: '#f0f0f0',
    width: '100%', // Ensure header extends to full width
    position: 'fixed', // Optionally make the header fixed at the top
    top: 0, // Position at the top
    left: 0, // Align to the left
    zIndex: 1000, // Ensure header is above other content
  };

  const logoStyle: React.CSSProperties = {
    fontSize: '4vw',
    fontWeight: 'bold',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '1vw 2vw',
    fontSize: '2vw',
    margin: '0 1vw',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  };

  return (
    <div style={headerStyle}>
      <div style={logoStyle}>Logo</div>
      <div>
        <button style={buttonStyle}>Home</button>
        <button style={buttonStyle}>About</button>
        <button style={buttonStyle}>Contact</button>
      </div>
    </div>
  );
};