import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SelectPicker } from './SelectPicker';

const { height } = Dimensions.get('window');

export interface FilterState {
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  minYear?: string;
  maxYear?: string;
  marca?: string;
  transmision?: string;
  combustible?: string;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  onReset: () => void;
  currentFilters: FilterState;
}

const MARCAS = [
  { label: 'Todas', value: '' },
  { label: 'Toyota', value: 'Toyota' },
  { label: 'Chevrolet', value: 'Chevrolet' },
  { label: 'Hyundai', value: 'Hyundai' },
  { label: 'Kia', value: 'Kia' },
  { label: 'Nissan', value: 'Nissan' },
  { label: 'Suzuki', value: 'Suzuki' },
  { label: 'Ford', value: 'Ford' },
  { label: 'Mazda', value: 'Mazda' },
  { label: 'Volkswagen', value: 'Volkswagen' },
  { label: 'Peugeot', value: 'Peugeot' },
];

const TRANSMISIONES = [
  { label: 'Todas', value: '' },
  { label: 'Automática', value: 'Automática' },
  { label: 'Manual', value: 'Manual' },
];

const COMBUSTIBLES = [
  { label: 'Todos', value: '' },
  { label: 'Bencina', value: 'Bencina' },
  { label: 'Diesel', value: 'Diesel' },
  { label: 'Híbrido', value: 'Híbrido' },
  { label: 'Eléctrico', value: 'Eléctrico' },
];

export const FilterModal = ({ visible, onClose, onApply, onReset, currentFilters }: FilterModalProps) => {
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    onReset();
    onClose();
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Filtros</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Limpiar</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Búsqueda */}
          <Text style={styles.label}>Búsqueda</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.inputIcon} />
            <TextInput 
              placeholder="Ej: Yaris, Corolla..." 
              value={filters.search}
              onChangeText={t => setFilters({...filters, search: t})}
              style={styles.input}
            />
          </View>

          {/* Precio */}
          <Text style={styles.label}>Precio ($)</Text>
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <TextInput 
                placeholder="Mínimo" 
                value={filters.minPrice}
                onChangeText={t => setFilters({...filters, minPrice: t})}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <TextInput 
                placeholder="Máximo" 
                value={filters.maxPrice}
                onChangeText={t => setFilters({...filters, maxPrice: t})}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>

          {/* Año */}
          <Text style={styles.label}>Año</Text>
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <TextInput 
                placeholder="Desde" 
                value={filters.minYear}
                onChangeText={t => setFilters({...filters, minYear: t})}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <TextInput 
                placeholder="Hasta" 
                value={filters.maxYear}
                onChangeText={t => setFilters({...filters, maxYear: t})}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>

          {/* Marca */}
          <Text style={styles.label}>Marca</Text>
          <SelectPicker 
            options={MARCAS} 
            value={filters.marca}
            onSelect={val => setFilters({...filters, marca: val})} 
            placeholder="Seleccionar Marca"
          />

          {/* Transmisión */}
          <Text style={styles.label}>Transmisión</Text>
          <View style={styles.chipsContainer}>
            {TRANSMISIONES.map((t) => (
              <TouchableOpacity
                key={t.value || 'all'}
                style={[
                  styles.chip,
                  filters.transmision === t.value && styles.activeChip
                ]}
                onPress={() => setFilters({...filters, transmision: t.value})}
              >
                <Text style={[
                  styles.chipText,
                  filters.transmision === t.value && styles.activeChipText
                ]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Combustible */}
          <Text style={styles.label}>Combustible</Text>
          <View style={styles.chipsContainer}>
            {COMBUSTIBLES.map((c) => (
              <TouchableOpacity
                key={c.value || 'all'}
                style={[
                  styles.chip,
                  filters.combustible === c.value && styles.activeChip
                ]}
                onPress={() => setFilters({...filters, combustible: c.value})}
              >
                <Text style={[
                  styles.chipText,
                  filters.combustible === c.value && styles.activeChipText
                ]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
            <Text style={styles.applyButtonText}>Ver Resultados</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  resetText: {
    color: '#4CAF50',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 8,
  },
  activeChip: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  chipText: {
    color: '#666',
    fontSize: 14,
  },
  activeChipText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
