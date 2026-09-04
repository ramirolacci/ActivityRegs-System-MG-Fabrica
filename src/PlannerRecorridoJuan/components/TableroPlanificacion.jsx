import React from 'react';
import { Upload, CheckCircle, Truck, Package, Layers, MapPin } from 'lucide-react';
import { RECORRIDO_MAP_COLORS } from './MapaLocalesGPS';

export default function TableroPlanificacion({
  recorridos = [],
  pedidoData = null,
  onFileUpload = () => {},
  onMoveLocal = () => {},
  onAprobar = () => {},
  onEnviarControl = () => {}
}) {
  const calculateCarrosLocal = (dataliveName) => {
    if (!pedidoData) return 0;
    const empCount = pedidoData.empanadas ? Object.values(pedidoData.empanadas[dataliveName] || {}).reduce((a, b) => a + b, 0) : 0;
    const bandejas = Math.ceil(empCount / 12);
    return Math.ceil(bandejas / 18);
  };

  const calculateTotalCarrosVuelta = (localesList) => {
    return localesList.reduce((sum, l) => sum + calculateCarrosLocal(l), 0);
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Action Bar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#14171a', border: '1px solid #242a30', borderRadius: '10px', padding: '14px 20px', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#3ecf8e' }}>📋 Armado de Recorridos & Cargas</h2>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9aa4ad' }}>Gestión operativa de camiones, vueltas y distribución por sucursal</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ background: '#1b1f23', border: '1px solid #242a30', color: '#e8ecef', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={15} />
            <span>Cargar pedido (Excel/HTML)</span>
            <input type="file" accept=".xls,.xlsx,.html" onChange={onFileUpload} style={{ display: 'none' }} />
          </label>

          <button
            type="button"
            onClick={onAprobar}
            style={{ background: 'rgba(62, 207, 142, 0.15)', color: '#3ecf8e', border: '1px solid #3ecf8e', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckCircle size={15} />
            <span>Aprobar Armado</span>
          </button>

          <button
            type="button"
            onClick={onEnviarControl}
            style={{ background: '#3ecf8e', color: '#06210f', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Truck size={15} />
            <span>Enviar a Control de Vueltas</span>
          </button>
        </div>
      </div>

      {/* Recorridos Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {recorridos.map((rec) => {
          const color = RECORRIDO_MAP_COLORS[rec.id] || '#3ecf8e';

          return (
            <div key={rec.id} style={{ background: '#14171a', border: '1px solid #242a30', borderRadius: '10px', overflow: 'hidden' }}>
              
              {/* Recorrido Header */}
              <div style={{ padding: '12px 16px', background: '#1b1f23', borderBottom: '1px solid #242a30', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color }}>{rec.nombre}</span>
                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '12px', color: '#9aa4ad', fontWeight: 700 }}>
                  Capacidad: {rec.capacidadCamion || 12} carros
                </span>
              </div>

              {/* Vueltas Container */}
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {rec.vueltas.map((vuelta, vIdx) => {
                  const totalCarros = calculateTotalCarrosVuelta(vuelta.locales);
                  const isOverCap = totalCarros > (rec.capacidadCamion || 12);

                  return (
                    <div key={vIdx} style={{ background: '#0d0f11', border: `1px solid ${isOverCap ? '#e5484d' : '#22272c'}`, borderRadius: '8px', padding: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#e8ecef' }}>Vuelta {vIdx + 1}</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: isOverCap ? '#e5484d' : '#e0a33a' }}>
                          {totalCarros} / {rec.capacidadCamion || 12} carros
                        </span>
                      </div>

                      {/* Store Chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '38px', background: '#14171a', padding: '6px', borderRadius: '6px' }}>
                        {vuelta.locales.length === 0 ? (
                          <span style={{ fontSize: '11px', color: '#5f6b75', fontStyle: 'italic', width: '100%', textAlign: 'center', paddingTop: '6px' }}>
                            Sin sucursales en esta vuelta
                          </span>
                        ) : (
                          vuelta.locales.map((local) => {
                            const carros = calculateCarrosLocal(local);
                            return (
                              <div
                                key={local}
                                style={{
                                  background: color,
                                  color: '#06210f',
                                  padding: '4px 8px',
                                  borderRadius: '20px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  cursor: 'grab'
                                }}
                              >
                                <span>{local}</span>
                                {carros > 0 && (
                                  <span style={{ background: 'rgba(0,0,0,0.25)', padding: '1px 5px', borderRadius: '10px', fontSize: '9px' }}>
                                    {carros}c
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
