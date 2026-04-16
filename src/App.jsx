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
  PlusCircle, History, Save, ClipboardList, Clock, User, HardHat, 
  ClipboardCheck, Settings, Eye, ShieldCheck, Truck, Package, 
  Utensils, CookingPot, Layers, Puzzle, Droplet, ArrowLeft,
  ChevronRight, ChevronDown, AlertCircle, AlertTriangle, Download, Lock, Store, Thermometer
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { supabase } from './supabase';


const SECTORS = [
  { id: 'desarrollo', label: 'Desarrollo', icon: ClipboardCheck, color: '#3b82f6', description: 'Informes de prueba y recepción de mercaderia', isLocked: false },
  { id: 'calidad', label: 'Calidad', icon: ShieldCheck, color: '#10b981', description: 'Auditorias y controles de calidad', isLocked: false },
  { id: 'proveedores', label: 'Proveedores', icon: Truck, color: '#f59e0b', description: 'Gestión y evaluación de proveedores', isLocked: true },
  { id: 'produccion', label: 'Produccion', icon: HardHat, color: '#ef4444', description: 'Registros de linea y rendimiento', isLocked: true },
  { id: 'logistica', label: 'Logistica', icon: Package, color: '#8b5cf6', description: 'Control de despacho y flota', isLocked: true },
  { id: 'mantenimiento', label: 'Mantenimiento', icon: Settings, color: '#6b7280', description: 'Preventivos y correctivos de planta', isLocked: true },
  { id: 'mesa-carnes', label: 'Mesa de Carnes', icon: Utensils, color: '#ec4899', description: 'Control de lotes y desposte', isLocked: true },
  { id: 'cocina', label: 'Cocina', icon: CookingPot, color: '#f97316', description: 'Elaboración y planillas térmicas', isLocked: true },
  { id: 'picadillo', label: 'Picadillo', icon: Layers, color: '#06b6d4', description: 'Mezcla y balance de ingredientes', isLocked: true },
  { id: 'armado', label: 'Armado', icon: Puzzle, color: '#84cc16', description: 'Ensamble y finalización de producto', isLocked: true },
  { id: 'salsas', label: 'Salsas', icon: Droplet, color: '#0ea5e9', description: 'Dosificación y control de mezclas', isLocked: true },
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
  insumo: '',
  lotes: ['', '', '', '', ''],
  vencimientos: ['', '', '', '', ''],
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


const RegsApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sectorMatch = useMatch('/:sectorId');
  const sectorId = sectorMatch?.params.sectorId;
  const [activeSubTab, setActiveSubTab] = useState('form')
  const [isUnlocked, setIsUnlocked] = useState(() => localStorage.getItem('regsapp_admin_unlocked') === 'true');
  const [pin, setPin] = useState('');
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
    targetSectorName: n.target_sector_name ?? n.targetSectorName,
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

  // 1. Fetch Inicial
  useEffect(() => {
    const fetchData = async () => {
      const { data: recs } = await supabase.from('registros').select('*').order('created_at', { ascending: false });
      const { data: notifs } = await supabase.from('notificaciones').select('*').order('created_at', { ascending: false });
      if (recs) setRecords(recs.map(normalizeRecord));
      if (notifs) setNotifications(notifs.map(normalizeNotif));
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      .subscribe();

    return () => supabase.removeChannel(channel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. Redirección de sub-pestañas por defecto para Calidad
  useEffect(() => {
    if (activeSector === 'calidad' && activeSubTab === 'form') {
      setActiveSubTab('despacho-franquicias');
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
         (n.message?.toLowerCase().includes('no conformidad') || n.message?.toLowerCase().includes('nueva no conformidad'))
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
    targetSectorName,
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
          target_sector_name: targetSectorName,
          message,
          details,
          timestamp: getCurrentTimestamp(),
          seen: false
        })
        .eq('id', existingNotif.id);
    }

    return supabase.from('notificaciones').insert([{
      target_sector: targetSector,
      target_sector_name: targetSectorName,
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
    return record && (!record.respuestas || record.respuestas.length === 0);
  });

  const notifStatus = 
    filteredNotifications.length === 0 ? 'empty' :
    hasUnreadNotifications ? 'unread' :
    hasUnansweredNotifications ? 'unanswered' : 'all-clear';

  const handleDownloadPDF = (record) => {
    let typeLabel = "REPORTE";
    if (record.type === 'report') typeLabel = "Prueba de Desarrollo";
    else if (record.type === 'material') typeLabel = "Ingreso de Material";
    else if (record.type === 'non-conformity') typeLabel = "No Conformidad";

    let contentHTML = `
      <div style="padding: 40px; font-family: sans-serif; color: #333;">
        <div style="border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="margin: 0; color: #111;">${typeLabel}</h1>
          <p style="margin: 5px 0 0; color: #666;">ID: ${record.codigo || record.id} | Fecha: ${record.fecha || record.fechaIngreso}</p>
        </div>
    `;

    if (record.type === 'report') {
      contentHTML += `
        <div style="margin-bottom: 20px;"><strong>Área Responsable:</strong> ${record.sector || '-'}</div>
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
    } else if (record.type === 'material') {
      contentHTML += `
        <div style="margin-bottom: 20px;"><strong>Proveedor:</strong> ${record.proveedor}</div>
        <div style="margin-bottom: 20px;"><strong>Grupo de Insumos:</strong> ${record.grupoInsumos}</div>
        <div style="margin-bottom: 20px;"><strong>Insumo/Producto:</strong> ${record.producto}</div>
        <div style="margin-bottom: 20px;">
          <strong>Trazabilidad:</strong><br/>
          <table style="width: 100%; text-align: left; border-collapse: collapse; margin-top: 10px;">
            <tr style="border-bottom: 1px solid #ccc;"><th>Lote</th><th>Vencimiento</th></tr>
            ${(record.lotes || []).map((l, i) => l ? `<tr><td>${l}</td><td>${record.vencimientos[i] || '-'}</td></tr>` : '').join('')}
          </table>
        </div>
        <div style="margin-bottom: 20px;"><strong>Controles:</strong>
          <ul>
            <li>Camión en condiciones: ${record.controlCamionLimpio ? 'Sí' : 'No'}</li>
            <li>Envase íntegro: ${record.controlEnvaseIntegro ? 'Sí' : 'No'}</li>
            <li>Sin olores extraños: ${record.controlSinOlores ? 'Sí' : 'No'}</li>
            <li><strong>Apto para Ingreso:</strong> ${record.controlAptoIngreso ? 'SÍ' : 'NO'}</li>
          </ul>
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #ccc;">
          <strong>Firma Responsable:</strong> ${record.ingresadoPor || '-'}
        </div>
      `;
    } else {
      contentHTML += `
        <div style="margin-bottom: 20px;"><strong>Área Implicada:</strong> ${record.areaImplicada || '-'}</div>
        <div style="margin-bottom: 20px;"><strong>Estado:</strong> ${record.estado || '-'}</div>
        <div style="margin-bottom: 20px;"><strong>Descripción del Desvío:</strong><br/>${record.descripcion || '-'}</div>
        <div style="margin-bottom: 20px;"><strong>Causa Raíz:</strong><br/>${record.causaRaiz || '-'}</div>
        <div style="margin-bottom: 20px;"><strong>Acción Correctiva:</strong><br/>${record.accionCorrectiva || '-'}</div>
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
      filename:     `Informe_${record.type}_${record.codigo || record.id}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(contentHTML).save();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmModal({
      show: true,
      title: '¿Confirmar guardado de informe?',
      action: async () => {
        const { data, error } = await supabase.from('registros').insert([{
          sector: activeSector,
          tipo: 'report',
          producto: formData.producto,
          responsable: formData.responsable,
          fecha: formatInputDate(formData.fecha),
          codigo: formData.codigo,
          datos: { ...formData }
        }]).select();
        
        if (!error) {
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
          producto: materialsData.insumo,
          responsable: materialsData.ingresadoPor,
          fecha: formatInputDate(materialsData.fechaIngreso),
          datos: { ...materialsData }
        }]).select();

        if (!error) {
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

        // Notificación cruzada para chat NC:
        // - Si responde Calidad, notifica al área implicada.
        // - Si responde el área implicada, notifica a Calidad.
        const areaImplicadaSector = getSectorFromAreaImplicada(record.areaImplicada);
        const isQualityResponding = activeSector === record.sector;
        const isAssignedAreaResponding = activeSector === areaImplicadaSector?.id;

        let targetSectorMatch = null;
        if (isQualityResponding) {
          targetSectorMatch = areaImplicadaSector;
        } else if (isAssignedAreaResponding) {
          targetSectorMatch = SECTORS.find(s => s.id === record.sector);
        }

        await upsertNcNotification({
          targetSector: targetSectorMatch ? targetSectorMatch.id : 'calidad',
          targetSectorName: targetSectorMatch ? targetSectorMatch.label : 'Calidad',
          message: `NUEVA RESPUESTA EN NO CONFORMIDAD (${record.codigo})`,
          details: responseText,
          refId: recordId
        });

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
            targetSectorName: targetSector ? targetSector.label : nonConformityData.areaImplicada,
            message: `NUEVA NO CONFORMIDAD (${nonConformityData.codigo})`,
            details: nonConformityData.descripcion,
            refId: newId
          });

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
          setTemperaturaCamarasData(initialTemperaturaCamarasForm());
          setActiveSubTab('history');
        }
        setConfirmModal({ show: false, action: null, title: '' });
      }
    });
  }

  const filteredRecords = records.filter(r => r.sector === activeSector);
  

  const handleRevisionChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only numbers
    setFormData({...formData, revision: value});
  }

  const handleCodigoChange = (e) => {
    let value = e.target.value.toUpperCase();
    if (value === 'INF' && formData.codigo.toUpperCase() === 'IN') {
      value = 'INF-';
    }
    setFormData({...formData, codigo: value});
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
                    <img src={`${import.meta.env.BASE_URL}Logo Mi Gusto 2025.png`} alt="Mi Gusto" className="brand-logo" />
                  <div className="brand-divider"></div>
                  <div className="brand-text">
                    <h3>Módulos de información</h3>
                  </div>
                </div>
                
                <div className="sidebar-info">
                  <h1>Centro de Operaciones</h1>
                  <p>Seleccione la unidad de negocio para iniciar la carga de informes de cumplimiento y operativa diaria.</p>
                </div>

                <div className="sidebar-footer">
                  <div className="status-indicator">
                    <div className="pulse"></div>
                    <span>SISTEMAS ACTIVOS</span>
                  </div>
                  <p>© 2026 MI GUSTO | DEPARTAMENTO DE SISTEMAS</p>
                </div>
              </motion.div>

              <div className="enterprise-grid-container">
                <div className="sector-bento-grid">
                  {SECTORS.map((sector, index) => (
                    <motion.button
                      key={sector.id}
                      className={`sector-tile ${sector.isLocked ? 'locked' : ''}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.04 }}
                      whileHover={!sector.isLocked ? { 
                        y: -8,
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        transition: { duration: 0.2 } 
                      } : {}}
                      whileTap={!sector.isLocked ? { scale: 0.98 } : {}}
                      onClick={() => {
                        if (sector.isLocked) return;
                        // For 'calidad' sector, the default tab is now 'despacho-franquicias'
                        setActiveSubTab(sector.id === 'calidad' ? 'despacho-franquicias' : 'form');
                        navigate(`/${sector.id}`);
                      }}
                      style={{ '--sector-color': sector.color }}
                    >
                      {sector.isLocked && (
                        <div className="locked-overlay">
                          <Lock size={32} />
                          <span>PRÓXIMAMENTE</span>
                        </div>
                      )}
                      <div className="tile-glow"></div>
                      <div className="tile-icon-box">
                        <sector.icon size={26} />
                      </div>
                      <div className="tile-body">
                        <span className="tile-label">{sector.label}</span>
                        <div className="tile-action">
                          <span>{sector.description}</span>
                          {!sector.isLocked && <ChevronRight size={14} />}
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
            <img src={`${import.meta.env.BASE_URL}Logo Mi Gusto 2025.png`} alt="Mi Gusto Logo" className="app-logo" />
          </div>

          <div className="app-container">
            <div style={{ padding: '0 0 4rem 0', minHeight: '100%' }}>
              <header className="header">
                <div className="header-top">
                  <div style={{ width: '120px' }} /> {/* Spacer */}
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
                                            <span className="notif-tag">{notif.targetSectorName ?? notif.target_sector_name}</span>
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

                {(activeSector === 'calidad' || activeSector === 'desarrollo') && (
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
        <div className="sub-header-nav-container">
          <div className="sub-header-nav">
            {activeSector === 'calidad' ? (
              <>
                <button 
                  onClick={() => { setActiveSubTab('despacho-franquicias'); setSelectedRecord(null); }}
                  className={`sub-tab-btn ${activeSubTab === 'despacho-franquicias' ? 'active' : ''}`}
                >
                  CONTROL DE DESPACHO A FRANQUICIAS
                </button>
                <button 
                  onClick={() => { setActiveSubTab('temperatura-camaras'); setSelectedRecord(null); }}
                  className={`sub-tab-btn ${activeSubTab === 'temperatura-camaras' ? 'active' : ''}`}
                >
                  CONTROL DE TEMPERATURA DE CAMARAS
                </button>
                <button 
                  onClick={() => { setActiveSubTab('non-conformity'); setSelectedRecord(null); }}
                  className={`sub-tab-btn ${activeSubTab === 'non-conformity' ? 'active' : ''}`}
                >
                  INFORME DE NO CONFORMIDAD
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => { setActiveSubTab('form'); setSelectedRecord(null); }}
                  className={`sub-tab-btn ${activeSubTab === 'form' ? 'active' : ''}`}
                >
                  Informe de pruebas
                </button>
                
                {(activeSector !== 'calidad' && activeSector !== 'desarrollo') && (
                  <button 
                    onClick={() => { setActiveSubTab('history'); setSelectedRecord(null); }}
                    className={`sub-tab-btn ${activeSubTab === 'history' ? 'active' : ''}`}
                  >
                    Ver Historial
                  </button>
                )}

                <button 
                  onClick={() => { setActiveSubTab('materials'); setSelectedRecord(null); }}
                  className={`sub-tab-btn ${activeSubTab === 'materials' ? 'active' : ''}`}
                >
                  Ingreso de materia a planta
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <main className="content">
          <AnimatePresence mode="wait">

            {activeSubTab === 'form' && activeSector !== 'calidad' ? (
              <motion.div
                key={`${activeSector}-form`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="section-title-container">
                  <h2 className="section-title">
                    Informe de Pruebas: {SECTORS.find(s => s.id === activeSector)?.label || 'Sector'}
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="record-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Código Informe</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="INF-00..."
                        value={formData.codigo}
                        onChange={handleCodigoChange}
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

                  <button type="submit" className="submit-btn highlight">
                    <Save size={18} />
                    <span>Guardar Informe</span>
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
                      <label>Insumo / Producto</label>
                      <input 
                        type="text" className="form-control" placeholder="Ej: Stracciatella (estilo italiano)"
                        value={materialsData.insumo} onChange={(e) => setMaterialsData({...materialsData, insumo: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Trazabilidad (Lotes y Vencimientos) */}
                  <div className="form-section-group">
                    <h3>Trazabilidad (Lotes y Vencimientos)</h3>
                    <div className="trazabilidad-scroll">
                      <table className="trazabilidad-table">
                        <thead>
                          <tr>
                            <th>Nº</th>
                            <th>Identificación Lote</th>
                            <th>Fecha de Vencimiento</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[0, 1, 2, 3, 4].map(idx => (
                            <tr key={idx}>
                              <td className="row-num">{idx + 1}</td>
                              <td>
                                <input 
                                  type="text" className="form-control compact" placeholder={`Lote ${idx + 1}`}
                                  value={materialsData.lotes[idx]}
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
                          <h2>Detalle del Informe</h2>
                          <span className="badge">{selectedRecord.codigo || 'SIN CODIGO'}</span>
                        </div>
                        <div className="header-meta">
                          <span>Revisión: {selectedRecord.revision || '0'}</span>
                          <span>{selectedRecord.created}</span>
                        </div>
                      </div>

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
                          <div className="view-value highlight">{selectedRecord.producto}</div>
                        </div>
                      </div>

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
                            {(record.type === 'report' || record.tipo === 'report') ? '💻 PRUEBA DE DESARROLLO' : 
                             (record.type === 'material' || record.tipo === 'material') ? '📦 INGRESO DE MATERIAL' : 
                             (record.type === 'despacho-franquicias' || record.tipo === 'despacho-franquicias') ? '🚚 DESPACHO A FRANQUICIAS' :
                             '⚠️ NO CONFORMIDAD'}
                          </div>
                          <h3 className={(record.type === 'non-conformity' || record.tipo === 'non-conformity') ? 'history-title-nc' : ''}>
                            {record.producto}
                          </h3>
                          <div className="item-meta">
                            <p><Clock size={12} /> {formatInputDate(record.fecha || record.fechaIngreso)}</p>
                            <p><User size={12} /> {record.responsable || record.ingresadoPor}</p>
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
                              transition: 'all 0.2s'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDF(record);
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
    <Router basename="/fabrica">
      <RegsApp />
    </Router>
  );
};
 
export default App;
