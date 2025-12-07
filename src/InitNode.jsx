import React, { memo, useMemo } from 'react';
import { Handle, Position, useReactFlow, useStore } from 'reactflow';

const connectionSelector = (state) => state.connectionNodeId;

const InitNode = ({ id, data, selected }) => {
  const { setNodes, getNode } = useReactFlow();
  const connectionNodeId = useStore(connectionSelector);
  const isConnecting = !!connectionNodeId;

  // Sadece Struct bağlanabilir
  const isCompatible = useMemo(() => {
    if (!isConnecting) return false;
    const sourceNode = getNode(connectionNodeId);
    return sourceNode && sourceNode.type === 'structNode';
  }, [connectionNodeId, getNode, isConnecting]);

  // Soket Rengi
  let handleStyle = { background: '#f97316', width: '14px', height: '14px', left: '-16px' };
  if (isConnecting) {
    handleStyle = isCompatible 
        ? { background: '#10b981', width: '18px', height: '18px', left: '-18px', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 10px #10b981', zIndex: 20 }
        : { background: '#e5e7eb', opacity: 0.3, left: '-14px' };
  }

  const handleChange = (field, value) => {
    setNodes((nds) => nds.map((node) => {
        if (node.id === id) node.data = { ...node.data, [field]: value };
        return node;
      })
    );
  };

  const onDelete = (evt) => {
    evt.stopPropagation();
    if(confirm("Başlangıç ayarlarını siliyor musun?")) {
        setNodes((nodes) => nodes.filter((n) => n.id !== id));
    }
  };

  return (
    <div style={{
      background: '#fffbeb', border: selected ? '2px solid #f59e0b' : '1px solid #d97706',
      borderRadius: '12px', minWidth: '260px',
      boxShadow: selected ? '0 0 15px rgba(245, 158, 11, 0.5)' : '0 4px 6px rgba(0,0,0,0.1)',
      fontFamily: 'sans-serif', overflow: 'hidden'
    }}>
      {/* Başlık */}
      <div style={{ background: '#f59e0b', color: '#fff', padding: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>🏁 Coin Kurulumu</span>
        {selected && <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>×</button>}
      </div>

      {/* Form */}
      <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e', display: 'block', marginBottom: '2px' }}>Coin İsmi</label>
          <input className="nodrag" type="text" value={data.coinName || ''} onChange={(e) => handleChange('coinName', e.target.value)} placeholder="Adana Coin" style={{ width: '90%', padding: '6px', border: '1px solid #fcd34d', borderRadius: '4px', fontSize: '12px' }} />
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e', display: 'block', marginBottom: '2px' }}>Sembol</label>
                <input className="nodrag" type="text" value={data.coinSymbol || ''} onChange={(e) => handleChange('coinSymbol', e.target.value)} placeholder="ADN" style={{ width: '100%', padding: '6px', border: '1px solid #fcd34d', borderRadius: '4px', fontSize: '12px' }} />
            </div>
            <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e', display: 'block', marginBottom: '2px' }}>Ondalık</label>
                <input className="nodrag" type="number" value={data.coinDecimals || 9} onChange={(e) => handleChange('coinDecimals', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #fcd34d', borderRadius: '4px', fontSize: '12px' }} />
            </div>
        </div>

        {/* Witness Bağlantı Noktası */}
        <div style={{ marginTop: '10px', padding: '10px', background: '#fff7ed', borderRadius: '6px', border: '1px dashed #f97316', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Handle type="target" position={Position.Left} id="witness-input" style={handleStyle} />
            <span style={{ fontSize: '11px', color: '#c2410c', fontWeight: 'bold', marginLeft: '5px' }}>👈 Witness (Ruh) Bağla</span>
        </div>
      </div>
    </div>
  );
};

export default memo(InitNode);