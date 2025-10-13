import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AppHeader from "../components/AppHeader";
import { theme } from "../theme/theme";
import { useChampionship } from "../hooks/useChampionship";

const ChampionshipIntroScreen = () => {
  const navigation = useNavigation<any>();
  const { clearAllData, loading } = useChampionship();

  const handleClearAllData = () => {
    Alert.alert(
      "⚠️ Limpar Todos os Dados",
      "Esta ação irá deletar permanentemente todos os seus campeonatos, times, jogadores e partidas. Esta ação não pode ser desfeita.\n\nTem certeza que deseja continuar?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sim, Limpar Tudo",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert(
                "✅ Dados Limpos",
                "Todos os seus dados foram removidos com sucesso!"
              );
            } catch (error) {
              Alert.alert(
                "❌ Erro",
                "Ocorreu um erro ao limpar os dados. Tente novamente."
              );
            }
          },
        },
      ]
    );
  };

  const steps = [
    {
      icon: "trophy",
      title: "Criar Campeonato",
      description: "Defina o nome e formato do seu campeonato",
      action: () => navigation.navigate("ChampionshipManager"),
    },
    {
      icon: "shirt",
      title: "Adicionar Times",
      description: "Cadastre as equipes que participarão",
      action: () => navigation.navigate("ChampionshipTeams"),
    },
    {
      icon: "people",
      title: "Formar Equipes",
      description: "Adicione jogadores aos times (sem sorteio!)",
      action: () => navigation.navigate("ChampionshipPlayers"),
    },
    {
      icon: "search",
      title: "Todos os Jogadores",
      description: "Visualize e busque jogadores por nome, CPF ou time",
      action: () => navigation.navigate("ChampionshipAllPlayers"),
    },
    {
      icon: "calendar",
      title: "Gerar Partidas",
      description: "Crie a tabela de jogos do campeonato",
      action: () => navigation.navigate("ChampionshipMatches"),
    },
    {
      icon: "podium",
      title: "Acompanhar",
      description: "Veja classificação e estatísticas",
      action: () => navigation.navigate("ChampionshipTable"),
    },
  ];

  return (
    <LinearGradient
      colors={["#667eea", "#764ba2", "#4a90e2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card com Gradiente */}
        <LinearGradient
          colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.85)"]}
          style={styles.heroCard}
        >
          <View style={styles.heroIconContainer}>
            <Ionicons name="trophy" size={36} color="#FFD700" />
          </View>
          <Text style={styles.heroTitle}>� Sistema de Campeonatos</Text>
          <Text style={styles.heroSubtitle}>
            Organize competições profissionais completas com times fixos
          </Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Ionicons name="people" size={16} color="#667eea" />
              <Text style={styles.heroStatText}>Times Fixos</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Ionicons name="trophy" size={16} color="#667eea" />
              <Text style={styles.heroStatText}>Múltiplos Campeonatos</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Botão Principal Estilizado */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate("ChampionshipManager")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            style={styles.startButtonGradient}
          >
            <Ionicons name="rocket" size={24} color="#fff" />
            <Text style={styles.startButtonText}>Começar Agora</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Section Title com estilo moderno */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>� Comece em 6 Passos</Text>
          <Text style={styles.sectionSubtitle}>
            Siga este guia para criar seu primeiro campeonato
          </Text>
        </View>

        {/* Steps Cards com gradientes */}
        {steps.map((step, index) => (
          <TouchableOpacity
            key={index}
            style={styles.stepCard}
            onPress={step.action}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.85)"]}
              style={styles.stepGradient}
            >
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  style={styles.stepIconContainer}
                >
                  <Ionicons name={step.icon as any} size={20} color="#fff" />
                </LinearGradient>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
                <View style={styles.stepArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#667eea" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        {/* Seção de Gerenciar Dados Modernizada */}
        <LinearGradient
          colors={["rgba(255, 68, 68, 0.08)", "rgba(255, 68, 68, 0.04)"]}
          style={styles.dangerSection}
        >
          <View style={styles.dangerCard}>
            <View style={styles.dangerHeader}>
              <LinearGradient
                colors={["#ff6b6b", "#ff4444"]}
                style={styles.dangerIconContainer}
              >
                <Ionicons name="warning" size={20} color="#fff" />
              </LinearGradient>
              <View style={styles.dangerTitleContainer}>
                <Text style={styles.dangerTitle}>Zona de Perigo</Text>
                <Text style={styles.dangerSubtitle}>
                  Use com extremo cuidado
                </Text>
              </View>
            </View>

            <View style={styles.dangerContent}>
              <Text style={styles.dangerDescription}>
                Remove permanentemente todos os campeonatos, times e jogadores.
                Não pode ser desfeita.
              </Text>

              <TouchableOpacity
                style={styles.clearDataButton}
                onPress={handleClearAllData}
                disabled={loading}
                activeOpacity={0.8}
              >
                <View style={styles.clearDataContent}>
                  <Ionicons
                    name={loading ? "refresh" : "trash-bin"}
                    size={16}
                    color="#ff4444"
                    style={
                      loading ? { transform: [{ rotateZ: "180deg" }] } : {}
                    }
                  />
                  <Text style={styles.clearDataButtonText}>
                    {loading ? "Removendo..." : "Limpar Dados"}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.warningContainer}>
                <Ionicons name="information-circle" size={14} color="#ff8800" />
                <Text style={styles.warningText}>
                  Faça backup antes de prosseguir
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
    paddingTop: 50,
  },
  scrollContainer: {
    paddingBottom: 60,
  },
  // Hero Section Styles
  heroCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  heroIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 14,
  },
  heroStats: {
    flexDirection: "row",
    gap: 16,
  },
  heroStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroStatText: {
    fontSize: 13,
    color: "#667eea",
    fontWeight: "500",
  },
  // Section Header Styles
  sectionHeader: {
    marginBottom: 20,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  // Step Cards Styles
  stepCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  stepGradient: {
    padding: 16,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepNumber: {
    backgroundColor: "#667eea",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  stepArrow: {
    padding: 4,
  },
  // Start Button Styles
  startButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  // Danger Section Styles
  dangerSection: {
    borderRadius: 16,
    padding: 2,
    marginBottom: 8,
    shadowColor: "#ff4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dangerCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.2)",
  },
  dangerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  dangerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ff4444",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  dangerTitleContainer: {
    flex: 1,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff4444",
    marginBottom: 1,
  },
  dangerSubtitle: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  dangerContent: {
    gap: 12,
  },
  dangerDescription: {
    fontSize: 13,
    color: "#444",
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  clearDataButton: {
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ff4444",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  clearDataContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  clearDataButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ff4444",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255, 136, 0, 0.08)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 136, 0, 0.15)",
  },
  warningText: {
    fontSize: 12,
    color: "#ff8800",
    fontWeight: "500",
    textAlign: "center",
  },
  // Legacy styles (manter compatibilidade)
  introCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  introTitle: {
    ...theme.typography.h1,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  introText: {
    ...theme.typography.body,
    color: theme.colors.white,
    textAlign: "center",
    opacity: 0.9,
    lineHeight: 22,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
});

export default ChampionshipIntroScreen;
