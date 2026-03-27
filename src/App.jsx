import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [currentImage, setCurrentImage] = useState(null);
  const [dotSize, setDotSize] = useState(4);
  const[colorMode, setColorMode] = useState('color');

  const originalCanvasRef = useRef(null);
  const dotCanvasRef = useRef(null);

  // Process the image whenever the image, dot size, or color mode changes
  useEffect(() => {
    if (!currentImage || !originalCanvasRef.current || !dotCanvasRef.current) return;

    const originalCanvas = originalCanvasRef.current;
    const dotCanvas = dotCanvasRef.current;
    const originalContext = originalCanvas.getContext('2d', { willReadFrequently: true });
    const dotContext = dotCanvas.getContext('2d');

    const width = currentImage.width;
    const height = currentImage.height;

    originalCanvas.width = dotCanvas.width = width;
    originalCanvas.height = dotCanvas.height = height;

    // Draw the original image
    originalContext.drawImage(currentImage, 0, 0);
    
    // Clear the dot canvas
    dotContext.clearRect(0, 0, width, height);

    // OPTIMIZATION: Get all image data at once (Much faster than 1x1 pixel fetching)
    const imageData = originalContext.getImageData(0, 0, width, height).data;

    for (let y = 0; y < height; y += dotSize) {
      for (let x = 0; x < width; x += dotSize) {
        // Calculate the 1D array index for the (x, y) pixel
        const index = (y * width + x) * 4;
        let r = imageData[index];
        let g = imageData[index + 1];
        let b = imageData[index + 2];

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
            r = Math.min(255, tr);
            g = Math.min(255, tg);
            b = Math.min(255, tb);
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
          case 'color':
          default:
            break;
        }

        dotContext.fillStyle = `rgb(${r}, ${g}, ${b})`;
        dotContext.beginPath();
        dotContext.arc(x + dotSize / 2, y + dotSize / 2, dotSize / 2, 0, 2 * Math.PI);
        dotContext.fill();
      }
    }
  },[currentImage, dotSize, colorMode]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        setCurrentImage(img);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSetDotSize = () => {
    const newSizeStr = prompt("Enter new dot size (1-50):", dotSize);
    if (newSizeStr === null) return;
    const newSize = parseInt(newSizeStr, 10);
    if (isNaN(newSize) || newSize < 1 || newSize > 50) {
      alert("Invalid input. Please enter a number between 1 and 50.");
      return;
    }
    setDotSize(newSize);
  };

  const handleDownload = () => {
    if (dotCanvasRef.current) {
      const dataURL = dotCanvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'dot-art.png';
      link.click();
    }
  };

  return (
    <div className="app-container">
      <h1>Dot Art Converter</h1>

      <div className="controls">
        <label htmlFor="imageUpload" className="file-upload-label">
          Upload Image
        </label>
        <input 
          type="file" 
          id="imageUpload" 
          accept="image/*" 
          onChange={handleImageUpload} 
        />

        <button onClick={handleSetDotSize}>
          Set Dot Size ({dotSize}px)
        </button>
        
        <label htmlFor="colorMode" style={{ marginRight: '-10px' }}>Color Mode:</label>
        <select 
          id="colorMode" 
          value={colorMode} 
          onChange={(e) => setColorMode(e.target.value)}
        >
          <option value="color">Color</option>
          <option value="grayscale">Grayscale</option>
          <option value="sepia">Sepia</option>
          <option value="inverted">Inverted</option>
          <option value="blackwhite">Black & White</option>
        </select>

        <button 
          onClick={handleDownload} 
          disabled={!currentImage}
        >
          Download Dot Art
        </button>
      </div>

      <div className="canvas-container">
        <div className="canvas-wrapper">
          <h2>Original Image</h2>
          <canvas ref={originalCanvasRef}></canvas>
        </div>
        <div className="canvas-wrapper">
          <h2>Dot Art Result</h2>
          <canvas ref={dotCanvasRef}></canvas>
        </div>
      </div>
    </div>
  );
}

export default App;
