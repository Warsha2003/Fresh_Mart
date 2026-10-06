import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppLogo from './AppLogo';
import theme from '../theme/theme';

const AuthScreenLayout = ({ children, scrollRef }) => (
  <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboard}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={['#DDF5E6', theme.colors.background]}
            end={{ x: 0.8, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.circle} />
          <AppLogo size="small" />
        </View>
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    height: 162,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingTop: 5,
  },
  circle: {
    backgroundColor: 'rgba(255,255,255,0.38)',
    borderRadius: 100,
    height: 185,
    position: 'absolute',
    right: -47,
    top: -78,
    width: 185,
  },
  content: {
    marginTop: -2,
    paddingBottom: 22,
    paddingHorizontal: 28,
  },
});

export default AuthScreenLayout;
