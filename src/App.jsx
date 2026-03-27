import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [currentImage, setCurrentImage] = useState(null);
  const [dotSize, setDotSize] = useState(6);
  const [colorMode, setColorMode] = useState('color');

  const originalCanvasRef = useRef(null);
  const dotCanvasRef = useRef(null);

  useEffect(() => {
    if (!currentImage || !originalCanvasRef.current || !dotCanvasRef.current) return;

    const originalCanvas = originalCanvasRef.current;
    const dotCanvas = dotCanvasRef.current;
    const originalContext = originalCanvas.getContext('2d', { willReadFrequently: true });
    const dotContext = dotCanvas.getContext('2d');

    const { width, height } = currentImage;
    originalCanvas.width = dotCanvas.width = width;
    originalCanvas.height = dotCanvas.height = height;

    originalContext.drawImage(currentImage, 0, 0);
    dotContext.clearRect(0, 0, width, height);

    // ดึงข้อมูล Pixel ทั้งหมดออกมาทีเดียวเพื่อความเร็ว (Optimization)
    const imageData = originalContext.getImageData(0, 0, width, height).data;

    for (let y = 0; y < height; y += dotSize) {
      for (let x = 0; x < width; x += dotSize) {
        const index = (y * width + x) * 4;
        let r = imageData[index];
        let g = imageData[index + 1];
        let b = imageData[index + 2];

        // --- Color Mode Logic ---
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
            r = Math.min(255, r * 1.5);
            g = Math.min(255, g * 1.5);
            b = Math.min(255, b * 1.5);
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
            r = Math.min(255, r + 40);
            b = Math.max(0, b - 40);
            break;
          }
          case 'cool': {
            b = Math.min(255, b + 40);
            r = Math.max(0, r - 40);
            break;
          }
          default: break;
        }

        dotContext.fillStyle = `rgb(${r}, ${g}, ${b})`;
        dotContext.beginPath();
        dotContext.arc(x + dotSize / 2, y + dotSize / 2, dotSize / 2, 0, 2 * Math.PI);
        dotContext.fill();
      }
    }
  }, [currentImage, dotSize, colorMode]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => setCurrentImage(img);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = 'dot-art.png';
    link.href = dotCanvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="app-container">
      <h1>Dot Art Converter</h1>

      <div className="controls">
        <label className="file-upload-label">
          Upload Image
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </label>

        <button onClick={() => {
          const size = prompt("Enter dot size (1-50):", dotSize);
          if (size && !isNaN(size)) setDotSize(parseInt(size));
        }}>
          Size: {dotSize}px
        </button>

        <select value={colorMode} onChange={(e) => setColorMode(e.target.value)}>
          <optgroup label="Classic">
            <option value="color">Full Color</option>
            <option value="grayscale">Grayscale</option>
            <option value="blackwhite">Black & White</option>
            <option value="sepia">Sepia</option>
            <option value="inverted">Inverted</option>
          </optgroup>
          <optgroup label="Artistic">
            <option value="posterize">Posterize</option>
            <option value="vivid">Vivid</option>
            <option value="neon">Neon</option>
          </optgroup>
          <optgroup label="Retro & Mood">
            <option value="gameboy">GameBoy</option>
            <option value="warm">Warm</option>
            <option value="cool">Cool</option>
          </optgroup>
        </select>

        <button onClick={handleDownload} disabled={!currentImage}>
          Download
        </button>
      </div>

      <div className="canvas-container">
        <div className="canvas-wrapper">
          <h2>Original</h2>
          <canvas ref={originalCanvasRef}></canvas>
        </div>
        <div className="canvas-wrapper">
          <h2>Dot Art</h2>
          <canvas ref={dotCanvasRef}></canvas>
        </div>
      </div>
    </div>
  );
}

export default App;
