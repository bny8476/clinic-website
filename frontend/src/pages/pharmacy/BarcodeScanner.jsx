import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Truck, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import pharmacyService from '../../utils/pharmacy/pharmacyService';
import { useMutation, useQueryClient } from '@tanstack/react-query';



export default function BarcodeScanner() {
  const [barcodeValue, setBarcodeValue] = useState('');
  const [scanModule, setScanModule] = useState('SALES');
  const [scans, setScans] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: (term) => pharmacyService.scanBarcode(term, scanModule, 1),
    onSuccess: (res, term) => {
      if (res.success || res.id) {
        toast.success(`Barcode detected: "${term}" (${res.data?.medicineName || 'Scanned Logged'})`);
        setScans(prev => [res.data || res, ...prev]);
        setBarcodeValue('');
        queryClient.invalidateQueries(['stocks']);
      } else {
        toast.error('Barcode lookup failed');
      }
    },
    onError: () => {
      toast.error('Error logging scanned barcode');
    }
  });

  // USB listener
  useEffect(() => {
    let buffer = '';
    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        if (buffer.length > 3) {
          handleScanSubmit(buffer);
          buffer = '';
        }
      } else {
        buffer += e.key;
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [scanModule]);

  const handleScanSubmit = (val = barcodeValue) => {
    const term = val?.trim();
    if (!term) return;
    scanMutation.mutate(term);
  };

  const startCamera = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      toast.success('Camera scan simulation active. Point to barcode.');
    } catch (err) {
      toast.error('Could not access camera. Using simulation mode.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const simulateCameraScan = () => {
    // Generate a random valid sample barcode
    const barcodes = ['8901043000494', '8901234567890', 'BTH9080-VAL', 'NARC-X-441'];
    const idx = Math.floor(Math.random() * barcodes.length);
    setBarcodeValue(barcodes[idx]);
    toast.success('Simulation detected barcode code!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
          <QrCode className="w-7 h-7 text-blue-500" />
        </div>
        <div>
          <h2 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">Barcode & QR Scanner</h2>
          <p className="text-sm text-slate-500 font-medium">Supports hardware USB scanner attachment (plug-and-play listener) or camera capture decoding.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanning Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Select Operating Module</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'SALES', label: 'SALES', icon: ShoppingCart },
                { id: 'GRN_ENTRY', label: 'GRN ENTRY', icon: Truck },
                { id: 'INVENTORY', label: 'INVENTORY', icon: Package }
              ].map(mod => {
                const Icon = mod.icon;
                return (
    
                  <button
                    key={mod.id}
                    onClick={() => setScanModule(mod.id)}
                    className={`py-3 text-sm font-bold rounded-full border transition-all flex items-center justify-center gap-2 ${
                      scanModule === mod.id
                        ? 'bg-[#1d4ed8] border-[#1d4ed8] text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {mod.label}
                  </button>
                );
              })}
            </div>

            {/* Simulated/Manual Input */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Barcode / QR Value Input</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Scan with hardware scanner or enter manually..."
                    value={barcodeValue}
                    onChange={e => setBarcodeValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleScanSubmit()}
                    className="w-full pl-11 pr-4 py-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1d4ed8]/20 focus:border-[#1d4ed8] bg-white transition-colors"
                  />
                  <Barcode className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                </div>
                <button
                  onClick={() => handleScanSubmit()}
                  disabled={scanMutation.isPending || !barcodeValue}
                  className="px-6 py-3 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm shrink-0"
                >
                  <Send className="w-4 h-4" /> Submit
                </button>
              </div>
            </div>
          </div>

          {/* Camera Scanning view */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6 flex flex-col items-center shadow-sm">
            <div className="w-full flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Camera Scanner Feed</h3>
              <div className="flex gap-3">
                {isScanning ? (
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" /> Stop Camera
                  </button>
                ) : (
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-white border border-[#2563eb]/30 text-[#2563eb] hover:bg-[#2563eb]/5 font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" /> Start Camera
                  </button>
                )}
                {isScanning && (
                  <button
                    onClick={simulateCameraScan}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold rounded-xl text-sm transition-colors"
                  >
                    Simulate Detection
                  </button>
                )}
              </div>
            </div>

            {isScanning ? (
              <div className="relative w-full max-w-2xl aspect-video bg-black rounded-2xl overflow-hidden border border-slate-200">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-1 bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              </div>
            ) : (
              <div className="w-full max-w-2xl aspect-video bg-slate-50 border border-dashed border-[#BFDBFE] rounded-2xl flex flex-col items-center justify-center text-center p-8">
                <Scan className="w-16 h-16 text-slate-400 mb-4" strokeWidth={1.5} />
                <p className="text-base font-bold text-slate-700 mb-1">Camera feed offline.</p>
                <p className="text-sm text-slate-500">Click Start Camera to initialize.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Scan ledger history */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden flex flex-col shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Scan Session History</h3>
            <button className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-50 overflow-auto max-h-[800px] flex-1 flex flex-col">
            {scans.map((scan, idx) => (
              <div key={idx} className="p-5 text-sm space-y-1.5 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Module: {scan.scanModule || scanModule}</span>
                  <span className="font-mono text-slate-400 text-xs">{scan.scannedAt || 'Just Now'}</span>
                </div>
                <div className="text-slate-600">Code: <span className="font-mono font-bold text-slate-900">{scan.barcodeValue || scan.code}</span></div>
                <div className="text-xs text-slate-500">Medicine: {scan.medicineName || 'N/A'}</div>
              </div>
            ))}
            {scans.length === 0 && (
              <div className="p-8 flex-1 flex flex-col items-center justify-center text-center py-20">
                <div className="relative mb-6">
                  <ClipboardList className="w-16 h-16 text-[#BFDBFE]/40" strokeWidth={1.5} />
                  <div className="absolute -bottom-2 -right-2 p-1 bg-white rounded-full">
                    <div className="w-8 h-8 bg-[#BFDBFE]/40 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  {/* Plus decorative stars */}
                  <div className="absolute -top-2 -left-2 text-[#BFDBFE]/40 text-xl font-bold">+</div>
                  <div className="absolute top-2 -right-4 text-[#BFDBFE]/40 text-lg font-bold">+</div>
                  <div className="absolute bottom-4 -left-4 text-[#BFDBFE]/40 text-sm font-bold">+</div>
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">No barcode scans processed this session.</h4>
                <p className="text-sm text-slate-500">Scanned items will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    
  );
}
