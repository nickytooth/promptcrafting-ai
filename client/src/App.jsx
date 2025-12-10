import { useState, useEffect } from 'react';
import { Sparkles, Upload, Copy, Check, Loader2, Video, FileText, ChevronDown } from 'lucide-react';

const API_BASE = '/api';

function App() {
  const [activeTab, setActiveTab] = useState('scene');
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch available platforms on mount
  useEffect(() => {
    fetch(`${API_BASE}/platforms`)
      .then(res => res.json())
      .then(data => {
        setPlatforms(data);
        if (data.length > 0) {
          setSelectedPlatform(data[0].id);
        }
      })
      .catch(err => console.error('Failed to fetch platforms:', err));
  }, []);

  // Generate prompt from scene description
  const handleGenerateFromDescription = async () => {
    if (!description.trim()) {
      setError('Please enter a scene description');
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedPrompt('');

    try {
      const response = await fetch(`${API_BASE}/generate-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          platform: selectedPlatform
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate prompt');
      }

      setGeneratedPrompt(data.prompt);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze video and generate prompt
  const handleAnalyzeVideo = async () => {
    if (!videoFile) {
      setError('Please upload a video file');
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedPrompt('');

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('platform', selectedPlatform);

      const response = await fetch(`${API_BASE}/analyze-video`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze video');
      }

      setGeneratedPrompt(data.prompt);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy prompt to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('Video file must be less than 10MB');
        return;
      }
      setVideoFile(file);
      setError('');
    } else {
      setError('Please upload a valid video file');
    }
  };

  // Handle file select
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('Video file must be less than 10MB');
        return;
      }
      setVideoFile(file);
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="border-b border-dark-600">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold">Promptcrafting</span>
          </div>
          <div className="text-sm text-gray-400">
            AI Video Prompt Generator
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Craft Perfect <span className="gradient-text">AI Video</span> Prompts
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Transform your ideas into professional prompts for Veo 3.1, Sora 2, and more. 
            Describe a scene or upload a video for instant prompt generation.
          </p>
        </div>

        {/* Platform Selector */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="appearance-none bg-dark-700 border border-dark-500 rounded-xl px-6 py-3 pr-12 text-white font-medium focus:outline-none focus:border-accent-primary transition-colors cursor-pointer"
            >
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-dark-800 rounded-xl p-1">
            <button
              onClick={() => {
                setActiveTab('scene');
                setError('');
                setGeneratedPrompt('');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'scene'
                  ? 'bg-accent-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-5 h-5" />
              Scene Description
            </button>
            <button
              onClick={() => {
                setActiveTab('video');
                setError('');
                setGeneratedPrompt('');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'video'
                  ? 'bg-accent-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Video className="w-5 h-5" />
              Video Upload
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="glass rounded-2xl p-8 mb-8">
          {activeTab === 'scene' ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Describe your scene in one sentence
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A lone astronaut discovers an ancient alien temple on a foggy alien planet at dawn..."
                className="w-full h-32 bg-dark-800 border border-dark-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary transition-colors"
              />
              <button
                onClick={handleGenerateFromDescription}
                disabled={isLoading || !description.trim()}
                className="mt-4 w-full bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Prompt
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Upload a video to analyze
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                  isDragging
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-dark-500 hover:border-dark-400'
                }`}
              >
                {videoFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <Video className="w-12 h-12 text-accent-primary" />
                    <p className="text-white font-medium">{videoFile.name}</p>
                    <p className="text-gray-400 text-sm">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <button
                      onClick={() => setVideoFile(null)}
                      className="text-sm text-accent-primary hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 text-gray-500" />
                    <p className="text-gray-300">
                      Drag and drop your video here, or{' '}
                      <label className="text-accent-primary cursor-pointer hover:underline">
                        browse
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-gray-500 text-sm">
                      MP4, WebM, MOV, AVI • Max 10MB • Max 12 seconds
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={handleAnalyzeVideo}
                disabled={isLoading || !videoFile}
                className="mt-4 w-full bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Video...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analyze & Generate Prompt
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-6 py-4 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Generated Prompt Output */}
        {generatedPrompt && (
          <div className="glass rounded-2xl p-8 animate-pulse-glow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Generated Prompt</h2>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-dark-600 hover:bg-dark-500 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-dark-800 rounded-xl p-6 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-gray-300 font-mono text-sm leading-relaxed">
                {generatedPrompt}
              </pre>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>
            Powered by Claude Sonnet 4.5 & Gemini 3 Pro
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
