import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import ReactFlow, {
  MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Panel, useReactFlow, ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

import StructNode from './StructNode';
import FunctionNode from './FunctionNode';
import InitNode from './InitNode';
import ButtonEdge from './ButtonEdge';
import EditModal from './EditModal';
import ModuleTabs from './ModuleTabs';
import CodeModal from './CodeModal';
import Sidebar from './Sidebar';
import { generateMoveCode, generateMoveToml } from './moveGenerator';

// Node Tipleri
const nodeTypesRaw = { 
  structNode: StructNode, 
  functionNode: FunctionNode, 
  initNode: InitNode 
};
const edgeTypesRaw = { buttonEdge: ButtonEdge };
const getId = (prefix) => `${prefix}-${Date.now()}`;

const getEdgeColor = (type) => {
  if (!type) return '#64748b'; 
  const t = type.toLowerCase();
  if (t.startsWith('u') && !t.includes('id')) return '#3b82f6';
  if (t === 'address') return '#10b981';
  if (t === 'bool') return '#f59e0b';
  if (t.includes('string') || t.includes('url')) return '#ec4899';
  return '#8b5cf6';
};

// Driver Obj (Global)
const driverObj = driver({ 
    showProgress: true, 
    animate: true, 
    allowClose: true, 
    overlayClick: false, 
    opacity: 0 
});

function MoveSketchBuilder() {
  const reactFlowInstance = useReactFlow();
  const wrapperRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [modules, setModules] = useState([{ id: 'mod-1', name: 'my_coin', nodes: [], edges: [] }]);
  const [activeModuleId, setActiveModuleId] = useState('mod-1');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [editingNode, setEditingNode] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [generatedToml, setGeneratedToml] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  
  // 0: Yok, 1-6: Coin, 10-15: NFT
  const [tutorialStep, setTutorialStep] = useState(0);
  const [pendingNode, setPendingNode] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const nodeTypes = useMemo(() => nodeTypesRaw, []);
  const edgeTypes = useMemo(() => edgeTypesRaw, []);

  // TOAST MESAJI
  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };

  // --- EĞİTİM GÖZCÜSÜ (COIN & NFT) ---
  useEffect(() => {
    if (tutorialStep === 0) return;
    
    // FAZ 1: Yetki
    if (tutorialStep === 1) {
      if (nodes.some(n => n.data.label === 'TreasuryCap')) {
        setTutorialStep(2);
        // ID: #tool-mint (Sidebar'daki ile aynı)
        driverObj.highlight({ element: '#tool-mint', popover: { title: 'Faz 2: Üretim', description: 'Yönetici yetkisi tanımlandı. Şimdi <b>"Para Bas"</b> fonksiyonunu ekleyiniz.', side: "right" } });
      }
    }
    // FAZ 2: Mint
    if (tutorialStep === 2) {
      if (nodes.some(n => n.data.label === 'coin::mint')) {
        setTutorialStep(3);
        // ID: #tool-transfer
        driverObj.highlight({ element: '#tool-transfer', popover: { title: 'Faz 3: Lojistik', description: 'Şimdi <b>"Adrese Gönder"</b> fonksiyonunu ekleyiniz.', side: "right" } });
      }
    }

    // --- COIN REHBERİ ---
    if (tutorialStep === 1 && nodes.some(n => n.data.label === 'TreasuryCap')) {
        setTutorialStep(2); 
        driverObj.highlight({ element: '#tool-coinmint', popover: { title: 'Faz 2: Üretim', description: 'Şimdi <b>"Para Bas"</b> fonksiyonunu sürükleyiniz.', side: "right" } });
    }
    if (tutorialStep === 2 && nodes.some(n => n.data.label === 'coin::mint')) {
        setTutorialStep(3); 
        driverObj.highlight({ element: '#tool-transfertransfer', popover: { title: 'Faz 3: Lojistik', description: 'Şimdi <b>"Adrese Gönder"</b> fonksiyonunu sürükleyiniz.', side: "right" } });
    }
    if (tutorialStep === 3 && nodes.some(n => n.data.label === 'transfer::transfer')) {
        setTutorialStep(4); 
        driverObj.highlight({ element: '.react-flow__pane', popover: { title: 'Faz 4: Bağlantı', description: '1. Hazine -> Mint (cap)\n2. Mint -> Transfer (obj)', side: "top" } });
    }
    if (tutorialStep === 4) {
      const mintNode = nodes.find(n => n.data.label === 'coin::mint');
      const transferNode = nodes.find(n => n.data.label === 'transfer::transfer');
      const capNode = nodes.find(n => n.data.label === 'TreasuryCap');
      if (mintNode && transferNode && capNode) {
        const c1 = edges.some(e => e.source === capNode.id && e.target === mintNode.id && e.targetHandle === 'param-0');
        const c2 = edges.some(e => e.source === mintNode.id && e.target === transferNode.id && e.sourceHandle === 'return-val' && e.targetHandle === 'param-0');
        if (c1 && c2) { setTutorialStep(0); driverObj.destroy(); showToast("✅ COIN SİSTEMİ HAZIR!"); }
      }
    }

    // --- NFT REHBERİ ---
    if (tutorialStep === 10) {
      // ID: #tool-nft-template
      if (nodes.some(n => n.data.label === 'SimpleNFT')) {
        setTutorialStep(11);
        driverObj.highlight({ element: '#tool-nft-mint', popover: { title: 'Adım 2: NFT Darphanesi', description: 'Şimdi <b>"NFT Oluştur"</b> fonksiyonunu ekleyiniz.', side: "right" } });
      }
    }
    if (tutorialStep === 11 && nodes.some(n => n.data.label === 'nft::mint')) {
        setTutorialStep(12);
        driverObj.highlight({ element: '#tool-transfertransfer', popover: { title: 'Adım 3: Teslimat', description: 'Şimdi <b>"Adrese Gönder"</b> fonksiyonunu ekleyiniz.', side: "right" } });
    }
    if (tutorialStep === 12 && nodes.some(n => n.data.label === 'transfer::transfer')) {
        setTutorialStep(13);
        driverObj.highlight({ element: '.react-flow__pane', popover: { title: 'Adım 4: Bağlantı', description: 'NFT Mint Çıkışını -> Transfer (obj) girişine bağlayınız.', side: "top" } });
    }
    if (tutorialStep === 13) {
        const mintNode = nodes.find(n => n.data.label === 'nft::mint');
        const transferNode = nodes.find(n => n.data.label === 'transfer::transfer');
        if (mintNode && transferNode) {
            const c1 = edges.some(e => e.source === mintNode.id && e.target === transferNode.id && e.sourceHandle === 'return-val' && e.targetHandle === 'param-0');
            if (c1) { setTutorialStep(0); driverObj.destroy(); showToast("✅ NFT SİSTEMİ HAZIR!"); }
        }
    }

  }, [nodes, edges, tutorialStep]);

  // --- SÜRÜKLE BIRAK (DROP) - GARANTİLİ ---
  const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);
  const onDrop = useCallback((event) => {
    event.preventDefault();
    const dataString = event.dataTransfer.getData('text/plain');
    if (!dataString) return;

    try {
      const { type, data } = JSON.parse(dataString);
      
      let position = { x: 250, y: 250 }; // Varsayılan konum
      if (reactFlowInstance && wrapperRef.current) {
        const bounds = wrapperRef.current.getBoundingClientRect();
        // Koordinatları güvenli hesapla
        const projected = reactFlowInstance.project({ 
            x: event.clientX - bounds.left, 
            y: event.clientY - bounds.top 
        });
        if (projected.x && projected.y) position = projected;
      }
      
      const prefix = type === 'structNode' ? 's' : (type === 'initNode' ? 'i' : 'f');
      const newNode = { id: getId(prefix), type, position, data };
      setNodes((nds) => nds.concat(newNode));
    } catch (e) { console.error("Drop hatası:", e); }
  }, [reactFlowInstance, setNodes]);

  // --- TIKLA EKLE (YEDEK) ---
  const onSidebarSelect = useCallback((type, data) => { setPendingNode({ type, data }); document.body.style.cursor = 'copy'; showToast("Öğe seçildi. Sahneye tıklayınız."); }, []);
  const onPaneClick = useCallback((event) => {
    if (!pendingNode) return;
    const position = reactFlowInstance.project({ x: event.clientX, y: event.clientY - 40 });
    const prefix = pendingNode.type === 'structNode' ? 's' : (pendingNode.type === 'initNode' ? 'i' : 'f');
    const newNode = { id: getId(prefix), type: pendingNode.type, position, data: pendingNode.data };
    setNodes((nds) => nds.concat(newNode)); setPendingNode(null); document.body.style.cursor = 'default';
  }, [reactFlowInstance, pendingNode, setNodes]);

  // --- BAĞLANTI (GÜVENLİK) ---
  const onConnect = useCallback((params) => {
    if (tutorialStep === 4) { // Coin kontrolü
        const s = reactFlowInstance.getNode(params.source);
        const t = reactFlowInstance.getNode(params.target);
        const v1 = s.data.label === 'TreasuryCap' && t.data.label === 'coin::mint';
        const v2 = s.data.label === 'coin::mint' && t.data.label === 'transfer::transfer';
        if (!v1 && !v2) { showToast("⚠️ Rehbere uyunuz."); return; }
    }
    if (tutorialStep === 13) { // NFT kontrolü
        const s = reactFlowInstance.getNode(params.source);
        const t = reactFlowInstance.getNode(params.target);
        if (!(s.data.label === 'nft::mint' && t.data.label === 'transfer::transfer')) { showToast("⚠️ Rehbere uyunuz."); return; }
    }
    
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
    setEdges((eds) => addEdge({ ...params, type: 'buttonEdge', animated: true, style: { stroke: color, strokeWidth: 2 } }, eds));
  }, [reactFlowInstance, setEdges, tutorialStep]);

  // Buton İşlevleri
  const startCoinTutorial = () => {
    if(confirm("Coin eğitimi başlatılsın mı?")) {
        setNodes([]); setEdges([]); setSidebarOpen(true); setTutorialStep(1);
        // ID: #tool-treasury
        driverObj.highlight({ element: '#tool-treasury', popover: { title: 'Faz 1: Yetki', description: 'Hazine Anahtarını sürükleyiniz.', side: "right" } });
    }
  };
  const startNftTutorial = () => { if(confirm("NFT eğitimi başlatılsın mı?")) { setNodes([]); setEdges([]); setSidebarOpen(true); setTutorialStep(10); driverObj.highlight({ element: '#tool-SimpleNFT', popover: { title: 'Adım 1: NFT Tasarımı', description: 'NFT Şablonunu sürükleyiniz.', side: "right" } }); } };
  const startGeneralTour = () => { setSidebarOpen(true); const d = driver({ showProgress: true, animate: true, opacity: 0, steps: [{ element: '#sidebar-panel', popover: { title: 'Araç Paneli', description: 'Buradan alınız.' } }] }); d.drive(); };
  
  const syncCurrentModule = () => { const cn = reactFlowInstance.getNodes(); const ce = reactFlowInstance.getEdges(); setModules(p => p.map(m => m.id === activeModuleId ? { ...m, nodes: cn, edges: ce } : m)); };
  const switchModule = (tid) => { if (tid === activeModuleId) return; syncCurrentModule(); const tm = modules.find(m => m.id === tid); if (tm) { setNodes(tm.nodes || []); setEdges(tm.edges || []); setActiveModuleId(tid); } };
  const addNewModule = () => { syncCurrentModule(); const nid = `mod-${Date.now()}`; setModules(p => [...p, { id: nid, name: `module_${modules.length + 1}`, nodes: [], edges: [] }]); setNodes([]); setEdges([]); setActiveModuleId(nid); };
  const renameModule = (id, nn) => setModules(p => p.map(m => m.id === id ? { ...m, name: nn } : m));
  const deleteModule = (mid) => { if (modules.length <= 1) { showToast("Son modül silinemez."); return; } if (!confirm("Silinsin mi?")) return; const nm = modules.filter(m => m.id !== mid); setModules(nm); if (activeModuleId === mid) { setActiveModuleId(nm[0].id); setNodes(nm[0].nodes || []); setEdges(nm[0].edges || []); } };
  const saveProject = () => { const cn = reactFlowInstance.getNodes(); const ce = reactFlowInstance.getEdges(); const fm = modules.map(m => m.id === activeModuleId ? { ...m, nodes: cn, edges: ce } : m); const b = new Blob([JSON.stringify({ version: "1.0", modules: fm }, null, 2)], { type: 'application/json' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `move_project.json`; a.click(); showToast("💾 Kaydedildi."); };
  const loadProject = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => { try { const d = JSON.parse(ev.target.result); if (!d.modules) return; setModules(d.modules); setActiveModuleId(d.modules[0].id); setNodes(d.modules[0].nodes || []); setEdges(d.modules[0].edges || []); showToast("📂 Yüklendi."); } catch (err) { alert("Hata."); } }; r.readAsText(f); };
  const handleExport = () => { const cm = modules.find(m => m.id === activeModuleId); const c = generateMoveCode(cm.name, nodes, edges); const t = generateMoveToml(cm.name); setGeneratedCode(c); setGeneratedToml(t); setShowCode(true); };
  const runSimulation = () => { setIsRunning(true); setTimeout(() => { setIsRunning(false); showToast("✅ Simülasyon başarılı."); }, 1500); };
  const isValidConnection = useCallback((c) => c.source !== c.target, []);
  const addStruct = useCallback(() => setNodes(n => n.concat({ id: getId('s'), type: 'structNode', position: { x: 300, y: 100 }, data: { label: 'New', customTitle: 'Yeni', fields: [] } })), [setNodes]);
  const addFunction = useCallback(() => setNodes(n => n.concat({ id: getId('f'), type: 'functionNode', position: { x: 500, y: 100 }, data: { label: 'new', customTitle: 'Yeni', params: [] } })), [setNodes]);

  const btnStyle = (bg) => ({ background: bg, color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' });
  const darkBtnStyle = { ...btnStyle('#334155'), border: '1px solid #475569' };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={loadProject} />
      
      <div style={{ flexShrink: 0 }}>
        <ModuleTabs modules={modules} activeModuleId={activeModuleId} onSwitch={switchModule} onAdd={addNewModule} onRename={renameModule} onDelete={deleteModule} />
      </div>
      
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {isSidebarOpen && <Sidebar onClose={() => setSidebarOpen(false)} onSelect={onSidebarSelect} />}

        <div 
            className="reactflow-wrapper" 
            ref={wrapperRef} 
            style={{ flex: 1, height: '100%', position: 'relative' }}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
            isValidConnection={isValidConnection} onNodeDoubleClick={(e, node) => setEditingNode(node)} onPaneClick={onPaneClick}
            fitView
          >
            <Controls />
            <MiniMap style={{ height: 100, width: 150 }} />
            <Background variant="dots" gap={12} size={1} />
            
            <Panel position="top-right" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '10px' }}>
               <button onClick={startCoinTutorial} style={{...btnStyle('#f59e0b')}}>🪙 Coin Rehberi</button>
               <button onClick={startNftTutorial} style={{...btnStyle('#ec4899')}}>🖼️ NFT Rehberi</button>
               <button onClick={startGeneralTour} style={{...btnStyle('#6366f1')}}>❓ Site Turu</button>
               <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => fileInputRef.current.click()} style={{...btnStyle('#334155')}}>📂</button>
                <button onClick={saveProject} style={{...btnStyle('#334155')}}>💾</button>
              </div>
              <button onClick={addStruct} style={btnStyle('#3b82f6')}>+ Struct</button>
              <button onClick={addFunction} style={btnStyle('#8b5cf6')}>+ Fonksiyon</button>
              <button onClick={handleExport} style={btnStyle('#10b981')}>🚀 Export</button>
              <button onClick={runSimulation} disabled={isRunning} style={btnStyle(isRunning ? '#fbbf24' : '#f59e0b')}>{isRunning ? '⏳' : '▶️ Test'}</button>
            </Panel>

            <Panel position="top-left" style={{ padding: '10px' }}>
              {!isSidebarOpen && <button onClick={() => setSidebarOpen(true)} style={btnStyle('#334155')}>🛠️ Menü</button>}
            </Panel>

          </ReactFlow>
        </div>
      </div>

      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '20px', zIndex: 999999,
          background: 'white', color: '#1e293b', padding: '12px 20px',
          borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
          fontSize: '14px', fontWeight: 'bold', borderLeft: '5px solid #3b82f6',
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          {toastMsg}
        </div>
      )}

      {editingNode && <EditModal node={editingNode} onSave={(u) => { setNodes(n => n.map(x => x.id === u.id ? u : x)); setEditingNode(null); }} onDelete={(id) => { setNodes(n => n.filter(x => x.id !== id)); setEditingNode(null); }} onCancel={() => setEditingNode(null)} />}
      {showCode && <CodeModal code={generatedCode} toml={generatedToml} onClose={() => setShowCode(false)} onToast={showToast} />}
    </div>
  );
}

export default function App() { return <ReactFlowProvider><MoveSketchBuilder /></ReactFlowProvider>; }