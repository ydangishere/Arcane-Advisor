
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { analyzeGameScreen, chatWithStrategist, generateGameVisual, editImage } from './services/geminiService';
import { Message } from './types';
import { 
  Sparkles, Zap, Send, Loader2, X, Plus, Target, Flame, Waves, AlertTriangle, 
  Coins, TrendingDown, ShoppingCart, Brain, Palette, Image as ImageIcon, 
  Maximize2, Brush, Download, Trash2, Save
} from 'lucide-react';

const SYNERGIES = [
  { name: 'Mechanical', icon: <Zap size={14} />, desc: 'Tăng giáp và tốc độ đánh.' },
  { name: 'Nature', icon: <Waves size={14} />, desc: 'Hồi phục máu.' },
  { name: 'Void', icon: <Target size={14} />, desc: 'Xuyên giáp.' },
  { name: 'Inferno', icon: <Flame size={14} />, desc: 'Sát thương đốt.' },
];

const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('arcane_messages');
    return saved ? JSON.parse(saved) : [{
      id: '1', role: 'assistant',
      content: 'Chào sư phụ! 🧙‍♂️\nTôi là Arcane Strategist. Hãy dán ảnh Shop hoặc chat để tôi tư vấn chiến thuật "all-in" cho sư phụ!'
    }];
  });

  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [useThinking, setUseThinking] = useState(() => localStorage.getItem('arcane_thinking') === 'true');
  const [mode, setMode] = useState<'chat' | 'generate' | 'edit'>(() => (localStorage.getItem('arcane_mode') as any) || 'chat');
  const [selectedRatio, setSelectedRatio] = useState(() => localStorage.getItem('arcane_ratio') || "1:1");
  const [editTargetImage, setEditTargetImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('arcane_messages', JSON.stringify(messages));
    localStorage.setItem('arcane_thinking', useThinking.toString());
    localStorage.setItem('arcane_mode', mode);
    localStorage.setItem('arcane_ratio', selectedRatio);
  }, [messages, useThinking, mode, selectedRatio]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAnalyzing]);

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setPastedImage(event.target?.result as string);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !pastedImage && mode !== 'generate') return;
    
    const currentText = inputText;
    const currentImage = pastedImage;
    setInputText('');
    setPastedImage(null);

    const newUserMsg: Message = {
      id: Date.now().toString(), role: 'user',
      content: mode === 'generate' ? `🎨 Tạo: ${currentText}` : mode === 'edit' ? `🖌️ Sửa: ${currentText}` : currentText,
      image: currentImage || undefined
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsAnalyzing(true);

    try {
      let resText = "";
      let resImg = null;

      if (mode === 'generate') {
        resImg = await generateGameVisual(currentText, selectedRatio);
        resText = resImg ? "Ảnh ma thuật của sư phụ đây! ✨" : "Phép thuật tạo ảnh thất bại.";
      } else if (mode === 'edit' && editTargetImage) {
        resImg = await editImage(editTargetImage, currentText);
        resText = resImg ? "Đã chỉnh sửa theo ý sư phụ! 🖌️" : "Lỗi khi sửa ảnh.";
        setEditTargetImage(null);
        setMode('chat');
      } else if (currentImage) {
        resText = await analyzeGameScreen(currentImage);
      } else {
        resText = await chatWithStrategist(currentText, useThinking);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: resText, image: resImg || undefined
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "❌ Có lỗi xảy ra trong kết giới AI." }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadImage = (base64: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `arcane-rush-${Date.now()}.png`;
    link.click();
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-10rem)]">
        
        {/* Sidebar */}
        <div className="hidden lg:flex flex-col gap-4 lg:col-span-1 overflow-y-auto pr-2 custom-scrollbar">
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-4 backdrop-blur-sm">
             <div className="flex items-center justify-between mb-2">
               <h3 className="font-fantasy text-amber-500 text-xs tracking-widest uppercase flex items-center gap-2">
                <Maximize2 size={14} /> Tùy chỉnh
              </h3>
              <button onClick={() => setMessages([{id: '1', role: 'assistant', content: 'Lịch sử đã được dọn dẹp.'}])} className="text-slate-600 hover:text-red-400 p-1"><Trash2 size={14} /></button>
             </div>
            
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
               <div className="flex items-center gap-2">
                 <Brain size={14} className={useThinking ? "text-purple-400" : "text-slate-500"} />
                 <span className="text-[10px] font-bold">Tư duy Pro</span>
               </div>
               <button onClick={() => setUseThinking(!useThinking)} className={`w-8 h-4 rounded-full relative transition-colors ${useThinking ? 'bg-purple-600' : 'bg-slate-700'}`}>
                 <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useThinking ? 'right-0.5' : 'left-0.5'}`} />
               </button>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase font-bold text-slate-500">Chế độ</label>
              <div className="grid grid-cols-3 gap-1">
                <button onClick={() => setMode('chat')} className={`p-2 rounded-lg text-[10px] border transition-all ${mode === 'chat' ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-slate-800/40 border-slate-700 text-slate-400'}`}>Chat</button>
                <button onClick={() => setMode('generate')} className={`p-2 rounded-lg text-[10px] border transition-all ${mode === 'generate' ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-slate-800/40 border-slate-700 text-slate-400'}`}>Tạo</button>
                <button onClick={() => { if(pastedImage) { setEditTargetImage(pastedImage); setMode('edit'); } else { alert('Dán ảnh trước khi sửa!'); } }} className={`p-2 rounded-lg text-[10px] border transition-all ${mode === 'edit' ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-slate-800/40 border-slate-700 text-slate-400'}`}>Sửa</button>
              </div>
            </div>

            {mode === 'generate' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                <label className="text-[9px] uppercase font-bold text-slate-500">Tỷ lệ</label>
                <div className="flex flex-wrap gap-1">
                  {ASPECT_RATIOS.map(r => (
                    <button key={r} onClick={() => setSelectedRatio(r)} className={`px-1.5 py-0.5 text-[9px] rounded border ${selectedRatio === r ? 'bg-blue-500 border-blue-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{r}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-red-950/30 border border-red-500/40 rounded-2xl p-4">
            <h3 className="font-fantasy text-red-400 mb-2 text-[10px] uppercase font-bold flex items-center gap-2"><AlertTriangle size={12}/> Luật Sinh Tồn</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
                <ShoppingCart size={14} className="text-red-400"/>
                <span className="text-[10px] text-white">Lính giá >= 3 Vàng</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
                <TrendingDown size={14} className="text-red-400"/>
                <span className="text-[10px] text-white">Vàng biến mất mỗi vòng</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col bg-slate-900/40 border border-slate-800/50 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl relative">
          <div className="p-4 border-b border-slate-800/80 bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]"><Coins className="text-black" size={16}/></div>
              <div>
                <h3 className="font-fantasy text-xs tracking-widest text-amber-500 uppercase">Arcane Master Pro</h3>
                <p className="text-[9px] text-slate-500 italic">Dữ liệu được lưu tự động <Save size={8} className="inline"/></p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] group ${msg.role === 'user' ? 'order-2' : ''}`}>
                  <div className={`p-3 rounded-2xl relative transition-all shadow-lg ${msg.role === 'user' ? 'bg-amber-600 text-white rounded-tr-none' : 'bg-slate-800/90 border border-slate-700/50 text-slate-200 rounded-tl-none'}`}>
                    {msg.image && (
                      <div className="mb-2 rounded-lg overflow-hidden border border-white/10 relative bg-black/40">
                        <img src={msg.image} alt="Game" className="max-h-64 mx-auto" />
                        <button onClick={() => downloadImage(msg.image!)} className="absolute top-1 right-1 p-1.5 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Download size={14}/></button>
                      </div>
                    )}
                    <div className="text-xs whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  </div>
                </div>
              </div>
            ))}
            {isAnalyzing && (
              <div className="flex justify-start">
                <div className="bg-slate-800/50 p-3 rounded-xl flex items-center gap-3 animate-pulse">
                  <Loader2 className="animate-spin text-amber-500" size={16}/>
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-tighter">AI đang triệu hồi tri thức...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-slate-900/95 border-t border-slate-800">
            {pastedImage && mode !== 'edit' && (
              <div className="mb-4 relative inline-block animate-in zoom-in-95">
                <img src={pastedImage} className="h-20 w-auto rounded-lg border-2 border-amber-500 shadow-xl" />
                <button onClick={() => setPastedImage(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg text-white"><X size={10}/></button>
              </div>
            )}

            {mode === 'edit' && editTargetImage && (
              <div className="mb-4 flex items-center gap-3 bg-green-500/10 border border-green-500/30 p-2 rounded-xl">
                 <img src={editTargetImage} className="h-12 w-auto rounded border border-green-500/50" />
                 <p className="text-[10px] text-green-400 font-bold uppercase">Sửa ảnh này</p>
                 <button onClick={() => {setMode('chat'); setEditTargetImage(null);}} className="ml-auto text-slate-500"><X size={14}/></button>
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2 focus-within:border-amber-500/50 shadow-inner">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-amber-500 transition-all"><Plus size={20}/></button>
              <input 
                value={inputText} 
                onChange={e => setInputText(e.target.value)} 
                onPaste={handlePaste}
                placeholder={mode === 'generate' ? "Mô tả ảnh muốn tạo..." : mode === 'edit' ? "Mô tả thay đổi..." : "Dán ảnh Shop hoặc nhập lệnh..."}
                className="flex-1 bg-transparent border-none focus:ring-0 text-xs text-slate-300 py-2"
              />
              <button 
                type="submit" 
                disabled={isAnalyzing || (!inputText.trim() && !pastedImage && mode !== 'generate')} 
                className={`p-2 rounded-lg text-black transition-all ${mode === 'generate' ? 'bg-blue-500 hover:bg-blue-400' : 'bg-amber-500 hover:bg-amber-400'}`}
              >
                {isAnalyzing ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
              </button>
            </form>
            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={e => {
              const f = e.target.files?.[0];
              if(f) {
                const r = new FileReader();
                r.onloadend = () => setPastedImage(r.result as string);
                r.readAsDataURL(f);
              }
            }} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;
