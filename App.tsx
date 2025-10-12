import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LogBox } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HomeScreen from "./src/screens/HomeScreen";
import { AuthProvider } from "./src/contexts/AuthContext";
import { AuthGuard } from "./src/components/AuthGuard";
import { ErrorBoundary } from "./src/components/ErrorBoundary";

// Telas do Sistema de Campeonatos
import ChampionshipIntroScreen from "./src/screens/ChampionshipIntroScreen";
import ChampionshipManagerScreen from "./src/screens/ChampionshipManagerScreen";
import ChampionshipTeamsScreen from "./src/screens/ChampionshipTeamsScreen";
import ChampionshipPlayersScreen from "./src/screens/ChampionshipPlayersScreen";
import ChampionshipAllPlayersScreen from "./src/screens/ChampionshipAllPlayersScreen";
import ChampionshipMatchesScreen from "./src/screens/ChampionshipMatchesScreen";
import ChampionshipTableScreen from "./src/screens/ChampionshipTableScreen";
import QuickDrawScreen from "./src/screens/QuickDrawScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import StatsScreen from "./src/screens/StatsScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";

// Ignorar warnings específicos do Firebase que são conhecidos
LogBox.ignoreLogs([
  "AsyncStorage has been extracted from react-native",
  "@firebase/auth: Auth (10.11.0)",
]);

const Stack = createNativeStackNavigator();

export default function App() {
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    try {
      const onboardingCompleted = await AsyncStorage.getItem(
        "onboarding_completed"
      );
      setIsFirstTime(!onboardingCompleted);
    } catch (error) {
      console.error("Erro ao verificar onboarding:", error);
      setIsFirstTime(false);
    }
  };

  // Mostrar loading enquanto verifica o estado
  if (isFirstTime === null) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthGuard>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName={isFirstTime ? "Onboarding" : "Home"}
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="Home" component={HomeScreen} />

              {/* Tela de Onboarding */}
              <Stack.Screen
                name="Onboarding"
                component={OnboardingScreen}
                options={{ gestureEnabled: false }}
              />

              {/* Telas do Sistema de Campeonatos */}
              <Stack.Screen
                name="ChampionshipIntro"
                component={ChampionshipIntroScreen}
              />
              <Stack.Screen
                name="ChampionshipManager"
                component={ChampionshipManagerScreen}
              />
              <Stack.Screen
                name="ChampionshipTeams"
                component={ChampionshipTeamsScreen}
              />
              <Stack.Screen
                name="ChampionshipPlayers"
                component={ChampionshipPlayersScreen}
              />
              <Stack.Screen
                name="ChampionshipAllPlayers"
                component={ChampionshipAllPlayersScreen}
              />
              <Stack.Screen
                name="ChampionshipMatches"
                component={ChampionshipMatchesScreen}
              />
              <Stack.Screen
                name="ChampionshipTable"
                component={ChampionshipTableScreen}
              />

              {/* Tela de Sorteio Rápido */}
              <Stack.Screen name="QuickDraw" component={QuickDrawScreen} />

              {/* Telas Adicionais */}
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="Stats" component={StatsScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthGuard>
      </AuthProvider>
    </ErrorBoundary>
  );
}
