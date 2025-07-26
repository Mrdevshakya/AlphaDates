import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface CouponCode {
  id: string;
  code: string;
  discountPercentage: number;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usedCount: number;
  applicablePlans: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CouponFormData {
  code: string;
  discountPercentage: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  usageLimit: string;
  applicablePlans: string[];
}

const SUBSCRIPTION_PLANS = [
  { id: 'monthly', name: '1 Month' },
  { id: 'quarterly', name: '3 Months' },
  { id: 'halfyearly', name: '6 Months' },
  { id: 'yearly', name: '12 Months' },
];

export default function Coupons() {
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponCode | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    discountPercentage: 10,
    isActive: true,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: '',
    applicablePlans: [],
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const couponsRef = collection(db, 'coupons');
      const snapshot = await getDocs(couponsRef);
      
      const couponsData: CouponCode[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const coupon: CouponCode = {
          id: doc.id,
          ...data,
          validFrom: data.validFrom instanceof Timestamp ? data.validFrom.toDate() : new Date(data.validFrom),
          validUntil: data.validUntil instanceof Timestamp ? data.validUntil.toDate() : new Date(data.validUntil),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as CouponCode;
        couponsData.push(coupon);
      });
      
      setCoupons(couponsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error fetching coupons:', error);
      showSnackbar('Error fetching coupons', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (coupon?: CouponCode) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
        isActive: coupon.isActive,
        validFrom: coupon.validFrom.toISOString().split('T')[0],
        validUntil: coupon.validUntil.toISOString().split('T')[0],
        usageLimit: coupon.usageLimit?.toString() || '',
        applicablePlans: coupon.applicablePlans,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        discountPercentage: 10,
        isActive: true,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usageLimit: '',
        applicablePlans: [],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCoupon(null);
  };

  const handleFormChange = (field: keyof CouponFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        discountPercentage: formData.discountPercentage,
        isActive: formData.isActive,
        validFrom: new Date(formData.validFrom),
        validUntil: new Date(formData.validUntil),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        applicablePlans: formData.applicablePlans,
        createdBy: 'admin', // You should get this from auth context
        updatedAt: Timestamp.now(),
      };

      if (editingCoupon) {
        // Update existing coupon
        await updateDoc(doc(db, 'coupons', editingCoupon.id), couponData);
        showSnackbar('Coupon updated successfully', 'success');
      } else {
        // Create new coupon
        await addDoc(collection(db, 'coupons'), {
          ...couponData,
          usedCount: 0,
          createdAt: Timestamp.now(),
        });
        showSnackbar('Coupon created successfully', 'success');
      }

      handleCloseDialog();
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
      showSnackbar('Error saving coupon', 'error');
    }
  };

  const handleDelete = async (couponId: string) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteDoc(doc(db, 'coupons', couponId));
        showSnackbar('Coupon deleted successfully', 'success');
        fetchCoupons();
      } catch (error) {
        console.error('Error deleting coupon:', error);
        showSnackbar('Error deleting coupon', 'error');
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusChip = (coupon: CouponCode) => {
    const now = new Date();
    if (!coupon.isActive) {
      return <Chip label="Inactive" color="default" size="small" />;
    }
    if (now < coupon.validFrom) {
      return <Chip label="Scheduled" color="info" size="small" />;
    }
    if (now > coupon.validUntil) {
      return <Chip label="Expired" color="error" size="small" />;
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return <Chip label="Limit Reached" color="warning" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Coupon Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Coupon
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Coupons
              </Typography>
              <Typography variant="h4">
                {coupons.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Coupons
              </Typography>
              <Typography variant="h4">
                {coupons.filter(c => c.isActive && new Date() >= c.validFrom && new Date() <= c.validUntil).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Usage
              </Typography>
              <Typography variant="h4">
                {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Expired Coupons
              </Typography>
              <Typography variant="h4">
                {coupons.filter(c => new Date() > c.validUntil).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Coupons Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Discount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Valid Period</TableCell>
              <TableCell>Usage</TableCell>
              <TableCell>Plans</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No coupons found
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {coupon.code}
                    </Typography>
                  </TableCell>
                  <TableCell>{coupon.discountPercentage}%</TableCell>
                  <TableCell>{getStatusChip(coupon)}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {coupon.usedCount}
                    {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                  </TableCell>
                  <TableCell>
                    {coupon.applicablePlans.length === 0 ? (
                      <Chip label="All Plans" size="small" />
                    ) : (
                      coupon.applicablePlans.map((planId) => {
                        const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
                        return (
                          <Chip
                            key={planId}
                            label={plan?.name || planId}
                            size="small"
                            sx={{ mr: 0.5 }}
                          />
                        );
                      })
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(coupon)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(coupon.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Coupon Code"
                value={formData.code}
                onChange={(e) => handleFormChange('code', e.target.value.toUpperCase())}
                placeholder="e.g., AMITY2025"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Discount Percentage"
                type="number"
                value={formData.discountPercentage}
                onChange={(e) => handleFormChange('discountPercentage', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valid From"
                type="date"
                value={formData.validFrom}
                onChange={(e) => handleFormChange('validFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valid Until"
                type="date"
                value={formData.validUntil}
                onChange={(e) => handleFormChange('validUntil', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Usage Limit (Optional)"
                type="number"
                value={formData.usageLimit}
                onChange={(e) => handleFormChange('usageLimit', e.target.value)}
                placeholder="Leave empty for unlimited"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Applicable Plans</InputLabel>
                <Select
                  multiple
                  value={formData.applicablePlans}
                  onChange={(e) => handleFormChange('applicablePlans', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const plan = SUBSCRIPTION_PLANS.find(p => p.id === value);
                        return <Chip key={value} label={plan?.name || value} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleFormChange('isActive', e.target.checked)}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCoupon ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}