import React, { useState, useEffect } from "react";
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
  Image,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import AppHeader from "../components/AppHeader";
import { theme } from "../theme/theme";
import { useChampionship } from "../hooks/useChampionship";
import { Team } from "../types/championship";
import { ChampionshipService } from "../services/championshipService";

// Cores disponíveis para os times
const COLETE_CORES: { [key: string]: string } = {
  "#FF0000": "Vermelho",
  "#00FF00": "Verde",
  "#0000FF": "Azul",
  "#FFFF00": "Amarelo",
  "#FF00FF": "Rosa",
  "#00FFFF": "Ciano",
  "#FFA500": "Laranja",
  "#800080": "Roxo",
  "#FFFFFF": "Branco",
  "#000000": "Preto",
};

const ChampionshipTeamsScreen = () => {
  const isFocused = useIsFocused();
  const { currentChampionship, addTeam, removeTeam, loadCurrentChampionship } =
    useChampionship();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState("");
  const [selectedColor, setSelectedColor] = useState(
    Object.keys(COLETE_CORES)[0]
  );
  const [noColor, setNoColor] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isFocused) {
      loadCurrentChampionship();
    }
  }, [isFocused]);

  // Função para selecionar imagem do brasão
  const selectTeamImage = async () => {
    try {
      // Solicitar permissão para acessar a galeria
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Precisamos de permissão para acessar suas fotos para selecionar o brasão do time."
        );
        return;
      }

      // Abrir a galeria de imagens
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Aspecto quadrado para brasões
        quality: 0.3, // Reduzir mais a qualidade para otimizar o banco
        base64: true, // Converter para Base64
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = result.assets[0].base64;

        if (base64Image) {
          // Verificar tamanho da imagem (Base64 deve ser menor que 1MB para Firestore)
          const sizeInBytes = (base64Image.length * 3) / 4;
          const sizeInMB = sizeInBytes / (1024 * 1024);

          if (sizeInMB > 1) {
            Alert.alert(
              "Imagem muito grande",
              "Por favor, selecione uma imagem menor. A imagem deve ter menos de 1MB."
            );
            return;
          }

          // Criar URI com prefixo data para exibição
          const imageUri = `data:image/jpeg;base64,${base64Image}`;
          setSelectedImage(imageUri);
        }
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem:", error);
      Alert.alert("Erro", "Não foi possível selecionar a imagem");
    }
  };

  const handleAddTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert("Erro", "Digite um nome para o time");
      return;
    }

    if (!currentChampionship) {
      Alert.alert("Erro", "Nenhum campeonato selecionado");
      return;
    }

    try {
      const newTeam: Omit<Team, "id"> = {
        name: teamName.trim(),
        color: noColor ? "" : selectedColor,
        players: [],
        ...(selectedImage && { logo: selectedImage }),
      };

      await addTeam(newTeam);
      setTeamName("");
      setSelectedColor(Object.keys(COLETE_CORES)[0]);
      setNoColor(false);
      setSelectedImage(null);
      setShowAddModal(false);
      Alert.alert("Sucesso", "Time adicionado com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Erro ao adicionar time");
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setSelectedColor(team.color || Object.keys(COLETE_CORES)[0]);
    setNoColor(!team.color);
    setSelectedImage(team.logo || null);
    setShowEditModal(true);
  };

  const handleUpdateTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert("Erro", "Digite um nome para o time");
      return;
    }

    if (!editingTeam || !currentChampionship) {
      Alert.alert("Erro", "Erro interno");
      return;
    }

    try {
      const updatedTeam: Team = {
        ...editingTeam,
        name: teamName.trim(),
        color: noColor ? "" : selectedColor,
        ...(selectedImage && { logo: selectedImage }),
      };

      // Se não há imagem selecionada, remover a propriedade logo
      if (!selectedImage && updatedTeam.logo) {
        delete updatedTeam.logo;
      }

      // Atualizar o time no campeonato
      const updatedChampionship = {
        ...currentChampionship,
        teams: currentChampionship.teams.map((t) =>
          t.id === editingTeam.id ? updatedTeam : t
        ),
      };

      // Salvar no serviço
      await ChampionshipService.updateChampionship(updatedChampionship);

      // Limpar estados
      setEditingTeam(null);
      setTeamName("");
      setSelectedColor(Object.keys(COLETE_CORES)[0]);
      setNoColor(false);
      setSelectedImage(null);
      setShowEditModal(false);

      // Recarregar dados
      await loadCurrentChampionship();

      Alert.alert("Sucesso", "Time atualizado com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Erro ao atualizar time");
    }
  };

  const handleRemoveTeam = (team: Team) => {
    Alert.alert(
      "Confirmar exclusão",
      `Tem certeza que deseja excluir o time "${team.name}"? Todos os jogadores serão removidos também.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await removeTeam(team.id);
              Alert.alert("Sucesso", "Time removido com sucesso!");
            } catch (error) {
              Alert.alert("Erro", "Erro ao remover time");
            }
          },
        },
      ]
    );
  };

  const renderTeamItem = ({ item }: { item: Team }) => (
    <View style={styles.teamCard}>
      <View style={styles.teamHeader}>
        <View style={styles.teamInfo}>
          <View style={styles.teamTitleRow}>
            {/* Brasão do time */}
            {item.logo ? (
              <Image source={{ uri: item.logo }} style={styles.teamLogo} />
            ) : (
              <View style={styles.teamLogoPlaceholder}>
                <Text style={styles.teamLogoPlaceholderText}>⚽</Text>
              </View>
            )}
            <View style={styles.teamDetails}>
              <Text style={styles.teamName}>{item.name}</Text>
              {item.color && (
                <View style={styles.colorInfo}>
                  <View
                    style={[
                      styles.colorPreview,
                      { backgroundColor: item.color },
                    ]}
                  />
                  <Text style={styles.colorName}>
                    {COLETE_CORES[item.color] || "Cor personalizada"}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditTeam(item)}
          >
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveTeam(item)}
          >
            <Text style={styles.removeButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.playersInfo}>
        <Text style={styles.playersCount}>
          {item.players.length} jogador{item.players.length !== 1 ? "es" : ""}
        </Text>
        {item.players.length > 0 && (
          <Text style={styles.playersList}>
            {item.players.map((p) => p.name).join(", ")}
          </Text>
        )}
      </View>
    </View>
  );

  if (!currentChampionship) {
    return (
      <View style={styles.container}>
        <AppHeader title="Times do Campeonato" icon="shirt" theme="light" />
        <View style={styles.noChampionshipContainer}>
          <Text style={styles.noChampionshipText}>
            Nenhum campeonato selecionado
          </Text>
          <Text style={styles.noChampionshipSubtext}>
            Vá para a tela de campeonatos e selecione ou crie um campeonato
            primeiro.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Times do Campeonato" icon="shirt" theme="light" />

      <View style={styles.content}>
        <View style={styles.championshipInfo}>
          <Text style={styles.championshipName}>
            {currentChampionship.name}
          </Text>
          <Text style={styles.championshipType}>
            {currentChampionship.type === "pontos_corridos"
              ? "Pontos Corridos"
              : currentChampionship.type === "mata_mata"
              ? "Mata-Mata"
              : "Fase de Grupos"}
          </Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.sectionTitle}>
            Times ({currentChampionship.teams.length})
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>

        {currentChampionship.teams.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum time cadastrado</Text>
            <Text style={styles.emptySubtext}>
              Adicione times para começar o campeonato
            </Text>
          </View>
        ) : (
          <FlatList
            data={currentChampionship.teams}
            renderItem={renderTeamItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Modal para adicionar time */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Time</Text>

            <TextInput
              style={[styles.input, { color: "#000000" }]}
              placeholder="Nome do time"
              value={teamName}
              onChangeText={setTeamName}
              placeholderTextColor="#666666"
              selectionColor={theme.colors.primary}
            />

            {/* Seção do Brasão */}
            <Text style={styles.colorLabel}>Brasão do time:</Text>
            <View style={styles.logoSection}>
              {selectedImage ? (
                <View style={styles.selectedImageContainer}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.selectedImage}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Text style={styles.removeImageButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectImageButton}
                  onPress={selectTeamImage}
                >
                  <Text style={styles.selectImageButtonText}>📷</Text>
                  <Text style={styles.selectImageText}>Selecionar Brasão</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.colorLabel}>Cor do colete:</Text>

            <TouchableOpacity
              style={[
                styles.noColorOption,
                noColor && styles.noColorOptionSelected,
              ]}
              onPress={() => setNoColor(!noColor)}
            >
              <Text
                style={[
                  styles.noColorText,
                  noColor && styles.noColorTextSelected,
                ]}
              >
                Sem cor específica
              </Text>
            </TouchableOpacity>

            {!noColor && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.colorOptions}
              >
                {Object.entries(COLETE_CORES).map(([hex, name]) => (
                  <TouchableOpacity
                    key={hex}
                    style={[
                      styles.colorOption,
                      selectedColor === hex && styles.selectedColorOption,
                    ]}
                    onPress={() => setSelectedColor(hex)}
                  >
                    <View
                      style={[styles.colorCircle, { backgroundColor: hex }]}
                    />
                    <Text style={styles.colorOptionText}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setTeamName("");
                  setNoColor(false);
                  setSelectedImage(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddTeam}
              >
                <Text style={styles.confirmButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para editar time */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Time</Text>

            <TextInput
              style={[styles.input, { color: "#000000" }]}
              placeholder="Nome do time"
              value={teamName}
              onChangeText={setTeamName}
              placeholderTextColor="#666666"
              selectionColor={theme.colors.primary}
            />

            {/* Seção do Brasão */}
            <Text style={styles.colorLabel}>Brasão do time:</Text>
            <View style={styles.logoSection}>
              {selectedImage ? (
                <View style={styles.selectedImageContainer}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.selectedImage}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Text style={styles.removeImageButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectImageButton}
                  onPress={selectTeamImage}
                >
                  <Text style={styles.selectImageButtonText}>📷</Text>
                  <Text style={styles.selectImageText}>Selecionar Brasão</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.colorLabel}>Cor do colete:</Text>

            <TouchableOpacity
              style={[
                styles.noColorOption,
                noColor && styles.noColorOptionSelected,
              ]}
              onPress={() => setNoColor(!noColor)}
            >
              <Text
                style={[
                  styles.noColorText,
                  noColor && styles.noColorTextSelected,
                ]}
              >
                Sem cor específica
              </Text>
            </TouchableOpacity>

            {!noColor && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.colorOptions}
              >
                {Object.entries(COLETE_CORES).map(([hex, name]) => (
                  <TouchableOpacity
                    key={hex}
                    style={[
                      styles.colorOption,
                      selectedColor === hex && styles.selectedColorOption,
                    ]}
                    onPress={() => setSelectedColor(hex)}
                  >
                    <View
                      style={[styles.colorCircle, { backgroundColor: hex }]}
                    />
                    <Text style={styles.colorOptionText}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingTeam(null);
                  setTeamName("");
                  setNoColor(false);
                  setSelectedImage(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleUpdateTeam}
              >
                <Text style={styles.confirmButtonText}>Atualizar</Text>
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
  noChampionshipContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  noChampionshipText: {
    ...theme.typography.h2,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  noChampionshipSubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  championshipInfo: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  championshipName: {
    ...theme.typography.h2,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  championshipType: {
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
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.spacing.sm,
  },
  addButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
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
  teamCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  teamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  teamInfo: {
    flex: 1,
  },
  teamTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  teamLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  teamLogoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  teamLogoPlaceholderText: {
    fontSize: 20,
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  colorInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorPreview: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  colorName: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.xs,
  },
  editButtonText: {
    fontSize: 18,
  },
  removeButton: {
    padding: theme.spacing.sm,
  },
  removeButtonText: {
    fontSize: 18,
  },
  playersInfo: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  playersCount: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: "bold",
    marginBottom: theme.spacing.xs,
  },
  playersList: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 16,
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
    maxHeight: "80%",
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
  colorLabel: {
    ...theme.typography.label,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  logoSection: {
    marginBottom: theme.spacing.md,
    alignItems: "center",
  },
  selectedImageContainer: {
    position: "relative",
    alignItems: "center",
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  removeImageButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageButtonText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  selectImageButton: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
    backgroundColor: theme.colors.background,
    minWidth: 120,
  },
  selectImageButtonText: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  selectImageText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  noColorOption: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  noColorOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  noColorText: {
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: "center",
  },
  noColorTextSelected: {
    color: theme.colors.white,
  },
  colorOptions: {
    marginBottom: theme.spacing.lg,
  },
  colorOption: {
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
    minWidth: 80,
  },
  selectedColorOption: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  colorOptionText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    textAlign: "center",
    fontSize: 10,
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

export default ChampionshipTeamsScreen;
