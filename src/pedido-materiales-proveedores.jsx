import React, { useState, useEffect, useRef } from 'react';
import {
  Trash2, Calendar, RefreshCw, ArrowLeft, Plus, X, Send, Check, Download, Printer,
  Carrot, Milk, Sandwich, Beef, Package, Egg, Snowflake, MoreHorizontal, CircleDot,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { supabase } from './supabase';

const SECTORES = [
  { key: 'recepcion', label: 'Recepción de Proveedores', turnos: ['TM', 'TT'] },
  { key: 'carnes', label: 'Mesa de Carnes', turnos: ['TM', 'TT'] },
  { key: 'cocina', label: 'Cocina', turnos: ['TM', 'TT', 'TN'] },
  { key: 'picadillo', label: 'Picadillo', turnos: ['TM', 'TT', 'TN'] },
  { key: 'salsas', label: 'Salsas', turnos: ['TM', 'TT'] },
  { key: 'armado', label: 'Armado', turnos: ['TM', 'TT', 'TN'] },
  { key: 'logistica', label: 'Logística', turnos: ['TM', 'TT', 'TN'] },
];

const CATEGORIAS = [
  { key: 'VERDURAS', icon: Carrot },
  { key: 'QUESOS', icon: CircleDot },
  { key: 'FIAMBRES', icon: Sandwich },
  { key: 'CARNES', icon: Beef },
  { key: 'SECOS', icon: Package },
  { key: 'LACTEOS', icon: Milk },
  { key: 'HUEVOS', icon: Egg },
  { key: 'CONGELADOS', icon: Snowflake },
  { key: 'OTROS', icon: MoreHorizontal },
];

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const GRIS_FONDO = '#c9c9c9';
const GRIS_CLARO = '#f2f2f2';
const NEGRO = '#000000';

function formatFechaEs(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const shortYear = String(y).slice(-2);
  return `${DIAS[dt.getDay()]} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${shortYear}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatHora(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function PedidoMateriales({ activeSector }) {
  const sectorKeyMap = {
    'proveedores': 'recepcion',
    'mesa-carnes': 'carnes',
    'cocina': 'cocina',
    'picadillo': 'picadillo',
    'armado': 'armado',
    'salsas': 'salsas',
    'logistica': 'logistica'
  };

  const currentSectorKey = activeSector ? (sectorKeyMap[activeSector] || activeSector) : 'cocina';
  const sectorObj = SECTORES.find((s) => s.key === currentSectorKey) || SECTORES[0];

  const isProveedoresView = activeSector === 'proveedores';

  const [fecha, setFecha] = useState(todayISO());
  const [items, setItems] = useState([]);
  const [allSectorsData, setAllSectorsData] = useState({});
  const [activeTurno, setActiveTurno] = useState(sectorObj.turnos[0]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastAddedId, setLastAddedId] = useState(null);
  const [sentStatus, setSentStatus] = useState(false);
  const saveTimer = useRef(null);

  const handleSendToProveedores = async () => {
    await persist(items);

    if (supabase) {
      try {
        const sectorNombre = sectorObj ? sectorObj.label : (activeSector || 'Sector');
        const now = new Date();
        const formattedTime = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const notifPayload = {
          tipo: 'pedido_materiales_proveedores',
          type: 'pedido_materiales_proveedores',
          target_sector: 'proveedores',
          targetSector: 'proveedores',
          target_sector_name: sectorNombre,
          emitterName: sectorNombre,
          message: `Pedido de materiales recibido de ${sectorNombre}`,
          details: `Se registró un nuevo pedido de materiales a proveedores el ${formatFechaEs(fecha)}.`,
          timestamp: formattedTime,
          seen: false
        };

        const { error: notifErr } = await supabase.from('notificaciones').insert([notifPayload]);
        if (notifErr) {
          console.error('Error insertando notificacion en Supabase:', notifErr);
        }
      } catch (e) {
        console.error('Error enviando notificacion a proveedores:', e);
      }
    }

    setSentStatus(true);
    setTimeout(() => setSentStatus(false), 3000);
  };

  const storageKey = `pedido-${sectorObj.key}-${fecha}`;

  useEffect(() => {
    setActiveTurno(sectorObj.turnos[0]);
  }, [sectorObj.key]);

  const loadData = async (key) => {
    setLoading(true);
    try {
      if (isProveedoresView) {
        // Carga consolidada de TODOS los sectores para Proveedores
        const consolidated = {};
        SECTORES.forEach(s => {
          const lKey = `pedido-${s.key}-${fecha}`;
          const local = localStorage.getItem(lKey);
          if (local) {
            try {
              const parsed = JSON.parse(local);
              if (parsed.items && parsed.items.length > 0) {
                consolidated[s.key] = parsed;
              }
            } catch (e) {}
          }
        });

        if (supabase) {
          const { data: remoteRecords } = await supabase
            .from('registros')
            .select('sector, datos, updated_at, codigo')
            .eq('tipo', 'pedido_materiales_proveedores')
            .eq('fecha', fecha);

          if (remoteRecords && remoteRecords.length > 0) {
            remoteRecords.forEach(r => {
              if (r.datos && r.datos.length > 0) {
                const sKey = r.sector || (r.codigo ? r.codigo.split('-')[1] : null);
                if (sKey) {
                  consolidated[sKey] = { items: r.datos, updatedAt: r.updated_at };
                }
              }
            });
          }
        }
        setAllSectorsData(consolidated);
      } else {
        // Carga normal para sector individual
        let loadedItems = null;
        let loadedUpdatedAt = null;

        const local = localStorage.getItem(key);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            loadedItems = parsed.items;
            loadedUpdatedAt = parsed.updatedAt;
          } catch (e) {}
        }

        if (supabase) {
          const { data: remoteData } = await supabase
            .from('registros')
            .select('datos, updated_at')
            .eq('tipo', 'pedido_materiales_proveedores')
            .eq('codigo', key)
            .maybeSingle();

          if (remoteData && remoteData.datos) {
            loadedItems = remoteData.datos;
            loadedUpdatedAt = remoteData.updated_at || loadedUpdatedAt;
          }
        }

        setItems(loadedItems || []);
        setLastUpdated(loadedUpdatedAt || null);
      }
    } catch (err) {
      setItems([]);
      setLastUpdated(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(storageKey);

    if (!supabase) return;

    const channel = supabase
      .channel(`pedido-rt-${fecha}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registros', filter: `tipo=eq.pedido_materiales_proveedores` },
        () => {
          loadData(storageKey);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, isProveedoresView, fecha]);

  const persist = async (nextItems) => {
    if (!storageKey) return;
    setSaveStatus('saving');
    const updatedAt = new Date().toISOString();
    try {
      const payload = { items: nextItems, updatedAt };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setLastUpdated(updatedAt);

      if (supabase) {
        const { data: existing } = await supabase
          .from('registros')
          .select('id')
          .eq('tipo', 'pedido_materiales_proveedores')
          .eq('codigo', storageKey)
          .maybeSingle();

        if (existing?.id) {
          await supabase
            .from('registros')
            .update({ datos: nextItems, updated_at: updatedAt })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('registros')
            .insert([{ 
              tipo: 'pedido_materiales_proveedores', 
              codigo: storageKey,
              sector: sectorObj.key,
              fecha: fecha,
              datos: nextItems, 
              updated_at: updatedAt 
            }]);
        }
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error('Error guardando pedido:', err);
      setSaveStatus('error');
    }
    setTimeout(() => setSaveStatus((s) => (s === 'saving' ? s : null)), 2500);
  };

  const debouncedSave = (nextItems) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(nextItems), 800);
  };

  const addItem = (turno, categoria) => {
    const id = genId();
    setItems((prev) => {
      const next = [...prev, { id, turno, categoria, item: '', cantidad: '' }];
      debouncedSave(next);
      return next;
    });
    setLastAddedId(id);
  };

  const updateItem = (id, field, value) => {
    setItems((prev) => {
      const next = prev.map((it) => (it.id === id ? { ...it, [field]: value } : it));
      debouncedSave(next);
      return next;
    });
  };

  const removeItem = (id) => {
    setItems((prev) => {
      const next = prev.filter((it) => it.id !== id);
      debouncedSave(next);
      return next;
    });
  };

  const itemsFor = (turno, categoria) => items.filter((it) => it.turno === turno && it.categoria === categoria);
  const turnoTieneItems = (turno) => items.some((it) => it.turno === turno && (it.item.trim() || it.cantidad.trim()));

  const buildSectorHtml = (sObj, sectorItems, sUpdatedAt) => {
    let turnoRowsHtml = '';
    sObj.turnos.forEach((turno) => {
      const turnItems = sectorItems.filter((it) => it.turno === turno);
      const cats = CATEGORIAS.filter((c) =>
        turnItems.some((it) => it.categoria === c.key && (it.item.trim() || it.cantidad.trim()))
      );
      if (cats.length === 0) return;
      let catRows = '';
      cats.forEach((c) => {
        const its = turnItems.filter((it) => it.categoria === c.key && (it.item.trim() || it.cantidad.trim()));
        let itemLines = its
          .map(
            (it) => `
          <tr>
            <td style="padding:0 0 3px 22px; font-size:13px; color:${NEGRO}; font-family:Arial, Helvetica, sans-serif;">
              — ${escapeHtml(it.item.trim() || '(sin especificar)')}${it.cantidad.trim() ? `: <b>${escapeHtml(it.cantidad.trim())}</b>` : ''}
            </td>
          </tr>`
          )
          .join('');
        catRows += `
          <tr>
            <td style="padding:6px 0 2px 12px; font-size:13px; font-weight:bold; color:${NEGRO}; font-family:Arial, Helvetica, sans-serif;">${c.key}</td>
          </tr>
          ${itemLines}`;
      });
      turnoRowsHtml += `
        <tr>
          <td style="padding:0 0 12px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${GRIS_CLARO}" style="background-color:${GRIS_CLARO};">
              <tr>
                <td style="padding:10px 12px 2px 12px; font-size:14px; font-weight:bold; color:${NEGRO}; font-family:Arial, Helvetica, sans-serif;">Turno ${turno}</td>
              </tr>
              ${catRows}
              <tr><td style="padding-bottom:6px;"></td></tr>
            </table>
          </td>
        </tr>`;
    });

    if (!turnoRowsHtml) return '';

    return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${GRIS_FONDO}" style="background-color:${GRIS_FONDO}; font-family:Arial, Helvetica, sans-serif; margin-bottom:16px;">
  <tr>
    <td style="padding:16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:17px; font-weight:bold; color:${NEGRO}; font-family:Arial, Helvetica, sans-serif; padding-bottom:2px;">SECTOR: ${escapeHtml(sObj.label).toUpperCase()}</td>
        </tr>
        <tr>
          <td style="font-size:12px; font-weight:bold; color:${NEGRO}; font-family:Arial, Helvetica, sans-serif; padding-bottom:12px;">Última actualización: ${formatHora(sUpdatedAt) || 'N/A'} hs</td>
        </tr>
        ${turnoRowsHtml}
      </table>
    </td>
  </tr>
</table>`.trim();
  };

  const buildHtml = () => {
    if (isProveedoresView) {
      let fullHtml = '';
      SECTORES.forEach(s => {
        const sData = allSectorsData[s.key];
        if (sData && sData.items && sData.items.length > 0) {
          fullHtml += buildSectorHtml(s, sData.items, sData.updatedAt);
        }
      });
      return fullHtml;
    }
    return buildSectorHtml(sectorObj, items, lastUpdated);
  };

  const handleReset = async () => {
    if (!confirm('¿Borrar el pedido de hoy de este sector? Esto lo van a ver todos los que usan este link.')) return;
    setItems([]);
    try {
      localStorage.removeItem(storageKey);
      if (supabase) {
        await supabase
          .from('registros')
          .delete()
          .eq('tipo', 'pedido_materiales_proveedores')
          .eq('codigo', storageKey);
      }
    } catch (err) {
      // no-op
    }
    setLastUpdated(null);
  };

  const handleResetAllSectors = async () => {
    if (!confirm('¿Estás seguro de que deseas limpiar TODOS los pedidos de materiales cargados para la fecha seleccionada?\n\nEsta acción afectará a todos los sectores.')) return;
    setAllSectorsData({});
    try {
      SECTORES.forEach(s => {
        localStorage.removeItem(`pedido-${s.key}-${fecha}`);
      });
      if (supabase) {
        await supabase
          .from('registros')
          .delete()
          .eq('tipo', 'pedido_materiales_proveedores')
          .eq('fecha', fecha);
      }
    } catch (err) {
      console.error('Error limpiando todos los pedidos:', err);
    }
  };

  const handleRefresh = () => loadData(storageKey);

  const handleGeneratePDF = (action = 'save') => {
    const htmlContent = buildHtml();
    if (!htmlContent) {
      alert('No hay pedidos cargados para la fecha seleccionada.');
      return;
    }

    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.color = '#000';
    container.style.backgroundColor = '#ffffff';

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
        <h1 style="margin: 0; font-size: 22px; text-transform: uppercase;">CONSOLIDADO DE PEDIDOS DE MATERIALES A PROVEEDORES</h1>
        <h3 style="margin: 5px 0 0 0; font-size: 14px; color: #555;">FECHA: ${formatFechaEs(fecha)}</h3>
      </div>
      <div>${htmlContent}</div>
    `;

    const opt = {
      margin: 10,
      filename: `Pedido_Materiales_${fecha}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (action === 'print') {
      html2pdf().set(opt).from(container).toPdf().get('pdf').then((pdf) => {
        pdf.autoPrint();
        window.open(pdf.output('bloburl'), '_blank');
      });
    } else {
      html2pdf().set(opt).from(container).save();
    }
  };

  // ---------- FORMULARIO DEL SECTOR ----------
  return (
    <div className="novedades-page">
      <div>
        <div className="novedades-header">
          <h2>Pedido de Materiales a Proveedores {!isProveedoresView ? `- ${sectorObj.label}` : '- Consolidado Planta'}</h2>
          <p>
            {!isProveedoresView 
              ? `Cargá los materiales que necesitás para el turno en el sector ${sectorObj.label}.`
              : 'Consolidado general de pedidos de materiales de todos los sectores de planta.'}
          </p>
        </div>

        <div className="novedades-grid" style={{ gridTemplateColumns: !isProveedoresView ? '1fr 380px' : '1fr', gap: '1.5rem', display: 'grid' }}>
          <div className="novedades-form-panel">
            <div className="novedades-controls-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} style={{ color: 'var(--accent)' }} />
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="novedades-date-input"
                />
                <span className="novedades-date-text">{formatFechaEs(fecha)}</span>
              </div>

              <button
                onClick={handleRefresh}
                className="novedades-refresh-btn"
                title="Actualizar pedidos de la fecha"
              >
                <RefreshCw size={12} /> Actualizar
              </button>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {isProveedoresView && (
                  <>
                    <button
                      onClick={handleResetAllSectors}
                      className="novedades-action-btn"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                      title="Limpiar los pedidos del día"
                    >
                      <Trash2 size={14} /> Limpiar
                    </button>
                    <button
                      onClick={() => handleGeneratePDF('print')}
                      className="novedades-action-btn"
                      title="Imprimir pedido consolidado"
                    >
                      <Printer size={14} /> Imprimir
                    </button>
                    <button
                      onClick={() => handleGeneratePDF('save')}
                      className="novedades-action-btn primary"
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                      }}
                      title="Descargar PDF del pedido"
                    >
                      <Download size={14} /> Descargar PDF
                    </button>
                  </>
                )}

                {!isProveedoresView && (
                  <>
                    <button
                      onClick={handleReset}
                      className="novedades-action-btn"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                    >
                      <Trash2 size={14} /> Limpiar
                    </button>
                    <button
                      onClick={handleSendToProveedores}
                      className="novedades-action-btn primary"
                      style={{
                        background: sentStatus ? '#10b981' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        padding: '0.6rem 1.2rem',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        border: 'none'
                      }}
                    >
                      {sentStatus ? <Check size={16} /> : <Send size={16} />}
                      {sentStatus ? '¡Pedido Enviado!' : 'Enviar pedido a Proveedores'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="novedades-status-text" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
              {loading
                ? 'Cargando pedidos…'
                : saveStatus === 'saving'
                ? 'Guardando…'
                : saveStatus === 'error'
                ? 'No se pudo guardar.'
                : lastUpdated
                ? `Última actualización: ${formatHora(lastUpdated)} hs`
                : 'Sin cambios recargados hoy.'}
            </div>

            {!isProveedoresView ? (
              <div className="novedades-sector-card" style={{ marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {sectorObj.turnos.map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTurno(t)}
                      className={`novedades-action-btn ${activeTurno === t ? 'primary' : ''}`}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '0.85rem'
                      }}
                    >
                      Turno {t}
                      {turnoTieneItems(t) && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', marginLeft: '6px', display: 'inline-block' }} />}
                    </button>
                  ))}
                </div>

                <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.75rem' }}>
                  Seleccioná una categoría para registrar insumos del <strong>Turno {activeTurno}</strong>:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  {CATEGORIAS.map((c) => {
                    const Icon = c.icon;
                    const count = itemsFor(activeTurno, c.key).length;
                    return (
                      <button
                        key={c.key}
                        onClick={() => addItem(activeTurno, c.key)}
                        disabled={loading}
                        className="novedades-action-btn"
                        style={{
                          flexDirection: 'column',
                          gap: '0.4rem',
                          padding: '0.75rem 0.4rem',
                          justifyContent: 'center',
                          position: 'relative',
                          background: count > 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.25)',
                          borderColor: count > 0 ? 'var(--accent)' : 'rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        {count > 0 && (
                          <span style={{ position: 'absolute', top: '4px', right: '6px', background: 'var(--accent)', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {count}
                          </span>
                        )}
                        <Icon size={18} style={{ color: 'var(--accent)' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: '600' }}>{c.key}</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {CATEGORIAS.filter((c) => itemsFor(activeTurno, c.key).length > 0).map((c) => (
                    <div key={c.key} style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <c.icon size={14} style={{ color: 'var(--accent)' }} />
                          <strong style={{ fontSize: '0.8rem', color: '#fff' }}>{c.key}</strong>
                        </div>
                        <button
                          onClick={() => addItem(activeTurno, c.key)}
                          className="novedades-action-btn"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                        >
                          <Plus size={12} /> Agregar
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {itemsFor(activeTurno, c.key).map((it) => (
                          <div key={it.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={it.item}
                              onChange={(e) => updateItem(it.id, 'item', e.target.value)}
                              placeholder="Producto necesitado..."
                              autoFocus={it.id === lastAddedId}
                              className="novedades-textarea"
                              style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.82rem', height: 'auto', borderRadius: '6px' }}
                            />
                            <input
                              type="text"
                              value={it.cantidad}
                              onChange={(e) => updateItem(it.id, 'cantidad', e.target.value)}
                              placeholder="Cant. (ej: 10 kg)"
                              className="novedades-textarea"
                              style={{ width: '120px', padding: '0.5rem 0.75rem', fontSize: '0.82rem', height: 'auto', borderRadius: '6px' }}
                            />
                            <button
                              onClick={() => removeItem(it.id)}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                              title="Eliminar"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="novedades-preview-wrapper" style={{ backgroundColor: GRIS_FONDO, borderRadius: '8px', overflow: 'hidden' }}>
                {Object.keys(allSectorsData).length === 0 ? (
                  <p className="text-neutral-700 text-sm italic p-6">No hay pedidos registrados de ningún sector para hoy.</p>
                ) : (
                  <div className="p-1" dangerouslySetInnerHTML={{ __html: buildHtml() }} />
                )}
              </div>
            )}
          </div>

          {!isProveedoresView && (
            <div className="novedades-sidebar">
              <div className="novedades-preview-wrapper" style={{ backgroundColor: GRIS_FONDO, borderRadius: '8px', overflow: 'hidden' }}>
                {items.filter((it) => it.item.trim() || it.cantidad.trim()).length === 0 ? (
                  <p className="text-neutral-700 text-sm italic p-6">Todavía no cargaste materiales para este pedido.</p>
                ) : (
                  <div className="p-1" dangerouslySetInnerHTML={{ __html: buildHtml() }} />
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.5rem' }}>
                Vista previa consolidada para proveedores.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
