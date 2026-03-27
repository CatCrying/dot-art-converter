import { useState, useEffect, useRef } from 'react';
import { 
  Upload, Download, Settings2, Image as ImageIcon, Wand2, 
  RefreshCw, Palette, Layers, Sun, Contrast, Maximize, FileCode, Split
} from 'lucide-react';
import './App.css';

function App() {
  // --- States ---
  const [currentImage, setCurrentImage] = useState(null);
  const [dotSize, setDotSize] = useState(8);
  const [gap, setGap] = useState(2);
  const [shape, setShape] = useState('circle'); // circle, square, diamond, triangle, cross
  const [colorMode, setColorMode] = useState('color');
  const [bgColor, setBgColor] = useState('#000000');
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [isHalftone, setIsHalftone] = useState(false);
  const [compareVal, setCompareVal] = useState(50); // For Before/After slider
  const [isProcessing, setIsProcessing] = useState(false);

  const originalCanvasRef = useRef(null);
  const dotCanvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!currentImage) return;
    renderDotArt();
  }, [currentImage, dotSize, gap, shape, colorMode, bgColor, brightness, contrast, isHalftone]);

  // --- Core Processing Function ---
  const renderDotArt = () => {
    setIsProcessing(true);
    requestAnimationFrame(() => {
      const originalCanvas = originalCanvasRef.current;
      const dotCanvas = dotCanvasRef.current;
      const ctx = dotCanvas.getContext('2d', { willReadFrequently: true });
      const srcCtx = originalCanvas.getContext('2d', { willReadFrequently: true });

      const { width, height } = currentImage;
      originalCanvas.width = dotCanvas.width = width;
      originalCanvas.height = dotCanvas.height = height;

      srcCtx.drawImage(currentImage, 0, 0);
      const imageData = srcCtx.getImageData(0, 0, width, height).data;

      // Fill Background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let y = 0; y < height; y += dotSize) {
        for (let x = 0; x < width; x += dotSize) {
          const i = (y * width + x) * 4;
          
          // 1. Brightness & Contrast
          let r = Math.min(255, Math.max(0, contrastFactor * (imageData[i] + brightness - 128) + 128));
          let g = Math.min(255, Math.max(0, contrastFactor * (imageData[i+1] + brightness - 128) + 128));
          let b = Math.min(255, Math.max(0, contrastFactor * (imageData[i+2] + brightness - 128) + 128));

          // 2. Color Modes (Keeping previous logic)
          const gray = (r + g + b) / 3;
          if (colorMode === 'grayscale') { r = g = b = gray; }
          else if (colorMode === 'sepia') {
            const tr = (r * 0.393) + (g * 0.769) + (b * 0.189);
            const tg = (r * 0.349) + (g * 0.686) + (b * 0.168);
            const tb = (r * 0.272) + (g * 0.534) + (b * 0.131);
            r = Math.min(255, tr); g = Math.min(255, tg); b = Math.min(255, tb);
          } else if (colorMode === 'blackwhite') {
            r = g = b = gray > 127 ? 255 : 0;
          } else if (colorMode === 'gameboy') {
            if (gray < 64) { r = 15; g = 56; b = 15; }
            else if (gray < 128) { r = 48; g = 98; b = 48; }
            else if (gray < 192) { r = 139; g = 172; b = 15; }
            else { r = 155; g = 188; b = 15; }
          } else if (colorMode === 'neon') {
            const max = Math.max(r, g, b);
            r = r === max ? 255 : 0; g = g === max ? 255 : 0; b = b === max ? 255 : 0;
          }

          // 3. Halftone Logic (Calculate dynamic size)
          let currentDrawSize = dotSize - gap;
          if (isHalftone) {
            const lum = 1 - (gray / 255); // Darker = Larger dot
            currentDrawSize *= lum;
          }
          if (currentDrawSize <= 0) continue;

          // 4. Drawing Shapes
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          const centerX = x + dotSize / 2;
          const centerY = y + dotSize / 2;

          ctx.beginPath();
          if (shape === 'circle') {
            ctx.arc(centerX, centerY, currentDrawSize / 2, 0, Math.PI * 2);
          } else if (shape === 'square') {
            ctx.fillRect(centerX - currentDrawSize/2, centerY - currentDrawSize/2, currentDrawSize, currentDrawSize);
          } else if (shape === 'diamond') {
            ctx.moveTo(centerX, centerY - currentDrawSize/2);
            ctx.lineTo(centerX + currentDrawSize/2, centerY);
            ctx.lineTo(centerX, centerY + currentDrawSize/2);
            ctx.lineTo(centerX - currentDrawSize/2, centerY);
          } else if (shape === 'triangle') {
            ctx.moveTo(centerX, centerY - currentDrawSize/2);
            ctx.lineTo(centerX + currentDrawSize/2, centerY + currentDrawSize/2);
            ctx.lineTo(centerX - currentDrawSize/2, centerY + currentDrawSize/2);
          } else if (shape === 'cross') {
            ctx.fillRect(centerX - currentDrawSize/2, centerY - 1, currentDrawSize, 2);
            ctx.fillRect(centerX - 1, centerY - currentDrawSize/2, 2, currentDrawSize);
          }
          ctx.fill();
        }
      }
      setIsProcessing(false);
    });
  };

  // --- SVG Export Logic ---
  const exportSVG = () => {
    const { width, height } = currentImage;
    let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svgContent += `<rect width="100%" height="100%" fill="${bgColor}"/>`;
    
    const srcCtx = originalCanvasRef.current.getContext('2d');
    const imageData = srcCtx.getImageData(0, 0, width, height).data;

    for (let y = 0; y < height; y += dotSize) {
      for (let x = 0; x < width; x += dotSize) {
        const i = (y * width + x) * 4;
        let r = imageData[i], g = imageData[i+1], b = imageData[i+2];
        const gray = (r + g + b) / 3;
        let dSize = dotSize - gap;
        if (isHalftone) dSize *= (1 - gray / 255);
        if (dSize <= 0.5) continue;

        if (shape === 'circle')
          svgContent += `<circle cx="${x+dotSize/2}" cy="${y+dotSize/2}" r="${dSize/2}" fill="rgb(${r},${g},${b})"/>`;
        else
          svgContent += `<rect x="${x+(dotSize-dSize)/2}" y="${y+(dotSize-dSize)/2}" width="${dSize}" height="${dSize}" fill="rgb(${r},${g},${b})"/>`;
      }
    }
    svgContent += `</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dot-art.svg';
    link.click();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target.result;
      img.onload = () => setCurrentImage(img);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="logo"><Wand2 color="#818cf8" /> DotArt <span>Ultra</span></div>
        <div className="actions">
          {currentImage && (
            <>
              <button className="btn-secondary" onClick={exportSVG} title="Export as Vector"><FileCode size={18} /> SVG</button>
              <button className="btn-primary" onClick={() => {
                const link = document.createElement('a');
                link.download = 'dot-art.png';
                link.href = dotCanvasRef.current.toDataURL();
                link.click();
              }}><Download size={18} /> PNG</button>
            </>
          )}
        </div>
      </header>

      <main className="editor-layout">
        <aside className="controls-panel">
          {/* Group 1: Image Source */}
          <div className="panel-section">
            <h4 className="section-title"><ImageIcon size={14}/> Image</h4>
            <label className="upload-btn">
              <Upload size={16} /> {currentImage ? "Change Image" : "Upload Image"}
              <input type="file" hidden onChange={handleImageUpload} />
            </label>
          </div>

          {/* Group 2: Dot Settings */}
          <div className="panel-section">
            <h4 className="section-title"><Settings2 size={14}/> Dot Properties</h4>
            <div className="control-item">
              <label>Shape</label>
              <div className="shape-grid">
                {['circle', 'square', 'diamond', 'triangle', 'cross'].map(s => (
                  <button key={s} className={shape === s ? 'active' : ''} onClick={() => setShape(s)}>{s[0].toUpperCase()}</button>
                ))}
              </div>
            </div>
            <div className="control-item">
              <div className="label-row"><span>Size</span> <span>{dotSize}px</span></div>
              <input type="range" min="4" max="60" value={dotSize} onChange={e => setDotSize(parseInt(e.target.value))} />
            </div>
            <div className="control-item">
              <div className="label-row"><span>Gap</span> <span>{gap}px</span></div>
              <input type="range" min="0" max="20" value={gap} onChange={e => setGap(parseInt(e.target.value))} />
            </div>
            <div className="control-item checkbox">
              <input type="checkbox" id="halftone" checked={isHalftone} onChange={e => setIsHalftone(e.target.checked)} />
              <label htmlFor="halftone">Halftone Effect (Variable Size)</label>
            </div>
          </div>

          {/* Group 3: Color & Effects */}
          <div className="panel-section">
            <h4 className="section-title"><Palette size={14}/> Appearance</h4>
            <div className="control-item">
              <label>Filter</label>
              <select value={colorMode} onChange={e => setColorMode(e.target.value)}>
                <option value="color">Full Color</option>
                <option value="grayscale">Grayscale</option>
                <option value="blackwhite">B&W</option>
                <option value="gameboy">GameBoy</option>
                <option value="sepia">Sepia</option>
                <option value="neon">Neon</option>
              </select>
            </div>
            <div className="control-item">
              <label>Background Color</label>
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="color-picker" />
            </div>
            <div className="control-item">
              <div className="label-row"><Sun size={14}/> Brightness</div>
              <input type="range" min="-100" max="100" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} />
            </div>
            <div className="control-item">
              <div className="label-row"><Contrast size={14}/> Contrast</div>
              <input type="range" min="-100" max="100" value={contrast} onChange={e => setContrast(parseInt(e.target.value))} />
            </div>
          </div>
        </aside>

        <section className="preview-area">
          {!currentImage ? (
            <div className="welcome">
               <div className="icon-blob"><Maximize size={48} /></div>
               <h2>DotArt Pro Ultra</h2>
               <p>Drop an image to start your masterpiece</p>
            </div>
          ) : (
            <div className="comparison-container" ref={containerRef}>
              <div className="canvas-card">
                <div className="canvas-stack">
                  {/* Original Image Background */}
                  <canvas ref={originalCanvasRef} className="original-canvas" style={{ display: 'none' }}></canvas>
                  
                  {/* Comparison Slider UI */}
                  <div className="comparison-wrapper">
                    {/* Before (Original) */}
                    <div className="before-layer" style={{ width: `${compareVal}%`, backgroundImage: `url(${currentImage.src})` }}>
                       <span className="badge">Original</span>
                    </div>
                    {/* After (Dot Art) */}
                    <div className="after-layer">
                       <canvas ref={dotCanvasRef}></canvas>
                       <span className="badge">Dot Art</span>
                    </div>
                    {/* The Slider */}
                    <input type="range" className="compare-slider" min="0" max="100" value={compareVal} onChange={e => setCompareVal(e.target.value)} />
                    <div className="slider-line" style={{ left: `${compareVal}%` }}>
                       <div className="slider-handle"><Split size={16} /></div>
                    </div>
                  </div>
                </div>
              </div>
              {isProcessing && <div className="floating-loader"><RefreshCw className="spin" /> Processing...</div>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
