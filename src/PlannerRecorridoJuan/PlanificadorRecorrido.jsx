import React, { useEffect, useRef } from 'react';
import planificadorHtmlRaw from './Nuevo/planificador migusto.html?raw';
import { supabase } from '../supabase';

// Inyectar ocultamiento visual de scrollbars permitiendo desplazamiento activo
const cleanHtmlContent = planificadorHtmlRaw
  .replace('irA("planificacion");', 'irA("mapa");')
  .replace(
    '</head>',
    `<style>
      html, body {
        overflow-y: auto !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      ::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
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

    // Siempre empujar la lista actualizada al iframe (incluso si está vacía) para limpiar o refrescar marcadores
    pushGpsToIframeWindow(list);
  };

  useEffect(() => {
    // 1. Carga inicial GPS
    syncGps();

    // 2. Suscripción por WebSocket en Tiempo Real para posiciones GPS
    let gpsChannel = null;
    if (supabase) {
      gpsChannel = supabase
        .channel('gps_live_realtime_planner_v9')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'registros', filter: 'tipo=eq.gps_live' }, () => {
          syncGps();
        })
        .subscribe();
    }

    // 3. Listener de mensajes desde el iframe para guardar planner_state a Supabase
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

    // 4. Cargar todos los estados de planificación compartidos desde Supabase
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

    // 5. Suscripción Realtime a cambios de planificación creados por otros usuarios
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
          borderRadius: '12px',
          background: '#0d0f11',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      />
    </div>
  );
}
