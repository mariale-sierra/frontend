import {
  View,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useState } from 'react';
import { Text } from './text';
import { spacing, radius, colors } from '../../constants/theme';

interface Option {
  label: string;
  value: string;
  icon?: React.ReactNode;
  render?: () => React.ReactNode; // para casos custom (row.tsx)
}

/**
 * DropdownProps defines all configurable props for the Dropdown component.
 *
 * @property options - List of available options. Each option needs a unique `value` and display `label`.
 *   You can also provide `icon` for the default row rendering or `render` for fully custom option content.
 * @property selectedValues - Controlled list of currently selected option values.
 * @property onChange - Callback fired with the next selected values when an option is toggled.
 * @property placeholder - Optional title text shown in the dropdown header.
 * @property showValueInline - When true, shows the first selected option label in the header (default: false).
 * @property rightIcon - Optional element rendered on the right side of the header (for example, a chevron).
 * @property maxSelections - Optional maximum number of options that can be selected.
 *   Once reached, unselected options become disabled until one is deselected.
 */

interface DropdownProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;

  placeholder?: string;
  showValueInline?: boolean; // "Visibility: Public"
  rightIcon?: React.ReactNode;
  maxSelections?: number;
}

export function Dropdown({
  options,
  selectedValues,
  onChange,
  placeholder,
  showValueInline = false,
  rightIcon,
  maxSelections,
}: DropdownProps) {
  const [open, setOpen] = useState(false);

  function toggleValue(value: string) {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      if (maxSelections && selectedValues.length >= maxSelections) {
        return; // Do not add if limit reached
      }
      onChange([...selectedValues, value]);
    }
  }

  function getSelectedLabel() {
    const selected = options.find(o => selectedValues.includes(o.value));
    return selected?.label ?? '';
  }

  return (
    <View>
      {/* HEADER */}
      <Pressable
        onPress={() => setOpen(!open)}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {placeholder && (
            <Text variant="subheader">{placeholder}</Text>
          )}

          {showValueInline && (
            <Text variant="body">{getSelectedLabel()}</Text>
          )}
        </View>

        {rightIcon}
      </Pressable>

      {/* OPTIONS */}
      {open && (
        <View style={styles.dropdown}>

          {options.map(option => {
    const selected = selectedValues.includes(option.value);

  const isDisabledOption =
    !selected &&
    maxSelections !== undefined &&
    selectedValues.length >= maxSelections;

  return (
    <Pressable
      key={option.value}
      onPress={() => {
        if (isDisabledOption) return;
        toggleValue(option.value);
      }}
      style={[
        styles.option,
        selected && styles.selected,
        isDisabledOption && styles.disabledOption,
      ]}
    >
      {option.render ? (
        option.render()
      ) : (
        <View style={styles.row}>
          {option.icon}
          <Text variant="body">{option.label}</Text>
        </View>
      )}
    </Pressable>
  );
})}
        
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerContent: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  dropdown: {
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },

  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },

  selected: {
    backgroundColor: colors.surfaceHighlight, 
  },

  disabledOption: {
    opacity: 0.4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});