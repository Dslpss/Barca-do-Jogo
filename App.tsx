// import ChampionshipTypeScreen from "./src/screens/ChampionshipTypeScreen";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "./src/screens/HomeScreen";
import PlayersScreen from "./src/screens/PlayersScreen";
import TeamsScreen from "./src/screens/TeamsScreen";
import AssignPlayersScreen from "./src/screens/AssignPlayersScreen";
import MatchScheduleScreen from "./src/screens/MatchScheduleScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName = "home";
            if (route.name === "Home") iconName = "home";
            else if (route.name === "Players") iconName = "people";
            else if (route.name === "Teams") iconName = "shirt";
            else if (route.name === "AssignPlayers") iconName = "shuffle";
            // Usando Ionicons
            const { Ionicons } = require("@expo/vector-icons");
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Início" }}
        />
        <Tab.Screen
          name="Players"
          component={PlayersScreen}
          options={{ title: "Jogadores" }}
        />
        <Tab.Screen
          name="Teams"
          component={TeamsScreen}
          options={{ title: "Times" }}
        />
        <Tab.Screen
          name="AssignPlayers"
          component={AssignPlayersScreen}
          options={{ title: "Distribuir Jogadores" }}
        />
        {/* Removido: tela de tipo de campeonato, agora integrado na tela de jogos */}
        <Tab.Screen
          name="MatchSchedule"
          component={MatchScheduleScreen}
          options={{ title: "Jogos" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
// ...existing code...
