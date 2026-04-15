import { useState } from "react";

const REP = {
  "5_green":       { label: "Excelente", color: "#00a650" },
  "4_light_green": { label: "Muito bom",  color: "#7bc324" },
};

function formatBRL(v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Tag({ children, accent }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
      textTransform: "uppercase", padding: "2px 7px", borderRadius: 3,
      background: accent ? "#ffe600" : "#f0f0f0",
      color: accent ? "#111" : "#666",
    }}>{children}</span>
  );
}

function ProductCard({ item }) {
  const rep = item.seller?.seller_reputation?.level_id;
  const repInfo = REP[rep];
  const isFree = item.shipping?.free_shipping;
  const isUsed = item.condition === "used";

  return (
    
      href={item.permalink}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex", gap: 14, padding: "14px 16px",
        background: "#fff", border: "1px solid #e8e8e8",
        borderRadius: 9, textDecoration: "none", color: "inherit",
        alignItems: "center", transition: "box-shadow 0.15s, transform 0.15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.09)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div style={{
        width: 72, height: 72, flexShrink: 0,
        background: "#fafafa", borderRadius: 7,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "1px solid #f0f0f0", overflow: "hidden",
      }}>
        {item.thumbnail
          ? <img src={item.thumbnail.replace(/\bI\b/, "O")} alt={item.title}
              style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          : <span style={{ color: "#ccc", fontSize: 22 }}>?</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: "0 0 7px", fontSize: 13, fontWeight: 500, color: "#1a1a1a",
          lineHeight: 1.4, overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{item.title}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#00a650", letterSpacing: "-0.03em" }}>
            {formatBRL(item.price)}
          </span>
          {isFree && <Tag accent>Frete gratis</Tag>}
          {isUsed && <Tag>Usado</Tag>}
        </div>
        {repInfo && (
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: repInfo.color, display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "#777" }}>{repInfo.label}</span>
          </span>
        )}
      </div>
    </a>
  );
}

function SearchRow({ item, onRemove, onChange, onSearchSingle, canRemove }) {
  const [open, setOpen] = useState(true);
  const hasResults = item.searched && !item.loading && !item.error;
  const count = item.results.length;

  return (
    <div style={{
      background: "#fff", border: "1px solid #e0e0e0",
      borderRadius: 12, overflow: "hidden", marginBottom: 12,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "12px 14px", background: "#fafafa",
        borderBottom: open && item.searched ? "1px solid #eee" : "none",
      }}>
        <input
          value={item.query}
          onChange={e => onChange(item.id, e.target.value)}
          onKeyDown={e => e.key === "Enter" && onSearchSingle(item.id)}
          placeholder="Digite o produto..."
          style={{
            flex: 1, padding: "9px 13px", fontSize: 14,
            border: "1px solid #ddd", borderRadius: 7,
            outline: "none", fontFamily: "inherit",
            background: "#fff", color: "#111",
          }}
        />
        {item.loading && (
          <div style={{
            width: 18, height: 18, flexShrink: 0,
            border: "2px solid #e0e0e0", borderTopColor: "#ffe600",
            borderRadius: "50%", animation: "spin 0.7s linear infinite",
          }} />
        )}
        {hasResults && (
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              padding: "8px 12px", background: "none",
              border: "1px solid #ddd", borderRadius: 7,
              cursor: "pointer", fontSize: 12, color: "#555",
              fontFamily: "inherit", fontWeight: 600, whiteSpace: "nowrap",
            }}
          >
            {count} resultado{count !== 1 ? "s" : ""} {open ? "▲" : "▼"}
          </button>
        )}
        {canRemove && (
          <button
            onClick={() => onRemove(item.id)}
            style={{
              width: 32, height: 32, background: "none",
              border: "1px solid #ddd", borderRadius: 7,
              cursor: "pointer", color: "#bbb", fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >x</button>
        )}
      </div>

      {open && item.searched && (
        <div style={{ padding: "12px 14px" }}>
          {item.error && (
            <p style={{ color: "#c0392b", fontSize: 13, margin: 0 }}>{item.error}</p>
          )}
          {hasResults && count === 0 && (
            <p style={{ color: "#999", fontSize: 13, margin: 0 }}>
              Nenhum resultado encontrado com bons vendedores. Tente termos mais amplos.
            </p>
          )}
          {hasResults && count > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {item.results.map(p => <ProductCard key={p.id} item={p} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

let nextId = 1;
const makeItem = (query = "") => ({ id: nextId++, query, results: [], loading: false, error: "", searched: false });

async function fetchML(q) {
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Erro na API");
  const data = await res.json();
  const boas = ["5_green", "4_light_green"];
  return (data.results || []).filter(
    item => boas.includes(item.seller?.seller_reputation?.level_id)
  );
}

export default function App() {
  const [items, setItems] = useState([makeItem(), makeItem()]);

  const update = (id, patch) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));

  const runSearch = async (id) => {
    const item = items.find(i => i.id === id);
    if (!item?.query.trim()) return;
    update(id, { loading: true, error: "", results: [], searched: true });
    try {
      const results = await fetchML(item.query.trim());
      update(id, { loading: false, results });
    } catch {
      update(id, { loading: false, error: "Nao foi possivel buscar. Tente novamente." });
    }
  };

  const runAll = () => {
    items.forEach(item => { if (item.query.trim()) runSearch(item.id); });
  };

  const anyFilled = items.some(i => i.query.trim());
  const anyLoading = items.some(i => i.loading);

  return (
    <div style={{ minHeight: "100vh", background: "#f2f2f2", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{
        background: "#111", padding: "26px 20px 22px",
        position: "sticky", top: 0, zIndex: 10,
        boxShadow: "0 2px 14px rgba(0,0,0,0.2)",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                background: "#ffe600", color: "#111", fontWeight: 800,
                fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase",
                padding: "4px 10px", borderRadius: 4,
              }}>ML</span>
              <span style={{ color: "#ccc", fontSize: 14, fontWeight: 500 }}>Busca inteligente</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setItems(prev => [...prev, makeItem()])}
                style={{
                  padding: "9px 14px", background: "none",
                  border: "1px solid #444", borderRadius: 7,
                  color: "#bbb", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >+ Produto</button>
              <button
                onClick={runAll}
                disabled={!anyFilled || anyLoading}
                style={{
                  padding: "9px 20px",
                  background: (!anyFilled || anyLoading) ? "#333" : "#ffe600",
                  color: (!anyFilled || anyLoading) ? "#666" : "#111",
                  border: "none", borderRadius: 7,
                  fontSize: 13, fontWeight: 800,
                  cursor: (!anyFilled || anyLoading) ? "not-allowed" : "pointer",
                  fontFamily: "inherit", letterSpacing: "0.05em",
                  textTransform: "uppercase", transition: "background 0.15s",
                }}
              >
                {anyLoading ? "Buscando..." : "Buscar todos"}
              </button>
            </div>
          </div>
          <p style={{ color: "#555", fontSize: 11, margin: 0, letterSpacing: "0.03em" }}>
            Somente vendedores com boa reputacao, ordenados do mais barato para o mais caro.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px" }}>
        {items.map(item => (
          <SearchRow
            key={item.id}
            item={item}
            onRemove={id => setItems(prev => prev.filter(i => i.id !== id))}
            onChange={(id, val) => update(id, { query: val })}
            onSearchSingle={runSearch}
            canRemove={items.length > 1}
          />
        ))}
        <button
          onClick={() => setItems(prev => [...prev, makeItem()])}
          style={{
            width: "100%", padding: "12px",
            background: "none", border: "2px dashed #ccc",
            borderRadius: 10, color: "#999", fontSize: 13,
            fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            marginTop: 4, transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#aaa"; e.currentTarget.style.color = "#555"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.color = "#999"; }}
        >
          + Adicionar outro produto
        </button>
      </div>
    </div>
  );
}
