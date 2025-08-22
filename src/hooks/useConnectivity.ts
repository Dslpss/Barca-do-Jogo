import { useState, useEffect } from 'react';
import connectivityService from '../services/connectivityService';

export interface ConnectivityState {
  isOnline: boolean;
  isChecking: boolean;
  lastCheck: Date | null;
  lastKnownState: { isOnline: boolean; timestamp: string } | null;
}

export const useConnectivity = () => {
  const [state, setState] = useState<ConnectivityState>({
    isOnline: connectivityService.isOnline(),
    isChecking: false,
    lastCheck: connectivityService.getLastConnectivityCheck(),
    lastKnownState: null
  });

  useEffect(() => {
    // Carregar último estado conhecido
    const loadLastKnownState = async () => {
      const lastKnown = await connectivityService.getLastKnownConnectivity();
      setState(prev => ({ ...prev, lastKnownState: lastKnown }));
    };
    loadLastKnownState();

    // Adicionar listener para mudanças de conectividade
    const removeListener = connectivityService.addConnectivityListener((isOnline) => {
      setState(prev => ({
        ...prev,
        isOnline,
        lastCheck: connectivityService.getLastConnectivityCheck(),
        isChecking: false
      }));
    });

    return () => {
      removeListener();
    };
  }, []);

  const checkConnectivity = async () => {
    setState(prev => ({ ...prev, isChecking: true }));
    
    try {
      const isOnline = await connectivityService.checkConnectivity();
      setState(prev => ({
        ...prev,
        isOnline,
        lastCheck: connectivityService.getLastConnectivityCheck(),
        isChecking: false
      }));
      return isOnline;
    } catch (error) {
      setState(prev => ({ ...prev, isChecking: false }));
      throw error;
    }
  };

  return {
    ...state,
    checkConnectivity,
    forceCheck: checkConnectivity
  };
};

export default useConnectivity;