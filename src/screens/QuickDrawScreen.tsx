import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../components/AppHeader";
import ColorPicker from "../components/ColorPicker";
import { theme } from "../theme/theme";

// Tipo para jogador no sorteio rápido
interface QuickPlayer {
  id: string;
  name: string;
  skill: number; // 1-5
  selected: boolean;
}

// Tipo para time no sorteio rápido
interface QuickTeam {
  id: string;
  name: string;
  color: string;
  players: QuickPlayer[];
}

// Tipo para função específica no sorteio
interface SpecificRole {
  id: string;
  name: string;
  assignedPlayer?: QuickPlayer;
}

const QuickDrawScreen = () => {
  // Estados para gerenciar jogadores
  const [players, setPlayers] = useState<QuickPlayer[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerSkill, setNewPlayerSkill] = useState(3);
  
  // Estados para gerenciar times
  const [teams, setTeams] = useState<QuickTeam[]>([]);
  const [numberOfTeams, setNumberOfTeams] = useState(2);
  const [balanceTeams, setBalanceTeams] = useState(true);
  
  // Estados para gerenciar cores
  const [availableColors, setAvailableColors] = useState<string[]>([
    "#FF5252", // Vermelho
    "#448AFF", // Azul
    "#66BB6A", // Verde
    "#FFCA28", // Amarelo
    "#AB47BC", // Roxo
    "#FF7043", // Laranja
    "#78909C", // Cinza Azulado
    "#EC407A", // Rosa
    "#7E57C2", // Índigo
    "#26A69A", // Verde-água
  ]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColorIndex, setCurrentColorIndex] = useState(-1);
  
  // Estados para funções específicas
  const [specificRoles, setSpecificRoles] = useState<SpecificRole[]>([
    { id: "1", name: "Goleiro" },
    { id: "2", name: "Capitão" },
    { id: "3", name: "Batedor de Pênalti" },
  ]);
  const [newRoleName, setNewRoleName] = useState("");

  // Carregar dados salvos
  useEffect(() => {
    loadSavedData();
  }, []);

  // Salvar dados quando houver mudanças
  useEffect(() => {
    saveData();
  }, [players, teams, availableColors, specificRoles]);

  // Função para carregar dados salvos
  const loadSavedData = async () => {
    try {
      const savedPlayers = await AsyncStorage.getItem("quickDraw_players");
      const savedColors = await AsyncStorage.getItem("quickDraw_colors");
      const savedRoles = await AsyncStorage.getItem("quickDraw_roles");
      
      if (savedPlayers) setPlayers(JSON.parse(savedPlayers));
      if (savedColors) setAvailableColors(JSON.parse(savedColors));
      if (savedRoles) setSpecificRoles(JSON.parse(savedRoles));
    } catch (error) {
      console.error("Erro ao carregar dados salvos:", error);
    }
  };

  // Função para salvar dados
  const saveData = async () => {
    try {
      await AsyncStorage.setItem("quickDraw_players", JSON.stringify(players));
      await AsyncStorage.setItem("quickDraw_colors", JSON.stringify(availableColors));
      await AsyncStorage.setItem("quickDraw_roles", JSON.stringify(specificRoles));
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
    }
  };

  // Adicionar novo jogador
  const addPlayer = () => {
    if (!newPlayerName.trim()) {
      Alert.alert("Erro", "Digite o nome do jogador");
      return;
    }

    const newPlayer: QuickPlayer = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      skill: newPlayerSkill,
      selected: true,
    };

    setPlayers([...players, newPlayer]);
    setNewPlayerName("");
    setNewPlayerSkill(3);
  };

  // Remover jogador
  const removePlayer = (id: string) => {
    setPlayers(players.filter(player => player.id !== id));
  };

  // Alternar seleção de jogador
  const togglePlayerSelection = (id: string) => {
    setPlayers(
      players.map(player => 
        player.id === id 
          ? { ...player, selected: !player.selected } 
          : player
      )
    );
  };

  // Adicionar nova função específica
  const addSpecificRole = () => {
    if (!newRoleName.trim()) {
      Alert.alert("Erro", "Digite o nome da função");
      return;
    }

    const newRole: SpecificRole = {
      id: Date.now().toString(),
      name: newRoleName.trim(),
    };

    setSpecificRoles([...specificRoles, newRole]);
    setNewRoleName("");
  };

  // Remover função específica
  const removeSpecificRole = (id: string) => {
    setSpecificRoles(specificRoles.filter(role => role.id !== id));
  };

  // Sortear times
  const drawTeams = () => {
    const selectedPlayers = players.filter(player => player.selected);
    
    if (selectedPlayers.length < numberOfTeams) {
      Alert.alert("Erro", "Número de jogadores selecionados deve ser maior ou igual ao número de times");
      return;
    }

    // Criar times vazios
    const newTeams: QuickTeam[] = [];
    for (let i = 0; i < numberOfTeams; i++) {
      newTeams.push({
        id: `team_${i + 1}`,
        name: `Time ${i + 1}`,
        color: availableColors[i % availableColors.length],
        players: [],
      });
    }

    // Clonar jogadores selecionados para não modificar o original
    let playersToDistribute = [...selectedPlayers];
    
    // Ordenar por habilidade se balanceamento estiver ativado
    if (balanceTeams) {
      playersToDistribute.sort((a, b) => b.skill - a.skill);
      
      // Distribuir jogadores em "serpentina" para equilibrar os times
      let teamIndex = 0;
      let direction = 1; // 1 para frente, -1 para trás
      
      while (playersToDistribute.length > 0) {
        // Pegar o próximo jogador
        const player = playersToDistribute.shift();
        if (player) {
          newTeams[teamIndex].players.push(player);
        }
        
        // Atualizar índice do time
        teamIndex += direction;
        
        // Mudar direção se chegou ao final ou início
        if (teamIndex >= newTeams.length - 1) {
          direction = -1;
        } else if (teamIndex <= 0) {
          direction = 1;
        }
      }
    } else {
      // Embaralhar jogadores aleatoriamente
      playersToDistribute.sort(() => Math.random() - 0.5);
      
      // Distribuir igualmente entre os times
      for (let i = 0; i < playersToDistribute.length; i++) {
        const teamIndex = i % newTeams.length;
        newTeams[teamIndex].players.push(playersToDistribute[i]);
      }
    }
    
    setTeams(newTeams);
  };

  // Sortear funções específicas
  const drawSpecificRoles = () => {
    const selectedPlayers = players.filter(player => player.selected);
    
    if (selectedPlayers.length === 0) {
      Alert.alert("Erro", "Selecione pelo menos um jogador");
      return;
    }

    // Clonar funções para não modificar o original
    const updatedRoles = [...specificRoles];
    
    // Embaralhar jogadores
    const shuffledPlayers = [...selectedPlayers].sort(() => Math.random() - 0.5);
    
    // Atribuir jogadores às funções
    updatedRoles.forEach((role, index) => {
      if (index < shuffledPlayers.length) {
        role.assignedPlayer = shuffledPlayers[index];
      } else {
        role.assignedPlayer = undefined;
      }
    });
    
    setSpecificRoles(updatedRoles);
  };

  // Limpar resultados
  const clearResults = () => {
    setTeams([]);
    setSpecificRoles(specificRoles.map(role => ({ ...role, assignedPlayer: undefined })));
  };

  // Renderizar item de jogador
  const renderPlayerItem = ({ item, index }: { item: QuickPlayer; index: number }) => (
    <View key={index} style={styles.playerItem}>
      <TouchableOpacity
        style={[styles.playerCheckbox, item.selected && styles.playerCheckboxSelected]}
        onPress={() => togglePlayerSelection(item.id)}
      >
        {item.selected && <Ionicons name="checkmark" size={16} color="#fff" />}
      </TouchableOpacity>
      
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.name}</Text>
        <View style={styles.skillContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <Ionicons
              key={star}
              name="star"
              size={14}
              color={star <= item.skill ? "#FFD700" : theme.colors.border}
            />
          ))}
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => removePlayer(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );

  // Renderizar item de time
  const renderTeamItem = ({ item, index }: { item: QuickTeam; index: number }) => (
    <View key={index} style={[styles.teamCard, { borderLeftColor: item.color, borderLeftWidth: 6 }]}>
      <View style={styles.teamHeader}>
        <View style={[styles.teamColorIndicator, { backgroundColor: item.color }]} />
        <Text style={styles.teamName}>{item.name}</Text>
        <Text style={styles.teamPlayerCount}>{item.players.length} jogadores</Text>
      </View>
      
      <View style={styles.teamPlayersList}>
        {item.players.map(player => (
          <View key={player.id} style={styles.teamPlayerItem}>
            <Text style={styles.teamPlayerName}>{player.name}</Text>
            <View style={styles.teamPlayerSkill}>
              {[1, 2, 3, 4, 5].map(star => (
                <Ionicons
                  key={star}
                  name="star"
                  size={12}
                  color={star <= player.skill ? "#FFD700" : theme.colors.border}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  // Renderizar item de função específica
  const renderRoleItem = ({ item, index }: { item: SpecificRole; index: number }) => (
    <View key={index} style={styles.roleItem}>
      <View style={styles.roleInfo}>
        <Text style={styles.roleName}>{item.name}</Text>
        {item.assignedPlayer ? (
          <Text style={styles.roleAssignedPlayer}>{item.assignedPlayer.name}</Text>
        ) : (
          <Text style={styles.roleUnassigned}>Não atribuído</Text>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => removeSpecificRole(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title="Sorteio Rápido"
        subtitle="Sorteie times e funções"
        icon="shuffle"
        theme="light"
      />
      
      <ScrollView style={styles.content}>
        {/* Seção de Jogadores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jogadores</Text>
          
          <View style={styles.addPlayerForm}>
            <TextInput
              style={styles.input}
              placeholder="Nome do jogador"
              value={newPlayerName}
              onChangeText={setNewPlayerName}
            />
            
            <View style={styles.skillSelector}>
              <Text style={styles.skillLabel}>Nível:</Text>
              <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setNewPlayerSkill(star)}
                  >
                    <Ionicons
                      name="star"
                      size={24}
                      color={star <= newPlayerSkill ? "#FFD700" : theme.colors.border}
                      style={styles.starIcon}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={addPlayer}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.playersList}>
            {players.length === 0 ? (
              <Text style={styles.emptyListText}>
                Nenhum jogador adicionado. Adicione jogadores para começar.
              </Text>
            ) : (
              players.map((player, index) => renderPlayerItem({ item: player, index }))
            )}
          </View>
        </View>
        
        {/* Seção de Configuração de Times */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuração de Times</Text>
          
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Número de Times:</Text>
            <View style={styles.numberSelector}>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => setNumberOfTeams(Math.max(2, numberOfTeams - 1))}
              >
                <Ionicons name="remove" size={20} color="#fff" />
              </TouchableOpacity>
              
              <Text style={styles.numberValue}>{numberOfTeams}</Text>
              
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => setNumberOfTeams(Math.min(10, numberOfTeams + 1))}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Equilibrar Times:</Text>
            <Switch
              value={balanceTeams}
              onValueChange={setBalanceTeams}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={balanceTeams ? theme.colors.primary : "#f4f3f4"}
            />
          </View>
          
          <TouchableOpacity
            style={styles.drawButton}
            onPress={drawTeams}
          >
            <Ionicons name="shuffle" size={24} color="#fff" />
            <Text style={styles.drawButtonText}>Sortear Times</Text>
          </TouchableOpacity>
        </View>
        
        {/* Seção de Cores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cores Disponíveis</Text>
          
          <View style={styles.colorsContainer}>
            {availableColors.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.colorItem, { backgroundColor: color }]}
                onPress={() => {
                  setCurrentColorIndex(index);
                  setShowColorPicker(true);
                }}
              />
            ))}
            
            <TouchableOpacity
              style={styles.addColorButton}
              onPress={() => {
                setCurrentColorIndex(-1);
                setShowColorPicker(true);
              }}
            >
              <Ionicons name="add" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          {showColorPicker && (
            <View style={styles.colorPickerContainer}>
              <ColorPicker
                onColorSelected={(color: string) => {
                  if (currentColorIndex >= 0) {
                    // Atualizar cor existente
                    const updatedColors = [...availableColors];
                    updatedColors[currentColorIndex] = color;
                    setAvailableColors(updatedColors);
                  } else {
                    // Adicionar nova cor
                    setAvailableColors([...availableColors, color]);
                  }
                }}
                initialColor={currentColorIndex >= 0 ? availableColors[currentColorIndex] : "#FF5252"}
                visible={true}
                onClose={() => setShowColorPicker(false)}
              />
            </View>
          )}
        </View>
        
        {/* Seção de Funções Específicas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Funções Específicas</Text>
          
          <View style={styles.addRoleForm}>
            <TextInput
              style={styles.input}
              placeholder="Nome da função"
              value={newRoleName}
              onChangeText={setNewRoleName}
            />
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={addSpecificRole}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.rolesList}>
            {specificRoles.length === 0 ? (
              <Text style={styles.emptyListText}>
                Nenhuma função adicionada. Adicione funções para começar.
              </Text>
            ) : (
              specificRoles.map((role, index) => renderRoleItem({ item: role, index }))
            )}
          </View>
          
          <TouchableOpacity
            style={styles.drawButton}
            onPress={drawSpecificRoles}
          >
            <Ionicons name="shuffle" size={24} color="#fff" />
            <Text style={styles.drawButtonText}>Sortear Funções</Text>
          </TouchableOpacity>
        </View>
        
        {/* Resultados do Sorteio de Times */}
        {teams.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Times Sorteados</Text>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearResults}
              >
                <Ionicons name="refresh" size={20} color={theme.colors.error} />
                <Text style={styles.clearButtonText}>Limpar</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.teamsList}>
              {teams.map((team, index) => renderTeamItem({ item: team, index }))}
            </View>
          </View>
        )}
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
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 16,
  },
  addPlayerForm: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
  },
  skillSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  skillLabel: {
    fontSize: 16,
    marginRight: 8,
    color: theme.colors.text,
  },
  starContainer: {
    flexDirection: "row",
  },
  starIcon: {
    marginHorizontal: 2,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  playersList: {
    maxHeight: 200,
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  playerCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  playerCheckboxSelected: {
    backgroundColor: theme.colors.primary,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  skillContainer: {
    flexDirection: "row",
  },
  deleteButton: {
    padding: 8,
  },
  configRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  configLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  numberSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  numberButton: {
    backgroundColor: theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  numberValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 16,
    color: theme.colors.text,
  },
  drawButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  drawButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  colorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  colorItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  addColorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  colorPickerContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  closeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 16,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  addRoleForm: {
    flexDirection: "row",
    marginBottom: 16,
  },
  rolesList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  roleItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 4,
  },
  roleAssignedPlayer: {
    fontSize: 14,
    color: theme.colors.success,
  },
  roleUnassigned: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
  },
  teamsList: {
    marginTop: 8,
  },
  teamCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  teamColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  teamName: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    flex: 1,
  },
  teamPlayerCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  teamPlayersList: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  teamPlayerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  teamPlayerName: {
    fontSize: 16,
    color: theme.colors.text,
  },
  teamPlayerSkill: {
    flexDirection: "row",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearButtonText: {
    color: theme.colors.error,
    marginLeft: 4,
    fontWeight: "bold",
  },
  emptyListText: {
    textAlign: "center",
    color: theme.colors.textSecondary,
    fontStyle: "italic",
    padding: 16,
  },
});

export default QuickDrawScreen;