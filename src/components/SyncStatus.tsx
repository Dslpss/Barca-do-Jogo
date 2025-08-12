import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme/theme";

interface SyncStatusProps {
  isOnline: boolean;
  isLoading: boolean;
  lastSync?: Date;
}

export default function SyncStatus({
  isOnline,
  isLoading,
  lastSync,
}: SyncStatusProps) {
  const getStatusColor = () => {
    if (isLoading) return "#FFA500"; // Orange
    if (isOnline) return "#4CAF50"; // Green
    return "#F44336"; // Red
  };

  const getStatusText = () => {
    if (isLoading) return "Sincronizando...";
    if (isOnline) return "Online";
    return "Offline";
  };

  const getStatusIcon = () => {
    if (isLoading) return "sync";
    if (isOnline) return "cloud-done-outline";
    return "cloud-offline-outline";
  };

  const formatLastSync = () => {
    if (!lastSync) return null;
    return `Última sync: ${lastSync.toLocaleTimeString()}`;
  };

  return (
    <View style={styles.container}>
      <View
        style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}
      >
        <Ionicons
          name={getStatusIcon()}
          size={12}
          color="#fff"
          style={isLoading ? styles.rotating : {}}
        />
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>
      {lastSync && !isLoading && (
        <Text style={styles.lastSyncText}>{formatLastSync()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 8,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  lastSyncText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 10,
    marginTop: 4,
  },
  rotating: {
    transform: [{ rotate: "360deg" }],
  },
});
