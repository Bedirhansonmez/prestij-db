import { useState, useMemo, useEffect } from "react";

const SIFRE = "databaseofprestige";

function SifreEkrani({ onGiris }) {
  const [girilen, setGirilen] = useState("");
  const [hata, setHata] = useState(false);

  function kontrol() {
    if (girilen === SIFRE) { onGiris(); }
    else { setHata(true); setGirilen(""); setTimeout(() => setHata(false), 2000); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif" }}>
      <div style={{ background: "#141414", border: "1px solid #2a2a2a", borderRadius: 8, padding: "48px 52px", width: "100%", maxWidth: 380, textAlign: "center", boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#c8a96e", textTransform: "uppercase", marginBottom: 10 }}>Prestij Akademi</div>
        <div style={{ fontSize: 22, color: "#f0ebe0", marginBottom: 32, fontWeight: "normal" }}>Eğitmen Veritabanı</div>
        <input
          type="password"
          placeholder="Şifre"
          value={girilen}
          onChange={e => setGirilen(e.target.value)}
          onKeyDown={e => e.key === "Enter" && kontrol()}
          style={{
            width: "100%", background: "#0d0d0d", border: `1px solid ${hata ? "#8b2020" : "#2a2a2a"}`,
            borderRadius: 4, padding: "12px 14px", color: "#e8e0d0", fontSize: 14,
            outline: "none", boxSizing: "border-box", fontFamily: "inherit", textAlign: "center",
            transition: "border 0.2s",
          }}
        />
        {hata && <div style={{ color: "#c06060", fontSize: 12, marginTop: 10 }}>Yanlış şifre</div>}
        <button onClick={kontrol} style={{
          marginTop: 16, width: "100%", background: "#c8a96e", border: "none", color: "#0d0d0d",
          padding: "12px", borderRadius: 4, cursor: "pointer", fontSize: 13, fontFamily: "inherit", letterSpacing: 1,
        }}>
          Giriş
        </button>
      </div>
    </div>
  );
}

const SUPABASE_URL = "https://rcqrdnbomywfbvgitqli.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcXJkbmJvbXl3ZmJ2Z2l0cWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzkzOTcsImV4cCI6MjA5NjI1NTM5N30.wWEuRCNtq2PNxppXTMgGiOHo_mSSvizaz84wigwsIXM";
const HEADERS = { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
const API = `${SUPABASE_URL}/rest/v1/egitmenler`;

const SINIF_OPTIONS = ["Hazırlık", "1. Sınıf", "2. Sınıf", "3. Sınıf", "4. Sınıf", "Mezun"];
const SEHIR_OPTIONS = ["Ankara", "Diyarbakır", "İstanbul"];
const SEHIR_COLORS = {
  "Diyarbakır": { bg: "#1a1500", border: "#4a3a00", text: "#c8a96e" },
  "İstanbul":   { bg: "#0a1520", border: "#1a3a55", text: "#6eafc8" },
  "Ankara":     { bg: "#0f1a0f", border: "#1a3a1a", text: "#6ec88a" },
};
const EMPTY_FORM = { isim_soyisim: "", siralama: "", universite: "", bolum: "", telefon: "", mail: "", sinif: "", sehir: "", foto_url: "" };

async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, { headers: HEADERS, ...options });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? null : res.json();
}

export default function PrestijDB() {
  const [girisYapildi, setGirisYapildi] = useState(false);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [sortField, setSortField] = useState("isim_soyisim");
  const [sortDir, setSortDir] = useState("asc");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterSehir, setFilterSehir] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fotoYukleniyor, setFotoYukleniyor] = useState(false);

  useEffect(() => { if (girisYapildi) loadAll(); }, [girisYapildi]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("?select=*&order=created_at.desc");
      setRecords(data);
    } catch (e) {
      setError("Veriler yüklenemedi: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records
      .filter(r => {
        const matchSearch = Object.values(r).some(v => String(v ?? "").toLowerCase().includes(q));
        const matchSehir = filterSehir ? r.sehir === filterSehir : true;
        return matchSearch && matchSehir;
      })
      .sort((a, b) => {
        const av = String(a[sortField] ?? "");
        const bv = String(b[sortField] ?? "");
        if (sortField === "siralama") return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
        return sortDir === "asc" ? av.localeCompare(bv, "tr") : bv.localeCompare(av, "tr");
      });
  }, [records, search, sortField, sortDir, filterSehir]);

  const counts = useMemo(() => ({
    total: records.length,
    ankara: records.filter(r => r.sehir === "Ankara").length,
    diyarbakir: records.filter(r => r.sehir === "Diyarbakır").length,
    istanbul: records.filter(r => r.sehir === "İstanbul").length,
  }), [records]);

  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function handleFotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFotoYukleniyor(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/fotograflar/${fileName}`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error(await res.text());
      const url = `${SUPABASE_URL}/storage/v1/object/public/fotograflar/${fileName}`;
      setForm(f => ({ ...f, foto_url: url }));
    } catch (e) {
      setError("Fotoğraf yüklenemedi: " + e.message);
    } finally {
      setFotoYukleniyor(false);
    }
  }

  async function handleSubmit() {
    if (!form.isim_soyisim.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const body = { ...form, siralama: form.siralama ? Number(form.siralama) : null };
      if (editId !== null) {
        await apiFetch(`?id=eq.${editId}`, { method: "PATCH", body: JSON.stringify(body) });
        setRecords(r => r.map(rec => rec.id === editId ? { ...rec, ...body } : rec));
      } else {
        const [created] = await apiFetch("?select=*", { method: "POST", body: JSON.stringify(body), headers: { ...HEADERS, Prefer: "return=representation" } });
        setRecords(r => [created, ...r]);
      }
      setForm(EMPTY_FORM); setEditId(null); setShowForm(false);
    } catch (e) {
      setError("Kayıt hatası: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(rec) { setForm({ ...EMPTY_FORM, ...rec }); setEditId(rec.id); setShowForm(true); }

  async function handleDelete(id) {
    try {
      await apiFetch(`?id=eq.${id}`, { method: "DELETE" });
      setRecords(r => r.filter(rec => rec.id !== id));
    } catch (e) {
      setError("Silme hatası: " + e.message);
    } finally {
      setDeleteConfirm(null);
    }
  }

  function handleSort(field) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  function cancelForm() { setForm(EMPTY_FORM); setEditId(null); setShowForm(false); }

  function exportCSV() {
    const headers = ["İsim Soyisim", "Sıralama", "Üniversite", "Bölüm", "Telefon", "Mail", "Sınıf", "Şehir"];
    const rows = filtered.map(r =>
      [r.isim_soyisim, r.siralama, r.universite, r.bolum, r.telefon, r.mail, r.sinif, r.sehir]
        .map(v => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `prestij_${filterSehir || "tum"}_egitmenler.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span style={{ opacity: 0.25, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4, color: "#c8a96e" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const cols = [
    { key: "foto_url", label: "" },
    { key: "isim_soyisim", label: "İsim Soyisim" },
    { key: "siralama", label: "Sıralama" },
    { key: "universite", label: "Üniversite" },
    { key: "bolum", label: "Bölüm" },
    { key: "telefon", label: "Telefon" },
    { key: "mail", label: "Mail" },
    { key: "sinif", label: "Sınıf" },
    { key: "sehir", label: "Şehir" },
  ];

  if (!girisYapildi) return <SifreEkrani onGiris={() => setGirisYapildi(true)} />;

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#e8e0d0", fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #2a2a2a", padding: "28px 40px 20px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, background: "#111" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#c8a96e", textTransform: "uppercase", marginBottom: 6 }}>Prestij Akademi</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: "normal", color: "#f0ebe0", letterSpacing: 1 }}>Eğitmen Veritabanı</h1>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {error && <span style={{ fontSize: 12, color: "#c06060", maxWidth: 300 }}>{error}</span>}
          {records.length > 0 && <button onClick={exportCSV} style={btnStyle("#1e1e1e", "#444")}>↓ CSV {filterSehir ? `(${filterSehir})` : "İndir"}</button>}
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }} style={btnStyle("#c8a96e", "#c8a96e", "#0d0d0d")}>+ Yeni Kayıt</button>
        </div>
      </div>

      {/* Stats / Filtre */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #1a1a1a" }}>
        {[
          { label: "Toplam", count: counts.total, key: "", accent: "#e8e0d0" },
          { label: "Ankara", count: counts.ankara, key: "Ankara", accent: "#6ec88a" },
          { label: "Diyarbakır", count: counts.diyarbakir, key: "Diyarbakır", accent: "#c8a96e" },
          { label: "İstanbul", count: counts.istanbul, key: "İstanbul", accent: "#6eafc8" },
        ].map(s => (
          <button key={s.key} onClick={() => setFilterSehir(f => f === s.key ? "" : s.key)} style={{
            background: filterSehir === s.key ? "#1a1a1a" : "transparent",
            border: "none", borderRight: "1px solid #1a1a1a",
            borderBottom: filterSehir === s.key ? `2px solid ${s.accent}` : "2px solid transparent",
            color: filterSehir === s.key ? s.accent : "#555",
            padding: "14px 28px", cursor: "pointer", fontSize: 12, letterSpacing: 1, fontFamily: "inherit", transition: "all 0.15s",
          }}>
            {s.label} <span style={{ marginLeft: 8, opacity: 0.7 }}>{s.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: "20px 40px 0", display: "flex", gap: 12, alignItems: "center" }}>
        <input placeholder="Ara — isim, üniversite, bölüm..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, maxWidth: 380, fontSize: 13 }} />
        {(search || filterSehir) && (
          <button onClick={() => { setSearch(""); setFilterSehir(""); }}
            style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
            × Temizle
          </button>
        )}
        {filtered.length !== records.length && <span style={{ fontSize: 12, color: "#555" }}>{filtered.length} sonuç</span>}
      </div>

      {/* Table */}
      <div style={{ padding: "20px 40px 40px", overflowX: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#444", fontSize: 13, letterSpacing: 2 }}>Yükleniyor…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#444", fontSize: 14, letterSpacing: 1 }}>
            {records.length === 0 ? "Henüz kayıt yok. İlk eğitmeni ekle." : "Sonuç bulunamadı."}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                {cols.map(c => (
                  <th key={c.key} onClick={() => handleSort(c.key)} style={{
                    padding: "10px 14px", textAlign: "left", fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
                    color: sortField === c.key ? "#c8a96e" : "#555", cursor: "pointer", fontWeight: "normal", whiteSpace: "nowrap", userSelect: "none",
                  }}>
                    {c.label}<SortIcon field={c.key} />
                  </th>
                ))}
                <th style={{ padding: "10px 14px", width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec, i) => (
                <tr key={rec.id}
                  style={{ borderBottom: "1px solid #1a1a1a", background: i % 2 === 0 ? "transparent" : "#0f0f0f", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1a1a1a"}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "#0f0f0f"}
                >
                  {cols.map(c => (
                    <td key={c.key} style={{ padding: "12px 14px", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.key === "foto_url" ? (
                        rec[c.key]
                          ? <img src={rec[c.key]} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "1px solid #2a2a2a" }} />
                          : <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a1a1a", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#333" }}>?</div>
                      ) : c.key === "siralama" && rec[c.key] ? (
                        <span style={{ color: "#c8a96e", fontVariantNumeric: "tabular-nums" }}>{Number(rec[c.key]).toLocaleString("tr-TR")}</span>
                      ) : c.key === "sehir" && rec[c.key] ? (
                        <span style={{
                          background: SEHIR_COLORS[rec[c.key]]?.bg || "#1a1a1a",
                          border: `1px solid ${SEHIR_COLORS[rec[c.key]]?.border || "#333"}`,
                          color: SEHIR_COLORS[rec[c.key]]?.text || "#aaa",
                          padding: "2px 10px", borderRadius: 20, fontSize: 11, letterSpacing: 0.5,
                        }}>{rec[c.key]}</span>
                      ) : c.key === "isim_soyisim" ? (
                        <span style={{ color: "#f0ebe0" }}>{rec[c.key]}</span>
                      ) : (
                        <span style={{ color: "#aaa" }}>{rec[c.key] || <span style={{ color: "#333" }}>—</span>}</span>
                      )}
                    </td>
                  ))}
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleEdit(rec)}
                        style={{ background: "none", border: "1px solid #2a2a2a", color: "#888", padding: "4px 10px", borderRadius: 3, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
                        Düzenle
                      </button>
                      <button onClick={() => setDeleteConfirm(rec.id)}
                        style={{ background: "none", border: "1px solid #2a2a2a", color: "#664444", padding: "4px 8px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(3px)" }}>
          <div style={{ background: "#141414", border: "1px solid #2a2a2a", borderRadius: 8, padding: "36px 40px", width: "100%", maxWidth: 540, boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#c8a96e", textTransform: "uppercase", marginBottom: 6 }}>
                {editId !== null ? "Kaydı Düzenle" : "Yeni Kayıt"}
              </div>
              <div style={{ fontSize: 20, color: "#f0ebe0" }}>Eğitmen Bilgileri</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>İsim Soyisim</label>
                <input name="isim_soyisim" value={form.isim_soyisim} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Sıralama (YKS/LGS)</label>
                <input name="siralama" type="number" value={form.siralama} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Şehir</label>
                <select name="sehir" value={form.sehir} onChange={handleChange} style={inputStyle}>
                  <option value="">Seç</option>
                  {SEHIR_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Üniversite</label>
                <input name="universite" value={form.universite} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Bölüm</label>
                <input name="bolum" value={form.bolum} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Telefon No</label>
                <input name="telefon" type="tel" value={form.telefon} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>E-posta</label>
                <input name="mail" type="email" value={form.mail} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Sınıf</label>
                <select name="sinif" value={form.sinif} onChange={handleChange} style={{ ...inputStyle, maxWidth: 240 }}>
                  <option value="">Seç</option>
                  {SINIF_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Fotoğraf</label>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {form.foto_url && <img src={form.foto_url} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "1px solid #2a2a2a" }} />}
                  <label style={{ cursor: "pointer", background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: 4, padding: "10px 16px", fontSize: 13, color: fotoYukleniyor ? "#555" : "#aaa", fontFamily: "inherit" }}>
                    {fotoYukleniyor ? "Yükleniyor…" : form.foto_url ? "Değiştir" : "Fotoğraf Seç"}
                    <input type="file" accept="image/*" onChange={handleFotoUpload} style={{ display: "none" }} disabled={fotoYukleniyor} />
                  </label>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 28, justifyContent: "flex-end" }}>
              <button onClick={cancelForm} style={btnStyle("#1e1e1e", "#333")}>İptal</button>
              <button onClick={handleSubmit} disabled={saving} style={btnStyle("#c8a96e", "#c8a96e", "#0d0d0d")}>
                {saving ? "Kaydediliyor…" : editId !== null ? "Güncelle" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#141414", border: "1px solid #2a2a2a", borderRadius: 8, padding: "32px 36px", maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 18, marginBottom: 10, color: "#f0ebe0" }}>Kaydı sil?</div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>Bu işlem geri alınamaz.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setDeleteConfirm(null)} style={btnStyle("#1e1e1e", "#333")}>İptal</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={btnStyle("#8b2020", "#8b2020", "#fff")}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "#0d0d0d", border: "1px solid #2a2a2a", borderRadius: 4,
  padding: "10px 12px", color: "#e8e0d0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};
const labelStyle = { display: "block", fontSize: 10, letterSpacing: 2, color: "#666", textTransform: "uppercase", marginBottom: 6 };
function btnStyle(bg, border, color = "#e8e0d0") {
  return { background: bg, border: `1px solid ${border}`, color, padding: "9px 18px", borderRadius: 4, cursor: "pointer", fontSize: 12, letterSpacing: 0.5, fontFamily: "inherit" };
}
 
