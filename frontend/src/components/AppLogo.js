import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import theme from '../theme/theme';

const AppLogo = ({ size = 'medium', showTagline = false, style }) => {
  const imageSize = size === 'large' ? 174 : size === 'small' ? 94 : 122;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../assets/fresh mart logo.jpeg')}
        style={{ width: imageSize, height: imageSize }}
        resizeMode="contain"
        accessibilityLabel="FreshMart"
      />
      {showTagline && (
        <Text style={styles.tagline}>Fresh groceries, delivered fast.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
});

export default AppLogo;
