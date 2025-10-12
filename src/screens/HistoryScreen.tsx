import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../components/AppHeader";
import { theme } from "../theme/theme";

interface DrawHistory {
  id: string;
  timestamp: number;
  type: "teams" | "players" | "roles";
  title: string;
  description: string;
  participants: string[];
  results: any;
  settings: {
    balanceTeams?: boolean;
    numberOfTeams?: number;
    teamNames?: string[];
    colors?: string[];
  };
}

const HistoryScreen = () => {
  const [history, setHistory] = useState<DrawHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<DrawHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "teams" | "players" | "roles"
  >("all");
  const [selectedItem, setSelectedItem] = useState<DrawHistory | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [history, searchQuery, selectedFilter]);

  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem("quick_draw_history");
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(
          parsedHistory.sort(
            (a: DrawHistory, b: DrawHistory) => b.timestamp - a.timestamp
          )
        );
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = history;

    // Filtrar por tipo
    if (selectedFilter !== "all") {
      filtered = filtered.filter((item) => item.type === selectedFilter);
    }

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.participants.some((p) => p.toLowerCase().includes(query))
      );
    }

    setFilteredHistory(filtered);
  };

  const clearHistory = () => {
    Alert.alert(
      "Limpar Histórico",
      "Deseja remover todo o histórico de sorteios? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("quick_draw_history");
              setHistory([]);
              setFilteredHistory([]);
              Alert.alert("Sucesso", "Histórico limpo com sucesso!");
            } catch (error) {
              Alert.alert("Erro", "Não foi possível limpar o histórico");
            }
          },
        },
      ]
    );
  };

  const deleteHistoryItem = (id: string) => {
    Alert.alert("Remover Item", "Deseja remover este item do histórico?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            const newHistory = history.filter((item) => item.id !== id);
            await AsyncStorage.setItem(
              "quick_draw_history",
              JSON.stringify(newHistory)
            );
            setHistory(newHistory);
          } catch (error) {
            Alert.alert("Erro", "Não foi possível remover o item");
          }
        },
      },
    ]);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "teams":
        return "people";
      case "players":
        return "person";
      case "roles":
        return "star";
      default:
        return "dice";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "teams":
        return "Sorteio de Times";
      case "players":
        return "Sorteio de Jogadores";
      case "roles":
        return "Sorteio de Funções";
      default:
        return "Sorteio";
    }
  };

  const renderHistoryItem = ({ item }: { item: DrawHistory }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => {
        setSelectedItem(item);
        setShowDetails(true);
      }}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemIcon}>
          <Ionicons
            name={getTypeIcon(item.type) as any}
            size={24}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>
          <Text style={styles.itemDate}>{formatDate(item.timestamp)}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteHistoryItem(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.itemFooter}>
        <View style={styles.typeTag}>
          <Text style={styles.typeTagText}>{getTypeLabel(item.type)}</Text>
        </View>
        <Text style={styles.participantCount}>
          {item.participants.length} participantes
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderDetailsModal = () => {
    if (!selectedItem) return null;

    return (
      <Modal
        visible={showDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedItem.title}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetails(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>📅 Data e Hora:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selectedItem.timestamp)}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>🎯 Tipo:</Text>
                <Text style={styles.detailValue}>
                  {getTypeLabel(selectedItem.type)}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>📝 Descrição:</Text>
                <Text style={styles.detailValue}>
                  {selectedItem.description}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>
                  👥 Participantes ({selectedItem.participants.length}):
                </Text>
                {selectedItem.participants.map((participant, index) => (
                  <Text key={index} style={styles.participantItem}>
                    • {participant}
                  </Text>
                ))}
              </View>

              {selectedItem.type === "teams" && selectedItem.results && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>
                    🏆 Resultado dos Times:
                  </Text>
                  {Object.entries(selectedItem.results).map(
                    ([teamName, players]: [string, any]) => (
                      <View key={teamName} style={styles.teamResult}>
                        <Text style={styles.teamName}>{teamName}:</Text>
                        {Array.isArray(players) &&
                          players.map((player, index) => (
                            <Text key={index} style={styles.teamPlayer}>
                              • {player.name}
                            </Text>
                          ))}
                      </View>
                    )
                  )}
                </View>
              )}

              {selectedItem.settings && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>⚙️ Configurações:</Text>
                  {selectedItem.settings.numberOfTeams && (
                    <Text style={styles.settingItem}>
                      • Número de times: {selectedItem.settings.numberOfTeams}
                    </Text>
                  )}
                  {selectedItem.settings.balanceTeams !== undefined && (
                    <Text style={styles.settingItem}>
                      • Equilibrar times:{" "}
                      {selectedItem.settings.balanceTeams ? "Sim" : "Não"}
                    </Text>
                  )}
                  {selectedItem.settings.teamNames &&
                    selectedItem.settings.teamNames.length > 0 && (
                      <Text style={styles.settingItem}>
                        • Names personalizados:{" "}
                        {selectedItem.settings.teamNames.join(", ")}
                      </Text>
                    )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const filters = [
    { key: "all", label: "Todos", icon: "apps" },
    { key: "teams", label: "Times", icon: "people" },
    { key: "players", label: "Jogadores", icon: "person" },
    { key: "roles", label: "Funções", icon: "star" },
  ];

  return (
    <View style={styles.container}>
      <AppHeader title="Histórico de Sorteios" icon="time" theme="light" />

      <View style={styles.content}>
        {/* Barra de Busca */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search"
              size={20}
              color={theme.colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar sorteios..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
            <Ionicons name="trash" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        {/* Filtros */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                selectedFilter === filter.key && styles.activeFilterChip,
              ]}
              onPress={() => setSelectedFilter(filter.key as any)}
            >
              <Ionicons
                name={filter.icon as any}
                size={16}
                color={
                  selectedFilter === filter.key
                    ? theme.colors.white
                    : theme.colors.primary
                }
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === filter.key && styles.activeFilterChipText,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista do Histórico */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando histórico...</Text>
          </View>
        ) : filteredHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="time-outline"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>
              {history.length === 0
                ? "Nenhum sorteio realizado"
                : "Nenhum resultado encontrado"}
            </Text>
            <Text style={styles.emptyDescription}>
              {history.length === 0
                ? "Os sorteios realizados aparecerão aqui"
                : "Tente ajustar os filtros ou termo de busca"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {renderDetailsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: theme.colors.text,
  },
  clearButton: {
    width: 44,
    height: 44,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  activeFilterChip: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  activeFilterChipText: {
    color: theme.colors.white,
  },
  listContainer: {
    paddingBottom: 20,
  },
  historyItem: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    padding: 4,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeTag: {
    backgroundColor: theme.colors.primary + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeTagText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  participantCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  participantItem: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
    lineHeight: 20,
  },
  teamResult: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  teamName: {
    fontSize: 15,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 4,
  },
  teamPlayer: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  settingItem: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
    lineHeight: 20,
  },
});

export default HistoryScreen;
