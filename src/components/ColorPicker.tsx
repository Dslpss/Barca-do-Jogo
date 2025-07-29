import React, { useState } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Text } from 'react-native';
import ColorPicker from 'react-native-wheel-color-picker';
import { theme } from '../theme/theme';

type ColorPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onColorSelected: (color: string) => void;
  initialColor?: string;
};

export default function ColorPickerModal({
  visible,
  onClose,
  onColorSelected,
  initialColor = '#FF0000'
}: ColorPickerModalProps) {
  const [currentColor, setCurrentColor] = useState(initialColor);

  const handleColorChange = (color: string) => {
    setCurrentColor(color);
  };

  const handleConfirm = () => {
    onColorSelected(currentColor);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Escolha uma cor</Text>
          <View style={styles.pickerContainer}>
            <ColorPicker
              color={currentColor}
              onColorChange={handleColorChange}
              thumbSize={30}
              sliderSize={30}
              noSnap={true}
              row={false}
            />
          </View>
          <View style={styles.previewContainer}>
            <View style={[styles.colorPreview, { backgroundColor: currentColor }]} />
            <Text style={styles.colorText}>{currentColor.toUpperCase()}</Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.lg,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  pickerContainer: {
    height: 300,
    marginBottom: theme.spacing.md,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  colorText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  confirmButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
});