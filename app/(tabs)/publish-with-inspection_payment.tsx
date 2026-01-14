import { View, Text } from 'react-native';
import { Screen } from '../../components/ui/Screen';

export default function PublishWithInspectionPaymentScreen() {
  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Pago de Inspección (En construcción)</Text>
      </View>
    </Screen>
  );
}
