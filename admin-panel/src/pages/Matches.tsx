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
  Autocomplete,
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
  Visibility as VisibilityIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { collection, query, getDocs, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Match {
  id: string;
  users: string[];
  createdAt: Date;
  lastInteraction: Date;
  status: 'active' | 'inactive';
  compatibility: number;
  userProfiles?: {
    [key: string]: {
      name: string;
      username: string;
    };
  };
}

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createMatchOpen, setCreateMatchOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  const columns: GridColDef[] = [
    {
      field: 'users',
      headerName: 'Users',
      width: 300,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          {Object.values(params.row.userProfiles || {}).map((profile: any) => (
            <Chip
              key={profile.username}
              label={profile.username}
              variant="outlined"
              size="small"
            />
          ))}
        </Stack>
      ),
    },
    {
      field: 'compatibility',
      headerName: 'Compatibility',
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: params.value >= 80 ? '#4caf50' : params.value >= 60 ? '#ff9800' : '#f44336',
              color: 'white',
            }}
          >
            {params.value}%
          </Box>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'active' ? 'success' : 'default'}
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
      field: 'lastInteraction',
      headerName: 'Last Interaction',
      width: 180,
      valueGetter: (params: GridValueGetterParams) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '';
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton
            color="primary"
            size="small"
            onClick={() => handleViewMatch(params.row)}
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
            color="error"
            size="small"
            onClick={() => handleDeleteMatch(params.row)}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      ),
    },
  ];

  useEffect(() => {
    fetchMatches();
    fetchUsers();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const matchesRef = collection(db, 'matches');
      const snapshot = await getDocs(matchesRef);
      
      const matchesData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const matchData = doc.data();
          
          // Fetch user profiles for each match
          const userProfiles: { [key: string]: any } = {};
          for (const userId of matchData.users) {
            const userDoc = await getDocs(query(collection(db, 'users')));
            const userData = userDoc.docs.find(d => d.id === userId)?.data();
            if (userData) {
              userProfiles[userId] = {
                name: userData.name,
                username: userData.username,
              };
            }
          }
          
          // Convert Firestore timestamps to Date objects
          const createdAt = matchData.createdAt?.toDate() || new Date();
          const lastInteraction = matchData.lastInteraction?.toDate() || new Date();

          return {
            id: doc.id,
            users: matchData.users,
            createdAt,
            lastInteraction,
            status: matchData.status,
            compatibility: matchData.compatibility,
            userProfiles,
          } as Match;
        })
      );
      
      setMatches(matchesData);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    }
  };

  const handleCreateMatch = async () => {
    if (selectedUsers.length !== 2) {
      setError('Please select exactly 2 users to create a match');
      return;
    }

    setCreating(true);
    try {
      // Create match in the regular 'matches' collection instead of 'adminMatches'
      // This way it will appear as a normal match to users
      await addDoc(collection(db, 'matches'), {
        users: [selectedUsers[0].id, selectedUsers[1].id],
        createdAt: serverTimestamp(),
        lastInteraction: serverTimestamp(),
        isMatched: true, // Admin matches are automatically matched
        status: 'active',
        compatibility: 95, // Default high compatibility for admin matches
        source: 'admin' // Internal tracking only
      });

      setCreateMatchOpen(false);
      setSelectedUsers([]);
      fetchMatches(); // Refresh the matches list
      setError('');
    } catch (error) {
      console.error('Error creating match:', error);
      setError('Failed to create match');
    } finally {
      setCreating(false);
    }
  };

  const handleViewMatch = (match: Match) => {
    // Implement match details view
    console.log('View match:', match);
  };

  const handleDeleteMatch = async (match: Match) => {
    try {
      await deleteDoc(doc(db, 'matches', match.id));
      setMatches(matches.filter(m => m.id !== match.id));
    } catch (error) {
      console.error('Error deleting match:', error);
      setError('Failed to delete match');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Matches
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateMatchOpen(true)}
          sx={{ backgroundColor: '#FF4B6A', '&:hover': { backgroundColor: '#FF6B8A' } }}
        >
          Create Match
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
            rows={matches}
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
    </Box>
  );
} 