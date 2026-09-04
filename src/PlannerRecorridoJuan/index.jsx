import React, { useState } from 'react';
import PlanificadorRecorrido from './PlanificadorRecorrido';
import GestionCamion from './GestionCamion';
import ModoChoferTracker from './ModoChoferTracker';
import { Map, Truck, Navigation, CheckCircle, Copy, X, ExternalLink, Trash2 } from 'lucide-react';
import { supabase } from '../supabase';

export default function PlannerRecorridoMain() {
  const [activeMainTab, setActiveMainTab] = useState('planificador'); // 'planificador' | 'camion' | 'chofer'
  const [showChoferModal, setShowChoferModal] = useState(false);
  const [choferUrl, setChoferUrl] = useState('');
  const [copiedAgain, setCopiedAgain] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleLimpiarGpsLive = async () => {
    if (!window.confirm('¿Seguro que querés limpiar todas las posiciones actuales de camiones en vivo en el mapa?')) return;
    setClearing(true);
    try {
      // 1. Limpiar LocalStorage
      localStorage.removeItem('migusto_gps_live_v1');
      
      // 2. Limpiar Supabase registros gps_live
      if (supabase) {
        await supabase.from('registros').delete().eq('tipo', 'gps_live');
      }

      alert(' Posiciones de camiones limpiadas correctamente. El mapa se actualizó.');
      window.location.reload();
    } catch (e) {
      console.error('Error al limpiar GPS:', e);
      alert('Se limpió el almacenamiento local.');
      window.location.reload();
    } finally {
      setClearing(false);
    }
  };

  const handleOpenChoferModal = () => {
    const baseUrl = window.location.href.split('#')[0].split('?')[0].replace(/\/$/, '');
    const url = `${baseUrl}/#/chofer`;
    setChoferUrl(url);
    navigator.clipboard.writeText(url);
    setShowChoferModal(true);
  };

  return (
    <div style={{ width: '100%', padding: '4px', boxSizing: 'border-box', position: 'relative' }}>
      
      {/* Modal Pro de Enlace para Choferes */}
      {showChoferModal && (
        <div 
          onClick={() => setShowChoferModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#14171a',
              border: '1px solid #3ecf8e',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 35px rgba(62,207,142,0.2)',
              color: '#e8ecef',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setShowChoferModal(false)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid #242a30',
                color: '#9aa4ad',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(62, 207, 142, 0.15)',
                border: '2px solid #3ecf8e',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                boxShadow: '0 0 20px rgba(62,207,142,0.4)'
              }}>
                <CheckCircle size={36} color="#3ecf8e" />
              </div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#3ecf8e' }}>
                ¡Enlace para Choferes Copiado!
              </h3>
              <p style={{ margin: '8px 0 0', fontSize: '13.5px', color: '#9aa4ad', lineHeight: '1.4' }}>
                Se ha copiado al portapapeles el enlace exclusivo para que los choferes utilicen la app en su celular.
              </p>
            </div>

            <div style={{ background: '#0d0f11', border: '1px solid #242a30', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#5f6b75', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Enlace Directo (/chofer):
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  readOnly
                  value={choferUrl}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(choferUrl);
                    setCopiedAgain(true);
                    setTimeout(() => setCopiedAgain(false), 2000);
                  }}
                  style={{
                    background: copiedAgain ? '#3ecf8e' : 'rgba(255,255,255,0.08)',
                    color: copiedAgain ? '#06210f' : '#e8ecef',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedAgain ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copiedAgain ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            <div style={{ background: 'rgba(56, 189, 248, 0.08)', borderLeft: '4px solid #38bdf8', borderRadius: '4px', padding: '12px 14px', marginBottom: '24px' }}>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#e8ecef', lineHeight: '1.4' }}>
                💡 <strong>Instrucciones:</strong> Enviá este enlace por WhatsApp al chofer. Al abrirlo en su teléfono, se iniciará el rastreo GPS en tiempo real para que el camión aparezca en el mapa sin ingresar al panel general.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href={choferUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid #38bdf8',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <ExternalLink size={16} /> Probá la Vista Chofer
              </a>

              <button
                onClick={() => setShowChoferModal(false)}
                style={{
                  flex: 1,
                  background: '#3ecf8e',
                  color: '#06210f',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Switcher */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveMainTab('planificador')}
          style={{
            background: activeMainTab === 'planificador' ? 'rgba(62, 207, 142, 0.15)' : 'transparent',
            color: activeMainTab === 'planificador' ? '#3ecf8e' : '#9aa4ad',
            border: activeMainTab === 'planificador' ? '1px solid #3ecf8e' : '1px solid #242a30',
            padding: '10px 18px',
            borderRadius: '99px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Map size={18} />
          <span>Viajes de camiones (Mapa & Flota)</span>
        </button>

        <button
          onClick={() => setActiveMainTab('camion')}
          style={{
            background: activeMainTab === 'camion' ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
            color: activeMainTab === 'camion' ? '#22c55e' : '#9aa4ad',
            border: activeMainTab === 'camion' ? '1px solid #22c55e' : '1px solid #242a30',
            padding: '10px 18px',
            borderRadius: '99px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Truck size={18} />
          <span>Gestión de Camión / Bitácora</span>
        </button>

        <button
          onClick={() => setActiveMainTab('chofer')}
          style={{
            background: activeMainTab === 'chofer' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeMainTab === 'chofer' ? '#38bdf8' : '#9aa4ad',
            border: activeMainTab === 'chofer' ? '1px solid #38bdf8' : '1px solid #242a30',
            padding: '10px 18px',
            borderRadius: '99px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Navigation size={18} />
          <span>📱 Vista Chofer</span>
        </button>

        <button
          onClick={handleOpenChoferModal}
          style={{
            background: 'rgba(62, 207, 142, 0.12)',
            color: '#3ecf8e',
            border: '1px dashed #3ecf8e',
            padding: '10px 18px',
            borderRadius: '99px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginLeft: 'auto',
            transition: 'all 0.2s'
          }}
        >
          <Copy size={16} />
          <span>Copiar Enlace para Choferes (/chofer)</span>
        </button>

        <button
          onClick={handleLimpiarGpsLive}
          disabled={clearing}
          title="Borrar posiciones actuales de camiones en mapa"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            border: '1px solid #ef4444',
            padding: '10px 18px',
            borderRadius: '99px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: clearing ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <Trash2 size={16} />
          <span>{clearing ? 'Limpiando...' : 'Borrar Posiciones Mapa'}</span>
        </button>
      </div>

      {/* Render selected view (todos se mantienen montados para conservar el rastreo activo) */}
      <div style={{ display: activeMainTab === 'planificador' ? 'block' : 'none' }}>
        <PlanificadorRecorrido />
      </div>
      <div style={{ display: activeMainTab === 'camion' ? 'block' : 'none' }}>
        <GestionCamion />
      </div>
      <div style={{ display: activeMainTab === 'chofer' ? 'block' : 'none' }}>
        <ModoChoferTracker />
      </div>
    </div>
  );
}

