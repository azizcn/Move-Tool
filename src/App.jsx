import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import ReactFlow, {
    MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Panel, useReactFlow, ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

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

// 💥 GEMINI İÇİN GÜVENLİ ANAHTAR ALIMI 💥
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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
        id: 'module-root', 
        type: 'default', 
        position: { x: -100, y: -100 },
        data: { label: 'my_coin', type: 'moduleName' }, 
        hidden: true, 
    }
];

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
    
    const [pendingNode, setPendingNode] = useState(null);
    const [toastMsg, setToastMsg] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false); 

    const nodeTypes = useMemo(() => nodeTypesRaw, []);
    const edgeTypes = useMemo(() => edgeTypesRaw, []);

    const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };

    // --- 🔥 GEMINI KOD OKUMA FONKSİYONU ---
    const handleCodeImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!GEMINI_API_KEY) {
            alert("🚨 HATA: Gemini API Anahtarı bulunamadı! Vercel'de 'VITE_GEMINI_API_KEY' ayarlı mı?");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const code = ev.target.result;
            setIsAiLoading(true);
            showToast("🤖 Gemini kodu inceliyor...");

            try {
                const prompt = `
            You are an expert in Sui Move and React Flow visualization. Analyze the following Move code and convert it into a valid JSON structure for a React Flow graph.
            
            CODE:
            ${code}

            RULES:
            1. Return ONLY valid JSON. No markdown (\`\`\`), no explanations.
            2. Identify 'struct' definitions -> type='structNode'.
            3. Identify 'fun' definitions (ignore 'init') -> type='functionNode'.
            4. Always create 'TreasuryCap' or 'Coin' nodes if used in functions.
            5. Analyze parameters to create edges.
            6. Layout: Structs on x:100, Functions on x:600.
            `;

                // Google Gemini API Çağrısı
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });

                if (!response.ok) {
                    const errorResult = await response.json();
                    throw new Error(`API Hatası: ${errorResult.error?.message || response.statusText}`);
                }

                const result = await response.json();
                
                if (!result.candidates || !result.candidates[0].content) {
                    throw new Error("AI cevap döndüremedi.");
                }
                
                let textResponse = result.candidates[0].content.parts[0].text;
                textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                
                const parsedData = JSON.parse(textResponse);
                const autoEdges = createEdgesFromNodes(parsedData.nodes);
                const finalEdges = [...parsedData.edges, ...autoEdges];

                if (parsedData.nodes && parsedData.nodes.length > 0) {
                    if(confirm(`🤖 Gemini: "${parsedData.nodes.length} yapı buldum."\nİçe aktarılsın mı?`)) {
                        setNodes(parsedData.nodes);
                        setEdges(finalEdges); 
                        showToast("✅ Sahne kuruldu!");
                    }
                } else {
                    alert("AI, kodda beklenen yapıları bulamadı.");
                }

            } catch (err) {
                console.error("AI Hatası:", err);
                alert("🚨 HATA: " + err.message);
            } finally {
                setIsAiLoading(false);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };
    
    // --- DİĞER FONKSİYONLAR (Aynı) ---
    const syncCurrentModule = () => { 
        const cn = reactFlowInstance.getNodes(); 
        const ce = reactFlowInstance.getEdges(); 
        setModules(p => p.map(m => m.id === activeModuleId ? { ...m, nodes: cn, edges: ce } : m)); 
    };
    const clearCanvas = () => {
        if (!confirm("⚠️ SAHNEYİ SİLMEK ÜZERESİN.")) return;
        setModules(p => p.map(m => m.id === activeModuleId ? { ...m, nodes: initialNodes, edges: [] } : m)); 
        setNodes(initialNodes);
        setEdges([]);
        showToast("🧹 Sahne Temizlendi.");
    };
    const switchModule = (tid) => { 
        if (tid === activeModuleId) return; 
        syncCurrentModule(); 
        const tm = modules.find(m => m.id === tid); 
        if (tm) { setNodes(tm.nodes || initialNodes); setEdges(tm.edges || []); setActiveModuleId(tid); } 
    };
    const addNewModule = () => { 
        syncCurrentModule(); 
        const nid = `mod-${Date.now()}`; 
        setModules(p => [...p, { id: nid, name: `module_${modules.length + 1}`, nodes: initialNodes, edges: [] }]); 
        setNodes(initialNodes); setEdges([]); setActiveModuleId(nid); 
    };
    const renameModule = (id, nn) => setModules(p => p.map(m => m.id === id ? { ...m, name: nn } : m));
    const deleteModule = (mid) => { 
        if (modules.length <= 1) return; if (!confirm("Sil?")) return; 
        const nm = modules.filter(m => m.id !== mid); setModules(nm); 
        if (activeModuleId === mid) { setActiveModuleId(nm[0].id); setNodes(nm[0].nodes || initialNodes); setEdges(nm[0].edges || []); } 
    };
    const saveProject = () => { 
        const cn = reactFlowInstance.getNodes(); const ce = reactFlowInstance.getEdges(); 
        const fm = modules.map(m => m.id === activeModuleId ? { ...m, nodes: cn, edges: ce } : m); 
        const b = new Blob([JSON.stringify({ version: "1.0", modules: fm }, null, 2)], { type: 'application/json' }); 
        const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `move_project.json`; a.click(); 
        showToast("💾 Kaydedildi."); 
    };
    const loadProject = (e) => { 
        const f = e.target.files[0]; if (!f) return; const r = new FileReader(); 
        r.onload = (ev) => { try { const d = JSON.parse(ev.target.result); if (!d.modules) return; setModules(d.modules); setActiveModuleId(d.modules[0].id); setNodes(d.modules[0].nodes || initialNodes); setEdges(d.modules[0].edges || []); showToast("📂 Yüklendi."); } catch (err) { alert("Hata."); } }; 
        r.readAsText(f); 
    };
    const handleExport = () => { 
        const cm = modules.find(m => m.id === activeModuleId); 
        const c = generateMoveCode(cm.name, nodes, edges); 
        const t = generateMoveToml(cm.name); 
        setGeneratedCode(c); setGeneratedToml(t); setShowCode(true); 
    }; 

    const addStruct = useCallback(() => setNodes(n => n.concat({ id: getId('s'), type: 'structNode', position: { x: 300, y: 100 }, data: { label: 'NewStruct', customTitle: 'Yeni Veri 📦', fields: [{ name: 'id', type: 'UID' }], abilities: { key: true, store: true, drop: false, copy: false } } })), [setNodes]);
    const addFunction = useCallback(() => setNodes(n => n.concat({ id: getId('f'), type: 'functionNode', position: { x: 500, y: 100 }, data: { label: 'new_action', customTitle: 'Yeni İşlem ⚡', params: [{ name: 'ctx', type: '&mut TxContext' }] } })), [setNodes]);
    const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);
    
    const onDrop = useCallback((event) => {
        event.preventDefault(); const dataString = event.dataTransfer.getData('text/plain'); if (!dataString) return;
        try { const payload = JSON.parse(dataString); const position = reactFlowInstance.project({ x: event.clientX - wrapperRef.current.getBoundingClientRect().left, y: event.clientY - wrapperRef.current.getBoundingClientRect().top });
            if (payload.type === 'template') { setNodes(payload.data.nodes); setEdges(payload.data.edges); showToast("✅ Hazır şablon yüklendi!"); return; }
            const newNode = { id: getId(payload.type === 'structNode' ? 's' : 'f'), type: payload.type, position, data: payload.data }; setNodes((nds) => nds.concat(newNode));
        } catch (e) { showToast("⚠️ Hata!"); }
    }, [reactFlowInstance, setNodes, setEdges]);
    
    const onSidebarSelect = useCallback(() => { showToast("⚠️ Sidebar'dan ekleme özelliği devre dışı. Lütfen sağ üstteki butonları kullanın."); }, [showToast]);
    const onPaneClick = useCallback((event) => { if (!pendingNode) return; const position = reactFlowInstance.project({ x: event.clientX, y: event.clientY - 40 }); const newNode = { id: getId(pendingNode.type === 'structNode' ? 's' : 'f'), type: pendingNode.type, position, data: pendingNode.data }; setNodes((nds) => nds.concat(newNode)); setPendingNode(null); document.body.style.cursor = 'default'; }, [reactFlowInstance, pendingNode, setNodes]);

    const createEdgesFromNodes = useCallback((nodes) => {
        const newEdges = [];
        const getStructs = (l) => nodes.filter(n => n.type === 'structNode' && n.data.label === l);
        const getFuncs = (l) => nodes.filter(n => n.type === 'functionNode' && n.data.label === l);
        const mintFuncs = getFuncs('coin::mint'); const transferFuncs = getFuncs('transfer::transfer'); const treasuryCaps = getStructs('TreasuryCap');
        mintFuncs.forEach(m => { if (treasuryCaps.length) newEdges.push({ id: `e-${treasuryCaps[0].id}-${m.id}-cap`, source: treasuryCaps[0].id, sourceHandle: 'obj-main', target: m.id, targetHandle: 'param-0', type: 'buttonEdge', animated: true, data: { path: 'smoothstep' }, style: { stroke: getEdgeColor('&mut TreasuryCap'), strokeWidth: 2 } }); });
        mintFuncs.forEach(m => transferFuncs.forEach(t => newEdges.push({ id: `e-${m.id}-${t.id}-flow`, source: m.id, sourceHandle: 'return-val', target: t.id, targetHandle: 'param-0', type: 'buttonEdge', animated: true, data: { path: 'smoothstep' }, style: { stroke: getEdgeColor('Coin'), strokeWidth: 2 } })));
        getFuncs('nft::mint').forEach(n => transferFuncs.forEach(t => newEdges.push({ id: `e-${n.id}-${t.id}-nftflow`, source: n.id, sourceHandle: 'return-val', target: t.id, targetHandle: 'param-0', type: 'buttonEdge', animated: true, data: { path: 'smoothstep' }, style: { stroke: getEdgeColor('SimpleNFT'), strokeWidth: 2 } })));
        return newEdges;
    }, [nodes]);

    const onConnect = useCallback((params) => { const sourceNode = reactFlowInstance.getNode(params.source); let dataType = 'unknown'; if (sourceNode) { if (params.sourceHandle === 'obj-main') dataType = sourceNode.data.label; else if (params.sourceHandle === 'return-val') dataType = 'FunctionResult'; else if (params.sourceHandle?.startsWith('field-')) { const idx = parseInt(params.sourceHandle.split('-')[1]); if (sourceNode.data.fields?.[idx]) dataType = sourceNode.data.fields[idx].type; } } setEdges((eds) => addEdge({ ...params, type: 'buttonEdge', animated: true, data: { path: 'smoothstep' }, style: { stroke: getEdgeColor(dataType), strokeWidth: 2 } }, eds)); }, [reactFlowInstance, setEdges]);
    const btnStyle = (bg) => ({ background: bg, color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' });

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={loadProject} />
            <input type="file" ref={codeInputRef} style={{ display: 'none' }} accept=".move" onChange={handleCodeImport} />
            <div style={{ flexShrink: 0 }}><ModuleTabs modules={modules} activeModuleId={activeModuleId} onSwitch={switchModule} onAdd={addNewModule} onRename={renameModule} onDelete={deleteModule} /></div>
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                {isSidebarOpen && <Sidebar onClose={() => setSidebarOpen(false)} onSelect={onSidebarSelect} />}
                <div className="reactflow-wrapper" ref={wrapperRef} style={{ flex: 1, height: '100%', position: 'relative' }} onDragOver={onDragOver} onDrop={onDrop}>
                    <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} edgeTypes={edgeTypes} isValidConnection={() => true} 
                        onNodeDoubleClick={(e, node) => { e.preventDefault(); e.stopPropagation(); if (['module-root', 'structNode', 'functionNode', 'initNode'].includes(node.type) || node.id === 'module-root') setEditingNode(node); }} onPaneClick={onPaneClick} fitView>
                        <Controls /><MiniMap style={{ height: 100, width: 150 }} /><Background variant="dots" gap={12} size={1} />
                        <Panel position="top-right" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '10px' }}>
                            <div id="file-btns" style={{ display: 'flex', gap: '5px' }}> <button onClick={() => fileInputRef.current.click()} style={{...btnStyle('#334155')}} title="Proje Aç">📂</button> <button onClick={saveProject} style={{...btnStyle('#334155')}} title="Kaydet">💾</button> <button onClick={() => codeInputRef.current.click()} style={{...btnStyle('#6366f1')}} title="Kod Oku">📥 Kod (AI)</button> <button onClick={clearCanvas} style={btnStyle('#ef4444')} title="Sahneyi Temizle">🧹</button> </div>
                            <div id="manual-btns" style={{ display: 'flex', gap: '5px' }}> <button onClick={addStruct} style={btnStyle('#3b82f6')}>+ Struct</button> <button onClick={addFunction} style={btnStyle('#8b5cf6')}>+ Fonksiyon</button> </div>
                            <button onClick={handleExport} style={btnStyle('#10b981')}>🚀 Export</button>
                        </Panel>
                        <Panel position="top-left" style={{ padding: '10px' }}> {!isSidebarOpen && <button onClick={() => setSidebarOpen(true)} style={btnStyle('#334155')}>🛠️ Menü</button>} </Panel>
                    </ReactFlow>
                </div>
            </div>
            {toastMsg && <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 999999, background: 'var(--item-bg)', color: 'var(--text-color)', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', fontSize: '14px', fontWeight: 'bold', borderLeft: '5px solid #3b82f6', animation: 'fadeIn 0.3s ease-in-out' }}>{toastMsg}</div>}
            {editingNode && <EditModal node={editingNode} onSave={(u) => { setNodes(n => n.map(x => x.id === u.id ? u : x)); setEditingNode(null); }} onDelete={(id) => { setNodes(n => n.filter(x => x.id !== id)); setEditingNode(null); }} onCancel={() => setEditingNode(null)} />}
            {showCode && <CodeModal code={generatedCode} toml={generatedToml} onClose={() => setShowCode(false)} onToast={showToast} />}
            <ThemeToggle />
        </div>
    );
}
export default function App() { return <ReactFlowProvider><MoveSketchBuilder /></ReactFlowProvider>; }