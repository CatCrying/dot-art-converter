import { useState, useEffect, useRef } from 'react';
import { Upload, Download, Settings2, Image as ImageIcon, Wand2, RefreshCw, Palette } from 'lucide-react';
import './App.css';

function App() {
  const [currentImage, setCurrentImage] = useState(null);
  const [dotSize, setDotSize] = useState(6);
  const [colorMode, setColorMode] = useState('color');
  const [isProcessing, setIsProcessing] = useState(false);

  const originalCanvasRef = useRef(null);
  const dotCanvasRef = useRef(null);

  // ประมวลผลเมื่อมีการเปลี่ยนแปลง Image, Size หรือ Mode
  useEffect(() => {
    if (!currentImage) return;
    renderDotArt();
  }, [currentImage, dotSize, colorMode]);

  const renderDotArt = () => {
    setIsProcessing(true);
    
    // ใช้ requestAnimationFrame เพื่อให้ UI ไม่ค้างขณะเริ่มประมวลผล
    requestAnimationFrame(() => {
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

          // --- รวมครบทุก Color Mode Logic ---
          switch (colorMode) {
            case 'grayscale': {
              const gray = (r + g + b) / 3;
              r = g = b = gray;
              break;
            }
            case 'sepia': {
              const tr = (r * 0.393) + (g * 0.769) + (b * 0.189);
              const tg = (r * 0.349) + (g * 0.686) + (b * 0.168);
              const tb = (r * 0.272) + (g * 0.534) + (b * 0.131);
              r = Math.min(255, tr); g = Math.min(255, tg); b = Math.min(255, tb);
              break;
            }
            case 'inverted': {
              r = 255 - r; g = 255 - g; b = 255 - b;
              break;
            }
            case 'blackwhite': {
              const avg = (r + g + b) / 3;
              r = g = b = avg > 127 ? 255 : 0;
              break;
            }
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
            case 'vivid': {
              r = Math.min(255, r * 1.6);
              g = Math.min(255, g * 1.6);
              b = Math.min(255, b * 1.6);
              break;
            }
            case 'neon': {
              const max = Math.max(r, g, b);
              r = r === max ? 255 : 0;
              g = g === max ? 255 : 0;
              b = b === max ? 255 : 0;
              break;
            }
            case 'warm': {
              r = Math.min(255, r + 50);
              b = Math.max(0, b - 30);
              break;
            }
            case 'cool': {
              b = Math.min(255, b + 50);
              r = Math.max(0, r - 30);
              break;
            }
            case 'color':
            default: break;
          }

          dotContext.fillStyle = `rgb(${r}, ${g}, ${b})`;
          dotContext.beginPath();
          dotContext.arc(x + dotSize / 2, y + dotSize / 2, dotSize / 2.2, 0, 2 * Math.PI);
          dotContext.fill();
        }
      }
      setIsProcessing(false);
    });
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

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `dot-art-${colorMode}.png`;
    link.href = dotCanvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen app-container">
      {/* Navbar */}
      <header className="navbar">
        <div className="logo-section">
          <Wand2 className="logo-icon" size={28} />
          <h1>DotArt <span>Pro</span></h1>
        </div>
        <div className="nav-actions">
           {currentImage && (
             <button className="btn-download" onClick={handleDownload}>
               <Download size={18} /> Download
             </button>
           )}
        </div>
      </header>

      <main className="main-layout">
        {/* Sidebar Controls */}
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
                type="range" min="2" max="50" step="1" 
                value={dotSize} 
                onChange={(e) => setDotSize(parseInt(e.target.value))} 
              />
            </div>
          </section>

          <section className="control-group">
            <h3 className="group-title"><Palette size={16} /> Color Filters</h3>
            <div className="select-container">
              <select value={colorMode} onChange={(e) => setColorMode(e.target.value)}>
                <optgroup label="Classic">
                  <option value="color">Natural Color</option>
                  <option value="grayscale">Grayscale</option>
                  <option value="blackwhite">Black & White</option>
                  <option value="sepia">Vintage Sepia</option>
                  <option value="inverted">Inverted Colors</option>
                </optgroup>
                <optgroup label="Artistic">
                  <option value="posterize">Posterize (Retro Art)</option>
                  <option value="vivid">Vivid Boost</option>
                  <option value="neon">Neon Cyberpunk</option>
                </optgroup>
                <optgroup label="Mood & Retro">
                  <option value="gameboy">8-bit GameBoy</option>
                  <option value="warm">Warm Tone</option>
                  <option value="cool">Cool Tone</option>
                </optgroup>
              </select>
            </div>
          </section>
        </aside>

        {/* Canvas Display */}
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
                <span className="card-label">Dot Art Result ({colorMode})</span>
                <div className="canvas-holder">
                  <canvas ref={dotCanvasRef}></canvas>
                  {isProcessing && (
                    <div className="loader">
                      <RefreshCw className="spin" size={32} />
                      <span>Processing...</span>
                    </div>
                  )}
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
