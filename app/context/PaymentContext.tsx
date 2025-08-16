import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { PaymentOrder } from '../../src/types';
import { SubscriptionService } from '../utils/subscription';
import { useAuth } from './AuthContext';

// Payment state interface
interface PaymentState {
  paymentHistory: PaymentOrder[];
  loading: boolean;
  error: string | null;
}

// Action types
type PaymentAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PAYMENT_HISTORY'; payload: PaymentOrder[] }
  | { type: 'ADD_PAYMENT'; payload: PaymentOrder }
  | { type: 'SET_ERROR'; payload: string | null };

// Initial state
const initialState: PaymentState = {
  paymentHistory: [],
  loading: false,
  error: null,
};

// Reducer
const paymentReducer = (state: PaymentState, action: PaymentAction): PaymentState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_PAYMENT_HISTORY':
      return { ...state, paymentHistory: action.payload };
    case 'ADD_PAYMENT':
      return { ...state, paymentHistory: [action.payload, ...state.paymentHistory] };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

// Context interface
interface PaymentContextType {
  state: PaymentState;
  loadPaymentHistory: () => Promise<void>;
  clearError: () => void;
}

// Create context
const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

// Provider component
export const PaymentProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(paymentReducer, initialState);
  const { user } = useAuth();

  // Load payment history
  const loadPaymentHistory = async () => {
    if (!user) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const history = await SubscriptionService.getUserPaymentHistory(user.uid);
      dispatch({ type: 'SET_PAYMENT_HISTORY', payload: history });
    } catch (error) {
      console.error('Error loading payment history:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load payment history' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Load payment history when user changes
  useEffect(() => {
    if (user) {
      loadPaymentHistory();
    } else {
      dispatch({ type: 'SET_PAYMENT_HISTORY', payload: [] });
    }
  }, [user]);

  const value = {
    state,
    loadPaymentHistory,
    clearError,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export default PaymentProvider;

// Hook to use payment context
export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};
