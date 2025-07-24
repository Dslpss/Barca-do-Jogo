import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TimeMix</Text>
      <Button
        title="Cadastrar Jogadores"
        onPress={() => navigation.navigate("Players")}
      />
      <View style={{ height: 16 }} />
      <Button
        title="Cadastrar Times"
        onPress={() => navigation.navigate("Teams")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 32 },
});
