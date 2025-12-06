import React, { useState } from 'react';

export default function Sidebar({ onClose, onSelect }) {
  
  const onDragStart = (event, nodeType, templateData) => {
    const payload = JSON.stringify({ type: nodeType, data: templateData });
    event.dataTransfer.setData('text/plain', payload);
    event.dataTransfer.effectAllowed = 'move';
  };

  const HelpIcon = ({ text }) => {
    const [tooltipPos, setTooltipPos] = useState(null);
    const handleMouseEnter = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipPos({ top: rect.top, left: rect.right + 12 }); 
    };

    return (
      <div className="help-container" onMouseEnter={handleMouseEnter} onMouseLeave={() => setTooltipPos(null)} style={{ position: 'absolute', top: '5px', right: '5px', width: '18px', height: '18px', background: '#3b82f6', color: 'white', borderRadius: '50%', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help', zIndex: 50 }}>
        ?
        {tooltipPos && (
          <div style={{ position: 'fixed', top: tooltipPos.top, left: tooltipPos.left, width: '280px', background: '#1e293b', color: '#f1f5f9', padding: '15px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 99999, pointerEvents: 'none', textAlign: 'left', border: '1px solid #475569', fontFamily: 'sans-serif', whiteSpace: 'pre-wrap' }}>
            <div style={{ position: 'absolute', top: '10px', left: '-6px', width: '10px', height: '10px', background: '#1e293b', transform: 'rotate(45deg)', borderLeft: '1px solid #475569', borderBottom: '1px solid #475569' }}></div>{text}
          </div>
        )}
      </div>
    );
  };

  const makeId = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

  const templates = [
    {
      category: 'Proje Başlangıcı',
      items: [
        { 
          toolId: 'tool-init', // <--- SABİT ID
          label: 'Coin Kurulumu 🏁', 
          desc: 'Init Function: Coin projesini başlatır.',
          type: 'initNode', 
          data: { label: 'CoinInit', coinName: '', coinSymbol: '', coinDecimals: 9 } 
        }
      ]
    },
    {
      category: 'Finansal Varlıklar',
      items: [
        { 
          toolId: 'tool-treasury', // <--- SABİT ID
          label: 'Hazine Anahtarı 🔑', 
          desc: 'TreasuryCap: Coin yönetim yetkisi.', 
          type: 'structNode', 
          data: { label: 'TreasuryCap', customTitle: 'Hazine Anahtarı 🔑', isImported: true, fields: [] } 
        },
        { toolId: 'tool-coin', label: 'Jeton (Coin) 🪙', desc: 'Coin: Dijital para.', type: 'structNode', data: { label: 'Coin', customTitle: 'Jeton 🪙', isImported: true, fields: [{ name: 'value', type: 'u64' }] } },
        { toolId: 'tool-balance', label: 'Bakiye (Balance) 💰', desc: 'Balance: Para miktarı.', type: 'structNode', data: { label: 'Balance', customTitle: 'Bakiye 💰', isImported: true, fields: [{ name: 'value', type: 'u64' }] } }
      ]
    },
    {
      category: 'Darphane İşlemleri',
      items: [
        { 
          toolId: 'tool-mint', // <--- SABİT ID
          label: 'Para Bas 🖨️', 
          desc: 'Mint: Yeni coin üretir.', 
          type: 'functionNode', 
          data: { label: 'coin::mint', customTitle: 'Para Bas 🖨️', params: [{ name: 'cap', type: '&mut TreasuryCap' }, { name: 'amount', type: 'u64' }, { name: 'ctx', type: '&mut TxContext' }] } 
        },
        { toolId: 'tool-burn', label: 'Para Yak 🔥', desc: 'Burn: Coini yok eder.', type: 'functionNode', data: { label: 'coin::burn', customTitle: 'Para Yak 🔥', params: [{ name: 'cap', type: '&mut TreasuryCap' }, { name: 'c', type: 'Coin<T>' }] } },
        { toolId: 'tool-join', label: 'Birleştir (Join) 🔗', desc: 'Join: Paraları birleştirir.', type: 'functionNode', data: { label: 'coin::join', customTitle: 'Birleştir 🔗', params: [{ name: 'self', type: '&mut Coin<T>' }, { name: 'c', type: 'Coin<T>' }] } },
        { toolId: 'tool-split', label: 'Ayır (Split) ✂️', desc: 'Split: Parayı böler.', type: 'functionNode', data: { label: 'coin::split', customTitle: 'Ayır ✂️', params: [{ name: 'self', type: '&mut Coin<T>' }, { name: 'split_amount', type: 'u64' }, { name: 'ctx', type: '&mut TxContext' }] } }
      ]
    },
    {
      category: 'Transfer & Paylaşım',
      items: [
        { 
          toolId: 'tool-transfer', // <--- SABİT ID
          label: 'Adrese Gönder 🚚', 
          desc: 'Transfer: Sahiplik devreder.', 
          type: 'functionNode', 
          data: { label: 'transfer::transfer', customTitle: 'Adrese Gönder 🚚', params: [{ name: 'obj', type: 'T' }, { name: 'recipient', type: 'address' }] } 
        },
        { toolId: 'tool-share', label: 'Herkesle Paylaş 📢', desc: 'Share: Herkese açar.', type: 'functionNode', data: { label: 'transfer::share_object', customTitle: 'Herkesle Paylaş 📢', params: [{ name: 'obj', type: 'T' }] } },
        { toolId: 'tool-freeze', label: 'Dondur (Sabitle) ❄️', desc: 'Freeze: Kilitler.', type: 'functionNode', data: { label: 'transfer::freeze_object', customTitle: 'Dondur ❄️', params: [{ name: 'obj', type: 'T' }] } },
        { toolId: 'tool-emit', label: 'Olay Yayınla 🔔', desc: 'Emit: Log atar.', type: 'functionNode', data: { label: 'event::emit', customTitle: 'Olay Yayınla 🔔', params: [{ name: 'event', type: 'T' }] } }
      ]
    },
    {
      category: 'NFT Atölyesi',
      items: [
        { toolId: 'tool-nft-template', label: 'NFT Şablonu 🖼️', desc: 'SimpleNFT: NFT Yapısı.', type: 'structNode', data: { label: 'SimpleNFT', customTitle: 'NFT Şablonu 🖼️', fields: [{ name: 'id', type: 'UID' }, { name: 'name', type: 'String' }, { name: 'url', type: 'Url' }], abilities: { key: true, store: true } } },
        { toolId: 'tool-nft-mint', label: 'NFT Oluştur (Mint) 🎨', desc: 'Mint: NFT üretir.', type: 'functionNode', data: { label: 'nft::mint', customTitle: 'NFT Oluştur 🎨', params: [{ name: 'name', type: 'vector<u8>' }, { name: 'url', type: 'vector<u8>' }, { name: 'ctx', type: '&mut TxContext' }] } }
      ]
    },
    {
      category: 'Temel Veri Yapıları',
      items: [
        { toolId: 'tool-uid', label: 'Kimlik Kartı 🆔', desc: 'UID: Benzersiz kimlik.', type: 'structNode', data: { label: 'UID', customTitle: 'Kimlik Kartı 🆔', isImported: true, fields: [] } },
        { toolId: 'tool-string', label: 'Yazı (String) 📝', desc: 'String: Metin verisi.', type: 'structNode', data: { label: 'String', customTitle: 'Yazı 📝', isImported: true, fields: [] } },
        { toolId: 'tool-url', label: 'Resim Linki 🖼️', desc: 'Url: Web adresi.', type: 'structNode', data: { label: 'Url', customTitle: 'Resim Linki 🖼️', isImported: true, fields: [] } },
        { toolId: 'tool-option', label: 'Seçenek (Option) ❓', desc: 'Option: Opsiyonel veri.', type: 'structNode', data: { label: 'Option', customTitle: 'Seçenek ❓', isImported: true, fields: [] } },
        { toolId: 'tool-vector', label: 'Liste (Vector) 📚', desc: 'Vector: Liste verisi.', type: 'structNode', data: { label: 'Vector', customTitle: 'Liste 📚', isImported: true, fields: [] } }
      ]
    },
    {
      category: 'Depolama & Sistem',
      items: [
        { toolId: 'tool-clock', label: 'Duvar Saati ⏰', desc: 'Clock: Zaman bilgisi.', type: 'structNode', data: { label: 'Clock', customTitle: 'Duvar Saati ⏰', isImported: true, fields: [] } },
        { toolId: 'tool-timestamp', label: 'Zamanı Al ⏳', desc: 'Timestamp: Saati okur.', type: 'functionNode', data: { label: 'clock::timestamp_ms', customTitle: 'Zamanı Al ⏳', params: [{ name: 'clock', type: '&Clock' }] } },
        { toolId: 'tool-table', label: 'Tablo (Table) 🗃️', desc: 'Table: Büyük veri deposu.', type: 'structNode', data: { label: 'Table', customTitle: 'Tablo 🗃️', isImported: true, fields: [] } },
        { toolId: 'tool-table-new', label: 'Tablo Oluştur 🆕', desc: 'Table New: Yeni tablo kurar.', type: 'functionNode', data: { label: 'table::new', customTitle: 'Tablo Oluştur 🆕', params: [{ name: 'ctx', type: '&mut TxContext' }] } },
        { toolId: 'tool-table-add', label: 'Veri Ekle ➕', desc: 'Table Add: Veri ekler.', type: 'functionNode', data: { label: 'table::add', customTitle: 'Veri Ekle ➕', params: [{ name: 'table', type: '&mut Table' }, { name: 'k', type: 'K' }, { name: 'v', type: 'V' }] } },
        { toolId: 'tool-bag', label: 'Çanta (Bag) 🎒', desc: 'Bag: Esnek depo.', type: 'structNode', data: { label: 'Bag', customTitle: 'Çanta 🎒', isImported: true, fields: [] } },
        { toolId: 'tool-txcontext', label: 'İşlem Bağlamı ⚙️', desc: 'TxContext: İşlem bilgisi.', type: 'structNode', data: { label: 'TxContext', customTitle: 'İşlem Bağlamı ⚙️', isImported: true, fields: [] } }
      ]
    }
  ];

  return (
    <aside id="sidebar-panel" style={{ width: '260px', borderRight: '1px solid #cbd5e1', background: '#f8fafc', padding: '15px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#334155', fontSize: '16px' }}>🛠️ Zengin Çanta</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#94a3b8' }}>✕</button>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
        {templates.map((cat, i) => (
          <div key={i} style={{ marginBottom: '25px' }}>
            <div style={{ fontWeight: '800', color: '#1e293b', marginBottom: '10px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cat.category}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {cat.items.map((item, j) => (
                <div
                  key={j}
                  // --- İŞTE BURASI: ID'Yİ SABİTLEDİK ---
                  id={item.toolId ? item.toolId : `tool-${makeId(item.label)}`}
                  
                  draggable 
                  onDragStart={(event) => onDragStart(event, item.type, item.data)}
                  onClick={() => onSelect && onSelect(item.type, item.data)}
                  style={{
                    padding: '8px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px',
                    cursor: 'grab', display: 'flex', alignItems: 'center', gap: '10px',
                    fontSize: '13px', fontWeight: '500', color: '#475569',
                    position: 'relative', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; const icon = e.currentTarget.querySelector('.help-container'); if(icon) icon.style.opacity = '1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; const icon = e.currentTarget.querySelector('.help-container'); if(icon) icon.style.opacity = '0'; }}
                >
                  <span style={{ fontSize: '16px' }}>{item.type === 'structNode' ? '📦' : (item.type === 'initNode' ? '🏁' : '⚡')}</span>{item.label}
                  <HelpIcon text={item.desc} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}