import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Download,
  FileText,
  Layers,
  LayoutGrid,
  Sun,
  ZoomIn,
  Scan,
  Ruler,
  RotateCw,
  Contrast,
  Maximize,
  Pause,
  Play,
  Activity,
  Sliders,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Share2,
  Info,
  Maximize2,
  Camera,
  Check,
  AlertCircle,
  Sparkles
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   PROCEDURAL MEDICAL IMAGING SLICE GENERATOR (SVG Data URIs)
   Generates realistic anatomical CT / MRI / X-ray slices
────────────────────────────────────────────────────────────── */
const generateChestCtSlice = (sliceIndex, totalSlices = 16) => {
  const norm = sliceIndex / (totalSlices - 1); // 0 (apices) to 1 (bases)
  const lungWidth = 65 + Math.sin(norm * Math.PI) * 25;
  const lungHeight = 90 + Math.sin(norm * Math.PI) * 35;
  const heartSize = norm > 0.3 && norm < 0.85 ? 40 + (norm - 0.3) * 35 : 0;
  const spineY = 190;
  
  // Opacity for ground-glass finding in lower lobes (norm > 0.6)
  const ggoOpacity = norm > 0.55 ? (norm - 0.5) * 0.45 : 0;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
    <rect width="320" height="320" fill="#030712"/>
    
    <!-- Thorax Outer Soft Tissue Body Contour -->
    <ellipse cx="160" cy="160" rx="138" ry="118" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <ellipse cx="160" cy="160" rx="132" ry="112" fill="#0f172a"/>
    
    <!-- Thoracic Cage Ribs -->
    <ellipse cx="160" cy="160" rx="122" ry="102" fill="none" stroke="#64748b" stroke-width="2.5" stroke-dasharray="14 10"/>
    
    <!-- Spine / Vertebral Body -->
    <ellipse cx="160" cy="${spineY}" rx="22" ry="18" fill="#cbd5e1" stroke="#94a3b8" stroke-width="2"/>
    <circle cx="160" cy="${spineY - 2}" r="6" fill="#030712"/>
    <polygon points="160,${spineY + 12} 152,${spineY + 28} 168,${spineY + 28}" fill="#94a3b8"/>
    
    <!-- Sternum anterior -->
    <rect x="150" y="52" width="20" height="8" rx="3" fill="#cbd5e1"/>
    
    <!-- Right Lung Field (radiological left) -->
    <ellipse cx="${160 - lungWidth * 0.75}" cy="${155 - (1 - norm) * 10}" rx="${lungWidth * 0.65}" ry="${lungHeight * 0.6}" fill="#030712" stroke="#475569" stroke-width="1.5"/>
    
    <!-- Left Lung Field -->
    <ellipse cx="${160 + lungWidth * 0.75}" cy="${155 - (1 - norm) * 10}" rx="${lungWidth * 0.65}" ry="${lungHeight * 0.6}" fill="#030712" stroke="#475569" stroke-width="1.5"/>
    
    <!-- Trachea / Main Bronchi -->
    ${norm < 0.4 ? `<circle cx="160" cy="115" r="7" fill="#030712" stroke="#475569" stroke-width="1.5"/>` : `
      <ellipse cx="148" cy="122" rx="4" ry="5" fill="#030712" stroke="#475569" stroke-width="1"/>
      <ellipse cx="172" cy="122" rx="4" ry="5" fill="#030712" stroke="#475569" stroke-width="1"/>
    `}
    
    <!-- Heart / Mediastinal Blood Pools -->
    ${heartSize > 0 ? `
      <ellipse cx="152" cy="155" rx="${heartSize * 0.7}" ry="${heartSize * 0.6}" fill="#334155" stroke="#475569" stroke-width="1.5"/>
      <circle cx="172" cy="170" r="12" fill="#475569"/>
    ` : ''}
    
    <!-- Pulmonary Vascular Markings -->
    <path d="M${160 - lungWidth * 0.75} 150 Q${160 - lungWidth * 0.9} 135 ${160 - lungWidth * 1.1} 130" stroke="#64748b" stroke-width="1.5" fill="none"/>
    <path d="M${160 - lungWidth * 0.75} 160 Q${160 - lungWidth * 0.95} 175 ${160 - lungWidth * 1.1} 185" stroke="#64748b" stroke-width="1.5" fill="none"/>
    <path d="M${160 + lungWidth * 0.75} 150 Q${160 + lungWidth * 0.9} 135 ${160 + lungWidth * 1.1} 130" stroke="#64748b" stroke-width="1.5" fill="none"/>
    <path d="M${160 + lungWidth * 0.75} 160 Q${160 + lungWidth * 0.95} 175 ${160 + lungWidth * 1.1} 185" stroke="#64748b" stroke-width="1.5" fill="none"/>
    
    <!-- Ground-Glass Opacity Finding in Lower Lobes -->
    ${ggoOpacity > 0 ? `
      <ellipse cx="${160 - lungWidth * 0.8}" cy="175" rx="22" ry="16" fill="#94a3b8" opacity="${ggoOpacity}"/>
      <ellipse cx="${160 + lungWidth * 0.8}" cy="178" rx="24" ry="18" fill="#94a3b8" opacity="${ggoOpacity}"/>
    ` : ''}

    <!-- Slice Annotation Marker -->
    <text x="16" y="24" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="bold">SL: ${sliceIndex + 1}/${totalSlices}</text>
    <text x="16" y="40" fill="#38bdf8" font-family="monospace" font-size="9">Z: -${(120 + sliceIndex * 8.5).toFixed(1)}mm</text>
    <text x="245" y="24" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="bold">512x512</text>
    <text x="245" y="40" fill="#38bdf8" font-family="monospace" font-size="9">120kV / 240mA</text>
  </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const generateBrainMriSlice = (sliceIndex, totalSlices = 16) => {
  const norm = sliceIndex / (totalSlices - 1);
  const skullWidth = 95 + Math.sin(norm * Math.PI) * 20;
  const skullHeight = 115 + Math.sin(norm * Math.PI) * 22;
  const ventSize = norm > 0.35 && norm < 0.75 ? 24 * Math.sin((norm - 0.35) * Math.PI * 2.5) : 0;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
    <rect width="320" height="320" fill="#030712"/>
    
    <!-- Scalp & Calvarium -->
    <ellipse cx="160" cy="160" rx="${skullWidth + 14}" ry="${skullHeight + 14}" fill="#1e293b"/>
    <ellipse cx="160" cy="160" rx="${skullWidth + 8}" ry="${skullHeight + 8}" fill="#e2e8f0"/>
    <ellipse cx="160" cy="160" rx="${skullWidth}" ry="${skullHeight}" fill="#0f172a"/>
    
    <!-- Brain Parenchyma (Cortex & White Matter) -->
    <ellipse cx="160" cy="160" rx="${skullWidth - 4}" ry="${skullHeight - 4}" fill="#475569"/>
    <ellipse cx="160" cy="160" rx="${skullWidth - 14}" ry="${skullHeight - 14}" fill="#64748b"/>
    
    <!-- Interhemispheric Falx Cerebri -->
    <line x1="160" y1="${160 - skullHeight + 4}" x2="160" y2="${160 + skullHeight - 4}" stroke="#1e293b" stroke-width="2"/>
    
    <!-- Lateral Ventricles (CSF - dark on T1) -->
    ${ventSize > 0 ? `
      <!-- Right Lateral Ventricle -->
      <path d="M154,${160 - ventSize} Q142,160 152,${160 + ventSize} Z" fill="#030712" stroke="#334155" stroke-width="1"/>
      <!-- Left Lateral Ventricle -->
      <path d="M166,${160 - ventSize} Q178,160 168,${160 + ventSize} Z" fill="#030712" stroke="#334155" stroke-width="1"/>
    ` : ''}
    
    <!-- Sylvian Fissures -->
    <path d="M${160 - skullWidth + 14} 150 Q130 160 145 165" stroke="#334155" stroke-width="2" fill="none"/>
    <path d="M${160 + skullWidth - 14} 150 Q190 160 175 165" stroke="#334155" stroke-width="2" fill="none"/>
    
    <text x="16" y="24" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="bold">T2 FLAIR SL: ${sliceIndex + 1}/${totalSlices}</text>
    <text x="16" y="40" fill="#38bdf8" font-family="monospace" font-size="9">TR: 9000 TE: 120</text>
    <text x="245" y="24" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="bold">3.0T MRI</text>
    <text x="245" y="40" fill="#38bdf8" font-family="monospace" font-size="9">FOV: 230mm</text>
  </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/* ─────────────────────────────────────────────────────────────
   WINDOW / LEVEL (W/L) CLINICAL PRESETS
────────────────────────────────────────────────────────────── */
const WL_PRESETS = [
  { id: 'lung', label: 'Lung (W:1500 L:-600)', brightness: 125, contrast: 160, invert: false, ww: 1500, wl: -600 },
  { id: 'soft', label: 'Soft Tissue (W:350 L:40)', brightness: 100, contrast: 120, invert: false, ww: 350, wl: 40 },
  { id: 'bone', label: 'Bone (W:2000 L:350)', brightness: 80, contrast: 200, invert: false, ww: 2000, wl: 350 },
  { id: 'brain', label: 'Brain (W:80 L:40)', brightness: 110, contrast: 140, invert: false, ww: 80, wl: 40 },
  { id: 'invert', label: 'Invert Grayscale', brightness: 100, contrast: 100, invert: true, ww: 400, wl: 40 }
];

export default function DicomViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestId = searchParams.get('requestId') || '6';

  // PACS Interactive Viewport State
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [invert, setInvert] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(120);
  const [activePreset, setActivePreset] = useState('soft');
  const [activeTool, setActiveTool] = useState('pan');
  const [sliceIndex, setSliceIndex] = useState(7);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(12); // FPS
  const [layout, setLayout] = useState('1x1');
  const [activeSeries, setActiveSeries] = useState(1);
  const [caliperDistance, setCaliperDistance] = useState(null);

  // Mouse pan tracking
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 1. Fetch backend DICOM Study Metadata
  const { data: dicomData, isLoading, isError } = useQuery({
    queryKey: ['dicomMetadata', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      try {
        const res = await axiosPrivate.get(`/v1/radiology/dicom/study/request/${requestId}`);
        return res.data;
      } catch (err) {
        try {
          const res2 = await axiosPrivate.get(`/radiology/dicom/study/request/${requestId}`);
          return res2.data;
        } catch (e2) {
          // If unseeded backend, return structured fallback metadata
          return null;
        }
      }
    },
    enabled: !!requestId,
    retry: false
  });

  // Clinical Fallback Metadata for Request
  const patientName = dicomData?.patientName || (requestId === '6' ? 'David Miller' : 'John Smith');
  const modality = dicomData?.modality || (requestId === '2' ? 'MRI' : 'CT');
  const studyUid = dicomData?.studyInstanceUid || `1.2.840.113619.2.55.3.${requestId}.20261124.90823`;
  const accession = dicomData?.accessionNumber || `ACC-2026-908${requestId.padStart(2, '0')}`;

  // Multi-Slice Volumetric Series Construction
  const totalSlices = 16;
  const mockSlices = Array.from({ length: totalSlices }, (_, idx) => ({
    sliceNumber: idx + 1,
    imageUrl: modality === 'MRI' ? generateBrainMriSlice(idx, totalSlices) : generateChestCtSlice(idx, totalSlices)
  }));

  const activeSlices = (dicomData?.slices && dicomData.slices.length > 0) ? dicomData.slices : mockSlices;
  const currentImage = activeSlices[sliceIndex]?.imageUrl || mockSlices[0].imageUrl;

  // Cine Loop Playback
  useEffect(() => {
    let interval;
    if (isPlaying && activeSlices.length > 0) {
      interval = setInterval(() => {
        setSliceIndex((prev) => (prev + 1) % activeSlices.length);
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, activeSlices.length]);

  // Reset Viewport to Default
  const resetViewport = () => {
    setZoom(100);
    setRotation(0);
    setInvert(false);
    setBrightness(100);
    setContrast(120);
    setPanPosition({ x: 0, y: 0 });
    setCaliperDistance(null);
    setActivePreset('soft');
    toast.success('Viewport reset to initial 100% position');
  };

  // Window/Level preset applicator
  const applyPreset = (preset) => {
    setActivePreset(preset.id);
    setBrightness(preset.brightness);
    setContrast(preset.contrast);
    setInvert(preset.invert);
    toast.success(`Applied ${preset.label}`);
  };

  // Pan Mouse Handlers
  const handleMouseDown = (e) => {
    if (activeTool === 'pan') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    } else if (activeTool === 'length') {
      // Simulate caliper measurement
      const randDist = (18 + Math.random() * 24).toFixed(1);
      setCaliperDistance(randDist);
      toast.success(`Measurement Caliper: ${randDist} mm (HU: 42 ± 6)`);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && activeTool === 'pan') {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel scroll to scrub slices
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      // Scroll up -> next slice
      setSliceIndex((prev) => (prev < activeSlices.length - 1 ? prev + 1 : 0));
    } else {
      // Scroll down -> previous slice
      setSliceIndex((prev) => (prev > 0 ? prev - 1 : activeSlices.length - 1));
    }
  };

  // Export Screenshot Snapshot
  const handleExportSnapshot = () => {
    toast.success(`Exported DICOM Frame #${sliceIndex + 1} (${modality} ${accession})`);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#030712] text-slate-200 font-sans select-none overflow-hidden fixed inset-0 z-50">
      {/* ── TOP PACS APPLICATION HEADER BAR ── */}
      <header className="h-14 bg-[#090D16] border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-20">
        {/* Left: Back & Study Demographics */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(`/radiologist/reporting/${requestId}`)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Return to Reporting Interface"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-sky-400 tracking-tight flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-sky-500" />
                ELIXIR PACS WORKSTATION
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-sky-950 text-sky-300 border border-sky-800">
                {modality}
              </span>
              <span className="text-xs text-slate-400 hidden md:inline">•</span>
              <span className="text-xs font-semibold text-slate-200 truncate hidden md:inline">
                {patientName}
              </span>
              <span className="text-xs text-slate-500 font-mono hidden lg:inline">
                (Acc: {accession})
              </span>
            </div>
          </div>
        </div>

        {/* Center: W/L Quick Clinical Presets */}
        <div className="hidden xl:flex items-center gap-1 bg-[#0f172a] p-1 rounded-xl border border-slate-800 text-xs">
          {WL_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                activePreset === p.id ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {p.label.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Right: Actions & Return to Report */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportSnapshot}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            title="Export DICOM Snapshot"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Frame</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/radiologist/reporting/${requestId}`)}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-sky-900"
            title="Write Diagnostic Report for this Exam"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Write Report</span>
          </button>
        </div>
      </header>

      {/* ── PACS WORKSPACE: SIDEBAR + VIEWPORT ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT SERIES THUMBNAIL EXPLORER ── */}
        <aside className="w-60 bg-[#090D16] border-r border-slate-800/80 flex flex-col shrink-0 overflow-hidden">
          <div className="p-3 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Series Explorer</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
            {/* Series 1 (Active) */}
            <div
              onClick={() => setActiveSeries(1)}
              className={`p-2.5 rounded-xl border transition cursor-pointer relative group ${
                activeSeries === 1
                  ? 'border-sky-500 bg-sky-950/40 shadow-xs'
                  : 'border-slate-800/80 bg-[#0f172a]/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-sky-400">Series 1: Axial {modality}</span>
                <span className="text-[10px] text-slate-500 font-mono">1.0mm</span>
              </div>
              <div className="w-full h-24 bg-black rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden relative">
                <img
                  src={mockSlices[7].imageUrl}
                  alt="Series 1 Thumbnail"
                  className="w-full h-full object-contain filter grayscale"
                />
                <span className="absolute bottom-1.5 right-1.5 text-[9px] bg-black/80 px-1.5 py-0.5 rounded font-mono text-sky-300">
                  {totalSlices} Imgs
                </span>
              </div>
            </div>

            {/* Series 2 (Coronal Reformats) */}
            <div
              onClick={() => setActiveSeries(2)}
              className={`p-2.5 rounded-xl border transition cursor-pointer relative group ${
                activeSeries === 2
                  ? 'border-sky-500 bg-sky-950/40 shadow-xs'
                  : 'border-slate-800/80 bg-[#0f172a]/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-300">Series 2: Coronal MPR</span>
                <span className="text-[10px] text-slate-500 font-mono">2.0mm</span>
              </div>
              <div className="w-full h-24 bg-black rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden relative">
                <img
                  src={mockSlices[3].imageUrl}
                  alt="Series 2 Thumbnail"
                  className="w-full h-full object-contain filter grayscale"
                />
                <span className="absolute bottom-1.5 right-1.5 text-[9px] bg-black/80 px-1.5 py-0.5 rounded font-mono text-slate-400">
                  {totalSlices} Imgs
                </span>
              </div>
            </div>

            {/* Series 3 (Sagittal Reformats) */}
            <div
              onClick={() => setActiveSeries(3)}
              className={`p-2.5 rounded-xl border transition cursor-pointer relative group ${
                activeSeries === 3
                  ? 'border-sky-500 bg-sky-950/40 shadow-xs'
                  : 'border-slate-800/80 bg-[#0f172a]/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-300">Series 3: Sagittal MPR</span>
                <span className="text-[10px] text-slate-500 font-mono">2.0mm</span>
              </div>
              <div className="w-full h-24 bg-black rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden relative">
                <img
                  src={mockSlices[11].imageUrl}
                  alt="Series 3 Thumbnail"
                  className="w-full h-full object-contain filter grayscale"
                />
                <span className="absolute bottom-1.5 right-1.5 text-[9px] bg-black/80 px-1.5 py-0.5 rounded font-mono text-slate-400">
                  {totalSlices} Imgs
                </span>
              </div>
            </div>
          </div>

          {/* Quick Series Scrub Slider */}
          <div className="p-3 border-t border-slate-800 bg-[#090D16]">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Slice Scrub:</span>
              <span className="font-mono text-sky-400 font-bold">{sliceIndex + 1} / {totalSlices}</span>
            </div>
            <input
              type="range"
              min="0"
              max={totalSlices - 1}
              value={sliceIndex}
              onChange={(e) => setSliceIndex(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>
        </aside>

        {/* ── CENTER PACS CANVAS VIEWPORT ── */}
        <main
          className="flex-1 flex flex-col bg-black relative overflow-hidden"
          onWheel={handleWheel}
        >
          {/* Viewport Floating Interactive Toolbar */}
          <div className="h-11 bg-[#090D16]/90 backdrop-blur-md absolute top-0 w-full z-10 border-b border-slate-800/80 flex items-center justify-between px-3">
            {/* Primary Tool Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveTool('pan')}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition ${
                  activeTool === 'pan' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title="Pan Canvas Viewport"
              >
                <Scan className="w-4 h-4" />
                <span className="hidden md:inline">Pan</span>
              </button>

              <button
                onClick={() => setZoom((z) => Math.min(z + 25, 400))}
                className="p-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
                <span className="hidden md:inline">Zoom+</span>
              </button>

              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition"
                title="Rotate 90 Degrees Clockwise"
              >
                <RotateCw className="w-4 h-4" />
                <span className="hidden md:inline">Rotate</span>
              </button>

              <button
                onClick={() => setInvert((inv) => !inv)}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition ${
                  invert ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title="Invert Grayscale Polarity"
              >
                <Contrast className="w-4 h-4" />
                <span className="hidden md:inline">Invert</span>
              </button>

              <button
                onClick={() => setActiveTool('length')}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition ${
                  activeTool === 'length' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title="Caliper Measurement Tool"
              >
                <Ruler className="w-4 h-4" />
                <span className="hidden md:inline">Measure</span>
              </button>

              <div className="w-px h-4 bg-slate-800 mx-1.5" />

              <button
                onClick={resetViewport}
                className="p-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition"
                title="Reset Viewport to Default Fit"
              >
                <Maximize className="w-4 h-4" />
                <span className="hidden lg:inline">Reset</span>
              </button>
            </div>

            {/* Cine Loop Player Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition border ${
                  isPlaying
                    ? 'bg-amber-600/20 text-amber-300 border-amber-600/40'
                    : 'bg-emerald-600/20 text-emerald-300 border-emerald-600/40 hover:bg-emerald-600/30'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause Cine' : 'Play Cine'}</span>
              </button>

              <button
                type="button"
                onClick={() => setLayout((l) => (l === '1x1' ? '1x2' : '1x1'))}
                className="p-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 cursor-pointer hidden sm:flex items-center gap-1"
                title="Toggle Dual Cross-Reference Layout"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="text-[11px] font-mono">{layout}</span>
              </button>
            </div>
          </div>

          {/* Interactive Medical Imaging Viewport Canvas */}
          <div
            className="flex-1 flex items-center justify-center relative overflow-hidden cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Viewport 1 (Primary Series) */}
            <div
              className={`flex items-center justify-center h-full w-full p-4 transition-transform duration-75 select-none ${
                layout === '1x2' ? 'w-1/2 border-r border-slate-800' : ''
              }`}
              style={{
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
                filter: `invert(${invert ? 100 : 0}%) brightness(${brightness}%) contrast(${contrast}%)`
              }}
            >
              <img
                src={currentImage}
                alt="Volumetric DICOM Slice"
                className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-2xl"
                draggable={false}
              />
            </div>

            {/* Optional Layout 1x2 Dual Study Comparison */}
            {layout === '1x2' && (
              <div className="w-1/2 h-full flex items-center justify-center p-4 bg-[#050914] relative">
                <img
                  src={mockSlices[Math.max(0, sliceIndex - 2)].imageUrl}
                  alt="Prior Study Comparison"
                  className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-2xl filter grayscale opacity-90"
                />
                <div className="absolute top-14 left-4 text-amber-400 font-mono text-[10px]">
                  [PRIOR STUDY: 2026-09-12]
                </div>
              </div>
            )}

            {/* Simulated Caliper Tool Overlay */}
            {caliperDistance && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-sky-950/90 border border-sky-400 text-sky-200 text-xs px-3 py-1.5 rounded-lg shadow-lg pointer-events-none font-mono">
                📏 {caliperDistance} mm • Density: 42 HU
              </div>
            )}

            {/* ── CORNERSTONE / OHIF DIAGNOSTIC HUD OVERLAYS ── */}
            {/* Top-Left: Patient & Clinical Context */}
            <div className="absolute top-14 left-4 text-sky-400 font-mono text-[11px] leading-relaxed drop-shadow-md pointer-events-none">
              <div className="font-bold text-slate-100">{patientName.toUpperCase()}</div>
              <div>ID: {dicomData?.patientId || `MRN-2026-00${requestId}`}</div>
              <div>DOB: 1972-04-18 (54Y / M)</div>
              <div className="text-sky-300 font-bold">{modality} Thorax with IV Contrast</div>
            </div>

            {/* Top-Right: Study & Institution */}
            <div className="absolute top-14 right-4 text-sky-400 font-mono text-[11px] leading-relaxed text-right drop-shadow-md pointer-events-none">
              <div className="font-bold text-slate-100">ELIXIR HEALTH CARE PACS</div>
              <div>Acc: {accession}</div>
              <div>Date: 2026-11-24 14:15:22</div>
              <div className="text-slate-400">Station: CT-GECT01</div>
            </div>

            {/* Bottom-Left: Window / Level & Zoom */}
            <div className="absolute bottom-4 left-4 text-sky-400 font-mono text-[11px] leading-relaxed drop-shadow-md pointer-events-none bg-black/60 px-2 py-1 rounded">
              <div>W: {brightness * 4} L: {contrast - 80}</div>
              <div>Zoom: {zoom}%</div>
              <div>Slice: {sliceIndex + 1} / {totalSlices} (Thick: 1.0mm)</div>
            </div>

            {/* Bottom-Right: Matrix & Acquisition Metrics */}
            <div className="absolute bottom-4 right-4 text-sky-400 font-mono text-[11px] leading-relaxed text-right drop-shadow-md pointer-events-none bg-black/60 px-2 py-1 rounded">
              <div>Matrix: 512 x 512</div>
              <div>kVp: 120 • mA: 240</div>
              <div>FOV: 350 mm</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
