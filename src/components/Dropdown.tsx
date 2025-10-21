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

  return (
    <ThemedView className={`relative ${className}`}>
      <TouchableOpacity
        className="border border-gray-300 dark:border-gray-600 rounded p-3 flex-row justify-between items-center"
        onPress={() => setIsOpen(!isOpen)}
      >
        <ThemedText className="text-black dark:text-white flex-1">
          {displayText}
        </ThemedText>
        <ThemedText className="text-gray-500 ml-2">
          {isOpen ? '▲' : '▼'}
        </ThemedText>
      </TouchableOpacity>

      {isOpen && (
        <ThemedView className="absolute top-full left-0 right-0 border border-gray-300 dark:border-gray-600 rounded-b bg-white dark:bg-gray-800" style={{ zIndex: 9999, maxHeight: 160 }}>
          <ScrollView>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                className="p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                onPress={() => handleSelect(option.value)}
              >
                <ThemedText className="text-black dark:text-white">
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