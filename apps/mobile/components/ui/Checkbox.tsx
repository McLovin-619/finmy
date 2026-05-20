import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type CheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  label?: React.ReactNode;
};

export function Checkbox({ checked, onToggle, label }: CheckboxProps) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      style={styles.row}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Ionicons name="checkmark" size={13} color="white" /> : null}
      </View>
      {label ? <View style={styles.labelContainer}>{label}</View> : null}
    </TouchableOpacity>
  );
}

type SimpleCheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
};

export function SimpleCheckbox({ checked, onToggle, label }: SimpleCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      onToggle={onToggle}
      label={<Text style={styles.labelText}>{label}</Text>}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  boxChecked: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  labelContainer: {},
  labelText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
