import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { PlusCircle, History, Save, ClipboardList, Clock, User, HardHat, ClipboardCheck, Settings, Eye } from 'lucide-react'


const SECTORS = [
  { id: 'calidad', label: 'Calidad', icon: ClipboardCheck },
  { id: 'produccion', label: 'Produccion', icon: HardHat },
  { id: 'mantenimiento', label: 'Mantenimiento', icon: Settings }
];




const initialFormState = {
  codigo: '',
  revision: '',
  producto: '',
  fecha: '',
  tipoPrueba: '',
  categoria: '', // MP, SE, PT, ME
  justificacion: '',
  descripcionPrueba: '',
  resultados: '',
  decisionFinal: '', // Aprobado, Rechazado, Condicional
  observaciones: '',
  responsable: ''
}


const App = () => {

  const [activeSector, setActiveSector] = useState('calidad')
  const [activeSubTab, setActiveSubTab] = useState('form')
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState(initialFormState)

  // Load records from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('regsapp_records_multisector_v2');
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading records", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('regsapp_records_multisector_v2', JSON.stringify(records));
  }, [records]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newRecord = {
      ...formData,
      id: Date.now(),
      created: new Date().toLocaleString(),
      sector: activeSector
    };
    
    const updatedRecords = [newRecord, ...records];
    setRecords(updatedRecords);
    localStorage.setItem('regsapp_records_multisector_v2', JSON.stringify(updatedRecords));
    setFormData(initialFormState);
    setActiveSubTab('history');
  }

  const filteredRecords = records.filter(r => r.sector === activeSector);

  const handleRevisionChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only numbers
    setFormData({...formData, revision: value});
  }


  const handleTextAreaChange = (e, field) => {
    const element = e.target;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
    setFormData({...formData, [field]: element.value});
  }

  return (
    <>
      <div className="logo-container">
        <img src="/Logo Mi Gusto 2025.png" alt="Mi Gusto Logo" className="app-logo" />
      </div>

      <div className="app-container">

        {/* Header & Main Tabs (Sectors) */}
        <header className="header">
          <div className="title-group">
            <h1>Registros</h1>
            <p>Sistema de registro de actividades en fabrica</p>
          </div>

          <nav className="nav-tabs">
            {SECTORS.map(sector => (
              <button 
                key={sector.id}
                className={`tab-btn ${activeSector === sector.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveSector(sector.id);
                  setActiveSubTab('form'); // Reset to form when changing sector
                }}
              >
                <sector.icon size={18} />
                <span>{sector.label}</span>
              </button>
            ))}
          </nav>
        </header>

        {/* Sub-Navigation for Registro/Historial */}
        <div className="sub-header" style={{ display: 'flex', justifyContent: 'center', padding: '1rem', borderBottom: '1px solid var(--border)', gap: '2rem' }}>
          <button 
            onClick={() => setActiveSubTab('form')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: activeSubTab === 'form' ? 'white' : '#525252',
              fontWeight: activeSubTab === 'form' ? '700' : '400',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            Informe de pruebas
          </button>
          <button 
            onClick={() => setActiveSubTab('history')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: activeSubTab === 'history' ? 'white' : '#525252',
              fontWeight: activeSubTab === 'history' ? '700' : '400',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            Ver Historial
          </button>
        </div>

        {/* Main Content Area */}
        <main className="content">
          <AnimatePresence mode="wait">

            {activeSubTab === 'form' ? (
              <motion.div
                key={`${activeSector}-form`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', color: '#525252', margin: 0 }}>
                    Informe de Pruebas: {SECTORS.find(s => s.id === activeSector).label}
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="record-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Código Informe</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="INF-00..."
                        value={formData.codigo}
                        onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Revisión</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="0"
                        value={formData.revision}
                        onChange={handleRevisionChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Producto</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="Nombre del producto"
                        value={formData.producto}
                        onChange={(e) => setFormData({...formData, producto: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Fecha</label>
                      <input 
                        type="date" 
                        className="form-control"
                        value={formData.fecha}
                        onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Tipo de Prueba</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="Ej: Cambio/Mejora de proceso"
                        value={formData.tipoPrueba}
                        onChange={(e) => setFormData({...formData, tipoPrueba: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label>Categoría</label>
                      <div className="checkbox-group">
                        {['MP', 'SE', 'PT', 'ME'].map(cat => (
                          <button
                            type="button"
                            key={cat}
                            className={`chip-btn ${formData.categoria === cat ? 'active' : ''}`}
                            onClick={() => setFormData({...formData, categoria: cat})}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Justificación</label>
                    <textarea 
                      className="form-control auto-expand"
                      placeholder="Motivo de la prueba..."
                      value={formData.justificacion}
                      onChange={(e) => handleTextAreaChange(e, 'justificacion')}
                      rows={2}
                    />
                  </div>

                  <div className="form-group">
                    <label>Descripción de la prueba</label>
                    <textarea 
                      className="form-control auto-expand"
                      placeholder="Procedimiento realizado..."
                      value={formData.descripcionPrueba}
                      onChange={(e) => handleTextAreaChange(e, 'descripcionPrueba')}
                      rows={2}
                    />
                  </div>

                  <div className="form-group">
                    <label>Resultados obtenidos</label>
                    <textarea 
                      className="form-control auto-expand"
                      placeholder="Hallazgos y datos medidos..."
                      value={formData.resultados}
                      onChange={(e) => handleTextAreaChange(e, 'resultados')}
                      rows={2}
                    />
                  </div>

                  <div className="form-group">
                    <label>Decisión Final</label>
                    <div className="decision-group">
                      {['Aprobado', 'Rechazado', 'Condicional'].map(decision => (
                        <button
                          type="button"
                          key={decision}
                          className={`decision-btn ${formData.decisionFinal === decision ? 'active' : ''}`}
                          onClick={() => setFormData({...formData, decisionFinal: decision})}
                        >
                          {decision}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Observaciones Finales</label>
                    <textarea 
                      className="form-control auto-expand"
                      placeholder="Notas adicionales..."
                      value={formData.observaciones}
                      onChange={(e) => handleTextAreaChange(e, 'observaciones')}
                      rows={2}
                    />
                  </div>

                  <div className="form-group">
                    <label>Responsable/s</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Nombres de los responsables"
                      value={formData.responsable}
                      onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                    />
                  </div>

                  <button type="submit" className="submit-btn highlight">
                    <Save size={18} />
                    <span>Guardar Informe</span>
                  </button>
                </form>
              </motion.div>
            ) : selectedRecord ? (
              <motion.div
                key="detail-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="report-detail-container"
              >
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
                  <button onClick={() => setSelectedRecord(null)} className="back-btn">
                    ← Volver al historial
                  </button>
                </div>


                <div className="report-view">
                  <div className="report-view-header">
                    <div className="header-main">
                      <h2>Detalle del Informe</h2>
                      <span className="badge">{selectedRecord.codigo || 'SIN CODIGO'}</span>
                    </div>
                    <div className="header-meta">
                      <span>Revisión: {selectedRecord.revision || '0'}</span>
                      <span>{selectedRecord.created}</span>
                    </div>
                  </div>

                  <div className="report-view-grid">
                    <div className="view-group">
                      <label>Producto</label>
                      <div className="view-value">{selectedRecord.producto}</div>
                    </div>
                    <div className="view-group">
                      <label>Fecha</label>
                      <div className="view-value">{selectedRecord.fecha}</div>
                    </div>
                  </div>

                  <div className="report-view-grid">
                    <div className="view-group">
                      <label>Tipo de Prueba</label>
                      <div className="view-value">{selectedRecord.tipoPrueba || '-'}</div>
                    </div>
                    <div className="view-group">
                      <label>Categoría</label>
                      <div className="view-chips">
                        {['MP', 'SE', 'PT', 'ME'].map(cat => (
                          <span key={cat} className={`view-chip ${selectedRecord.categoria === cat ? 'active' : ''}`}>
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="view-group full">
                    <label>Justificación</label>
                    <div className="view-value large">{selectedRecord.justificacion}</div>
                  </div>

                  <div className="view-group full">
                    <label>Descripción de la prueba</label>
                    <div className="view-value large">{selectedRecord.descripcionPrueba}</div>
                  </div>

                  <div className="view-group full">
                    <label>Resultados obtenidos</label>
                    <div className="view-value large">{selectedRecord.resultados}</div>
                  </div>

                  <div className="report-view-grid">
                    <div className="view-group">
                      <label>Decisión Final</label>
                      <div className="view-chips">
                        {['Aprobado', 'Rechazado', 'Condicional'].map(decision => (
                          <span key={decision} className={`view-chip ${selectedRecord.decisionFinal === decision ? 'active' : ''}`}>
                            {decision}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="view-group">
                      <label>Estado</label>
                      <span className={`badge ${selectedRecord.decisionFinal?.toLowerCase()}`}>
                        {selectedRecord.decisionFinal}
                      </span>
                    </div>
                  </div>

                  <div className="view-group full">
                    <label>Observaciones Finales</label>
                    <div className="view-value large">{selectedRecord.observaciones || '-'}</div>
                  </div>

                  <div className="report-view-footer">
                    <div className="view-group">
                      <label>Responsable/s</label>
                      <div className="view-signature">{selectedRecord.responsable}</div>
                    </div>
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div
                key={`${activeSector}-history`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', textTransform: 'uppercase', color: '#525252' }}>
                  Historial: {SECTORS.find(s => s.id === activeSector).label}
                </h2>
                {filteredRecords.length > 0 ? (
                  <div className="history-list">
                    {filteredRecords.map(record => (
                      <motion.div 
                        key={record.id} 
                        className="history-item clickable" 
                        layout
                        onClick={() => setSelectedRecord(record)}
                      >
                        <div className="item-info">
                          <h3>{record.producto}</h3>
                          <div className="item-meta">
                            <p><Clock size={12} /> {record.fecha}</p>
                            <p><User size={12} /> {record.responsable}</p>
                            <span className={`badge ${record.decisionFinal?.toLowerCase()}`}>
                              {record.decisionFinal}
                            </span>
                          </div>
                        </div>
                        <div className="item-icon">
                          <Eye size={20} color="#525252" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <ClipboardList size={48} />
                    <p>Sin informes en {SECTORS.find(s => s.id === activeSector).label}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <footer className="footer">
        <p>
          © Desarrollado por el <strong>Departamento de Sistemas</strong> de Mi Gusto | Todos los derechos reservados.
        </p>
      </footer>
    </>
  )
}


export default App
