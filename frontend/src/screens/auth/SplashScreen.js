import React, { useEffect, useRef } from 'react';
import {
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AppLogo from '../../components/AppLogo';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import theme from '../../theme/theme';

const SplashScreen = ({ navigation, route }) => {
  const variant = route.params?.variant || 'B';
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (variant !== 'B') return undefined;

    const animation = Animated.timing(progress, {
      duration: 1800,
      toValue: 1,
      useNativeDriver: false,
    });
    animation.start();
    const timeout = setTimeout(() => navigation.replace('RoleSelect'), 1900);

    return () => {
      animation.stop();
      clearTimeout(timeout);
    };
  }, [navigation, progress, variant]);

  const goToRoles = () => navigation.navigate('RoleSelect');
  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <View style={styles.center}>
          <AppLogo size={variant === 'B' ? 'medium' : 'large'} />
          {variant === 'A' && (
            <>
              <Text style={styles.tagline}>Fresh groceries, delivered fast.</Text>
              <View style={styles.dots}>
                <View style={[styles.dot, styles.activeDot]} />
                <View style={[styles.dot, styles.middleDot]} />
                <View style={styles.dot} />
              </View>
            </>
          )}
          {variant === 'B' && (
            <>
              <Text style={styles.eyebrow}>GROCERY DELIVERY</Text>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: barWidth }]} />
              </View>
            </>
          )}
          {variant === 'C' && (
            <View style={styles.welcomeChip}>
              <Text style={styles.welcomeText}>Welcome back</Text>
            </View>
          )}
        </View>
        {variant !== 'B' && (
          <View style={styles.bottom}>
            {variant === 'A' ? (
              <PrimaryButton
                icon={<Ionicons name="arrow-forward" size={17} color="#FFFFFF" />}
                onPress={goToRoles}
                title="Get Started"
              />
            ) : (
              <SecondaryButton
                icon={<Ionicons name="arrow-forward" size={17} color={theme.colors.primary} />}
                onPress={goToRoles}
                title="Continue"
              />
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
  },
  tagline: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 20,
  },
  dot: {
    backgroundColor: '#DDE5DE',
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  activeDot: {
    backgroundColor: theme.colors.darkGreen,
  },
  middleDot: {
    backgroundColor: theme.colors.primary,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: -3,
  },
  progressTrack: {
    backgroundColor: '#DFE8E1',
    borderRadius: 2,
    height: 4,
    marginTop: 18,
    overflow: 'hidden',
    width: 72,
  },
  progressFill: {
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
    height: 4,
  },
  welcomeChip: {
    backgroundColor: '#DDF3E5',
    borderRadius: 16,
    marginTop: 1,
    paddingHorizontal: 13,
    paddingVertical: 5,
  },
  welcomeText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  bottom: {
    bottom: 34,
    left: 28,
    position: 'absolute',
    right: 28,
  },
});

export default SplashScreen;
