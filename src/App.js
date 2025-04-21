import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState(null);
  const [sketchUrl, setSketchUrl] = useState(() => localStorage.getItem('sketchUrl') || '');
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sketchUrl) localStorage.setItem('sketchUrl', sketchUrl);
  }, [sketchUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) previewAndUpload(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) previewAndUpload(file);
  }, []);

  const previewAndUpload = (file) => {
    setSelectedFile(file);
    setOriginalPreview(URL.createObjectURL(file));
    setSketchUrl('');
    uploadImage(file);
  };

  const uploadImage = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/upload`, formData);
      const imageUrl = `${process.env.REACT_APP_API_URL}${res.data.imageUrl}`;
      setSketchUrl(imageUrl);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setLoading(false);
    }
  };

  const discardImage = async () => {
    const filename = sketchUrl.split('/').pop();
    await axios.post(`${process.env.REACT_APP_API_URL}/discard`, { filename });
    localStorage.removeItem('sketchUrl');
    setSketchUrl('');
    setSelectedFile(null);
    setOriginalPreview(null);
  };

  return (
    <div className="p-6 font-sans min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-center">🎨 Image to Sketch Converter</h1>

      {!originalPreview && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          className={`border-4 border-dashed rounded-xl p-10 text-center mb-6 transition ${
            dragOver ? 'bg-blue-100' : 'bg-white'
          }`}
        >
          <p className="mb-2">Drag and drop an image here or click to upload</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="upload"
          />
          <label htmlFor="upload" className="cursor-pointer text-blue-600 underline">
            Choose a file
          </label>
        </div>
      )}

      {originalPreview && (
        <div className="flex flex-col md:flex-row justify-center items-start gap-8">
          <div>
            <h3 className="font-semibold text-center mb-2">Original Image</h3>
            <img src={originalPreview} alt="Original" className="rounded-lg shadow max-w-sm" />
          </div>
          <div>
            <h3 className="font-semibold text-center mb-2">Sketch Output</h3>
            {loading ? (
              <div className="text-blue-500 text-center font-medium text-lg">Generating sketch...</div>
            ) : sketchUrl ? (
              <>
                <img src={sketchUrl} alt="Sketch" className="rounded-lg shadow max-w-sm" />
                <div className="text-center mt-4">
                  <button
                    onClick={discardImage}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Discard Image
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
