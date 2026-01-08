// Servicio para obtener regiones y comunas de Chile
// Usando la API pública de Chile

export interface Region {
  name: string;
  romanNumber: string;
  number: string;
  abbreviation: string;
}

export interface Comuna {
  name: string;
  code: string;
  provinceCode: string;
  regionCode: string;
}

class LocationService {
  private readonly API_URL = 'https://apis.digital.gob.cl/dpa';
  
  // Cache para evitar llamadas repetidas
  private regionesCache: Region[] | null = null;
  private comunasCache: Comuna[] | null = null;

  /**
   * Obtener todas las regiones de Chile
   */
  async getRegiones(): Promise<Region[]> {
    if (this.regionesCache) {
      return this.regionesCache;
    }

    // Por ahora, usar directamente los datos locales
    // La API puede tener problemas de CORS o estructura diferente
    console.log('Cargando regiones desde datos locales');
    this.regionesCache = this.getDefaultRegiones();
    return this.regionesCache;

    /* Descomentar cuando la API esté configurada correctamente
    try {
      const response = await fetch(`${this.API_URL}/regiones`);
      
      if (!response.ok) {
        throw new Error('Error al obtener regiones');
      }

      const data = await response.json();
      
      // Verificar si los datos tienen la estructura esperada
      if (Array.isArray(data) && data.length > 0) {
        this.regionesCache = data;
        return data;
      } else {
        // Si no hay datos, usar los por defecto
        console.warn('API retornó datos vacíos, usando regiones por defecto');
        this.regionesCache = this.getDefaultRegiones();
        return this.regionesCache;
      }
    } catch (error) {
      console.error('Error al obtener regiones:', error);
      // Retornar regiones por defecto en caso de error
      this.regionesCache = this.getDefaultRegiones();
      return this.regionesCache;
    }
    */
  }

  /**
   * Obtener todas las comunas de Chile
   */
  async getComunas(): Promise<Comuna[]> {
    if (this.comunasCache) {
      return this.comunasCache;
    }

    // Por ahora, usar directamente los datos locales
    console.log('Cargando comunas desde datos locales');
    const comunas = this.getDefaultComunas();
    // Ordenar alfabéticamente
    this.comunasCache = comunas.sort((a, b) => a.name.localeCompare(b.name));
    return this.comunasCache;

    /* Descomentar cuando la API esté configurada correctamente
    try {
      const response = await fetch(`${this.API_URL}/comunas`);
      
      if (!response.ok) {
        throw new Error('Error al obtener comunas');
      }

      const data = await response.json();
      
      // Verificar si los datos tienen la estructura esperada
      if (Array.isArray(data) && data.length > 0) {
        this.comunasCache = data;
        return data;
      } else {
        // Si no hay datos, usar los por defecto
        console.warn('API retornó datos vacíos, usando comunas por defecto');
        this.comunasCache = this.getDefaultComunas();
        return this.comunasCache;
      }
    } catch (error) {
      console.error('Error al obtener comunas:', error);
      // Retornar comunas por defecto en caso de error
      this.comunasCache = this.getDefaultComunas();
      return this.comunasCache;
    }
    */
  }

  /**
   * Obtener comunas de una región específica
   */
  async getComunasByRegion(regionCode: string): Promise<Comuna[]> {
    try {
      const response = await fetch(`${this.API_URL}/regiones/${regionCode}/comunas`);
      
      if (!response.ok) {
        throw new Error('Error al obtener comunas de la región');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener comunas de la región:', error);
      // Filtrar comunas por región desde el cache
      const todasLasComunas = await this.getComunas();
      return todasLasComunas.filter(c => c.regionCode === regionCode);
    }
  }

  /**
   * Limpiar cache
   */
  clearCache(): void {
    this.regionesCache = null;
    this.comunasCache = null;
  }

  /**
   * Regiones por defecto (fallback)
   */
  private getDefaultRegiones(): Region[] {
    const regiones = [
      { name: 'Arica y Parinacota', romanNumber: 'XV', number: '15', abbreviation: 'AP' },
      { name: 'Tarapacá', romanNumber: 'I', number: '01', abbreviation: 'TA' },
      { name: 'Antofagasta', romanNumber: 'II', number: '02', abbreviation: 'AN' },
      { name: 'Atacama', romanNumber: 'III', number: '03', abbreviation: 'AT' },
      { name: 'Coquimbo', romanNumber: 'IV', number: '04', abbreviation: 'CO' },
      { name: 'Valparaíso', romanNumber: 'V', number: '05', abbreviation: 'VA' },
      { name: 'Metropolitana de Santiago', romanNumber: 'RM', number: '13', abbreviation: 'RM' },
      { name: "O'Higgins", romanNumber: 'VI', number: '06', abbreviation: 'LI' },
      { name: 'Maule', romanNumber: 'VII', number: '07', abbreviation: 'ML' },
      { name: 'Ñuble', romanNumber: 'XVI', number: '16', abbreviation: 'NB' },
      { name: 'Biobío', romanNumber: 'VIII', number: '08', abbreviation: 'BI' },
      { name: 'La Araucanía', romanNumber: 'IX', number: '09', abbreviation: 'AR' },
      { name: 'Los Ríos', romanNumber: 'XIV', number: '14', abbreviation: 'LR' },
      { name: 'Los Lagos', romanNumber: 'X', number: '10', abbreviation: 'LL' },
      { name: 'Aysén', romanNumber: 'XI', number: '11', abbreviation: 'AI' },
      { name: 'Magallanes', romanNumber: 'XII', number: '12', abbreviation: 'MA' },
    ];
    
    // Ordenar alfabéticamente
    return regiones.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Comunas por defecto (fallback) - principales comunas
   */
  private getDefaultComunas(): Comuna[] {
    return [
      // Región de Arica y Parinacota (15)
      { name: 'Arica', code: '15101', provinceCode: '151', regionCode: '15' },
      { name: 'Camarones', code: '15102', provinceCode: '151', regionCode: '15' },
      { name: 'General Lagos', code: '15201', provinceCode: '152', regionCode: '15' },
      { name: 'Putre', code: '15202', provinceCode: '152', regionCode: '15' },
      
      // Región de Tarapacá (01)
      { name: 'Alto Hospicio', code: '01107', provinceCode: '011', regionCode: '01' },
      { name: 'Iquique', code: '01101', provinceCode: '011', regionCode: '01' },
      { name: 'Camiña', code: '01402', provinceCode: '014', regionCode: '01' },
      { name: 'Colchane', code: '01403', provinceCode: '014', regionCode: '01' },
      { name: 'Huara', code: '01404', provinceCode: '014', regionCode: '01' },
      { name: 'Pica', code: '01405', provinceCode: '014', regionCode: '01' },
      { name: 'Pozo Almonte', code: '01401', provinceCode: '014', regionCode: '01' },
      
      // Región de Antofagasta (02)
      { name: 'Antofagasta', code: '02101', provinceCode: '021', regionCode: '02' },
      { name: 'Mejillones', code: '02102', provinceCode: '021', regionCode: '02' },
      { name: 'Sierra Gorda', code: '02103', provinceCode: '021', regionCode: '02' },
      { name: 'Taltal', code: '02104', provinceCode: '021', regionCode: '02' },
      { name: 'Calama', code: '02201', provinceCode: '022', regionCode: '02' },
      { name: 'Ollagüe', code: '02202', provinceCode: '022', regionCode: '02' },
      { name: 'San Pedro de Atacama', code: '02203', provinceCode: '022', regionCode: '02' },
      { name: 'María Elena', code: '02302', provinceCode: '023', regionCode: '02' },
      { name: 'Tocopilla', code: '02301', provinceCode: '023', regionCode: '02' },
      
      // Región de Atacama (03)
      { name: 'Chañaral', code: '03201', provinceCode: '032', regionCode: '03' },
      { name: 'Diego de Almagro', code: '03202', provinceCode: '032', regionCode: '03' },
      { name: 'Caldera', code: '03102', provinceCode: '031', regionCode: '03' },
      { name: 'Copiapó', code: '03101', provinceCode: '031', regionCode: '03' },
      { name: 'Tierra Amarilla', code: '03103', provinceCode: '031', regionCode: '03' },
      { name: 'Alto del Carmen', code: '03302', provinceCode: '033', regionCode: '03' },
      { name: 'Freirina', code: '03303', provinceCode: '033', regionCode: '03' },
      { name: 'Huasco', code: '03304', provinceCode: '033', regionCode: '03' },
      { name: 'Vallenar', code: '03301', provinceCode: '033', regionCode: '03' },
      
      // Región de Coquimbo (04)
      { name: 'Canela', code: '04102', provinceCode: '041', regionCode: '04' },
      { name: 'Illapel', code: '04201', provinceCode: '042', regionCode: '04' },
      { name: 'Los Vilos', code: '04202', provinceCode: '042', regionCode: '04' },
      { name: 'Salamanca', code: '04203', provinceCode: '042', regionCode: '04' },
      { name: 'Andacollo', code: '04103', provinceCode: '041', regionCode: '04' },
      { name: 'Coquimbo', code: '04102', provinceCode: '041', regionCode: '04' },
      { name: 'La Higuera', code: '04104', provinceCode: '041', regionCode: '04' },
      { name: 'La Serena', code: '04101', provinceCode: '041', regionCode: '04' },
      { name: 'Paihuano', code: '04105', provinceCode: '041', regionCode: '04' },
      { name: 'Vicuña', code: '04106', provinceCode: '041', regionCode: '04' },
      { name: 'Combarbalá', code: '04302', provinceCode: '043', regionCode: '04' },
      { name: 'Monte Patria', code: '04303', provinceCode: '043', regionCode: '04' },
      { name: 'Ovalle', code: '04301', provinceCode: '043', regionCode: '04' },
      { name: 'Punitaqui', code: '04304', provinceCode: '043', regionCode: '04' },
      { name: 'Río Hurtado', code: '04305', provinceCode: '043', regionCode: '04' },
      
      // Región de Valparaíso (05)
      { name: 'Valparaíso', code: '05101', provinceCode: '051', regionCode: '05' },
      { name: 'Viña del Mar', code: '05109', provinceCode: '051', regionCode: '05' },
      { name: 'Concón', code: '05103', provinceCode: '051', regionCode: '05' },
      { name: 'Quintero', code: '05107', provinceCode: '051', regionCode: '05' },
      { name: 'Puchuncaví', code: '05106', provinceCode: '051', regionCode: '05' },
      { name: 'Casablanca', code: '05102', provinceCode: '051', regionCode: '05' },
      { name: 'Juan Fernández', code: '05104', provinceCode: '051', regionCode: '05' },
      { name: 'Quilpué', code: '05804', provinceCode: '058', regionCode: '05' },
      { name: 'Villa Alemana', code: '05804', provinceCode: '058', regionCode: '05' },
      { name: 'Limache', code: '05802', provinceCode: '058', regionCode: '05' },
      { name: 'Olmué', code: '05803', provinceCode: '058', regionCode: '05' },
      { name: 'Quillota', code: '05501', provinceCode: '055', regionCode: '05' },
      { name: 'La Calera', code: '05502', provinceCode: '055', regionCode: '05' },
      { name: 'Hijuelas', code: '05503', provinceCode: '055', regionCode: '05' },
      { name: 'La Cruz', code: '05504', provinceCode: '055', regionCode: '05' },
      { name: 'Nogales', code: '05506', provinceCode: '055', regionCode: '05' },
      { name: 'San Antonio', code: '05601', provinceCode: '056', regionCode: '05' },
      { name: 'Cartagena', code: '05602', provinceCode: '056', regionCode: '05' },
      { name: 'El Quisco', code: '05603', provinceCode: '056', regionCode: '05' },
      { name: 'El Tabo', code: '05604', provinceCode: '056', regionCode: '05' },
      { name: 'Algarrobo', code: '05605', provinceCode: '056', regionCode: '05' },
      { name: 'Santo Domingo', code: '05606', provinceCode: '056', regionCode: '05' },
      { name: 'Los Andes', code: '05301', provinceCode: '053', regionCode: '05' },
      { name: 'Calle Larga', code: '05302', provinceCode: '053', regionCode: '05' },
      { name: 'Rinconada', code: '05303', provinceCode: '053', regionCode: '05' },
      { name: 'San Esteban', code: '05304', provinceCode: '053', regionCode: '05' },
      { name: 'San Felipe', code: '05401', provinceCode: '054', regionCode: '05' },
      { name: 'Catemu', code: '05402', provinceCode: '054', regionCode: '05' },
      { name: 'Llaillay', code: '05403', provinceCode: '054', regionCode: '05' },
      { name: 'Panquehue', code: '05404', provinceCode: '054', regionCode: '05' },
      { name: 'Putaendo', code: '05405', provinceCode: '054', regionCode: '05' },
      { name: 'Santa María', code: '05406', provinceCode: '054', regionCode: '05' },
      { name: 'Isla de Pascua', code: '05201', provinceCode: '052', regionCode: '05' },
      { name: 'Petorca', code: '05701', provinceCode: '057', regionCode: '05' },
      { name: 'Cabildo', code: '05702', provinceCode: '057', regionCode: '05' },
      { name: 'La Ligua', code: '05703', provinceCode: '057', regionCode: '05' },
      { name: 'Papudo', code: '05704', provinceCode: '057', regionCode: '05' },
      { name: 'Zapallar', code: '05705', provinceCode: '057', regionCode: '05' },
      
      // Región Metropolitana (13)
      { name: 'Santiago', code: '13101', provinceCode: '131', regionCode: '13' },
      { name: 'Cerrillos', code: '13102', provinceCode: '131', regionCode: '13' },
      { name: 'Cerro Navia', code: '13103', provinceCode: '131', regionCode: '13' },
      { name: 'Conchalí', code: '13104', provinceCode: '131', regionCode: '13' },
      { name: 'El Bosque', code: '13105', provinceCode: '131', regionCode: '13' },
      { name: 'Estación Central', code: '13106', provinceCode: '131', regionCode: '13' },
      { name: 'Huechuraba', code: '13107', provinceCode: '131', regionCode: '13' },
      { name: 'Independencia', code: '13108', provinceCode: '131', regionCode: '13' },
      { name: 'La Cisterna', code: '13109', provinceCode: '131', regionCode: '13' },
      { name: 'La Florida', code: '13110', provinceCode: '131', regionCode: '13' },
      { name: 'La Granja', code: '13111', provinceCode: '131', regionCode: '13' },
      { name: 'La Pintana', code: '13112', provinceCode: '131', regionCode: '13' },
      { name: 'La Reina', code: '13113', provinceCode: '131', regionCode: '13' },
      { name: 'Las Condes', code: '13114', provinceCode: '131', regionCode: '13' },
      { name: 'Lo Barnechea', code: '13115', provinceCode: '131', regionCode: '13' },
      { name: 'Lo Espejo', code: '13116', provinceCode: '131', regionCode: '13' },
      { name: 'Lo Prado', code: '13117', provinceCode: '131', regionCode: '13' },
      { name: 'Macul', code: '13118', provinceCode: '131', regionCode: '13' },
      { name: 'Maipú', code: '13119', provinceCode: '131', regionCode: '13' },
      { name: 'Ñuñoa', code: '13120', provinceCode: '131', regionCode: '13' },
      { name: 'Pedro Aguirre Cerda', code: '13121', provinceCode: '131', regionCode: '13' },
      { name: 'Peñalolén', code: '13122', provinceCode: '131', regionCode: '13' },
      { name: 'Providencia', code: '13123', provinceCode: '131', regionCode: '13' },
      { name: 'Pudahuel', code: '13124', provinceCode: '131', regionCode: '13' },
      { name: 'Quilicura', code: '13125', provinceCode: '131', regionCode: '13' },
      { name: 'Quinta Normal', code: '13126', provinceCode: '131', regionCode: '13' },
      { name: 'Recoleta', code: '13127', provinceCode: '131', regionCode: '13' },
      { name: 'Renca', code: '13128', provinceCode: '131', regionCode: '13' },
      { name: 'San Joaquín', code: '13129', provinceCode: '131', regionCode: '13' },
      { name: 'San Miguel', code: '13130', provinceCode: '131', regionCode: '13' },
      { name: 'San Ramón', code: '13131', provinceCode: '131', regionCode: '13' },
      { name: 'Vitacura', code: '13132', provinceCode: '131', regionCode: '13' },
      { name: 'Puente Alto', code: '13201', provinceCode: '132', regionCode: '13' },
      { name: 'Pirque', code: '13202', provinceCode: '132', regionCode: '13' },
      { name: 'San José de Maipo', code: '13203', provinceCode: '132', regionCode: '13' },
      { name: 'Colina', code: '13301', provinceCode: '133', regionCode: '13' },
      { name: 'Lampa', code: '13302', provinceCode: '133', regionCode: '13' },
      { name: 'Tiltil', code: '13303', provinceCode: '133', regionCode: '13' },
      { name: 'San Bernardo', code: '13401', provinceCode: '134', regionCode: '13' },
      { name: 'Buin', code: '13402', provinceCode: '134', regionCode: '13' },
      { name: 'Calera de Tango', code: '13403', provinceCode: '134', regionCode: '13' },
      { name: 'Paine', code: '13404', provinceCode: '134', regionCode: '13' },
      { name: 'Melipilla', code: '13501', provinceCode: '135', regionCode: '13' },
      { name: 'Alhué', code: '13502', provinceCode: '135', regionCode: '13' },
      { name: 'Curacaví', code: '13503', provinceCode: '135', regionCode: '13' },
      { name: 'María Pinto', code: '13504', provinceCode: '135', regionCode: '13' },
      { name: 'San Pedro', code: '13505', provinceCode: '135', regionCode: '13' },
      { name: 'Talagante', code: '13601', provinceCode: '136', regionCode: '13' },
      { name: 'El Monte', code: '13602', provinceCode: '136', regionCode: '13' },
      { name: 'Isla de Maipo', code: '13603', provinceCode: '136', regionCode: '13' },
      { name: 'Padre Hurtado', code: '13604', provinceCode: '136', regionCode: '13' },
      { name: 'Peñaflor', code: '13605', provinceCode: '136', regionCode: '13' },
      
      // Región del Libertador General Bernardo O'Higgins (06)
      { name: 'Rancagua', code: '06101', provinceCode: '061', regionCode: '06' },
      { name: 'Codegua', code: '06102', provinceCode: '061', regionCode: '06' },
      { name: 'Coinco', code: '06103', provinceCode: '061', regionCode: '06' },
      { name: 'Coltauco', code: '06104', provinceCode: '061', regionCode: '06' },
      { name: 'Doñihue', code: '06105', provinceCode: '061', regionCode: '06' },
      { name: 'Graneros', code: '06106', provinceCode: '061', regionCode: '06' },
      { name: 'Las Cabras', code: '06107', provinceCode: '061', regionCode: '06' },
      { name: 'Machalí', code: '06108', provinceCode: '061', regionCode: '06' },
      { name: 'Malloa', code: '06109', provinceCode: '061', regionCode: '06' },
      { name: 'Mostazal', code: '06110', provinceCode: '061', regionCode: '06' },
      { name: 'Olivar', code: '06111', provinceCode: '061', regionCode: '06' },
      { name: 'Peumo', code: '06112', provinceCode: '061', regionCode: '06' },
      { name: 'Pichidegua', code: '06113', provinceCode: '061', regionCode: '06' },
      { name: 'Quinta de Tilcoco', code: '06114', provinceCode: '061', regionCode: '06' },
      { name: 'Rengo', code: '06115', provinceCode: '061', regionCode: '06' },
      { name: 'Requínoa', code: '06116', provinceCode: '061', regionCode: '06' },
      { name: 'San Vicente', code: '06117', provinceCode: '061', regionCode: '06' },
      { name: 'Pichilemu', code: '06201', provinceCode: '062', regionCode: '06' },
      { name: 'La Estrella', code: '06202', provinceCode: '062', regionCode: '06' },
      { name: 'Litueche', code: '06203', provinceCode: '062', regionCode: '06' },
      { name: 'Marchihue', code: '06204', provinceCode: '062', regionCode: '06' },
      { name: 'Navidad', code: '06205', provinceCode: '062', regionCode: '06' },
      { name: 'Paredones', code: '06206', provinceCode: '062', regionCode: '06' },
      { name: 'San Fernando', code: '06301', provinceCode: '063', regionCode: '06' },
      { name: 'Chépica', code: '06302', provinceCode: '063', regionCode: '06' },
      { name: 'Chimbarongo', code: '06303', provinceCode: '063', regionCode: '06' },
      { name: 'Lolol', code: '06304', provinceCode: '063', regionCode: '06' },
      { name: 'Nancagua', code: '06305', provinceCode: '063', regionCode: '06' },
      { name: 'Palmilla', code: '06306', provinceCode: '063', regionCode: '06' },
      { name: 'Peralillo', code: '06307', provinceCode: '063', regionCode: '06' },
      { name: 'Placilla', code: '06308', provinceCode: '063', regionCode: '06' },
      { name: 'Pumanque', code: '06309', provinceCode: '063', regionCode: '06' },
      { name: 'Santa Cruz', code: '06310', provinceCode: '063', regionCode: '06' },
      
      // Región del Maule (07)
      { name: 'Talca', code: '07101', provinceCode: '071', regionCode: '07' },
      { name: 'Constitución', code: '07102', provinceCode: '071', regionCode: '07' },
      { name: 'Curepto', code: '07103', provinceCode: '071', regionCode: '07' },
      { name: 'Empedrado', code: '07104', provinceCode: '071', regionCode: '07' },
      { name: 'Maule', code: '07105', provinceCode: '071', regionCode: '07' },
      { name: 'Pelarco', code: '07106', provinceCode: '071', regionCode: '07' },
      { name: 'Pencahue', code: '07107', provinceCode: '071', regionCode: '07' },
      { name: 'Río Claro', code: '07108', provinceCode: '071', regionCode: '07' },
      { name: 'San Clemente', code: '07109', provinceCode: '071', regionCode: '07' },
      { name: 'San Rafael', code: '07110', provinceCode: '071', regionCode: '07' },
      { name: 'Cauquenes', code: '07201', provinceCode: '072', regionCode: '07' },
      { name: 'Chanco', code: '07202', provinceCode: '072', regionCode: '07' },
      { name: 'Pelluhue', code: '07203', provinceCode: '072', regionCode: '07' },
      { name: 'Curicó', code: '07301', provinceCode: '073', regionCode: '07' },
      { name: 'Hualañé', code: '07302', provinceCode: '073', regionCode: '07' },
      { name: 'Licantén', code: '07303', provinceCode: '073', regionCode: '07' },
      { name: 'Molina', code: '07304', provinceCode: '073', regionCode: '07' },
      { name: 'Rauco', code: '07305', provinceCode: '073', regionCode: '07' },
      { name: 'Romeral', code: '07306', provinceCode: '073', regionCode: '07' },
      { name: 'Sagrada Familia', code: '07307', provinceCode: '073', regionCode: '07' },
      { name: 'Teno', code: '07308', provinceCode: '073', regionCode: '07' },
      { name: 'Vichuquén', code: '07309', provinceCode: '073', regionCode: '07' },
      { name: 'Linares', code: '07401', provinceCode: '074', regionCode: '07' },
      { name: 'Colbún', code: '07402', provinceCode: '074', regionCode: '07' },
      { name: 'Longaví', code: '07403', provinceCode: '074', regionCode: '07' },
      { name: 'Parral', code: '07404', provinceCode: '074', regionCode: '07' },
      { name: 'Retiro', code: '07405', provinceCode: '074', regionCode: '07' },
      { name: 'San Javier', code: '07406', provinceCode: '074', regionCode: '07' },
      { name: 'Villa Alegre', code: '07407', provinceCode: '074', regionCode: '07' },
      { name: 'Yerbas Buenas', code: '07408', provinceCode: '074', regionCode: '07' },
      
      // Región de Ñuble (16)
      { name: 'Chillán', code: '16101', provinceCode: '161', regionCode: '16' },
      { name: 'Bulnes', code: '16102', provinceCode: '161', regionCode: '16' },
      { name: 'Chillán Viejo', code: '16103', provinceCode: '161', regionCode: '16' },
      { name: 'El Carmen', code: '16104', provinceCode: '161', regionCode: '16' },
      { name: 'Pemuco', code: '16105', provinceCode: '161', regionCode: '16' },
      { name: 'Pinto', code: '16106', provinceCode: '161', regionCode: '16' },
      { name: 'Quillón', code: '16107', provinceCode: '161', regionCode: '16' },
      { name: 'San Ignacio', code: '16108', provinceCode: '161', regionCode: '16' },
      { name: 'Yungay', code: '16109', provinceCode: '161', regionCode: '16' },
      { name: 'Quirihue', code: '16201', provinceCode: '162', regionCode: '16' },
      { name: 'Cobquecura', code: '16202', provinceCode: '162', regionCode: '16' },
      { name: 'Coelemu', code: '16203', provinceCode: '162', regionCode: '16' },
      { name: 'Ninhue', code: '16204', provinceCode: '162', regionCode: '16' },
      { name: 'Portezuelo', code: '16205', provinceCode: '162', regionCode: '16' },
      { name: 'Ránquil', code: '16206', provinceCode: '162', regionCode: '16' },
      { name: 'Treguaco', code: '16207', provinceCode: '162', regionCode: '16' },
      { name: 'San Carlos', code: '16301', provinceCode: '163', regionCode: '16' },
      { name: 'Coihueco', code: '16302', provinceCode: '163', regionCode: '16' },
      { name: 'Ñiquén', code: '16303', provinceCode: '163', regionCode: '16' },
      { name: 'San Fabián', code: '16304', provinceCode: '163', regionCode: '16' },
      { name: 'San Nicolás', code: '16305', provinceCode: '163', regionCode: '16' },
      
      // Región del Biobío (08)
      { name: 'Concepción', code: '08101', provinceCode: '081', regionCode: '08' },
      { name: 'Coronel', code: '08102', provinceCode: '081', regionCode: '08' },
      { name: 'Chiguayante', code: '08103', provinceCode: '081', regionCode: '08' },
      { name: 'Florida', code: '08104', provinceCode: '081', regionCode: '08' },
      { name: 'Hualqui', code: '08105', provinceCode: '081', regionCode: '08' },
      { name: 'Lota', code: '08106', provinceCode: '081', regionCode: '08' },
      { name: 'Penco', code: '08107', provinceCode: '081', regionCode: '08' },
      { name: 'San Pedro de la Paz', code: '08108', provinceCode: '081', regionCode: '08' },
      { name: 'Santa Juana', code: '08109', provinceCode: '081', regionCode: '08' },
      { name: 'Talcahuano', code: '08110', provinceCode: '081', regionCode: '08' },
      { name: 'Tomé', code: '08111', provinceCode: '081', regionCode: '08' },
      { name: 'Hualpén', code: '08112', provinceCode: '081', regionCode: '08' },
      { name: 'Lebu', code: '08201', provinceCode: '082', regionCode: '08' },
      { name: 'Arauco', code: '08202', provinceCode: '082', regionCode: '08' },
      { name: 'Cañete', code: '08203', provinceCode: '082', regionCode: '08' },
      { name: 'Contulmo', code: '08204', provinceCode: '082', regionCode: '08' },
      { name: 'Curanilahue', code: '08205', provinceCode: '082', regionCode: '08' },
      { name: 'Los Álamos', code: '08206', provinceCode: '082', regionCode: '08' },
      { name: 'Tirúa', code: '08207', provinceCode: '082', regionCode: '08' },
      { name: 'Los Ángeles', code: '08301', provinceCode: '083', regionCode: '08' },
      { name: 'Antuco', code: '08302', provinceCode: '083', regionCode: '08' },
      { name: 'Cabrero', code: '08303', provinceCode: '083', regionCode: '08' },
      { name: 'Laja', code: '08304', provinceCode: '083', regionCode: '08' },
      { name: 'Mulchén', code: '08305', provinceCode: '083', regionCode: '08' },
      { name: 'Nacimiento', code: '08306', provinceCode: '083', regionCode: '08' },
      { name: 'Negrete', code: '08307', provinceCode: '083', regionCode: '08' },
      { name: 'Quilaco', code: '08308', provinceCode: '083', regionCode: '08' },
      { name: 'Quilleco', code: '08309', provinceCode: '083', regionCode: '08' },
      { name: 'San Rosendo', code: '08310', provinceCode: '083', regionCode: '08' },
      { name: 'Santa Bárbara', code: '08311', provinceCode: '083', regionCode: '08' },
      { name: 'Tucapel', code: '08312', provinceCode: '083', regionCode: '08' },
      { name: 'Yumbel', code: '08313', provinceCode: '083', regionCode: '08' },
      { name: 'Alto Biobío', code: '08314', provinceCode: '083', regionCode: '08' },
      
      // Región de La Araucanía (09)
      { name: 'Temuco', code: '09101', provinceCode: '091', regionCode: '09' },
      { name: 'Carahue', code: '09102', provinceCode: '091', regionCode: '09' },
      { name: 'Cunco', code: '09103', provinceCode: '091', regionCode: '09' },
      { name: 'Curarrehue', code: '09104', provinceCode: '091', regionCode: '09' },
      { name: 'Freire', code: '09105', provinceCode: '091', regionCode: '09' },
      { name: 'Galvarino', code: '09106', provinceCode: '091', regionCode: '09' },
      { name: 'Gorbea', code: '09107', provinceCode: '091', regionCode: '09' },
      { name: 'Lautaro', code: '09108', provinceCode: '091', regionCode: '09' },
      { name: 'Loncoche', code: '09109', provinceCode: '091', regionCode: '09' },
      { name: 'Melipeuco', code: '09110', provinceCode: '091', regionCode: '09' },
      { name: 'Nueva Imperial', code: '09111', provinceCode: '091', regionCode: '09' },
      { name: 'Padre Las Casas', code: '09112', provinceCode: '091', regionCode: '09' },
      { name: 'Perquenco', code: '09113', provinceCode: '091', regionCode: '09' },
      { name: 'Pitrufquén', code: '09114', provinceCode: '091', regionCode: '09' },
      { name: 'Pucón', code: '09115', provinceCode: '091', regionCode: '09' },
      { name: 'Saavedra', code: '09116', provinceCode: '091', regionCode: '09' },
      { name: 'Teodoro Schmidt', code: '09117', provinceCode: '091', regionCode: '09' },
      { name: 'Toltén', code: '09118', provinceCode: '091', regionCode: '09' },
      { name: 'Vilcún', code: '09119', provinceCode: '091', regionCode: '09' },
      { name: 'Villarrica', code: '09120', provinceCode: '091', regionCode: '09' },
      { name: 'Cholchol', code: '09121', provinceCode: '091', regionCode: '09' },
      { name: 'Angol', code: '09201', provinceCode: '092', regionCode: '09' },
      { name: 'Collipulli', code: '09202', provinceCode: '092', regionCode: '09' },
      { name: 'Curacautín', code: '09203', provinceCode: '092', regionCode: '09' },
      { name: 'Ercilla', code: '09204', provinceCode: '092', regionCode: '09' },
      { name: 'Lonquimay', code: '09205', provinceCode: '092', regionCode: '09' },
      { name: 'Los Sauces', code: '09206', provinceCode: '092', regionCode: '09' },
      { name: 'Lumaco', code: '09207', provinceCode: '092', regionCode: '09' },
      { name: 'Purén', code: '09208', provinceCode: '092', regionCode: '09' },
      { name: 'Renaico', code: '09209', provinceCode: '092', regionCode: '09' },
      { name: 'Traiguén', code: '09210', provinceCode: '092', regionCode: '09' },
      { name: 'Victoria', code: '09211', provinceCode: '092', regionCode: '09' },
      
      // Región de Los Ríos (14)
      { name: 'Valdivia', code: '14101', provinceCode: '141', regionCode: '14' },
      { name: 'Corral', code: '14102', provinceCode: '141', regionCode: '14' },
      { name: 'Lanco', code: '14103', provinceCode: '141', regionCode: '14' },
      { name: 'Los Lagos', code: '14104', provinceCode: '141', regionCode: '14' },
      { name: 'Máfil', code: '14105', provinceCode: '141', regionCode: '14' },
      { name: 'Mariquina', code: '14106', provinceCode: '141', regionCode: '14' },
      { name: 'Paillaco', code: '14107', provinceCode: '141', regionCode: '14' },
      { name: 'Panguipulli', code: '14108', provinceCode: '141', regionCode: '14' },
      { name: 'La Unión', code: '14201', provinceCode: '142', regionCode: '14' },
      { name: 'Futrono', code: '14202', provinceCode: '142', regionCode: '14' },
      { name: 'Lago Ranco', code: '14203', provinceCode: '142', regionCode: '14' },
      { name: 'Río Bueno', code: '14204', provinceCode: '142', regionCode: '14' },
      
      // Región de Los Lagos (10)
      { name: 'Puerto Montt', code: '10101', provinceCode: '101', regionCode: '10' },
      { name: 'Calbuco', code: '10102', provinceCode: '101', regionCode: '10' },
      { name: 'Cochamó', code: '10103', provinceCode: '101', regionCode: '10' },
      { name: 'Fresia', code: '10104', provinceCode: '101', regionCode: '10' },
      { name: 'Frutillar', code: '10105', provinceCode: '101', regionCode: '10' },
      { name: 'Los Muermos', code: '10106', provinceCode: '101', regionCode: '10' },
      { name: 'Llanquihue', code: '10107', provinceCode: '101', regionCode: '10' },
      { name: 'Maullín', code: '10108', provinceCode: '101', regionCode: '10' },
      { name: 'Puerto Varas', code: '10109', provinceCode: '101', regionCode: '10' },
      { name: 'Castro', code: '10201', provinceCode: '102', regionCode: '10' },
      { name: 'Ancud', code: '10202', provinceCode: '102', regionCode: '10' },
      { name: 'Chonchi', code: '10203', provinceCode: '102', regionCode: '10' },
      { name: 'Curaco de Vélez', code: '10204', provinceCode: '102', regionCode: '10' },
      { name: 'Dalcahue', code: '10205', provinceCode: '102', regionCode: '10' },
      { name: 'Puqueldón', code: '10206', provinceCode: '102', regionCode: '10' },
      { name: 'Queilén', code: '10207', provinceCode: '102', regionCode: '10' },
      { name: 'Quellón', code: '10208', provinceCode: '102', regionCode: '10' },
      { name: 'Quemchi', code: '10209', provinceCode: '102', regionCode: '10' },
      { name: 'Quinchao', code: '10210', provinceCode: '102', regionCode: '10' },
      { name: 'Osorno', code: '10301', provinceCode: '103', regionCode: '10' },
      { name: 'Puerto Octay', code: '10302', provinceCode: '103', regionCode: '10' },
      { name: 'Purranque', code: '10303', provinceCode: '103', regionCode: '10' },
      { name: 'Puyehue', code: '10304', provinceCode: '103', regionCode: '10' },
      { name: 'Río Negro', code: '10305', provinceCode: '103', regionCode: '10' },
      { name: 'San Juan de la Costa', code: '10306', provinceCode: '103', regionCode: '10' },
      { name: 'San Pablo', code: '10307', provinceCode: '103', regionCode: '10' },
      { name: 'Chaitén', code: '10401', provinceCode: '104', regionCode: '10' },
      { name: 'Futaleufú', code: '10402', provinceCode: '104', regionCode: '10' },
      { name: 'Hualaihué', code: '10403', provinceCode: '104', regionCode: '10' },
      { name: 'Palena', code: '10404', provinceCode: '104', regionCode: '10' },
      
      // Región de Aysén (11)
      { name: 'Coyhaique', code: '11101', provinceCode: '111', regionCode: '11' },
      { name: 'Lago Verde', code: '11102', provinceCode: '111', regionCode: '11' },
      { name: 'Aysén', code: '11201', provinceCode: '112', regionCode: '11' },
      { name: 'Cisnes', code: '11202', provinceCode: '112', regionCode: '11' },
      { name: 'Guaitecas', code: '11203', provinceCode: '112', regionCode: '11' },
      { name: 'Cochrane', code: '11301', provinceCode: '113', regionCode: '11' },
      { name: "O'Higgins", code: '11302', provinceCode: '113', regionCode: '11' },
      { name: 'Tortel', code: '11303', provinceCode: '113', regionCode: '11' },
      { name: 'Chile Chico', code: '11401', provinceCode: '114', regionCode: '11' },
      { name: 'Río Ibáñez', code: '11402', provinceCode: '114', regionCode: '11' },
      
      // Región de Magallanes (12)
      { name: 'Punta Arenas', code: '12101', provinceCode: '121', regionCode: '12' },
      { name: 'Laguna Blanca', code: '12102', provinceCode: '121', regionCode: '12' },
      { name: 'Río Verde', code: '12103', provinceCode: '121', regionCode: '12' },
      { name: 'San Gregorio', code: '12104', provinceCode: '121', regionCode: '12' },
      { name: 'Cabo de Hornos', code: '12201', provinceCode: '122', regionCode: '12' },
      { name: 'Antártica', code: '12202', provinceCode: '122', regionCode: '12' },
      { name: 'Porvenir', code: '12301', provinceCode: '123', regionCode: '12' },
      { name: 'Primavera', code: '12302', provinceCode: '123', regionCode: '12' },
      { name: 'Timaukel', code: '12303', provinceCode: '123', regionCode: '12' },
      { name: 'Natales', code: '12401', provinceCode: '124', regionCode: '12' },
      { name: 'Torres del Paine', code: '12402', provinceCode: '124', regionCode: '12' },
    ];
  }
}

export default new LocationService();
