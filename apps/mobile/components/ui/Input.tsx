import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
  prefix?: string;
};

export function Input({ label, error, containerStyle, isPassword, prefix, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          style={[styles.input, prefix ? styles.inputWithPrefix : null]}
          placeholderTextColor="#5A5035"
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={isPassword ? "none" : props.autoCapitalize}
          autoCorrect={isPassword ? false : props.autoCorrect}
          {...props}
        />
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#6B5E3C",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: "#221D12",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputWrapperError: {
    borderColor: "#EF4444",
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#EDE0B0",
    fontFamily: "Inter_400Regular",
  },
  inputWithPrefix: {
    paddingLeft: 4,
  },
  prefix: {
    paddingLeft: 16,
    fontSize: 15,
    color: "#EDE0B0",
    fontFamily: "Inter_400Regular",
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  error: {
    color: "#EF4444",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
});
