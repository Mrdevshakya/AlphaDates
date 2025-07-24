import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  collection,
  query,
  getDocs,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsData {
  userGrowth: {
    labels: string[];
    data: number[];
  };
  matchesStats: {
    labels: string[];
    data: number[];
  };
  userActivity: {
    labels: string[];
    data: number[];
  };
  reportDistribution: {
    labels: string[];
    data: number[];
  };
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('week');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userGrowth: { labels: [], data: [] },
    matchesStats: { labels: [], data: [] },
    userActivity: { labels: [], data: [] },
    reportDistribution: { labels: [], data: [] },
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Get date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Fetch user growth data
      const usersRef = collection(db, 'users');
      const usersQuery = query(
        usersRef,
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt')
      );
      const usersSnapshot = await getDocs(usersQuery);

      // Fetch matches data
      const matchesRef = collection(db, 'matches');
      const matchesQuery = query(
        matchesRef,
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt')
      );
      const matchesSnapshot = await getDocs(matchesQuery);

      // Process data
      const dateLabels = generateDateLabels(startDate, endDate);
      const userGrowthData = processTimeSeriesData(usersSnapshot.docs, dateLabels);
      const matchesData = processTimeSeriesData(matchesSnapshot.docs, dateLabels);

      setAnalyticsData({
        userGrowth: {
          labels: dateLabels,
          data: userGrowthData,
        },
        matchesStats: {
          labels: dateLabels,
          data: matchesData,
        },
        userActivity: {
          labels: ['Active', 'Inactive', 'New'],
          data: [65, 25, 10], // Replace with actual data
        },
        reportDistribution: {
          labels: ['Spam', 'Inappropriate', 'Harassment', 'Fake Profile', 'Other'],
          data: [12, 19, 3, 5, 2], // Replace with actual data
        },
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generateDateLabels = (start: Date, end: Date): string[] => {
    const labels = [];
    const current = new Date(start);
    while (current <= end) {
      labels.push(current.toLocaleDateString());
      current.setDate(current.getDate() + 1);
    }
    return labels;
  };

  const processTimeSeriesData = (docs: any[], labels: string[]): number[] => {
    const data = new Array(labels.length).fill(0);
    docs.forEach(doc => {
      const date = doc.data().createdAt.toDate().toLocaleDateString();
      const index = labels.indexOf(date);
      if (index !== -1) {
        data[index]++;
      }
    });
    return data;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4">
          Analytics
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="week">Last 7 Days</MenuItem>
            <MenuItem value="month">Last 30 Days</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '400px',
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                User Growth
              </Typography>
              <Line
                data={{
                  labels: analyticsData.userGrowth.labels,
                  datasets: [
                    {
                      label: 'New Users',
                      data: analyticsData.userGrowth.data,
                      borderColor: '#FF4B6A',
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                User Activity
              </Typography>
              <Doughnut
                data={{
                  labels: analyticsData.userActivity.labels,
                  datasets: [
                    {
                      data: analyticsData.userActivity.data,
                      backgroundColor: [
                        '#4CAF50',
                        '#FFC107',
                        '#FF4B6A',
                      ],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Matches Over Time
              </Typography>
              <Bar
                data={{
                  labels: analyticsData.matchesStats.labels,
                  datasets: [
                    {
                      label: 'Matches',
                      data: analyticsData.matchesStats.data,
                      backgroundColor: '#FF4B6A',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Report Distribution
              </Typography>
              <Doughnut
                data={{
                  labels: analyticsData.reportDistribution.labels,
                  datasets: [
                    {
                      data: analyticsData.reportDistribution.data,
                      backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                      ],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
} 