import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  useNavigate, 
  useParams, 
  useLocation,
  useMatch,
  Link 
} from 'react-router-dom'

import { 
  Trash2, Plus, PlusCircle, History, Save, ClipboardList, Clock, User, HardHat, 
  ClipboardCheck, Settings, Eye, ShieldCheck, Truck, Package, 
  Utensils, CookingPot, Layers, Puzzle, Droplet, ArrowLeft,
  ChevronRight, ChevronDown, AlertCircle, AlertTriangle, Download, Lock, Store, Thermometer,
  Users, Megaphone, LayoutGrid, Wrench, ExternalLink, Home, QrCode, Monitor, RefreshCw
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { supabase } from './supabase';


const SECTORS = [
  { id: 'desarrollo', label: 'Desarrollo', icon: ClipboardCheck, color: '#3b82f6', description: 'Informes de prueba y recepción de mercaderia', isLocked: false },
  { id: 'calidad', label: 'Calidad', icon: ShieldCheck, color: '#10b981', description: 'Auditorias y controles de calidad', isLocked: false },
  // { id: 'rrhh', label: 'RR.HH', icon: Users, color: '#6366f1', description: 'Gestión de personal y talento', isLocked: false },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, color: '#d946ef', description: 'Estrategia y comunicación de marca', isLocked: false },
  { id: 'proveedores', label: 'Proveedores', icon: Truck, color: '#f59e0b', description: 'Gestión y evaluación de proveedores', isLocked: true },
  { id: 'produccion', label: 'Produccion', icon: HardHat, color: '#ef4444', description: 'Registros de linea y rendimiento', isLocked: false },
  { id: 'logistica', label: 'Logistica', icon: Package, color: '#8b5cf6', description: 'Control de despacho y flota', isLocked: false },
  { id: 'mantenimiento', label: 'Mantenimiento', icon: Settings, color: '#6b7280', description: 'Preventivos y correctivos de planta', isLocked: false },
  { id: 'mesa-carnes', label: 'Mesa de Carnes', icon: Utensils, color: '#ec4899', description: 'Control de lotes y desposte', isLocked: true },
  { id: 'cocina', label: 'Cocina', icon: CookingPot, color: '#f97316', description: 'Elaboración y planillas térmicas', isLocked: true },
  { id: 'picadillo', label: 'Picadillo', icon: Layers, color: '#06b6d4', description: 'Mezcla y balance de ingredientes', isLocked: true },
  { id: 'armado', label: 'Armado', icon: Puzzle, color: '#84cc16', description: 'Ensamble y finalización de producto', isLocked: true },
  { id: 'salsas', label: 'Salsas', icon: Droplet, color: '#0ea5e9', description: 'Dosificación y control de mezclas', isLocked: true },
  { id: 'sistemas', label: 'Sistemas', icon: Monitor, color: '#6366f1', description: 'Gestión IT y soporte técnico', isLocked: false, url: 'https://migusto.com.ar/fabrica/sistemas' },
];

const TOOLS = [
  { id: 'rooms', label: 'Rooms', icon: Home, color: '#facc15', description: 'Espacios y salas de informacion', url: 'https://migusto.com.ar/tools/rooms/' },
  { id: 'mes', label: 'MES', icon: HardHat, color: '#ef4444', description: 'Manufacturing Execution System - Control de Producción', url: 'https://migusto.com.ar/fabrica/MES/' },
  { id: 'qr', label: 'Generador QR', icon: QrCode, color: '#3b82f6', description: 'Generador de códigos QR internos', url: 'https://migusto.com.ar/tools/QR/' },
];

const SUCURSALES_POR_ZONA = {
  'CABA/OESTE': [
    'Belgrano', 'Barrancas', 'Palermo', 'P.Madero', 'Balvanera', 
    'V.Crespo', 'Paternal', 'Floresta', 'Mataderos', 'Ituzaingo', 
    'Merlo', 'Moreno'
  ],
  'CAMPANA': [
    'Maschwitz', 'Escobar', 'Campana', 'Pilar Centro', 'Pilar Palmas', 
    'Del Viso', 'Tortugas Norte', 'Pacheco', 'Torcuato', 'Polvorines', 
    'Jose C Paz', 'San Miguel', 'Muñiz', 'Bella Vista'
  ],
  'NORTE': [
    'Hurlingham', 'Devoto', 'Villa Urquiza', 'San Martin', 'V.Ballester', 
    'V.Adelina', 'Munro', 'Florida', 'Martinez', 'San Fernando', 'Tigre'
  ]
};




const getFormattedToday = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const getCurrentDate = () => new Date().toISOString().split('T')[0];

const formatInputDate = (dateStr) => {
  if (!dateStr) return '';
  // If it's already DD/MM/YYYY (detecting leading day/month)
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) return dateStr;
    // Attempt fallback for YYYY/MM/DD if browser is weird
    if (parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  // Try to parse YYYY-MM-DD
  const matches = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matches) return `${matches[3]}/${matches[2]}/${matches[1]}`;
  
  return dateStr;
};

const handleDateMask = (val, prevVal = '') => {
  if (val.length < prevVal.length) return val; // Support deletion
  
  // Remove non-numeric
  let numeric = val.replace(/\D/g, '');
  if (numeric.length > 8) numeric = numeric.slice(0, 8);
  
  let formatted = '';
  if (numeric.length > 0) {
    formatted = numeric.slice(0, 2);
    if (numeric.length > 2) {
      formatted += '/' + numeric.slice(2, 4);
      if (numeric.length > 4) {
        formatted += '/' + numeric.slice(4, 8);
      }
    }
  }
  return formatted;
};

const handleDateTimeMask = (val, prevVal = '') => {
  if (val.length < prevVal.length) return val; // Support deletion
  
  // Remove non-numeric
  let numeric = val.replace(/\D/g, '');
  if (numeric.length > 12) numeric = numeric.slice(0, 12);
  
  let formatted = '';
  if (numeric.length > 0) {
    formatted = numeric.slice(0, 2);
    if (numeric.length > 2) {
      formatted += '/' + numeric.slice(2, 4);
      if (numeric.length > 4) {
        formatted += '/' + numeric.slice(4, 8);
        if (numeric.length > 8) {
          formatted += ' ' + numeric.slice(8, 10);
          if (numeric.length > 10) {
            formatted += ':' + numeric.slice(10, 12);
          }
        }
      }
    }
  }
  return formatted;
};

const getCurrentTimestamp = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
    '255, 255, 255';
};

const logAction = async (supabase, sector, action, user, details) => {
  try {
    const { data, error } = await supabase.from('logs').insert([{
      sector,
      action,
      user_name: user || 'Sistema',
      details: typeof details === 'object' ? JSON.stringify(details) : details
    }]);
    if (error) {
      console.error("Supabase Log Error:", error);
      // Fallback try with different column names if common ones fail
      await supabase.from('logs').insert([{
        sector,
        action,
        responsable: user || 'Sistema',
        datos: typeof details === 'object' ? JSON.stringify(details) : details
      }]);
    }
    else console.log("Log recorded successfully:", data);
  } catch (err) {
    console.error("Critical error in logAction:", err);
  }
};

const initialFormState = () => ({
  codigo: '',
  revision: '',
  producto: '',
  fecha: getFormattedToday(),
  tipoPrueba: '',
  categoria: [],
  justificacion: '',
  descripcionPrueba: '',
  resultados: '',
  decisionFinal: '',
  observaciones: '',
  responsable: ''
});

const initialMaterialsForm = () => ({
  proveedor: '',
  grupoInsumos: '',
  insumos: [''], // Multiple products
  lotes: [''],    // Initial 1 lot
  vencimientos: [''], // Initial 1 exp
  fechaIngreso: getFormattedToday(),
  ingresadoPor: '',
  controlCamionLimpio: null,
  controlRefrigerado: null,
  controlTipoAlimento: '',
  temperatura: '',
  controlEnvaseIntegro: null,
  controlSinOlores: null,
  controlProtocoloCalidad: null,
  controlAptoIngreso: null,
  registroTimestamp: getCurrentTimestamp(),
  firmaResponsable: ''
});

const initialDespachoForm = () => ({
  fecha: getFormattedToday(),
  preparadaPor: '',
  zona: '',
  sucursal: '',
  condicionesIngreso: '',
  condicionesCamara: '',
  temperaturaCamara: '',
  descargaCorrecta: null
});

const CAMARAS_CONFIG = [
  { id: 1, name: 'Camara 1 - MP Quesos y Embutidos', mpRange: '0.6 ºC y 5.0 ºC', tableroRange: '0.0 ºC y 10.0 ºC' },
  { id: 2, name: 'Camara 2 - MP Rellenos', mpRange: '1.0 ºC y 6.0 ºC', tableroRange: '4.0 ºC y 10.0 ºC' },
  { id: 3, name: 'Camara 3 - Congelados', mpRange: '-24.0 ºC y -15.0 ºC', tableroRange: '-24.0 ºC y -5.0 ºC' },
  { id: 4, name: 'Camara 4 - Pollo', mpRange: '0.0 ºC y 4.0 ºC', tableroRange: '0.0 ºC y 6.0 ºC' },
  { id: 5, name: 'Camara 5 - Verduras', mpRange: '-4.0 ºC y 5.0 ºC', tableroRange: '-6.0 ºC y 6.0 ºC' },
  { id: 6, name: 'Camara 6 - Carnes', mpRange: '0.0 ºC y 5.0 ºC', tableroRange: '-1.0 ºC y 5.0 ºC' },
  { id: 7, name: 'Camara 7 - Abatidor', mpRange: '4.0 ºC y 7.0 ºC', tableroRange: '4.0 ºC y 10.0 ºC' },
  { id: 8, name: 'Camara 8 - Produccion', mpRange: '-2.0 ºC y 8.0 ºC', tableroRange: '-4.0 ºC y 10.0 ºC' },
  { id: 9, name: 'Camara 9 - Tapas', mpRange: '1.0 ºC y 6.0 ºC', tableroRange: '0.0 ºC y 8.0 ºC' },
  { id: 10, name: 'Camara 10 - Materia Prima', mpRange: '1.0 ºC y 4.0 ºC', tableroRange: '0.0 ºC y 5.0 ºC' },
  { id: 11, name: 'Camara 11 - Proveedores', mpRange: '1.0 ºC y 5.0 ºC', tableroRange: '0.0 ºC y 6.0 ºC' },
  { id: 12, name: 'Camara 12 - Logistica', mpRange: '2.0 ºC y 5.0 ºC', tableroRange: '0.0 ºC y 6.0 ºC' },
];

const initialTemperaturaCamarasForm = () => ({
  fecha: getFormattedToday(),
  preparadaPor: '',
  ubicacion: '',
  camaras: CAMARAS_CONFIG.reduce((acc, cam) => {
    acc[cam.id] = {
      temperaturaMP: '',
      temperaturaTablero: '',
      limpia: ''
    };
    return acc;
  }, {})
});

const initialCorrectiveForm = () => ({
  equipo: '',
  prioridad: 'media',
  descripcion: '',
  acciones: '',
  responsable: ''
});


const RegsApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sectorMatch = useMatch('/:sectorId');
  const sectorId = sectorMatch?.params.sectorId;
  const [activeSubTab, setActiveSubTab] = useState('form')
  const [isUnlocked, setIsUnlocked] = useState(() => localStorage.getItem('regsapp_admin_unlocked') === 'true');
  const [pin, setPin] = useState('');
  const [showTools, setShowTools] = useState(false);
  const ADMIN_PIN = '2026'; // Nueva clave solicitada

  const activeSector = sectorId || null;
  const isMenuView = !sectorId || location.pathname === '/';

  const handlePinChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(val);
    if (val === ADMIN_PIN) {
      setIsUnlocked(true);
      localStorage.setItem('regsapp_admin_unlocked', 'true');
    }
  };
  const [records, setRecords] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState(initialFormState());
  const [materialsData, setMaterialsData] = useState(initialMaterialsForm());
  const [nonConformityData, setNonConformityData] = useState({
    areaImplicada: '',
    codigo: '',
    fecha: getFormattedToday(),
    descripcion: '',
    causaRaiz: '',
    accionCorrectiva: '',
    responsable: '',
    estado: 'Abierto',
    respuestas: [] 
  });
  const [despachoData, setDespachoData] = useState(initialDespachoForm());
  const [correctiveData, setCorrectiveData] = useState(initialCorrectiveForm());
  const [preventiveList, setPreventiveList] = useState([
    { id: 1, equipo: 'Horno Rotativo', tarea: 'Limpieza de quemadores', frecuencia: 'Mensual', ultimaRevision: '15/04/2026', estado: 'ok' },
    { id: 2, equipo: 'Cámara Frío #1', tarea: 'Control de gas refrigerante', frecuencia: 'Trimestral', ultimaRevision: '02/02/2026', estado: 'warning' },
    { id: 3, equipo: 'Cinta Transportadora', tarea: 'Engrase de rodamientos', frecuencia: 'Semanal', ultimaRevision: '20/04/2026', estado: 'danger' },
  ]);
  const [spareParts, setSpareParts] = useState([
    { id: 1, name: 'Rodamiento SKF 6204', stock: 12, min: 5 },
    { id: 2, name: 'Correa Dentada 5M', stock: 3, min: 4 },
    { id: 3, name: 'Sensor Inductivo M18', stock: 8, min: 2 },
    { id: 4, name: 'Aceite Hidráulico 68', stock: 20, min: 10 },
  ]);
  const [machinesStatus, setMachinesStatus] = useState([
    { id: 1, name: 'Línea de Armado 1', status: 'OPERATIVO', color: '#10b981' },
    { id: 2, name: 'Picadora de Carne Industrial', status: 'EN REPARACIÓN', color: '#facc15' },
    { id: 3, name: 'Túnel de Enfriamiento', status: 'FUERA DE SERVICIO', color: '#ef4444' },
    { id: 4, name: 'Compresor Central', status: 'OPERATIVO', color: '#10b981' },
  ]);
  const [temperaturaCamarasData, setTemperaturaCamarasData] = useState(initialTemperaturaCamarasForm());
  const [collapsedCameras, setCollapsedCameras] = useState(() => 
    CAMARAS_CONFIG.reduce((acc, cam) => ({ ...acc, [cam.id]: true }), {})
  );

  const toggleCameraCollapse = (id) => {
    setCollapsedCameras(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCameraStatusSelect = (camId, status) => {
    const next = { ...temperaturaCamarasData.camaras };
    next[camId] = { ...next[camId], limpia: status };
    setTemperaturaCamarasData({ ...temperaturaCamarasData, camaras: next });

    // Auto-collapse current and expand next
    setCollapsedCameras(prev => {
      const updated = { ...prev, [camId]: true };
      const nextId = parseInt(camId) + 1;
      if (nextId <= CAMARAS_CONFIG.length) {
        updated[nextId] = false;
      }
      return updated;
    });
  };
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, action: null, title: '' });
  const [despachoError, setDespachoError] = useState(false);

  // Helper: normalize a DB record so nested 'datos' fields are available at top level
  const normalizeRecord = (rec) => {
    if (!rec) return rec;
    const datos = rec.datos || {};
    return {
      ...datos,
      ...rec,
      // Normalize tipo → type
      type: rec.tipo || rec.type,
    };
  };

  // Helper: normalize a DB notification (snake_case → camelCase)
  const normalizeNotif = (n) => ({
    ...n,
    targetSector: n.target_sector ?? n.targetSector,
    emitterName: n.target_sector_name ?? n.targetSectorName,
    refId: n.ref_id ?? n.refId,
    // Solo consideramos "no vista" cuando es estrictamente false
    seen: n.seen === false ? false : true,
  });

  // Soporta datos viejos (label) y nuevos (id) para área implicada
  const getSectorFromAreaImplicada = (areaImplicada) => {
    if (!areaImplicada) return null;
    return (
      SECTORS.find(s => s.id === areaImplicada) ||
      SECTORS.find(s => s.label === areaImplicada) ||
      null
    );
  };

  const fetchRecords = async () => {
    const { data: recs } = await supabase.from('registros').select('*').order('created_at', { ascending: false });
    if (recs) setRecords(recs.map(normalizeRecord));
  };
  const fetchNotifications = async () => {
    const { data: notifs } = await supabase.from('notificaciones').select('*').order('created_at', { ascending: false });
    if (notifs) setNotifications(notifs.map(normalizeNotif));
  };
  const fetchLogs = async () => {
    const { data, error } = await supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (!error && data) setLogs(data);
  };

  // 1. Fetch Inicial
  useEffect(() => {
    fetchRecords();
    fetchNotifications();
    fetchLogs();
  }, []);

  // 2. Realtime Synchronization
  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registros' }, payload => {
        if (payload.eventType === 'INSERT') {
          setRecords(prev => [normalizeRecord(payload.new), ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const updated = normalizeRecord(payload.new);
          setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
          setSelectedRecord(prev => (prev && prev.id === updated.id) ? updated : prev);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones' }, payload => {
        setNotifications(prev => [normalizeNotif(payload.new), ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notificaciones' }, payload => {
        const updatedNotif = normalizeNotif(payload.new);
        setNotifications(prev => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logs' }, payload => {
        if (payload.eventType === 'INSERT') {
          setLogs(prev => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dynamic Page Title
  useEffect(() => {
    const currentSector = SECTORS.find(s => s.id === activeSector);
    if (currentSector) {
      document.title = `Mi Gusto - ${currentSector.label}`;
    } else {
      document.title = "Mi Gusto - Registros";
    }
  }, [activeSector]);

  // 3. Redirección de sub-pestañas por defecto por sector
  useEffect(() => {
    if (!activeSector) return;

    if (activeSector === 'calidad' && activeSubTab === 'form') {
      setActiveSubTab('temperatura-camaras'); // Changed from despacho since it's no longer there
    } else if (activeSector === 'logistica' && activeSubTab === 'form') {
      setActiveSubTab('despacho-franquicias');
    } else if (activeSector === 'rrhh' && activeSubTab === 'form') {
      setActiveSubTab('personal');
    } else if (activeSector === 'mantenimiento' && activeSubTab === 'form') {
      setActiveSubTab('correctivo');
    } else if (activeSector === 'produccion' && activeSubTab === 'form') {
      setActiveSubTab('history');
    }
  }, [activeSector, activeSubTab]);

  // Effect to get current location for "Control de Temperatura de Camaras"
  useEffect(() => {
    if (activeSector === 'calidad' && activeSubTab === 'temperatura-camaras' && !temperaturaCamarasData.ubicacion) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              // Smart check for Mi Gusto Plant (based on coordinates provided)
              const plantLat = -34.5631, plantLon = -58.6596;
              const dist = Math.sqrt(Math.pow(latitude - plantLat, 2) + Math.pow(longitude - plantLon, 2));
              
              if (dist < 0.003) { // Close enough to the plant
                setTemperaturaCamarasData(prev => ({ 
                  ...prev, 
                  ubicacion: "Av. Pres. Arturo Umberto Illia 275, B1661 Bella Vista, Provincia de Buenos Aires" 
                }));
                return;
              }

              // Nominatim Reverse Geocoding for detailed address
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              const data = await response.json();
              if (data.address) {
                const a = data.address;
                // Construct formatting similar to Google Maps / User request
                let road = a.road || a.pedestrian || a.suburb || '';
                // Apply common abbreviations
                road = road.replace('Avenida', 'Av.').replace('Presidente', 'Pres.');
                
                const house = a.house_number || a.building || '';
                const roadPart = `${road} ${house}`.trim();
                
                const locality = a.city || a.town || a.village || a.suburb || '';
                // Postcode: try to keep it short (e.g., B1661)
                let postcode = a.postcode || '';
                if (postcode.includes(' ')) postcode = postcode.split(' ')[0];
                
                const localityPart = `${postcode} ${locality}`.trim();
                
                const state = a.state || '';
                const statePart = state ? `Provincia de ${state}` : '';
                
                const formatted = [roadPart, localityPart, statePart].filter(Boolean).join(', ');
                
                setTemperaturaCamarasData(prev => ({ 
                  ...prev, 
                  ubicacion: formatted 
                }));
              } else if (data.display_name) {
                setTemperaturaCamarasData(prev => ({ 
                  ...prev, 
                  ubicacion: data.display_name 
                }));
              } else {
                setTemperaturaCamarasData(prev => ({ ...prev, ubicacion: 'Planta Principal' }));
              }
            } catch (err) {
              setTemperaturaCamarasData(prev => ({ ...prev, ubicacion: 'Planta Principal' }));
            }
          },
          async () => {
             // Fallback to IP if GPS is blocked
             try {
               const response = await fetch('https://ipapi.co/json/');
               const data = await response.json();
               setTemperaturaCamarasData(prev => ({ 
                 ...prev, 
                 ubicacion: `${data.city || 'Buenos Aires'}, ${data.country_name || 'Argentina'}` 
               }));
             } catch (err) {
               setTemperaturaCamarasData(prev => ({ ...prev, ubicacion: 'Planta Principal' }));
             }
          },
          { enableHighAccuracy: true }
        );
      } else {
        setTemperaturaCamarasData(prev => ({ ...prev, ubicacion: 'Planta Principal' }));
      }
    }
  }, [activeSector, activeSubTab, temperaturaCamarasData.ubicacion]);

  // Helper: get only non‑conformity notifications for the current sector
  const filteredNotifications = notifications.filter(
    n => n.targetSector === activeSector &&
         (n.message?.toLowerCase().includes('no conformidad') || 
          n.message?.toLowerCase().includes('nueva no conformidad') ||
          n.message?.toLowerCase().includes('novedad de personal') ||
          n.message?.toLowerCase().includes('aviso de marketing') ||
          n.message?.toLowerCase().includes('gestión de personal') ||
          n.message?.toLowerCase().includes('respuesta'))
  );

  // Mark all relevant notifications as seen (only those filtered above)
  const markAllAsSeen = async () => {
    setNotifications(prev =>
      prev.map(n =>
        n.targetSector === activeSector ? { ...n, seen: true } : n
      )
    );

    await supabase
      .from('notificaciones')
      .update({ seen: true })
      .eq('target_sector', activeSector)
      .or('seen.eq.false,seen.is.null');
  };

  const markNotificationAsSeen = async (notificationId) => {
    if (!notificationId) return;

    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, seen: true } : n))
    );

    await supabase
      .from('notificaciones')
      .update({ seen: true })
      .eq('id', notificationId);
  };

  // Mantiene una sola notificación por NC y sector destino.
  // Si ya existe (mismo ref_id + target_sector), la actualiza y la deja no leída.
  const upsertNcNotification = async ({
    targetSector,
    emitterName,
    message,
    details,
    refId
  }) => {
    const { data: existingNotif, error: findError } = await supabase
      .from('notificaciones')
      .select('id')
      .eq('ref_id', refId)
      .eq('target_sector', targetSector)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) return { error: findError };

    if (existingNotif?.id) {
      return supabase
        .from('notificaciones')
        .update({
          target_sector_name: emitterName,
          message,
          details,
          timestamp: getCurrentTimestamp(),
          seen: false
        })
        .eq('id', existingNotif.id);
    }

    return supabase.from('notificaciones').insert([{
      target_sector: targetSector,
      target_sector_name: emitterName,
      message,
      details,
      timestamp: getCurrentTimestamp(),
      ref_id: refId
    }]);
  };

  const hasUnreadNotifications = filteredNotifications.some(n => n.seen === false);
  const hasUnansweredNotifications = filteredNotifications.some(notif => {
    const refId = notif.refId ?? notif.ref_id;
    const record = records.find(r => r.id === refId);
    if (!record) return false;
    // Las novedades de personal y marketing son informativas y no requieren respuesta obligatoria (evita el color rojo)
    if (record.sector === 'rrhh' || record.sector === 'marketing') return false;
    return !record.respuestas || record.respuestas.length === 0;
  });

  const notifStatus = 
    filteredNotifications.length === 0 ? 'empty' :
    hasUnreadNotifications ? 'unread' :
    hasUnansweredNotifications ? 'unanswered' : 'all-clear';

  const handleGeneratePDF = async (record, action = 'save') => {
    let typeLabel = "REPORTE";
    const rType = record.type || record.tipo;
    if (rType === 'report') typeLabel = "Prueba de Desarrollo";
    else if (rType === 'material') typeLabel = "Ingreso de Material";
    else if (rType === 'non-conformity') typeLabel = "No Conformidad";
    else if (rType === 'despacho-franquicias') typeLabel = "Control de Despacho";
    else if (rType === 'temperatura-camaras') typeLabel = "Control de Cámaras";

    // Convert logo to base64 for PDF inclusion
    let logoBase64 = "";
    try {
      const attempts = [
        '/Logo%20Mi%20Gusto%202025%20Negro.png',
        '/Logo Mi Gusto 2025 Negro.png',
        './Logo%20Mi%20Gusto%202025%20Negro.png',
        '/Logo_Mi_Gusto_2025.png' // Fallback
      ];
      
      let response;
      for (const url of attempts) {
        try {
          console.log("PDF: Attempting to load logo from:", url);
          response = await fetch(url);
          if (response.ok) {
            console.log("PDF: Logo loaded successfully from:", url);
            break;
          }
        } catch (e) {
          console.warn(`PDF: Failed to fetch ${url}`, e);
        }
      }

      if (response && response.ok) {
        const blob = await response.blob();
        logoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        console.log("PDF: Base64 conversion successful, length:", logoBase64.length);
      } else {
        throw new Error("All logo load attempts failed");
      }
    } catch (e) {
      console.error("PDF: Logo processing failed:", e);
    }

    let contentHTML = `
      <div style="padding: 40px; font-family: sans-serif; color: #333;">
        <div style="border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="vertical-align: top; text-align: left;">
                <h1 style="margin: 0; color: #111; font-size: 24px;">${typeLabel}</h1>
                <p style="margin: 5px 0 0; color: #666; font-size: 14px;">ID: ${record.codigo || record.id} | Fecha: ${record.fecha || record.fechaIngreso || record.created_at?.split('T')[0]}</p>
              </td>
              <td style="vertical-align: top; text-align: right;">
                ${logoBase64 ? `<img src="${logoBase64}" style="height: 60px; display: block; margin-left: auto;" />` : `<span style="color: #ccc; font-size: 10px;">LOGO NOT LOADED</span>`}
              </td>
            </tr>
          </table>
        </div>
    `;

    if (rType === 'report') {
      contentHTML += `
        <div style="margin-bottom: 20px;"><strong>Area Responsable:</strong> ${record.sector || '-'}</div>
        <div style="margin-bottom: 20px;"><strong>Producto/Proyecto:</strong> ${record.producto}</div>
        <div style="margin-bottom: 20px;"><strong>Categoría:</strong> ${record.categoria?.join(', ') || '-'}</div>
        <div style="margin-bottom: 20px;"><strong>Justificación:</strong><br/>${record.justificacion || '-'}</div>
        <div style="margin-bottom: 20px;"><strong>Descripción de la prueba:</strong><br/>${record.descripcionPrueba || '-'}</div>
        <div style="margin-bottom: 20px;"><strong>Resultados obtenidos:</strong><br/>${record.resultados || '-'}</div>
        <div style="margin-bottom: 20px;"><strong>Decisión Final:</strong> ${record.decisionFinal || '-'}</div>
        <div style="margin-bottom: 20px;"><strong>Observaciones Finales:</strong><br/>${record.observaciones || '-'}</div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #ccc;">
          <strong>Firma Responsable:</strong> ${record.responsable || '-'}
        </div>
      `;
    } else if (rType === 'material') {
      contentHTML += `
        <div style="margin-bottom: 15px;"><strong>Proveedor:</strong> ${record.proveedor || record.datos?.proveedor || '-'}</div>
        <div style="margin-bottom: 15px;"><strong>Fecha Recepción:</strong> ${record.fecha || record.datos?.fechaIngreso || '-'}</div>
        <div style="margin-bottom: 15px;"><strong>Responsable:</strong> ${record.responsable || record.datos?.ingresadoPor || '-'}</div>
        
        <div style="margin-top: 20px; margin-bottom: 10px;"><strong>Insumos / Productos:</strong></div>
        <ul style="margin: 0 0 20px 20px; padding: 0;">
          ${(record.insumos || [record.producto]).map(ins => `<li>${ins}</li>`).join('')}
        </ul>

        <div style="margin-top: 20px; margin-bottom: 10px;"><strong>Trazabilidad:</strong></div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Lote</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            ${(record.lotes || []).map((lote, i) => lote ? `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${lote}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${record.vencimientos?.[i] || '-'}</td>
              </tr>
            ` : '').join('')}
          </tbody>
        </table>

        ${record.controlRefrigerado ? `
          <div style="margin-top: 15px; padding: 10px; border: 1px solid #eee; background: #fafafa;">
            <strong>Control de Temperatura:</strong> ${record.temperatura || '-'} °C
          </div>
        ` : ''}

        <div style="margin-top: 20px;">
          <strong>Controles de Calidad:</strong><br/>
          <span style="font-size: 12px;">
            ${record.controlCamionLimpio ? '✓ Camión Limpio' : '✗ Camión Sucio'} | 
            ${record.controlEnvaseIntegro ? '✓ Envase Íntegro' : '✗ Envase Dañado'} | 
            ${record.controlSinOlores ? '✓ Sin Olores' : '✗ Con Olores'} | 
            ${record.controlAptoIngreso ? '✓ APTO PARA INGRESO' : '✗ NO APTO'}
          </span>
        </div>
      `;
    } else if (rType === 'despacho-franquicias') {
      contentHTML += `
        <div style="margin-bottom: 20px;"><strong>Zona:</strong> ${record.datos?.zona || '-'}</div>
        <div style="margin-bottom: 20px;"><strong>Sucursal:</strong> ${record.datos?.sucursal || '-'}</div>
        <div style="margin-bottom: 20px;"><strong>Preparada por:</strong> ${record.responsable || '-'}</div>
      `;
    } else {
      contentHTML += `
        <div style="margin-bottom: 20px;"><strong>Área Implicada:</strong> ${record.areaImplicada || record.datos?.areaImplicada || '-'}</div>
        <div style="margin-bottom: 20px;"><strong>Estado:</strong> ${record.estado || record.datos?.estado || '-'}</div>
        <div style="margin-bottom: 20px;"><strong>Descripción del Desvío:</strong><br/>${record.descripcion || record.datos?.descripcion || '-'}</div>
        <div style="margin-bottom: 20px;"><strong>Causa Raíz:</strong><br/>${record.causaRaiz || record.datos?.causaRaiz || '-'}</div>
        <div style="margin-bottom: 20px;"><strong>Acción Correctiva:</strong><br/>${record.accionCorrectiva || record.datos?.accionCorrectiva || '-'}</div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #ccc;">
          <strong>Responsable:</strong> ${record.responsable || '-'}
        </div>
      `;
      if (record.respuestas && record.respuestas.length > 0) {
        contentHTML += `
          <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border: 1px solid #eee; border-radius: 8px;">
            <h3 style="margin-top: 0; font-size: 16px;">Historial de Respuestas</h3>
            ${record.respuestas.map(r => `
              <div style="margin-bottom: 15px;">
                <strong style="color: ${r.sectorColor || '#333'}">${r.sectorName}:</strong> 
                <span>${r.text}</span>
                <div style="font-size: 12px; color: #888; margin-top: 4px;">${r.timestamp}</div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    contentHTML += `</div>`;

    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5],
      filename:     `Informe_${rType}_${record.codigo || record.id}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    if (action === 'save') {
      html2pdf().set(opt).from(contentHTML).save();
    } else {
      html2pdf().set(opt).from(contentHTML).output('bloburl').then(url => {
        window.open(url, '_blank');
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmModal({
      show: true,
      title: (activeSector === 'rrhh' || activeSector === 'marketing') ? '¿Confirmar envío de registro?' : '¿Confirmar guardado de informe?',
      action: async () => {
        let finalFormData = { ...formData };

        if (activeSubTab === 'personal') {
          finalFormData.tipoPrueba = 'rrhh';
          if (!finalFormData.codigo) {
            finalFormData.codigo = `PERS-${Math.floor(Math.random() * 900000) + 100000}`;
          }
        }

        // --- LÓGICA DE ENVÍO MASIVO (Marketing) ---
        if (activeSector === 'marketing' && activeSubTab === 'form') {
          const targetIds = Array.isArray(finalFormData.tipoPrueba) ? finalFormData.tipoPrueba : (finalFormData.tipoPrueba ? [finalFormData.tipoPrueba] : []);
          
          if (targetIds.length === 0) {
             setConfirmModal({ show: false, action: null, title: '' });
             return;
          }

          for (const targetId of targetIds) {
            const individualFormData = { ...finalFormData, tipoPrueba: [targetId] };
            const individualCodigo = `MK-${Math.floor(Math.random() * 900000) + 100000}`;

            const { data: newRecs, error: insError } = await supabase.from('registros').insert([{
              sector: activeSector,
              tipo: 'report',
              producto: individualFormData.producto,
              responsable: individualFormData.responsable,
              fecha: formatInputDate(individualFormData.fecha),
              codigo: individualCodigo,
              datos: { ...individualFormData, codigo: individualCodigo }
            }]).select();

            if (!insError && newRecs) {
              await upsertNcNotification({
                targetSector: targetId,
                emitterName: SECTORS.find(s => s.id === activeSector)?.label || activeSector,
                message: `AVISO DE MARKETING: ${individualFormData.producto}`,
                details: individualFormData.justificacion,
                refId: newRecs[0].id
              });
            }
          }

          await logAction(supabase, activeSector, 'Envío Masivo Marketing', finalFormData.responsable, { count: targetIds.length, producto: finalFormData.producto });
          setFormData(initialFormState());
          setSelectedRecord(null);
          setActiveSubTab('history');
          setConfirmModal({ show: false, action: null, title: '' });
          return;
        }

        // --- LÓGICA DE ENVÍO ÚNICO (Personal y otros) ---
        const { data: newRecs, error } = await supabase.from('registros').insert([{
          sector: activeSector,
          tipo: 'report',
          producto: finalFormData.producto,
          responsable: finalFormData.responsable,
          fecha: formatInputDate(finalFormData.fecha),
          codigo: finalFormData.codigo,
          datos: { ...finalFormData }
        }]).select();
        
        if (!error && newRecs) {
          await logAction(supabase, activeSector, 'Nuevo Informe', finalFormData.responsable, { tipo: finalFormData.tipoPrueba, producto: finalFormData.producto });
          if (activeSector === 'marketing' || activeSubTab === 'personal') {
            const targetIds = activeSubTab === 'personal' ? ['rrhh'] : (Array.isArray(finalFormData.tipoPrueba) ? finalFormData.tipoPrueba : [finalFormData.tipoPrueba]);
            
            for (const targetSectorId of targetIds) {
              if (!targetSectorId) continue;
              await upsertNcNotification({
                targetSector: targetSectorId,
                emitterName: SECTORS.find(s => s.id === activeSector)?.label || activeSector,
                message: activeSubTab === 'personal' ? `NOVEDAD DE PERSONAL: ${finalFormData.producto}` : `AVISO DE MARKETING: ${finalFormData.producto}`,
                details: finalFormData.justificacion,
                refId: newRecs[0].id
              });
            }
          }

          setFormData(initialFormState());
          setSelectedRecord(null);
          setActiveSubTab('history');
        }
        setConfirmModal({ show: false, action: null, title: '' });
      }
    });
  }

  const handleMaterialsSubmit = (e) => {
    e.preventDefault();
    setConfirmModal({
      show: true,
      title: '¿Confirmar registro de ingreso?',
      action: async () => {
        const { data, error } = await supabase.from('registros').insert([{
          sector: activeSector,
          tipo: 'material',
          producto: materialsData.insumos.filter(i => i.trim()).join(', '),
          responsable: materialsData.ingresadoPor,
          fecha: formatInputDate(materialsData.fechaIngreso),
          datos: { ...materialsData }
        }]).select();

        if (!error) {
          await logAction(supabase, activeSector, 'Ingreso de Material', materialsData.ingresadoPor, { 
            insumos: materialsData.insumos.filter(i => i.trim()), 
            proveedor: materialsData.proveedor 
          });
          setMaterialsData(initialMaterialsForm());
          setActiveSubTab('history');
        }
        setConfirmModal({ show: false, action: null, title: '' });
      }
    });
  }

  const handleSaveResponse = (recordId, responseText) => {
    if (!responseText.trim()) return;
    const record = records.find(r => r.id === recordId);
    if (!record) return;

    setConfirmModal({
      show: true,
      title: '¿Confirmar envío de respuesta?',
      action: async () => {
        const sectorInfo = SECTORS.find(s => s.id === activeSector);
        const newMsg = {
          sectorId: activeSector,
          sectorName: sectorInfo ? sectorInfo.label : activeSector,
          sectorColor: sectorInfo ? sectorInfo.color : '#fff',
          text: responseText,
          timestamp: getCurrentTimestamp()
        };

        const updatedRespuestas = [...(Array.isArray(record.respuestas) ? record.respuestas : []), newMsg];
        
        const { error: updError } = await supabase
          .from('registros')
          .update({ respuestas: updatedRespuestas })
          .eq('id', recordId);

        if (!updError) {
          await logAction(supabase, activeSector, 'Respuesta Chat', sectorInfo?.label, { recordId, text: responseText });
        }

        const isPersonal = record.codigo?.startsWith('PERS-') || record.datos?.codigo?.startsWith('PERS-');
        const isRrhhOrMkt = record.sector === 'rrhh' || record.sector === 'marketing' || isPersonal;
        
        let targetSectorId = isPersonal ? (activeSector === 'rrhh' ? record.sector : 'rrhh') : 'calidad';
        let notificationMsg = isPersonal ? `NUEVA RESPUESTA EN GESTIÓN DE PERSONAL` : `NUEVA RESPUESTA EN NO CONFORMIDAD (${record.codigo})`;

        if (isRrhhOrMkt) {
          if (!isPersonal) {
             notificationMsg = record.sector === 'rrhh' ? `NUEVA RESPUESTA EN GESTIÓN DE PERSONAL` : `NUEVA RESPUESTA EN AVISO DE MARKETING`;
          }
          const isOwnerResponding = activeSector === record.sector;
          const assignedSectorId = record.tipoPrueba; // Guardamos el ID del sector destino aquí
          
          if (isOwnerResponding) {
            const targets = Array.isArray(assignedSectorId) ? assignedSectorId : (assignedSectorId ? [assignedSectorId] : []);
            for (const tid of targets) {
              await upsertNcNotification({
                targetSector: tid,
                emitterName: SECTORS.find(s => s.id === activeSector)?.label || activeSector,
                message: notificationMsg,
                details: responseText,
                refId: recordId
              });
            }
            await logAction(supabase, activeSector, 'Respuesta a Informe', 'Personal', { recordId, text: responseText });
            setConfirmModal({ show: false, action: null, title: '' });
            return;
          } else {
            targetSectorId = record.sector;
          }
        } else {
          // Lógica original para NC
          const areaImplicadaSector = getSectorFromAreaImplicada(record.areaImplicada);
          const isQualityResponding = activeSector === record.sector;
          const isAssignedAreaResponding = activeSector === areaImplicadaSector?.id;

          if (isQualityResponding) {
            const target = areaImplicadaSector;
            targetSectorId = target ? target.id : 'all';
          } else if (isAssignedAreaResponding) {
            targetSectorId = record.sector;
          }
        }

        await upsertNcNotification({
          targetSector: targetSectorId,
          emitterName: SECTORS.find(s => s.id === activeSector)?.label || activeSector,
          message: notificationMsg,
          details: responseText,
          refId: recordId
        });

        await logAction(supabase, activeSector, 'Respuesta a Informe', 'Sistema', { recordId, text: responseText });
        setConfirmModal({ show: false, action: null, title: '' });
      }
    });
  };

  const handleNonConformitySubmit = (e) => {
    e.preventDefault();
    setConfirmModal({
      show: true,
      title: '¿Confirmar Informe de No conformidad?',
      action: async () => {
        const { data: newRecs, error: recError } = await supabase.from('registros').insert([{
          sector: activeSector,
          tipo: 'non-conformity',
          producto: 'No conformidad - ' + nonConformityData.codigo,
          responsable: nonConformityData.responsable,
          fecha: formatInputDate(nonConformityData.fecha),
          codigo: nonConformityData.codigo,
          estado: nonConformityData.estado,
          datos: { ...nonConformityData }
        }]).select();

        if (!recError && newRecs) {
          const newId = newRecs[0].id;
          const targetSector = getSectorFromAreaImplicada(nonConformityData.areaImplicada);
          
          await upsertNcNotification({
            targetSector: targetSector ? targetSector.id : 'all',
            emitterName: SECTORS.find(s => s.id === activeSector)?.label || activeSector,
            message: `NUEVA NO CONFORMIDAD (${nonConformityData.codigo})`,
            details: nonConformityData.descripcion,
            refId: newId
          });

          await logAction(supabase, activeSector, 'Nueva No Conformidad', nonConformityData.responsable, { codigo: nonConformityData.codigo, area: nonConformityData.areaImplicada });
          setNonConformityData({
            areaImplicada: '',
            codigo: '',
            fecha: getFormattedToday(),
            descripcion: '',
            causaRaiz: '',
            accionCorrectiva: '',
            responsable: '',
            estado: 'Abierto',
            respuestas: []
          });
          setActiveSubTab('history');
        }
        setConfirmModal({ show: false, action: null, title: '' });
      }
    });
  }

  const handleSubmitDespacho = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    const isComplete = despachoData.fecha && despachoData.preparadaPor && despachoData.zona && 
                      despachoData.sucursal && despachoData.condicionesIngreso && 
                      despachoData.condicionesCamara && despachoData.temperaturaCamara && 
                      despachoData.descargaCorrecta !== null;

    if (!isComplete) {
      setDespachoError(true);
      return;
    }

    setDespachoError(false);
    setConfirmModal({
      show: true,
      title: '¿Confirmar envío de control de despacho?',
      action: async () => {
        const { error } = await supabase.from('registros').insert([{
          sector: activeSector,
          tipo: 'despacho-franquicias',
          producto: `Control - ${despachoData.sucursal}`,
          responsable: despachoData.preparadaPor,
          fecha: formatInputDate(despachoData.fecha),
          datos: { ...despachoData }
        }]);

        if (!error) {
          await logAction(supabase, activeSector, 'Control Despacho', despachoData.preparadaPor, { sucursal: despachoData.sucursal, zona: despachoData.zona });
          setDespachoData(initialDespachoForm());
          setActiveSubTab('history');
        }
        setConfirmModal({ show: false, action: null, title: '' });
      }
    });
  }

  const handleSubmitTemperaturaCamaras = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    setConfirmModal({
      show: true,
      title: '¿Confirmar registro de temperaturas?',
      action: async () => {
        const { error } = await supabase.from('registros').insert([{
          sector: activeSector,
          tipo: 'temperatura-camaras',
          producto: 'Control de Cámaras',
          responsable: temperaturaCamarasData.preparadaPor,
          fecha: formatInputDate(temperaturaCamarasData.fecha),
          datos: { ...temperaturaCamarasData }
        }]);

        if (!error) {
          await logAction(supabase, activeSector, 'Registro Temperaturas Cámaras', temperaturaCamarasData.preparadaPor, { ubicacion: temperaturaCamarasData.ubicacion });
          setTemperaturaCamarasData(initialTemperaturaCamarasForm());
          setActiveSubTab('history');
        }
        setConfirmModal({ show: false, action: null, title: '' });
      }
    });
  }

  const filteredRecords = records.filter(record => {
    if (record.sector === activeSector) return true;
    
    // Check if current sector is a recipient (for Marketing/Personal)
    const isTarget = record.datos && (
      record.datos.tipoPrueba === activeSector || 
      (Array.isArray(record.datos.tipoPrueba) && record.datos.tipoPrueba.includes(activeSector))
    );
    
    return isTarget;
  });
  


  const LogsView = ({ logs, onRefresh }) => (
    <motion.div 
      className="logs-terminal"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: '#0a0a0a',
        borderRadius: '12px',
        border: '1px solid #333',
        overflow: 'hidden',
        fontFamily: 'monospace',
        height: 'calc(100vh - 350px)',
        display: 'flex',
        flexDirection: 'column',
        marginTop: '1.5rem',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
      }}
    >
      <div className="terminal-header" style={{
        background: '#1a1a1a',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #333'
      }}>
        <div className="terminal-buttons" style={{ display: 'flex', gap: '8px' }}>
          <span className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }}></span>
          <span className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }}></span>
          <span className="dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }}></span>
        </div>
        <div className="terminal-title" style={{ color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>system_activity_logs.sh</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={async () => {
              console.log("Triggering test log...");
              await logAction(supabase, 'sistemas', 'TEST_LOG_MANUAL', 'Admin', { test: true });
            }}
            style={{
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#6366f1',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            TEST LOG
          </button>
          <button 
            onClick={onRefresh}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 'bold'
            }}
          >
            <RefreshCw size={12} />
            RECARGAR
          </button>
        </div>
      </div>
      <div className="terminal-body" style={{
        padding: '1.5rem',
        overflowY: 'auto',
        flex: 1,
        color: '#d1d1d1',
        fontSize: '0.8rem',
        lineHeight: '1.6'
      }}>
        {logs.length === 0 ? (
          <div style={{ color: '#444', fontStyle: 'italic' }}>No logs detected. System is waiting for activity...</div>
        ) : (
          logs.map((log, idx) => (
            <div key={log.id || idx} className="log-line" style={{
              marginBottom: '0.5rem',
              display: 'flex',
              gap: '1rem',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              paddingBottom: '0.4rem',
              fontFamily: '"Fira Code", "Courier New", monospace'
            }}>
              <span style={{ color: '#555', whiteSpace: 'nowrap', opacity: 0.8 }}>[{log.timestamp || new Date(log.created_at).toLocaleString('es-AR')}]</span>
              <span style={{ 
                color: SECTORS.find(s => s.id === log.sector)?.color || '#6366f1',
                fontWeight: 'bold',
                minWidth: '100px',
                textTransform: 'uppercase'
              }}>{log.sector}</span>
              <span style={{ flex: 1, color: '#eee' }}>{log.action}</span>
              <span style={{ color: '#facc15', fontWeight: 'bold' }}>@{log.user_name || 'Sistema'}</span>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );

  const handleRevisionChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only numbers
    setFormData({...formData, revision: value});
  }

  const formatInformeCode = (rawValue = '') => {
    const normalized = rawValue.toUpperCase().replace(/\s/g, '');
    const digits = normalized.replace(/^INF-?/, '').replace(/\D/g, '');
    return digits ? `INF-${digits}` : 'INF-';
  };

  const handleCodigoChange = (e) => {
    const formattedCode = formatInformeCode(e.target.value);
    setFormData({...formData, codigo: formattedCode});
  }

  const formatNonConformityCode = (rawValue = '') => {
    const normalized = rawValue.toUpperCase().replace(/\s/g, '');
    const digits = normalized.replace(/^NC-?/, '').replace(/\D/g, '');
    return digits ? `NC-${digits}` : 'NC-';
  };

  const handleNonConformityCodeChange = (e) => {
    const formattedCode = formatNonConformityCode(e.target.value);
    setNonConformityData({ ...nonConformityData, codigo: formattedCode });
  };

  const handleCategoryToggle = (cat) => {
    const current = [...formData.categoria];
    const index = current.indexOf(cat);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(cat);
    }
    setFormData({...formData, categoria: current});
  }


  const handleTextAreaChange = (e, field, setter = setFormData, currentData = formData) => {
    const element = e.target;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
    setter({...currentData, [field]: element.value});
  }

  return (
    <>
      <Routes>
      <Route path="/" element={
        <div className="landing-page-enterprise">
          <div className="enterprise-bg-glow"></div>
          
          {!isUnlocked ? (
            <motion.div 
              className="pin-entry-container"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="pin-header">
                <h2>Seguridad de Planta</h2>
                <p>Ingrese clave de acceso para el menú principal</p>
              </div>

              <div className="pin-input-wrapper">
                <div className="pin-display">
                  {[0, 1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className={`pin-digit ${pin.length === i ? 'active' : ''} ${pin.length > i ? 'filled' : ''}`}
                    >
                      {pin.length > i && <div className="pin-dot" />}
                    </div>
                  ))}
                </div>
                <input 
                  type="password"
                  autoFocus
                  className="hidden-pin-input"
                  value={pin}
                  onChange={handlePinChange}
                  maxLength={4}
                  autoComplete="off"
                />
              </div>

              <div className="pin-status">
                {pin.length === 4 && pin !== ADMIN_PIN && "CLAVE INCORRECTA"}
              </div>
            </motion.div>
          ) : (
            <div className="enterprise-content">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="enterprise-sidebar"
              >
                <div className="sidebar-brand">
                    <img src={`${import.meta.env.BASE_URL}Logo_Mi_Gusto_2025.png`} alt="Mi Gusto" className="brand-logo" />
                  <div className="brand-divider"></div>
                  <div className="brand-text">
                    <h3>Módulos de información</h3>
                  </div>
                </div>
                
                <div className="sidebar-info">
                  <h1>Centro de Operaciones</h1>
                  <p>Seleccione la unidad de negocio para iniciar la carga de informes de cumplimiento y operativa diaria.</p>
                  
                  <div className="sidebar-actions" style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button 
                      className={`view-toggle-btn ${!showTools ? 'active' : ''}`}
                      onClick={() => setShowTools(false)}
                      style={{
                        background: !showTools ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: '1px solid',
                        borderColor: !showTools ? '#fff' : 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        padding: '0.8rem 1.2rem',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <LayoutGrid size={18} />
                      Sectores de Planta
                    </button>
                    
                    <button 
                      className={`view-toggle-btn ${showTools ? 'active' : ''}`}
                      onClick={() => setShowTools(true)}
                      style={{
                        background: showTools ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: '1px solid',
                        borderColor: showTools ? '#fff' : 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        padding: '0.8rem 1.2rem',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Wrench size={18} />
                      Herramientas
                    </button>

                    <button 
                      className="view-toggle-btn"
                      onClick={() => { setActiveSubTab('logs'); navigate('/sistemas'); }}
                      style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        color: '#6366f1',
                        padding: '0.8rem 1.2rem',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        transition: 'all 0.3s ease',
                        marginTop: '0.5rem'
                      }}
                    >
                      <ClipboardList size={18} />
                      LOGS DE SISTEMA
                    </button>
                  </div>
                </div>

                <div className="sidebar-footer">
                  <div className="status-indicator">
                    <div className="pulse"></div>
                    <span>SISTEMAS ACTIVOS</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <p style={{ margin: 0, opacity: 0.5, fontSize: '0.7rem' }}>© 2026 MI GUSTO | DEPARTAMENTO DE SISTEMAS</p>
                  </div>
                </div>
              </motion.div>

              <div className="enterprise-grid-container">
                <div className={`sector-bento-grid ${showTools ? 'tools-grid' : ''}`}>
                  {(showTools ? TOOLS : SECTORS).map((item, index) => (
                    <motion.button
                      key={item.id}
                      className={`sector-tile ${item.isLocked ? 'locked' : ''} ${showTools ? 'tool-tile' : ''}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.04 }}
                      whileHover={!item.isLocked ? { 
                        y: -8,
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        transition: { duration: 0.2 } 
                      } : {}}
                      whileTap={!item.isLocked ? { scale: 0.98 } : {}}
                      onClick={() => {
                        if (item.isLocked) return;
                        if (item.url) {
                          window.open(item.url, '_blank');
                          return;
                        }
                        // For 'calidad' sector, the default tab is now 'despacho-franquicias'
                        setActiveSubTab(item.id === 'calidad' ? 'despacho-franquicias' : 'form');
                        navigate(`/${item.id}`, { state: { fromDashboard: true } });
                      }}
                      style={{ '--sector-color': item.color }}
                    >
                      {item.isLocked && (
                        <div className="locked-overlay">
                          <Lock size={32} />
                          <span>PRÓXIMAMENTE</span>
                        </div>
                      )}
                      <div className="tile-glow"></div>
                      <div className="tile-icon-box">
                        <item.icon size={26} />
                      </div>
                      <div className="tile-body">
                        <span className="tile-label">{item.label}</span>
                        <div className="tile-action">
                          <span>{item.description}</span>
                          {!item.isLocked && (item.url ? <ExternalLink size={14} /> : <ChevronRight size={14} />)}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      } />

      <Route path="/:sectorId" element={
        <>
          <div className="logo-container">
            <img src={`${import.meta.env.BASE_URL}Logo_Mi_Gusto_2025.png`} alt="Mi Gusto Logo" className="app-logo" />
          </div>

          <div className="app-container">
            <div style={{ padding: '0 0 4rem 0', minHeight: '100%' }}>
              <header className="header">
                <div className="header-top">
                  <div style={{ width: '120px' }}>
                    {location.state?.fromDashboard && (
                      <button 
                        onClick={() => navigate('/')}
                        className="back-to-menu"
                      >
                        <ArrowLeft size={20} />
                        <span>INICIO</span>
                      </button>
                    )}
                  </div> {/* Spacer / Back Button */}
                  <div className="title-group-piola">
                    <div className="sector-badge" style={{ backgroundColor: SECTORS.find(s => s.id === activeSector)?.color }}>
                      {(() => {
                        const Icon = SECTORS.find(s => s.id === activeSector)?.icon;
                        return Icon ? <Icon size={20} color="#000" /> : null;
                      })()}
                    </div>
                    <div className="titles">
                      <h1 style={{ '--accent': SECTORS.find(s => s.id === activeSector)?.color }}>
                        {SECTORS.find(s => s.id === activeSector)?.label}
                      </h1>
                      <div className="subtitle">GESTIÓN DE INFORMACIÓN OPERATIVA</div>
                    </div>
                  </div>
                  <div style={{ width: '120px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div 
                      style={{ cursor: 'pointer', position: 'relative', transition: 'all 0.3s', zIndex: showNotifications ? 10000 : 1 }}
                      onClick={() => setShowNotifications(!showNotifications)}
                    >
                      <AnimatePresence>
                        {showNotifications && (
                          <>
                            <motion.div 
                              className="notif-overlay"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onClick={(e) => { e.stopPropagation(); setShowNotifications(false); markAllAsSeen(); }}
                              style={{ position: 'fixed', zIndex: 9998 }}
                            />
                            <motion.div 
                              className="notif-panel dropdown"
                              initial={{ opacity: 0, scale: 0.9, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 10 }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                              onClick={(e) => e.stopPropagation()}
                              style={{ zIndex: 9999 }}
                            >
                              <div className="dropdown-arrow" />
                              <div className="notif-panel-header">
                                <div className="title-row">
                                  <AlertTriangle size={20} color="#facc15" />
                                  <h3>Alertas de Planta</h3>
                                </div>
                              </div>

                              <div className="notif-list">
                                  {filteredNotifications.length > 0 ? (
                                    filteredNotifications.map(notif => {
                                      const refId = notif.refId ?? notif.ref_id;
                                      const record = records.find(r => r.id === refId);
                                      const isAnswered = record && record.respuestas && record.respuestas.length > 0;
                                      const isNC = notif.message?.toLowerCase().includes('conformidad');
                                      const isUnread = notif.seen === false;

                                      return (
                                        <div 
                                          key={notif.id} 
                                          className={`notif-item ${isUnread ? 'unread' : ''}`}
                                          onClick={() => {
                                            if (refId) {
                                              if (record) {
                                                setSelectedRecord(record);
                                                setShowNotifications(false);
                                                markNotificationAsSeen(notif.id);
                                                setActiveSubTab('history');
                                              }
                                            }
                                          }}
                                        >
                                          <div className="notif-title">
                                            <span 
                                              className="notif-tag" 
                                              style={{ 
                                                color: SECTORS.find(s => s.label === notif.emitterName)?.color || '#facc15',
                                                backgroundColor: `${SECTORS.find(s => s.label === notif.emitterName)?.color || '#facc15'}26`
                                              }}
                                            >
                                              {notif.emitterName}
                                            </span>
                                            <span className="notif-time">{notif.timestamp?.split(' ')[1]}</span>
                                          </div>
                                          <p className="notif-msg">{notif.message}</p>
                                          <p className="notif-detail">{notif.details?.substring(0, 80)}{notif.details?.length > 80 ? '...' : ''}</p>
                                          
                                          <div className="notif-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.75rem' }}>
                                            {isUnread ? (
                                              <span className="notif-status-tag unread">No leído</span>
                                            ) : (
                                              <>
                                                <span className="notif-status-tag read">Leído</span>
                                                {isNC && (
                                                  isAnswered ? 
                                                    <span className="notif-status-tag answered">Respondido</span> : 
                                                    <span className="notif-status-tag unanswered">No respondido</span>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })
                                  ) : (
                                  <div className="notif-empty">
                                    <ShieldCheck size={40} opacity={0.3} />
                                    <p>Sin alertas nuevas</p>
                                  </div>
                                )}
                              </div>


                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>

                  <div style={{ position: 'relative', zIndex: 10005 }}>
                    <AlertTriangle 
                      size={28} 
                      color={
                        notifStatus === 'unread' ? '#facc15' : 
                        notifStatus === 'unanswered' ? '#ef4444' : 
                        '#525252'
                      } 
                      className={notifStatus === 'unread' ? 'pulse-yellow' : (notifStatus === 'unanswered' ? 'pulse-red' : '')}
                      style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}
                    />
                    {hasUnreadNotifications && (
                      <div className="notif-badge-mini" style={{ zIndex: 10010 }} />
                    )}
                </div>
              </div>
            </div>
          </div>

                {activeSubTab !== 'logs' && (activeSector === 'calidad' || activeSector === 'desarrollo') && (
                  <div className="special-history-nav header-action">
                    <button 
                      onClick={() => { setActiveSubTab('history'); setSelectedRecord(null); }}
                      className={`history-top-btn ${activeSubTab === 'history' ? 'active' : ''}`}
                    >
                      <History size={16} />
                      Ver Historial
                    </button>
                  </div>
                )}

                <div style={{ height: '0.5rem' }} /> {/* Espaciador */}
              </header>

        {/* Sub-Navigation for Registro/Historial */}
        {activeSubTab !== 'logs' && (
        <div className="sub-header-nav-container">
          <div className={`sub-header-nav ${activeSector === 'calidad' ? 'wrap' : ''}`}>
            {activeSector === 'calidad' ? (
              <>
                {(() => {
                  const sector = SECTORS.find(s => s.id === activeSector);
                  const sColor = sector?.color || '#fff';
                  const sRgb = hexToRgb(sColor);
                  const btnStyle = { '--accent': sColor, '--accent-rgb': sRgb };

                  return (
                    <>
                      <button 
                        onClick={() => { setActiveSubTab('temperatura-camaras'); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'temperatura-camaras' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <Thermometer size={24} />
                        <span className="sub-tab-label">CONTROL TEMPERATURA</span>
                        {activeSubTab === 'temperatura-camaras' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                      <button 
                        onClick={() => { setActiveSubTab('non-conformity'); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'non-conformity' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <AlertTriangle size={24} />
                        <span className="sub-tab-label">NO CONFORMIDAD</span>
                        {activeSubTab === 'non-conformity' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                      <button 
                        onClick={() => { setActiveSubTab('personal'); setFormData(prev => ({...prev, tipoPrueba: 'rrhh'})); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'personal' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <Users size={24} />
                        <span className="sub-tab-label">GESTIÓN PERSONAL</span>
                        {activeSubTab === 'personal' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                      <button 
                        onClick={() => { setActiveSubTab('materials'); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'materials' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <Package size={24} />
                        <span className="sub-tab-label">INGRESO MATERIA</span>
                        {activeSubTab === 'materials' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                    </>
                  );
                })()}
              </>
            ) : activeSector === 'rrhh' ? (
              <>
                {(() => {
                  const sector = SECTORS.find(s => s.id === activeSector);
                  const sColor = sector?.color || '#fff';
                  const sRgb = hexToRgb(sColor);
                  const btnStyle = { '--accent': sColor, '--accent-rgb': sRgb };

                  return (
                    <>
                      <button 
                        onClick={() => { setActiveSubTab('personal'); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'personal' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <Users size={24} />
                        <span className="sub-tab-label">PERSONAL</span>
                        {activeSubTab === 'personal' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                      <button 
                        onClick={() => { setActiveSubTab('history'); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'history' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <History size={24} />
                        <span className="sub-tab-label">VER HISTORIAL</span>
                        {activeSubTab === 'history' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                    </>
                  );
                })()}
              </>
            ) : activeSector === 'marketing' ? (
              <>
                {(() => {
                  const sector = SECTORS.find(s => s.id === activeSector);
                  const sColor = sector?.color || '#fff';
                  const sRgb = hexToRgb(sColor);
                  const btnStyle = { '--accent': sColor, '--accent-rgb': sRgb };

                  return (
                    <>
                      <button 
                        onClick={() => { setActiveSubTab('form'); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'form' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <Megaphone size={24} />
                        <span className="sub-tab-label">AVISOS</span>
                        {activeSubTab === 'form' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                      <button 
                        onClick={() => { setActiveSubTab('history'); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'history' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <History size={24} />
                        <span className="sub-tab-label">VER HISTORIAL</span>
                        {activeSubTab === 'history' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                      <button 
                        onClick={() => { setActiveSubTab('personal'); setFormData(prev => ({...prev, tipoPrueba: 'rrhh'})); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'personal' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <Users size={24} />
                        <span className="sub-tab-label">PERSONAL</span>
                        {activeSubTab === 'personal' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                    </>
                  );
                })()}
              </>
            ) : activeSector === 'logistica' ? (
              <>
                {(() => {
                  const sector = SECTORS.find(s => s.id === activeSector);
                  const sColor = sector?.color || '#fff';
                  const sRgb = hexToRgb(sColor);
                  const btnStyle = { '--accent': sColor, '--accent-rgb': sRgb };

                  return (
                    <>
                      <button 
                        onClick={() => { setActiveSubTab('despacho-franquicias'); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'despacho-franquicias' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <Truck size={24} />
                        <span className="sub-tab-label">CONTROL DESPACHO</span>
                        {activeSubTab === 'despacho-franquicias' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                      <button 
                        onClick={() => { setActiveSubTab('history'); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'history' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <History size={24} />
                        <span className="sub-tab-label">VER HISTORIAL</span>
                        {activeSubTab === 'history' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                    </>
                  );
                })()}
              </>
            ) : activeSector === 'produccion' ? (
              <>
                {(() => {
                  const sector = SECTORS.find(s => s.id === activeSector);
                  const sColor = sector?.color || '#fff';
                  const sRgb = hexToRgb(sColor);
                  const btnStyle = { '--accent': sColor, '--accent-rgb': sRgb };

                  return (
                    <>
                      <button 
                        onClick={() => { window.open('https://wonderful-bienenstitch-9040ba.netlify.app/', '_blank'); }}
                        className="sub-tab-btn"
                        style={{ ...btnStyle, backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' }}
                      >
                        <ClipboardList size={24} />
                        <span className="sub-tab-label">REPORTE OPERACIONAL</span>
                      </button>
                      <button 
                        onClick={() => { window.open('https://migusto.com.ar/fabrica/MES/', '_blank'); }}
                        className="sub-tab-btn mes-special-btn"
                        style={{ ...btnStyle, backgroundColor: '#ef4444', color: '#fff', fontWeight: '900' }}
                      >
                        <HardHat size={24} />
                        <span className="sub-tab-label">SISTEMA MES</span>
                      </button>
                      <button 
                        onClick={() => { setActiveSubTab('history'); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'history' ? 'active' : ''}`}
                        style={{ ...btnStyle, '--accent': 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' }}
                      >
                        <History size={24} />
                        <span className="sub-tab-label">VER HISTORIAL</span>
                        {activeSubTab === 'history' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" style={{ background: 'rgba(255,255,255,0.1)' }} />}
                      </button>
                    </>
                  );
                })()}
              </>
            ) : activeSector === 'mantenimiento' ? (
              <>
                {(() => {
                  const sector = SECTORS.find(s => s.id === activeSector);
                  const sColor = sector?.color || '#fff';
                  const sRgb = hexToRgb(sColor);
                  const btnStyle = { '--accent': sColor, '--accent-rgb': sRgb };

                  return (
                    <>
                      <button 
                        onClick={() => { setActiveSubTab('correctivo'); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'correctivo' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <Wrench size={24} />
                        <span className="sub-tab-label">MANT. CORRECTIVO</span>
                        {activeSubTab === 'correctivo' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                      <button 
                        onClick={() => { setActiveSubTab('preventivo'); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'preventivo' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <ShieldCheck size={24} />
                        <span className="sub-tab-label">MANT. PREVENTIVO</span>
                        {activeSubTab === 'preventivo' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                      <button 
                        onClick={() => { setActiveSubTab('repuestos'); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'repuestos' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <Settings size={24} />
                        <span className="sub-tab-label">STOCK REPUESTOS</span>
                        {activeSubTab === 'repuestos' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                      <button 
                        onClick={() => { setActiveSubTab('maquinas'); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'maquinas' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <Monitor size={24} />
                        <span className="sub-tab-label">HISTORIAL MÁQUINAS</span>
                        {activeSubTab === 'maquinas' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                      <button 
                        onClick={() => { setActiveSubTab('history'); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'history' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <History size={24} />
                        <span className="sub-tab-label">VER HISTORIAL</span>
                        {activeSubTab === 'history' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                    </>
                  );
                })()}
              </>
            ) : (
              <>
                {(() => {
                  const sector = SECTORS.find(s => s.id === activeSector);
                  const sColor = sector?.color || '#fff';
                  const sRgb = hexToRgb(sColor);
                  const btnStyle = { '--accent': sColor, '--accent-rgb': sRgb };

                  return (
                    <>
                      <button 
                        onClick={() => { setActiveSubTab('form'); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'form' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <ClipboardList size={24} />
                        <span className="sub-tab-label">INFORME PRUEBAS</span>
                        {activeSubTab === 'form' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                      
                      {(activeSector !== 'calidad' && activeSector !== 'desarrollo') && (
                        <button 
                          onClick={() => { setActiveSubTab('history'); setSelectedRecord(null); }}
                          className={`sub-tab-btn ${activeSubTab === 'history' ? 'active' : ''}`}
                          style={btnStyle}
                        >
                          <History size={24} />
                          <span className="sub-tab-label">VER HISTORIAL</span>
                          {activeSubTab === 'history' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                        </button>
                      )}

                      <button 
                        onClick={() => { setActiveSubTab('materials'); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'materials' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <Package size={24} />
                        <span className="sub-tab-label">INGRESO MATERIA</span>
                        {activeSubTab === 'materials' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                      <button 
                        onClick={() => { setActiveSubTab('personal'); setFormData(prev => ({...prev, tipoPrueba: 'rrhh'})); setSelectedRecord(null); }}
                        className={`sub-tab-btn ${activeSubTab === 'personal' ? 'active' : ''}`}
                        style={btnStyle}
                      >
                        <Users size={24} />
                        <span className="sub-tab-label">PERSONAL</span>
                        {activeSubTab === 'personal' && <motion.div layoutId="active-pill" className="sub-tab-active-bg" />}
                      </button>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>
        )}

        {/* Main Content Area */}
        <main className="content">
          <AnimatePresence mode="wait">

            {(activeSubTab === 'form' || activeSubTab === 'personal') ? (
              <motion.div
                key={`${activeSector}-form`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="section-title-container">
                  <h2 className="section-title">
                    {activeSubTab === 'personal' ? 'Gestión de Personal' : 
                     activeSector === 'marketing' ? 'Avisos de Marketing' :
                     `Informe de Pruebas: ${SECTORS.find(s => s.id === activeSector)?.label || 'Sector'}`}
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="record-form">
                  {activeSubTab === 'personal' ? (
                    <>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Colaborador</label>
                        <input 
                          type="text" 
                          className="form-control"
                          placeholder="Ingrese nombre y apellido"
                          value={formData.producto}
                          onChange={(e) => setFormData({...formData, producto: e.target.value, codigo: 'PERS-' + Date.now().toString().slice(-6)})}
                          required
                        />
                      </div>
                      
                      {activeSector === 'rrhh' ? (
                        <div className="form-group">
                          <label>Sector Notificado</label>
                          <select 
                            className="form-control"
                            value={formData.tipoPrueba}
                            onChange={(e) => setFormData({...formData, tipoPrueba: e.target.value})}
                            required
                          >
                            <option value="">Seleccione sector...</option>
                            {SECTORS.filter(s => s.id !== 'marketing' && s.id !== 'rrhh').map(s => (
                              <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="form-group">
                          <label>Sector Destino</label>
                          <div className="view-value" style={{ 
                            background: '#fff', 
                            border: 'none', 
                            padding: '0.8rem 1.2rem', 
                            borderRadius: '8px', 
                            color: '#000', 
                            fontWeight: '900',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: 'auto',
                            width: 'fit-content',
                            marginTop: '0.2rem',
                            letterSpacing: '0.05em'
                          }}>
                             RR.HH
                          </div>
                        </div>
                      )}
                    </div>

                      <div className="form-group">
                        <label>Motivo</label>
                        <textarea 
                          className="form-control auto-expand"
                          placeholder="Ingresar motivo"
                          value={formData.justificacion}
                          onChange={(e) => handleTextAreaChange(e, 'justificacion')}
                          rows={3}
                          required
                        />
                      </div>
                    </>
                  ) : activeSector === 'marketing' ? (
                    <>
                      <div className="form-group">
                        <label>Título</label>
                        <input 
                          type="text" 
                          className="form-control"
                          placeholder="Ingresar titulo"
                          value={formData.producto}
                          onChange={(e) => setFormData({...formData, producto: e.target.value, codigo: 'MK-' + Date.now().toString().slice(-6)})}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Sectores Notificados</label>
                        <div className="checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {SECTORS.filter(s => s.id !== 'marketing' && s.id !== 'rrhh').map(s => {
                            const isSelected = Array.isArray(formData.tipoPrueba) ? formData.tipoPrueba.includes(s.id) : formData.tipoPrueba === s.id;
                            return (
                              <button
                                type="button"
                                key={s.id}
                                className={`chip-btn ${isSelected ? 'active' : ''}`}
                                onClick={() => {
                                  let current = Array.isArray(formData.tipoPrueba) ? [...formData.tipoPrueba] : (formData.tipoPrueba ? [formData.tipoPrueba] : []);
                                  const index = current.indexOf(s.id);
                                  if (index > -1) {
                                    current.splice(index, 1);
                                  } else {
                                    current.push(s.id);
                                  }
                                  setFormData({...formData, tipoPrueba: current});
                                }}
                              >
                                {s.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Descripción</label>
                        <textarea 
                          className="form-control auto-expand"
                          placeholder="Ingresar descripción"
                          value={formData.justificacion}
                          onChange={(e) => handleTextAreaChange(e, 'justificacion')}
                          rows={3}
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Código Informe</label>
                          <input 
                            type="text" 
                            className="form-control"
                            placeholder="INF-00..."
                            value={formData.codigo}
                            onChange={handleCodigoChange}
                            onFocus={() => {
                              if (!formData.codigo) {
                                setFormData({ ...formData, codigo: 'INF-' });
                              }
                            }}
                            onBlur={() => {
                              if (formData.codigo === 'INF-') {
                                setFormData({ ...formData, codigo: '' });
                              }
                            }}
                            maxLength={13}
                            pattern="^INF-\d+$"
                            title="Formato requerido: INF- seguido de números (ej: INF-001)"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Revisión</label>
                          <input 
                            type="text" 
                            className="form-control"
                            placeholder="0"
                            value={formData.revision}
                            onChange={handleRevisionChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-grid">
                        <div className="form-group">
                          <label>Producto</label>
                          <input 
                            type="text" 
                            className="form-control"
                            placeholder="Nombre del producto"
                            value={formData.producto}
                            onChange={(e) => setFormData({...formData, producto: e.target.value})}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Fecha</label>
                          <input 
                            type="text" 
                            className="form-control"
                            placeholder="DD/MM/YYYY"
                            maxLength={10}
                            value={formData.fecha}
                            onChange={(e) => setFormData({...formData, fecha: handleDateMask(e.target.value, formData.fecha)})}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-grid">
                        <div className="form-group">
                          <label>Tipo de Prueba</label>
                          <input 
                            type="text" 
                            className="form-control"
                            placeholder="Ej: Cambio/Mejora de proceso"
                            value={formData.tipoPrueba}
                            onChange={(e) => setFormData({...formData, tipoPrueba: e.target.value})}
                          />
                        </div>

                        <div className="form-group">
                          <label>Categoría</label>
                          <div className="checkbox-group">
                            {['MP', 'SE', 'PT', 'ME'].map(cat => (
                              <button
                                type="button"
                                key={cat}
                                className={`chip-btn ${formData.categoria.includes(cat) ? 'active' : ''}`}
                                onClick={() => handleCategoryToggle(cat)}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Justificación</label>
                        <textarea 
                          className="form-control auto-expand"
                          placeholder="Motivo de la prueba..."
                          value={formData.justificacion}
                          onChange={(e) => handleTextAreaChange(e, 'justificacion')}
                          rows={2}
                        />
                      </div>

                      <div className="form-group">
                        <label>Descripción de la prueba</label>
                        <textarea 
                          className="form-control auto-expand"
                          placeholder="Procedimiento realizado..."
                          value={formData.descripcionPrueba}
                          onChange={(e) => handleTextAreaChange(e, 'descripcionPrueba')}
                          rows={2}
                        />
                      </div>

                      <div className="form-group">
                        <label>Resultados obtenidos</label>
                        <textarea 
                          className="form-control auto-expand"
                          placeholder="Hallazgos y datos medidos..."
                          value={formData.resultados}
                          onChange={(e) => handleTextAreaChange(e, 'resultados')}
                          rows={2}
                        />
                      </div>

                      <div className="form-group">
                        <label>Decisión Final</label>
                        <div className="decision-group">
                          {['Aprobado', 'En Proceso', 'Rechazado', 'Condicional'].map(decision => (
                            <button
                              type="button"
                              key={decision}
                              className={`decision-btn ${formData.decisionFinal === decision ? 'active' : ''}`}
                              onClick={() => setFormData({...formData, decisionFinal: decision})}
                            >
                              {decision}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Observaciones Finales</label>
                        <textarea 
                          className="form-control auto-expand"
                          placeholder="Notas adicionales..."
                          value={formData.observaciones}
                          onChange={(e) => handleTextAreaChange(e, 'observaciones')}
                          rows={2}
                        />
                      </div>

                      <div className="form-group">
                        <label>Responsable/s</label>
                        <input 
                          type="text" 
                          className="form-control"
                          placeholder="Nombres de los responsables"
                          value={formData.responsable}
                          onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                        />
                      </div>
                    </>
                  )}

                  <button type="submit" className="submit-btn highlight">
                    <Save size={18} />
                    <span>
                      {activeSubTab === 'personal' ? 'Enviar Registro' : 
                       activeSector === 'marketing' ? 'Enviar Aviso' : 
                       'Guardar Informe'}
                    </span>
                  </button>
                </form>
              </motion.div>
            ) : activeSubTab === 'materials' ? (
              <motion.div
                key={`${activeSector}-materials`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="form-section materials-view"
              >
                <div className="section-title-container">
                  <h2 className="section-title">Ingreso de Materiales: {SECTORS.find(s => s.id === activeSector)?.label || 'Sector'}</h2>
                </div>

                <form className="record-form materials-form" onSubmit={handleMaterialsSubmit}>
                  
                  {/* Identificación del Proveedor */}
                  <div className="form-section-group">
                    <h3>Identificación y Producto</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Nombre del Proveedor</label>
                        <input 
                          type="text" className="form-control" placeholder="Ej: Arrivata"
                          value={materialsData.proveedor} onChange={(e) => setMaterialsData({...materialsData, proveedor: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Grupo de Insumos</label>
                        <select 
                          className="form-control"
                          value={materialsData.grupoInsumos} onChange={(e) => setMaterialsData({...materialsData, grupoInsumos: e.target.value})}
                        >
                          <option value="">Seleccione grupo...</option>
                          <option value="Lácteos">Lácteos</option>
                          <option value="Cárnicos">Cárnicos</option>
                          <option value="Secos">Secos</option>
                          <option value="Vegetales">Vegetales</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Fecha de Recepción</label>
                        <input 
                          type="text" 
                          className="form-control"
                          placeholder="DD/MM/YYYY"
                          maxLength={10}
                          value={materialsData.fechaIngreso}
                          onChange={(e) => setMaterialsData({...materialsData, fechaIngreso: handleDateMask(e.target.value, materialsData.fechaIngreso)})}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group full">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ margin: 0 }}>Insumo / Producto</label>
                        <button 
                          type="button" 
                          onClick={() => setMaterialsData(prev => ({ ...prev, insumos: [...prev.insumos, ''] }))}
                          className="add-row-btn"
                          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', color: '#10b981' }}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      {materialsData.insumos.map((ins, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input 
                            type="text" className="form-control" placeholder="Ej: Stracciatella (estilo italiano)"
                            value={ins} onChange={(e) => {
                              const newInsumos = [...materialsData.insumos];
                              newInsumos[idx] = e.target.value;
                              setMaterialsData({...materialsData, insumos: newInsumos});
                            }}
                          />
                          {materialsData.insumos.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => setMaterialsData(prev => ({ ...prev, insumos: prev.insumos.filter((_, i) => i !== idx) }))}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trazabilidad (Lotes y Vencimientos) */}
                  <div className="form-section-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0 }}>Trazabilidad (Lotes y Vencimientos)</h3>
                      <button 
                        type="button" 
                        onClick={() => setMaterialsData(prev => ({ ...prev, lotes: [...prev.lotes, ''], vencimientos: [...prev.vencimientos, ''] }))}
                        className="add-row-btn"
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', color: '#10b981' }}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="trazabilidad-scroll">
                      <table className="trazabilidad-table">
                        <thead>
                          <tr>
                            <th>Nº</th>
                            <th>Identificación Lote</th>
                            <th>Fecha de Vencimiento</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {materialsData.lotes.map((lote, idx) => (
                            <tr key={idx}>
                              <td className="row-num">{idx + 1}</td>
                              <td>
                                <input 
                                  type="text" className="form-control compact" placeholder={`Lote ${idx + 1}`}
                                  value={lote}
                                  onChange={(e) => {
                                    const newLotes = [...materialsData.lotes];
                                    newLotes[idx] = e.target.value;
                                    setMaterialsData({...materialsData, lotes: newLotes});
                                  }}
                                />
                              </td>
                              <td>
                                <input 
                                  type="text" className="form-control compact" placeholder="DD/MM/YYYY"
                                  maxLength={10}
                                  value={materialsData.vencimientos[idx]}
                                  onChange={(e) => {
                                    const newVencs = [...materialsData.vencimientos];
                                    newVencs[idx] = handleDateMask(e.target.value, materialsData.vencimientos[idx]);
                                    setMaterialsData({...materialsData, vencimientos: newVencs});
                                  }}
                                />
                              </td>
                              <td>
                                {materialsData.lotes.length > 1 && (
                                  <button 
                                    type="button" 
                                    onClick={() => setMaterialsData(prev => ({ 
                                      ...prev, 
                                      lotes: prev.lotes.filter((_, i) => i !== idx),
                                      vencimientos: prev.vencimientos.filter((_, i) => i !== idx)
                                    }))}
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Control de Ingreso (Preguntas de Seguridad) */}
                  <div className="form-section-group">
                    <h3>Control de Ingreso y Calidad</h3>
                    
                    <div className="quality-checklist">
                      {[
                        { id: 'controlCamionLimpio', label: '¿El camión se encuentra limpio y en condiciones?' },
                        { id: 'controlRefrigerado', label: '¿El producto es refrigerado?' },
                      ].map(q => (
                        <div className="quality-item" key={q.id}>
                          <span className="question">{q.label}</span>
                          <div className="boolean-toggle">
                            <button 
                              type="button" className={`toggle-btn yes ${materialsData[q.id] === true ? 'active' : ''}`}
                              onClick={() => setMaterialsData({...materialsData, [q.id]: true})}
                            >SÍ</button>
                            <button 
                              type="button" className={`toggle-btn no ${materialsData[q.id] === false ? 'active' : ''}`}
                              onClick={() => setMaterialsData({...materialsData, [q.id]: false})}
                            >NO</button>
                          </div>
                        </div>
                      ))}

                      <div className="quality-item special">
                        <div className="form-group">
                          <label>Marque según corresponda:</label>
                          <select 
                            className="form-control sm"
                            value={materialsData.controlTipoAlimento} onChange={(e) => setMaterialsData({...materialsData, controlTipoAlimento: e.target.value})}
                          >
                            <option value="">Seleccione...</option>
                            <option value="Quesos">Quesos</option>
                            <option value="Carne">Carne</option>
                          </select>
                        </div>
                        {materialsData.controlRefrigerado === true && (
                          <div className="form-group inline">
                            <label>Temperatura observada:</label>
                            <div className="temp-input-wrapper">
                              <input 
                                type="number" step="0.1" className="form-control sm" placeholder="7.6"
                                value={materialsData.temperatura} onChange={(e) => setMaterialsData({...materialsData, temperatura: e.target.value})}
                              />
                              <span className="unit">°C</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {[
                        { id: 'controlEnvaseIntegro', label: '¿El envase del producto se encuentra íntegro, sin daños?' },
                        { id: 'controlSinOlores', label: '¿El producto no presenta color ni olores extraños? ¿Está ok?' },
                        { id: 'controlProtocoloCalidad', label: '¿El proveedor entregó protocolo de calidad o certificado sanitario?' },
                        { id: 'controlAptoIngreso', label: '¿El insumo se encuentra apto y se ingresa a planta?' },
                      ].map(q => (
                        <div className="quality-item" key={q.id}>
                          <span className="question">{q.label}</span>
                          <div className="boolean-toggle">
                            <button 
                              type="button" className={`toggle-btn yes ${materialsData[q.id] === true ? 'active' : ''}`}
                              onClick={() => setMaterialsData({...materialsData, [q.id]: true})}
                            >SÍ</button>
                            <button 
                              type="button" className={`toggle-btn no ${materialsData[q.id] === false ? 'active' : ''}`}
                              onClick={() => setMaterialsData({...materialsData, [q.id]: false})}
                            >NO</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pie de Firma */}
                  <div className="form-section-group footer-sign mt-4">
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Responsable de Recepción (Firma/Nombre)</label>
                        <input 
                          type="text" className="form-control signature-input" placeholder="Nombre completo"
                          value={materialsData.ingresadoPor} onChange={(e) => setMaterialsData({...materialsData, ingresadoPor: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Fecha y Hora del Registro</label>
                        <input 
                          type="text" 
                          className="form-control"
                          placeholder="DD/MM/YYYY HH:MM"
                          maxLength={16}
                          value={materialsData.registroTimestamp}
                          onChange={(e) => setMaterialsData({...materialsData, registroTimestamp: handleDateTimeMask(e.target.value, materialsData.registroTimestamp)})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-actions mt-4">
                    <button type="submit" className="submit-btn highlight">FINALIZAR INGRESO</button>
                  </div>
                </form>
              </motion.div>
            ) : activeSubTab === 'despacho-franquicias' && activeSector === 'calidad' ? (
              <motion.div
                key={`${activeSector}-despacho`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="section-title-container">
                  <h2 className="section-title">Control de Despacho a Franquicias</h2>
                </div>

                <form className="record-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Fecha</label>
                      <input 
                        type="text" className="form-control" placeholder="DD/MM/YYYY"
                        value={despachoData.fecha} onChange={(e) => setDespachoData({...despachoData, fecha: handleDateMask(e.target.value, despachoData.fecha)})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Preparada por</label>
                      <input 
                        type="text" className="form-control" placeholder="Nombre completo"
                        value={despachoData.preparadaPor} onChange={(e) => setDespachoData({...despachoData, preparadaPor: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Zona de recorrido</label>
                      <select 
                        className="form-control"
                        value={despachoData.zona}
                        onChange={(e) => setDespachoData({...despachoData, zona: e.target.value, sucursal: ''})}
                        required
                      >
                        <option value="">Seleccione zona...</option>
                        {Object.keys(SUCURSALES_POR_ZONA).map(z => (
                          <option key={z} value={z}>{z}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Sucursal</label>
                      <select 
                        className="form-control"
                        value={despachoData.sucursal}
                        onChange={(e) => setDespachoData({...despachoData, sucursal: e.target.value})}
                        disabled={!despachoData.zona}
                        required
                      >
                        <option value="">Seleccione sucursal...</option>
                        {despachoData.zona && SUCURSALES_POR_ZONA[despachoData.zona].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Condiciones de ingreso del local</label>
                      <div className="decision-group">
                        {['Buenas', 'Regulares', 'Malas'].map(opt => (
                          <button
                            type="button" key={opt}
                            className={`decision-btn ${despachoData.condicionesIngreso === opt ? 'active' : ''}`}
                            onClick={() => setDespachoData({...despachoData, condicionesIngreso: opt})}
                          >{opt}</button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Condiciones de camara de frio</label>
                      <div className="decision-group">
                        {['Buenas', 'Regulares', 'Malas'].map(opt => (
                          <button
                            type="button" key={opt}
                            className={`decision-btn ${despachoData.condicionesCamara === opt ? 'active' : ''}`}
                            onClick={() => setDespachoData({...despachoData, condicionesCamara: opt})}
                          >{opt}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Temperaturas de camara</label>
                    <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.5rem', fontWeight: '700' }}>Deberia estar entre -2.0 ºC y 5.0 ºC</p>
                    <div className="temp-input-wrapper" style={{ maxWidth: '200px' }}>
                      <input 
                        type="number" step="0.1" className="form-control" placeholder="Temperatura"
                        value={despachoData.temperaturaCamara} onChange={(e) => setDespachoData({...despachoData, temperaturaCamara: e.target.value})}
                        required
                      />
                      <span className="unit">ºC</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>¿La mercaderia fué correctamente descargada en el local?</label>
                    <div className="boolean-toggle">
                      <button 
                        type="button" className={`toggle-btn yes ${despachoData.descargaCorrecta === true ? 'active' : ''}`}
                        onClick={() => setDespachoData({...despachoData, descargaCorrecta: true})}
                      >SI</button>
                      <button 
                        type="button" className={`toggle-btn no ${despachoData.descargaCorrecta === false ? 'active' : ''}`}
                        onClick={() => setDespachoData({...despachoData, descargaCorrecta: false})}
                      >NO</button>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    className="submit-btn highlight"
                    onClick={handleSubmitDespacho}
                  >
                    ENVIAR CONTROL
                  </button>

                  {despachoError && (
                    <p style={{ 
                      color: '#ef4444', 
                      fontSize: '0.85rem', 
                      fontWeight: '800', 
                      textAlign: 'center', 
                      marginTop: '1.5rem',
                      letterSpacing: '0.05em',
                      animation: 'slideIn 0.3s ease-out'
                    }}>
                      FALTAN CAMPOS POR COMPLETAR
                    </p>
                  )}
                </form>
              </motion.div>
            ) : activeSubTab === 'temperatura-camaras' && activeSector === 'calidad' ? (
              <motion.div
                key={`${activeSector}-temp-camaras`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="temperatura-camaras-view"
              >
                <div className="section-title-container">
                  <h2 className="section-title">Control de Temperatura de Cámaras</h2>
                </div>

                <form className="record-form" onSubmit={handleSubmitTemperaturaCamaras}>
                  {/* Header Fields */}
                  <div className="form-section-group header-fields">
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Fecha</label>
                        <input 
                          type="text" className="form-control" placeholder="DD/MM/YYYY"
                          value={temperaturaCamarasData.fecha} 
                          onChange={(e) => setTemperaturaCamarasData({...temperaturaCamarasData, fecha: handleDateMask(e.target.value, temperaturaCamarasData.fecha)})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Preparada por</label>
                        <input 
                          type="text" className="form-control" placeholder="Nombre del responsable"
                          value={temperaturaCamarasData.preparadaPor} 
                          onChange={(e) => setTemperaturaCamarasData({...temperaturaCamarasData, preparadaPor: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Ubicación</label>
                      <input 
                        type="text" className="form-control" placeholder="Ubicación actual"
                        value={temperaturaCamarasData.ubicacion} 
                        onChange={(e) => setTemperaturaCamarasData({...temperaturaCamarasData, ubicacion: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Cameras List */}
                  <div className="cameras-grid-list">
                    {CAMARAS_CONFIG.map((cam) => {
                      const isCollapsed = collapsedCameras[cam.id];
                      const camData = temperaturaCamarasData.camaras[cam.id] || {};
                      const hasData = camData.temperaturaMP || camData.temperaturaTablero || camData.limpia;

                      return (
                        <div key={cam.id} className={`camera-card-enterprise ${isCollapsed ? 'is-collapsed' : ''}`}>
                          <div 
                            className="camera-header clickable-header" 
                            onClick={() => toggleCameraCollapse(cam.id)}
                          >
                            <div className="camera-id">C{cam.id}</div>
                            <div className="header-text-container">
                              <h3>{cam.name}</h3>
                              {isCollapsed && hasData && (
                                <div className="collapsed-summary">
                                  {camData.temperaturaMP && <span>MP: {camData.temperaturaMP}°C</span>}
                                  {camData.temperaturaTablero && <span>T: {camData.temperaturaTablero}°C</span>}
                                  {camData.limpia && <span className={`status-dot ${camData.limpia.toLowerCase()}`}></span>}
                                </div>
                              )}
                            </div>
                            <div className={`collapse-icon ${isCollapsed ? '' : 'rotated'}`}>
                              <ChevronDown size={18} />
                            </div>
                          </div>

                          <AnimatePresence>
                            {!isCollapsed && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div className="camera-body">
                                  <div className="form-grid">
                                    <div className="form-group">
                                      <div className="field-header">
                                        <label>Temperatura MP</label>
                                        <span className="range-legend">Debería estar entre {cam.mpRange}</span>
                                      </div>
                                      <div className="temp-input-wrapper">
                                        <input 
                                          type="number" step="0.1" className="form-control" placeholder="0.0"
                                          value={camData.temperaturaMP || ''}
                                          onChange={(e) => {
                                            const next = { ...temperaturaCamarasData.camaras };
                                            next[cam.id] = { ...next[cam.id], temperaturaMP: e.target.value };
                                            setTemperaturaCamarasData({ ...temperaturaCamarasData, camaras: next });
                                          }}
                                        />
                                        <span className="unit">ºC</span>
                                      </div>
                                    </div>

                                    <div className="form-group">
                                      <div className="field-header">
                                        <label>Temperatura Tablero</label>
                                        <span className="range-legend">Debería estar entre {cam.tableroRange}</span>
                                      </div>
                                      <div className="temp-input-wrapper">
                                        <input 
                                          type="number" step="0.1" className="form-control" placeholder="0.0"
                                          value={camData.temperaturaTablero || ''}
                                          onChange={(e) => {
                                            const next = { ...temperaturaCamarasData.camaras };
                                            next[cam.id] = { ...next[cam.id], temperaturaTablero: e.target.value };
                                            setTemperaturaCamarasData({ ...temperaturaCamarasData, camaras: next });
                                          }}
                                        />
                                        <span className="unit">ºC</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="form-group centered">
                                    <label>¿La cámara está limpia?</label>
                                    <div className="clean-status-toggle">
                                      {['OK', 'REG', 'DEF'].map((status) => (
                                        <button
                                          key={status}
                                          type="button"
                                          className={`status-btn ${status.toLowerCase()} ${camData.limpia === status ? 'active' : ''}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCameraStatusSelect(cam.id, status);
                                          }}
                                        >
                                          {status}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>

                  <div className="form-actions-sticky">
                    <button type="submit" className="submit-btn highlight big-action">
                      <Save size={20} />
                      <span>GUARDAR CONTROL DE CÁMARAS</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : activeSubTab === 'non-conformity' && activeSector === 'calidad' ? (
              <motion.div
                key={`${activeSector}-non-conformity`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="section-title-container">
                  <h2 className="section-title">Informe de No Conformidad: Calidad</h2>
                </div>

                <form onSubmit={handleNonConformitySubmit} className="record-form">
                  <div className="form-group">
                    <label>Área Implicada</label>
                    <select 
                      className="form-control"
                      value={nonConformityData.areaImplicada}
                      onChange={(e) => setNonConformityData({...nonConformityData, areaImplicada: e.target.value})}
                      required
                    >
                      <option value="">Seleccione área...</option>
                      {SECTORS.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nº de No conformidad</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="NC-2026"
                        value={nonConformityData.codigo}
                        onChange={handleNonConformityCodeChange}
                        onFocus={() => {
                          if (!nonConformityData.codigo) {
                            setNonConformityData({ ...nonConformityData, codigo: 'NC-' });
                          }
                        }}
                        onBlur={() => {
                          if (nonConformityData.codigo === 'NC-') {
                            setNonConformityData({ ...nonConformityData, codigo: '' });
                          }
                        }}
                        maxLength={13}
                        pattern="^NC-\d+$"
                        title="Formato requerido: NC- seguido de números (ej: NC-2026)"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Fecha del Hallazgo</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="DD/MM/YYYY"
                        maxLength={10}
                        value={nonConformityData.fecha}
                        onChange={(e) => setNonConformityData({...nonConformityData, fecha: handleDateMask(e.target.value, nonConformityData.fecha)})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Descripción del Hallazgo / Desvío</label>
                    <textarea 
                      className="form-control auto-expand"
                      placeholder="Detallar lo observado..."
                      value={nonConformityData.descripcion}
                      onChange={(e) => handleTextAreaChange(e, 'descripcion', setNonConformityData, nonConformityData)}
                      rows={3}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Causa Raíz Probable</label>
                    <textarea 
                      className="form-control auto-expand"
                      placeholder="Análisis de por qué ocurrió..."
                      value={nonConformityData.causaRaiz}
                      onChange={(e) => handleTextAreaChange(e, 'causaRaiz', setNonConformityData, nonConformityData)}
                      rows={2}
                    />
                  </div>

                  <div className="form-group">
                    <label>Acción Correctiva Inmediata</label>
                    <textarea 
                      className="form-control auto-expand"
                      placeholder="¿Qué se hizo para corregirlo?"
                      value={nonConformityData.accionCorrectiva}
                      onChange={(e) => handleTextAreaChange(e, 'accionCorrectiva', setNonConformityData, nonConformityData)}
                      rows={2}
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Estado</label>
                      <select 
                        className="form-control"
                        value={nonConformityData.estado}
                        onChange={(e) => setNonConformityData({...nonConformityData, estado: e.target.value})}
                      >
                        <option value="Abierto">Abierto</option>
                        <option value="Cerrado">Cerrado</option>
                        <option value="En Seguimiento">En Seguimiento</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Responsable</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="Nombre completo"
                        value={nonConformityData.responsable}
                        onChange={(e) => setNonConformityData({...nonConformityData, responsable: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="submit-btn highlight" style={{ background: '#fff', color: '#000', border: 'none', fontWeight: '900', gap: '0.5rem', padding: '1.2rem 4rem' }}>
                    <Save size={18} />
                    <span>EMITIR INFORME NC</span>
                  </button>
                </form>
              </motion.div>
            ) : activeSubTab === 'correctivo' ? (
              <motion.div
                key="maint-correctivo"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="maint-form-container"
              >
                <div className="section-title-container">
                  <h2 className="section-title">Reporte de Mantenimiento Correctivo</h2>
                </div>
                <form className="record-form" onSubmit={async (e) => {
                  e.preventDefault();
                  const { error } = await supabase.from('registros').insert([{
                    sector: 'mantenimiento',
                    tipo: 'correctivo',
                    datos: correctiveData,
                    created_at: new Date().toISOString()
                  }]);

                  if (!error) {
                    await logAction(supabase, 'mantenimiento', 'Nuevo Mant. Correctivo', correctiveData.responsable, { equipo: correctiveData.equipo, prioridad: correctiveData.prioridad });
                    setCorrectiveData(initialCorrectiveForm());
                    setActiveSubTab('history');
                  }
                  if (error) alert('Error al guardar');
                  else {
                    alert('Reparación guardada correctamente');
                    setCorrectiveData(initialCorrectiveForm());
                    // Refetch records if needed
                  }
                }}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Máquina / Equipo</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Ej: Amasadora Industrial #2" 
                        value={correctiveData.equipo}
                        onChange={(e) => setCorrectiveData({...correctiveData, equipo: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Prioridad</label>
                      <select 
                        className="form-control"
                        value={correctiveData.prioridad}
                        onChange={(e) => setCorrectiveData({...correctiveData, prioridad: e.target.value})}
                      >
                        <option value="alta">URGENTE (Parada de línea)</option>
                        <option value="media">MEDIA (Funciona con fallas)</option>
                        <option value="baja">BAJA (Mejora/Estética)</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Descripción de la Falla</label>
                    <textarea 
                      className="form-control" 
                      rows={3} 
                      placeholder="Detalle el problema observado..."
                      value={correctiveData.descripcion}
                      onChange={(e) => setCorrectiveData({...correctiveData, descripcion: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  <div className="form-group">
                    <label>Acciones Tomadas / Repuestos Utilizados</label>
                    <textarea 
                      className="form-control" 
                      rows={2} 
                      placeholder="¿Qué se hizo para repararlo?"
                      value={correctiveData.acciones}
                      onChange={(e) => setCorrectiveData({...correctiveData, acciones: e.target.value})}
                    ></textarea>
                  </div>
                  <div className="form-group">
                    <label>Responsable</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Nombre del técnico" 
                      value={correctiveData.responsable}
                      onChange={(e) => setCorrectiveData({...correctiveData, responsable: e.target.value})}
                      required
                    />
                  </div>
                  <button type="submit" className="submit-btn highlight">
                    <Save size={18} />
                    <span>GUARDAR REPARACIÓN</span>
                  </button>
                </form>
              </motion.div>
            ) : activeSubTab === 'preventivo' ? (
              <motion.div
                key="maint-preventivo"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="section-title-container">
                  <h2 className="section-title">Plan de Mantenimiento Preventivo</h2>
                </div>
                <div className="preventive-table-container" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <table className="trazabilidad-table">
                    <thead>
                      <tr>
                        <th>Equipo</th>
                        <th>Tarea</th>
                        <th>Frecuencia</th>
                        <th>Última Revisión</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preventiveList.map((item) => (
                        <tr key={item.id}>
                          <td>{item.equipo}</td>
                          <td>{item.tarea}</td>
                          <td>{item.frecuencia}</td>
                          <td>{item.ultimaRevision}</td>
                          <td><span className={`badge-status ${item.estado}`}>{item.estado.toUpperCase()}</span></td>
                          <td>
                            <button 
                              className="action-btn-mini"
                              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '800' }}
                              onClick={() => {
                                const nextList = [...preventiveList];
                                const index = nextList.findIndex(p => p.id === item.id);
                                nextList[index].ultimaRevision = getFormattedToday();
                                nextList[index].estado = 'ok';
                                setPreventiveList(nextList);
                              }}
                            >
                              MARCAR REALIZADO
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : activeSubTab === 'repuestos' ? (
              <motion.div
                key="maint-repuestos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="section-title-container">
                  <h2 className="section-title">Control de Stock de Repuestos</h2>
                </div>
                <div className="repuestos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {spareParts.map((item) => (
                    <div key={item.id} className="repuesto-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: '700' }}>{item.name}</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>Stock Actual</div>
                          <div style={{ fontSize: '2rem', fontWeight: '900', color: item.stock <= item.min ? '#ef4444' : '#10b981' }}>{item.stock}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>Mínimo</div>
                          <div style={{ fontSize: '1rem', fontWeight: '700' }}>{item.min}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button 
                          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}
                          onClick={() => {
                            const next = [...spareParts];
                            const idx = next.findIndex(s => s.id === item.id);
                            next[idx].stock = Math.max(0, next[idx].stock - 1);
                            setSpareParts(next);
                          }}
                        > -1 </button>
                        <button 
                          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}
                          onClick={() => {
                            const next = [...spareParts];
                            const idx = next.findIndex(s => s.id === item.id);
                            next[idx].stock += 1;
                            setSpareParts(next);
                          }}
                        > +1 </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : activeSubTab === 'maquinas' ? (
              <motion.div
                key="maint-maquinas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="section-title-container">
                  <h2 className="section-title">Estado Crítico de Maquinaria</h2>
                </div>
                <div className="maquinas-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                  {machinesStatus.map((m) => (
                    <div 
                      key={m.id} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '1rem',
                        padding: '1.5rem', 
                        background: 'rgba(255,255,255,0.03)', 
                        borderRadius: '12px', 
                        borderLeft: `5px solid ${m.color}`,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{m.name}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: '900', color: m.color, background: `${m.color}22`, padding: '0.3rem 0.6rem', borderRadius: '4px' }}>{m.status}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {[
                          { label: 'OPERATIVO', color: '#10b981' },
                          { label: 'EN REPARACIÓN', color: '#facc15' },
                          { label: 'FUERA DE SERVICIO', color: '#ef4444' }
                        ].map(status => (
                          <button
                            key={status.label}
                            style={{ 
                              flex: 1, 
                              fontSize: '0.6rem', 
                              padding: '0.5rem 0.2rem', 
                              borderRadius: '4px', 
                              border: 'none',
                              cursor: 'pointer',
                              background: m.status === status.label ? status.color : 'rgba(255,255,255,0.05)',
                              color: m.status === status.label ? '#000' : '#888',
                              fontWeight: '900'
                            }}
                            onClick={() => {
                              const next = [...machinesStatus];
                              const idx = next.findIndex(x => x.id === m.id);
                              next[idx].status = status.label;
                              next[idx].color = status.color;
                              setMachinesStatus(next);
                            }}
                          >
                            {status.label.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : activeSubTab === 'logs' ? (
              <LogsView logs={logs} onRefresh={fetchLogs} />
            ) : selectedRecord ? (
              <motion.div
                key={`detail-${selectedRecord.id}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="report-detail-container"
              >
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
                  <button onClick={() => setSelectedRecord(null)} className="back-btn">
                    ← Volver al historial
                  </button>
                </div>


                <div className="report-view">
                  {(selectedRecord.type === 'report' || selectedRecord.tipo === 'report') ? (
                    <>
                      <div className="report-view-header">
                        <div className="header-main">
                          <h2>{(selectedRecord.sector === 'rrhh' || (selectedRecord.codigo && selectedRecord.codigo.startsWith('PERS-'))) ? 'Detalle de gestión del personal' : 
                               selectedRecord.sector === 'marketing' ? 'Detalle de Aviso de Marketing' :
                               'Detalle del Informe'}</h2>
                          {(!selectedRecord.codigo?.startsWith('PERS-') && selectedRecord.sector !== 'rrhh' && selectedRecord.sector !== 'marketing') && <span className="badge">{selectedRecord.codigo || 'SIN CODIGO'}</span>}
                        </div>
                        <div className="header-meta">
                          {(!selectedRecord.codigo?.startsWith('PERS-') && selectedRecord.sector !== 'rrhh' && selectedRecord.sector !== 'marketing') && <span>Revisión: {selectedRecord.revision || '0'}</span>}
                          <span>{selectedRecord.created}</span>
                        </div>
                      </div>

                      { (selectedRecord.sector === 'rrhh' || selectedRecord.sector === 'marketing' || (selectedRecord.codigo && selectedRecord.codigo.startsWith('PERS-'))) ? (
                        <>
                          <div className="report-view-grid" style={{ gridTemplateColumns: '1.2fr 0.5fr 0.8fr', gap: '1rem', alignItems: 'start' }}>
                            <div className="view-group">
                              <label>{selectedRecord.sector === 'marketing' ? 'Título' : 'Colaborador'}</label>
                              <div className="view-value highlight">{selectedRecord.producto}</div>
                            </div>
                            <div className="view-group">
                              <label>Fecha</label>
                              <div className="view-value" style={{ fontSize: '0.8rem', opacity: 0.9 }}>{formatInputDate(selectedRecord.fecha)}</div>
                            </div>
                            <div className="view-group">
                              <label>{(selectedRecord.sector === 'rrhh') ? 'Sectores Notificados' : 'Sector Emisor'}</label>
                              <div className="view-value" style={{ 
                                background: '#fff', 
                                color: '#000', 
                                padding: '0.6rem 1.2rem', 
                                borderRadius: '8px', 
                                fontWeight: '900',
                                width: 'fit-content',
                                fontSize: '0.7rem',
                                letterSpacing: '0.05em',
                                marginTop: '0.2rem',
                                border: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                height: 'auto'
                              }}>
                                {selectedRecord.sector === 'rrhh' ? (
                                  (() => {
                                    const targets = Array.isArray(selectedRecord.tipoPrueba) ? selectedRecord.tipoPrueba : (selectedRecord.tipoPrueba ? [selectedRecord.tipoPrueba] : []);
                                    return targets.map(tid => SECTORS.find(s => s.id === tid)?.label || tid).join(', ');
                                  })() || '-'
                                ) : (
                                  SECTORS.find(s => s.id === selectedRecord.sector)?.label || selectedRecord.sector
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="view-group full" style={{ marginTop: '1.5rem' }}>
                            <label>{selectedRecord.sector === 'marketing' ? 'Descripción' : 'Motivo'}</label>
                            <div className="view-value large" style={{ minHeight: '120px', whiteSpace: 'pre-wrap' }}>
                              {selectedRecord.justificacion}
                            </div>
                          </div>

                          {/* CHAT-LIKE RESPONSE FIELD FOR RRHH/MARKETING */}
                          <div className="view-group full" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid rgba(255,255,255,0.05)' }}>
                            <label style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '950', textTransform: 'uppercase' }}>CONSULTAS / RESPUESTAS</label>
                            
                            <div 
                              className="unified-chat-field form-control" 
                              style={{ 
                                marginTop: '1rem', 
                                background: '#0a0a0a', 
                                border: '1px solid #333', 
                                borderRadius: '12px',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                minHeight: '120px'
                              }}
                            >
                              {/* Chat History */}
                              {(Array.isArray(selectedRecord.respuestas) && selectedRecord.respuestas.length > 0) && (
                                <div className="chat-history-internal" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {selectedRecord.respuestas.map((msg, idx) => (
                                    <div key={idx} style={{ lineHeight: '1.4' }}>
                                      <span style={{ color: msg.sectorColor || '#fff', fontWeight: '900', marginRight: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                                        {msg.sectorName}:
                                      </span>
                                      <span style={{ color: '#eee', fontSize: '0.85rem' }}>{msg.text}</span>
                                    </div>
                                  ))}
                                  <div style={{ height: '1px', background: '#222', margin: '0.5rem 0' }}></div>
                                </div>
                              )}

                              {/* New Input Area */}
                              {(activeSector === selectedRecord.sector || (Array.isArray(selectedRecord.tipoPrueba) ? selectedRecord.tipoPrueba.includes(activeSector) : selectedRecord.tipoPrueba === activeSector)) ? (
                                <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                                  <span style={{ color: SECTORS.find(s => s.id === activeSector)?.color || '#fff', fontWeight: '900', marginRight: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem', paddingTop: '1px' }}>
                                    {SECTORS.find(s => s.id === activeSector)?.label || 'SECTOR'}:
                                  </span>
                                  <textarea 
                                    className="auto-expand"
                                    style={{ 
                                      flex: 1, 
                                      background: 'transparent', 
                                      border: 'none', 
                                      color: '#fff',
                                      outline: 'none',
                                      resize: 'none',
                                      fontSize: '0.85rem',
                                      lineHeight: '1.4',
                                      fontFamily: 'inherit',
                                      padding: 0,
                                      margin: 0,
                                      minHeight: '40px'
                                    }}
                                    placeholder="Escribe tu duda o consulta aquí..."
                                    value={selectedRecord.tempResponse || ''}
                                    onChange={(e) => handleTextAreaChange(e, 'tempResponse', setSelectedRecord, selectedRecord)}
                                  />
                                </div>
                              ) : (
                                <div style={{ color: '#666', fontSize: '0.85rem', fontStyle: 'italic', marginTop: selectedRecord.respuestas?.length ? 0 : '1rem' }}>
                                  {selectedRecord.respuestas?.length === 0 ? "No hay consultas registradas aún." : "Las áreas involucradas responderán aquí."}
                                </div>
                              )}
                            </div>

                            {/* Submit Button */}
                            {(activeSector === selectedRecord.sector || (Array.isArray(selectedRecord.tipoPrueba) ? selectedRecord.tipoPrueba.includes(activeSector) : selectedRecord.tipoPrueba === activeSector)) && (
                              <button 
                                className="submit-btn"
                                style={{ margin: '1rem 0 0 auto', width: 'auto', padding: '0.8rem 2.5rem', fontSize: '0.85rem', background: '#fff', color: '#000', border: 'none', fontWeight: '900', borderRadius: '10px' }}
                                onClick={() => handleSaveResponse(selectedRecord.id, selectedRecord.tempResponse)}
                              >
                                ENVIAR MENSAJE
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="report-view-grid">
                            <div className="view-group">
                              <label>Producto</label>
                              <div className="view-value">{selectedRecord.producto}</div>
                            </div>
                            <div className="view-group">
                              <label>Fecha</label>
                              <div className="view-value">{formatInputDate(selectedRecord.fecha)}</div>
                            </div>
                          </div>

                          <div className="report-view-grid">
                            <div className="view-group">
                              <label>Tipo de Prueba</label>
                              <div className="view-value">{selectedRecord.tipoPrueba || '-'}</div>
                            </div>
                            <div className="view-group">
                              <label>Categoría</label>
                              <div className="view-chips">
                                {['MP', 'SE', 'PT', 'ME'].map(cat => (
                                  <span key={cat} className={`view-chip ${selectedRecord.categoria?.includes(cat) ? 'active' : ''}`}>
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="view-group full">
                            <label>Justificación</label>
                            <div className="view-value large">{selectedRecord.justificacion}</div>
                          </div>

                          <div className="view-group full">
                            <label>Descripción de la prueba</label>
                            <div className="view-value large">{selectedRecord.descripcionPrueba}</div>
                          </div>

                          <div className="view-group full">
                            <label>Resultados obtenidos</label>
                            <div className="view-value large">{selectedRecord.resultados}</div>
                          </div>

                          <div className="report-view-grid">
                            <div className="view-group">
                              <label>Decisión Final</label>
                              <div className="view-chips">
                                {['Aprobado', 'En Proceso', 'Rechazado', 'Condicional'].map(decision => (
                                  <span key={decision} className={`view-chip ${selectedRecord.decisionFinal === decision ? 'active' : ''}`}>
                                    {decision}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="view-group">
                              <label>Estado</label>
                              <span className={`badge ${selectedRecord.decisionFinal?.toLowerCase().replace(/\s+/g, '-')}`}>
                                {selectedRecord.decisionFinal}
                              </span>
                            </div>
                          </div>

                          <div className="view-group full">
                            <label>Observaciones Finales</label>
                            <div className="view-value large">{selectedRecord.observaciones || '-'}</div>
                          </div>

                          <div className="report-view-footer">
                            <div className="view-group">
                              <label>Responsable/s</label>
                              <div className="view-signature">{selectedRecord.responsable}</div>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : (selectedRecord.type === 'material' || selectedRecord.tipo === 'material') ? (
                    <>
                      <div className="report-view-header">
                        <div className="header-main">
                          <h2>Ingreso de Material</h2>
                          <div className="type-indicator-bubble">REGISTRO DE PLANTA</div>
                        </div>
                        <div className="header-meta">
                          <span>{selectedRecord.created}</span>
                        </div>
                      </div>

                      <div className="report-view-grid">
                        <div className="view-group">
                          <label>Proveedor</label>
                          <div className="view-value">{selectedRecord.proveedor}</div>
                        </div>
                        <div className="view-group">
                          <label>Fecha Ingreso</label>
                          <div className="view-value">{formatInputDate(selectedRecord.fechaIngreso)}</div>
                        </div>
                      </div>

                      <div className="report-view-grid">
                        <div className="view-group">
                          <label>Grupo de Insumo</label>
                          <div className="view-value">{selectedRecord.grupoInsumos}</div>
                        </div>
                        <div className="view-group">
                          <label>Insumo / Producto</label>
                          <div className="view-value highlight">
                            {Array.isArray(selectedRecord.insumos) ? selectedRecord.insumos.join(', ') : selectedRecord.producto}
                          </div>
                        </div>
                      </div>

                      {selectedRecord.controlRefrigerado && (
                        <div className="view-group full">
                          <label>Temperatura Observada</label>
                          <div className="view-value">{selectedRecord.temperatura} °C</div>
                        </div>
                      )}

                      <div className="view-group full">
                        <label>Trazabilidad (Lotes y Vencimientos)</label>
                        <div className="view-value-table">
                          <div className="table-header-mini">
                            <span>LOTE</span>
                            <span>VENCIMIENTO</span>
                          </div>
                          {selectedRecord.lotes.map((lote, i) => lote && (
                            <div key={i} className="table-row-mini">
                              <span>{lote}</span>
                              <span>{formatInputDate(selectedRecord.vencimientos[i]) || '-'}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="view-group full">
                        <label>Controles Realizados</label>
                        <div className="view-checklist-mini">
                          <div className={`check-item ${selectedRecord.controlCamionLimpio ? 'ok' : 'fail'}`}>
                            {selectedRecord.controlCamionLimpio ? '✓' : '✗'} Camión en condiciones
                          </div>
                          <div className={`check-item ${selectedRecord.controlEnvaseIntegro ? 'ok' : 'fail'}`}>
                            {selectedRecord.controlEnvaseIntegro ? '✓' : '✗'} Envase íntegro
                          </div>
                          <div className={`check-item ${selectedRecord.controlSinOlores ? 'ok' : 'fail'}`}>
                            {selectedRecord.controlSinOlores ? '✓' : '✗'} Sin olores extraños
                          </div>
                          <div className={`check-item ${selectedRecord.controlAptoIngreso ? 'ok' : 'fail'}`}>
                            {selectedRecord.controlAptoIngreso ? '✓' : '✗'} APTO PARA INGRESO
                          </div>
                        </div>
                      </div>

                      <div className="report-view-footer">
                        <div className="view-group">
                          <label>Responsable de Recepción</label>
                          <div className="view-signature">{selectedRecord.ingresadoPor}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="report-view-header">
                        <div className="header-main">
                          <h2 className="detail-title-nc">No Conformidad</h2>
                          <div className="type-indicator-bubble danger">HALLAZGO DE CALIDAD</div>
                        </div>
                        <div className="header-meta">
                          <span>{selectedRecord.codigo}</span>
                          <span>{selectedRecord.created}</span>
                        </div>
                      </div>

                      <div className="report-view-grid">
                        <div className="view-group">
                          <label>Área Implicada</label>
                          <div className="view-value highlight" style={{ color: '#ef4444', fontWeight: '800' }}>
                            {getSectorFromAreaImplicada(selectedRecord.areaImplicada)?.label || selectedRecord.areaImplicada || 'NO ESPECIFICADA'}
                          </div>
                        </div>
                        <div className="view-group">
                          <label>Fecha Hallazgo</label>
                          <div className="view-value">{formatInputDate(selectedRecord.fecha)}</div>
                        </div>
                      </div>

                      <div className="report-view-grid">
                        <div className="view-group">
                          <div /> {/* Spacer */}
                        </div>
                        <div className="view-group">
                          <label>Estado</label>
                          <span className={`badge ${selectedRecord.estado?.toLowerCase().replace(/\s+/g, '-')}`}>
                            {selectedRecord.estado}
                          </span>
                        </div>
                      </div>

                      <div className="view-group full">
                        <label>Descripción del Desvío</label>
                        <div className="view-value large">{selectedRecord.descripcion}</div>
                      </div>

                      <div className="view-group full">
                        <label>Causa Raíz</label>
                        <div className="view-value large">{selectedRecord.causaRaiz || '-'}</div>
                      </div>

                      <div className="view-group full">
                        <label>Acción Correctiva</label>
                        <div className="view-value large">{selectedRecord.accionCorrectiva || '-'}</div>
                      </div>

                      <div className="report-view-footer">
                        <div className="view-group">
                          <label>Responsable</label>
                          <div className="view-signature">{selectedRecord.responsable}</div>
                        </div>
                      </div>

                      {/* CHAT-LIKE RESPONSE FIELD */}
                      <div className="view-group full" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid rgba(255,255,255,0.05)' }}>
                        <label style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '950', textTransform: 'uppercase' }}>RESPUESTA</label>
                        
                        <div 
                          className="unified-chat-field form-control" 
                          style={{ 
                            marginTop: '1rem', 
                            background: '#0a0a0a', 
                            border: '1px solid #333', 
                            borderRadius: '12px',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            minHeight: '120px'
                          }}
                        >
                          {/* Chat History Inside the Box */}
                          {(Array.isArray(selectedRecord.respuestas) && selectedRecord.respuestas.length > 0) && (
                            <div className="chat-history-internal" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {selectedRecord.respuestas.map((msg, idx) => (
                                <div key={idx} style={{ lineHeight: '1.4' }}>
                                  <span style={{ color: msg.sectorColor || '#fff', fontWeight: '900', marginRight: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                                    {msg.sectorName}:
                                  </span>
                                  <span style={{ color: '#eee', fontSize: '0.85rem' }}>{msg.text}</span>
                                </div>
                              ))}
                              {/* Separator line before new input */}
                              <div style={{ height: '1px', background: '#222', margin: '0.5rem 0' }}></div>
                            </div>
                          )}

                          {/* New Input Area */}
                          {(activeSector === selectedRecord.sector || activeSector === getSectorFromAreaImplicada(selectedRecord.areaImplicada)?.id) ? (
                            <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                              <span style={{ color: SECTORS.find(s => s.id === activeSector)?.color || '#fff', fontWeight: '900', marginRight: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem', paddingTop: '1px' }}>
                                {SECTORS.find(s => s.id === activeSector)?.label || 'SECTOR'}:
                              </span>
                              <textarea 
                                className="auto-expand"
                                style={{ 
                                  flex: 1, 
                                  background: 'transparent', 
                                  border: 'none', 
                                  color: '#fff',
                                  outline: 'none',
                                  resize: 'none',
                                  fontSize: '0.85rem',
                                  lineHeight: '1.4',
                                  fontFamily: 'inherit',
                                  padding: 0,
                                  margin: 0,
                                  minHeight: '40px'
                                }}
                                placeholder="Escribe tu respuesta aquí..."
                                value={selectedRecord.tempResponse || ''}
                                onChange={(e) => handleTextAreaChange(e, 'tempResponse', setSelectedRecord, selectedRecord)}
                              />
                            </div>
                          ) : (
                            <div style={{ color: '#666', fontSize: '0.85rem', fontStyle: 'italic', marginTop: selectedRecord.respuestas?.length ? 0 : '1rem' }}>
                              {selectedRecord.respuestas?.length === 0 ? "No hay respuestas registradas aún." : "El área implicada responderá aquí."}
                            </div>
                          )}
                        </div>

                        {/* Submit Button */}
                        {(activeSector === selectedRecord.sector || activeSector === getSectorFromAreaImplicada(selectedRecord.areaImplicada)?.id) && (
                          <button 
                            className="submit-btn"
                            style={{ margin: '1rem 0 0 auto', width: 'auto', padding: '0.8rem 2.5rem', fontSize: '0.85rem', background: '#fff', color: '#000', border: 'none', fontWeight: '900', borderRadius: '10px' }}
                            onClick={() => handleSaveResponse(selectedRecord.id, selectedRecord.tempResponse)}
                          >
                            ENVIAR RESPUESTA
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

              </motion.div>
            ) : (
              <motion.div
                key={`${activeSector}-history`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="section-title history" style={{ marginBottom: '1.5rem' }}>
                  Historial: {SECTORS.find(s => s.id === activeSector)?.label || 'Sector'}
                </h2>
                {filteredRecords.length > 0 ? (
                  <div className="history-list">
                    {filteredRecords.map(record => (
                      <motion.div 
                        key={record.id} 
                        className="history-item clickable" 
                        layout
                        onClick={() => setSelectedRecord(record)}
                      >
                        <div className="item-info">
                          <div className="item-type-label">
                            {(record.codigo && record.codigo.startsWith('PERS-')) ? '👤 REGISTRO DE PERSONAL' :
                             record.sector === 'rrhh' ? '👤 REGISTRO DE PERSONAL' :
                             record.sector === 'marketing' ? '📢 AVISO DE MARKETING' :
                             (record.type === 'report' || record.tipo === 'report') ? '💻 PRUEBA DE DESARROLLO' : 
                             (record.type === 'material' || record.tipo === 'material') ? '📦 INGRESO DE MATERIAL' : 
                             (record.type === 'despacho-franquicias' || record.tipo === 'despacho-franquicias') ? '🚚 DESPACHO A FRANQUICIAS' :
                             '⚠️ NO CONFORMIDAD'}
                          </div>
                          <h3 className={(record.type === 'non-conformity' || record.tipo === 'non-conformity') ? 'history-title-nc' : ''}>
                            {record.producto}
                          </h3>
                          <div className="item-meta">
                            <p><Clock size={12} /> {formatInputDate(record.fecha || record.fechaIngreso)}</p>
                            <p>
                              <User size={12} /> {record.responsable || record.ingresadoPor}
                              {activeSector === 'rrhh' && (
                                <span 
                                  className="notif-tag" 
                                  style={{ 
                                    marginLeft: '0.8rem',
                                    display: 'inline-flex',
                                    verticalAlign: 'middle',
                                    color: SECTORS.find(s => s.id === record.sector)?.color || '#facc15',
                                    backgroundColor: `${SECTORS.find(s => s.id === record.sector)?.color || '#facc15'}26`
                                  }}
                                >
                                  {SECTORS.find(s => s.id === record.sector)?.label || record.sector}
                                </span>
                              )}
                            </p>
                            {(record.type === 'report' || record.tipo === 'report') ? (
                              <span className={`badge ${record.decisionFinal?.toLowerCase().replace(/\s+/g, '-')}`}>
                                {record.decisionFinal}
                              </span>
                            ) : (record.type === 'non-conformity' || record.tipo === 'non-conformity') ? (
                              <span className={`badge ${record.estado?.toLowerCase().replace(/\s+/g, '-') || 'abierto'}`}>
                                {record.estado || 'ABIERTO'}
                              </span>
                            ) : (record.type === 'despacho-franquicias' || record.tipo === 'despacho-franquicias') ? (
                              <span className={`badge ${record.datos?.descargaCorrecta ? 'aprobado' : 'rechazado'}`}>
                                {record.datos?.descargaCorrecta ? 'ENTREGA OK' : 'CON DESVÍO'}
                              </span>
                            ) : (
                              <span className={`badge ${record.controlAptoIngreso ? 'aprobado' : 'rechazado'}`}>
                                {record.controlAptoIngreso ? 'APTO' : 'RECHAZADO'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="item-icon" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <div 
                            style={{ 
                              padding: '0.4rem', 
                              borderRadius: '8px', 
                              background: 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGeneratePDF(record, 'save');
                            }}
                            title="Descargar Informe"
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a3a3a3'; }}
                          >
                            <Download size={18} color="#a3a3a3" />
                          </div>
                          <div 
                            style={{ 
                              padding: '0.4rem', 
                              borderRadius: '8px', 
                              background: 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGeneratePDF(record, 'preview');
                            }}
                            title="Previsualizar PDF"
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a3a3a3'; }}
                          >
                            <ExternalLink size={18} color="#a3a3a3" />
                          </div>
                          <div 
                            style={{ 
                              padding: '0.4rem', 
                              borderRadius: '8px', 
                              background: 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRecord(record);
                            }}
                            title="Ver Informe Completo"
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a3a3a3'; }}
                          >
                            <Eye size={20} color="currentColor" style={{ color: '#a3a3a3', transition: 'color 0.2s' }} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <ClipboardList size={48} />
                    <p>Sin informes en {SECTORS.find(s => s.id === activeSector)?.label || 'este sector'}</p>
                  </div>
                )}
              </motion.div>
            )}
               </AnimatePresence>
            </main>
          </div>
        </div>
        <footer className="footer">
          <p>
            © 2026 Desarrollado por el <strong>Departamento de Sistemas</strong> de Mi Gusto.
          </p>
        </footer>
      </>
    } />
    </Routes>

    <AnimatePresence>
      {confirmModal.show && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="confirm-modal"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
          >
            <div className="modal-icon">
              <AlertCircle size={48} color={SECTORS.find(s => s.id === activeSector)?.color || '#fff'} />
            </div>
            <h2>{confirmModal.title}</h2>
            <p>Esta acción guardará permanentemente los datos en el historial del sector.</p>
            
            <div className="modal-actions">
              <button 
                className="modal-btn cancel"
                onClick={() => setConfirmModal({ show: false, action: null, title: '' })}
              >
                CANCELAR
              </button>
              <button 
                className="modal-btn confirm"
                style={{ backgroundColor: SECTORS.find(s => s.id === activeSector)?.color || '#fff' }}
                onClick={() => confirmModal.action()}
              >
                SÍ, CONFIRMAR
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

    </AnimatePresence>
    </>
  );
}
 
const App = () => {
  return (
    <Router basename="/fabrica/DataCenter">
      <RegsApp />
    </Router>
  );
};
 
export default App;
