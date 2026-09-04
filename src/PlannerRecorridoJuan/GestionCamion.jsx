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

  return (
    <div style={{ background: '#14171a', border: '1px solid #242a30', borderRadius: '10px', padding: '20px', color: '#e8ecef', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#22c55e', fontSize: '18px', fontWeight: 800 }}>🚚 Bitácora & Gestión de Camión</h2>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9aa4ad' }}>Control de kilometraje, consumo de combustible, mantenimientos y reporte de incidentes</p>
        </div>

        <select
          value={selectedPatente}
          onChange={e => setSelectedPatente(e.target.value)}
          style={{ background: '#0d0f11', border: '1px solid #22c55e', color: '#22c55e', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 800 }}
        >
          {CAMIONES.map(c => (
            <option key={c.patente} value={c.patente}>{c.patente} — {c.modelo}</option>
          ))}
        </select>
      </div>

      {/* Main Form Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Carga de Kilometraje / Combustible */}
        <div style={{ background: '#0d0f11', border: '1px solid #242a30', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Fuel size={16} /> Carga de Kilometraje & Combustible
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#9aa4ad', fontWeight: 700 }}>Kilometraje Actual (km)</label>
              <input
                type="number"
                placeholder="Ej: 145000"
                value={kmActual}
                onChange={e => setKmActual(e.target.value)}
                style={{ width: '100%', background: '#14171a', border: '1px solid #242a30', color: '#e8ecef', padding: '10px', borderRadius: '6px', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#9aa4ad', fontWeight: 700 }}>Litros de Combustible (opcional)</label>
              <input
                type="number"
                placeholder="Ej: 45"
                value={litros}
                onChange={e => setLitros(e.target.value)}
                style={{ width: '100%', background: '#14171a', border: '1px solid #242a30', color: '#e8ecef', padding: '10px', borderRadius: '6px', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="button"
              onClick={handleGuardarKm}
              style={{ background: '#22c55e', color: '#06210f', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}
            >
              <Save size={16} /> Guardar Kilometraje
            </button>
          </div>
        </div>

        {/* Reporte de Incidentes */}
        <div style={{ background: '#0d0f11', border: '1px solid #242a30', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#e0a33a', marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} /> Reporte de Incidentes / Novedades
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            <textarea
              placeholder="Describí el problema mecánico, rayón o falla detectada..."
              value={nuevoIncidente}
              onChange={e => setNuevoIncidente(e.target.value)}
              rows={4}
              style={{ width: '100%', background: '#14171a', border: '1px solid #242a30', color: '#e8ecef', padding: '10px', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />

            <button
              type="button"
              onClick={handleReportarIncidente}
              style={{ background: '#e0a33a', color: '#06210f', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Reportar Incidente
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
