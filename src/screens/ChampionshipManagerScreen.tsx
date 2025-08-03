import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import AppHeader from "../components/AppHeader";
import { theme } from "../theme/theme";
import { useChampionship } from "../hooks/useChampionship";
import { Championship } from "../types/championship";

const ChampionshipManagerScreen = () => {
  const isFocused = useIsFocused();
  const {
    championships,
    currentChampionship,
    loading,
    error,
    createChampionship,
    selectChampionship,
    loadChampionships,
  } = useChampionship();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChampionshipName, setNewChampionshipName] = useState("");
  const [selectedType, setSelectedType] = useState<
    "pontos_corridos" | "mata_mata" | "grupos"
  >("pontos_corridos");

  React.useEffect(() => {
    if (isFocused) {
      loadChampionships();
    }
  }, [isFocused]);

  const handleCreateChampionship = async () => {
    if (!newChampionshipName.trim()) {
      Alert.alert("Erro", "Digite um nome para o campeonato");
      return;
    }

    try {
      await createChampionship(newChampionshipName.trim(), selectedType);
      setNewChampionshipName("");
      setShowCreateModal(false);
      Alert.alert("Sucesso", "Campeonato criado com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Erro ao criar campeonato");
    }
  };

  const handleSelectChampionship = async (championshipId: string) => {
    try {
      await selectChampionship(championshipId);
      Alert.alert("Sucesso", "Campeonato selecionado!");
    } catch (error) {
      Alert.alert("Erro", "Erro ao selecionar campeonato");
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "pontos_corridos":
        return "Pontos Corridos";
      case "mata_mata":
        return "Mata-Mata";
      case "grupos":
        return "Fase de Grupos";
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "criado":
        return "Criado";
      case "em_andamento":
        return "Em andamento";
      case "finalizado":
        return "Finalizado";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "criado":
        return theme.colors.secondary;
      case "em_andamento":
        return theme.colors.primary;
      case "finalizado":
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderChampionshipItem = ({ item }: { item: Championship }) => (
    <TouchableOpacity
      style={[
        styles.championshipCard,
        currentChampionship?.id === item.id && styles.selectedChampionshipCard,
      ]}
      onPress={() => handleSelectChampionship(item.id)}
    >
      <View style={styles.championshipHeader}>
        <Text style={styles.championshipName}>{item.name}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.championshipInfo}>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Tipo: </Text>
          {getTypeLabel(item.type)}
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Times: </Text>
          {item.teams.length}
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Jogos: </Text>
          {item.matches.length}
        </Text>
      </View>

      <Text style={styles.dateText}>
        Criado em: {new Date(item.createdAt).toLocaleDateString("pt-BR")}
      </Text>

      {currentChampionship?.id === item.id && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedText}>✓ Selecionado</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Gerenciar Campeonatos" icon="trophy" theme="light" />

      <View style={styles.content}>
        {currentChampionship && (
          <View style={styles.currentChampionshipCard}>
            <Text style={styles.currentTitle}>Campeonato Atual:</Text>
            <Text style={styles.currentName}>{currentChampionship.name}</Text>
            <Text style={styles.currentInfo}>
              {getTypeLabel(currentChampionship.type)} •{" "}
              {getStatusLabel(currentChampionship.status)}
            </Text>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Seus Campeonatos</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createButtonText}>+ Novo</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Carregando...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : championships.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum campeonato criado ainda</Text>
            <Text style={styles.emptySubtext}>
              Crie seu primeiro campeonato para começar!
            </Text>
          </View>
        ) : (
          <FlatList
            data={championships}
            renderItem={renderChampionshipItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Modal para criar campeonato */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Novo Campeonato</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome do campeonato"
              value={newChampionshipName}
              onChangeText={setNewChampionshipName}
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.typeLabel}>Tipo de Campeonato:</Text>
            <View style={styles.typeOptions}>
              {[
                { key: "pontos_corridos", label: "Pontos Corridos" },
                { key: "mata_mata", label: "Mata-Mata" },
                { key: "grupos", label: "Fase de Grupos" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.typeOption,
                    selectedType === option.key && styles.selectedTypeOption,
                  ]}
                  onPress={() => setSelectedType(option.key as any)}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      selectedType === option.key &&
                        styles.selectedTypeOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewChampionshipName("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCreateChampionship}
              >
                <Text style={styles.confirmButtonText}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: theme.spacing.md,
  },
  currentChampionshipCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  currentTitle: {
    ...theme.typography.caption,
    color: theme.colors.white,
    opacity: 0.8,
    marginBottom: theme.spacing.xs,
  },
  currentName: {
    ...theme.typography.h2,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  currentInfo: {
    ...theme.typography.body,
    color: theme.colors.white,
    opacity: 0.9,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.spacing.sm,
  },
  createButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.lg,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: "center",
    marginTop: theme.spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  listContainer: {
    paddingBottom: theme.spacing.lg,
  },
  championshipCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedChampionshipCard: {
    borderColor: theme.colors.primary,
  },
  championshipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  championshipName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.xs,
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  championshipInfo: {
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  infoLabel: {
    fontWeight: "bold",
  },
  dateText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  selectedIndicator: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.xs,
    alignSelf: "flex-start",
  },
  selectedText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.lg,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  input: {
    ...theme.components.input,
    marginBottom: theme.spacing.md,
  },
  typeLabel: {
    ...theme.typography.label,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  typeOptions: {
    marginBottom: theme.spacing.lg,
  },
  typeOption: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  selectedTypeOption: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeOptionText: {
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: "center",
  },
  selectedTypeOptionText: {
    color: theme.colors.white,
  },
  modalButtons: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.spacing.sm,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: theme.colors.border,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    ...theme.typography.button,
    color: theme.colors.text,
  },
  confirmButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
});

export default ChampionshipManagerScreen;
