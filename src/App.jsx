import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import ReactFlow, {
    MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Panel, useReactFlow, ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

// Driver.js importları (Rehber için gerekliydi, silindi)

import StructNode from './StructNode';
import FunctionNode from './FunctionNode';
import InitNode from './InitNode';
import ButtonEdge from './ButtonEdge';
import EditModal from './EditModal';
import ModuleTabs from './ModuleTabs';
import CodeModal from './CodeModal';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import { generateMoveCode, generateMoveToml } from './moveGenerator';

// API KEY (Değişken ismi aynı kalmalı)
const GEMINI_API_KEY = "AIzaSyCkljtBkHGNr58hZkHey70hqC-Thd8pEQc"; 

const nodeTypesRaw = { structNode: StructNode, functionNode: FunctionNode, initNode: InitNode };
const edgeTypesRaw = { buttonEdge: ButtonEdge };
const getId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

const getEdgeColor = (type) => {
    if (!type) return '#64748b'; 
    const t = type.toLowerCase();
    if (t.startsWith('u') && !t.includes('id')) return '#3b82f6';
    if (t === 'address') return '#10b981';
    if (t === 'bool') return '#f59e0b';
    if (t.includes('string') || t.includes('url')) return '#ec4899';
    return '#8b5cf6';
};
const initialNodes = [
    {
        id: 'module-root', // KRİTİK ID
        type: 'default', // Veya custom bir type
        position: { x: -100, y: -100 },
        data: { label: 'my_coin', type: 'moduleName' }, // type: moduleName ekledik
        hidden: true, // Sahneden gizle
    }
];
// driverObj kaldırıldı

function MoveSketchBuilder() {
    const reactFlowInstance = useReactFlow();
    const wrapperRef = useRef(null);
    const fileInputRef = useRef(null);
    const codeInputRef = useRef(null);

    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [modules, setModules] = useState([{ id: 'mod-1', name: 'my_coin', nodes: initialNodes, edges: [] }]);
    const [activeModuleId, setActiveModuleId] = useState('mod-1');
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [editingNode, setEditingNode] = useState(null);
    const [showCode, setShowCode] = useState(false);
    const [generatedCode, setGeneratedCode] = useState("");
    const [generatedToml, setGeneratedToml] = useState("");
    
    // Silindi: [isRunning, setIsRunning] state'i silindi.
    
    // Rehber state'i kaldırıldı
    const [pendingNode, setPendingNode] = useState(null);
    const [toastMsg, setToastMsg] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false); 

    const nodeTypes = useMemo(() => nodeTypesRaw, []);
    const edgeTypes = useMemo(() => edgeTypesRaw, []);

    const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };

    // --- REHBER KONTROLLERİ useEffect'i kaldırıldı ---
    
    // --- 🔥 KOD IMPORT FONKSİYONU ---
    const handleCodeImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (GEMINI_API_KEY === "A") {
            alert("🚨 HATA: Lütfen Koda YENİ ve GEÇERLİ API Anahtarınızı yapıştırın!");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const code = ev.target.result;
            setIsAiLoading(true);
            showToast("🤖 Yapay Zeka kodu inceliyor...");

            try {
                const prompt = `
            You are an expert in Sui Move and React Flow visualization. Analyze the following Move code and convert it into a valid JSON structure for a React Flow graph. Your goal is to recreate all necessary content and connections.
            
            CODE:
            ${code}

            RULES:
            1. Identify all 'struct' definitions. For these, set type='structNode'. Extract fields and parameters (name/type) into the 'data.fields' array.
            2. Identify all 'fun' definitions (ignore 'init'). For these, set type='functionNode'. Extract parameters (name/type) into the 'data.params' array.
            3. FRAMEWORK CRITICAL TYPES: If 'TreasuryCap' or 'Coin' is found in any function signature, you MUST create a corresponding node for it (type='structNode') with data.label as the type name, regardless of whether it is defined as a struct in the code.
            4. CONNECTION LOGIC (EDGES): You must analyze parameter types and code flow to infer the data flow.
                - CRITICAL MINT/BURN: For 'coin::mint' or 'coin::burn' functions, the 'TreasuryCap' node must connect to the function node's 'param-0' handle (assuming 'cap' is param 0).
                - Generic Flow: Create an edge from a Struct Node (Source) to a Function Node (Target) if the Function takes that Struct type as a parameter.
            5. Layout: Structs on x:100, Functions on x:600.
            6. Return ONLY raw JSON. Do not include any markdown (like \`\`\`json) or conversational text.
            `;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });

                if (!response.ok) {
                    const errorResult = await response.json();
                    throw new Error(`API Hatası (HTTP ${response.status}): ${errorResult.error?.message || 'Bilinmeyen Hata'}`);
                }

                const result = await response.json();
                
                if (!result.candidates || result.candidates.length === 0 || !result.candidates[0].content || !result.candidates[0].content.parts || result.candidates[0].content.parts.length === 0) {
                    throw new Error("AI, yapılandırılmış bir cevap döndüremedi.");
                }
                
                let textResponse = result.candidates[0].content.parts[0].text;
                
                textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                
                const parsedData = JSON.parse(textResponse);

                // AI'dan gelen veriye otomatik bağlantıları ekle
                const autoEdges = createEdgesFromNodes(parsedData.nodes);
                const finalEdges = [...parsedData.edges, ...autoEdges];

                if (parsedData.nodes && parsedData.nodes.length > 0) {
                    if(confirm(`🤖 AI: "${parsedData.nodes.length} yapı ve ${finalEdges.length} bağlantı buldum."\nİçe aktarılsın mı?`)) {
                        setNodes(parsedData.nodes);
                        setEdges(finalEdges); // Otomatik bağlantılar dahil edildi
                        showToast("✅ AI: Sahne kuruldu!");
                    }
                } else {
                    alert("AI, kodda beklenen yapıları bulamadı.");
                }

            } catch (err) {
                console.error("AI/JSON Hatası:", err);
                alert("🚨 KRİTİK HATA: " + err.message + "\nLütfen API Key'in geçerli olduğundan ve hesap limitini aşmadığınızdan emin olun.");
            } finally {
                setIsAiLoading(false);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };
    
    // --- YÖNETİM FONKSİYONLARI ---
    const syncCurrentModule = () => { 
        const cn = reactFlowInstance.getNodes(); 
        const ce = reactFlowInstance.getEdges(); 
        setModules(p => p.map(m => m.id === activeModuleId ? { ...m, nodes: cn, edges: ce } : m)); 
    };
    const clearCanvas = () => {
        // Emin misin sorusuyla kazaların önüne geçelim
        if (!confirm("⚠️ SAHNEYİ SİLMEK ÜZERESİN. Tüm düğüm ve bağlantıları silmek istediğine emin misin?")) {
            return;
        }

        // 1. Aktif modülün kaydedilmiş verilerini sıfırla
        setModules(p => p.map(m => m.id === activeModuleId ? { ...m, nodes: initialNodes, edges: [] } : m)); 
        
        // 2. Sahnede görünen düğüm ve bağlantı state'lerini sıfırla
        setNodes(initialNodes); // Sadece root düğümünü bırak
        setEdges([]);
        
        showToast("🧹 Sahne Temizlendi.");
    };
    const switchModule = (tid) => { 
        if (tid === activeModuleId) return; 
        syncCurrentModule(); 
        const tm = modules.find(m => m.id === tid); 
        if (tm) { 
            setNodes(tm.nodes || initialNodes); // Modül geçişinde initialNodes'u kullan
            setEdges(tm.edges || []); 
            setActiveModuleId(tid); 
        } 
    };
    const addNewModule = () => { 
        syncCurrentModule(); 
        const nid = `mod-${Date.now()}`; 
        // Yeni modül eklerken de initialNodes ile başla
        setModules(p => [...p, { id: nid, name: `module_${modules.length + 1}`, nodes: initialNodes, edges: [] }]); 
        setNodes(initialNodes); 
        setEdges([]); 
        setActiveModuleId(nid); 
    };
    const renameModule = (id, nn) => setModules(p => p.map(m => m.id === id ? { ...m, name: nn } : m));
    const deleteModule = (mid) => { 
        if (modules.length <= 1) { showToast("Son modül silinemez."); return; } 
        if (!confirm("Sil?")) return; 
        const nm = modules.filter(m => m.id !== mid); 
        setModules(nm); 
        if (activeModuleId === mid) { 
            setActiveModuleId(nm[0].id); 
            setNodes(nm[0].nodes || initialNodes); 
            setEdges(nm[0].edges || []); 
        } 
    };
    const saveProject = () => { 
        const cn = reactFlowInstance.getNodes(); 
        const ce = reactFlowInstance.getEdges(); 
        const fm = modules.map(m => m.id === activeModuleId ? { ...m, nodes: cn, edges: ce } : m); 
        const b = new Blob([JSON.stringify({ version: "1.0", modules: fm }, null, 2)], { type: 'application/json' }); 
        const u = URL.createObjectURL(b); 
        const a = document.createElement('a'); 
        a.href = u; 
        a.download = `move_project.json`; 
        a.click(); 
        showToast("💾 Kaydedildi."); 
    };
    const loadProject = (e) => { 
        const f = e.target.files[0]; 
        if (!f) return; 
        const r = new FileReader(); 
        r.onload = (ev) => { 
            try { 
                const d = JSON.parse(ev.target.result); 
                if (!d.modules) return; 
                setModules(d.modules); 
                setActiveModuleId(d.modules[0].id); 
                setNodes(d.modules[0].nodes || initialNodes); 
                setEdges(d.modules[0].edges || []); 
                showToast("📂 Yüklendi."); 
            } catch (err) { alert("Hata."); } 
        }; 
        r.readAsText(f); 
    };
    
const handleExport = () => { 
    const cm = modules.find(m => m.id === activeModuleId); 
    const c = generateMoveCode(cm.name, nodes, edges); 
    const t = generateMoveToml(cm.name); 
    setGeneratedCode(c); 
    setGeneratedToml(t); 
    setShowCode(true); 
}; 

// 🔥 AI SİMÜLASYON FONKSİYONU SİLİNDİ 🔥
// runSimulation fonksiyonu silindi.


    const addStruct = useCallback(() => setNodes(n => n.concat({ 
        id: getId('s'), 
        type: 'structNode', 
        position: { x: 300, y: 100 }, 
        data: { 
            label: 'NewStruct', 
            customTitle: 'Yeni Veri 📦', 
            fields: [{ name: 'id', type: 'UID' }],
            // ABILITIES varsayılan değerlerle eklendi
            abilities: {
                key: true,
                store: true,
                drop: false,
                copy: false,
            }
        } 
    })), [setNodes]);
    const addFunction = useCallback(() => setNodes(n => n.concat({ id: getId('f'), type: 'functionNode', position: { x: 500, y: 100 }, data: { label: 'new_action', customTitle: 'Yeni İşlem ⚡', params: [{ name: 'ctx', type: '&mut TxContext' }] } })), [setNodes]);

    const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);
    
    const onDrop = useCallback((event) => {
        event.preventDefault();
        const dataString = event.dataTransfer.getData('text/plain'); 
        if (!dataString) return;

        try {
            const payload = JSON.parse(dataString);
            const position = reactFlowInstance.project({ 
                x: event.clientX - wrapperRef.current.getBoundingClientRect().left, 
                y: event.clientY - wrapperRef.current.getBoundingClientRect().top
            });
            
            if (payload.type === 'template') {
                setNodes(payload.data.nodes);
                setEdges(payload.data.edges);
                showToast("✅ Hazır şablon yüklendi!");
                return;
            }
            
            const { type, data } = payload;
            const prefix = type === 'structNode' ? 's' : (type === 'initNode' ? 'i' : 'f');
            const newNode = { id: getId(prefix), type, position, data };
            setNodes((nds) => nds.concat(newNode));

        } catch (e) { 
            console.error("Drop hatası:", e); 
            showToast("⚠️ Hatalı veri transferi!");
        }
    }, [reactFlowInstance, setNodes, setEdges]);
    
    // 💥 DÜZELTME: onSidebarSelect ve onPaneClick Mekanizması Devre Dışı
    const onSidebarSelect = useCallback(() => { 
        showToast("⚠️ Sidebar'dan ekleme özelliği devre dışı. Lütfen sağ üstteki butonları kullanın.");
    }, [showToast]);

    const onPaneClick = useCallback((event) => { 
        // pendingNode kontrolü sayesinde onSidebarSelect çalışmadığı sürece bu fonksiyon pasif kalacaktır.
        if (!pendingNode) return; 
        const position = reactFlowInstance.project({ x: event.clientX, y: event.clientY - 40 }); 
        const prefix = pendingNode.type === 'structNode' ? 's' : (pendingNode.type === 'initNode' ? 'i' : 'f'); 
        const newNode = { id: getId(prefix), type: pendingNode.type, position, data: pendingNode.data }; 
        setNodes((nds) => nds.concat(newNode)); setPendingNode(null); 
        document.body.style.cursor = 'default'; 
    }, [reactFlowInstance, pendingNode, setNodes]);
    // 💥 DÜZELTME SONU 💥

    // --- KRİTİK: BAĞLANTI OLUŞTURMA MANTIĞI (SİLME DÜZELTİLDİ) ---
    const createEdgesFromNodes = useCallback((nodes) => {
        const newEdges = [];
        const getStructs = (label) => nodes.filter(n => n.type === 'structNode' && n.data.label === label);
        const getFuncs = (label) => nodes.filter(n => n.type === 'functionNode' && n.data.label === label);

        const mintFuncs = getFuncs('coin::mint');
        const transferFuncs = getFuncs('transfer::transfer');
        const treasuryCaps = getStructs('TreasuryCap');

        // 1. MINT -> TREASURYCAP (Yetkilendirme)
        mintFuncs.forEach(mintNode => {
            if (treasuryCaps.length > 0) {
                const capNode = treasuryCaps[0];
                const type = '&mut TreasuryCap';
                newEdges.push({
                    id: `e-${capNode.id}-${mintNode.id}-cap`,
                    source: capNode.id, sourceHandle: 'obj-main',
                    target: mintNode.id, targetHandle: 'param-0',
                    type: 'buttonEdge', animated: true, 
                    data: { path: 'smoothstep' }, // Silme için gerekli data objesi
                    style: { stroke: getEdgeColor(type), strokeWidth: 2 } 
                });
            }
        });
        
        // 2. MINT -> TRANSFER (Akış)
        mintFuncs.forEach(mintNode => {
            transferFuncs.forEach(transferNode => {
                const type = 'Coin';
                newEdges.push({
                    id: `e-${mintNode.id}-${transferNode.id}-flow`,
                    source: mintNode.id, sourceHandle: 'return-val',
                    target: transferNode.id, targetHandle: 'param-0',
                    type: 'buttonEdge', animated: true, 
                    data: { path: 'smoothstep' }, // Silme için gerekli data objesi
                    style: { stroke: getEdgeColor(type), strokeWidth: 2 }
                });
            });
        });

        // 3. NFT MINT -> TRANSFER (NFT Akışı)
        getFuncs('nft::mint').forEach(nftMintNode => {
            transferFuncs.forEach(transferNode => {
                const type = 'SimpleNFT';
                newEdges.push({
                    id: `e-${nftMintNode.id}-${transferNode.id}-nftflow`,
                    source: nftMintNode.id, sourceHandle: 'return-val',
                    target: transferNode.id, targetHandle: 'param-0',
                    type: 'buttonEdge', animated: true, 
                    data: { path: 'smoothstep' }, // Silme için gerekli data objesi
                    style: { stroke: getEdgeColor(type), strokeWidth: 2 }
                });
            });
        });

        return newEdges;
    }, [nodes]);

    const onConnect = useCallback((params) => {
        // Rehber kontrolü kaldırıldı
        const sourceNode = reactFlowInstance.getNode(params.source);
        let dataType = 'unknown';
        if (sourceNode) {
            if (params.sourceHandle === 'obj-main') dataType = sourceNode.data.label;
            else if (params.sourceHandle === 'return-val') dataType = 'FunctionResult';
            else if (params.sourceHandle?.startsWith('field-')) {
                const idx = parseInt(params.sourceHandle.split('-')[1]);
                if (sourceNode.data.fields?.[idx]) dataType = sourceNode.data.fields[idx].type;
            }
        }
        const color = getEdgeColor(dataType);
        setEdges((eds) => addEdge({ 
            ...params, 
            type: 'buttonEdge', 
            animated: true, 
            data: { path: 'smoothstep' }, // KRİTİK: BURADA YUMUŞAK YOL ZORLANIYOR
            style: { stroke: color, strokeWidth: 2 } 
        }, eds));
    }, [reactFlowInstance, setEdges]);
    
    const btnStyle = (bg) => ({ background: bg, color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' });

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={loadProject} />
            <input type="file" ref={codeInputRef} style={{ display: 'none' }} accept=".move" onChange={handleCodeImport} />
            
            <div style={{ flexShrink: 0 }}>
                <ModuleTabs modules={modules} activeModuleId={activeModuleId} onSwitch={switchModule} onAdd={addNewModule} onRename={renameModule} onDelete={deleteModule} />
            </div>
            
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                
                {isSidebarOpen && <Sidebar onClose={() => setSidebarOpen(false)} onSelect={onSidebarSelect} />}

                <div className="reactflow-wrapper" ref={wrapperRef} style={{ flex: 1, height: '100%', position: 'relative' }} onDragOver={onDragOver} onDrop={onDrop}>
                    <ReactFlow
                nodes={nodes} 
                edges={edges} 
                onNodesChange={onNodesChange} 
                onEdgesChange={onEdgesChange}
                onConnect={onConnect} 
                nodeTypes={nodeTypes} 
                edgeTypes={edgeTypes}
                isValidConnection={() => true} 
                
                // 💥 DÜZELTİLMİŞ BÖLÜM 💥
                onNodeDoubleClick={(e, node) => {
                // Sadece Modül Adı Düğümünü veya yeni eklenen Struct/Function düğümlerini hedefle
                if (
                    node.id === 'module-root' || // <-- Yeni eklenen ID
                    node.type === 'structNode' || // <-- Yeni struct'ları düzenlemek için
                    node.type === 'functionNode' || // <-- Yeni fonksiyonları düzenlemek için
                    node.type === 'initNode' // <-- init düğümlerini düzenlemek için
                ) {
                    console.log("Düzenleme Tetiklendi:", node.id); 
                    setEditingNode(node);
                }
            }}
                
                onPaneClick={onPaneClick}
                fitView
            >
                        <Controls /><MiniMap style={{ height: 100, width: 150 }} /><Background variant="dots" gap={12} size={1} />
                        
                        {/* --- BUTONLAR --- */}
                        <Panel position="top-right" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '10px' }}>
                            {/* Rehber butonları kaldırıldı */}
                            
                            <div id="file-btns" style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => fileInputRef.current.click()} style={{...btnStyle('#334155')}} title="Proje Aç">📂</button>
                            <button onClick={saveProject} style={{...btnStyle('#334155')}} title="Kaydet">💾</button>
                            <button onClick={() => codeInputRef.current.click()} style={{...btnStyle('#6366f1')}} title="Kod Oku">📥 Kod (AI)</button>
                            {/* 💥 TEMİZLEME BUTONU 💥 */}
                            <button onClick={clearCanvas} style={btnStyle('#ef4444')} title="Sahneyi Temizle">🧹</button>
                            </div>

                            <div id="manual-btns" style={{ display: 'flex', gap: '5px' }}>
                                <button onClick={addStruct} style={btnStyle('#3b82f6')}>+ Struct</button>
                                <button onClick={addFunction} style={btnStyle('#8b5cf6')}>+ Fonksiyon</button>
                            </div>

                            <button onClick={handleExport} style={btnStyle('#10b981')}>🚀 Export</button>
                            {/* SİLİNDİ: <button onClick={runSimulation} disabled={isRunning} style={btnStyle(isRunning ? '#fbbf24' : '#f59e0b')}>{isRunning ? '⏳' : '▶️ Test'}</button> */}
                        </Panel>
                        
                        <Panel position="top-left" style={{ padding: '10px' }}>
                            {!isSidebarOpen && <button onClick={() => setSidebarOpen(true)} style={btnStyle('#334155')}>🛠️ Menü</button>}
                        </Panel>

                    </ReactFlow>
                </div>
            </div>
            {/* Modallar, Toast, vs. */}
            {toastMsg && (
                <div style={{ 
                    position: 'fixed', bottom: '20px', left: '20px', zIndex: 999999, 
                    background: 'var(--item-bg)', 
                    color: 'var(--text-color)', 
                    padding: '12px 20px', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)', 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    borderLeft: '5px solid #3b82f6', 
                    animation: 'fadeIn 0.3s ease-in-out' 
                }}>
                    {toastMsg}
                </div>
            )}
            {editingNode && <EditModal node={editingNode} onSave={(u) => { setNodes(n => n.map(x => x.id === u.id ? u : x)); setEditingNode(null); }} onDelete={(id) => { setNodes(n => n.filter(x => x.id !== id)); setEditingNode(null); }} onCancel={() => setEditingNode(null)} />}
            {showCode && <CodeModal code={generatedCode} toml={generatedToml} onClose={() => setShowCode(false)} onToast={showToast} />}
            <ThemeToggle />
        </div>
    );
}

export default function App() { return <ReactFlowProvider><MoveSketchBuilder /></ReactFlowProvider>; }