
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { analyzeGameScreen, chatWithStrategist, generateGameVisual, editImage } from './services/geminiService';
import { Message } from './types';
import { 
  Sparkles, 
  Zap, 
  Send,
  Loader2,
  X,
  Plus,
  Target,
  Flame,
  Waves,
  AlertTriangle,
  Coins,
  TrendingDown,
  ShoppingCart,
  Brain,
  Palette,
  Image as ImageIcon,
  Maximize2,
  Brush,
  Download,
  Trash2,
  Save
} from 'lucide-react';

const SYNERGIES = [
  { 
    name: 'Mechanical', 
    icon: <Zap size={14} />, 
    desc: 'Tăng giáp và tốc độ đánh.',
    details: 'Mỗi tướng Mechanical nhận thêm 20% Giáp và 15% Tốc độ đánh. Khi đủ 4 tướng, các đòn đánh có 10% cơ hội gây choáng.',
    units: ['Steel Sentry', 'Clockwork Mage', 'Iron Juggernaut']
  },
  { 
    name: 'Nature', 
    icon: <Waves size={14} />, 
    desc: 'Hồi phục máu theo thời gian.',
    details: 'Hồi 2% máu tối đa mỗi giây cho toàn bộ đội hình. Tăng gấp đôi hiệu ứng cho các tướng Nature.',
    units: ['Root Walker', 'Floral Druid', 'Elder Oak']
  },
  { 
    name: 'Void', 
    icon: <Target size={14} />, 
    desc: 'Xuyên giáp và sát thương chuẩn.',
    details: 'Bỏ qua 40% Giáp của đối phương. Ở mốc (3), các đòn đánh gây thêm 5% sát thương chuẩn dựa trên máu hiện tại của mục tiêu.',
    units: ['Shadow Stalker', 'Void Weaver', 'Abyssal Lord']
  },
  { 
    name: 'Inferno', 
    icon: <Flame size={14} />, 
    desc: 'Sát thương đốt diện rộng.',
    details: 'Đốt kẻ địch trong 3 giây, gây sát thương phép tương đương 10% máu tối đa. Giảm 50% khả năng hồi máu của mục tiêu.',
    units: ['Fire Imp', 'Ember Knight', 'Pyromancer']
  },
];

const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];

const App: React.FC = () => {
  // Persistence Initialization
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('arcane_messages');
    return saved ? JSON.parse(saved) : [{
      id: '1',
      role: 'assistant',
      content: 'Chào sư phụ! 🧙‍♂️\nTôi đã được nâng cấp với khả năng Phân tích Pro, Tư duy sâu, và Tạo/Sửa ảnh ma thuật. Mọi dữ liệu giờ sẽ được TỰ ĐỘNG LƯU lại!'
    }];
  });

  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [hoveredSynergy, setHoveredSynergy] = useState<typeof SYNERGIES[0] | null>(null);
  
  const [useThinking, setUseThinking] = useState(() => localStorage.getItem('arcane_thinking') === 'true');
  const [mode, setMode] = useState<'chat' | 'generate' | 'edit'>(() => (localStorage.getItem('arcane_mode') as any) || 'chat');
  const [selectedRatio, setSelectedRatio] = useState(() => localStorage.getItem('arcane_ratio') || "1:1");
  const [editTargetImage, setEditTargetImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('arcane_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('arcane_thinking', useThinking.toString());
    localStorage.setItem('arcane_mode', mode);
    localStorage.setItem('arcane_ratio', selectedRatio);
  }, [useThinking, mode, selectedRatio]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAnalyzing]);

  const handleClearHistory = () => {
    if (window.confirm("Sư phụ có chắc muốn xóa sạch lịch sử chiến thuật không?")) {
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Lịch sử đã được làm mới. Hãy bắt đầu chiến dịch mới thôi sư phụ! 🛡️'
      }]);
    }
  };

  const downloadImage = (base64: string, name: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `arcane-${name}-${Date.now()}.png`;
    link.click();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setPastedImage(event.target?.result as string);
            setMode('chat');
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

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: mode === 'generate' ? `🎨 Tạo ảnh: ${currentText}` : mode === 'edit' ? `🖌️ Sửa ảnh: ${currentText}` : currentText,
      image: currentImage || undefined
    }]);

    setIsAnalyzing(true);

    try {
      let responseText = "";
      let responseImage = null;

      if (mode === 'generate') {
        responseImage = await generateGameVisual(currentText, selectedRatio);
        responseText = responseImage ? "Ảnh của bạn đã sẵn sàng! ✨ (Có thể nhấn nút Tải xuống để lưu)" : "❌ Không thể tạo ảnh.";
      } else if (mode === 'edit' && editTargetImage) {
        responseImage = await editImage(editTargetImage, currentText);
        responseText = responseImage ? "Ảnh đã được chỉnh sửa theo ý bạn! 🖌️" : "❌ Lỗi chỉnh sửa ảnh.";
        setEditTargetImage(null);
        setMode('chat');
      } else if (currentImage) {
        responseText = await analyzeGameScreen(currentImage);
      } else {
        responseText = await chatWithStrategist(currentText, useThinking);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        image: responseImage || undefined
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "❌ Có lỗi xảy ra trong quá trình xử lý phép thuật."
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-10rem)]">
        
        {/* Sidebar */}
        <div className="hidden lg:flex flex-col gap-4 lg:col-span-1 overflow-y-visible pr-2 custom-scrollbar">
          
          {/* Controls */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm shadow-xl space-y-4">
             <div className="flex items-center justify-between mb-2">
               <h3 className="font-fantasy text-amber-500 flex items-center gap-2 text-xs tracking-widest uppercase">
                <Maximize2 size={14} /> Tùy chọn nâng cao
              </h3>
              <button 
                onClick={handleClearHistory}
                className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                title="Xóa lịch sử chat"
              >
                <Trash2 size={14} />
              </button>
             </div>
            
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
               <div className="flex items-center gap-2">
                 <Brain size={16} className={useThinking ? "text-purple-400" : "text-slate-500"} />
                 <span className="text-xs font-bold">Tư duy sâu (Pro)</span>
               </div>
               <button 
                onClick={() => setUseThinking(!useThinking)}
                className={`w-10 h-5 rounded-full relative transition-colors ${useThinking ? 'bg-purple-600' : 'bg-slate-700'}`}
               >
                 <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useThinking ? 'right-1' : 'left-1'}`} />
               </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500">Chế độ hoạt động</label>
              <div className="grid grid-cols-3 gap-1">
                <button onClick={() => setMode('chat')} className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all border ${mode === 'chat' ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-slate-800/40 border-slate-700 text-slate-400'}`}>
                  <Zap size={16} /><span className="text-[9px]">Chat</span>
                </button>
                <button onClick={() => setMode('generate')} className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all border ${mode === 'generate' ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-slate-800/40 border-slate-700 text-slate-400'}`}>
                  <Palette size={16} /><span className="text-[9px]">Tạo</span>
                </button>
                <button onClick={() => { if(pastedImage) { setEditTargetImage(pastedImage); setMode('edit'); } else { alert('Hãy dán ảnh trước khi sửa!'); } }} className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all border ${mode === 'edit' ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-slate-800/40 border-slate-700 text-slate-400'}`}>
                  <Brush size={16} /><span className="text-[9px]">Sửa</span>
                </button>
              </div>
            </div>

            {mode === 'generate' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Tỷ lệ ảnh (Pro Image)</label>
                <div className="flex flex-wrap gap-1">
                  {ASPECT_RATIOS.map(ratio => (
                    <button 
                      key={ratio}
                      onClick={() => setSelectedRatio(ratio)}
                      className={`px-2 py-1 text-[9px] rounded-md border ${selectedRatio === ratio ? 'bg-blue-500 border-blue-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rules Panel */}
          <div className="bg-red-950/40 border border-red-500/50 rounded-2xl p-4 backdrop-blur-sm shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <h3 className="font-fantasy text-red-400 mb-2 flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-bold">
              <AlertTriangle size={14} />
              Luật sinh tồn
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                <ShoppingCart className="text-red-400" size={18} />
                <p className="text-[11px] font-black text-white leading-tight uppercase">
                  Giá lính >= 3 <br/>
                  <span className="text-red-400/80 font-normal normal-case">Tối thiểu 3 vàng/con.</span>
                </p>
              </div>
              <div className="flex items-center gap-3 p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                <TrendingDown className="text-red-400" size={18} />
                <p className="text-[11px] font-black text-white leading-tight uppercase">
                  Vàng = 0 <br/>
                  <span className="text-red-400/80 font-normal normal-case">Vàng biến mất sau mỗi vòng.</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm shadow-xl relative">
            <h3 className="font-fantasy text-amber-500 mb-4 flex items-center gap-2 text-sm tracking-widest uppercase">
              <Sparkles size={16} />
              Lưu trữ tự động
            </h3>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Save size={14} className="text-green-500" />
                <span>Trạng thái: <b>Đã lưu</b></span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Dữ liệu được lưu an toàn trong trình duyệt của sư phụ.</p>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3 flex flex-col bg-slate-900/40 border border-slate-800/50 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl relative">
          <div className="p-4 border-b border-slate-800/80 bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                <Coins className="text-black" size={20} />
              </div>
              <div>
                <h3 className="font-fantasy text-sm tracking-widest text-amber-500 uppercase">Arcane Master Pro</h3>
                <p className="text-[9px] text-amber-500/60 font-bold uppercase tracking-tighter flex items-center gap-1">
                  {mode === 'generate' ? 'Image Lab Active' : mode === 'edit' ? 'Nano Banana Editor' : useThinking ? 'High Thinking Mode' : 'Fast Response Mode'}
                </p>
              </div>
            </div>
            <div className="md:hidden flex gap-2">
              <button onClick={handleClearHistory} className="p-2 text-slate-500 hover:text-red-400"><Trash2 size={18} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar scroll-smooth">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[90%] sm:max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  <div className={`p-4 rounded-2xl shadow-xl transition-all duration-300 relative group ${
                    msg.role === 'user' 
                      ? 'bg-amber-600 text-white rounded-tr-none' 
                      : 'bg-slate-800/90 border border-slate-700/50 text-slate-200 rounded-tl-none backdrop-blur-sm'
                  }`}>
                    {msg.image && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-white/10 bg-black/40 relative">
                        <img src={msg.image} alt="Game Visual" className="max-w-full h-auto max-h-[400px] mx-auto" />
                        <button 
                          onClick={() => downloadImage(msg.image!, msg.role)}
                          className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md border border-white/20 hover:bg-amber-500"
                          title="Tải ảnh về máy"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed text-sm antialiased font-medium">
                      {msg.content.split('---').map((part, i) => {
                        if (i === 1) return (
                          <div key={i} className="mt-4 p-4 bg-amber-500/15 border border-amber-500/40 rounded-xl shadow-[inset_0_1px_20px_rgba(245,158,11,0.05)]">
                            <div className="flex items-center gap-2 mb-2 text-amber-400 uppercase text-[10px] font-black tracking-widest">
                              <Target size={14} /> LỘ TRÌNH CHI TIÊU
                            </div>
                            {part}
                          </div>
                        );
                        return part;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isAnalyzing && (
              <div className="flex justify-start">
                <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl rounded-tl-none flex items-center gap-4 shadow-lg backdrop-blur-sm animate-pulse">
                  <Loader2 className="animate-spin text-amber-500" size={20} />
                  <span className="text-sm text-amber-500 font-bold italic tracking-tight uppercase">
                    {useThinking ? "Đang suy nghĩ chuyên sâu..." : mode === 'generate' ? "Đang vẽ ảnh..." : "Đang xử lý..."}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 md:p-4 bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-xl">
            {pastedImage && mode !== 'edit' && (
              <div className="mb-4 relative inline-block group animate-in zoom-in-95 duration-200">
                <img src={pastedImage} className="h-24 w-auto rounded-xl border-2 border-amber-500 shadow-2xl object-cover relative z-10" />
                <button onClick={() => setPastedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-xl hover:scale-110 z-20"><X size={12} /></button>
              </div>
            )}

            {mode === 'edit' && editTargetImage && (
              <div className="mb-4 relative flex items-center gap-4 bg-green-500/10 border border-green-500/30 p-3 rounded-xl animate-in slide-in-from-left-2">
                 <div className="relative">
                   <img src={editTargetImage} className="h-16 w-auto rounded-lg border border-green-500/50" />
                   <div className="absolute inset-0 flex items-center justify-center bg-black/40"><Brush size={16} className="text-green-400" /></div>
                 </div>
                 <div>
                   <p className="text-[10px] text-green-400 font-bold uppercase">Chế độ sửa ảnh</p>
                   <p className="text-[9px] text-green-200/60">Nhập yêu cầu sửa (VD: "Làm rực rỡ hơn")</p>
                 </div>
                 <button onClick={() => { setMode('chat'); setEditTargetImage(null); }} className="ml-auto text-slate-500 hover:text-white"><X size={16} /></button>
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className={`relative flex items-end gap-2 bg-slate-950/80 border rounded-2xl p-2 transition-all shadow-2xl ${
              mode === 'generate' ? 'border-blue-500/50 focus-within:border-blue-400' : 
              mode === 'edit' ? 'border-green-500/50 focus-within:border-green-400' : 
              'border-slate-800 focus-within:border-amber-500/50'
            }`}>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-500 hover:text-amber-500 transition-all rounded-xl"><Plus size={22} /></button>
              <textarea
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder={mode === 'generate' ? "Mô tả ảnh muốn tạo..." : mode === 'edit' ? "Mô tả thay đổi..." : "Dán ảnh Shop hoặc chat..."}
                className="flex-1 bg-transparent border-none focus:ring-0 py-3 px-1 resize-none text-sm text-slate-200 placeholder-slate-700"
              />
              <button type="submit" disabled={(!inputText.trim() && !pastedImage && mode !== 'generate') || isAnalyzing} className={`p-3 rounded-xl text-black hover:scale-105 active:scale-95 disabled:opacity-30 transition-all flex-shrink-0 ${
                mode === 'generate' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                mode === 'edit' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                'bg-gradient-to-br from-amber-400 to-amber-600'
              }`}>
                {isAnalyzing ? <Loader2 className="animate-spin" size={22} /> : mode === 'generate' ? <ImageIcon size={22} /> : mode === 'edit' ? <Brush size={22} /> : <Send size={22} />}
              </button>
            </form>
            <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setPastedImage(reader.result as string);
                reader.readAsDataURL(file);
              }
            }} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;
