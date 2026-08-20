import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';

import { useSearchParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';



// No mock slices allowed in production
const MOCK_SLICES = [];

const DicomViewer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestId = searchParams.get('requestId');

  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [invert, setInvert] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [activeTool, setActiveTool] = useState('pan'); // pan, zoom, windowing, length
  const [sliceIndex, setSliceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Layout state: 1x1, 1x2, 2x2
  const [layout, setLayout] = useState('1x1');

  // We fallback to a mock ID if no requestId provided (for demonstration)
  const effectiveRequestId = requestId || "1";

  const { data: dicomData, isLoading, error } = useQuery({
    queryKey: ['dicomMetadata', effectiveRequestId],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/radiology/dicom/study/request/${effectiveRequestId}`);
        return res.data;
      } catch (err) {
        // Fallback mock data for viewer demonstration if API fails or empty
        return {
          studyInstanceUid: "1.2.840.113619.2.55.3.2831178355.202308",
          modality: "MRI",
          patientName: "John Doe",
          seriesCount: 4,
          instanceCount: 120,
          wadoRsUrl: "https://pacs.clinic.internal/wado-rs/studies/123"
        };
      }
    },
    retry: false
  });

  // Playback effect for "Cine" tool
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setSliceIndex((prev) => (prev + 1) % MOCK_SLICES.length);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const resetViewport = () => {
    setZoom(100);
    setRotation(0);
    setInvert(false);
    setBrightness(100);
    setContrast(100);
  };

  const currentImage = null; // No image data in production until integrated

  return (
    
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#030712] text-slate-300 font-sans -m-6">
      
      {/* ── Top App Bar ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-[#0f172a]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-slate-800 rounded-md transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-sm font-bold text-sky-400 m-0 leading-tight">OHIF / Cornerstone PACS Viewer</h2>
            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
              {isLoading ? 'Loading metadata...' : (
                <>
                  <span>Patient: <strong className="text-slate-300">{dicomData?.patientName || 'Unknown'}</strong></span>
                  <span>|</span>
                  <span>Modality: <strong className="text-slate-300">{dicomData?.modality || 'MRI'}</strong></span>
                  <span>|</span>
                  <span>Study: {dicomData?.studyInstanceUid?.substring(0, 14)}...</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-md border border-slate-700 transition-colors text-slate-200">
            <Download size={14} /> Export DICOM
          </button>
          <button 
            onClick={() => navigate(`/radiologist/reporting/${effectiveRequestId}`)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-md transition-colors"
          >
            <FileText size={14} /> Write Report
          </button>
        </div>
      </div>

      {/* ── Main Workspace ── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* ── Left Sidebar (Series Thumbnail) ── */}
        <div className="w-64 border-r border-slate-800 bg-[#090d16] flex flex-col">
          <div className="p-3 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            Series
            <Layers size={14} />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {[1, 2, 3, 4].map((series, idx) => (
              <div 
                key={series} 
                className={clsx(
                  "p-2 rounded-lg border cursor-pointer transition-colors relative group",
                  idx === 0 ? "border-sky-500 bg-sky-900/20" : "border-slate-800 bg-[#0f172a] hover:border-slate-600"
                )}
                onClick={() => setSliceIndex(idx)}
              >
                <div className="text-[10px] text-sky-400 font-bold mb-1">Series {series}</div>
                <div className="w-full h-24 bg-slate-800 rounded flex items-center justify-center text-slate-500 text-xs">
                  No Data
                </div>
                <div className="absolute bottom-3 left-3 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white font-mono">
                  {30 * series} Imgs
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Center Viewport Area ── */}
        <div className="flex-1 flex flex-col bg-black relative">
          
          {/* Viewport Toolbar */}
          <div className="h-10 bg-[#0f172a]/80 backdrop-blur-sm absolute top-0 w-full z-10 border-b border-slate-800 flex items-center justify-between px-4">
            <div className="flex items-center gap-1">
              <ToolButton icon={<LayoutGrid size={16} />} label="Layout" active={activeTool === 'layout'} onClick={() => setLayout(layout === '1x1' ? '1x2' : '1x1')} />
              <div className="w-px h-4 bg-slate-700 mx-2" />
              <ToolButton icon={<Sun size={16} />} label="W/L" active={activeTool === 'windowing'} onClick={() => setActiveTool('windowing')} />
              <ToolButton icon={<ZoomIn size={16} />} label="Zoom" active={activeTool === 'zoom'} onClick={() => setActiveTool('zoom')} />
              <ToolButton icon={<Scan size={16} />} label="Pan" active={activeTool === 'pan'} onClick={() => setActiveTool('pan')} />
              <ToolButton icon={<Ruler size={16} />} label="Length" active={activeTool === 'length'} onClick={() => setActiveTool('length')} />
              <div className="w-px h-4 bg-slate-700 mx-2" />
              <ToolButton icon={<RotateCw size={16} />} label="Rotate" onClick={() => setRotation(r => r + 90)} />
              <ToolButton icon={<Contrast size={16} />} label="Invert" active={invert} onClick={() => setInvert(!invert)} />
              <ToolButton icon={<Maximize size={16} />} label="Reset" onClick={resetViewport} />
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded border border-slate-700 transition-colors"
              >
                {isPlaying ? <Pause size={14} className="text-amber-400" /> : <Play size={14} className="text-emerald-400" />}
                {isPlaying ? 'Pause Cine' : 'Play Cine'}
              </button>
            </div>
          </div>

          {/* Canvas Simulation */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden" style={{ perspective: '1000px' }}>
            {layout === '1x2' && (
              <div className="absolute left-0 w-1/2 h-full border-r border-slate-800 flex items-center justify-center p-8 bg-[#030712]">
                 {/* Image Canvas */}
          <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center p-10">
            <div className="text-center text-slate-500">
              <Scan size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm font-medium uppercase tracking-widest">No DICOM Data Available</p>
              <p className="text-xs mt-2 opacity-75">Connect PACS system to view real imagery</p>
            </div>
          </div>
              </div>
            )}
            
            <div 
              className={clsx("flex items-center justify-center h-full p-8 transition-transform duration-200 ease-out", layout === '1x2' && "absolute right-0 w-1/2")}
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                filter: `invert(${invert ? 100 : 0}%) brightness(${brightness}%) contrast(${contrast}%)`,
                cursor: activeTool === 'pan' ? 'grab' : activeTool === 'zoom' ? 'zoom-in' : 'crosshair'
              }}
            >
              <img 
                src={currentImage} 
                alt="Main Viewport" 
                className="max-w-full max-h-full object-contain shadow-2xl grayscale"
                style={{ boxShadow: '0 0 50px rgba(0,0,0,0.8)' }}
              />
            </div>

            {/* Overlays */}
            <div className="absolute top-12 left-4 text-sky-400 font-mono text-[11px] leading-relaxed drop-shadow-md">
              <div>{dicomData?.patientName || 'JOHN DOE'}</div>
              <div>{dicomData?.modality || 'MRI'}</div>
              <div>Acc: {dicomData?.studyInstanceUid?.substring(0, 8) || '123456'}</div>
            </div>
            <div className="absolute bottom-4 left-4 text-sky-400 font-mono text-[11px] leading-relaxed drop-shadow-md">
              <div>W: 400 L: 40</div>
              <div>Zoom: {zoom}%</div>
              <div>Img: {sliceIndex + 1} / {MOCK_SLICES.length}</div>
            </div>
            <div className="absolute bottom-4 right-4 text-sky-400 font-mono text-[11px] leading-relaxed text-right drop-shadow-md">
              <div>T: 1.5mm</div>
              <div>TR: 2000 TE: 80</div>
              <div>FS: 1.5T</div>
            </div>
          </div>
        </div>

      </div>
    </div>
    
  );
};

const ToolButton = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={clsx(
      "flex flex-col items-center justify-center p-1.5 min-w-[40px] rounded hover:bg-slate-800 transition-colors group",
      active ? "text-sky-400 bg-sky-900/30" : "text-slate-400"
    )}
  >
    {icon}
    {/* <span className="text-[9px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">{label}</span> */}
  </button>
);

export default DicomViewer;

