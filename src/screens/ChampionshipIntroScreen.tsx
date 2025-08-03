import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../components/AppHeader";
import { theme } from "../theme/theme";

const ChampionshipIntroScreen = () => {
  const navigation = useNavigation<any>();

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

        <View style={styles.compatibilityCard}>
          <Text style={styles.compatibilityTitle}>🔄 Sistema Clássico</Text>
          <Text style={styles.compatibilityText}>
            O sistema antigo continua disponível na tela inicial para jogos
            avulsos e sorteios rápidos.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate("ChampionshipManager")}
        >
          <Text style={styles.startButtonText}>Começar Agora</Text>
        </TouchableOpacity>
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
  compatibilityCard: {
    backgroundColor: theme.colors.secondary + "15",
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  compatibilityTitle: {
    ...theme.typography.h3,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.sm,
  },
  compatibilityText: {
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
});

export default ChampionshipIntroScreen;
