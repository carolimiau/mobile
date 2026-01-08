export const INSPECTION_SECTIONS = [
  {
    id: '1',
    title: '1. Revisión carrocería, exteriores y parte inferior',
    icon: 'car-sport-outline',
    questions: [
      {
        id: '1.1',
        text: '1.1. Revisar que la pintura del auto sea de la misma tonalidad en sus distintos paneles',
        options: [
          { value: 'a', label: 'a) Posee la misma tonalidad de manera total.' },
          { value: 'b', label: 'b) Posee algunas piezas con diferente tonalidad (reparación localizada).' },
          { value: 'c', label: 'c) Posee gran parte de la carrocería con tonalidades variables (repintados importantes).' },
          { value: 'd', label: 'd) No es posible verificar (suciedad/condiciones de luz).' },
        ]
      },
      {
        id: '1.2',
        text: '1.2. Revisar líneas de paneles, luces, plásticos y ajuste de puertas',
        options: [
          { value: 'a', label: 'a) Paneles alineados correctamente; puertas/capó/baúl cierran bien.' },
          { value: 'b', label: 'b) Pequeños descuadres sin evidencia de choque grave.' },
          { value: 'c', label: 'c) Descuidos o descuadres relevantes que sugieren choque o reparación mayor.' },
          { value: 'd', label: 'd) Piezas faltantes o rotas (luces, plásticos).' },
        ]
      },
      {
        id: '1.3',
        text: '1.3. Revisar descuadres en trenes delantero/lateral/trasero',
        options: [
          { value: 'a', label: 'a) Sin descuadres ni señales de choque.' },
          { value: 'b', label: 'b) Descuidos menores en cierres; posible golpe leve.' },
          { value: 'c', label: 'c) Evidencia clara de choque de consideración (cierres, estructura).' },
        ]
      },
      {
        id: '1.4',
        text: '1.4. Evidencia de uso de masilla o repintados (medición espesor / auto-lak test)',
        options: [
          { value: 'a', label: 'a) No hay evidencia de repintado o masilla (espesor homogéneo).' },
          { value: 'b', label: 'b) Pequeñas reparaciones con masilla / repintados puntuales.' },
          { value: 'c', label: 'c) Reparaciones extensas con masilla o repintados (paneles múltiples).' },
        ]
      },
      {
        id: '1.5',
        text: '1.5. Estado general de la carrocería y techo (abollones significativos)',
        options: [
          { value: 'a', label: 'a) Carrocería en buen estado, sin abollones significativos.' },
          { value: 'b', label: 'b) Abollones menores o imperfecciones reparables.' },
          { value: 'c', label: 'c) Abollones significativos que afectan estructura/estética.' },
        ]
      },
      {
        id: '1.6',
        text: '1.6. Estado de llantas y discos de freno',
        options: [
          { value: 'a', label: 'a) Llantas en buen estado; discos sin borde prominente.' },
          { value: 'b', label: 'b) Llantas con raspones/modificaciones; desgaste moderado.' },
          { value: 'c', label: 'c) Llantas en mal estado o desgaste disparejo; discos con desgaste prominente.' },
          { value: 'd', label: 'd) Llanta de repuesto ausente o en mal estado.' },
        ]
      },
      {
        id: '1.7',
        text: '1.7. Prueba de suspensión (empujar lateralmente y observar rebote)',
        options: [
          { value: 'a', label: 'a) Suspensión firme y con rebote normal.' },
          { value: 'b', label: 'b) Suspensión algo dura o blanda (desgaste moderado).' },
          { value: 'c', label: 'c) Suspensión en mal estado (rebote excesivo o sin amortiguación).' },
        ]
      },
      {
        id: '1.8',
        text: '1.8. Desgaste y condición de los neumáticos',
        options: [
          { value: 'a', label: 'a) Desgaste uniforme y sin grietas.' },
          { value: 'b', label: 'b) Desgaste leve o algún indicio de agrietamiento.' },
          { value: 'c', label: 'c) Desgaste severo o desgaste disparejo (alineación/rodamiento).' },
          { value: 'd', label: 'd) Neumáticos no aptos o no verificables.' },
        ]
      },
      {
        id: '1.9',
        text: '1.9. Inspección parte inferior: chasis, filtraciones, óxido',
        options: [
          { value: 'a', label: 'a) Sin filtraciones ni óxido significativo; chasis íntegro.' },
          { value: 'b', label: 'b) Filtraciones menores o óxido superficial sin riesgo inmediato.' },
          { value: 'c', label: 'c) Filtraciones, roturas o óxido avanzado que requieren revisión.' },
        ]
      },
      {
        id: '1.10',
        text: '1.10. Estado de vidrios y verificación de grabado de la patente',
        options: [
          { value: 'a', label: 'a) Vidrios en buen estado; grabado de patente presente y correcto.' },
          { value: 'b', label: 'b) Vidrios con pequeñas astillas; grabado parcialmente legible.' },
          { value: 'c', label: 'c) Vidrios con roturas/ausencia de grabado (posible irregularidad).' },
        ]
      },
      {
        id: '1.11',
        text: '1.11. Disponibilidad y estado de rueda de repuesto, gata hidráulica y accesorios',
        options: [
          { value: 'a', label: 'a) Todos los accesorios presentes y en buen estado.' },
          { value: 'b', label: 'b) Accesorios presentes, pero en mal estado/uso.' },
          { value: 'c', label: 'c) Faltan accesorios importantes (sin rueda de repuesto/gata).' },
        ]
      },
    ]
  },
  {
    id: '2',
    title: '2. Revisión de interiores, tablero, luces y accesorios',
    icon: 'speedometer-outline',
    questions: [
      {
        id: '2.1',
        text: '2.1. Revisión del maletero: buscar descuadres que indiquen choque oculto',
        options: [
          { value: 'a', label: 'a) Maletero sin descuadres ni evidencia de choque.' },
          { value: 'b', label: 'b) Descuidos leves detectados (deformaciones menores).' },
          { value: 'c', label: 'c) Evidencia clara de choque en el maletero.' },
        ]
      },
      {
        id: '2.2',
        text: '2.2. Dirección hidráulica: ruido o resistencia al girar',
        options: [
          { value: 'a', label: 'a) Dirección suave y sin ruidos anormales.' },
          { value: 'b', label: 'b) Dirección con ruido leve al girar (recomendable revisar).' },
          { value: 'c', label: 'c) Ruidos o fallas que indican problema en la dirección hidráulica.' },
          { value: 'd', label: 'd) Vehículo sin dirección hidráulica / no aplicable.' },
        ]
      },
      {
        id: '2.3',
        text: '2.3. Test de testigos del tablero al girar la llave',
        options: [
          { value: 'a', label: 'a) Todos los testigos encienden y se apagan correctamente al arrancar.' },
          { value: 'b', label: 'b) Algunos testigos permanecen encendidos (posible fallo).' },
          { value: 'c', label: 'c) Testigos faltantes o comportamiento anormal del tablero.' },
        ]
      },
      {
        id: '2.4',
        text: '2.4. Pedal de embrague: fuerza y corrección',
        options: [
          { value: 'a', label: 'a) Pedal con respuesta normal y fuerza adecuada.' },
          { value: 'b', label: 'b) Pedal algo flojo o con recorrido largo (desgaste moderado).' },
          { value: 'c', label: 'c) Pedal sin respuesta o al final de su vida útil (reparación necesaria).' },
          { value: 'd', label: 'd) Vehículo automático / no aplicable.' },
        ]
      },
      {
        id: '2.5',
        text: '2.5. Aire acondicionado: funcionamiento y enfriamiento',
        options: [
          { value: 'a', label: 'a) A/C enfría correctamente.' },
          { value: 'b', label: 'b) Enfría débilmente (posible falta de gas o mantenimiento).' },
          { value: 'c', label: 'c) No enfría (requiere revisión especializada).' },
          { value: 'd', label: 'd) Vehículo no cuenta con A/C' },
        ]
      },
      {
        id: '2.6',
        text: '2.6. Cinturones de seguridad: estado y funcionamiento',
        options: [
          { value: 'a', label: 'a) Cinturones en buen estado y funcionan correctamente.' },
          { value: 'b', label: 'b) Algunos cinturones con desgaste, pero funcionales.' },
          { value: 'c', label: 'c) Cinturones dañados o no funcionan (riesgo grave).' },
        ]
      },
      {
        id: '2.7',
        text: '2.7. Cierre centralizado, alarma, alza vidrios y demás eléctricos',
        options: [
          { value: 'a', label: 'a) Todos los sistemas eléctricos funcionan correctamente.' },
          { value: 'b', label: 'b) Fallas menores en algunos elementos (recomendable reparar).' },
          { value: 'c', label: 'c) Fallas graves en sistemas eléctricos (alarma, cierre central).' },
        ]
      },
      {
        id: '2.8',
        text: '2.8. Bocina, espejos, guantera y viseras',
        options: [
          { value: 'a', label: 'a) Funcionamiento correcto de bocina y elementos.' },
          { value: 'b', label: 'b) Fallas leves en alguno de los elementos.' },
          { value: 'c', label: 'c) Fallas graves o elementos faltantes.' },
        ]
      },
      {
        id: '2.9',
        text: '2.9. Tapices y paneles interiores (remover cubreasientos si aplica)',
        options: [
          { value: 'a', label: 'a) Tapicería y paneles en buen estado.' },
          { value: 'b', label: 'b) Desgaste o manchas moderadas.' },
          { value: 'c', label: 'c) Daños importantes (roturas, quemaduras).' },
        ]
      },
      {
        id: '2.10',
        text: '2.10. Luces direccionales, intermitentes y limpiaparabrisas (con agua)',
        options: [
          { value: 'a', label: 'a) Funcionan correctamente.' },
          { value: 'b', label: 'b) Funcionan parcialmente (una o más no operativas).' },
          { value: 'c', label: 'c) No funcionan o presentan fallas graves.' },
        ]
      },
      {
        id: '2.11',
        text: '2.11. Tapa de combustible: estado y cierre',
        options: [
          { value: 'a', label: 'a) Cierre correcto y tapa en buen estado.' },
          { value: 'b', label: 'b) Cierre con dificultad o desgaste moderado.' },
          { value: 'c', label: 'c) Falla completa o ausencia de tapa.' },
          { value: 'd', label: 'd) No se verificó.' },
        ]
      },
      {
        id: '2.12',
        text: '2.12. Conexión del scanner y registro OBD',
        options: [
          { value: 'a', label: 'a) Scanner conectado y códigos OBD registrados sin errores relevantes.' },
          { value: 'b', label: 'b) Códigos de advertencia menores encontrados (recomendable diagnóstico).' },
          { value: 'c', label: 'c) Códigos críticos encontrados (recomendar diagnóstico especializado).' },
          { value: 'd', label: 'd) Scanner no disponible o no se pudo conectar.' },
        ]
      },
      {
        id: '2.13',
        text: '2.13. Registro fotográfico del panel que muestre el kilometraje',
        options: [
          { value: 'a', label: 'a) Foto tomada y legible.' },
          { value: 'b', label: 'b) Foto tomada pero no legible (suciedad/ángulo).' },
          { value: 'c', label: 'c) No se tomó la foto del odómetro.' },
        ]
      },
    ]
  },
  {
    id: '3',
    title: '3. Revisión de motor, componentes bajo capó y verificación en reposo',
    icon: 'construct-outline',
    questions: [
      {
        id: '3.1',
        text: '3.1. Filtraciones, sellos o reparaciones artesanales (silicona, parches)',
        options: [
          { value: 'a', label: 'a) Sin filtraciones ni reparaciones artesanales.' },
          { value: 'b', label: 'b) Filtraciones menores o sellos reparados parcialmente.' },
          { value: 'c', label: 'c) Reparaciones artesanales o filtraciones importantes.' },
        ]
      },
      {
        id: '3.2',
        text: '3.2. Estado del aceite (varilla): nivel y aspecto',
        options: [
          { value: 'a', label: 'a) Nivel y aspecto del aceite correcto (limpio y en rango).' },
          { value: 'b', label: 'b) Nivel algo bajo o aceite sucio (recomendar cambio).' },
          { value: 'c', label: 'c) Nivel muy bajo o aceite con indicios de contaminación/combustión.' },
        ]
      },
      {
        id: '3.3',
        text: '3.3. Estado del refrigerante (depósito de expansión)',
        options: [
          { value: 'a', label: 'a) Nivel y aspecto correctos; sin residuos.' },
          { value: 'b', label: 'b) Nivel bajo o residuos leves (recomendable mantenimiento).' },
          { value: 'c', label: 'c) Residuos o nivel muy bajo (posible problema grave).' },
        ]
      },
      {
        id: '3.4',
        text: '3.4. Estado de correas de accesorios (visual)',
        options: [
          { value: 'a', label: 'a) Correas en buen estado, sin grietas.' },
          { value: 'b', label: 'b) Correas con desgaste leve, pero operativas.' },
          { value: 'c', label: 'c) Correas dañadas o que requieren cambio inmediato.' },
          { value: 'd', label: 'd) No se verificó.' },
        ]
      },
      {
        id: '3.5',
        text: '3.5. Mangueras: flexibilidad y estado (no endurecidas ni agrietadas)',
        options: [
          { value: 'a', label: 'a) Mangueras en buen estado y flexibles.' },
          { value: 'b', label: 'b) Mangueras con rigidez leve o pequeñas grietas.' },
          { value: 'c', label: 'c) Mangueras endurecidas/agrietadas (riesgo de fallo).' },
        ]
      },
      {
        id: '3.6',
        text: '3.6. Revisar conectores eléctricos y componentes bajo capó (sin desconectarlos)',
        options: [
          { value: 'a', label: 'a) Conectores en buen estado, sin corrosión ni manipulación.' },
          { value: 'b', label: 'b) Conectores con suciedad o leve corrosión.' },
          { value: 'c', label: 'c) Conectores manipulados o en mal estado (riesgo de fallo).' },
        ]
      },
      {
        id: '3.7',
        text: '3.7. Tornillería y pernos: originales y sin sujeciones alternativas',
        options: [
          { value: 'a', label: 'a) Tornillería original y en buen estado.' },
          { value: 'b', label: 'b) Tornillería con repuestos/ajustes no originales menores.' },
          { value: 'c', label: 'c) Tornillería sustituida con sujeciones impropias (posible reparación).' },
        ]
      },
      {
        id: '3.8',
        text: '3.8. Líneas y componentes frontales (signos de choque en interior del capó)',
        options: [
          { value: 'a', label: 'a) Sin signos de choque o reparaciones en área frontal.' },
          { value: 'b', label: 'b) Reparaciones menores detectadas en el interior del capó.' },
          { value: 'c', label: 'c) Signos de choque significativos en el interior del capó.' },
        ]
      },
      {
        id: '3.9',
        text: '3.9. Humos de escape al arrancar (color y persistencia)',
        options: [
          { value: 'a', label: 'a) Humo ausente o color normal (vapor ocasional por temperatura).' },
          { value: 'b', label: 'b) Humo negro ocasional (mezcla rica) - revisar sistema de inyección.' },
          { value: 'c', label: 'c) Humo azulado (quema aceite) o blanco persistente (posible falla grave).' },
        ]
      },
      {
        id: '3.10',
        text: '3.10. Nivel y consistencia de líquidos (dirección / frenos) con tester',
        options: [
          { value: 'a', label: 'a) Líquidos dentro de rango y con consistencia adecuada.' },
          { value: 'b', label: 'b) Líquidos con nivel algo bajo o ligera contaminación.' },
          { value: 'c', label: 'c) Mezcla o contaminación de fluidos (riesgo inmediato).' },
        ]
      },
      {
        id: '3.11',
        text: '3.11. Radiador y electroventiladores: estado y funcionamiento',
        options: [
          { value: 'a', label: 'a) Radiador sin filtraciones y electroventiladores operativos.' },
          { value: 'b', label: 'b) Filtraciones menores o ventiladores con funcionamiento intermitente.' },
          { value: 'c', label: 'c) Filtraciones evidentes o fallo de ventiladores.' },
        ]
      },
      {
        id: '3.12',
        text: '3.12. Números de serie (motor / VIN / chasis): manipulación o intervención',
        options: [
          { value: 'a', label: 'a) Números originales y sin intervención aparente.' },
          { value: 'b', label: 'b) Números con señales menores de manipulación (requiere revisión).' },
          { value: 'c', label: 'c) Números intervenidos o faltantes (alarma de fraude).' },
        ]
      },
      {
        id: '3.13',
        text: '3.13. Batería y bornes: corrosión y estado general',
        options: [
          { value: 'a', label: 'a) Bornes limpios y batería en buen estado.' },
          { value: 'b', label: 'b) Bornes con algo de corrosión, pero operativos.' },
          { value: 'c', label: 'c) Bornes sulfatados o batería en mal estado (reemplazo sugerido).' },
        ]
      },
      {
        id: '3.14',
        text: '3.14. Sistema de carga (batería/alternador) - medición con tester',
        options: [
          { value: 'a', label: 'a) Sistema de carga dentro de parámetros normales.' },
          { value: 'b', label: 'b) Carga algo por debajo de lo normal (recomendable verificar).' },
          { value: 'c', label: 'c) Sistema de carga fuera de rango (fallo probable).' },
        ]
      },
    ]
  },
  {
    id: '4',
    title: '4. Prueba de conducción en ruta prediseñada',
    icon: 'navigate-outline',
    questions: [
      {
        id: '4.1',
        text: '4.1. Aceleración y vibraciones a velocidad',
        options: [
          { value: 'a', label: 'a) Aceleración adecuada; sin vibraciones anormales.' },
          { value: 'b', label: 'b) Vibraciones leves que requieren seguimiento.' },
          { value: 'c', label: 'c) Vibraciones fuertes (posible problema de balanceo o tren delantero).' },
        ]
      },
      {
        id: '4.2',
        text: '4.2. Frenos: respuesta y recorrido del pedal',
        options: [
          { value: 'a', label: 'a) Frenos firmes y recorrido de pedal normal.' },
          { value: 'b', label: 'b) Pedal algo esponjoso o recorrido largo (ajuste necesario).' },
          { value: 'c', label: 'c) Fallo en frenos (alto riesgo) - no apto para conducción segura.' },
        ]
      },
      {
        id: '4.3',
        text: '4.3. Dirección y estabilidad (soltar volante brevemente)',
        options: [
          { value: 'a', label: 'a) Dirección estable; se mantiene recto.' },
          { value: 'b', label: 'b) Ligera desviación que requiere alineación.' },
          { value: 'c', label: 'c) Desvío marcado o problemas de alineación/ruedas.' },
        ]
      },
      {
        id: '4.4',
        text: '4.4. Temperatura del motor en conducción (aguja)',
        options: [
          { value: 'a', label: 'a) Temperatura estable en rango medio.' },
          { value: 'b', label: 'b) Temperatura algo alta en subidas o congestión.' },
          { value: 'c', label: 'c) Sobrecalentamiento o fluctuaciones graves.' },
        ]
      },
      {
        id: '4.5',
        text: '4.5. Cambio de marchas y embrague (suavidad)',
        options: [
          { value: 'a', label: 'a) Cambios suaves y sin ruidos.' },
          { value: 'b', label: 'b) Dificultad en algún cambio (síntoma leve).' },
          { value: 'c', label: 'c) Cambios con ruidos o trabas (revisión urgente).' },
          { value: 'd', label: 'd) Vehículo automático / prueba no aplicable.' },
        ]
      },
      {
        id: '4.6',
        text: '4.6. Prueba de fuerza en subida',
        options: [
          { value: 'a', label: 'a) Motor mantiene potencia en subida.' },
          { value: 'b', label: 'b) Pérdida leve de potencia en subida.' },
          { value: 'c', label: 'c) Pérdida de potencia significativa (fallo motor/transmisión).' },
        ]
      },
      {
        id: '4.7',
        text: '4.7. Ruidos y signos inusuales (golpeteos, zumbidos)',
        options: [
          { value: 'a', label: 'a) Sin ruidos anormales.' },
          { value: 'b', label: 'b) Ruidos leves detectados (monitorizar).' },
          { value: 'c', label: 'c) Ruidos considerables que requieren diagnóstico.' },
        ]
      },
    ]
  }
];
