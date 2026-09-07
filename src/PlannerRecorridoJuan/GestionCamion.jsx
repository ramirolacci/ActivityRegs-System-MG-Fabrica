import React, { useEffect, useState } from 'react';
import { Truck, Fuel, CheckSquare, AlertTriangle, Save, Plus } from 'lucide-react';
import { supabase } from '../supabase';

const CAMIONES = [
  { patente: 'AF 123 MG', modelo: 'Mercedes-Benz Accelo 815' },
  { patente: 'AE 456 MG', modelo: 'Iveco Daily 70C17' },
  { patente: 'AD 789 MG', modelo: 'Ford Cargo 915' },
  { patente: 'AG 321 MG', modelo: 'Mercedes-Benz Atego 1419' }
];

export default function GestionCamion() {
  const [selectedPatente, setSelectedPatente] = useState(CAMIONES[0].patente);
  const [kmActual, setKmActual] = useState('');
  const [litros, setLitros] = useState('');
  const [monto, setMonto] = useState('');
  const [historialKm, setHistorialKm] = useState([]);
  const [incidentes, setIncidentes] = useState([]);
  const [nuevoIncidente, setNuevoIncidente] = useState('');

  // 1. Cargar historial desde registros de Supabase
  useEffect(() => {
    const fetchRegistrosCamion = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('registros')
          .select('datos')
          .eq('tipo', 'gestion_camion');

        if (!error && data && data.length > 0) {
          const kms = [];
          const incs = [];
          data.forEach(r => {
            if (r.datos && r.datos.patente === selectedPatente) {
              if (r.datos.tipoReg === 'km') kms.push(r.datos);
              if (r.datos.tipoReg === 'incidente') incs.push(r.datos);
            }
          });
          setHistorialKm(kms);
          setIncidentes(incs);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchRegistrosCamion();
  }, [selectedPatente]);

  const handleGuardarKm = async () => {
    if (!kmActual) return;
    const nuevoReg = {
      patente: selectedPatente,
      tipoReg: 'km',
      km: Number(kmActual),
      litros: litros ? Number(litros) : null,
      monto: monto ? Number(monto) : null,
      fecha: new Date().toLocaleDateString('es-AR')
    };

    setHistorialKm(prev => [nuevoReg, ...prev]);

    if (supabase) {
      try {
        await supabase.from('registros').insert([{
          tipo: 'gestion_camion',
          codigo: `km-${selectedPatente}-${Date.now()}`,
          datos: nuevoReg
        }]);
      } catch (e) { console.error(e); }
    }

    setKmActual('');
    setLitros('');
    setMonto('');
    alert('✅ Registro de kilometraje y combustible guardado.');
  };

  const handleReportarIncidente = async () => {
    if (!nuevoIncidente.trim()) return;
    const nuevoInc = {
      patente: selectedPatente,
      tipoReg: 'incidente',
      descripcion: nuevoIncidente.trim(),
      fecha: new Date().toLocaleDateString('es-AR')
    };

    setIncidentes(prev => [nuevoInc, ...prev]);

    if (supabase) {
      try {
        await supabase.from('registros').insert([{
          tipo: 'gestion_camion',
          codigo: `inc-${selectedPatente}-${Date.now()}`,
          datos: nuevoInc
        }]);
      } catch (e) { console.error(e); }
    }

    setNuevoIncidente('');
    alert('⚠️ Incidente reportado correctamente.');
  };

  const formatKmDisplay = (raw) => {
    if (!raw && raw !== 0) return '';
    const digits = raw.toString().replace(/\D/g, '');
    if (!digits) return '';
    return `${Number(digits).toLocaleString('es-AR')} km`;
  };

  const formatLitrosDisplay = (raw) => {
    if (!raw && raw !== 0) return '';
    const digits = raw.toString().replace(/\D/g, '');
    if (!digits) return '';
    return `${Number(digits).toLocaleString('es-AR')} Litros`;
  };

  return (
    <div style={{ background: 'transparent', padding: '0', color: '#e8ecef', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={20} color="#ffffff" /> Bitácora & Gestión de Camión
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9aa4ad' }}>Control de kilometraje, consumo de combustible, mantenimientos y reporte de incidentes</p>
        </div>

        <select
          value={selectedPatente}
          onChange={e => setSelectedPatente(e.target.value)}
          style={{ 
            background: '#171717', 
            border: '1px solid rgba(255,255,255,0.15)', 
            color: '#ffffff', 
            padding: '10px 16px', 
            borderRadius: '8px', 
            fontSize: '13px', 
            fontWeight: 700,
            outline: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          {CAMIONES.map(c => (
            <option key={c.patente} value={c.patente} style={{ background: '#171717', color: '#ffffff' }}>
              {c.patente} — {c.modelo}
            </option>
          ))}
        </select>
      </div>

      {/* Main Form Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Carga de Kilometraje / Combustible */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Fuel size={18} /> Carga de Kilometraje & Combustible
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#9aa4ad', fontWeight: 700 }}>Kilometraje Actual (km)</label>
              <input
                type="text"
                placeholder="Ej: 145.000 km"
                value={formatKmDisplay(kmActual)}
                onChange={e => setKmActual(e.target.value.replace(/\D/g, ''))}
                style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginTop: '6px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#9aa4ad', fontWeight: 700 }}>Litros de Combustible (opcional)</label>
              <input
                type="text"
                placeholder="Ej: 45 Litros"
                value={formatLitrosDisplay(litros)}
                onChange={e => setLitros(e.target.value.replace(/\D/g, ''))}
                style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginTop: '6px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <button
              type="button"
              onClick={handleGuardarKm}
              style={{ 
                background: '#38bdf8', 
                color: '#000000', 
                border: 'none', 
                padding: '10px 20px', 
                borderRadius: '8px', 
                fontSize: '13px', 
                fontWeight: 800, 
                cursor: 'pointer', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginTop: '8px',
                width: 'fit-content',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Save size={16} /> Guardar Kilometraje
            </button>
          </div>
        </div>

        {/* Reporte de Incidentes */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#e0a33a', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> Reporte de Incidentes / Novedades
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
            <textarea
              placeholder="Describí el problema mecánico, rayón o falla detectada..."
              value={nuevoIncidente}
              onChange={e => {
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
                setNuevoIncidente(e.target.value);
              }}
              rows={3}
              style={{ 
                width: '100%', 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                color: '#ffffff', 
                padding: '10px 12px', 
                borderRadius: '8px', 
                fontSize: '13px', 
                boxSizing: 'border-box', 
                fontFamily: 'inherit', 
                outline: 'none',
                resize: 'none',
                overflowY: 'hidden',
                minHeight: '90px'
              }}
            />

            <button
              type="button"
              onClick={handleReportarIncidente}
              style={{ 
                background: '#e0a33a', 
                color: '#000000', 
                border: 'none', 
                padding: '10px 20px', 
                borderRadius: '8px', 
                fontSize: '13px', 
                fontWeight: 800, 
                cursor: 'pointer', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px',
                width: 'fit-content',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Plus size={16} /> Reportar Incidente
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
