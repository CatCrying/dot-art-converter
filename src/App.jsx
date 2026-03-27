import { useState, useEffect, useRef } from 'react';
import { Upload, Download, Settings2, Image as ImageIcon, Wand2, RefreshCw } from 'lucide-react';
import './App.css';

function App() {
  const [currentImage, setCurrentImage] = useState(null);
  const [dotSize, setDotSize] = useState(6);
  const [colorMode, setColorMode] = useState('color');
  const [isProcessing, setIsProcessing] = useState(false);

  const originalCanvasRef = useRef(null);
  const dotCanvasRef = useRef(null);

  useEffect(() => {
    if (!currentImage) return;
    renderDotArt();
  }, [currentImage, dotSize, colorMode]);

  const renderDotArt = () => {
    setIsProcessing(true);
    const originalCanvas = originalCanvasRef.current;
    const dotCanvas = dotCanvasRef.current;
    const originalContext = originalCanvas.getContext('2d', { willReadFrequently: true });
    const dotContext = dotCanvas.getContext('2d');

    const { width, height } = currentImage;
    originalCanvas.width = dotCanvas.width = width;
    originalCanvas.height = dotCanvas.height = height;

    originalContext.drawImage(currentImage, 0, 0);
    dotContext.clearRect(0, 0, width, height);

    const imageData = originalContext.getImageData(0, 0, width, height).data;

    for (let y = 0; y < height; y += dotSize) {
      for (let x = 0; x < width; x += dotSize) {
        const index = (y * width + x) * 4;
        let r = imageData[index];
        let g = imageData[index + 1];
        let b = imageData[index + 2];

        // --- Logic โหมดสีคงเดิมจากเวอร์ชันที่แล้ว ---
        switch (colorMode) {
          case 'grayscale': { const gray = (r + g + b) / 3; r = g = b = gray; break; }
          case 'sepia': {
            const tr = (r * 0.393) + (g * 0.769) + (b * 0.189);
            const tg = (r * 0.349) + (g * 0.686) + (b * 0.168);
            const tb = (r * 0.272) + (g * 0.534) + (b * 0.131);
            r = Math.min(255, tr); g = Math.min(255, tg); b = Math.min(255, tb);
            break;
          }
          case 'blackwhite': { const avg = (r + g + b) / 3; r = g = b = avg > 127 ? 255 : 0; break; }
          case 'posterize': {
            const levels = 4;
            r = Math.floor(r / (256 / levels)) * (255 / (levels - 1));
            g = Math.floor(g / (256 / levels)) * (255 / (levels - 1));
            b = Math.floor(b / (256 / levels)) * (255 / (levels - 1));
            break;
          }
          case 'gameboy': {
            const gray = (r * 0.3 + g * 0.59 + b * 0.11);
            if (gray < 64) { r = 15; g = 56; b = 15; }
            else if (gray < 128) { r = 48; g = 98; b = 48; }
            else if (gray < 192) { r = 139; g = 172; b = 15; }
            else { r = 155; g = 188; b = 15; }
            break;
          }
          case 'neon': {
            const max = Math.max(r, g, b);
            r = r === max ? 255 : 0; g = g === max ? 255 : 0; b = b === max ? 255 : 0;
            break;
          }
          default: break;
        }

        dotContext.fillStyle = `rgb(${r}, ${g}, ${b})`;
        dotContext.beginPath();
        dotContext.arc(x + dotSize / 2, y + dotSize / 2, dotSize / 2.2, 0, 2 * Math.PI);
        dotContext.fill();
      }
    }
    setIsProcessing(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => setCurrentImage(img);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen app-container">
      <header className="navbar">
        <div className="logo-section">
          <Wand2 className="logo-icon" />
          <h1>DotArt <span>Pro</span></h1>
        </div>
        <div className="nav-actions">
           {currentImage && (
             <button className="btn-download" onClick={() => {
               const link = document.createElement('a');
               link.download = 'dot-art.png';
               link.href = dotCanvasRef.current.toDataURL();
               link.click();
             }}>
               <Download size={18} /> Download
             </button>
           )}
        </div>
      </header>

      <main className="main-layout">
        <aside className="sidebar">
          <section className="control-group">
            <h3 className="group-title"><Upload size={16} /> Image Source</h3>
            <label className="upload-box">
              <input type="file" accept="image/*" onChange={handleImageUpload} />
              <div className="upload-content">
                <ImageIcon size={32} />
                <span>{currentImage ? "Change Image" : "Upload Image"}</span>
              </div>
            </label>
          </section>

          <section className="control-group">
            <h3 className="group-title"><Settings2 size={16} /> Adjustments</h3>
            <div className="slider-container">
              <div className="slider-label">
                <span>Dot Size</span>
                <span className="badge">{dotSize}px</span>
              </div>
              <input 
                type="range" min="2" max="40" step="1" 
                value={dotSize} 
                onChange={(e) => setDotSize(parseInt(e.target.value))} 
              />
            </div>

            <div className="select-container">
              <label>Color Filter</label>
              <select value={colorMode} onChange={(e) => setColorMode(e.target.value)}>
                <option value="color">Natural Color</option>
                <option value="grayscale">Grayscale</option>
                <option value="blackwhite">B&W High Contrast</option>
                <option value="sepia">Vintage Sepia</option>
                <option value="posterize">Pop Art (Poster)</option>
                <option value="gameboy">Retro GameBoy</option>
                <option value="neon">Neon Cyberpunk</option>
              </select>
            </div>
          </section>
        </aside>

        <section className="canvas-view">
          {!currentImage ? (
            <div className="empty-state">
              <div className="empty-icon-circle">
                <ImageIcon size={48} />
              </div>
              <h2>Ready to start?</h2>
              <p>Upload an image to convert it into amazing dot art.</p>
            </div>
          ) : (
            <div className="preview-grid">
              <div className="preview-card">
                <span className="card-label">Original Image</span>
                <div className="canvas-holder">
                  <canvas ref={originalCanvasRef}></canvas>
                </div>
              </div>
              <div className="preview-card highlight">
                <span className="card-label">Dot Art Result</span>
                <div className="canvas-holder">
                  <canvas ref={dotCanvasRef}></canvas>
                  {isProcessing && <div className="loader"><RefreshCw className="spin" /></div>}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
