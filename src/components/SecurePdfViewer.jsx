import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  AlertTriangle,
  Maximize2,
} from 'lucide-react';

// Setup worker source for PDF.js
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();
} catch {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export default function SecurePdfViewer({ url, title = 'Document Viewer' }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState(null);
  const [pageInput, setPageInput] = useState('1');

  // Load PDF Document safely into memory
  useEffect(() => {
    let isCancelled = false;

    const loadDocument = async () => {
      if (!url) return;
      setLoading(true);
      setError(null);

      try {
        const loadingTask = pdfjsLib.getDocument({
          url,
          withCredentials: false,
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setPageInput('1');
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load PDF document securely:', err);
        if (!isCancelled) {
          setError('Unable to load document. Please check connection.');
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      isCancelled = true;
    };
  }, [url]);

  // Render current page onto Canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask = null;
    let isCancelled = false;

    const renderPage = async () => {
      setRendering(true);
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });

        // Calculate responsive scale based on container width
        const containerWidth = containerRef.current
          ? containerRef.current.clientWidth - 32
          : 800;

        const unscaledViewport = page.getViewport({ scale: 1 });
        const autoScale = Math.min((containerWidth / unscaledViewport.width) * scale, 2.5);
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        const viewport = page.getViewport({ scale: autoScale * pixelRatio });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${Math.floor(viewport.width / pixelRatio)}px`;
        canvas.style.height = `${Math.floor(viewport.height / pixelRatio)}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport,
          intent: 'display',
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;

        if (!isCancelled) {
          setRendering(false);
        }
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('Canvas render interrupted:', err);
        }
        if (!isCancelled) setRendering(false);
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, currentPage, scale]);

  // Prevent keyboard download shortcuts (Ctrl+S, Ctrl+P)
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      setPageInput(String(prev));
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      setPageInput(String(next));
    }
  };

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(pageInput, 10);
    if (!isNaN(val) && val >= 1 && val <= numPages) {
      setCurrentPage(val);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.0));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.6));
  const handleResetZoom = () => setScale(1.0);

  if (error) {
    return (
      <div className="p-12 text-center bg-gray-50 border border-gray-200 rounded-2xl">
        <AlertTriangle size={32} className="text-amber-500 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-gray-900 mb-1">Document Unavailable</h4>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="w-full flex flex-col bg-[#1A1D20] rounded-2xl overflow-hidden border border-gray-800 shadow-xl select-none outline-none"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Sleek Dark Protection Toolbar */}
      <div className="h-12 bg-[#111315] border-b border-gray-800 px-3 sm:px-4 flex items-center justify-between text-xs text-gray-300 flex-shrink-0 z-10">
        {/* Left: Page Navigation */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || loading}
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-gray-400 hidden sm:inline">Page</span>
            <input
              type="text"
              value={pageInput}
              onChange={handlePageInputChange}
              onBlur={handlePageInputSubmit}
              className="w-10 text-center bg-gray-800/80 border border-gray-700 rounded py-0.5 text-[11px] font-mono text-white outline-none focus:border-[#00873E]"
            />
            <span className="text-[11px] font-mono text-gray-400">/ {numPages || 1}</span>
          </form>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= numPages || loading}
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Center: Title */}
        <div className="hidden md:block truncate max-w-xs text-[11px] font-medium text-gray-400">
          {title}
        </div>

        {/* Right: Zoom & Protected Badge */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 0.6 || loading}
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 cursor-pointer transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>

          <span className="text-[11px] font-mono text-gray-400 min-w-10 text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 2.0 || loading}
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 cursor-pointer transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn size={15} />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors hidden sm:block"
            title="Reset Zoom"
            aria-label="Reset Zoom"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Canvas Viewport (Scrollbars Completely Hidden) */}
      <div
        className="pdf-canvas-container relative w-full min-h-[500px] sm:min-h-[700px] max-h-[820px] overflow-auto flex items-center justify-center p-2 sm:p-6 bg-[#212529]"
        style={{
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
        }}
        onContextMenu={(e) => e.preventDefault()} // Disable right click download
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Hide scrollbar for Chrome/Safari */}
        <style>{`
          .pdf-canvas-container::-webkit-scrollbar {
            display: none !important;
          }
        `}</style>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
            <Loader2 size={28} className="animate-spin text-[#00873E] mb-3" />
            <span className="text-xs font-mono uppercase tracking-widest text-gray-400">
              Decrypting Document Stream…
            </span>
          </div>
        ) : (
          <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white max-w-full">
            {rendering && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-2xs flex items-center justify-center z-10">
                <Loader2 size={24} className="animate-spin text-white" />
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="block max-w-full pointer-events-none"
              style={{ display: 'block' }}
            />
          </div>
        )}
      </div>

      {/* Bottom Protected Watermark Bar */}
      <div className="h-7 bg-[#111315] border-t border-gray-800/80 px-4 flex items-center justify-between text-[10px] font-mono text-gray-500">
        <span>Protected Academic Material • View Only</span>
        <span>Secure Stream Active</span>
      </div>
    </div>
  );
}
