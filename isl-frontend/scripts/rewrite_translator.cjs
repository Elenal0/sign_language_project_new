const fs = require('fs');
let code = fs.readFileSync('src/pages/Translator.jsx', 'utf8');

// Add new imports if needed
if (!code.includes('Settings')) {
  code = code.replace('Send,', 'Send, Settings, Monitor, Mic, MicOff, Maximize2, Minimize2,');
}

// Inject new state variables
const stateInjection = `  const [userName, setUserName]       = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab]   = useState('transcript');
  const [isMuted, setIsMuted]         = useState(false);
  const [isVideoOn, setIsVideoOn]     = useState(true);
  const [isAslActive, setIsAslActive] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})), 1000);
    return () => clearInterval(t);
  }, []);
`;
code = code.replace('const [inRoom, setInRoom]           = useState(false);', 'const [inRoom, setInRoom]           = useState(false);\n' + stateInjection);

// Find the RENDER block and everything below
const renderIndex = code.indexOf('// RENDER');
if (renderIndex === -1) {
  console.log('RENDER comment not found');
  process.exit(1);
}

const beforeRender = code.substring(0, renderIndex);

// Define the new RENDER block
const newRender = `// RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Mock transcript messages
  const mockMessages = [
    { sender: 'You', time: '12:42', text: 'Yes, visual is perfect. Audio is coming through nicely too.' },
    { sender: 'Partner', time: '12:43', text: 'Great! Let\\'s go over the new dashboard features.', isAsl: true },
    { sender: 'Partner', time: '12:45', text: 'So the main updates to the design system are ready for review.', isAsl: true }
  ];

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white overflow-hidden relative font-sans">
      
      {/* Subtle Glowing Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* HEADER */}
      <header className="relative z-50 flex items-center justify-between px-6 py-4 shrink-0">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="p-1.5 bg-indigo-500/20 rounded-lg">
              <Video className="w-4 h-4 text-indigo-400" />
            </motion.div>
            <h1 className="font-semibold text-sm tracking-wide">Drishya Vaani</h1>
          </div>
          
          {(isActive || backendReady) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-400">SignSync™ Active</span>
            </div>
          )}
        </div>

        {/* Center: Language & Mode */}
        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1">
            {Object.entries(LANG_CONFIG).map(([code, cfg]) => (
              <button key={code} onClick={() => setLanguage(code)} className={\`px-4 py-1.5 rounded-lg text-xs font-bold transition-all \${language === code ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white'}\`}>
                {cfg.label}
              </button>
            ))}
          </div>
          <div className="flex bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1">
            {[{ id: 'solo', label: 'Solo', icon: User }, { id: 'call', label: 'Call', icon: Users }].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => handleModeSwitch(id)} className={\`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all \${mode === id ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white'}\`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Security & Time */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            End-to-end Encrypted
          </div>
          <div className="text-sm font-medium text-gray-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
            {currentTime}
          </div>
        </div>
      </header>

      {/* LOBBY OR MAIN CALL */}
      {!inRoom && mode === 'call' ? (
        <div className="flex-1 flex items-center justify-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] w-full max-w-md shadow-2xl flex flex-col gap-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/30">
                <Users className="text-indigo-400 w-6 h-6" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Join Session</h2>
              <p className="text-sm text-gray-400">Enter your name and the room code to connect.</p>
            </div>
            
            <div className="flex flex-col gap-4">
              <input
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="Your Name"
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <input
                value={roomInput}
                onChange={e => setRoomInput(normalizeRoomCode(e.target.value))}
                onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
                placeholder="ROOM CODE"
                maxLength={8}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors uppercase tracking-widest text-center font-mono font-bold"
              />
              <motion.button onClick={handleJoinRoom} className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-medium transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                Join Call
              </motion.button>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden px-4 pb-4 gap-4 relative z-10">
          
          {/* MAIN VIDEO AREA */}
          <div className="flex-1 relative rounded-[2rem] overflow-hidden border border-white/10 bg-black/40 shadow-2xl flex items-center justify-center">
            
            {/* The Main Video Stream (Remote in Call, Local in Solo) */}
            {mode === 'call' ? (
              callStatus === 'connected' ? (
                <video ref={attachRemoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-4 text-gray-400 z-10 relative">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p>{callStatus === 'waiting' ? 'Waiting for partner to join...' : 'Connecting...'}</p>
                </div>
              )
            ) : (
               <>
                  <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none" />
                  {!isActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4 z-10">
                       <button onClick={handleStart} className="bg-indigo-600 px-6 py-3 rounded-full font-medium hover:bg-indigo-500">Start Camera</button>
                    </div>
                  )}
               </>
            )}

            {/* Dark gradient for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

            {/* Top Left Name Tag (Call mode) */}
            {mode === 'call' && callStatus === 'connected' && (
              <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
                <div className="flex items-end gap-1 h-3">
                  {[1,2,3,4,5].map(i => (
                    <motion.div key={i} animate={{ height: ['4px', '12px', '4px'] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }} className="w-1 bg-emerald-400 rounded-full" />
                  ))}
                </div>
                <span className="text-sm font-medium">Partner</span>
              </div>
            )}

            {/* Top Right Tracking Badge */}
            {(mode === 'solo' || (mode === 'call' && callStatus === 'connected')) && isAslActive && (
              <div className={\`absolute top-6 \${mode === 'call' ? 'left-40' : 'right-6'} bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2\`}>
                 <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                 <span className="text-xs font-medium text-indigo-300">AI Tracking Active</span>
              </div>
            )}

            {/* PiP Local Video (Call mode) */}
            {mode === 'call' && (
              <motion.div 
                drag dragConstraints={{ left: -800, right: 0, top: 0, bottom: 400 }}
                className="absolute top-6 right-6 w-56 aspect-[3/4] bg-gray-900 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl cursor-move z-20"
              >
                <video ref={(el) => {
                  videoRef.current = el;
                  localVideoRef.current = el;
                  if (el && getStream() && el.srcObject !== getStream()) el.srcObject = getStream();
                }} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none" />
                
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium">
                    {userName || 'You'}
                  </div>
                  {isMuted && <div className="bg-red-500/80 p-1.5 rounded-full"><VolumeX className="w-3 h-3" /></div>}
                </div>
              </motion.div>
            )}

            {/* Real-time Translation Overlay */}
            <AnimatePresence>
              {(sentence.length > 0 || translatedText) && isAslActive && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-28 max-w-4xl w-[90%] bg-black/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden z-20"
                >
                  {/* Shimmer effect */}
                  <motion.div animate={{ backgroundPosition: ['200% 0', '-200% 0'] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(192,132,252,0.3), transparent)', backgroundSize: '200% 100%' }} />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-indigo-500/20 rounded-lg"><MessageSquare className="w-4 h-4 text-indigo-400" /></div>
                      <span className="text-xs font-bold text-indigo-300 tracking-wider uppercase flex items-center gap-2">
                        {mode === 'call' && callStatus === 'connected' ? 'Partner TRANSLATING FROM ISL' : 'TRANSLATING FROM ISL'}
                        {isTranslating && (
                          <span className="flex gap-1">
                            <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1 h-1 bg-indigo-400 rounded-full"/>
                            <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1 h-1 bg-indigo-400 rounded-full"/>
                            <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1 h-1 bg-indigo-400 rounded-full"/>
                          </span>
                        )}
                      </span>
                    </div>
                    
                    <p className="text-3xl md:text-4xl font-medium leading-tight tracking-tight text-white drop-shadow-lg font-serif">
                      "{getDisplayText() || getText()}"
                    </p>

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                      <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
                        {suggestions.map((s, i) => (
                          <button key={i} onClick={() => applySuggestion(s)} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors whitespace-nowrap">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Control Bar */}
            <div className="absolute bottom-6 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl z-30">
               <button onClick={() => setIsMuted(!isMuted)} className={\`p-3 rounded-full transition-colors \${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 hover:bg-white/20'}\`} title="Mute">
                 {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
               </button>
               <button onClick={() => { setIsVideoOn(!isVideoOn); isVideoOn ? handleStop() : handleStart(); }} className={\`p-3 rounded-full transition-colors \${!isVideoOn ? 'bg-red-500/20 text-red-400' : 'bg-white/10 hover:bg-white/20'}\`} title="Video">
                 {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
               </button>
               <button onClick={() => setIsAslActive(!isAslActive)} className={\`p-3 rounded-full transition-colors \${isAslActive ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/10 hover:bg-white/20'}\`} title="Toggle ASL">
                 <Sparkles className="w-5 h-5" />
               </button>
               <div className="w-px h-8 bg-white/10 mx-2" />
               <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Share Screen">
                 <Monitor className="w-5 h-5" />
               </button>
               <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={\`p-3 rounded-full transition-colors \${isSidebarOpen ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'}\`} title="Chat">
                 <MessageSquare className="w-5 h-5" />
               </button>
               <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Settings">
                 <Settings className="w-5 h-5" />
               </button>
               <div className="w-px h-8 bg-white/10 mx-2" />
               <button onClick={mode === 'call' ? handleLeaveRoom : handleStop} className="px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]" title="Leave">
                 <PhoneOff className="w-4 h-4" /> Leave
               </button>
            </div>

          </div>

          {/* RIGHT SIDEBAR */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }} animate={{ width: 380, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex flex-col overflow-hidden shrink-0 z-20"
              >
                {/* Tabs */}
                <div className="flex p-2 bg-black/20">
                  <button onClick={() => setSidebarTab('transcript')} className={\`flex-1 py-2 text-sm font-medium rounded-xl transition-all \${sidebarTab === 'transcript' ? 'bg-white/10 shadow-sm' : 'text-gray-400 hover:text-white'}\`}>Transcript</button>
                  <button onClick={() => setSidebarTab('chat')} className={\`flex-1 py-2 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 \${sidebarTab === 'chat' ? 'bg-white/10 shadow-sm' : 'text-gray-400 hover:text-white'}\`}>
                    Chat <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">2</span>
                  </button>
                </div>

                {/* Content area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Confidence Monitor */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                     <ConfidenceRing pct={pct} hasHand={!!prediction?.hand_detected} />
                     <div>
                       <p className="text-lg font-bold">{prediction?.hand_detected ? prediction.sign : '—'}</p>
                       <p className="text-xs text-gray-400">{prediction?.hand_detected ? \`Detected · \${prediction.inference_ms ?? '–'}ms\` : 'No hand'}</p>
                     </div>
                  </div>

                  <h3 className="text-sm font-semibold text-gray-300">Conversation</h3>
                  
                  {/* Mock Chat / Transcript */}
                  {mockMessages.map((msg, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className={\`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold \${msg.sender === 'You' ? 'bg-gray-600' : 'bg-indigo-600'}\`}>
                          {msg.sender === 'You' ? 'Me' : msg.sender[0]}
                        </div>
                        <span className="text-sm font-medium">{msg.sender}</span>
                        <span className="text-xs text-gray-500">{msg.time}</span>
                        {msg.isAsl && <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded">ASL</span>}
                      </div>
                      <p className="text-sm text-gray-300 pl-8 leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                  ))}

                  {/* Real-time translated text appending */}
                  {(translatedText || getText()) && (
                     <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-gray-600">Me</div>
                        <span className="text-sm font-medium">{userName || 'You'}</span>
                        <span className="text-xs text-gray-500">Now</span>
                        {isAslActive && <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded">ASL</span>}
                      </div>
                      <p className="text-sm text-gray-300 pl-8 leading-relaxed italic">
                        {getDisplayText() || getText()}
                      </p>
                    </div>
                  )}

                </div>

                {/* Input area */}
                <div className="p-4 bg-black/20 border-t border-white/5">
                  <div className="relative">
                    <input type="text" placeholder="Type to speak or chat..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-500 transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 text-center mt-2 font-mono">Press Enter to send</p>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}
    </div>
  );
}
`;

const newCode = beforeRender + newRender;

fs.writeFileSync('src/pages/Translator.jsx', newCode);
console.log('Successfully wrote new Translator.jsx');
