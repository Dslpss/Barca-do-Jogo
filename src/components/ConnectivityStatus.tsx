import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useConnectivity } from '../hooks/useConnectivity';

interface ConnectivityStatusProps {
  showWhenOnline?: boolean;
  style?: any;
}

export const ConnectivityStatus: React.FC<ConnectivityStatusProps> = ({
  showWhenOnline = false,
  style,
}) => {
  const { isOnline, isChecking, lastCheck } = useConnectivity();

  // Se está online e não deve mostrar quando online, não renderiza
  if (isOnline && !showWhenOnline) {
    return null;
  }

  const getStatusText = () => {
    if (isChecking) {
      return 'Verificando conexão...';
    }
    return isOnline ? 'Online' : 'Offline';
  };

  const getStatusColor = () => {
    if (isChecking) {
      return '#FFA500'; // Orange
    }
    return isOnline ? '#4CAF50' : '#F44336'; // Green : Red
  };

  const formatLastCheck = () => {
    if (!lastCheck) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastCheck.getTime()) / 1000);
    
    if (diff < 60) {
      return `há ${diff}s`;
    } else if (diff < 3600) {
      return `há ${Math.floor(diff / 60)}min`;
    } else {
      return `há ${Math.floor(diff / 3600)}h`;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.indicator, { backgroundColor: getStatusColor() }]} />
      <Text style={[styles.text, { color: getStatusColor() }]}>
        {getStatusText()}
      </Text>
      {!isOnline && lastCheck && (
        <Text style={styles.lastCheck}>
          Última verificação {formatLastCheck()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    marginVertical: 4,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  lastCheck: {
    fontSize: 10,
    color: '#666',
    marginLeft: 8,
  },
});

export default ConnectivityStatus;