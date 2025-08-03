import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LogBox } from "react-native";
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

// Ignorar warnings específicos do Firebase que são conhecidos
LogBox.ignoreLogs([
  "AsyncStorage has been extracted from react-native",
  "@firebase/auth: Auth (10.11.0)",
]);

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthGuard>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="Home" component={HomeScreen} />

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
            </Stack.Navigator>
          </NavigationContainer>
        </AuthGuard>
      </AuthProvider>
    </ErrorBoundary>
  );
}
