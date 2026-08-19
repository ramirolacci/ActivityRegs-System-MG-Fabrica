import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Calendar, RefreshCw, Send, Check, Copy, ClipboardType } from 'lucide-react';
import { supabase } from './supabase';

const SECTORES = [
  { key: 'recepcion', label: 'Recepción de Proveedores', turnos: ['TM', 'TT'] },
  { key: 'carnes', label: 'Mesa de Carnes', turnos: ['TM', 'TT'] },
  { key: 'cocina', label: 'Cocina', turnos: ['TM', 'TT', 'TN'] },
  { key: 'picadillo', label: 'Picadillo', turnos: ['TM', 'TT', 'TN'] },
  { key: 'salsas', label: 'Salsas', turnos: ['TM', 'TT'] },
  { key: 'armado', label: 'Armado', turnos: ['TM', 'TT', 'TN'] },
  { key: 'bacha', label: 'Bacha', turnos: ['TM', 'TT', 'TN'] },
  { key: 'logistica', label: 'Logística', turnos: ['TM', 'TT', 'TN'] },
];

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const GRIS_FONDO = '#c9c9c9';
const GRIS_CLARO = '#f2f2f2';
const NEGRO = '#000000';

function formatFechaEs(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const diaSemana = DIAS[dt.getDay()];
  return `${diaSemana} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatHora(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function NovedadesTemplate({ activeSector }) {
  const [fecha, setFecha] = useState(todayISO());
  const [data, setData] = useState({});
  const [hideEmpty, setHideEmpty] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sentStatus, setSentStatus] = useState(false);
  const [copiedRich, setCopiedRich] = useState(false);
  const [copiedPlain, setCopiedPlain] = useState(false);
  const saveTimer = useRef(null);

  // Mapeo entre id de activeSector del sistema y key de Novedades
  const sectorKeyMap = {
    'proveedores': 'recepcion',
    'mesa-carnes': 'carnes',
    'cocina': 'cocina',
    'picadillo': 'picadillo',
    'armado': 'armado',
    'salsas': 'salsas',
    'logistica': 'logistica'
  };

  // Determinar los sectores visibles segun el modulo activo (Producción ve todos)
  const currentKey = activeSector ? sectorKeyMap[activeSector] || activeSector : null;
  const sectoresVisibles = activeSector === 'produccion' || !activeSector
    ? SECTORES
    : SECTORES.filter(s => s.key === currentKey);

  const storageKey = `novedades-${fecha}`;

  const loadForDate = async (f) => {
    setLoading(true);
    try {
      const key = `novedades-${f}`;
      let loadedFields = {};
      let loadedUpdatedAt = null;

      // 1. Cargar local primero
      const local = localStorage.getItem(key);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (parsed.fields) loadedFields = parsed.fields;
          if (parsed.updatedAt) loadedUpdatedAt = parsed.updatedAt;
        } catch (e) {}
      }

      // 2. Cargar de Supabase consolidando registros por si existen duplicados
      if (supabase) {
        const { data: remoteRecords, error } = await supabase
          .from('registros')
          .select('id, datos, updated_at')
          .eq('tipo', 'novedades_turno')
          .eq('fecha', f)
          .order('updated_at', { ascending: false });

        if (!error && remoteRecords && remoteRecords.length > 0) {
          let consolidatedRemote = {};
          [...remoteRecords].reverse().forEach((r) => {
            if (r.datos && typeof r.datos === 'object') {
              consolidatedRemote = { ...consolidatedRemote, ...r.datos };
            }
          });

          loadedFields = { ...loadedFields, ...consolidatedRemote };
          loadedUpdatedAt = remoteRecords[0].updated_at || loadedUpdatedAt;

          localStorage.setItem(
            key,
            JSON.stringify({ fields: loadedFields, updatedAt: loadedUpdatedAt })
          );
        }
      }

      setData(loadedFields);
      setLastUpdated(loadedUpdatedAt);
    } catch (err) {
      console.error('Error cargando novedades:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForDate(fecha);

    if (!supabase) return;

    const channel = supabase
      .channel(`novedades-rt-${fecha}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registros', filter: `tipo=eq.novedades_turno` },
        (payload) => {
          if (payload.new && payload.new.fecha === fecha && payload.new.datos) {
            setData((prev) => {
              const updated = { ...prev, ...payload.new.datos };
              localStorage.setItem(
                `novedades-${fecha}`,
                JSON.stringify({
                  fields: updated,
                  updatedAt: payload.new.updated_at || new Date().toISOString(),
                })
              );
              return updated;
            });
            if (payload.new.updated_at) {
              setLastUpdated(payload.new.updated_at);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  const persist = async (fields) => {
    setSaveStatus('saving');
    const updatedAt = new Date().toISOString();
    try {
      const payload = { fields, updatedAt };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setLastUpdated(updatedAt);

      if (supabase) {
        const { data: existingRecords, error: selectErr } = await supabase
          .from('registros')
          .select('id, datos')
          .eq('tipo', 'novedades_turno')
          .eq('fecha', fecha)
          .order('updated_at', { ascending: false });

        if (selectErr) {
          console.error('Error buscando registro existente en Supabase:', selectErr);
        }

        let targetId = existingRecords && existingRecords.length > 0 ? existingRecords[0].id : null;
        let existingDatos = {};

        if (existingRecords && existingRecords.length > 0) {
          existingRecords.forEach((r) => {
            if (r.datos) existingDatos = { ...existingDatos, ...r.datos };
          });
        }

        // Fusionar datos existentes con los nuevos campos para no pisar otros sectores
        const mergedFields = { ...existingDatos, ...fields };

        if (targetId) {
          const { error: updateErr } = await supabase
            .from('registros')
            .update({ datos: mergedFields, updated_at: updatedAt })
            .eq('id', targetId);

          if (updateErr) throw updateErr;
        } else {
          const { error: insertErr } = await supabase
            .from('registros')
            .insert([{ tipo: 'novedades_turno', fecha: fecha, datos: mergedFields, updated_at: updatedAt }]);

          if (insertErr) throw insertErr;
        }
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error('Error guardando novedades:', err);
      setSaveStatus('error');
    }
    setTimeout(() => setSaveStatus((s) => (s === 'saving' ? s : null)), 2500);
  };

  const debouncedSave = (nextFields) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(nextFields), 800);
  };

  const setField = (sectorKey, turno, value) => {
    setData((prev) => {
      const next = { ...prev, [`${sectorKey}_${turno}`]: value };
      debouncedSave(next);
      return next;
    });
  };

  const getField = (sectorKey, turno) => data[`${sectorKey}_${turno}`] || '';

  const sectoresProcesados = sectoresVisibles.map((s) => ({
    ...s,
    turnosConTexto: s.turnos.filter((t) => getField(s.key, t).trim() !== ''),
  }));

  const sectoresAMostrar = hideEmpty
    ? sectoresProcesados.filter((s) => s.turnosConTexto.length > 0)
    : sectoresProcesados;

  const buildHtml = () => {
    let rows = '';
    sectoresAMostrar.forEach((s) => {
      const turnos = hideEmpty ? s.turnosConTexto : s.turnos;
      let turnoRows = '';
      turnos.forEach((t) => {
        const val = getField(s.key, t).trim();
        const displayVal =
          val === ''
            ? `<span style="color:#666666;">Sin novedades</span>`
            : escapeHtml(val).replace(/\n/g, '<br>');
        turnoRows += `
          <tr>
            <td style="padding:0 12px 8px 12px; font-size:13px; color:${NEGRO}; font-family:Arial, Helvetica, sans-serif;">
              <span style="font-weight:bold; color:${NEGRO};">${t}:</span> ${displayVal}
            </td>
          </tr>`;
      });
      rows += `
        <tr>
          <td style="padding:0 0 12px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${GRIS_CLARO}" style="background-color:${GRIS_CLARO};">
              <tr>
                <td style="padding:10px 12px 6px 12px; font-size:14px; font-weight:bold; color:${NEGRO}; font-family:Arial, Helvetica, sans-serif;">${escapeHtml(s.label)}</td>
              </tr>
              ${turnoRows}
            </table>
          </td>
        </tr>`;
    });

    return `
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${GRIS_FONDO}" style="background-color:${GRIS_FONDO}; font-family:Arial, Helvetica, sans-serif;">
  <tr>
    <td style="padding:18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:19px; font-weight:bold; color:${NEGRO}; font-family:Arial, Helvetica, sans-serif; padding-bottom:2px;">NOVEDADES TURNO A TURNO</td>
        </tr>
        <tr>
          <td style="font-size:13px; font-weight:bold; color:${NEGRO}; font-family:Arial, Helvetica, sans-serif; padding-bottom:16px;">${formatFechaEs(fecha)}</td>
        </tr>
        ${rows}
      </table>
    </td>
  </tr>
</table>`.trim();
  };

  const buildPlainText = () => {
    let text = `NOVEDADES TURNO A TURNO\n${formatFechaEs(fecha)}\n\n`;
    sectoresAMostrar.forEach((s) => {
      const turnos = hideEmpty ? s.turnosConTexto : s.turnos;
      text += `${s.label}\n`;
      turnos.forEach((t) => {
        const val = getField(s.key, t).trim() || 'Sin novedades';
        text += `  ${t}: ${val}\n`;
      });
      text += `\n`;
    });
    return text.trim();
  };

  const copyHtmlFallback = (html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    const range = document.createRange();
    range.selectNode(container);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('copy');
    sel.removeAllRanges();
    document.body.removeChild(container);
  };

  const handleCopyRich = async () => {
    const html = buildHtml();
    const text = buildPlainText();
    try {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
    } catch (err) {
      try {
        copyHtmlFallback(html);
      } catch (err2) {
        alert('No se pudo copiar automáticamente. Probá con "Sin formato".');
        return;
      }
    }
    setCopiedRich(true);
    setTimeout(() => setCopiedRich(false), 2000);
  };

  const handleCopyPlain = async () => {
    try {
      await navigator.clipboard.writeText(buildPlainText());
      setCopiedPlain(true);
      setTimeout(() => setCopiedPlain(false), 2000);
    } catch (err) {
      alert('No se pudo copiar automáticamente. Seleccioná el texto manualmente.');
    }
  };

  const handleSendToProduccion = async () => {
    await persist(data);

    if (supabase) {
      try {
        const sectorObj = SECTORES.find(s => s.key === sectorKeyMap[activeSector]);
        const sectorNombre = sectorObj ? sectorObj.label : (activeSector || 'Sector');
        const now = new Date();
        const formattedTime = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const notifPayload = {
          tipo: 'novedades_turno',
          type: 'novedades_turno',
          target_sector: 'produccion',
          targetSector: 'produccion',
          target_sector_name: sectorNombre,
          emitterName: sectorNombre,
          message: `Novedades de turno recibidas de ${sectorNombre}`,
          details: `Se registraron nuevas novedades de turno el ${formatFechaEs(fecha)}.`,
          timestamp: formattedTime,
          seen: false
        };

        const { error: notifErr } = await supabase.from('notificaciones').insert([notifPayload]);
        if (notifErr) {
          console.error('Error insertando notificacion:', notifErr);
        }
      } catch (e) {
        console.error('Error enviando notificacion a producción:', e);
      }
    }

    setSentStatus(true);
    setTimeout(() => setSentStatus(false), 3000);
  };

  const handleReset = async () => {
    if (!confirm('¿Borrar las novedades de hoy? Esto afectará a todos los sectores.')) return;
    setData({});
    try {
      localStorage.removeItem(storageKey);
      if (supabase) {
        await supabase
          .from('registros')
          .delete()
          .eq('tipo', 'novedades_turno')
          .eq('fecha', fecha);
      }
    } catch (err) {
      // no-op
    }
    setLastUpdated(null);
  };

  const handleRefresh = () => loadForDate(fecha);

  const isProduccion = activeSector === 'produccion';
  const currentSectorObj = SECTORES.find((s) => s.key === currentKey);
  const sectorTitleLabel = currentSectorObj
    ? currentSectorObj.label.startsWith('Recepción')
      ? currentSectorObj.label
      : `Recepción de ${currentSectorObj.label}`
    : 'Sector';

  return (
    <div className="novedades-page">
      <div>
        <div className="novedades-header">
          <h2>Novedades de Turno {!isProduccion ? `- ${sectorTitleLabel}` : ''}</h2>
          <p>
            {!isProduccion
              ? `Registrá las novedades del turno en ${sectorTitleLabel} y envíalas al módulo de Producción.`
              : 'Consolidado de novedades registradas por turno en cada sector de planta.'}
          </p>
        </div>

        <div className="novedades-grid" style={{ gridTemplateColumns: isProduccion ? '1fr 380px' : '1fr', gap: '1.5rem', display: 'grid' }}>
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
                title="Actualizar novedades de la fecha"
              >
                <RefreshCw size={12} /> Actualizar
              </button>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  onClick={handleReset}
                  className="novedades-action-btn"
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                >
                  <Trash2 size={14} /> Limpiar
                </button>

                {!isProduccion && (
                  <button
                    onClick={handleSendToProduccion}
                    className="novedades-action-btn primary"
                    style={{
                      background: sentStatus ? '#10b981' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: '#fff',
                      padding: '0.6rem 1.2rem',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                      border: 'none'
                    }}
                  >
                    {sentStatus ? <Check size={16} /> : <Send size={16} />}
                    {sentStatus ? '¡Enviado a Producción!' : 'Enviar novedades a Producción'}
                  </button>
                )}
              </div>
            </div>

            <div className="novedades-status-text" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
              {loading
                ? 'Cargando novedades…'
                : saveStatus === 'saving'
                ? 'Guardando…'
                : saveStatus === 'error'
                ? 'No se pudo guardar, reintentá.'
                : lastUpdated
                ? `Última actualización: ${formatHora(lastUpdated)} hs`
                : 'Todavía no hay novedades cargadas hoy.'}
            </div>

            {sectoresVisibles.map((s) => (
              <div key={s.key} className="novedades-sector-card" style={{ marginBottom: '1.2rem' }}>
                <h3 className="novedades-sector-title" style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#fff' }}>
                  {s.label}
                </h3>
                <div className="novedades-turnos-list">
                  {s.turnos.map((t) => (
                    <div key={t} className="novedades-turno-row" style={{ marginBottom: '0.75rem' }}>
                      <span className="novedades-turno-label" style={{ fontWeight: 'bold', width: '40px' }}>{t}</span>
                      <textarea
                        value={getField(s.key, t)}
                        onChange={(e) => setField(s.key, t, e.target.value)}
                        placeholder={`Escribir novedades para ${s.label} (${t})...`}
                        rows={2}
                        disabled={loading}
                        className="novedades-textarea"
                        style={{
                          flex: 1,
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: '#fff',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {isProduccion && (
            <div className="novedades-sidebar">
              <div className="novedades-sidebar-actions">
                <label className="novedades-hide-empty-label">
                  <input
                    type="checkbox"
                    checked={hideEmpty}
                    onChange={(e) => setHideEmpty(e.target.checked)}
                  />
                  Ocultar turnos sin novedades
                </label>
                <div className="novedades-action-buttons">
                  <button
                    onClick={handleCopyPlain}
                    className="novedades-action-btn"
                    title="Copiar como texto plano, sin formato"
                  >
                    {copiedPlain ? <Check size={14} /> : <ClipboardType size={14} />}
                    {copiedPlain ? 'Copiado' : 'Sin formato'}
                  </button>
                  <button
                    onClick={handleCopyRich}
                    className="novedades-action-btn primary"
                  >
                    {copiedRich ? <Check size={14} /> : <Copy size={14} />}
                    {copiedRich ? 'Copiado' : 'Copiar para el mail'}
                  </button>
                </div>
              </div>

              <div className="novedades-preview-wrapper" style={{ backgroundColor: GRIS_FONDO, borderRadius: '8px', overflow: 'hidden' }}>
                {sectoresAMostrar.length === 0 ? (
                  <p className="text-neutral-700 text-sm italic p-6">Todavía no hay novedades cargadas para la vista previa.</p>
                ) : (
                  <div className="p-1" dangerouslySetInnerHTML={{ __html: buildHtml() }} />
                )}
              </div>
              <p className="novedades-footer-note" style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>
                El bloque de arriba se copia tal cual con formato HTML en tabla fija para pegar directo en el mail sin desarmarse.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

