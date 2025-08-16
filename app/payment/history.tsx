import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { usePayment } from '../context/PaymentContext';
import { format } from 'date-fns';

interface PaymentHistoryItem {
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
  planName?: string;
}

export default function PaymentHistoryScreen() {
  const { user } = useAuth();
  const { state, loadPaymentHistory } = usePayment();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPaymentHistory();
    setRefreshing(false);
  };

  const renderPaymentItem = ({ item }: { item: PaymentHistoryItem }) => {
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'paid':
        case 'completed':
          return '#28a745';
        case 'failed':
          return '#dc3545';
        case 'pending':
          return '#ffc107';
        default:
          return '#6c757d';
      }
    };

    return (
      <View style={styles.paymentItem}>
        <View style={styles.paymentHeader}>
          <Text style={styles.amount}>₹{item.amount.toFixed(2)}</Text>
          <Text style={[styles.status, { color: getStatusColor(item.status) }]}> 
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
        
        {item.planName && (
          <Text style={styles.planName}>{item.planName}</Text>
        )}
        
        <Text style={styles.date}>
          {format(new Date(item.createdAt), 'MMM dd, yyyy hh:mm a')}
        </Text>
      </View>
    );
  };

  if (state.loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading payment history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment History</Text>
        <Text style={styles.subtitle}>Your transaction history</Text>
      </View>
      
      {state.paymentHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No payment history found</Text>
          <Text style={styles.emptySubtext}>
            Your payment transactions will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={state.paymentHistory}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContainer: {
    padding: 20,
  },
  paymentItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  planName: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: '#888',
  },
});
