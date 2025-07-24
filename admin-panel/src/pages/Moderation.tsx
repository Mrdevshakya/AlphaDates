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
  Grid,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import {
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface ModerationItem {
  id: string;
  type: 'post' | 'comment' | 'profile' | 'story';
  content: string;
  userId: string;
  reportedBy: string[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  user?: {
    name: string;
    username: string;
  };
}

export default function Moderation() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const columns: GridColDef[] = [
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'post'
              ? 'primary'
              : params.value === 'profile'
              ? 'warning'
              : 'default'
          }
          size="small"
        />
      ),
    },
    {
      field: 'user',
      headerName: 'User',
      width: 150,
      valueGetter: (params: GridValueGetterParams) =>
        params.value?.username || 'Unknown',
    },
    {
      field: 'content',
      headerName: 'Content',
      width: 300,
      renderCell: (params) => (
        <Typography
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'reportCount',
      headerName: 'Reports',
      width: 100,
      valueGetter: (params: GridValueGetterParams) =>
        params.row.reportedBy?.length || 0,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'approved'
              ? 'success'
              : params.value === 'rejected'
              ? 'error'
              : 'warning'
          }
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 180,
      valueGetter: (params: GridValueGetterParams) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '';
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton
            color="success"
            size="small"
            onClick={() => handleUpdateStatus(params.row, 'approved')}
            disabled={params.row.status === 'approved'}
          >
            <CheckCircleIcon />
          </IconButton>
          <IconButton
            color="error"
            size="small"
            onClick={() => handleUpdateStatus(params.row, 'rejected')}
            disabled={params.row.status === 'rejected'}
          >
            <BlockIcon />
          </IconButton>
          <IconButton
            color="primary"
            size="small"
            onClick={() => handleViewDetails(params.row)}
          >
            <FlagIcon />
          </IconButton>
        </Stack>
      ),
    },
  ];

  useEffect(() => {
    fetchModerationItems();
  }, [filterType, filterStatus]);

  const fetchModerationItems = async () => {
    try {
      setLoading(true);
      const moderationRef = collection(db, 'moderation');
      let moderationQuery = query(moderationRef, orderBy('createdAt', 'desc'));

      if (filterType !== 'all') {
        moderationQuery = query(moderationQuery, where('type', '==', filterType));
      }

      if (filterStatus !== 'all') {
        moderationQuery = query(moderationQuery, where('status', '==', filterStatus));
      }

      const snapshot = await getDocs(moderationQuery);
      
      const itemsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const itemData = doc.data();
          
          // Fetch user data
          const userDoc = await getDocs(query(collection(db, 'users')));
          const userData = userDoc.docs.find(d => d.id === itemData.userId)?.data();
          
          // Convert Firestore timestamp to Date object
          const createdAt = itemData.createdAt?.toDate() || new Date();

          return {
            id: doc.id,
            type: itemData.type,
            content: itemData.content,
            userId: itemData.userId,
            reportedBy: itemData.reportedBy,
            reason: itemData.reason,
            status: itemData.status,
            createdAt,
            user: userData ? {
              name: userData.name,
              username: userData.username,
            } : undefined,
          } as ModerationItem;
        })
      );
      
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching moderation items:', error);
      setError('Failed to fetch moderation items');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (item: ModerationItem, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'moderation', item.id), {
        status: newStatus,
      });
      
      setItems(items.map(i =>
        i.id === item.id ? { ...i, status: newStatus } : i
      ));
    } catch (error) {
      console.error('Error updating item status:', error);
      setError('Failed to update item status');
    }
  };

  const handleViewDetails = (item: ModerationItem) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Content Moderation
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Content Type</InputLabel>
          <Select
            value={filterType}
            label="Content Type"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="post">Posts</MenuItem>
            <MenuItem value="comment">Comments</MenuItem>
            <MenuItem value="profile">Profiles</MenuItem>
            <MenuItem value="story">Stories</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Stack>

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
            rows={items}
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

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Moderation Details</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Content Type</Typography>
                <Typography>{selectedItem.type}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Content</Typography>
                <Typography>{selectedItem.content}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">User</Typography>
                <Typography>{selectedItem.user?.username || 'Unknown'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Report Reason</Typography>
                <Typography>{selectedItem.reason}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Number of Reports</Typography>
                <Typography>{selectedItem.reportedBy?.length || 0}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Status</Typography>
                <Chip
                  label={selectedItem.status}
                  color={
                    selectedItem.status === 'approved'
                      ? 'success'
                      : selectedItem.status === 'rejected'
                      ? 'error'
                      : 'warning'
                  }
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedItem?.status === 'pending' && (
            <>
              <Button
                onClick={() => {
                  handleUpdateStatus(selectedItem, 'approved');
                  setDetailsOpen(false);
                }}
                color="success"
                variant="contained"
              >
                Approve
              </Button>
              <Button
                onClick={() => {
                  handleUpdateStatus(selectedItem, 'rejected');
                  setDetailsOpen(false);
                }}
                color="error"
                variant="contained"
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
} 