import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./screens/HomeScreen";
import PlayersScreen from "./screens/PlayersScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "TimeMix" }}
        />
        <Stack.Screen
          name="Players"
          component={PlayersScreen}
          options={{ title: "Jogadores" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
