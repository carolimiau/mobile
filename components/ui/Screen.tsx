import React from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ViewStyle,
  Platform
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  safeArea?: boolean;
  edges?: Edge[];
  backgroundColor?: string;
  statusBarColor?: string;
  statusBarStyle?: 'default' | 'light-content' | 'dark-content';
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  safeArea = true,
  edges,
  backgroundColor = '#F5F5F5',
  statusBarColor,
  statusBarStyle = 'dark-content',
}) => {
  const Container = safeArea ? SafeAreaView : View;
  
  const defaultEdges: Edge[] = ['right', 'top', 'left', 'bottom'];
  const props = safeArea ? { edges: edges || defaultEdges } : {};

  return (
    <Container 
      style={[styles.container, { backgroundColor }, style]} 
      {...props}
    >
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
