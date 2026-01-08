import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ViewStyle,
  Platform
} from 'react-native';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  safeArea?: boolean;
  backgroundColor?: string;
  statusBarColor?: string;
  statusBarStyle?: 'default' | 'light-content' | 'dark-content';
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  safeArea = true,
  backgroundColor = '#F5F5F5',
  statusBarColor,
  statusBarStyle = 'dark-content',
}) => {
  const Container = safeArea ? SafeAreaView : View;

  return (
    <Container style={[styles.container, { backgroundColor }, style]}>
      <StatusBar
        backgroundColor={statusBarColor || backgroundColor}
        barStyle={statusBarStyle}
      />
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
