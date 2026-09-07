import React, { useEffect, useRef } from 'react';
import planificadorHtmlRaw from './Nuevo/planificador migusto.html?raw';
import { supabase } from '../supabase';

// Inyectar ocultamiento visual de scrollbars e integración de fondo transparente con el módulo
const cleanHtmlContent = planificadorHtmlRaw
  .replace('irA("planificacion");', 'irA("mapa");')
  .replace(
    '</head>',
    `<style>
      :root {
        --bg: transparent !important;
        --panel: transparent !important;
        --panel-2: rgba(255, 255, 255, 0.03) !important;
        --border: rgba(255, 255, 255, 0.08) !important;
        --border-soft: rgba(255, 255, 255, 0.05) !important;
      }
      html, body, .app-shell, .side, .topbar, .main-col, .riel {
        background: transparent !important;
      }
      html, body, * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      ::-webkit-scrollbar, *::-webkit-scrollbar, ::-webkit-scrollbar-thumb, ::-webkit-scrollbar-track, ::-webkit-scrollbar-button {
        display: none !important;
        width: 0px !important;
        height: 0px !important;
        background: transparent !important;
      }
      .btn-ghost, label.btn-ghost {
        background-color: #171717 !important;
        border: 1px solid #262626 !important;
        color: #a3a3a3 !important;
        padding: 0.625rem 0.75rem !important;
        border-radius: 8px !important;
        font-size: 0.85rem !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 0.4rem !important;
        transition: all 0.2s ease !important;
      }
      .btn-ghost:hover, label.btn-ghost:hover {
        background-color: #262626 !important;
        color: #ffffff !important;
        border-color: #333333 !important;
      }
      .btn-outline-green {
        background-color: #059669 !important;
        color: #ffffff !important;
        border: 1px solid #059669 !important;
        padding: 0.625rem 0.75rem !important;
        border-radius: 8px !important;
        font-size: 0.85rem !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 0.4rem !important;
        transition: all 0.2s ease !important;
      }
      .btn-outline-green:hover {
        background-color: #047857 !important;
        border-color: #047857 !important;
        color: #ffffff !important;
      }
      .dropdown-menu {
        background-color: #14171a !important;
        border: 1px solid #262626 !important;
        border-radius: 10px !important;
        padding: 8px !important;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6) !important;
      }
      .dropdown-menu .btn, 
      .dropdown-menu .btn-ghost, 
      .dropdown-menu label.btn-ghost, 
      .dropdown-menu .btn-amber, 
      .dropdown-menu label.btn-amber {
        width: 100% !important;
        justify-content: flex-start !important;
        background-color: #171717 !important;
        border: 1px solid #262626 !important;
        color: #a3a3a3 !important;
        padding: 0.5rem 0.75rem !important;
        border-radius: 6px !important;
        font-size: 0.825rem !important;
        font-weight: 600 !important;
        margin-bottom: 4px !important;
        box-sizing: border-box !important;
        display: flex !important;
        align-items: center !important;
        gap: 0.5rem !important;
        transition: all 0.2s ease !important;
      }
      .dropdown-menu .btn:hover, 
      .dropdown-menu .btn-ghost:hover, 
      .dropdown-menu label.btn-ghost:hover, 
      .dropdown-menu .btn-amber:hover, 
      .dropdown-menu label.btn-amber:hover {
        background-color: #262626 !important;
        color: #ffffff !important;
        border-color: #333333 !important;
      }
      .dropdown-menu .btn-primary {
        width: 100% !important;
        justify-content: flex-start !important;
        background-color: #059669 !important;
        color: #ffffff !important;
        border: 1px solid #059669 !important;
        padding: 0.5rem 0.75rem !important;
        border-radius: 6px !important;
        font-size: 0.825rem !important;
        font-weight: 700 !important;
        margin-bottom: 4px !important;
        box-sizing: border-box !important;
        display: flex !important;
        align-items: center !important;
        gap: 0.5rem !important;
        transition: all 0.2s ease !important;
      }
      .dropdown-menu .btn-primary:hover {
        background-color: #047857 !important;
        border-color: #047857 !important;
        color: #ffffff !important;
      }
    </style></head>`
  );

export default function PlanificadorRecorrido() {
  const iframeRef = useRef(null);

  const pushGpsToIframeWindow = (list) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.liveGpsData = list;
        if (typeof iframeRef.current.contentWindow.renderMapa === 'function') {
          iframeRef.current.contentWindow.renderMapa();
        }
      } catch (e) {
        console.error('Error pushing GPS to iframe window:', e);
      }
    }
  };

  const syncGps = async () => {
    let list = [];
    try {
      const store = JSON.parse(localStorage.getItem('migusto_gps_live_v1') || '{}');
      list = Object.values(store);
    } catch(e){}

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('registros')
          .select('datos')
          .eq('tipo', 'gps_live');

        if (!error && data && data.length > 0) {
          const supaList = data.map(r => r.datos).filter(Boolean);
          supaList.forEach(item => {
            if (item && item.patente) {
              const idx = list.findIndex(l => l.patente === item.patente);
              if (idx !== -1) list[idx] = item; else list.push(item);
            }
          });
        }
      } catch(e){}
    }

    pushGpsToIframeWindow(list);
  };

  useEffect(() => {
    syncGps();

    let gpsChannel = null;
    if (supabase) {
      gpsChannel = supabase
        .channel('gps_live_realtime_planner_v9')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'registros', filter: 'tipo=eq.gps_live' }, () => {
          syncGps();
        })
        .subscribe();
    }

    const handleIframeMessage = async (event) => {
      if (!event.data || !event.data.type) return;
      const { type, key, payload } = event.data;

      if (type === 'SAVE_PLANNER_STATE_TO_SUPABASE' && supabase && key) {
        try {
          const { data: existing } = await supabase
            .from('registros')
            .select('id')
            .eq('tipo', 'planner_state')
            .eq('codigo', key)
            .limit(1);

          const record = {
            tipo: 'planner_state',
            codigo: key,
            datos: { key, payload, updatedAt: new Date().toISOString() }
          };

          if (existing && existing.length > 0) {
            await supabase.from('registros').update(record).eq('id', existing[0].id);
          } else {
            await supabase.from('registros').insert([record]);
          }
        } catch (e) {
          console.error('Error guardando planner_state en Supabase:', e);
        }
      }
    };

    window.addEventListener('message', handleIframeMessage);

    const syncPlannerStatesFromSupabase = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('registros')
          .select('codigo, datos')
          .eq('tipo', 'planner_state');

        if (!error && data && data.length > 0) {
          data.forEach(item => {
            if (item.codigo && item.datos && item.datos.payload !== undefined) {
              const val = typeof item.datos.payload === 'string' ? item.datos.payload : JSON.stringify(item.datos.payload);
              localStorage.setItem(item.codigo, val);
            }
          });
          if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'SUPABASE_PLANNER_STATES_UPDATED' }, '*');
          }
        }
      } catch (e) {
        console.error('Error leyendo planner_state de Supabase:', e);
      }
    };

    syncPlannerStatesFromSupabase();

    let stateChannel = null;
    if (supabase) {
      stateChannel = supabase
        .channel('planner_states_realtime_v1')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'registros', filter: 'tipo=eq.planner_state' }, (payload) => {
          if (payload && payload.new && payload.new.codigo && payload.new.datos) {
            const val = typeof payload.new.datos.payload === 'string' ? payload.new.datos.payload : JSON.stringify(payload.new.datos.payload);
            localStorage.setItem(payload.new.codigo, val);
            if (iframeRef.current && iframeRef.current.contentWindow) {
              iframeRef.current.contentWindow.postMessage({ type: 'SUPABASE_PLANNER_STATES_UPDATED' }, '*');
            }
          }
        })
        .subscribe();
    }

    return () => {
      window.removeEventListener('message', handleIframeMessage);
      if (gpsChannel && supabase) supabase.removeChannel(gpsChannel);
      if (stateChannel && supabase) supabase.removeChannel(stateChannel);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 70px)', minHeight: '850px', border: 'none', overflow: 'hidden' }}>
      <iframe
        ref={iframeRef}
        srcDoc={cleanHtmlContent}
        onLoad={() => { syncGps(); setTimeout(syncGps, 400); setTimeout(syncGps, 1200); }}
        title="Planificador Recorrido Mi Gusto"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          background: 'transparent',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      />
    </div>
  );
}
