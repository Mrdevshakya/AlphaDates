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
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridValueGetterParams,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import {
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface Report {
  id: string;
  type: string;
  status: 'pending' | 'resolved' | 'dismissed';
  reportedUserId: string;
  reportedByUserId: string;
  reason: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  reportedUser?: {
    name: string;
    username: string;
  };
  reportedBy?: {
    name: string;
    username: string;
  };
}

const reportTypes = [
  'inappropriate_content',
  'harassment',
  'spam',
  'fake_profile',
  'underage',
  'other',
];

const reportStatuses = ['pending', 'resolved', 'dismissed'];

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const columns: GridColDef[] = [
    {
      field: 'type',
      headerName: 'Type',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value.replace('_', ' ')}
          color={
            params.value === 'inappropriate_content' || params.value === 'harassment'
              ? 'error'
              : params.value === 'spam'
              ? 'warning'
              : 'default'
          }
          size="small"
        />
      ),
    },
    {
      field: 'reportedUser',
      headerName: 'Reported User',
      width: 150,
      valueGetter: (params: GridValueGetterParams) =>
        params.value?.username || 'Unknown',
    },
    {
      field: 'reportedBy',
      headerName: 'Reported By',
      width: 150,
      valueGetter: (params: GridValueGetterParams) =>
        params.value?.username || 'Unknown',
    },
    { field: 'reason', headerName: 'Reason', width: 200 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={
            params.value === 'pending'
              ? 'warning'
              : params.value === 'resolved'
              ? 'success'
              : 'default'
          }
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueGetter: (params: GridValueGetterParams) =>
        params.value?.toDate().toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
          <IconButton
            color="success"
            size="small"
            onClick={() => handleUpdateStatus(params.row, 'resolved')}
            disabled={params.row.status === 'resolved'}
          >
            <CheckCircleIcon />
          </IconButton>
          <IconButton
            color="warning"
            size="small"
            onClick={() => handleUpdateStatus(params.row, 'dismissed')}
            disabled={params.row.status === 'dismissed'}
          >
            <BlockIcon />
          </IconButton>
          <IconButton
            color="error"
            size="small"
            onClick={() => handleDeleteClick(params.row)}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      ),
    },
  ];

  useEffect(() => {
    fetchReports();
  }, [filterType, filterStatus]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let reportsQuery = query(
        collection(db, 'reports'),
        orderBy('createdAt', 'desc')
      );

      if (filterType !== 'all') {
        reportsQuery = query(reportsQuery, where('type', '==', filterType));
      }

      if (filterStatus !== 'all') {
        reportsQuery = query(reportsQuery, where('status', '==', filterStatus));
      }

      const snapshot = await getDocs(reportsQuery);
      
      const reportsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const reportData = doc.data();
          
          // Fetch reported user data
          const reportedUserDoc = await getDocs(
            query(collection(db, 'users'), where('id', '==', reportData.reportedUserId))
          );
          
          // Fetch reporter data
          const reporterDoc = await getDocs(
            query(collection(db, 'users'), where('id', '==', reportData.reportedByUserId))
          );
          
          return {
            id: doc.id,
            ...reportData,
            reportedUser: reportedUserDoc.docs[0]?.data(),
            reportedBy: reporterDoc.docs[0]?.data(),
          } as Report;
        })
      );
      
      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (report: Report, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'reports', report.id), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      
      setReports(reports.map(r =>
        r.id === report.id
          ? { ...r, status: newStatus as Report['status'], updatedAt: new Date() }
          : r
      ));
    } catch (error) {
      console.error('Error updating report status:', error);
      setError('Failed to update report status');
    }
  };

  const handleDeleteClick = (report: Report) => {
    setSelectedReport(report);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedReport) return;
    
    try {
      await deleteDoc(doc(db, 'reports', selectedReport.id));
      setReports(reports.filter(report => report.id !== selectedReport.id));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting report:', error);
      setError('Failed to delete report');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Reports Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Type</InputLabel>
          <Select
            value={filterType}
            label="Filter by Type"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value="all">All Types</MenuItem>
            {reportTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type.replace('_', ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={filterStatus}
            label="Filter by Status"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            {reportStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
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
            rows={reports}
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

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Report</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this report? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 