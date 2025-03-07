import * as React from 'react';
import Box from '@mui/material/Box';
import "./DeleteTripConfirmation.css"
import Modal from '@mui/material/Modal';
import "../styles/Trips.css";
import "../components/DeleteTripConfirmation.css"


const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 450,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default function ConfirmDelete() {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);


  return (
    <div>
      <button onClick={handleOpen}>Delete</button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <div className='confirm-text'>
            <p>Are you sure you want to delete? All progress will be lost</p>
            <button onClick={handleClose} className="create-trip-btn">
                Cancel
            </button>
            <button>
                Delete
            </button>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
