import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const DIRECCIONES_COORDS = {
  "Ballester":      { lat:-34.5480433, lng:-58.5525982, dir:"Ballester 4816, Villa Ballester" },
  "Balvanera":      { lat:-34.6034645, lng:-58.3926230, dir:"Av. Callao 474" },
  "Barr. Belgrano": { lat:-34.5549538, lng:-58.4545298, dir:"Av. Monroe 1801" },
  "Belgrano":       { lat:-34.5626971, lng:-58.4647899, dir:"Av. Dr. Ricardo Balbín 2395" },
  "B.Vista":        { lat:-34.5601527, lng:-58.6786566, dir:"Av. Senador Morón 903, Bella Vista" },
  "Caballito":      { lat:-34.6254160, lng:-58.4538909, dir:"Av. Rivadavia 6193" },
  "Camp.":          { lat:-34.1631153, lng:-58.9630887, dir:"Av. Mitre 974, Campana" },
  "Cañitas":        { lat:-34.5724611, lng:-58.4302837, dir:"Báez 227" },
  "del Viso":       { lat:-34.4382847, lng:-58.7904861, dir:"Colectora 12 de octubre 3252, Del Viso" },
  "Devoto":         { lat:-34.6074345, lng:-58.5147745, dir:"Av. Francisco Beiró 4523" },
  "Torcuato":       { lat:-34.4885316, lng:-58.6212612, dir:"Av. Marcelo T. de Alvear 2556, Don Torcuato" },
  "Escobar":        { lat:-34.3485288, lng:-58.7902416, dir:"Av. 25 de Mayo 501, Escobar" },
  "Floresta":       { lat:-34.6359747, lng:-58.4914886, dir:"Av. Rivadavia 9025" },
  "Florida":        { lat:-34.5265080, lng:-58.4888365, dir:"Av. San Martín 1904, Florida" },
  "Pacheco":        { lat:-34.4588909, lng:-58.6364698, dir:"Av. Constituyentes 167, Gral. Pacheco" },
  "Hurl.":          { lat:-34.5923149, lng:-58.6366429, dir:"Av. Vergara 4114, Hurlingham" },
  "Ituzaingo":      { lat:-34.6459840, lng:-58.6575150, dir:"Av. Santa Rosa 1164, Ituzaingó" },
  "JC.Paz":         { lat:-34.5237677, lng:-58.7551361, dir:"Av. Gaspar Campos 6420, José C. Paz" },
  "Polvorines":     { lat:-34.5044372, lng:-58.6873626, dir:"Av. Pdte. Juan D. Perón 2596, Los Polvorines" },
  "Martinez":       { lat:-34.4995702, lng:-58.5218861, dir:"Hipólito Yrigoyen 1834, Martínez" },
  "Maschwitz":      { lat:-34.3948760, lng:-58.7391943, dir:"Av. Villanueva 1782, Maschwitz" },
  "Mataderos":      { lat:-34.6558607, lng:-58.5073209, dir:"Av. Juan Bautista Alberdi 6450" },
  "Merlo":          { lat:-34.6744920, lng:-58.7207754, dir:"Av. Calle Real 223, Merlo" },
  "Moreno":         { lat:-34.6397815, lng:-58.7874110, dir:"Av. Del Libertador 899, Moreno" },
  "Muñiz":          { lat:-34.5516703, lng:-58.6993551, dir:"Av. León Gallardo 333, Muñiz" },
  "Munro":          { lat:-34.5271908, lng:-58.5183622, dir:"Av. Bartolomé Mitre 2510, Munro" },
  "Palermo N":      { lat:-34.5852693, lng:-58.4412129, dir:"Av. Cnel. Niceto Vega 5795, Palermo" },
  "Paternal":       { lat:-34.6083161, lng:-58.4644512, dir:"Av. Juan B. Justo 4551, Paternal" },
  "Pilar Centro":   { lat:-34.4591626, lng:-58.9122288, dir:"Lorenzo López 523, Pilar Centro" },
  "PilarPalmas":    { lat:-34.4498026, lng:-58.8707976, dir:"Av. Sgto. Cayetano Beliera 1334, Pilar" },
  "P.Madero":       { lat:-34.6113067, lng:-58.3636680, dir:"Pierina Dealessi 1176, Puerto Madero" },
  "S.Fernando":     { lat:-34.4470720, lng:-58.5470545, dir:"Av. Pdte. Perón 2240, San Fernando" },
  "S.Martin":       { lat:-34.5784825, lng:-58.5356118, dir:"Intendente Campos 1876, San Martín" },
  "S.Miguel":       { lat:-34.5384461, lng:-58.7096588, dir:"Serrano 1665, San Miguel" },
  "Tigre":          { lat:-34.4295683, lng:-58.5717550, dir:"Av. Cazón 699 esq. Marabotto, Tigre" },
  "V.Lopez":        { lat:-34.5253927, lng:-58.4722805, dir:"Av. Libertador 962, Vicente López" },
  "V. Adelina":     { lat:-34.5097873, lng:-58.5401801, dir:"Av. de Mayo 99, Villa Adelina" },
  "V.Crespo":       { lat:-34.5971937, lng:-58.4249742, dir:"Av. Córdoba 4102, Villa Crespo" },
  "V.Urquiza":      { lat:-34.5815848, lng:-58.4923432, dir:"Av. de los Constituyentes 4599, Villa Urquiza" },
};

export const RECORRIDO_MAP_COLORS = { 1:"#3ecf8e", 2:"#4d94d6", 3:"#a78bfa", 4:"#e0a33a", 0:"#6b7681" };
export const TRUCK_COLORS = { 'AF 123 MG': '#22c55e', 'AE 456 MG': '#38bdf8', 'AD 789 MG': '#a78bfa', 'AG 321 MG': '#fb923c' };
const CIRCULOS = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮","⑯","⑰","⑱","⑲","⑳"];
function numeroCirculo(n) { return (n >= 1 && n <= 20) ? CIRCULOS[n-1] : `(${n})`; }

export default function MapaLocalesGPS({ recorridos = [], pedidoData = null, gpsList = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({ markers: [], polylines: [], truckMarkers: [], truckPolylines: [] });

  const [filterRecorrido, setFilterRecorrido] = useState('');
  const [filterVuelta, setFilterVuelta] = useState('');
  const [filterTexto, setFilterTexto] = useState('');
  const [selectedTruckFilter, setSelectedTruckFilter] = useState('');

  // 1. Inicializar mapa Leaflet nativo
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, { scrollWheelZoom: true }).setView([-34.55, -58.60], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      mapInstanceRef.current = map;
    }
  }, []);

  // 2. Renderizar sucursales, rutas y camiones en vivo en el mapa
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Limpiar capas previas
    layersRef.current.markers.forEach(m => map.removeLayer(m));
    layersRef.current.polylines.forEach(p => map.removeLayer(p));
    layersRef.current.truckMarkers.forEach(tm => map.removeLayer(tm));
    layersRef.current.truckPolylines.forEach(tp => map.removeLayer(tp));
    layersRef.current = { markers: [], polylines: [], truckMarkers: [], truckPolylines: [] };

    const bounds = [];
    const ordenEnVuelta = {};

    recorridos.forEach(rec => rec.vueltas.forEach(v => {
      v.locales.forEach((l, i) => { ordenEnVuelta[l] = i + 1; });
    }));

    // a) Dibujar sucursales
    Object.entries(DIRECCIONES_COORDS).forEach(([datalive, coords]) => {
      let recId = 0;
      let recNombre = "Sin asignar";
      let vueltaNum = null;

      for (const rec of recorridos) {
        const idx = rec.vueltas.findIndex(v => v.locales.includes(datalive));
        if (idx !== -1) {
          recId = rec.id;
          recNombre = rec.nombre;
          vueltaNum = idx + 1;
          break;
        }
      }

      // Aplicar filtros
      if (filterRecorrido !== '' && String(recId) !== filterRecorrido) return;
      if (filterVuelta !== '' && String(vueltaNum) !== filterVuelta) return;
      if (filterTexto && !datalive.toLowerCase().includes(filterTexto.toLowerCase())) return;

      const color = RECORRIDO_MAP_COLORS[recId] || RECORRIDO_MAP_COLORS[0];
      const etiqueta = filterVuelta !== '' ? (ordenEnVuelta[datalive] ? String(ordenEnVuelta[datalive]) : '') : (vueltaNum ? String(vueltaNum) : '');

      const icon = L.divIcon({
        className: 'custom-store-pin',
        html: `<div style="width:${etiqueta?22:16}px;height:${etiqueta?22:16}px;border-radius:50%;background:${color};border:2px solid #0a0a0a;box-shadow:0 0 0 1px ${color};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#0a0a0a;font-family:sans-serif;">${etiqueta}</div>`,
        iconSize: etiqueta ? [22, 22] : [16, 16],
        iconAnchor: etiqueta ? [11, 11] : [8, 8]
      });

      const marker = L.marker([coords.lat, coords.lng], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:'Inter',sans-serif;font-size:12px;">
          <strong style="color:${color};font-size:14px;">${datalive}</strong><br/>
          <strong>Dirección:</strong> ${coords.dir}<br/>
          <strong>Recorrido:</strong> ${recNombre}<br/>
          ${vueltaNum ? `<strong>Vuelta:</strong> Vuelta ${vueltaNum} (Parada ${ordenEnVuelta[datalive] || '1'})` : '<i>Sin vuelta asignada</i>'}
        </div>
      `);

      layersRef.current.markers.push(marker);
      bounds.push([coords.lat, coords.lng]);
    });

    // b) Dibujar rutas polilíneas por vuelta
    recorridos.forEach(rec => {
      if (filterRecorrido !== '' && String(rec.id) !== filterRecorrido) return;
      const color = RECORRIDO_MAP_COLORS[rec.id] || RECORRIDO_MAP_COLORS[0];

      rec.vueltas.forEach((vuelta, vIdx) => {
        if (filterVuelta !== '' && String(vIdx + 1) !== filterVuelta) return;
        const puntos = vuelta.locales.map(l => DIRECCIONES_COORDS[l]).filter(Boolean).map(c => [c.lat, c.lng]);
        if (puntos.length < 2) return;

        const linea = L.polyline(puntos, { color, weight: 4, opacity: 0.6, dashArray: '6, 6' }).addTo(map);
        layersRef.current.polylines.push(linea);
      });
    });

    // c) Dibujar camiones en vivo (GPS Realtime)
    gpsList.forEach(trk => {
      if (!trk || trk.lat === undefined || trk.lng === undefined) return;
      const pat = trk.patente || 'CAMIÓN';
      if (selectedTruckFilter && pat !== selectedTruckFilter) return;

      const color = TRUCK_COLORS[pat] || '#22c55e';
      const speed = trk.speed || 0;
      const accuracy = trk.accuracy || 0;

      const truckIcon = L.divIcon({
        className: 'custom-truck-pin',
        html: `<div style="background:${color};color:#06210f;padding:7px 14px;border-radius:20px;font-weight:800;font-size:12px;border:2px solid #ffffff;box-shadow:0 0 20px ${color};display:flex;align-items:center;gap:6px;white-space:nowrap;cursor:pointer;">🚚 ${pat} (${speed} km/h)</div>`,
        iconSize: [160, 36],
        iconAnchor: [80, 18]
      });

      const trkMarker = L.marker([trk.lat, trk.lng], { icon: truckIcon, zIndexOffset: 9999 }).addTo(map);
      trkMarker.bindPopup(`
        <div style="font-family:'Inter',sans-serif;font-size:12px;">
          <strong style="color:${color};font-size:14px;">🚚 CAMIÓN EN VIVO (${pat})</strong><br/>
          <strong>Estado:</strong> 🟢 Transmitiendo GPS en vivo<br/>
          <strong>Velocidad:</strong> ${speed} km/h<br/>
          <strong>Precisión:</strong> ${accuracy} m<br/>
          <small style="color:#9aa4ad;">Última señal: ${trk.updatedAt || 'Reciente'}</small>
        </div>
      `);
      layersRef.current.truckMarkers.push(trkMarker);
      bounds.push([trk.lat, trk.lng]);

      if (trk.trail && trk.trail.length > 1) {
        const trailLine = L.polyline(trk.trail, { color, weight: 5, opacity: 0.9, dashArray: '8, 6' }).addTo(map);
        layersRef.current.truckPolylines.push(trailLine);
      }
    });

    if (bounds.length > 0 && map) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [recorridos, gpsList, filterRecorrido, filterVuelta, filterTexto, selectedTruckFilter]);

  const handleCenterOnTruck = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const target = selectedTruckFilter
      ? gpsList.find(t => t.patente === selectedTruckFilter)
      : gpsList[0];

    if (target && target.lat && target.lng) {
      map.setView([target.lat, target.lng], 14, { animate: true });
    }
  };

  return (
    <div style={{ background: '#14171a', border: '1px solid #242a30', borderRadius: '10px', padding: '20px', marginBottom: '16px' }}>
      <style>{`
        .custom-store-pin, .custom-truck-pin { background: transparent !important; border: none !important; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ color: '#3ecf8e', fontSize: '16px', fontWeight: 800, margin: 0 }}>🗺️ Mapa de sucursales & Camiones en Vivo</h2>
          <p style={{ fontSize: '11px', color: '#9aa4ad', margin: '4px 0 0' }}>Pines numerados por vuelta y marcadores GPS en tiempo real</p>
        </div>

        {/* Toolbar de Filtros */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={filterRecorrido}
            onChange={e => setFilterRecorrido(e.target.value)}
            style={{ background: '#0d0f11', border: '1px solid #242a30', color: '#e8ecef', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
          >
            <option value="">Todos los recorridos</option>
            <option value="1">CABA</option>
            <option value="2">CAMPANA</option>
            <option value="3">Z. NORTE</option>
            <option value="4">4TO CAMIÓN</option>
          </select>

          <select
            value={selectedTruckFilter}
            onChange={e => setSelectedTruckFilter(e.target.value)}
            style={{ background: '#0d0f11', border: '1px solid #3ecf8e', color: '#3ecf8e', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}
          >
            <option value="">🚚 Todos los camiones en vivo</option>
            <option value="AF 123 MG">Camión AF 123 MG</option>
            <option value="AE 456 MG">Camión AE 456 MG</option>
            <option value="AD 789 MG">Camión AD 789 MG</option>
            <option value="AG 321 MG">Camión AG 321 MG</option>
          </select>

          <button
            type="button"
            onClick={handleCenterOnTruck}
            style={{ background: 'rgba(62, 207, 142, 0.15)', color: '#3ecf8e', border: '1px solid #3ecf8e', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
          >
            🎯 Ubicar Camión
          </button>
        </div>
      </div>

      {/* Contenedor del Mapa Leaflet Nativo */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '520px',
          borderRadius: '8px',
          border: '1px solid #242a30',
          background: '#0d0f11',
          zIndex: 1
        }}
      />
    </div>
  );
}
