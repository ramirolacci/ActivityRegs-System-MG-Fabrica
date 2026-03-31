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
  ChevronRight, AlertCircle, AlertTriangle
} from 'lucide-react'


const SECTORS = [
  { id: 'desarrollo', label: 'Desarrollo', icon: ClipboardCheck, color: '#3b82f6', description: 'Informes de prueba y recepción de mercaderia' },
  { id: 'calidad', label: 'Calidad', icon: ShieldCheck, color: '#10b981', description: 'Auditorias y controles de calidad' },
  { id: 'proveedores', label: 'Proveedores', icon: Truck, color: '#f59e0b', description: 'Gestión y evaluación de proveedores' },
  { id: 'produccion', label: 'Produccion', icon: HardHat, color: '#ef4444', description: 'Registros de linea y rendimiento' },
  { id: 'logistica', label: 'Logistica', icon: Package, color: '#8b5cf6', description: 'Control de despacho y flota' },
  { id: 'mantenimiento', label: 'Mantenimiento', icon: Settings, color: '#6b7280', description: 'Preventivos y correctivos de planta' },
  { id: 'mesa-carnes', label: 'Mesa de Carnes', icon: Utensils, color: '#ec4899', description: 'Control de lotes y desposte' },
  { id: 'cocina', label: 'Cocina', icon: CookingPot, color: '#f97316', description: 'Elaboración y planillas térmicas' },
  { id: 'picadillo', label: 'Picadillo', icon: Layers, color: '#06b6d4', description: 'Mezcla y balance de ingredientes' },
  { id: 'armado', label: 'Armado', icon: Puzzle, color: '#84cc16', description: 'Ensamble y finalización de producto' },
  { id: 'salsas', label: 'Salsas', icon: Droplet, color: '#0ea5e9', description: 'Dosificación y control de mezclas' },
];




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
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('regsapp_records_multisector_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migración simple para registros viejos con categoria string
        return parsed.map(r => ({
          ...r,
          categoria: Array.isArray(r.categoria) ? r.categoria : (r.categoria ? [r.categoria] : [])
        }));
      } catch (e) {
        console.error("Error loading records", e);
        return [];
      }
    }
    return [];
  });

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
    respuestas: [] // Refactored to array for chat history
  });
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('regsapp_notifications_v1');
    return saved ? JSON.parse(saved) : [];
  });
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    localStorage.setItem('regsapp_notifications_v1', JSON.stringify(notifications));
  }, [notifications]);

  const [confirmModal, setConfirmModal] = useState({ show: false, action: null, title: '' });

  const markAllAsSeen = () => {
    setNotifications(notifications.map(n => ({ ...n, seen: true })));
  };

  useEffect(() => {
    localStorage.setItem('regsapp_records_multisector_v2', JSON.stringify(records));
  }, [records]);

  // Sincronización en tiempo real entre pestañas/ventanas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'regsapp_notifications_v1') {
        const newNotifs = e.newValue ? JSON.parse(e.newValue) : [];
        setNotifications(newNotifs);
      }
      if (e.key === 'regsapp_records_multisector_v2') {
        const newRecords = e.newValue ? JSON.parse(e.newValue) : [];
        setRecords(newRecords);
        
        // Actualizar el registro seleccionado si alguien lo tiene abierto (chat en vivo)
        setSelectedRecord(prev => {
          if (!prev) return null;
          const updated = newRecords.find(r => r.id === prev.id);
          return updated || prev;
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmModal({
      show: true,
      title: '¿Confirmar guardado de informe?',
      action: () => {
        const newRecord = {
          ...formData,
          id: Date.now(),
          type: 'report',
          fecha: formatInputDate(formData.fecha),
          created: getCurrentTimestamp(),
          sector: activeSector
        };
        
        const updatedRecords = [newRecord, ...records];
        setRecords(updatedRecords);
        localStorage.setItem('regsapp_records_multisector_v2', JSON.stringify(updatedRecords));
        setFormData(initialFormState());
        setSelectedRecord(null);
        setActiveSubTab('history');
        setConfirmModal({ show: false, action: null, title: '' });
      }
    });
  }

  const handleMaterialsSubmit = (e) => {
    e.preventDefault();
    setConfirmModal({
      show: true,
      title: '¿Confirmar registro de ingreso?',
      action: () => {
        const newRecord = {
          ...materialsData,
          id: Date.now(),
          type: 'material',
          producto: materialsData.insumo,
          fechaIngreso: formatInputDate(materialsData.fechaIngreso),
          created: materialsData.registroTimestamp,
          sector: activeSector
        };

        const updatedRecords = [newRecord, ...records];
        setRecords(updatedRecords);
        localStorage.setItem('regsapp_records_multisector_v2', JSON.stringify(updatedRecords));
        setMaterialsData(initialMaterialsForm());
        setActiveSubTab('history');
        setConfirmModal({ show: false, action: null, title: '' });
      }
    });
  }

  const handleSaveResponse = (recordId, responseText) => {
    if (!responseText.trim()) return;
    const record = records.find(r => r.id === recordId);
    if (!record) return;

    const sectorInfo = SECTORS.find(s => s.id === activeSector);
    const newMsg = {
      sectorId: activeSector,
      sectorName: sectorInfo ? sectorInfo.label : activeSector,
      sectorColor: sectorInfo ? sectorInfo.color : '#fff',
      text: responseText,
      timestamp: getCurrentTimestamp()
    };

    const updatedRecords = records.map(r => 
      r.id === recordId ? { 
        ...r, 
        respuestas: [...(Array.isArray(r.respuestas) ? r.respuestas : []), newMsg] 
      } : r
    );
    setRecords(updatedRecords);
    localStorage.setItem('regsapp_records_multisector_v2', JSON.stringify(updatedRecords));

    // Send notification back to the other party
    const isQualityEmitting = activeSector === record.sector;
    const targetSectorMatch = isQualityEmitting 
       ? SECTORS.find(s => s.label === record.areaImplicada)
       : SECTORS.find(s => s.id === record.sector);

    const newNotif = {
      id: Date.now(),
      targetSector: targetSectorMatch ? targetSectorMatch.id : (isQualityEmitting ? 'all' : 'calidad'),
      targetSectorName: targetSectorMatch ? targetSectorMatch.label : (isQualityEmitting ? 'Múltiples' : 'Calidad'),
      message: `NUEVA RESPUESTA EN NC (${record.codigo})`,
      details: responseText,
      timestamp: getCurrentTimestamp(),
      seen: false,
      refId: record.id
    };
    setNotifications([newNotif, ...notifications]);

    // Clear the edit state in selectedRecord
    setSelectedRecord({ 
      ...record, 
      respuestas: [...(Array.isArray(record.respuestas) ? record.respuestas : []), newMsg],
      tempResponse: '' 
    });

    setConfirmModal({
      show: true,
      title: 'Respuesta enviada con éxito',
      action: () => setConfirmModal({ show: false, action: null, title: '' })
    });
  };

  const handleNonConformitySubmit = (e) => {
    e.preventDefault();
    setConfirmModal({
      show: true,
      title: '¿Confirmar Informe de No conformidad?',
      action: () => {
        const newRecord = {
          ...nonConformityData,
          id: Date.now(),
          type: 'non-conformity',
          producto: 'No conformidad - ' + nonConformityData.codigo,
          fecha: formatInputDate(nonConformityData.fecha),
          created: getCurrentTimestamp(),
          sector: activeSector
        };

        const updatedRecords = [newRecord, ...records];
        setRecords(updatedRecords);
        localStorage.setItem('regsapp_records_multisector_v2', JSON.stringify(updatedRecords));

        // Create Notification
        const sectorMatch = SECTORS.find(s => s.label === nonConformityData.areaImplicada);
        const newNotif = {
          id: Date.now(),
          targetSector: sectorMatch ? sectorMatch.id : 'all',
          targetSectorName: nonConformityData.areaImplicada,
          message: `NUEVA NO conformidad (${nonConformityData.codigo})`,
          details: nonConformityData.descripcion,
          timestamp: getCurrentTimestamp(),
          seen: false,
          refId: newRecord.id
        };
        setNotifications([newNotif, ...notifications]);

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
                      className="sector-tile"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.04 }}
                      whileHover={{ 
                        y: -8,
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        transition: { duration: 0.2 } 
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveSubTab('form');
                        navigate(`/${sector.id}`);
                      }}
                      style={{ '--sector-color': sector.color }}
                    >
                      <div className="tile-glow"></div>
                      <div className="tile-icon-box">
                        <sector.icon size={26} />
                      </div>
                      <div className="tile-body">
                        <span className="tile-label">{sector.label}</span>
                        <div className="tile-action">
                          <span>{sector.description}</span>
                          <ChevronRight size={14} />
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
                                {notifications.length > 0 ? (
                                  notifications.map(notif => (
                                    <div 
                                      key={notif.id} 
                                      className={`notif-item ${!notif.seen ? 'unread' : ''}`}
                                      onClick={() => {
                                        if (notif.refId) {
                                           const record = records.find(r => r.id === notif.refId);
                                           if (record) {
                                             setSelectedRecord(record);
                                             setShowNotifications(false);
                                             markAllAsSeen();
                                             setActiveSubTab('history');
                                           }
                                        }
                                      }}
                                    >
                                      <div className="notif-title">
                                        <span className="notif-tag">{notif.targetSectorName}</span>
                                        <span className="notif-time">{notif.timestamp.split(' ')[1]}</span>
                                      </div>
                                      <p className="notif-msg">{notif.message}</p>
                                      <p className="notif-detail">{notif.details?.substring(0, 50)}...</p>
                                    </div>
                                  ))
                                ) : (
                                  <div className="notif-empty">
                                    <ShieldCheck size={40} opacity={0.3} />
                                    <p>Sin alertas nuevas</p>
                                  </div>
                                )}
                              </div>

                              <div className="notif-footer">
                                <button 
                                   onClick={() => { setNotifications([]); setShowNotifications(false); }}
                                   className="clear-all"
                                >
                                  Vaciar centro de alertas
                                </button>
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>

                  <div style={{ position: 'relative', zIndex: 10005 }}>
                    <AlertTriangle 
                      size={28} 
                      color={notifications.some(n => !n.seen && (n.targetSector === activeSector || n.targetSector === 'all')) ? '#facc15' : (showNotifications ? '#facc15' : '#525252')} 
                      className={notifications.some(n => !n.seen && (n.targetSector === activeSector || n.targetSector === 'all')) ? 'pulse-yellow' : ''}
                      style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}
                    />
                    {notifications.some(n => !n.seen && (n.targetSector === activeSector || n.targetSector === 'all')) && (
                      <div className="notif-badge-mini" style={{ zIndex: 10010 }} />
                    )}
                  </div>
                </div>
                  </div>
                </div>

                {activeSector === 'calidad' && (
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
            <button 
              onClick={() => { setActiveSubTab('form'); setSelectedRecord(null); }}
              className={`sub-tab-btn ${activeSubTab === 'form' ? 'active' : ''}`}
            >
              Informe de pruebas
            </button>
            
            {activeSector !== 'calidad' && (
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
            
            {activeSector === 'calidad' && (
              <button 
                onClick={() => { setActiveSubTab('non-conformity'); setSelectedRecord(null); }}
                className={`sub-tab-btn ${activeSubTab === 'non-conformity' ? 'active' : ''}`}
              >
                Informe de no conformidad
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <main className="content">
          <AnimatePresence mode="wait">

            {activeSubTab === 'form' ? (
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
                        <option key={s.id} value={s.label}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nº de No conformidad</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="NC-2026-..."
                        value={nonConformityData.codigo}
                        onChange={(e) => setNonConformityData({...nonConformityData, codigo: e.target.value})}
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
                key="detail-view"
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
                  {selectedRecord.type === 'report' ? (
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
                  ) : selectedRecord.type === 'material' ? (
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
                          <h2>No Conformidad</h2>
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
                            {selectedRecord.areaImplicada || 'NO ESPECIFICADA'}
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
                        
                        <div className="chat-history-container" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {(Array.isArray(selectedRecord.respuestas) && selectedRecord.respuestas.length > 0) ? (
                            selectedRecord.respuestas.map((msg, idx) => (
                              <div key={idx} className="chat-msg" style={{ padding: '0.75rem 1rem', background: '#111', borderRadius: '10px', border: '1px solid #222' }}>
                                <span style={{ color: msg.sectorColor || '#fff', fontWeight: '900', marginRight: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                  {msg.sectorName}:
                                </span>
                                <span style={{ color: '#eee', fontSize: '0.85rem' }}>{msg.text}</span>
                                <div style={{ fontSize: '0.6rem', color: '#444', marginTop: '0.25rem' }}>{msg.timestamp}</div>
                              </div>
                            ))
                          ) : (
                            <div className="view-value large" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed #333', minHeight: '60px', padding: '1.2rem', color: '#666' }}>
                              No hay respuestas registradas aún.
                            </div>
                          )}
                        </div>

                        {/* Both the target area and the issuer can respond */}
                        {(activeSector === selectedRecord.sector || SECTORS.find(s => s.id === activeSector)?.label === selectedRecord.areaImplicada) && (
                          <div className="response-edit-container" style={{ marginTop: '1.5rem' }}>
                            <textarea 
                              className="form-control auto-expand"
                              style={{ 
                                width: '100%', 
                                background: '#0a0a0a', 
                                border: '1px solid #333', 
                                borderRadius: '12px',
                                padding: '1rem',
                                color: '#fff',
                                minHeight: '80px'
                              }}
                              placeholder="Escribe una nueva respuesta..."
                              value={selectedRecord.tempResponse || ''}
                              onChange={(e) => handleTextAreaChange(e, 'tempResponse', setSelectedRecord, selectedRecord)}
                            />
                            <button 
                              className="submit-btn"
                              style={{ margin: '1rem 0 0 auto', width: 'auto', padding: '0.8rem 2.5rem', fontSize: '0.85rem', background: '#fff', color: '#000', border: 'none', fontWeight: '900', borderRadius: '10px' }}
                              onClick={() => handleSaveResponse(selectedRecord.id, selectedRecord.tempResponse)}
                            >
                              Enviar respuesta
                            </button>
                          </div>
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
                <h2 className="section-title history">
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
                            {record.type === 'report' ? '💻 PRUEBA DE DESARROLLO' : 
                             record.type === 'material' ? '📦 INGRESO DE MATERIAL' : 
                             '⚠️ NO CONFORMIDAD'}
                          </div>
                          <h3>{record.producto}</h3>
                          <div className="item-meta">
                            <p><Clock size={12} /> {formatInputDate(record.fecha || record.fechaIngreso)}</p>
                            <p><User size={12} /> {record.responsable || record.ingresadoPor}</p>
                            {record.type === 'report' ? (
                              <span className={`badge ${record.decisionFinal?.toLowerCase().replace(/\s+/g, '-')}`}>
                                {record.decisionFinal}
                              </span>
                            ) : (
                              <span className={`badge ${record.controlAptoIngreso ? 'aprobado' : 'rechazado'}`}>
                                {record.controlAptoIngreso ? 'APTO' : 'RECHAZADO'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="item-icon">
                          <Eye size={20} color="#525252" />
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
