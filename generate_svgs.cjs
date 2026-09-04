const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

function makeSVG(title, subtitle, color, bgType) {
  let shape = "";
  if (bgType === "mantenimiento") {
    shape = `<g stroke="${color}" stroke-width="2.5" opacity="0.4" fill="none">
      <circle cx="580" cy="250" r="110" stroke-dasharray="12,12"/>
      <circle cx="580" cy="250" r="60"/>
      <path d="M 580 90 L 580 410 M 420 250 L 740 250"/>
      <path d="M 470 140 L 690 360 M 470 360 L 690 140"/>
    </g>`;
  } else if (bgType === "marketing") {
    shape = `<g stroke="${color}" stroke-width="3" opacity="0.45" fill="none">
      <path d="M 460 340 L 540 180 L 640 240 L 720 120 M 720 120 L 670 120 M 720 120 L 720 170" />
      <circle cx="540" cy="180" r="8" fill="${color}"/>
      <circle cx="640" cy="240" r="8" fill="${color}"/>
      <circle cx="720" cy="120" r="10" fill="${color}"/>
    </g>`;
  } else if (bgType === "compras") {
    shape = `<g stroke="${color}" stroke-width="2.5" opacity="0.4" fill="none">
      <rect x="480" y="140" width="220" height="230" rx="14"/>
      <line x1="520" y1="190" x2="660" y2="190"/>
      <line x1="520" y1="230" x2="620" y2="230"/>
      <line x1="520" y1="270" x2="580" y2="270"/>
      <circle cx="650" cy="270" r="22" stroke="${color}" stroke-width="3"/>
      <text x="643" y="278" fill="${color}" font-family="sans-serif" font-weight="bold" font-size="22">$</text>
    </g>`;
  } else if (bgType === "sistemas") {
    shape = `<g stroke="${color}" stroke-width="2.5" opacity="0.45" fill="none">
      <rect x="460" y="120" width="260" height="170" rx="12"/>
      <line x1="460" y1="160" x2="720" y2="160"/>
      <circle cx="490" cy="140" r="5" fill="${color}"/>
      <circle cx="510" cy="140" r="5" fill="${color}"/>
      <polyline points="490,210 540,240 490,270"/>
      <line x1="560" y1="270" x2="600" y2="270"/>
    </g>`;
  } else if (bgType === "desarrollo") {
    shape = `<g stroke="${color}" stroke-width="2.5" opacity="0.45" fill="none">
      <path d="M 520 340 L 560 220 L 560 160 L 600 160 L 600 220 L 640 340 Z"/>
      <ellipse cx="580" cy="310" rx="40" ry="15" fill="${color}" opacity="0.5"/>
      <circle cx="570" cy="260" r="6" stroke="${color}"/>
      <circle cx="590" cy="230" r="4" stroke="${color}"/>
    </g>`;
  } else if (bgType === "picadillo") {
    shape = `<g stroke="${color}" stroke-width="2.5" opacity="0.4" fill="none">
      <rect x="460" y="220" width="240" height="120" rx="16"/>
      <ellipse cx="580" cy="220" rx="120" ry="40"/>
      <path d="M 500 220 C 500 240, 660 240, 660 220" stroke-dasharray="6,6"/>
    </g>`;
  } else if (bgType === "salsas") {
    shape = `<g stroke="${color}" stroke-width="2.5" opacity="0.4" fill="none">
      <path d="M 580 130 C 510 230, 480 270, 480 320 C 480 375, 525 410, 580 410 C 635 410, 680 375, 680 320 C 680 270, 650 230, 580 130 Z"/>
    </g>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#080c14"/>
        <stop offset="60%" stop-color="#0e1726"/>
        <stop offset="100%" stop-color="#04060a"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.1"/>
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="800" height="500" fill="url(#bg)"/>
    <rect width="800" height="500" fill="url(#grid)"/>
    <circle cx="600" cy="250" r="260" fill="${color}" opacity="0.15" filter="blur(50px)"/>
    ${shape}
    <rect x="50" y="410" width="320" height="4" fill="url(#accent)" rx="2"/>
    <text x="50" y="345" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="44" letter-spacing="3">${title}</text>
    <text x="50" y="385" fill="${color}" font-family="sans-serif" font-weight="700" font-size="18" letter-spacing="4">${subtitle}</text>
  </svg>`;
}

const items = [
  { name: "bg_mantenimiento.svg", title: "MANTENIMIENTO", subtitle: "TALLER & REPARACIÓN INDUSTRIAL", color: "#9ca3af", type: "mantenimiento" },
  { name: "bg_marketing.svg", title: "MARKETING", subtitle: "PROMOCIÓN & PUBLICIDAD DE MARCA", color: "#e879f9", type: "marketing" },
  { name: "bg_compras.svg", title: "COMPRAS", subtitle: "GESTIÓN FINANCIERA & BALANCE", color: "#22d3ee", type: "compras" },
  { name: "bg_sistemas.svg", title: "SISTEMAS", subtitle: "PANELES TECNOLÓGICOS & IT", color: "#818cf8", type: "sistemas" },
  { name: "bg_desarrollo_gustos.svg", title: "DESARROLLO", subtitle: "TESTEO & DEGUSTACIÓN DE GUSTOS", color: "#60a5fa", type: "desarrollo" },
  { name: "bg_picadillo_rellenos.svg", title: "PICADILLO", subtitle: "MESAS & MEZCLA DE RELLENOS", color: "#22d3ee", type: "picadillo" },
  { name: "bg_salsas_elaboracion.svg", title: "SALSAS", subtitle: "ELABORACIÓN & DOSIFICACIÓN DE SALSAS", color: "#38bdf8", type: "salsas" }
];

items.forEach(item => {
  fs.writeFileSync(path.join(publicDir, item.name), makeSVG(item.title, item.subtitle, item.color, item.type));
  console.log("Created:", item.name);
});
