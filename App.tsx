import React, { useState, useCallback } from 'react';
import { Palette, Download, RefreshCw, Sparkles, Loader2, Printer, BookOpen, X } from 'lucide-react';
import { generatePagePrompts, generateColoringImage } from './services/gemini';
import { generatePDF } from './utils/pdf';
import { ColoringPage, GenerationState } from './types';
import ChatBot from './components/ChatBot';

function App() {
  const [state, setState] = useState<GenerationState>({
    theme: '',
    pages: [],
    isGenerating: false,
    currentStep: 0,
    error: null,
  });

  const [completedCount, setCompletedCount] = useState(0);

  const handleGenerate = useCallback(async () => {
    if (!state.theme.trim()) return;

    setState(prev => ({
      ...prev,
      isGenerating: true,
      currentStep: 1,
      error: null,
      pages: [], // Clear previous
    }));
    setCompletedCount(0);

    try {
      // 1. Generate Prompts (3 images)
      const descriptions = await generatePagePrompts(state.theme);
      
      const initialPages: ColoringPage[] = descriptions.map((desc, idx) => ({
        id: idx.toString(),
        prompt: desc,
        imageUrl: '',
        status: 'pending'
      }));

      setState(prev => ({ ...prev, pages: initialPages }));

      // 2. Generate Images Sequentially
      const updatedPages = [...initialPages];
      const totalImages = updatedPages.length;
      
      for (let i = 0; i < totalImages; i++) {
        // Update status to generating
        updatedPages[i] = { ...updatedPages[i], status: 'generating' };
        setState(prev => ({ ...prev, pages: [...updatedPages] }));

        try {
          const imageUrl = await generateColoringImage(updatedPages[i].prompt);
          updatedPages[i] = { ...updatedPages[i], status: 'completed', imageUrl };
          setCompletedCount(prev => prev + 1);
        } catch (err) {
          console.error(`Failed to generate page ${i}`, err);
          updatedPages[i] = { ...updatedPages[i], status: 'failed' };
        }
        
        setState(prev => ({ ...prev, pages: [...updatedPages] }));
      }

      setState(prev => ({ ...prev, isGenerating: false, currentStep: 2 }));

    } catch (err) {
      console.error(err);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: "Something went wrong while creating your coloring book. Please try again!",
      }));
    }
  }, [state.theme]);

  const handleDownload = () => {
    generatePDF(state.theme, state.pages);
  };

  const handleReset = () => {
    setState({
      theme: '',
      pages: [],
      isGenerating: false,
      currentStep: 0,
      error: null,
    });
    setCompletedCount(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative overflow-x-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-sky-200 to-slate-50 -z-10"></div>
      <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-300 rounded-full blur-3xl opacity-50 -z-10"></div>
      <div className="absolute top-40 left-20 w-40 h-40 bg-pink-300 rounded-full blur-3xl opacity-50 -z-10"></div>

      <main className="container mx-auto px-4 py-10 max-w-5xl">
        
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center bg-white p-3 rounded-full shadow-md mb-4">
            <Palette className="w-8 h-8 text-indigo-500 mr-2" />
            <span className="text-xl font-bold text-indigo-600 tracking-tight">DreamColor</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-800 mb-4 tracking-tight">
            Create Your Custom <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500">Coloring Book</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Enter a theme and we'll use AI to generate a unique, printable coloring book. Perfect for all ages.
          </p>
        </header>

        {/* Step 1: Input */}
        {state.currentStep === 0 && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-indigo-50">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">What's the theme?</label>
                <input
                  type="text"
                  value={state.theme}
                  onChange={(e) => setState(prev => ({ ...prev, theme: e.target.value }))}
                  placeholder="e.g., Space Dinosaurs, Floral Patterns, Cyberpunk City"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-lg"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={!state.theme}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-3"
              >
                <Sparkles className="w-6 h-6" />
                Generate Coloring Book
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Generating */}
        {state.currentStep === 1 && (
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-white rounded-3xl shadow-xl p-10 border border-indigo-50">
              <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Creating Your Book...</h2>
              <p className="text-slate-500 mb-8">
                Designing page {completedCount + 1} of 3 for theme: {state.theme}.
              </p>
              
              {/* Progress Bar */}
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden mb-8 max-w-md mx-auto">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-500 ease-out"
                  style={{ width: `${(completedCount / 3) * 100}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {state.pages.map((page, idx) => (
                  <div key={idx} className={`aspect-[3/4] rounded-lg border-2 ${page.status === 'completed' ? 'border-green-400 bg-green-50' : page.status === 'generating' ? 'border-indigo-400 bg-indigo-50 animate-pulse' : 'border-slate-100 bg-slate-50'} flex items-center justify-center transition-all`}>
                    {page.status === 'completed' ? (
                      <img src={page.imageUrl} alt="" className="w-full h-full object-cover rounded-md opacity-80" />
                    ) : (
                      <span className="text-slate-300 font-bold">{idx + 1}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {state.currentStep === 2 && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Ready to Print!</h2>
                <p className="text-slate-500">Here are your 3 unique coloring pages.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleReset} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" /> New Book
                </button>
                <button onClick={handleDownload} className="px-6 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200 transition-all hover:-translate-y-1 flex items-center gap-2">
                  <Download className="w-5 h-5" /> Download PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {state.pages.map((page, idx) => (
                <div key={idx} className="group relative aspect-[3/4] bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100 hover:shadow-xl transition-all duration-300">
                   {page.status === 'completed' ? (
                     <>
                      <img 
                        src={page.imageUrl} 
                        alt={`Page ${idx + 1}`} 
                        className="w-full h-full object-contain p-4"
                      />
                      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs line-clamp-2">{page.prompt}</p>
                      </div>
                     </>
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-400 p-4 text-center">
                       <span className="text-sm font-bold">Generation Failed</span>
                     </div>
                   )}
                   <div className="absolute top-3 left-3 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center font-bold text-indigo-600 text-sm">
                     {idx + 1}
                   </div>
                </div>
              ))}
            </div>
            
            {/* Preview of Cover */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-indigo-50 max-w-4xl mx-auto mt-12 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-2">
                  <BookOpen className="w-5 h-5" />
                  <span>PDF Preview</span>
                </div>
                <h3 className="text-3xl font-bold mb-4">What's in the PDF?</h3>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">✓</div>
                    Custom cover with theme title
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">✓</div>
                    3 high-resolution coloring pages
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">✓</div>
                    Optimized A4 print layout
                  </li>
                </ul>
              </div>
              
              {/* Visual representation of PDF cover */}
              <div className="w-48 h-64 bg-white border-2 border-slate-200 shadow-2xl flex flex-col items-center justify-center p-4 text-center relative transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <div className="border border-slate-800 w-full h-full flex flex-col items-center justify-center p-2">
                    <div className="font-bold text-xl mb-2">Coloring Book</div>
                    <div className="text-xs text-slate-500">Theme</div>
                    <div className="text-lg font-bold mb-4">{state.theme}</div>
                  </div>
              </div>
            </div>
          </div>
        )}

        {state.error && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce-slow z-50">
            <span>⚠️ {state.error}</span>
            <button onClick={() => setState(prev => ({ ...prev, error: null }))} className="ml-2 hover:bg-red-600 rounded-full p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

      </main>

      <ChatBot />
      
      {/* Floating blobs for vibe */}
      <div className="fixed bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
    </div>
  );
}

export default App;