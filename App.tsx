import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/screens/HomeScreen";
import PlayersScreen from "./src/screens/PlayersScreen";
import TeamsScreen from "./src/screens/TeamsScreen";
import AssignPlayersScreen from "./src/screens/AssignPlayersScreen";
import MatchScheduleScreen from "./src/screens/MatchScheduleScreen";
import ChampionshipTypeScreen from "./src/screens/ChampionshipTypeScreen";
import { HistoryReportsScreen } from "./src/screens/HistoryReportsScreen";
import { AuthProvider } from "./src/contexts/AuthContext";
import { AuthGuard } from "./src/components/AuthGuard";

// Telas do Sistema de Campeonatos
import ChampionshipIntroScreen from "./src/screens/ChampionshipIntroScreen";
import ChampionshipManagerScreen from "./src/screens/ChampionshipManagerScreen";
import ChampionshipTeamsScreen from "./src/screens/ChampionshipTeamsScreen";
import ChampionshipPlayersScreen from "./src/screens/ChampionshipPlayersScreen";
import ChampionshipMatchesScreen from "./src/screens/ChampionshipMatchesScreen";
import ChampionshipTableScreen from "./src/screens/ChampionshipTableScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Players" component={PlayersScreen} />
            <Stack.Screen name="Teams" component={TeamsScreen} />
            <Stack.Screen
              name="AssignPlayers"
              component={AssignPlayersScreen}
            />
            <Stack.Screen
              name="MatchSchedule"
              component={MatchScheduleScreen}
            />
            <Stack.Screen
              name="ChampionshipType"
              component={ChampionshipTypeScreen}
            />
            <Stack.Screen
              name="HistoryReports"
              component={HistoryReportsScreen}
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
  );
}
// ...existing code...
