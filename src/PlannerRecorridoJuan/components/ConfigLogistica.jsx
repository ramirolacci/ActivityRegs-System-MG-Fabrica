import React, { useState } from 'react';
import { Save, Plus, Trash2, Settings, Store, Package } from 'lucide-react';

export default function ConfigLogistica({ config = { locales: [], productos: [] }, onSaveConfig = () => {} }) {
  const [activeTab, setActiveTab] = useState('locales');
  const [locales, setLocales] = useState(config.locales || []);
  const [productos, setProductos] = useState(config.productos || []);

  const [newLocDatalive, setNewLocDatalive] = useState('');
  const [newLocExcel, setNewLocExcel] = useState('');
  const [newLocRecorrido, setNewLocRecorrido] = useState(1);

  const handleAddLocal = () => {
    if (!newLocDatalive.trim()) return;
    const updated = [...locales, { datalive: newLocDatalive.trim(), excel: newLocExcel.trim() || newLocDatalive.trim(), recorridoId: Number(newLocRecorrido) }];
    setLocales(updated);
    setNewLocDatalive('');
    setNewLocExcel('');
    onSaveConfig({ locales: updated, productos });
  };

  const handleDeleteLocal = (index) => {
    const updated = locales.filter((_, i) => i !== index);
    setLocales(updated);
    onSaveConfig({ locales: updated, productos });
  };

  return (
    <div style={{ background: '#14171a', border: '1px solid #242a30', borderRadius: '10px', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#4d94d6', fontSize: '16px', fontWeight: 800 }}>⚙️ Configuración de Logística</h2>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9aa4ad' }}>Asignación permanente de sucursales a recorridos y mapeo de productos</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('locales')}
            style={{
              background: activeTab === 'locales' ? 'rgba(77, 148, 214, 0.15)' : 'transparent',
              color: activeTab === 'locales' ? '#4d94d6' : '#9aa4ad',
              border: activeTab === 'locales' ? '1px solid #4d94d6' : '1px solid #242a30',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            👥 LOCALES
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('productos')}
            style={{
              background: activeTab === 'productos' ? 'rgba(77, 148, 214, 0.15)' : 'transparent',
              color: activeTab === 'productos' ? '#4d94d6' : '#9aa4ad',
              border: activeTab === 'productos' ? '1px solid #4d94d6' : '1px solid #242a30',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            📦 MERCADERÍA
          </button>
        </div>
      </div>

      {activeTab === 'locales' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              placeholder="Nombre Datalive"
              value={newLocDatalive}
              onChange={e => setNewLocDatalive(e.target.value)}
              style={{ background: '#0d0f11', border: '1px solid #242a30', color: '#e8ecef', padding: '8px', borderRadius: '6px', fontSize: '12px', flex: 1 }}
            />
            <input
              placeholder="Nombre Excel"
              value={newLocExcel}
              onChange={e => setNewLocExcel(e.target.value)}
              style={{ background: '#0d0f11', border: '1px solid #242a30', color: '#e8ecef', padding: '8px', borderRadius: '6px', fontSize: '12px', flex: 1 }}
            />
            <select
              value={newLocRecorrido}
              onChange={e => setNewLocRecorrido(e.target.value)}
              style={{ background: '#0d0f11', border: '1px solid #242a30', color: '#e8ecef', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
            >
              <option value="1">CABA</option>
              <option value="2">CAMPANA</option>
              <option value="3">Z. NORTE</option>
              <option value="4">4TO CAMIÓN</option>
            </select>
            <button
              type="button"
              onClick={handleAddLocal}
              style={{ background: '#3ecf8e', color: '#06210f', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} /> AGREGAR
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#e8ecef' }}>
            <thead>
              <tr style={{ background: '#1b1f23', borderBottom: '1px solid #242a30', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>LOCAL (DATALIVE)</th>
                <th style={{ padding: '8px' }}>NOMBRE EXCEL</th>
                <th style={{ padding: '8px' }}>RECORRIDO</th>
                <th style={{ padding: '8px', width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {locales.map((loc, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #22272c' }}>
                  <td style={{ padding: '8px' }}>{loc.datalive}</td>
                  <td style={{ padding: '8px' }}>{loc.excel}</td>
                  <td style={{ padding: '8px', color: '#3ecf8e', fontWeight: 700 }}>
                    {loc.recorridoId === 1 ? 'CABA' : loc.recorridoId === 2 ? 'CAMPANA' : loc.recorridoId === 3 ? 'Z. NORTE' : '4TO CAMIÓN'}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteLocal(idx)}
                      style={{ background: 'transparent', border: 'none', color: '#e5484d', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
