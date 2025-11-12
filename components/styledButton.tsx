import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { StyledText as Text } from './StyledText';
import { Colors } from '../constants/colors';

type StyledButtonProps = {
  title: string;
  onPress: () => void;
  color?: 'primary' | 'danger' | 'disabled';
  disabled?: boolean;
  loading?: boolean;
};

export const StyledButton: React.FC<StyledButtonProps> = ({ 
  title, 
  onPress, 
  color = 'primary', 
  disabled = false, 
  loading = false 
}) => {
  
  const textStyle = [
    styles.text,
    color === 'primary' && styles.primaryText,
    color === 'danger' && styles.dangerText,
    (disabled || loading) && styles.disabledText,
  ];

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator color={Colors.PRIMARY} />
      ) : (
        <Text weight="bold" style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 16,
  },
  primaryText: {
    color: Colors.PRIMARY,
  },
  dangerText: {
    color: Colors.DANGER,
  },
  disabledText: {
    color: Colors.DISABLED,
  }
});