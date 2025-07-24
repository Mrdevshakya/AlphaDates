import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  People as PeopleIcon,
  Favorite as FavoriteIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Report as ReportIcon,
} from '@mui/icons-material';
import {
  collection,
  query,
  where,
  getDocs,
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

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  loading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, loading }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      {loading ? (
        <CircularProgress size={20} />
      ) : (
        <Typography variant="h4">{value}</Typography>
      )}
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMatches: 0,
    totalStories: 0,
    activeReports: 0,
  });
  const [userGrowthData, setUserGrowthData] = useState<any>(null);
  const [matchesData, setMatchesData] = useState<any>(null);
  const [reportTypesData, setReportTypesData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch basic stats
        const [usersSnap, matchesSnap, storiesSnap, reportsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'matches')),
          getDocs(collection(db, 'stories')),
          getDocs(query(collection(db, 'reports'), where('status', '==', 'active'))),
        ]);

        setStats({
          totalUsers: usersSnap.size,
          totalMatches: matchesSnap.size,
          totalStories: storiesSnap.size,
          activeReports: reportsSnap.size,
        });

        // Prepare user growth data (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();

        const userGrowth = {
          labels: last7Days,
          datasets: [{
            label: 'New Users',
            data: last7Days.map(() => Math.floor(Math.random() * 50)), // Replace with actual data
            borderColor: theme.palette.primary.main,
            tension: 0.4,
          }],
        };

        // Prepare matches data (last 6 months)
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          return date.toLocaleString('default', { month: 'short' });
        }).reverse();

        const matchesStats = {
          labels: last6Months,
          datasets: [{
            label: 'Matches',
            data: last6Months.map(() => Math.floor(Math.random() * 100)), // Replace with actual data
            backgroundColor: theme.palette.primary.main,
          }],
        };

        // Prepare report types data
        const reportTypes = {
          labels: ['Inappropriate Content', 'Spam', 'Harassment', 'Fake Profile', 'Other'],
          datasets: [{
            data: [12, 19, 3, 5, 2], // Replace with actual data
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
            ],
          }],
        };

        setUserGrowthData(userGrowth);
        setMatchesData(matchesStats);
        setReportTypesData(reportTypes);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [theme.palette.primary.main]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<PeopleIcon color="primary" />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Matches"
            value={stats.totalMatches}
            icon={<FavoriteIcon color="primary" />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Stories"
            value={stats.totalStories}
            icon={<PhotoLibraryIcon color="primary" />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Reports"
            value={stats.activeReports}
            icon={<ReportIcon color="primary" />}
            loading={loading}
          />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              User Growth
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : (
              userGrowthData && (
                <Line
                  data={userGrowthData}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              )
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Report Types
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : (
              reportTypesData && (
                <Doughnut
                  data={reportTypesData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              )
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Monthly Matches
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : (
              matchesData && (
                <Bar
                  data={matchesData}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              )
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 