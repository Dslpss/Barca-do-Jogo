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
  RefreshControl,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ChampionshipService } from "../services/championshipService";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
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
    loadCurrentChampionship,
    pauseChampionship,
    resumeChampionship,
    finishChampionship,
    deleteChampionship,
    repairChampionships,
  } = useChampionship();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChampionshipName, setNewChampionshipName] = useState("");
  const [selectedType, setSelectedType] = useState<
    "pontos_corridos" | "mata_mata" | "grupos"
  >("pontos_corridos");
  const [pickingLogo, setPickingLogo] = useState(false);

  React.useEffect(() => {
    if (isFocused) {
      console.log("🏆 ChampionshipManager: Carregando campeonatos...");
      loadChampionships();
    }
  }, [isFocused]);

  // Debug logs
  React.useEffect(() => {
    console.log("📊 ChampionshipManager - Estado atual:");
    console.log("- Campeonatos carregados:", championships?.length || 0);
    console.log("- Campeonato atual ID:", currentChampionship?.id || "nenhum");
    console.log("- Loading:", loading);
    console.log("- Error:", error);

    if (championships && championships.length > 0) {
      console.log("📋 Lista de campeonatos:");
      championships.forEach((c, index) => {
        console.log(
          `  ${index + 1}. ${c.name} (ID: ${c.id}) - Status: ${c.status}`
        );
      });
    }
  }, [championships, currentChampionship, loading, error]);

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

  const handlePickChampionshipLogo = async () => {
    try {
      setPickingLogo(true);
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Precisamos de permissão para acessar suas fotos para selecionar o logo do campeonato."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = result.assets[0].base64;
        if (base64) {
          // até 1MB
          const sizeInBytes = (base64.length * 3) / 4;
          if (sizeInBytes > 1 * 1024 * 1024) {
            Alert.alert(
              "Imagem muito grande",
              "Selecione uma imagem menor que 1MB."
            );
            return;
          }
          const dataUri = `data:image/jpeg;base64,${base64}`;
          if (!currentChampionship) {
            Alert.alert("Erro", "Nenhum campeonato selecionado");
            return;
          }
          const updated = {
            ...currentChampionship,
            logo: dataUri,
          } as Championship;
          await ChampionshipService.updateChampionship(updated);
          await Promise.all([loadChampionships(), loadCurrentChampionship()]);
          Alert.alert("Sucesso", "Logo do campeonato atualizado!");
        }
      }
    } catch (e) {
      console.error("Erro ao selecionar logo:", e);
      Alert.alert("Erro", "Não foi possível selecionar o logo");
    } finally {
      setPickingLogo(false);
    }
  };

  const handleSelectChampionship = async (championshipId: string) => {
    console.log("🎯 Tentando selecionar campeonato:", championshipId);

    // Verificar se o campeonato existe na lista
    const championshipExists = championships.find(
      (c) => c.id === championshipId
    );
    if (!championshipExists) {
      console.error("❌ Campeonato não encontrado na lista:", championshipId);
      Alert.alert(
        "Erro",
        "Campeonato não encontrado. Tente recarregar a lista."
      );
      return;
    }

    console.log("✅ Campeonato encontrado na lista:", championshipExists.name);

    try {
      await selectChampionship(championshipId);
      console.log("✅ Campeonato selecionado com sucesso!");

      // Forçar um recarregamento para garantir que o estado está atualizado
      setTimeout(() => {
        loadChampionships();
      }, 500);

      Alert.alert(
        "Sucesso",
        `Campeonato "${championshipExists.name}" selecionado!`
      );
    } catch (err: any) {
      console.error("❌ Erro ao selecionar campeonato:", err);
      const message = err?.message || "Erro desconhecido";

      // Tentar diagnóstico do erro
      if (message?.includes("offline")) {
        Alert.alert(
          "Erro de Conexão",
          "Você está offline. Verifique sua conexão com a internet e tente novamente."
        );
      } else if (message?.includes("autenticado")) {
        Alert.alert(
          "Erro de Autenticação",
          "Você não está autenticado. Faça login novamente."
        );
      } else {
        Alert.alert("Erro", `Erro ao selecionar campeonato: ${message}`);
      }
    }
  };

  const handleFixChampionships = async () => {
    Alert.alert(
      "🔧 Reparar Campeonatos",
      "Esta função irá corrigir problemas conhecidos nos campeonatos (como IDs vazios). Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reparar",
          style: "default",
          onPress: async () => {
            console.log("🔧 Iniciando reparo de campeonatos...");
            try {
              // Recarregar campeonatos (isso já faz a correção automaticamente)
              await loadChampionships();
              Alert.alert("Sucesso", "Campeonatos reparados com sucesso!");
            } catch (error) {
              console.error("❌ Erro ao reparar campeonatos:", error);
              Alert.alert("Erro", "Erro ao reparar campeonatos.");
            }
          },
        },
      ]
    );
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

  const renderChampionshipItem = ({ item }: { item: Championship }) => {
    const isSelected = currentChampionship?.id === item.id;
    console.log(
      `🎮 Renderizando campeonato: ${item.name} (ID: ${item.id}) - Selecionado: ${isSelected}`
    );

    // Verificar se o ID está vazio e mostrar aviso
    const hasEmptyId = !item.id || item.id.trim() === "";

    return (
      <TouchableOpacity
        style={[
          styles.championshipCard,
          isSelected && styles.selectedChampionshipCard,
          hasEmptyId && styles.problemChampionshipCard,
        ]}
        onPress={() => {
          console.log(`👆 Clique no campeonato: ${item.name} (ID: ${item.id})`);

          if (hasEmptyId) {
            Alert.alert(
              "⚠️ Problema no Campeonato",
              `O campeonato "${item.name}" tem um problema de identificação. Use o botão "🔧 Reparar" para corrigir este problema.`,
              [
                { text: "OK", style: "default" },
                {
                  text: "Reparar Agora",
                  style: "default",
                  onPress: () => handleFixChampionships(),
                },
              ]
            );
            return;
          }

          handleSelectChampionship(item.id);
        }}
      >
        <View style={styles.championshipHeader}>
          <View style={styles.nameRow}>
            {item.logo ? (
              <Image source={{ uri: item.logo }} style={styles.listChampLogo} />
            ) : (
              <Ionicons
                name={isSelected ? "trophy" : "football-outline"}
                size={18}
                color={theme.colors.text}
                style={{ marginRight: 8, opacity: 0.9 }}
              />
            )}
            <Text style={styles.championshipName}>
              {item.name}
              {hasEmptyId ? " ⚠️" : ""}
            </Text>
          </View>
          <View style={styles.statusGroup}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            />
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>
        </View>

        {hasEmptyId && (
          <View style={styles.problemIndicator}>
            <Text style={styles.problemText}>
              ⚠️ Este campeonato precisa ser reparado
            </Text>
          </View>
        )}

        <View style={styles.championshipInfo}>
          <View style={styles.infoRow}>
            <Ionicons
              name="grid-outline"
              size={14}
              color={theme.colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>
                <Text>Tipo: </Text>
                {getTypeLabel(item.type)}
              </Text>
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="people-outline"
              size={14}
              color={theme.colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Times: </Text>
              {item.teams?.length || 0}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={theme.colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Jogos: </Text>
              {item.matches?.length || 0}
            </Text>
          </View>
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

        {isSelected && (
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
              <View style={styles.actionBtnContent}>
                <Ionicons
                  name="play"
                  size={14}
                  color={"white"}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.actionButtonText}>Retomar</Text>
              </View>
            </TouchableOpacity>
          )}

          {(item.status === "criado" || item.status === "em_andamento") && (
            <TouchableOpacity
              style={[styles.actionButton, styles.pauseButton]}
              onPress={() => handlePauseChampionship(item.id)}
            >
              <View style={styles.actionBtnContent}>
                <Ionicons
                  name="pause"
                  size={14}
                  color={"white"}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.actionButtonText}>Pausar</Text>
              </View>
            </TouchableOpacity>
          )}

          {item.status !== "finalizado" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.finishButton]}
              onPress={() => handleFinishChampionship(item.id)}
            >
              <View style={styles.actionBtnContent}>
                <Ionicons
                  name="flag-outline"
                  size={14}
                  color={"white"}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.actionButtonText}>Finalizar</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteChampionship(item.id)}
          >
            <View style={styles.actionBtnContent}>
              <Ionicons
                name="trash-outline"
                size={14}
                color={"white"}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.actionButtonText}>Deletar</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Gerenciar Campeonatos" icon="trophy" theme="light" />

      <View style={styles.content}>
        {currentChampionship && (
          <View style={styles.currentChampionshipCard}>
            <Text style={styles.currentTitle}>Campeonato Atual</Text>
            <View style={styles.currentNameRow}>
              <Ionicons
                name="trophy"
                size={18}
                color={theme.colors.white}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.currentName}>{currentChampionship.name}</Text>
            </View>
            <Text style={styles.currentInfo}>
              {getTypeLabel(currentChampionship.type)}
              <Text> • </Text>
              {getStatusLabel(currentChampionship.status)}
            </Text>

            {/* Logo do campeonato */}
            <View style={styles.logoRow}>
              {currentChampionship.logo ? (
                <Image
                  source={{ uri: currentChampionship.logo }}
                  style={styles.champLogo}
                />
              ) : (
                <View style={styles.champLogoPlaceholder}>
                  <Text style={styles.champLogoPlaceholderText}>🏆</Text>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.headerButton,
                  styles.createNewButton,
                  { height: 36, marginLeft: 8 },
                ]}
                onPress={handlePickChampionshipLogo}
                disabled={!!loading || pickingLogo}
              >
                <View style={styles.headerBtnContent}>
                  <Ionicons
                    name="image"
                    size={16}
                    color="white"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.headerButtonText}>
                    {pickingLogo
                      ? "Atualizando..."
                      : currentChampionship.logo
                      ? "Trocar Logo"
                      : "Adicionar Logo"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Seus Campeonatos</Text>
        </View>

        <View style={styles.headerActions}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.headerButtonsContainer}
          >
            <TouchableOpacity
              style={[styles.headerButton, styles.refreshButton]}
              onPress={() => {
                console.log("🔄 Recarregando campeonatos manualmente...");
                loadChampionships();
              }}
              disabled={loading}
            >
              <View style={styles.headerBtnContent}>
                <Ionicons
                  name="refresh"
                  size={16}
                  color="white"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.headerButtonText}>Atualizar</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, styles.fixButton]}
              onPress={async () => {
                try {
                  const result = await repairChampionships();
                  Alert.alert(
                    "Reparo concluído",
                    `Verificados: ${result.checked}\nCorrigidos: ${result.fixed}`
                  );
                } catch (e: any) {
                  Alert.alert(
                    "Erro",
                    e?.message || "Erro ao reparar campeonatos"
                  );
                }
              }}
              disabled={loading}
            >
              <View style={styles.headerBtnContent}>
                <Ionicons
                  name="construct"
                  size={16}
                  color="white"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.headerButtonText}>Reparar</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, styles.createNewButton]}
              onPress={() => setShowCreateModal(true)}
            >
              <View style={styles.headerBtnContent}>
                <Ionicons
                  name="add"
                  size={16}
                  color="white"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.headerButtonText}>Novo</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <Text style={styles.sectionSubtitle}>
          Selecione, pause, retome ou finalize seus campeonatos
        </Text>

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
            refreshControl={
              <RefreshControl
                refreshing={!!loading}
                onRefresh={loadChampionships}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
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
              style={[styles.input, { color: "#000000" }]}
              placeholder="Nome do campeonato"
              value={newChampionshipName}
              onChangeText={setNewChampionshipName}
              placeholderTextColor="#666666"
              selectionColor={theme.colors.primary}
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
    // shadow for iOS
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    // elevation for Android
    elevation: 3,
  },
  currentTitle: {
    ...theme.typography.caption,
    color: theme.colors.white,
    opacity: 0.8,
    marginBottom: theme.spacing.xs,
  },
  currentNameRow: {
    flexDirection: "row",
    alignItems: "center",
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
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  champLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  champLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  champLogoPlaceholderText: {
    color: "#fff",
    fontSize: 20,
  },
  header: {
    marginBottom: theme.spacing.sm,
  },
  headerActions: {
    marginBottom: theme.spacing.md,
  },
  headerButtonsContainer: {
    paddingHorizontal: 2,
    gap: 8,
    flexDirection: "row",
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  headerButton: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1,
    elevation: 1,
  },
  headerBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  refreshButton: {
    backgroundColor: theme.colors.secondary,
  },
  fixButton: {
    backgroundColor: "#FF9800", // Laranja para indicar reparo
  },
  createNewButton: {
    backgroundColor: theme.colors.primary,
  },
  headerButtonText: {
    ...theme.typography.button,
    fontSize: 14,
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
    // shadow for iOS
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    // elevation for Android
    elevation: 2,
  },
  selectedChampionshipCard: {
    borderColor: theme.colors.primary,
  },
  problemChampionshipCard: {
    borderColor: "#FF9800",
    backgroundColor: "#FFF3E0",
  },
  problemIndicator: {
    backgroundColor: "#FF9800",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  problemText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: "bold",
  },
  championshipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  championshipName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  statusGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
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
  listChampLogo: {
    width: 22,
    height: 22,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  championshipInfo: {
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
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
    gap: 8,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    justifyContent: "flex-start",
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.spacing.sm,
    minWidth: 90,
    height: 32,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginRight: 8,
    marginBottom: 8,
  },
  actionBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  actionButtonText: {
    ...theme.typography.caption,
    fontSize: 12,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
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
