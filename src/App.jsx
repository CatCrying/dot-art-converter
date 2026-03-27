import { useState, useEffect, useRef } from 'react';
import { 
  Upload, Download, Settings2, Image as ImageIcon, 
  Wand2, RefreshCw, Palette, Type, Contrast, 
  FlipVertical, Monitor, SunMoon 
} from 'lucide-react';
import './App.css';

// ชุดตัวอักษร ASCII สำหรับสไตล์ต่างๆ
const ASCII_SETS = {
  classic: "@%#*+=-:. ",
  blocks: "█▓▒░ ",
  binary: "01",
  numeric: "8420 ",
  matrix: "日ハミヒーパ点01+- "
};

function App() {
  const [currentImage, setCurrentImage] = useState(null);
  const [dotSize, setDotSize] = useState(10);
  const [colorMode, setColorMode] = useState('ascii-color');
  const [asciiSet, setAsciiSet] = useState('classic');
  const [contrast, setContrast] = useState(1); // 0.5 - 1.5
  const [isInverted, setIsInverted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const originalCanvasRef = useRef(null);
  const dotCanvasRef = useRef(null);

  // สั่งประมวลผลเมื่อค่าใดๆ เปลี่ยนแปลง
  useEffect(() => {
    if (!currentImage) return;
    renderArt();
  }, [currentImage, dotSize, colorMode, asciiSet, contrast, isInverted]);

  const renderArt = () => {
    setIsProcessing(true);
    
    // ใช้ requestAnimationFrame เพื่อไม่ให้ UI ค้าง
    requestAnimationFrame(() => {
      const originalCanvas = originalCanvasRef.current;
      const dotCanvas = dotCanvasRef.current;
      const originalContext = originalCanvas.getContext('2d', { willReadFrequently: true });
      const dotContext = dotCanvas.getContext('2d');

      const { width, height } = currentImage;
      originalCanvas.width = dotCanvas.width = width;
      originalCanvas.height = dotCanvas.height = height;

      originalContext.drawImage(currentImage, 0, 0);
      
      // ตั้งพื้นหลังตามโหมด Invert
      dotContext.fillStyle = isInverted ? '#ffffff' : '#000000';
      dotContext.fillRect(0, 0, width, height);

      const imageData = originalContext.getImageData(0, 0, width, height).data;
      const chars = ASCII_SETS[asciiSet];

      // ตั้งค่า Font สำหรับ ASCII
      dotContext.font = `bold ${dotSize}px monospace`;
      dotContext.textAlign = 'center';
      dotContext.textBaseline = 'middle';

      for (let y = 0; y < height; y += dotSize) {
        for (let x = 0; x < width; x += dotSize) {
          const index = (y * width + x) * 4;
          let r = imageData[index];
          let g = imageData[index + 1];
          let b = imageData[index + 2];

          // 1. ปรับ Contrast
          const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
          const applyContrast = (c) => Math.min(255, Math.max(0, factor * (c - 128) + 128));
          
          r = applyContrast(r);
          g = applyContrast(g);
          b = applyContrast(b);

          let brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b);

          // 2. Color Mode Logic
          let finalColor;
          if (colorMode === 'ascii-bw') {
            finalColor = isInverted ? '#000000' : '#ffffff';
          } else if (colorMode === 'matrix') {
            finalColor = `rgb(0, ${brightness}, 0)`;
          } else {
            switch (colorMode) {
              case 'grayscale': { const gray = (r + g + b) / 3; r = g = b = gray; break; }
              case 'sepia': {
                const tr = (r * 0.393) + (g * 0.769) + (b * 0.189);
                const tg = (r * 0.349) + (g * 0.686) + (b * 0.168);
                const tb = (r * 0.272) + (g * 0.534) + (b * 0.131);
                r = Math.min(255, tr); g = Math.min(255, tg); b = Math.min(255, tb);
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
              case 'vivid': { r = Math.min(255, r * 1.6); g = Math.min(255, g * 1.6); b = Math.min(255, b * 1.6); break; }
              case 'warm': { r = Math.min(255, r + 40); b = Math.max(0, b - 20); break; }
              case 'cool': { b = Math.min(255, b + 40); r = Math.max(0, r - 20); break; }
              case 'inverted': { r = 255 - r; g = 255 - g; b = 255 - b; break; }
              default: break;
            }
            finalColor = `rgb(${r}, ${g}, ${b})`;
          }

          // 3. Draw Execution
          if (colorMode.includes('ascii') || colorMode === 'matrix') {
            let charIdx = Math.floor((brightness / 255) * (chars.length - 1));
            if (isInverted) charIdx = (chars.length - 1) - charIdx; // สลับสว่างมืด
            dotContext.fillStyle = finalColor;
            dotContext.fillText(chars[charIdx], x + dotSize / 2, y + dotSize / 2);
          } else {
            dotContext.fillStyle = finalColor;
            dotContext.beginPath();
            dotContext.arc(x + dotSize / 2, y + dotSize / 2, dotSize / 2.2, 0, 2 * Math.PI);
            dotContext.fill();
          }
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

  return (
    <div className="min-h-screen app-container">
      {/* --- Navbar --- */}
      <header className="navbar">
        <div className="logo-section">
          <Wand2 className="logo-icon" size={28} />
          <h1>ArtConverter <span>Pro</span></h1>
        </div>
        {currentImage && (
          <button className="btn-primary" onClick={() => {
            const link = document.createElement('a');
            link.download = `art-${colorMode}.png`;
            link.href = dotCanvasRef.current.toDataURL();
            link.click();
          }}>
            <Download size={18} /> Export Image
          </button>
        )}
      </header>

      <main className="main-layout">
        {/* --- Sidebar --- */}
        <aside className="sidebar">
          <section className="control-group">
            <h3 className="group-title"><Upload size={16} /> Image Source</h3>
            <label className="upload-box">
              <input type="file" accept="image/*" onChange={handleImageUpload} />
              <div className="upload-content">
                <ImageIcon size={28} />
                <span>{currentImage ? "Change Image" : "Upload Image"}</span>
              </div>
            </label>
          </section>

          <section className="control-group">
            <h3 className="group-title"><Settings2 size={16} /> Global Settings</h3>
            <div className="input-unit">
              <div className="label-row">
                <span>Density / Size</span>
                <span className="badge">{dotSize}px</span>
              </div>
              <input type="range" min="4" max="50" value={dotSize} onChange={(e) => setDotSize(parseInt(e.target.value))} />
            </div>

            <div className="input-unit">
              <div className="label-row">
                <span className="flex-center gap-1"><Contrast size={14}/> Contrast</span>
                <span className="badge">{Math.round(contrast * 100)}%</span>
              </div>
              <input type="range" min="0.5" max="1.5" step="0.05" value={contrast} onChange={(e) => setContrast(parseFloat(e.target.value))} />
            </div>
          </section>

          <section className="control-group">
            <h3 className="group-title"><Palette size={16} /> Art Style</h3>
            <div className="select-wrapper">
              <select value={colorMode} onChange={(e) => setColorMode(e.target.value)}>
                <optgroup label="Text Art (ASCII)">
                  <option value="ascii-color">ASCII (Full Color)</option>
                  <option value="ascii-bw">ASCII (Classic B&W)</option>
                  <option value="matrix">Matrix Digital</option>
                </optgroup>
                <optgroup label="Dot Art Filters">
                  <option value="color">Natural Dot</option>
                  <option value="grayscale">Grayscale</option>
                  <option value="sepia">Vintage Sepia</option>
                  <option value="gameboy">Retro GameBoy</option>
                  <option value="neon">Neon Cyber</option>
                  <option value="vivid">Vivid Color</option>
                  <option value="inverted">Inverted</option>
                </optgroup>
              </select>
            </div>

            {(colorMode.includes('ascii') || colorMode === 'matrix') && (
              <div className="ascii-options animate-in">
                <div className="input-unit">
                  <label className="label-small">Character Set</label>
                  <select value={asciiSet} onChange={(e) => setAsciiSet(e.target.value)} className="secondary-select">
                    <option value="classic">Classic (@%#*)</option>
                    <option value="blocks">Block Shading (█▓▒░)</option>
                    <option value="binary">Binary (01)</option>
                    <option value="numeric">Numbers (8420)</option>
                    <option value="matrix">Japanese Matrix</option>
                  </select>
                </div>
                <button 
                  className={`btn-toggle ${isInverted ? 'active' : ''}`}
                  onClick={() => setIsInverted(!isInverted)}
                >
                  <SunMoon size={16} /> {isInverted ? "Light Mode Background" : "Dark Mode Background"}
                </button>
              </div>
            )}
          </section>
        </aside>

        {/* --- Content Area --- */}
        <section className="canvas-view">
          {!currentImage ? (
            <div className="empty-state">
              <div className="icon-circle"><Monitor size={48} /></div>
              <h2>Start Converting</h2>
              <p>Upload a photo to create Dot Art or ASCII masterpieces.</p>
            </div>
          ) : (
            <div className="canvas-container-grid">
              <div className="canvas-card result">
                <div className="card-header">
                  <Wand2 size={16} /> <span>{colorMode.toUpperCase()} VIEW</span>
                </div>
                <div className="canvas-frame">
                  <canvas ref={dotCanvasRef}></canvas>
                  {isProcessing && (
                    <div className="processing-overlay">
                      <RefreshCw className="spin" size={32} />
                      <p>Rendering Art...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="canvas-card original">
                <div className="card-header">
                  <ImageIcon size={16} /> <span>ORIGINAL REFERENCE</span>
                </div>
                <div className="canvas-frame">
                  <canvas ref={originalCanvasRef}></canvas>
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
