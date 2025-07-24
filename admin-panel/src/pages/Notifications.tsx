import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import {
  Delete as DeleteIcon,
  Send as SendIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import {
  collection,
  query,
  getDocs,
  doc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface Notification {
  id: string;
  type: 'system' | 'match' | 'like' | 'follow' | 'message';
  title: string;
  message: string;
  targetUsers: 'all' | 'active' | 'inactive';
  status: 'sent' | 'scheduled' | 'failed';
  createdAt: Date;
  scheduledFor?: Date;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    type: 'system',
    title: '',
    message: '',
    targetUsers: 'all',
  });

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Title', width: 200 },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'system'
              ? 'primary'
              : params.value === 'match'
              ? 'success'
              : 'default'
          }
          size="small"
        />
      ),
    },
    { field: 'message', headerName: 'Message', width: 300 },
    {
      field: 'targetUsers',
      headerName: 'Target Users',
      width: 120,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'sent'
              ? 'success'
              : params.value === 'scheduled'
              ? 'warning'
              : 'error'
          }
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 180,
      valueGetter: (params: GridValueGetterParams) =>
        params.value?.toDate().toLocaleDateString(),
    },
    {
      field: 'scheduledFor',
      headerName: 'Scheduled For',
      width: 180,
      valueGetter: (params: GridValueGetterParams) =>
        params.value?.toDate().toLocaleDateString() || 'N/A',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton
            color="error"
            size="small"
            onClick={() => handleDelete(params.row)}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      ),
    },
  ];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const notificationsRef = collection(db, 'notifications');
      const snapshot = await getDocs(notificationsRef);
      
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];
      
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notification: Notification) => {
    try {
      await deleteDoc(doc(db, 'notifications', notification.id));
      setNotifications(notifications.filter(n => n.id !== notification.id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification');
    }
  };

  const handleCreateNotification = async () => {
    try {
      const notificationData = {
        ...newNotification,
        status: 'sent',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'notifications'), notificationData);
      setCreateDialogOpen(false);
      fetchNotifications();
    } catch (error) {
      console.error('Error creating notification:', error);
      setError('Failed to create notification');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4">
          Notifications
        </Typography>
        <Button
          variant="contained"
          startIcon={<NotificationsActiveIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Notification
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 600, width: '100%' }}>
        {loading ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={notifications}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            pageSizeOptions={[10]}
            checkboxSelection
            disableRowSelectionOnClick
          />
        )}
      </Paper>

      {/* Create Notification Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Notification</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={newNotification.type}
              label="Type"
              onChange={(e) => setNewNotification({
                ...newNotification,
                type: e.target.value as string,
              })}
            >
              <MenuItem value="system">System</MenuItem>
              <MenuItem value="match">Match</MenuItem>
              <MenuItem value="like">Like</MenuItem>
              <MenuItem value="follow">Follow</MenuItem>
              <MenuItem value="message">Message</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Title"
            value={newNotification.title}
            onChange={(e) => setNewNotification({
              ...newNotification,
              title: e.target.value,
            })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Message"
            value={newNotification.message}
            onChange={(e) => setNewNotification({
              ...newNotification,
              message: e.target.value,
            })}
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth>
            <InputLabel>Target Users</InputLabel>
            <Select
              value={newNotification.targetUsers}
              label="Target Users"
              onChange={(e) => setNewNotification({
                ...newNotification,
                targetUsers: e.target.value as string,
              })}
            >
              <MenuItem value="all">All Users</MenuItem>
              <MenuItem value="active">Active Users</MenuItem>
              <MenuItem value="inactive">Inactive Users</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateNotification}
            variant="contained"
            startIcon={<SendIcon />}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 