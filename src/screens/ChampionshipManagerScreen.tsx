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
    pauseChampionship,
    resumeChampionship,
    finishChampionship,
    deleteChampionship,
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

  const handlePauseChampionship = async (championshipId: string) => {
    Alert.alert(
      "Pausar Campeonato",
      "Tem certeza que deseja pausar este campeonato?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Pausar",
          style: "default",
          onPress: async () => {
            try {
              await pauseChampionship(championshipId);
              Alert.alert("Sucesso", "Campeonato pausado com sucesso!");
            } catch (error) {
              Alert.alert("Erro", "Erro ao pausar campeonato");
            }
          },
        },
      ]
    );
  };

  const handleResumeChampionship = async (championshipId: string) => {
    try {
      await resumeChampionship(championshipId);
      Alert.alert("Sucesso", "Campeonato retomado com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Erro ao retomar campeonato");
    }
  };

  const handleFinishChampionship = async (championshipId: string) => {
    Alert.alert(
      "Finalizar Campeonato",
      "Tem certeza que deseja finalizar este campeonato? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Finalizar",
          style: "destructive",
          onPress: async () => {
            try {
              await finishChampionship(championshipId);
              Alert.alert("Sucesso", "Campeonato finalizado com sucesso!");
            } catch (error) {
              Alert.alert("Erro", "Erro ao finalizar campeonato");
            }
          },
        },
      ]
    );
  };

  const handleDeleteChampionship = async (championshipId: string) => {
    Alert.alert(
      "Deletar Campeonato",
      "Tem certeza que deseja deletar este campeonato? Esta ação não pode ser desfeita e todos os dados serão perdidos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteChampionship(championshipId);
              Alert.alert("Sucesso", "Campeonato deletado com sucesso!");
            } catch (error) {
              Alert.alert("Erro", "Erro ao deletar campeonato");
            }
          },
        },
      ]
    );
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
        return "Em Andamento";
      case "pausado":
        return "Pausado";
      case "finalizado":
        return "Finalizado";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "criado":
        return "#2196F3"; // Azul
      case "em_andamento":
        return "#4CAF50"; // Verde
      case "pausado":
        return "#FF9800"; // Laranja
      case "finalizado":
        return "#9E9E9E"; // Cinza
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
          {item.teams?.length || 0}
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Jogos: </Text>
          {item.matches?.length || 0}
        </Text>
      </View>

      <Text style={styles.dateText}>
        Criado em:{" "}
        {(() => {
          try {
            const date = new Date(item.createdAt);
            if (isNaN(date.getTime())) {
              return "Data inválida";
            }
            return date.toLocaleDateString("pt-BR");
          } catch (error) {
            return "Data inválida";
          }
        })()}
      </Text>

      {currentChampionship?.id === item.id && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedText}>✓ Selecionado</Text>
        </View>
      )}

      {/* Botões de ação */}
      <View style={styles.actionButtons}>
        {item.status === "pausado" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.resumeButton]}
            onPress={() => handleResumeChampionship(item.id)}
          >
            <Text style={styles.actionButtonText}>▶️ Retomar</Text>
          </TouchableOpacity>
        )}

        {(item.status === "criado" || item.status === "em_andamento") && (
          <TouchableOpacity
            style={[styles.actionButton, styles.pauseButton]}
            onPress={() => handlePauseChampionship(item.id)}
          >
            <Text style={styles.actionButtonText}>⏸️ Pausar</Text>
          </TouchableOpacity>
        )}

        {item.status !== "finalizado" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.finishButton]}
            onPress={() => handleFinishChampionship(item.id)}
          >
            <Text style={styles.actionButtonText}>🏁 Finalizar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteChampionship(item.id)}
        >
          <Text style={styles.actionButtonText}>🗑️ Deletar</Text>
        </TouchableOpacity>
      </View>
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
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.spacing.sm,
    minWidth: 80,
    alignItems: "center",
  },
  actionButtonText: {
    ...theme.typography.caption,
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  resumeButton: {
    backgroundColor: "#4CAF50",
  },
  pauseButton: {
    backgroundColor: "#FF9800",
  },
  finishButton: {
    backgroundColor: "#9E9E9E",
  },
  deleteButton: {
    backgroundColor: "#F44336",
  },
});

export default ChampionshipManagerScreen;
