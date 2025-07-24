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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { collection, query, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  type: 'image' | 'video';
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'blocked';
  views: number;
  user?: {
    name: string;
    username: string;
  };
}

export default function Stories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const columns: GridColDef[] = [
    {
      field: 'user',
      headerName: 'User',
      width: 150,
      valueGetter: (params: GridValueGetterParams) =>
        params.value?.username || 'Unknown',
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'video' ? 'primary' : 'secondary'}
          size="small"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'active'
              ? 'success'
              : params.value === 'blocked'
              ? 'error'
              : 'default'
          }
          size="small"
        />
      ),
    },
    {
      field: 'views',
      headerName: 'Views',
      width: 100,
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
      field: 'expiresAt',
      headerName: 'Expires',
      width: 180,
      valueGetter: (params: GridValueGetterParams) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '';
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton
            color="primary"
            size="small"
            onClick={() => handlePreview(params.row)}
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
            color={params.row.status === 'blocked' ? 'success' : 'error'}
            size="small"
            onClick={() => handleToggleBlock(params.row)}
          >
            <BlockIcon />
          </IconButton>
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
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const storiesRef = collection(db, 'stories');
      const snapshot = await getDocs(storiesRef);
      
      const storiesData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const storyData = doc.data();
          
          // Fetch user data
          const userDoc = await getDocs(query(collection(db, 'users')));
          const userData = userDoc.docs.find(d => d.id === storyData.userId)?.data();
          
          // Convert Firestore timestamps to Date objects
          const createdAt = storyData.createdAt?.toDate() || new Date();
          const expiresAt = storyData.expiresAt?.toDate() || new Date();

          return {
            id: doc.id,
            userId: storyData.userId,
            mediaUrl: storyData.mediaUrl,
            type: storyData.type,
            createdAt,
            expiresAt,
            status: storyData.status,
            views: storyData.views,
            user: userData ? {
              name: userData.name,
              username: userData.username,
            } : undefined,
          } as Story;
        })
      );
      
      setStories(storiesData);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setError('Failed to fetch stories');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (story: Story) => {
    setSelectedStory(story);
    setPreviewOpen(true);
  };

  const handleToggleBlock = async (story: Story) => {
    try {
      const newStatus = story.status === 'blocked' ? 'active' : 'blocked';
      await updateDoc(doc(db, 'stories', story.id), {
        status: newStatus,
      });
      
      setStories(stories.map(s =>
        s.id === story.id ? { ...s, status: newStatus } : s
      ));
    } catch (error) {
      console.error('Error updating story status:', error);
      setError('Failed to update story status');
    }
  };

  const handleDelete = async (story: Story) => {
    try {
      await deleteDoc(doc(db, 'stories', story.id));
      setStories(stories.filter(s => s.id !== story.id));
    } catch (error) {
      console.error('Error deleting story:', error);
      setError('Failed to delete story');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Stories
      </Typography>

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
            rows={stories}
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

      {/* Story Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Story Preview</DialogTitle>
        <DialogContent>
          {selectedStory?.type === 'image' ? (
            <img
              src={selectedStory.mediaUrl}
              alt="Story"
              style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          ) : (
            <video
              src={selectedStory?.mediaUrl}
              controls
              style={{ width: '100%', maxHeight: '80vh' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 