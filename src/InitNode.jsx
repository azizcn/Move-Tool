import React, { memo, useMemo } from 'react';
import { Handle, Position, useReactFlow, useStore } from 'reactflow';

// Bağlantı durumunu dinleyen kanca
const connectionSelector = (state) => state.connectionNodeId;

const InitNode = ({ id, data, selected }) => {
  const { setNodes, getNode } = useReactFlow();
  
  // --- AKILLI BAĞLANTI MANTIĞI ---
  const connectionNodeId = useStore(connectionSelector);
  
  // Şu an bir kablo çekiliyor mu?
  const isConnecting = !!connectionNodeId;

  // Bu kutu uygun bir hedef mi?
  const isCompatible = useMemo(() => {
    if (!isConnecting) return false;
    
    // Kaynak düğümü bul
    const sourceNode = getNode(connectionNodeId);
    if (!sourceNode) return false;

    // KURAL: Init fonksiyonuna (Witness yerine) sadece bir STRUCT bağlanabilir.
    // Fonksiyon çıktısı (Return val) bağlanamaz.
    return sourceNode.type === 'structNode';
  }, [connectionNodeId, getNode]);

  // Handle (Soket) Stili
  let handleStyle = { background: '#f97316', width: '12px', height: '12px', left: '-14px' }; // Varsayılan Turuncu

  if (isConnecting) {
    if (isCompatible) {
        // UYUMLU: Parlak Yeşil, Büyük
        handleStyle = {
            background: '#10b981', // Yeşil
            width: '16px', height: '16px', left: '-16px',
            borderRadius: '50%', border: '2px solid #fff',
            boxShadow: '0 0 10px #10b981', zIndex: 20
        };
    } else {
        // UYUMSUZ: Gri, Soluk
        handleStyle = {
            background: '#e5e7eb', // Gri
            opacity: 0.3, left: '-14px'
        };
    }
  }

  // --- Diğer İşlemler ---
  const handleChange = (field, value) => {
    setNodes((nds) => nds.map((node) => {
        if (node.id === id) node.data = { ...node.data, [field]: value };
        return node;
      })
    );
  };

  const onDelete = (evt) => {
    evt.stopPropagation();
    if(confirm("Başlangıç ayarlarını siliyor musun abim?")) {
        setNodes((nodes) => nodes.filter((n) => n.id !== id));
    }
  };

  return (
    <div style={{
      background: '#fffbeb', border: selected ? '2px solid #f59e0b' : '1px solid #d97706',
      borderRadius: '12px', minWidth: '250px',
      // Bağlantı uyumluysa kutunun kendisi de hafif parlasın
      boxShadow: (isConnecting && isCompatible) 
        ? '0 0 15px rgba(16, 185, 129, 0.5)' 
        : (selected ? '0 0 15px rgba(245, 158, 11, 0.5)' : '0 4px 6px rgba(0,0,0,0.1)'),
      fontFamily: 'sans-serif', overflow: 'hidden',
      transition: 'box-shadow 0.2s',
      opacity: (isConnecting && !isCompatible) ? 0.6 : 1 // Uyumsuzsa silikleşsin
    }}>
      
      {/* BAŞLIK */}
      <div style={{ background: '#f59e0b', color: '#fff', padding: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>🏁 Coin Kurulumu (Init)</span>
        {selected && <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>×</button>}
      </div>

      {/* FORM ALANLARI */}
      <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Coin İsmi */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e' }}>Coin İsmi</label>
          <input className="nodrag" type="text" value={data.coinName || ''} onChange={(e) => handleChange('coinName', e.target.value)} placeholder="Örn: Adana Coin" style={{ width: '90%', padding: '5px', border: '1px solid #fcd34d', borderRadius: '4px', fontSize: '12px' }} />
        </div>

        {/* Sembol ve Ondalık */}
        <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e' }}>Sembol</label>
                <input className="nodrag" type="text" value={data.coinSymbol || ''} onChange={(e) => handleChange('coinSymbol', e.target.value)} placeholder="ADN" style={{ width: '80%', padding: '5px', border: '1px solid #fcd34d', borderRadius: '4px', fontSize: '12px' }} />
            </div>
            <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e' }}>Ondalık</label>
                <input className="nodrag" type="number" value={data.coinDecimals || 9} onChange={(e) => handleChange('coinDecimals', e.target.value)} style={{ width: '80%', padding: '5px', border: '1px solid #fcd34d', borderRadius: '4px', fontSize: '12px' }} />
            </div>
        </div>

        {/* Açıklama */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e' }}>Açıklama</label>
          <textarea className="nodrag" rows="2" value={data.coinDescription || ''} onChange={(e) => handleChange('coinDescription', e.target.value)} placeholder="En acılı coin..." style={{ width: '90%', padding: '5px', border: '1px solid #fcd34d', borderRadius: '4px', fontSize: '12px', resize: 'none' }} />
        </div>

        {/* WITNESS GİRİŞİ (PARLAYAN KISIM) */}
        <div style={{ marginTop: '10px', padding: '8px', background: '#fff7ed', borderRadius: '6px', border: '1px dashed #f97316', position: 'relative' }}>
            <span style={{ fontSize: '11px', color: '#c2410c', fontWeight: 'bold' }}>👈 Witness (Ruh) Bağla</span>
            
            {/* SOKET */}
            <Handle 
                type="target" 
                position={Position.Left} 
                id="witness-input" 
                style={handleStyle} // <--- Dinamik stil burada!
            />
        </div>

      </div>
    </div>
  );
};

export default memo(InitNode);