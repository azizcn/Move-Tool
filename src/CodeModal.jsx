import React, { useState } from 'react';

// Yardımcı Komut Kutusu (Açıklamalı)
const CommandBlock = ({ label, command, description, onToast }) => {
  const copyCmd = () => {
    navigator.clipboard.writeText(command);
    if(onToast) onToast("✅ Komut kopyalandı.");
  };

  return (
    <div style={{ background: '#334155', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #475569' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </div>
        <button 
          onClick={copyCmd}
          style={{ 
            background: 'rgba(255,255,255,0.1)', border: '1px solid #64748b', color: '#e2e8f0', 
            borderRadius: '4px', cursor: 'pointer', fontSize: '11px', padding: '4px 8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
        >
          Kopyala
        </button>
      </div>
      
      {/* Kod Satırı */}
      <code style={{ display: 'block', fontFamily: 'monospace', color: '#4ade80', fontSize: '13px', wordBreak: 'break-all', background: '#0f172a', padding: '10px', borderRadius: '4px', marginBottom: '8px' }}>
        {command}
      </code>

      {/* Eğitici Açıklama */}
      <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', borderLeft: '3px solid #64748b', paddingLeft: '8px', lineHeight: '1.4' }}>
        ℹ️ {description}
      </div>
    </div>
  );
};

export default function CodeModal({ code, toml, onClose, onToast }) {
  const [activeTab, setActiveTab] = useState('guide'); // Kullanıcıyı direkt rehberle karşılayalım

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    if(onToast) onToast("✅ Panoya kopyalandı.");
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000,
      display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: '#1e293b', color: '#f8fafc',
        borderRadius: '12px', width: '800px', maxWidth: '95%', height: '90vh',
        display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid #334155'
      }}>
        
        {/* --- BAŞLIK VE SEKMELER --- */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 25px', borderBottom: '1px solid #334155', background: '#0f172a', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              onClick={() => setActiveTab('guide')}
              style={{
                background: activeTab === 'guide' ? '#10b981' : 'transparent',
                color: activeTab === 'guide' ? 'black' : '#94a3b8',
                border: activeTab === 'guide' ? '1px solid #059669' : '1px solid transparent',
                padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
              }}
            >
              🚀 Yükleme Rehberi
            </button>
            <button 
              onClick={() => setActiveTab('code')}
              style={{
                background: activeTab === 'code' ? '#3b82f6' : 'transparent',
                color: activeTab === 'code' ? 'white' : '#94a3b8',
                border: activeTab === 'code' ? '1px solid #2563eb' : '1px solid transparent', 
                padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
              }}
            >
              📄 Move Kodu
            </button>
            <button 
              onClick={() => setActiveTab('toml')}
              style={{
                background: activeTab === 'toml' ? '#f59e0b' : 'transparent',
                color: activeTab === 'toml' ? 'black' : '#94a3b8',
                border: activeTab === 'toml' ? '1px solid #d97706' : '1px solid transparent',
                padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
              }}
            >
              📦 Move.toml
            </button>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '28px', lineHeight: '1' }}>×</button>
        </div>

        {/* --- İÇERİK ALANI --- */}
        <div style={{ flex: 1, padding: '30px', overflowY: 'auto', background: '#1e293b' }}>
          
          {/* 1. REHBER SEKMESİ (Varsayılan) */}
          {activeTab === 'guide' && (
            <div style={{ color: '#e2e8f0', lineHeight: '1.6', maxWidth: '700px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#10b981', marginTop: 0, marginBottom: '10px' }}>🚀 Sıfırdan Testnet'e: Adım Adım Dağıtım</h2>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                  Aşağıdaki komutları sırasıyla terminalinizde çalıştırarak projenizi blok zincirine yükleyebilirsiniz.
                </p>
              </div>
              
              <CommandBlock 
                label="Adım 1: Proje Altyapısını Oluştur" 
                command="sui move new my_first_package" 
                description="Bu komut, projeniz için gerekli klasör yapısını (sources, Move.toml vb.) otomatik olarak oluşturur. 'my_first_package' yerine projenize vermek istediğiniz ismi yazabilirsiniz."
                onToast={onToast}
              />

              <div style={{ background: '#0f172a', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #3b82f6', marginBottom: '20px', fontSize: '13px', color: '#cbd5e1' }}>
                👉 <b>Önemli:</b> Oluşturulan klasörün içine girmeyi unutmayınız: <code>cd my_first_package</code>
              </div>

              <CommandBlock 
                label="Adım 2: Geliştirme Ağını Seç (Testnet)" 
                command="sui client switch --env testnet" 
                description="Sui ağında geliştirme yapmak için 'Testnet' en uygun ortamdır. Bu komut, işlem yapacağınız ağı Testnet olarak ayarlar."
                onToast={onToast}
              />

              <CommandBlock 
                label="Adım 3: Aktif Adres Kontrolü" 
                command="sui client active-address" 
                description="İşlemleri hangi cüzdan adresiyle yapacağınızı gösterir. Eğer bir adresiniz yoksa 'sui client new-address' ile oluşturabilirsiniz."
                onToast={onToast}
              />

              <CommandBlock 
                label="Adım 4: Gaz Parası (Faucet) Temini" 
                command="sui client faucet" 
                description="Blok zincirinde işlem yapmak ücretlidir (Gas Fee). Testnet ortamında bu ücreti bedava almak için bu komutu kullanırız."
                onToast={onToast}
              />

              <div style={{ margin: '30px 0 20px 0', borderTop: '1px dashed #475569', paddingTop: '20px' }}>
                <h3 style={{ color: '#fff', fontSize: '16px', margin: '0 0 10px 0' }}>📄 Dosya Yerleşimi</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '15px' }}>
                  Komutları çalıştırmadan önce, yukarıdaki sekmelerden (Move Kodu ve Move.toml) aldığınız kodları ilgili dosyalara yapıştırdığınızdan emin olunuz.
                </p>
              </div>

              <CommandBlock 
                label="Adım 5: Yayınla (Deploy)" 
                command="sui client publish --gas-budget 100000000" 
                description="Tüm hazırlıklar tamamsa bu komut projenizi derler ve Sui ağına yükler. Çıktıda 'Immutable' veya 'PackageID' görüyorsanız işlem başarılıdır!"
                onToast={onToast}
              />
            </div>
          )}

          {/* 2. MOVE KODU SEKMESİ */}
          {activeTab === 'code' && (
            <>
              <div style={{ marginBottom: '15px', color: '#94a3b8', fontSize: '14px', background: '#334155', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #3b82f6' }}>
                💡 <b>Talimat:</b> Proje klasörünüzdeki <code>sources</code> klasörüne gidin. İçindeki varsayılan dosyayı silin ve yeni bir dosya oluşturup (örn: <code>my_module.move</code>) bu kodu içine yapıştırın.
              </div>
              <textarea 
                readOnly value={code} 
                style={{
                  width: '100%', height: '500px', background: '#0f172a', color: '#a5b4fc',
                  border: '1px solid #334155', borderRadius: '8px', padding: '20px',
                  fontFamily: 'monospace', fontSize: '13px', resize: 'none', outline: 'none', lineHeight: '1.5'
                }}
              />
              <div style={{ marginTop: '15px', textAlign: 'right' }}>
                <button onClick={() => copyToClipboard(code)} style={{ background: '#3b82f6', color: 'white', padding: '10px 25px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                  Kodu Kopyala
                </button>
              </div>
            </>
          )}

          {/* 3. MOVE.TOML SEKMESİ */}
          {activeTab === 'toml' && (
            <>
              <div style={{ marginBottom: '15px', color: '#94a3b8', fontSize: '14px', background: '#334155', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #f59e0b' }}>
                💡 <b>Talimat:</b> Projenizin ana dizinindeki <code>Move.toml</code> dosyasını açın. İçindeki her şeyi silin ve bu ayarları yapıştırın. Bu dosya, projenizin kimliği ve bağımlılıklarıdır.
              </div>
              <textarea 
                readOnly value={toml} 
                style={{
                  width: '100%', height: '400px', background: '#0f172a', color: '#fbbf24',
                  border: '1px solid #334155', borderRadius: '8px', padding: '20px',
                  fontFamily: 'monospace', fontSize: '13px', resize: 'none', outline: 'none', lineHeight: '1.5'
                }}
              />
              <div style={{ marginTop: '15px', textAlign: 'right' }}>
                <button onClick={() => copyToClipboard(toml)} style={{ background: '#f59e0b', color: 'black', padding: '10px 25px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                  Toml'u Kopyala
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}