// import ChampionshipTypeScreen from "./src/screens/ChampionshipTypeScreen";
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

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Players" component={PlayersScreen} />
        <Stack.Screen name="Teams" component={TeamsScreen} />
        <Stack.Screen name="AssignPlayers" component={AssignPlayersScreen} />
        <Stack.Screen name="MatchSchedule" component={MatchScheduleScreen} />
        <Stack.Screen
          name="ChampionshipType"
          component={ChampionshipTypeScreen}
        />
        <Stack.Screen
          name="HistoryReports"
          component={HistoryReportsScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
// ...existing code...
