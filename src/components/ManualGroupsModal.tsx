import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import { theme } from "../theme/theme";
import { Team, Group } from "../types/championship";

interface ManualGroupsModalProps {
  visible: boolean;
  onClose: () => void;
  teams: Team[];
  onCreateGroups: (groups: Group[]) => void;
}

const ManualGroupsModal: React.FC<ManualGroupsModalProps> = ({
  visible,
  onClose,
  teams,
  onCreateGroups,
}) => {
  const [numberOfGroups, setNumberOfGroups] = useState<string>("2");
  const [groups, setGroups] = useState<Group[]>([]);
  const [unassignedTeams, setUnassignedTeams] = useState<Team[]>([]);

  // Inicializar quando o modal abrir
  useEffect(() => {
    if (visible) {
      const numGroups = Math.max(2, Math.min(4, parseInt(numberOfGroups) || 2));
      initializeGroups(numGroups);
    }
  }, [visible, numberOfGroups, teams]);

  const initializeGroups = (numGroups: number) => {
    const newGroups: Group[] = [];
    for (let i = 0; i < numGroups; i++) {
      newGroups.push({
        id: `grupo_${String.fromCharCode(65 + i)}`,
        name: `Grupo ${String.fromCharCode(65 + i)}`,
        teamIds: [],
      });
    }
    setGroups(newGroups);
    setUnassignedTeams([...teams]);
  };

  const handleNumberOfGroupsChange = (value: string) => {
    const num = parseInt(value) || 2;
    if (num >= 2 && num <= 4 && num <= Math.floor(teams.length / 2)) {
      setNumberOfGroups(value);
    }
  };

  const addTeamToGroup = (teamId: string, groupIndex: number) => {
    const team = unassignedTeams.find((t) => t.id === teamId);
    if (!team) return;

    // Remover time dos não alocados
    setUnassignedTeams((prev) => prev.filter((t) => t.id !== teamId));

    // Adicionar time ao grupo
    setGroups((prev) =>
      prev.map((group, index) => {
        if (index === groupIndex) {
          return {
            ...group,
            teamIds: [...group.teamIds, teamId],
          };
        }
        return group;
      })
    );
  };

  const removeTeamFromGroup = (teamId: string, groupIndex: number) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    // Remover time do grupo
    setGroups((prev) =>
      prev.map((group, index) => {
        if (index === groupIndex) {
          return {
            ...group,
            teamIds: group.teamIds.filter((id) => id !== teamId),
          };
        }
        return group;
      })
    );

    // Adicionar time de volta aos não alocados
    setUnassignedTeams((prev) => [...prev, team]);
  };

  const getTeamName = (teamId: string) => {
    return teams.find((t) => t.id === teamId)?.name || "Time não encontrado";
  };

  const getTeamColor = (teamId: string) => {
    return teams.find((t) => t.id === teamId)?.color || "#cccccc";
  };

  const validateGroups = (): boolean => {
    // Verificar se todos os times foram alocados
    if (unassignedTeams.length > 0) {
      Alert.alert(
        "Times não alocados",
        `Ainda há ${unassignedTeams.length} time(s) sem grupo. Aloque todos os times antes de continuar.`
      );
      return false;
    }

    // Verificar se cada grupo tem pelo menos 2 times
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].teamIds.length < 2) {
        Alert.alert(
          "Grupos inválidos",
          `O ${groups[i].name} deve ter pelo menos 2 times.`
        );
        return false;
      }
    }

    return true;
  };

  const handleConfirm = () => {
    if (validateGroups()) {
      onCreateGroups(groups);
      onClose();
    }
  };

  const resetGroups = () => {
    Alert.alert(
      "Resetar Grupos",
      "Tem certeza que deseja resetar todos os grupos? Todos os times serão removidos dos grupos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Resetar",
          style: "destructive",
          onPress: () => {
            initializeGroups(parseInt(numberOfGroups) || 2);
          },
        },
      ]
    );
  };

  const maxGroups = Math.min(4, Math.floor(teams.length / 2));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>👥 Formação Manual de Grupos</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Configuração do número de grupos */}
            <View style={styles.configSection}>
              <Text style={styles.label}>Número de Grupos:</Text>
              <View style={styles.groupCountRow}>
                {[2, 3, 4].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.groupCountOption,
                      parseInt(numberOfGroups) === num &&
                        styles.selectedGroupCountOption,
                      num > maxGroups && styles.disabledGroupCountOption,
                    ]}
                    onPress={() =>
                      num <= maxGroups && setNumberOfGroups(num.toString())
                    }
                    disabled={num > maxGroups}
                  >
                    <Text
                      style={[
                        styles.groupCountOptionText,
                        parseInt(numberOfGroups) === num &&
                          styles.selectedGroupCountOptionText,
                        num > maxGroups && styles.disabledGroupCountOptionText,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.hint}>
                Máximo de {maxGroups} grupos com {teams.length} times
              </Text>
            </View>

            {/* Times não alocados */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                🏠 Times Não Alocados ({unassignedTeams.length})
              </Text>
              {unassignedTeams.length > 0 ? (
                <View style={styles.teamsGrid}>
                  {unassignedTeams.map((team) => (
                    <TouchableOpacity
                      key={team.id}
                      style={[
                        styles.teamChip,
                        { backgroundColor: team.color || "#cccccc" },
                      ]}
                      onPress={() => {
                        // Mostrar opções de grupos para adicionar
                        Alert.alert(
                          `Adicionar ${team.name}`,
                          "Escolha o grupo:",
                          [
                            ...groups.map((group, index) => ({
                              text: group.name,
                              onPress: () => addTeamToGroup(team.id, index),
                            })),
                            { text: "Cancelar" },
                          ]
                        );
                      }}
                    >
                      <Text style={styles.teamChipText}>{team.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>
                  ✅ Todos os times foram alocados
                </Text>
              )}
            </View>

            {/* Grupos */}
            {groups.map((group, groupIndex) => (
              <View key={group.id} style={styles.groupSection}>
                <Text style={styles.groupTitle}>
                  {group.name} ({group.teamIds.length} times)
                </Text>

                {group.teamIds.length > 0 ? (
                  <View style={styles.teamsGrid}>
                    {group.teamIds.map((teamId) => (
                      <TouchableOpacity
                        key={teamId}
                        style={[
                          styles.teamChip,
                          { backgroundColor: getTeamColor(teamId) },
                        ]}
                        onPress={() => removeTeamFromGroup(teamId, groupIndex)}
                      >
                        <Text style={styles.teamChipText}>
                          {getTeamName(teamId)}
                        </Text>
                        <Text style={styles.removeIndicator}>×</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyGroup}>
                    <Text style={styles.emptyGroupText}>
                      Toque nos times acima para adicionar a este grupo
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {/* Informações */}
            <View style={styles.infoSection}>
              <Text style={styles.infoText}>
                💡 Dica: Toque nos times não alocados para adicioná-los a um
                grupo
              </Text>
              <Text style={styles.infoText}>
                🔄 Toque nos times dentro dos grupos para removê-los
              </Text>
              <Text style={styles.infoText}>
                ⚖️ Cada grupo deve ter pelo menos 2 times
              </Text>
            </View>
          </ScrollView>

          {/* Ações */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={resetGroups}
            >
              <Text style={styles.resetButtonText}>🔄 Resetar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onClose}
            >
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                unassignedTeams.length > 0 && styles.disabledButton,
              ]}
              onPress={handleConfirm}
              disabled={unassignedTeams.length > 0}
            >
              <Text style={styles.primaryButtonText}>Confirmar Grupos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    width: "95%",
    height: "90%",
    maxHeight: 700,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  configSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 8,
  },
  groupCountRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  groupCountOption: {
    width: 50,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  selectedGroupCountOption: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  disabledGroupCountOption: {
    borderColor: theme.colors.textSecondary,
    backgroundColor: "#f5f5f5",
  },
  groupCountOptionText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  selectedGroupCountOptionText: {
    color: "white",
  },
  disabledGroupCountOptionText: {
    color: theme.colors.textSecondary,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 10,
  },
  groupSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 10,
  },
  teamsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  teamChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  teamChipText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  removeIndicator: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 6,
    opacity: 0.8,
  },
  emptyGroup: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 8,
  },
  emptyGroupText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    padding: 20,
    fontStyle: "italic",
  },
  infoSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#1976d2",
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.border,
  },
  resetButton: {
    backgroundColor: "#ff9800",
  },
  disabledButton: {
    backgroundColor: theme.colors.textSecondary,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "bold",
  },
  resetButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default ManualGroupsModal;
