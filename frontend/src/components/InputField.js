import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme/theme';

const InputField = ({
  label,
  value,
  onChangeText,
  icon,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  prefix,
  editable = true,
  maxLength,
  inputMode,
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View style={styles.container}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputBox, error && styles.inputBoxError]}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={theme.colors.muted}
            style={styles.icon}
          />
        )}
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          accessibilityLabel={label}
          autoCapitalize={autoCapitalize}
          editable={editable}
          inputMode={inputMode}
          keyboardType={keyboardType}
          maxLength={maxLength}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          secureTextEntry={isPassword && !passwordVisible}
          style={styles.input}
          value={value}
        />
        {isPassword && (
          <TouchableOpacity
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={theme.colors.muted}
            />
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 11,
  },
  label: {
    color: '#43564A',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 5,
  },
  inputBox: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.small,
    borderWidth: 1,
    flexDirection: 'row',
    height: 44,
    paddingHorizontal: 12,
  },
  inputBoxError: {
    borderColor: theme.colors.danger,
  },
  icon: {
    marginRight: 9,
  },
  prefix: {
    borderRightColor: theme.colors.border,
    borderRightWidth: 1,
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 9,
    paddingRight: 9,
  },
  input: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 13,
    height: '100%',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 11,
    marginTop: 4,
  },
});

export default InputField;
