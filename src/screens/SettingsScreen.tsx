import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../components/AppHeader";
import { theme } from "../theme/theme";
import { useAuth } from "../contexts/AuthContext";
import { useChampionship } from "../hooks/useChampionship";
import { useData } from "../hooks/useData";

interface SettingsItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: "toggle" | "action" | "navigation";
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
}

const SettingsScreen = () => {
  const { user, signOut } = useAuth();
  const { clearAllData: clearChampionshipData } = useChampionship();
  const { clearAllData: clearQuickData, exportData, importData } = useData();

  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    autoSync: true,
    saveQuickDrawHistory: true,
    showPlayerPhotos: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem("app_settings");
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const saveSettings = async (newSettings: typeof settings) => {
    try {
      await AsyncStorage.setItem("app_settings", JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    }
  };

  const handleToggle = (key: keyof typeof settings) => (value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleExportData = async () => {
    try {
      const data = await exportData();
      setShowExportModal(true);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível exportar os dados");
    }
  };

  const handleImportData = async () => {
    if (!importText.trim()) {
      Alert.alert("Erro", "Cole os dados de backup no campo abaixo");
      return;
    }

    try {
      await importData(importText);
      setShowImportModal(false);
      setImportText("");
      Alert.alert("Sucesso", "Dados importados com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Dados de backup inválidos");
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      "⚠️ Limpar Todos os Dados",
      "Esta ação irá deletar permanentemente todos os seus dados:\n\n• Campeonatos e partidas\n• Times e jogadores\n• Histórico de sorteios\n• Configurações\n\nEsta ação não pode ser desfeita!",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar Tudo",
          style: "destructive",
          onPress: async () => {
            try {
              await Promise.all([
                clearChampionshipData(),
                clearQuickData(),
                AsyncStorage.multiRemove([
                  "app_settings",
                  "quick_draw_history",
                ]),
              ]);
              Alert.alert("✅ Concluído", "Todos os dados foram removidos");
            } catch (error) {
              Alert.alert("Erro", "Não foi possível limpar todos os dados");
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Sair da Conta", "Deseja realmente sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: signOut,
      },
    ]);
  };

  const settingsItems: SettingsItem[] = [
    {
      id: "notifications",
      title: "Notificações",
      description: "Receber avisos sobre partidas e eventos",
      icon: "notifications-outline",
      type: "toggle",
      value: settings.notifications,
      onToggle: handleToggle("notifications"),
    },
    {
      id: "autoSync",
      title: "Sincronização Automática",
      description: "Sincronizar dados automaticamente quando online",
      icon: "sync-outline",
      type: "toggle",
      value: settings.autoSync,
      onToggle: handleToggle("autoSync"),
    },
    {
      id: "saveHistory",
      title: "Salvar Histórico de Sorteios",
      description: "Manter histórico dos sorteios rápidos",
      icon: "time-outline",
      type: "toggle",
      value: settings.saveQuickDrawHistory,
      onToggle: handleToggle("saveQuickDrawHistory"),
    },
    {
      id: "showPhotos",
      title: "Mostrar Fotos de Jogadores",
      description: "Exibir fotos dos jogadores quando disponível",
      icon: "camera-outline",
      type: "toggle",
      value: settings.showPlayerPhotos,
      onToggle: handleToggle("showPlayerPhotos"),
    },
  ];

  const actionItems: SettingsItem[] = [
    {
      id: "export",
      title: "Fazer Backup",
      description: "Exportar todos os seus dados",
      icon: "download-outline",
      type: "action",
      onPress: handleExportData,
    },
    {
      id: "import",
      title: "Restaurar Backup",
      description: "Importar dados de um backup anterior",
      icon: "cloud-upload-outline",
      type: "action",
      onPress: () => setShowImportModal(true),
    },
    {
      id: "clear",
      title: "Limpar Todos os Dados",
      description: "Remover permanentemente todos os dados",
      icon: "trash-outline",
      type: "action",
      onPress: handleClearAllData,
      destructive: true,
    },
    {
      id: "logout",
      title: "Sair da Conta",
      description: "Desconectar da conta atual",
      icon: "log-out-outline",
      type: "action",
      onPress: handleLogout,
      destructive: true,
    },
  ];

  const renderSettingItem = (item: SettingsItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingItem, item.destructive && styles.destructiveItem]}
      onPress={item.onPress}
      disabled={item.type === "toggle"}
    >
      <View style={styles.settingIcon}>
        <Ionicons
          name={item.icon}
          size={24}
          color={item.destructive ? theme.colors.error : theme.colors.primary}
        />
      </View>
      <View style={styles.settingContent}>
        <Text
          style={[
            styles.settingTitle,
            item.destructive && styles.destructiveText,
          ]}
        >
          {item.title}
        </Text>
        <Text style={styles.settingDescription}>{item.description}</Text>
      </View>
      {item.type === "toggle" && (
        <Switch
          value={item.value || false}
          onValueChange={item.onToggle}
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.primary,
          }}
          thumbColor={item.value ? theme.colors.primary : "#f4f3f4"}
        />
      )}
      {item.type === "action" && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Configurações" icon="settings" theme="light" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações do Usuário */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Conta</Text>
          <View style={styles.userInfo}>
            <Ionicons
              name="person-circle"
              size={40}
              color={theme.colors.primary}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.displayName || "Usuário"}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Preferências */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Preferências</Text>
          {settingsItems.map(renderSettingItem)}
        </View>

        {/* Dados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 Dados</Text>
          {actionItems.map(renderSettingItem)}
        </View>

        {/* Versão */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Liga Esportiva Lagoaçuense</Text>
          <Text style={styles.versionText}>Versão 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Modal de Exportar */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📦 Backup dos Dados</Text>
            <Text style={styles.modalDescription}>
              Copie o texto abaixo e salve em um local seguro:
            </Text>
            <ScrollView style={styles.exportText}>
              <Text selectable style={styles.exportData}>
                {/* Aqui seria o JSON dos dados exportados */}
                Dados de backup serão exibidos aqui...
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowExportModal(false)}
            >
              <Text style={styles.modalButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Importar */}
      <Modal
        visible={showImportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📥 Restaurar Backup</Text>
            <Text style={styles.modalDescription}>
              Cole os dados de backup no campo abaixo:
            </Text>
            <TextInput
              style={styles.importInput}
              multiline
              placeholder="Cole aqui os dados do backup..."
              value={importText}
              onChangeText={setImportText}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={() => {
                  setShowImportModal(false);
                  setImportText("");
                }}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleImportData}
              >
                <Text style={styles.modalButtonText}>Importar</Text>
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
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  destructiveItem: {
    borderWidth: 1,
    borderColor: theme.colors.error + "20",
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  destructiveText: {
    color: theme.colors.error,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 20,
    marginTop: 20,
  },
  versionText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
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
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  exportText: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
    marginBottom: 16,
  },
  exportData: {
    fontSize: 12,
    color: theme.colors.text,
    fontFamily: "monospace",
  },
  importInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    height: 120,
    textAlignVertical: "top",
    marginBottom: 16,
    fontSize: 12,
    fontFamily: "monospace",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: theme.colors.border,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SettingsScreen;
