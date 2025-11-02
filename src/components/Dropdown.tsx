import React, { useState } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function Dropdown({
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Select an option',
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (value: string) => {
    onValueChange(value);
    setIsOpen(false);
  };

  const isPlaceholder = !selectedOption;

  return (
    <ThemedView variant="transparent" className={`relative ${className}`}>
      <TouchableOpacity
        className="rounded-2xl border border-outline bg-surface px-4 py-3 flex-row justify-between items-center"
        onPress={() => setIsOpen(!isOpen)}
      >
        <ThemedText className={`flex-1 ${isPlaceholder ? 'text-muted' : 'text-white'}`}>
          {displayText}
        </ThemedText>
        <ThemedText className="ml-2 text-muted">
          {isOpen ? '▲' : '▼'}
        </ThemedText>
      </TouchableOpacity>

      {isOpen && (
        <ThemedView
          variant="surfaceStrong"
          className="absolute top-full left-0 right-0 mt-2 rounded-xl"
          style={{ zIndex: 9999, maxHeight: 160 }}
        >
          <ScrollView>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                className="p-3 border-b border-outline last:border-b-0 bg-surface-strong/0 hover:bg-surface-strong/40 transition-all !duration-100 rounded-xl"
                onPress={() => handleSelect(option.value)}
              >
                <ThemedText>
                  {option.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>
      )}
    </ThemedView>
  );
}