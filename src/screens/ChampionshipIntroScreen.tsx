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
    <View style={styles.container}>
      <AppHeader
        title="Como Usar Campeonatos"
        icon="help-circle"
        theme="light"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>🎯 Sistema de Campeonatos</Text>
          <Text style={styles.introText}>
            Agora você pode criar campeonatos completos onde os jogadores ficam
            fixos nos times. Sem mais sorteios a cada jogo!
          </Text>
        </View>

        <Text style={styles.sectionTitle}>📋 Passo a Passo:</Text>

        {steps.map((step, index) => (
          <TouchableOpacity
            key={index}
            style={styles.stepCard}
            onPress={step.action}
          >
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.stepIcon}>
              <Ionicons
                name={step.icon as any}
                size={24}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ))}

        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>✨ Principais Vantagens:</Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem}>• Jogadores fixos nos times</Text>
            <Text style={styles.benefitItem}>• Sem sorteios constantes</Text>
            <Text style={styles.benefitItem}>• Múltiplos campeonatos</Text>
            <Text style={styles.benefitItem}>• Classificação automática</Text>
            <Text style={styles.benefitItem}>• Histórico completo</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate("ChampionshipManager")}
        >
          <Text style={styles.startButtonText}>Começar Agora</Text>
        </TouchableOpacity>

        {/* Botão de Limpar Dados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗑️ Gerenciar Dados</Text>
          <TouchableOpacity
            style={styles.clearDataButton}
            onPress={handleClearAllData}
            disabled={loading}
          >
            <Text style={styles.clearDataButtonText}>
              {loading ? "Limpando..." : "Limpar Todos os Dados"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.warningText}>
            ⚠️ Esta ação irá deletar permanentemente todos os seus campeonatos e
            dados
          </Text>
        </View>
      </ScrollView>
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
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  stepCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepNumber: {
    backgroundColor: theme.colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  stepNumberText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: "bold",
    fontSize: 12,
  },
  stepIcon: {
    marginRight: theme.spacing.sm,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: "bold",
    marginBottom: 2,
  },
  stepDescription: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  benefitsCard: {
    backgroundColor: theme.colors.success + "15",
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  benefitsTitle: {
    ...theme.typography.h3,
    color: theme.colors.success,
    marginBottom: theme.spacing.sm,
  },
  benefitsList: {
    gap: 4,
  },
  benefitItem: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  startButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  clearDataButton: {
    backgroundColor: "#ff4444",
    borderRadius: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: "#cc0000",
  },
  clearDataButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
    fontWeight: "bold",
  },
  warningText: {
    ...theme.typography.caption,
    color: "#ff4444",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default ChampionshipIntroScreen;
