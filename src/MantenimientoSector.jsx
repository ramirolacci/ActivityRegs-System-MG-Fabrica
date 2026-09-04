import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Constante para el almacenamiento local de Mantis
const DB_KEY = 'mantis_v1';

const FREQ_DAYS = {
  diario: 1, semanal: 7, quincenal: 15, mensual: 30,
  bimestral: 60, trimestral: 90, semestral: 180, anual: 365
};

const pageTitles = {
  dashboard: 'Dashboard',
  alerts: 'Alertas',
  equipos: 'Equipos',
  plan: 'Plan de Mantenimiento',
  registro: 'Registro de Mantenimiento',
  sectores: 'Sectores'
};

export default function MantenimientoSector({ activeSector }) {
  const navigate = useNavigate();
  // Estado principal de la base de datos local
  const [db, setDb] = useState(() => {
    try {
      const saved = localStorage.getItem(DB_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          sectores: parsed.sectores || [],
          equipos: parsed.equipos || [],
          tareas: parsed.tareas || [],
          registros: parsed.registros || []
        };
      }
    } catch (e) {
      console.error('Error al cargar base de datos Mantis', e);
    }
    return { sectores: [], equipos: [], tareas: [], registros: [] };
  });

  const [currentPage, setCurrentPage] = useState('dashboard');
  const [modalType, setModalType] = useState(null); // 'sector', 'equipo', 'tarea', 'registro'
  const [editingId, setEditingId] = useState(null);

  // Filtros de vistas
  const [eqSearch, setEqSearch] = useState('');
  const [eqSectorFilter, setEqSectorFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('todas'); // 'todas', 'vencidas', 'criticas', 'proximas'

  // Formularios
  const [sectorForm, setSectorForm] = useState({ nombre: '', desc: '' });
  const [equipoForm, setEquipoForm] = useState({ nombre: '', codigo: '', sector: '', marca: '', anio: '', estado: 'operativo', obs: '' });
  const [tareaForm, setTareaForm] = useState({ desc: '', equipo: '', tipo: 'preventivo', frecuencia: 'mensual', vencimiento: '', responsable: '', duracion: '', insumos: '', proc: '' });
  const [registroForm, setRegistroForm] = useState({ tarea: '', fecha: new Date().toISOString().split('T')[0], tecnico: '', duracion: '', estado: 'completado', obs: '' });

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Error al guardar en localStorage', e);
    }
  }, [db]);

  // Auxiliares
  const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

  const diasHasta = (fechaStr) => {
    if (!fechaStr) return 999;
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const f = new Date(fechaStr + 'T00:00:00');
    return Math.round((f - hoy) / 86400000);
  };

  const statusVenc = (dias) => {
    if (dias < 0 || dias <= 7) return 'danger';
    if (dias <= 15) return 'warn';
    return 'ok';
  };

  const labelStatus = (dias) => {
    if (dias < 0) return `Vencido hace ${Math.abs(dias)}d`;
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Mañana';
    return `En ${dias} días`;
  };

  const formatFecha = (str) => {
    if (!str) return '—';
    const parts = str.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return str;
  };

  const getSector = (id) => db.sectores.find(s => s.id === id) || { nombre: 'Sin sector' };
  const getEquipo = (id) => db.equipos.find(e => e.id === id) || { nombre: 'Sin equipo', codigo: '' };
  const getTarea = (id) => db.tareas.find(t => t.id === id) || { desc: 'Sin tarea' };

  // Alertas activas (vencen en <= 15 dias)
  const alertCount = db.tareas.filter(t => diasHasta(t.vencimiento) <= 15).length;

  // Handlers para Guardar / Eliminar
  const handleSaveSector = (e) => {
    e.preventDefault();
    if (!sectorForm.nombre) return;
    if (editingId) {
      setDb(prev => ({
        ...prev,
        sectores: prev.sectores.map(s => s.id === editingId ? { ...s, ...sectorForm } : s)
      }));
    } else {
      setDb(prev => ({
        ...prev,
        sectores: [...prev.sectores, { id: genId(), ...sectorForm }]
      }));
    }
    setModalType(null);
    setEditingId(null);
    setSectorForm({ nombre: '', desc: '' });
  };

  const handleDeleteSector = (id) => {
    if (window.confirm('¿Eliminar sector?')) {
      setDb(prev => ({ ...prev, sectores: prev.sectores.filter(s => s.id !== id) }));
    }
  };

  const handleSaveEquipo = (e) => {
    e.preventDefault();
    if (!equipoForm.nombre) return;
    if (editingId) {
      setDb(prev => ({
        ...prev,
        equipos: prev.equipos.map(eq => eq.id === editingId ? { ...eq, ...equipoForm } : eq)
      }));
    } else {
      setDb(prev => ({
        ...prev,
        equipos: [...prev.equipos, { id: genId(), ...equipoForm }]
      }));
    }
    setModalType(null);
    setEditingId(null);
    setEquipoForm({ nombre: '', codigo: '', sector: '', marca: '', anio: '', estado: 'operativo', obs: '' });
  };

  const handleDeleteEquipo = (id) => {
    if (window.confirm('¿Eliminar equipo?')) {
      setDb(prev => ({ ...prev, equipos: prev.equipos.filter(e => e.id !== id) }));
    }
  };

  const handleSaveTarea = (e) => {
    e.preventDefault();
    if (!tareaForm.desc || !tareaForm.equipo) return;
    if (editingId) {
      setDb(prev => ({
        ...prev,
        tareas: prev.tareas.map(t => t.id === editingId ? { ...t, ...tareaForm } : t)
      }));
    } else {
      setDb(prev => ({
        ...prev,
        tareas: [...prev.tareas, { id: genId(), ...tareaForm }]
      }));
    }
    setModalType(null);
    setEditingId(null);
    setTareaForm({ desc: '', equipo: '', tipo: 'preventivo', frecuencia: 'mensual', vencimiento: '', responsable: '', duracion: '', insumos: '', proc: '' });
  };

  const handleDeleteTarea = (id) => {
    if (window.confirm('¿Eliminar tarea?')) {
      setDb(prev => ({ ...prev, tareas: prev.tareas.filter(t => t.id !== id) }));
    }
  };

  const handleSaveRegistro = (e) => {
    e.preventDefault();
    if (!registroForm.tarea) return;
    const newReg = { id: genId(), ...registroForm };
    
    // Recalcular proxima fecha de vencimiento para la tarea
    const t = getTarea(registroForm.tarea);
    if (t.id) {
      const freqDays = FREQ_DAYS[t.frecuencia] || 30;
      const d = new Date(registroForm.fecha + 'T00:00:00');
      d.setDate(d.getDate() + freqDays);
      const nextVenc = d.toISOString().split('T')[0];

      setDb(prev => ({
        ...prev,
        registros: [newReg, ...prev.registros],
        tareas: prev.tareas.map(tar => tar.id === t.id ? { ...tar, vencimiento: nextVenc } : tar)
      }));
    } else {
      setDb(prev => ({ ...prev, registros: [newReg, ...prev.registros] }));
    }

    setModalType(null);
    setRegistroForm({ tarea: '', fecha: new Date().toISOString().split('T')[0], tecnico: '', duracion: '', estado: 'completado', obs: '' });
  };

  // Función para Cargar Datos Demo / Mockeados (Personalizado Mi Gusto)
  const loadMockData = () => {
    const mockDb = {
      sectores: [
        { id: 'sec-cocina', nombre: 'Cocina & Marmitas', desc: 'Cocción de rellenos de carne, pollo y pavas térmicas' },
        { id: 'sec-armado', nombre: 'Armado & Repulgadoras', desc: 'Línea de troquelado de tapas, empanadoras y repulgado' },
        { id: 'sec-carnes', nombre: 'Mesa de Carnes & Picadillo', desc: 'Picadoras de carne, cutter y mezcladoras de pino' },
        { id: 'sec-salsas', nombre: 'Salsas & Quesos', desc: 'Procesadoras de tomate, muzzarella y dosificadoras' },
        { id: 'sec-frio', nombre: 'Cámaras Frigoríficas', desc: 'Cámaras de mantención de muzzarella y túneles de congelado de empanadas' }
      ],
      equipos: [
        { id: 'eq-repulgadora1', nombre: 'Repulgadora Automática 01', codigo: 'REP-01', sector: 'sec-armado', marca: 'GustoMach / Anko', anio: '2023', estado: 'mantenimiento', obs: 'Cambio de matriz de repulgo de carne picante' },
        { id: 'eq-marmita2', nombre: 'Marmita Volcable 300L (Cocción Pino)', codigo: 'MRM-02', sector: 'sec-cocina', marca: 'TecnoCalor', anio: '2021', estado: 'operativo', obs: 'Prueba de quemador de gas y agitador atóxico OK' },
        { id: 'eq-picadora1', nombre: 'Picadora de Carne Industrial 130mm', codigo: 'PIC-01', sector: 'sec-carnes', marca: 'Hobart Heavy', anio: '2020', estado: 'fuera_servicio', obs: 'Reemplazo de cuchilla de 3mm y gusano sinfín' },
        { id: 'eq-ralladora', nombre: 'Ralladora de Muzzarella en Bloque', codigo: 'RAL-01', sector: 'sec-salsas', marca: 'Braher', anio: '2022', estado: 'operativo', obs: 'Limpieza e inspección de discos de corte' },
        { id: 'eq-tunel', nombre: 'Túnel de Congelado Rápido IQF (Empanadas)', codigo: 'IQF-01', sector: 'sec-frio', marca: 'Mycom Compressor', anio: '2022', estado: 'operativo', obs: 'Descongelamiento automático y sensores de temperatura OK' }
      ],
      tareas: [
        { id: 'tar-1', desc: 'Alineación de cadena e inyección de lubricante grado alimenticio (H1)', equipo: 'eq-repulgadora1', tipo: 'preventivo', frecuencia: 'semanal', vencimiento: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0], responsable: 'Juan Pérez', duracion: '1', insumos: 'Grasa atóxica Klüberfood H1', proc: 'Limpiar carril de formación y engrasar rodamientos del molde' },
        { id: 'tar-2', desc: 'Sanitización y control de sellos de teflón en agitador', equipo: 'eq-marmita2', tipo: 'limpieza', frecuencia: 'quincenal', vencimiento: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], responsable: 'Carlos Gómez', duracion: '1.5', insumos: 'O-rings EPDM de repuesto', proc: 'Desarmar pala raspadora y comprobar desgaste por calor' },
        { id: 'tar-3', desc: 'Reemplazo de conjunto de transmisión y rodamientos de cabezal', equipo: 'eq-picadora1', tipo: 'correctivo', frecuencia: 'mensual', vencimiento: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0], responsable: 'Mariano Silva', duracion: '3.5', insumos: 'Rodamiento SKF 6208 2RS + Retén hidrófugo', proc: 'Desmontar reductor y cambiar lubricante industrial' },
        { id: 'tar-4', desc: 'Calibración de termostatos y presostatos de seguridad de amoníaco/freón', equipo: 'eq-tunel', tipo: 'calibracion', frecuencia: 'trimestral', vencimiento: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0], responsable: 'Sistemas & Frío Mg', duracion: '2', insumos: 'Manómetro patrones cert.', proc: 'Verificar setpoint a -35°C en salida de túnel IQF' }
      ],
      registros: [
        { id: 'reg-101', tarea: 'tar-2', fecha: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0], tecnico: 'Carlos Gómez', duracion: '1.5', estado: 'completado', obs: 'Agitador ajustado. Sellos reemplazados por repuestos sanitarios nuevos.' },
        { id: 'reg-102', tarea: 'tar-4', fecha: new Date(Date.now() - 86400000 * 40).toISOString().split('T')[0], tecnico: 'Sistemas & Frío Mg', duracion: '2', estado: 'completado', obs: 'Túnel IQF operando a -36.2°C constantes. Sensores verificados.' }
      ]
    };

    setDb(mockDb);
    localStorage.setItem(DB_KEY, JSON.stringify(mockDb));
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#0d1117',
      color: '#e6edf3',
      fontFamily: "'Barlow', sans-serif",
      margin: 0
    }}>
      {/* Estilos embebidos de MANTIS */}
      <style>{`
        .mantis-app { display: flex; width: 100vw; min-height: 100vh; background: #0d1117; }
        .mantis-sidebar { width: 240px; background: #161b22; border-right: 1px solid #2a3547; display: flex; flex-direction: column; }
        .mantis-logo { padding: 20px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #2a3547; }
        .mantis-logo-icon { width: 36px; height: 36px; background: #f5a623; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; color: #000; }
        .mantis-logo-text { font-weight: 700; font-size: 20px; letter-spacing: 2px; color: #e6edf3; }
        .mantis-nav { padding: 16px 0; flex: 1; }
        .mantis-nav-section { padding: 8px 20px 4px; font-size: 10px; color: #4d5766; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; }
        .mantis-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 20px; cursor: pointer; color: #8b949e; font-size: 14px; font-weight: 500; border-left: 3px solid transparent; transition: all 0.15s; }
        .mantis-nav-item:hover, .mantis-nav-item.active { background: #1c2230; color: #f5a623; border-left-color: #f5a623; }
        .mantis-badge { margin-left: auto; background: #e8534a; color: #fff; border-radius: 10px; padding: 1px 7px; font-size: 11px; font-weight: 600; }

        .mantis-main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
        .mantis-topbar { background: #161b22; border-bottom: 1px solid #2a3547; padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; }
        .mantis-content { padding: 28px; flex: 1; }

        .mantis-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .mantis-kpi-card { background: #161b22; border: 1px solid #2a3547; border-radius: 8px; padding: 20px; position: relative; overflow: hidden; }
        .mantis-kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
        .mantis-kpi-card.danger::before { background: #e8534a; }
        .mantis-kpi-card.warn::before { background: #f0ad4e; }
        .mantis-kpi-card.info::before { background: #4d9cf8; }
        .mantis-kpi-card.ok::before { background: #3dd68c; }
        .mantis-kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8b949e; font-weight: 600; }
        .mantis-kpi-value { font-size: 40px; font-weight: 900; line-height: 1; margin: 8px 0 4px; }
        .mantis-kpi-card.danger .mantis-kpi-value { color: #e8534a; }
        .mantis-kpi-card.warn .mantis-kpi-value { color: #f0ad4e; }
        .mantis-kpi-card.info .mantis-kpi-value { color: #4d9cf8; }
        .mantis-kpi-card.ok .mantis-kpi-value { color: #3dd68c; }

        .mantis-card { background: #161b22; border: 1px solid #2a3547; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .mantis-card-title { font-weight: 700; font-size: 16px; letter-spacing: 0.5px; color: #8b949e; text-transform: uppercase; margin-bottom: 16px; }

        .mantis-btn { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; }
        .mantis-btn-primary { background: #f5a623; color: #000; }
        .mantis-btn-primary:hover { background: #ffc04d; }
        .mantis-btn-secondary { background: #222b3a; color: #e6edf3; border: 1px solid #2a3547; }
        .mantis-btn-danger { background: #e8534a; color: #fff; }
        .mantis-btn-success { background: #3dd68c; color: #000; }
        .mantis-btn-sm { padding: 5px 10px; font-size: 12px; }

        .mantis-table { width: 100%; border-collapse: collapse; }
        .mantis-table th { text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8b949e; font-weight: 600; border-bottom: 1px solid #2a3547; background: #1c2230; }
        .mantis-table td { padding: 11px 14px; font-size: 13px; border-bottom: 1px solid #2a3547; }

        .mantis-badge-status { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .mantis-badge-ok { background: rgba(61,214,140,0.15); color: #3dd68c; }
        .mantis-badge-warn { background: rgba(240,173,78,0.15); color: #f0ad4e; }
        .mantis-badge-danger { background: rgba(232,83,74,0.15); color: #e8534a; }

        .mantis-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 99999; display: flex; align-items: center; justify-content: center; }
        .mantis-modal { background: #161b22; border: 1px solid #2a3547; border-radius: 12px; padding: 28px; width: 520px; max-width: 95vw; max-height: 85vh; overflow-y: auto; }
        .mantis-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .mantis-form-group { display: flex; flex-direction: column; gap: 6px; }
        .mantis-form-group.full { grid-column: 1 / -1; }
        .mantis-form-group label { font-size: 11px; font-weight: 600; color: #8b949e; text-transform: uppercase; }
        .mantis-form-group input, .mantis-form-group select, .mantis-form-group textarea { background: #1c2230; border: 1px solid #2a3547; border-radius: 6px; padding: 9px 12px; color: #e6edf3; font-size: 13px; outline: none; }
        .mantis-form-group input:focus, .mantis-form-group select:focus, .mantis-form-group textarea:focus { border-color: #f5a623; }
      `}</style>

      <div className="mantis-app">
        {/* SIDEBAR */}
        <aside className="mantis-sidebar">
          <div className="mantis-logo">
            <div className="mantis-logo-icon">M</div>
            <div>
              <div className="mantis-logo-text">MANTIS</div>
              <div style={{ fontSize: '10px', color: '#8b949e', textTransform: 'uppercase' }}>Mantenimiento</div>
            </div>
          </div>
          <nav className="mantis-nav">
            <div className="mantis-nav-section">Principal</div>
            <div className={`mantis-nav-item ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')}>
              📊 <span>Dashboard</span>
            </div>
            <div className={`mantis-nav-item ${currentPage === 'alerts' ? 'active' : ''}`} onClick={() => setCurrentPage('alerts')}>
              🔔 <span>Alertas</span>
              {alertCount > 0 && <span className="mantis-badge">{alertCount}</span>}
            </div>

            <div className="mantis-nav-section">Gestión</div>
            <div className={`mantis-nav-item ${currentPage === 'equipos' ? 'active' : ''}`} onClick={() => setCurrentPage('equipos')}>
              ⚙️ <span>Equipos</span>
            </div>
            <div className={`mantis-nav-item ${currentPage === 'plan' ? 'active' : ''}`} onClick={() => setCurrentPage('plan')}>
              📋 <span>Plan Mantenimiento</span>
            </div>
            <div className={`mantis-nav-item ${currentPage === 'registro' ? 'active' : ''}`} onClick={() => setCurrentPage('registro')}>
              ✅ <span>Registro</span>
            </div>

            <div className="mantis-nav-section">Configuración</div>
            <div className={`mantis-nav-item ${currentPage === 'sectores' ? 'active' : ''}`} onClick={() => setCurrentPage('sectores')}>
              🏭 <span>Sectores</span>
            </div>
          </nav>
        </aside>

        {/* MAIN */}
        <main className="mantis-main">
          <div className="mantis-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={() => navigate('/')} 
                className="mantis-btn mantis-btn-secondary"
                style={{ fontSize: '12px' }}
              >
                ← VOLVER AL MENÚ
              </button>
              <h2 style={{ fontSize: '22px', fontWeight: 700 }}>{pageTitles[currentPage]}</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={loadMockData}
                className="mantis-btn mantis-btn-primary"
                style={{ fontSize: '12px', background: '#f5a623', color: '#000', fontWeight: 'bold' }}
                title="Cargar datos de prueba para la demostración"
              >
                ⚡ CARGAR DATOS DEMO
              </button>
              <div style={{ fontSize: '13px', color: '#8b949e' }}>
                {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="mantis-content">
            {/* VISTA: DASHBOARD */}
            {currentPage === 'dashboard' && (() => {
              const vencidas = db.tareas.filter(t => diasHasta(t.vencimiento) < 0).length;
              const criticas = db.tareas.filter(t => { const d = diasHasta(t.vencimiento); return d >= 0 && d <= 7; }).length;
              const proximas = db.tareas.filter(t => { const d = diasHasta(t.vencimiento); return d > 7 && d <= 30; }).length;
              const regMes = db.registros.filter(r => r.fecha && new Date(r.fecha + 'T00:00:00').getMonth() === new Date().getMonth()).length;

              const alertas = db.tareas.map(t => ({ ...t, dias: diasHasta(t.vencimiento) })).filter(t => t.dias <= 15).sort((a,b) => a.dias - b.dias).slice(0, 5);
              const ultRegistros = [...db.registros].sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);

              return (
                <div>
                  <div className="mantis-kpi-grid">
                    <div className="mantis-kpi-card danger" style={{ cursor: 'pointer' }} onClick={() => { setPlanFilter('vencidas'); setCurrentPage('plan'); }}>
                      <div className="mantis-kpi-label">Vencidas</div>
                      <div className="mantis-kpi-value">{vencidas}</div>
                      <div style={{ fontSize: '12px', color: '#4d5766' }}>tareas sin realizar (ver todas →)</div>
                    </div>
                    <div className="mantis-kpi-card warn" style={{ cursor: 'pointer' }} onClick={() => { setPlanFilter('criticas'); setCurrentPage('plan'); }}>
                      <div className="mantis-kpi-label">Críticas (≤7 días)</div>
                      <div className="mantis-kpi-value">{criticas}</div>
                      <div style={{ fontSize: '12px', color: '#4d5766' }}>próxima semana (ver todas →)</div>
                    </div>
                    <div className="mantis-kpi-card info" style={{ cursor: 'pointer' }} onClick={() => { setPlanFilter('proximas'); setCurrentPage('plan'); }}>
                      <div className="mantis-kpi-label">Próximas (≤30d)</div>
                      <div className="mantis-kpi-value">{proximas}</div>
                      <div style={{ fontSize: '12px', color: '#4d5766' }}>en el mes (ver todas →)</div>
                    </div>
                    <div className="mantis-kpi-card ok" style={{ cursor: 'pointer' }} onClick={() => setCurrentPage('registro')}>
                      <div className="mantis-kpi-label">Realizadas este mes</div>
                      <div className="mantis-kpi-value">{regMes}</div>
                      <div style={{ fontSize: '12px', color: '#4d5766' }}>registros cargados (ver historial →)</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="mantis-card">
                      <div className="mantis-card-title">⚠️ Alertas Activas</div>
                      {alertas.length === 0 ? <p style={{ color: '#8b949e' }}>Sin alertas activas</p> : alertas.map(t => {
                        const eq = getEquipo(t.equipo);
                        const st = statusVenc(t.dias);
                        return (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #2a3547' }}>
                            <div>
                              <strong>{t.desc}</strong>
                              <div style={{ fontSize: '12px', color: '#8b949e' }}>{eq.nombre}</div>
                            </div>
                            <span className={`mantis-badge-status mantis-badge-${st}`}>{labelStatus(t.dias)}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mantis-card">
                      <div className="mantis-card-title">📝 Últimos Registros</div>
                      {ultRegistros.length === 0 ? <p style={{ color: '#8b949e' }}>Sin registros aún</p> : ultRegistros.map(r => {
                        const t = getTarea(r.tarea);
                        return (
                          <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid #2a3547' }}>
                            <div style={{ fontSize: '11px', color: '#4d5766' }}>{formatFecha(r.fecha)}</div>
                            <strong>{t.desc}</strong>
                            <div style={{ fontSize: '12px', color: '#8b949e' }}>Técnico: {r.tecnico || '—'}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* VISTA: ALERTAS */}
            {currentPage === 'alerts' && (() => {
              const alertas = db.tareas
                .map(t => ({ ...t, dias: diasHasta(t.vencimiento) }))
                .filter(t => t.dias <= 15)
                .sort((a,b) => a.dias - b.dias);

              return (
                <div>
                  {alertas.length === 0 ? (
                    <div className="mantis-card">
                      <p style={{ color: '#8b949e', textAlign: 'center', padding: '20px 0' }}>✅ Sin alertas activas. Todo el plan al día.</p>
                    </div>
                  ) : (
                    alertas.map(t => {
                      const eq = getEquipo(t.equipo);
                      const sec = getSector(eq.sector);
                      const st = statusVenc(t.dias);
                      return (
                        <div key={t.id} className="mantis-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '15px' }}>{t.desc}</strong>
                              <span className={`mantis-badge-status mantis-badge-${st}`}>{labelStatus(t.dias)}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '4px' }}>
                              Equipo: <b>{eq.nombre}</b> ({sec.nombre}) · Responsable: <b>{t.responsable || '—'}</b>
                            </div>
                            <div style={{ fontSize: '12px', color: '#4d5766', marginTop: '2px' }}>
                              Frecuencia: {t.frecuencia} · Próximo vencimiento: {formatFecha(t.vencimiento)}
                            </div>
                          </div>
                          <button className="mantis-btn mantis-btn-success" onClick={() => { setRegistroForm(r => ({ ...r, tarea: t.id })); setModalType('registro'); }}>
                            ✅ Registrar
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })()}

            {/* VISTA: REGISTRO */}
            {currentPage === 'registro' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  <button className="mantis-btn mantis-btn-primary" onClick={() => setModalType('registro')}>
                    + Nuevo Registro
                  </button>
                </div>
                <div className="mantis-card">
                  {db.registros.length === 0 ? (
                    <p style={{ color: '#8b949e', textAlign: 'center', padding: '20px 0' }}>📋 No hay mantenimientos registrados aún.</p>
                  ) : (
                    <table className="mantis-table">
                      <thead>
                        <tr><th>Fecha</th><th>Tarea / Descripción</th><th>Técnico</th><th>Duración</th><th>Estado</th><th>Observaciones</th></tr>
                      </thead>
                      <tbody>
                        {db.registros.map(r => {
                          const t = getTarea(r.tarea);
                          return (
                            <tr key={r.id}>
                              <td style={{ color: '#f5a623', fontWeight: 600 }}>{formatFecha(r.fecha)}</td>
                              <td><strong>{t.desc}</strong></td>
                              <td>{r.tecnico || '—'}</td>
                              <td>{r.duracion ? `${r.duracion} hs` : '—'}</td>
                              <td><span className="mantis-badge-status mantis-badge-ok">{r.estado}</span></td>
                              <td style={{ color: '#8b949e', fontSize: '12px' }}>{r.obs || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* VISTA: EQUIPOS */}
            {currentPage === 'equipos' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <input
                    placeholder="Buscar equipo..."
                    value={eqSearch}
                    onChange={(e) => setEqSearch(e.target.value)}
                    style={{ background: '#1c2230', border: '1px solid #2a3547', borderRadius: '6px', padding: '8px 12px', color: '#fff', width: '240px' }}
                  />
                  <button className="mantis-btn mantis-btn-primary" onClick={() => { setEditingId(null); setEquipoForm({ nombre: '', codigo: '', sector: '', marca: '', anio: '', estado: 'operativo', obs: '' }); setModalType('equipo'); }}>
                    + Nuevo Equipo
                  </button>
                </div>

                <div className="mantis-card">
                  <table className="mantis-table">
                    <thead>
                      <tr><th>Código</th><th>Equipo</th><th>Sector</th><th>Estado</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>
                      {db.equipos.filter(e => e.nombre.toLowerCase().includes(eqSearch.toLowerCase()) || e.codigo.toLowerCase().includes(eqSearch.toLowerCase())).map(eq => (
                        <tr key={eq.id}>
                          <td style={{ color: '#f5a623', fontWeight: 700 }}>{eq.codigo || '—'}</td>
                          <td><strong>{eq.nombre}</strong></td>
                          <td>{getSector(eq.sector).nombre}</td>
                          <td><span className={`mantis-badge-status mantis-badge-${eq.estado === 'operativo' ? 'ok' : 'danger'}`}>{eq.estado}</span></td>
                          <td>
                            <button className="mantis-btn mantis-btn-secondary mantis-btn-sm" onClick={() => { setEditingId(eq.id); setEquipoForm(eq); setModalType('equipo'); }}>✏️</button>
                            <button className="mantis-btn mantis-btn-danger mantis-btn-sm" style={{ marginLeft: '6px' }} onClick={() => handleDeleteEquipo(eq.id)}>🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VISTA: PLAN DE MANTENIMIENTO */}
            {currentPage === 'plan' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['todas', 'vencidas', 'criticas', 'proximas'].map(f => (
                      <button key={f} className={`mantis-btn ${planFilter === f ? 'mantis-btn-primary' : 'mantis-btn-secondary'}`} onClick={() => setPlanFilter(f)}>
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <button className="mantis-btn mantis-btn-primary" onClick={() => { setEditingId(null); setTareaForm({ desc: '', equipo: '', tipo: 'preventivo', frecuencia: 'mensual', vencimiento: '', responsable: '', duracion: '', insumos: '', proc: '' }); setModalType('tarea'); }}>
                    + Nueva Tarea
                  </button>
                </div>

                <div className="mantis-card">
                  <table className="mantis-table">
                    <thead>
                      <tr><th>Tarea</th><th>Equipo</th><th>Frecuencia</th><th>Vencimiento</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>
                      {db.tareas.filter(t => {
                        const d = diasHasta(t.vencimiento);
                        if (planFilter === 'vencidas') return d < 0;
                        if (planFilter === 'criticas') return d >= 0 && d <= 7;
                        if (planFilter === 'proximas') return d > 7 && d <= 30;
                        return true;
                      }).map(t => (
                        <tr key={t.id}>
                          <td><strong>{t.desc}</strong></td>
                          <td>{getEquipo(t.equipo).nombre}</td>
                          <td>{t.frecuencia}</td>
                          <td><span className={`mantis-badge-status mantis-badge-${statusVenc(diasHasta(t.vencimiento))}`}>{formatFecha(t.vencimiento)}</span></td>
                          <td>
                            <button className="mantis-btn mantis-btn-success mantis-btn-sm" onClick={() => { setRegistroForm(r => ({ ...r, tarea: t.id })); setModalType('registro'); }}>✅</button>
                            <button className="mantis-btn mantis-btn-secondary mantis-btn-sm" style={{ marginLeft: '6px' }} onClick={() => { setEditingId(t.id); setTareaForm(t); setModalType('tarea'); }}>✏️</button>
                            <button className="mantis-btn mantis-btn-danger mantis-btn-sm" style={{ marginLeft: '6px' }} onClick={() => handleDeleteTarea(t.id)}>🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VISTA: SECTORES */}
            {currentPage === 'sectores' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  <button className="mantis-btn mantis-btn-primary" onClick={() => { setEditingId(null); setSectorForm({ nombre: '', desc: '' }); setModalType('sector'); }}>
                    + Nuevo Sector
                  </button>
                </div>
                <div className="mantis-card">
                  <table className="mantis-table">
                    <thead>
                      <tr><th>Sector</th><th>Descripción</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>
                      {db.sectores.map(s => (
                        <tr key={s.id}>
                          <td><strong>{s.nombre}</strong></td>
                          <td>{s.desc || '—'}</td>
                          <td>
                            <button className="mantis-btn mantis-btn-secondary mantis-btn-sm" onClick={() => { setEditingId(s.id); setSectorForm(s); setModalType('sector'); }}>✏️</button>
                            <button className="mantis-btn mantis-btn-danger mantis-btn-sm" style={{ marginLeft: '6px' }} onClick={() => handleDeleteSector(s.id)}>🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL SECTOR */}
      {modalType === 'sector' && (
        <div className="mantis-modal-overlay">
          <form className="mantis-modal" onSubmit={handleSaveSector}>
            <h3>{editingId ? 'Editar Sector' : 'Nuevo Sector'}</h3>
            <div className="mantis-form-group" style={{ marginTop: '14px' }}>
              <label>Nombre del Sector</label>
              <input value={sectorForm.nombre} onChange={e => setSectorForm({ ...sectorForm, nombre: e.target.value })} required />
            </div>
            <div className="mantis-form-group" style={{ marginTop: '14px' }}>
              <label>Descripción</label>
              <textarea value={sectorForm.desc} onChange={e => setSectorForm({ ...sectorForm, desc: e.target.value })} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="mantis-btn mantis-btn-secondary" onClick={() => setModalType(null)}>Cancelar</button>
              <button type="submit" className="mantis-btn mantis-btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL EQUIPO */}
      {modalType === 'equipo' && (
        <div className="mantis-modal-overlay">
          <form className="mantis-modal" onSubmit={handleSaveEquipo}>
            <h3>{editingId ? 'Editar Equipo' : 'Nuevo Equipo'}</h3>
            <div className="mantis-form-grid" style={{ marginTop: '14px' }}>
              <div className="mantis-form-group">
                <label>Nombre Equipo</label>
                <input value={equipoForm.nombre} onChange={e => setEquipoForm({ ...equipoForm, nombre: e.target.value })} required />
              </div>
              <div className="mantis-form-group">
                <label>Código</label>
                <input value={equipoForm.codigo} onChange={e => setEquipoForm({ ...equipoForm, codigo: e.target.value })} />
              </div>
              <div className="mantis-form-group">
                <label>Sector</label>
                <select value={equipoForm.sector} onChange={e => setEquipoForm({ ...equipoForm, sector: e.target.value })}>
                  <option value="">Seleccionar Sector</option>
                  {db.sectores.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div className="mantis-form-group">
                <label>Estado</label>
                <select value={equipoForm.estado} onChange={e => setEquipoForm({ ...equipoForm, estado: e.target.value })}>
                  <option value="operativo">Operativo</option>
                  <option value="mantenimiento">En Mantenimiento</option>
                  <option value="fuera_servicio">Fuera de Servicio</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="mantis-btn mantis-btn-secondary" onClick={() => setModalType(null)}>Cancelar</button>
              <button type="submit" className="mantis-btn mantis-btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL TAREA */}
      {modalType === 'tarea' && (
        <div className="mantis-modal-overlay">
          <form className="mantis-modal" onSubmit={handleSaveTarea}>
            <h3>{editingId ? 'Editar Tarea' : 'Nueva Tarea de Mantenimiento'}</h3>
            <div className="mantis-form-grid" style={{ marginTop: '14px' }}>
              <div className="mantis-form-group full">
                <label>Descripción Tarea</label>
                <input value={tareaForm.desc} onChange={e => setTareaForm({ ...tareaForm, desc: e.target.value })} required />
              </div>
              <div className="mantis-form-group">
                <label>Equipo</label>
                <select value={tareaForm.equipo} onChange={e => setTareaForm({ ...tareaForm, equipo: e.target.value })} required>
                  <option value="">Seleccionar Equipo</option>
                  {db.equipos.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
                </select>
              </div>
              <div className="mantis-form-group">
                <label>Frecuencia</label>
                <select value={tareaForm.frecuencia} onChange={e => setTareaForm({ ...tareaForm, frecuencia: e.target.value })}>
                  {Object.keys(FREQ_DAYS).map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="mantis-form-group">
                <label>Próximo Vencimiento</label>
                <input type="date" value={tareaForm.vencimiento} onChange={e => setTareaForm({ ...tareaForm, vencimiento: e.target.value })} required />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="mantis-btn mantis-btn-secondary" onClick={() => setModalType(null)}>Cancelar</button>
              <button type="submit" className="mantis-btn mantis-btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL REGISTRO */}
      {modalType === 'registro' && (
        <div className="mantis-modal-overlay">
          <form className="mantis-modal" onSubmit={handleSaveRegistro}>
            <h3>Registrar Mantenimiento Realizado</h3>
            <div className="mantis-form-grid" style={{ marginTop: '14px' }}>
              <div className="mantis-form-group full">
                <label>Tarea</label>
                <select value={registroForm.tarea} onChange={e => setRegistroForm({ ...registroForm, tarea: e.target.value })} required>
                  <option value="">Seleccionar Tarea</option>
                  {db.tareas.map(t => <option key={t.id} value={t.id}>{t.desc}</option>)}
                </select>
              </div>
              <div className="mantis-form-group">
                <label>Fecha</label>
                <input type="date" value={registroForm.fecha} onChange={e => setRegistroForm({ ...registroForm, fecha: e.target.value })} required />
              </div>
              <div className="mantis-form-group">
                <label>Técnico</label>
                <input value={registroForm.tecnico} onChange={e => setRegistroForm({ ...registroForm, tecnico: e.target.value })} placeholder="Nombre del técnico" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="mantis-btn mantis-btn-secondary" onClick={() => setModalType(null)}>Cancelar</button>
              <button type="submit" className="mantis-btn mantis-btn-success">✅ Registrar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
