import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../theme/theme";

const { width, height } = Dimensions.get("window");

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  features: string[];
}

interface OnboardingScreenProps {
  onComplete?: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation<any>();

  const steps: OnboardingStep[] = [
    {
      id: 0,
      title: "Bem-vindo à Liga Esportiva!",
      description:
        "Organize seus campeonatos e sorteios de forma profissional e simples.",
      icon: "trophy",
      gradient: ["#667eea", "#764ba2"],
      features: [
        "Interface intuitiva e moderna",
        "Funciona 100% offline",
        "Sincronização automática na nuvem",
      ],
    },
    {
      id: 1,
      title: "Sistema de Campeonatos",
      description:
        "Crie campeonatos completos com times fixos e tabela de classificação automática.",
      icon: "medal",
      gradient: ["#f093fb", "#f5576c"],
      features: [
        "Times com jogadores fixos",
        "Classificação automática",
        "Múltiplos formatos (pontos corridos, mata-mata)",
        "Gestão de partidas completa",
      ],
    },
    {
      id: 2,
      title: "Sorteio Rápido",
      description:
        "Para ocasiões especiais, use o sorteio rápido para formar times na hora.",
      icon: "shuffle",
      gradient: ["#4facfe", "#00f2fe"],
      features: [
        "Sorteio equilibrado de times",
        "Funções específicas (goleiro, capitão...)",
        "Cores personalizáveis",
        "Histórico de sorteios",
      ],
    },
    {
      id: 3,
      title: "Estatísticas e Relatórios",
      description:
        "Acompanhe o desempenho de jogadores e times com estatísticas detalhadas.",
      icon: "stats-chart",
      gradient: ["#43e97b", "#38f9d7"],
      features: [
        "Ranking de jogadores",
        "Performance dos times",
        "Histórico de partidas",
        "Exportação de dados",
      ],
    },
    {
      id: 4,
      title: "Pronto para Começar!",
      description:
        "Agora você tem tudo que precisa para organizar seus campeonatos e sorteios.",
      icon: "checkmark-circle",
      gradient: ["#fa709a", "#fee140"],
      features: [
        "Crie seu primeiro campeonato",
        "Adicione times e jogadores",
        "Configure suas preferências",
        "Comece a jogar!",
      ],
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      scrollViewRef.current?.scrollTo({
        x: nextStep * width,
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      scrollViewRef.current?.scrollTo({
        x: prevStep * width,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem("onboarding_completed", "true");
      if (onComplete) {
        onComplete();
      } else {
        navigation.navigate("Home");
      }
    } catch (error) {
      console.error("Erro ao salvar estado do onboarding:", error);
      if (onComplete) {
        onComplete();
      } else {
        navigation.navigate("Home");
      }
    }
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const step = Math.round(scrollPosition / width);
    if (step !== currentStep && step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  };

  const renderStep = (step: OnboardingStep, index: number) => (
    <View key={step.id} style={[styles.stepContainer, { width }]}>
      <LinearGradient
        colors={step.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.stepGradient}
      >
        <View style={styles.stepContent}>
          {/* Header */}
          <View style={styles.stepHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name={step.icon} size={60} color="white" />
            </View>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {step.features.map((feature, featureIndex) => (
              <View key={featureIndex} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Visual Illustration */}
          <View style={styles.illustrationContainer}>
            {index === 0 && (
              <View style={styles.welcomeIllustration}>
                <Ionicons
                  name="football"
                  size={40}
                  color="rgba(255,255,255,0.3)"
                />
                <Ionicons
                  name="people"
                  size={35}
                  color="rgba(255,255,255,0.3)"
                />
                <Ionicons
                  name="trophy"
                  size={45}
                  color="rgba(255,255,255,0.3)"
                />
              </View>
            )}
            {index === 1 && (
              <View style={styles.championshipIllustration}>
                <View style={styles.mockTable}>
                  <View style={styles.mockRow}>
                    <View
                      style={[styles.mockTeam, { backgroundColor: "#FF5722" }]}
                    />
                    <Text style={styles.mockText}>Time A - 9 pts</Text>
                  </View>
                  <View style={styles.mockRow}>
                    <View
                      style={[styles.mockTeam, { backgroundColor: "#2196F3" }]}
                    />
                    <Text style={styles.mockText}>Time B - 6 pts</Text>
                  </View>
                  <View style={styles.mockRow}>
                    <View
                      style={[styles.mockTeam, { backgroundColor: "#4CAF50" }]}
                    />
                    <Text style={styles.mockText}>Time C - 3 pts</Text>
                  </View>
                </View>
              </View>
            )}
            {index === 2 && (
              <View style={styles.drawIllustration}>
                <Ionicons
                  name="shuffle"
                  size={30}
                  color="rgba(255,255,255,0.6)"
                />
                <View style={styles.mockPlayers}>
                  <Text style={styles.mockPlayerText}>João</Text>
                  <Text style={styles.mockPlayerText}>Pedro</Text>
                  <Text style={styles.mockPlayerText}>Carlos</Text>
                  <Text style={styles.mockPlayerText}>Ana</Text>
                </View>
              </View>
            )}
            {index === 3 && (
              <View style={styles.statsIllustration}>
                <View style={styles.mockChart}>
                  <View style={[styles.mockBar, { height: 60 }]} />
                  <View style={[styles.mockBar, { height: 40 }]} />
                  <View style={[styles.mockBar, { height: 80 }]} />
                  <View style={[styles.mockBar, { height: 30 }]} />
                </View>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Skip Button */}
      {currentStep < steps.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>
      )}

      {/* Steps */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {steps.map((step, index) => renderStep(step, index))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Page Indicators */}
        <View style={styles.pageIndicators}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.pageIndicator,
                currentStep === index && styles.activePageIndicator,
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.previousButton,
              currentStep === 0 && styles.disabledButton,
            ]}
            onPress={handlePrevious}
            disabled={currentStep === 0}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
            <Text style={styles.navButtonText}>Anterior</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === steps.length - 1 ? "Começar" : "Próximo"}
            </Text>
            <Ionicons name="chevron-forward" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skipText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  stepGradient: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: 20,
    paddingTop: 100,
  },
  stepHeader: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: "white",
    fontWeight: "500",
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeIllustration: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
  },
  championshipIllustration: {
    alignItems: "center",
  },
  mockTable: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    width: 200,
  },
  mockRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  mockTeam: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  mockText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  drawIllustration: {
    alignItems: "center",
  },
  mockPlayers: {
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
  },
  mockPlayerText: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  statsIllustration: {
    alignItems: "center",
  },
  mockChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  mockBar: {
    width: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
  },
  footer: {
    backgroundColor: "white",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  pageIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    gap: 8,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  activePageIndicator: {
    backgroundColor: theme.colors.primary,
    width: 24,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  previousButton: {
    backgroundColor: theme.colors.background,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
  },
  disabledButton: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "500",
  },
  nextButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
});

export default OnboardingScreen;
