import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerProps {
  label?: string;
  value: string; // Format: DD/MM/YYYY
  onChange: (date: string) => void;
  placeholder?: string;
  error?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'DD/MM/AAAA',
  error,
  maximumDate,
  minimumDate
}) => {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [day, month, year] = dateStr.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleOpen = () => {
    let date = parseDate(value);
    
    // Si la fecha actual es menor a la mínima, ajustamos a la mínima
    if (minimumDate) {
      // Comparar solo fechas sin horas
      const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const min = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate());
      if (current < min) {
        date = new Date(minimumDate);
      }
    }
    
    setTempDate(date);
    setShow(true);
  };

  const handleAndroidChange = (event: any, selectedDate?: Date) => {
    setShow(false);
    if (selectedDate) {
      onChange(formatDate(selectedDate));
    }
  };

  const handleIOSChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleIOSConfirm = () => {
    onChange(formatDate(tempDate));
    setShow(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.input, error ? styles.inputError : null]}
        onPress={handleOpen}
      >
        <Text style={[styles.valueText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#666" />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Android Date Picker */}
      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={parseDate(value)}
          mode="date"
          display="default"
          onChange={handleAndroidChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}
      
      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal 
          transparent={true} 
          animationType="fade"
          visible={show}
          onRequestClose={() => setShow(false)}
        >
          <View style={styles.iosModalOverlay}>
            <View style={styles.iosModalContent}>
              <View style={styles.iosModalHeader}>
                <TouchableOpacity onPress={handleIOSConfirm}>
                  <Text style={styles.iosModalButton}>Listo</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleIOSChange}
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                style={{ height: 200 }}
                textColor="black"
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputError: {
    borderColor: '#F44336',
  },
  valueText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  iosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  iosModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  iosModalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  iosModalButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
