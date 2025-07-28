import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import { theme } from '../theme/theme';

const ChampionshipTypeScreen = () => {
  const navigation = useNavigation();

  const handleSelectType = (type: string) => {
    // Lógica para lidar com a seleção do tipo de campeonato
    console.log(`Tipo de campeonato selecionado: ${type}`);
    // Navegar para a próxima tela, por exemplo, a de configuração do campeonato
    // navigation.navigate('ChampionshipConfig', { type });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader title="Tipo de Campeonato" theme='light' />
      <View style={styles.content}>
        <Text style={styles.title}>Escolha o formato do seu campeonato</Text>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleSelectType('pontos_corridos')}
        >
          <Text style={styles.optionButtonText}>Pontos Corridos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleSelectType('mata_mata')}
        >
          <Text style={styles.optionButtonText}>Mata-Mata</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => handleSelectType('grupos')}
        >
          <Text style={styles.optionButtonText}>Fase de Grupos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  optionButton: {
    ...theme.components.button,
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  optionButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.body.fontSize,
    fontWeight: 'bold',
  },
});

export default ChampionshipTypeScreen;