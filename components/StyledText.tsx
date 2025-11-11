import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';

export const StyledText: React.FC<TextProps & { weight?: 'regular' | 'bold' }> = (props) => {
  const { style, weight = 'regular', ...rest } = props;

  const fontFamily = weight === 'bold'
    ? 'Poppins_700Bold'
    : 'Poppins_400Regular';

  return (
    <Text
      style={[{ fontFamily: fontFamily }, style]}
      {...rest}
    />
  );
};