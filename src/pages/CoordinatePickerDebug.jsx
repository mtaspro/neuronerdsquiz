import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaCopy, FaTrash, FaArrowLeft } from 'react-icons/fa';
import PageShell from '../components/ui/PageShell';
import Button from '../components/ui/Button';

const DEFAULT_IMAGE = 'https://res.cloudinary.com/dxqtqnfgf/image/upload/v1787845449/73a5728a-e6ff-43c8-8b7e-1674fb2f32b2_bjpyww.jpg';
const CANVAS_WIDTH = 800;

const CoordinatePickerDebug = () => {
  const [searchParams] = useSearchParams();
  const imageUrl = searchParams.get('img') || DEFAULT_IMAGE;

  const imgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [points, setPoints] = useState([]);
  const [lastPoint, setLastPoint] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      setImgLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const handleCanvasClick = (e) => {
    const canvas = imgRef.current;
    if (!canvas || !imgLoaded) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * imgSize.w) / rect.width;
    const y = ((e.clientY - rect.top) * imgSize.h) / rect.height;
    const pctX = (x / imgSize.w) * 100;
    const pctY = (y / imgSize.h) * 100;

    const point = {
      id: Date.now(),
      x: Math.round(x),
      y: Math.round(y),
      px: x.toFixed(2),
      py: y.toFixed(2),
      pctX: pctX.toFixed(3),
      pctY: pctY.toFixed(3),
    };
    setLastPoint(point);
    setPoints((p) => [...p, point]);
  };

  const copyToClipboard = () => {
    if (!lastPoint) return;
    const text = `{ x: ${lastPoint.px}, y: ${lastPoint.py}, pctX: ${lastPoint.pctX}, pctY: ${lastPoint.pctY} }`;
    navigator.clipboard.writeText(text);
  };

  const copyAllPoints = () => {
    const lines = points.map((p) => `{ id: ${p.id}, x: ${p.px}, y: ${p.py}, pctX: ${p.pctX}, pctY: ${p.pctY} }`);
    navigator.clipboard.writeText(lines.join('\n'));
  };

  const clearPoints = () => {
    setPoints([]);
    setLastPoint(null);
  };

  const scale = CANVAS_WIDTH / imgSize.w;
  const canvasHeight = imgLoaded ? imgSize.h * scale : CANVAS_WIDTH;

  return (
    <PageShell className="min-h-[calc(100vh-3.5rem)] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400">
              📍
            </span>
            <div>
              <h1 className="aura-headline text-xl sm:text-2xl">Coordinate Picker (Debug)</h1>
              <p className="aura-subhead text-sm mt-0.5">Click on the board image to capture coordinates.</p>
            </div>
          </div>
          <Button to="/virtual-lab/physics" variant="secondary">
            <FaArrowLeft className="h-4 w-4 mr-2" aria-hidden />
            Back to Physics Lab
          </Button>
        </div>

        <div className="aura-glass aura-glass-card rounded-2xl border border-cyan-500/10 shadow-lg shadow-cyan-500/10 p-6 mb-6">
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="rounded-xl border border-cyan-500/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Image Dimensions</p>
              <p className="text-slate-200 font-mono">{imgLoaded ? `${imgSize.w} × ${imgSize.h} px` : 'Loading...'}</p>
            </div>
            <div className="rounded-xl border border-cyan-500/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Canvas Width</p>
              <p className="text-slate-200 font-mono">{CANVAS_WIDTH}px (scale: {scale.toFixed(4)})</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="aura-glass aura-glass-card rounded-2xl border border-cyan-500/10 shadow-lg shadow-cyan-500/10 p-4">
              <div className="relative inline-block w-full max-w-[800px]">
                {imgLoaded ? (
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="Trainer board"
                    style={{ width: CANVAS_WIDTH, height: 'auto', display: 'block' }}
                    onClick={handleCanvasClick}
                    className="rounded-lg cursor-crosshair select-none"
                    draggable={false}
                  />
                ) : (
                  <div
                    className="rounded-lg bg-slate-800/50 flex items-center justify-center"
                    style={{ width: CANVAS_WIDTH, height: canvasHeight }}
                  >
                    <p className="text-slate-400">Loading image...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="aura-glass aura-glass-card rounded-2xl border border-cyan-500/10 shadow-lg shadow-cyan-500/10 p-6">
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Last Clicked Point</p>
              {lastPoint ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400">Pixels (native)</p>
                    <p className="font-mono text-sm text-slate-200">{lastPoint.px} , {lastPoint.py}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Percentages</p>
                    <p className="font-mono text-sm text-slate-200">{lastPoint.pctX}% , {lastPoint.pctY}%</p>
                  </div>
                  <Button onClick={copyToClipboard} variant="primary" size="sm">
                    <FaCopy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No point captured yet.</p>
              )}
            </div>

            <div className="aura-glass aura-glass-card rounded-2xl border border-cyan-500/10 shadow-lg shadow-cyan-500/10 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-widest text-slate-400">Captured Points ({points.length})</p>
                <div className="flex gap-2">
                  <button
                    onClick={copyAllPoints}
                    disabled={points.length === 0}
                    className="p-1.5 rounded-lg text-xs text-slate-300 hover:bg-cyan-500/10 border border-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Copy all points"
                  >
                    <FaCopy className="h-3 w-3" />
                  </button>
                  <button
                    onClick={clearPoints}
                    disabled={points.length === 0}
                    className="p-1.5 rounded-lg text-xs text-red-300 hover:bg-red-500/10 border border-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Clear all points"
                  >
                    <FaTrash className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {points.map((p) => (
                  <div key={p.id} className="rounded-lg bg-black/20 border border-cyan-500/5 p-2 text-xs">
                    <span className="text-cyan-300 font-mono">x: {p.px}, y: {p.py}</span>
                    <span className="text-slate-500"> | pct: {p.pctX}%, {p.pctY}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default CoordinatePickerDebug;
