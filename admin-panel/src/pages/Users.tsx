import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridValueGetterParams,
  GridRenderCellParams,
  GridRowSelectionModel,
} from '@mui/x-data-grid';
import {
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  where,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  status: 'active' | 'blocked';
  createdAt: Date | any; // Allow Firestore Timestamp
  lastActive: Date | any; // Allow Firestore Timestamp
  matchCount: number;
  reportCount: number;
}

interface CreateMatchDialogProps {
  open: boolean;
  onClose: () => void;
  selectedUsers: User[];
  onCreateMatch: (compatibility: number) => Promise<void>;
}

function CreateMatchDialog({ open, onClose, selectedUsers, onCreateMatch }: CreateMatchDialogProps) {
  const [compatibility, setCompatibility] = useState(75);

  const handleCreate = async () => {
    await onCreateMatch(compatibility);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create Match</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Selected Users:
          </Typography>
          {selectedUsers.map((user) => (
            <Chip
              key={user.id}
              label={user.username}
              sx={{ m: 0.5 }}
            />
          ))}
        </Box>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Compatibility Score</InputLabel>
          <Select
            value={compatibility}
            label="Compatibility Score"
            onChange={(e) => setCompatibility(Number(e.target.value))}
          >
            <MenuItem value={100}>100% - Perfect Match</MenuItem>
            <MenuItem value={90}>90% - Excellent Match</MenuItem>
            <MenuItem value={80}>80% - Great Match</MenuItem>
            <MenuItem value={70}>70% - Good Match</MenuItem>
            <MenuItem value={60}>60% - Fair Match</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleCreate} 
          variant="contained" 
          color="primary"
          disabled={selectedUsers.length !== 2}
        >
          Create Match
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    username: '',
  });
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [createMatchDialogOpen, setCreateMatchDialogOpen] = useState(false);

  const columns: GridColDef[] = [
    { field: 'username', headerName: 'Username', width: 130 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: params.value === 'active' ? 'success.main' : 'error.main',
          }}
        >
          {params.value === 'active' ? <CheckCircleIcon sx={{ mr: 1 }} /> : <BlockIcon sx={{ mr: 1 }} />}
          {params.value}
        </Box>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueGetter: (params: GridValueGetterParams) => {
        if (!params.value) return '';
        return params.value.toDate ? params.value.toDate().toLocaleDateString() : new Date(params.value).toLocaleDateString();
      },
    },
    {
      field: 'lastActive',
      headerName: 'Last Active',
      width: 180,
      valueGetter: (params: GridValueGetterParams) => {
        if (!params.value) return '';
        return params.value.toDate ? params.value.toDate().toLocaleDateString() : new Date(params.value).toLocaleDateString();
      },
    },
    { field: 'matchCount', headerName: 'Matches', width: 100 },
    { field: 'reportCount', headerName: 'Reports', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            color="primary"
            size="small"
            onClick={() => handleEditClick(params.row)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color={params.row.status === 'active' ? 'error' : 'success'}
            size="small"
            onClick={() => handleToggleStatus(params.row)}
          >
            {params.row.status === 'active' ? <BlockIcon /> : <CheckCircleIcon />}
          </IconButton>
          <IconButton
            color="error"
            size="small"
            onClick={() => handleDeleteClick(params.row)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const usersData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const userData = doc.data();
          
          // Get match count - using 'users' field instead of 'participants'
          const matchesQuery = query(
            collection(db, 'matches'),
            where('users', 'array-contains', doc.id)
          );
          const matchesSnap = await getDocs(matchesQuery);
          
          // Get report count
          const reportsQuery = query(
            collection(db, 'reports'),
            where('reportedUserId', '==', doc.id)
          );
          const reportsSnap = await getDocs(reportsQuery);

          // Keep Firestore timestamps as is, don't convert them yet
          return {
            id: doc.id,
            ...userData,
            createdAt: userData.createdAt,
            lastActive: userData.lastActive,
            matchCount: matchesSnap.size,
            reportCount: reportsSnap.size,
          } as User;
        })
      );
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      username: user.username,
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = user.status === 'active' ? 'blocked' : 'active';
      await updateDoc(doc(db, 'users', user.id), {
        status: newStatus,
      });
      
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Failed to update user status');
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedUser) return;
    
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        name: editForm.name,
        email: editForm.email,
        username: editForm.username,
      });
      
      setUsers(users.map(user =>
        user.id === selectedUser.id
          ? { ...user, ...editForm }
          : user
      ));
      
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteDoc(doc(db, 'users', selectedUser.id));
      setUsers(users.filter(user => user.id !== selectedUser.id));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    }
  };

  const handleSelectionChange = (selectionModel: GridRowSelectionModel) => {
    const selectedIds = selectionModel as string[];
    const selected = users.filter(user => selectedIds.includes(user.id));
    setSelectedUsers(selected);
  };

  const handleCreateMatch = async (compatibility: number) => {
    if (selectedUsers.length !== 2) return;

    try {
      const [user1, user2] = selectedUsers;
      
      // Create the match document
      const matchRef = await addDoc(collection(db, 'matches'), {
        users: [user1.id, user2.id],
        createdAt: serverTimestamp(),
        lastInteraction: serverTimestamp(),
        status: 'active',
        compatibility: compatibility,
        createdBy: 'admin',
      });

      // Update match counts for both users
      await Promise.all([
        updateDoc(doc(db, 'users', user1.id), {
          matchCount: (user1.matchCount || 0) + 1,
        }),
        updateDoc(doc(db, 'users', user2.id), {
          matchCount: (user2.matchCount || 0) + 1,
        }),
      ]);

      // Refresh users data
      await fetchUsers();

      setError('');
      alert('Match created successfully!');
    } catch (error) {
      console.error('Error creating match:', error);
      setError('Failed to create match');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        User Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<FavoriteIcon />}
          onClick={() => setCreateMatchDialogOpen(true)}
          disabled={selectedUsers.length !== 2}
          sx={{ mr: 2 }}
        >
          Create Match
        </Button>
        {selectedUsers.length > 0 && (
          <Typography variant="body2" color="textSecondary" component="span">
            {selectedUsers.length === 2
              ? 'Ready to create match!'
              : `Select one more user to create a match (${selectedUsers.length}/2)`}
          </Typography>
        )}
      </Box>

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
            rows={users}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            pageSizeOptions={[10]}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={handleSelectionChange}
            rowSelectionModel={selectedUsers.map(user => user.id)}
          />
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Email"
            fullWidth
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Username"
            fullWidth
            value={editForm.username}
            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this user? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Match Dialog */}
      <CreateMatchDialog
        open={createMatchDialogOpen}
        onClose={() => setCreateMatchDialogOpen(false)}
        selectedUsers={selectedUsers}
        onCreateMatch={handleCreateMatch}
      />
    </Box>
  );
} 