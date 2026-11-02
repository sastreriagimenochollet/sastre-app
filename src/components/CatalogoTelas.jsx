import { useEffect, useRef, useState } from 'react'
import { Upload, Trash2, Plus, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PROVEEDORES_TEJIDO, ACENTO_SASTRERIA } from '../lib/constantes'
import { claveDe, refNumerica } from '../lib/catalogoTelas'
import { proveedorDeHoja, parsearHoja } from '../lib/importarCatalogo'

const PROVEEDORES = PROVEEDORES_TEJIDO.filter((p) => p !== 'Otro')
const IVA = 1.21
const eur0 = (n) => (n == null ? '—' : Number(n).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }))
const vacio = { proveedor: PROVEEDORES[0], libro: '', desde: '', hasta: '', metro: '', traje: '', pantalon: '', americana: '' }
const num = (v) => (v === '' || v == null ? null : Number(v))
const conIva = (v) => (v === null ? null : Math.round(v * IVA))

export default function CatalogoTelas() {
  const [proveedor, setProveedor] = useState('')
  const [texto, setTexto] = useState('')
  const [filas, setFilas] = useState([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [importando, setImportando] = useState(false)
  const [resumen, setResumen] = useState(null)
  const [nuevo, setNuevo] = useState(vacio)
  const inputArchivo = useRef(null)

  async function buscar() {
    setCargando(true)
    let q = supabase
      .from('catalogo_telas')
      .select('*', { count: 'exact' })
      .order('proveedor')
      .order('desde_num', { ascending: true, nullsFirst: false })
      .limit(50)
    if (proveedor) q = q.eq('proveedor', proveedor)
    const t = texto.trim()
    if (t) {
      const n = refNumerica(t)
      if (n !== null) q = q.lte('desde_num', n).gte('hasta_num', n)
      else {
        const limpio = t.replace(/[%,()]/g, '')
        q = q.or(`libro.ilike.%${limpio}%,clave.like.%${limpio.toLowerCase()}%`)
      }
    }
    const { data, count, error: err } = await q
    if (err) {
      setError(
        err.message.includes('catalogo_telas') || err.message.includes('desde_num')
          ? 'Falta crear la tabla del catálogo: ejecuta migracion-catalogo-telas.sql en Supabase.'
          : err.message
      )
      setFilas([])
    } else {
      setError('')
      setFilas(data ?? [])
      setTotal(count ?? 0)
    }
    setCargando(false)
  }

  useEffect(() => {
    const espera = setTimeout(buscar, 300)
    return () => clearTimeout(espera)
  }, [proveedor, texto])

  async function importar(archivo) {
    if (!archivo) return
    setImportando(true)
    setResumen(null)
    setError('')
    try {
      const XLSX = await import('xlsx')
      const libro = XLSX.read(await archivo.arrayBuffer(), { type: 'array' })
      const importadas = []
      const ignoradas = []
      const conProblemas = []

      for (const hoja of libro.SheetNames) {
        const prov = proveedorDeHoja(hoja)
        if (!prov) {
          ignoradas.push(hoja)
          continue
        }
        const datos = XLSX.utils.sheet_to_json(libro.Sheets[hoja], { header: 1, raw: true, defval: '' })
        const r = parsearHoja(datos, prov)
        if (r.error) {
          conProblemas.push(`${hoja}: ${r.error}`)
          continue
        }
        for (let i = 0; i < r.registros.length; i += 500) {
          const { error: err } = await supabase
            .from('catalogo_telas')
            .upsert(r.registros.slice(i, i + 500), { onConflict: 'proveedor,clave' })
          if (err) throw err
        }
        importadas.push({ proveedor: prov, hoja, n: r.registros.length })
      }
      setResumen({ importadas, ignoradas, conProblemas })
      await buscar()
    } catch (e) {
      setError('No se pudo importar el Excel: ' + (e.message ?? e))
    }
    setImportando(false)
    if (inputArchivo.current) inputArchivo.current.value = ''
  }

  async function añadir() {
    const desde = nuevo.desde.trim()
    if (!desde) return
    const hasta = nuevo.hasta.trim() || desde
    let dn = refNumerica(desde)
    let hn = refNumerica(hasta)
    if (dn !== null && hn === null) hn = dn
    if (dn === null) hn = null
    if (dn !== null && hn !== null && dn > hn) [dn, hn] = [hn, dn]
    const traje = num(nuevo.traje)
    const pantalon = num(nuevo.pantalon)
    const americana = num(nuevo.americana)
    const { error: err } = await supabase.from('catalogo_telas').upsert(
      {
        proveedor: nuevo.proveedor,
        libro: nuevo.libro.trim() || null,
        ref_desde: desde,
        ref_hasta: hasta,
        clave: claveDe(desde),
        desde_num: dn,
        hasta_num: hn,
        precio_metro: num(nuevo.metro),
        traje,
        traje_iva: conIva(traje),
        pantalon,
        pantalon_iva: conIva(pantalon),
        americana,
        americana_iva: conIva(americana),
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'proveedor,clave' }
    )
    if (err) {
      setError(err.message)
      return
    }
    setNuevo({ ...vacio, proveedor: nuevo.proveedor })
    buscar()
  }

  // Edita un precio (sin IVA) y recalcula el precio con IVA
  async function guardarPrecio(fila, campo, valor) {
    const v = num(valor)
    const cambios = { [campo]: v, actualizado_en: new Date().toISOString() }
    if (campo !== 'precio_metro') cambios[`${campo}_iva`] = conIva(v)
    await supabase.from('catalogo_telas').update(cambios).eq('id', fila.id)
    setFilas((prev) => prev.map((f) => (f.id === fila.id ? { ...f, ...cambios } : f)))
  }

  async function borrar(id) {
    if (!confirm('¿Quitar este rango del catálogo?')) return
    setFilas((prev) => prev.filter((f) => f.id !== id))
    await supabase.from('catalogo_telas').delete().eq('id', id)
  }

  const caja = 'bg-white border border-bronce-100 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-bronce-300 min-w-0'

  return (
    <div>
      {/* Importar Excel */}
      <div className="bg-white rounded-card border border-bronce-100 p-4 mb-4">
        <p className="text-sm font-medium text-tinta mb-1">Importar desde Excel</p>
        <p className="text-xs text-tinta/50 mb-3">
          Una hoja por proveedor (el nombre de la hoja es el del proveedor) con las columnas BOOK, REF (desde), REF
          (hasta), METRO, TRAJE, TRAJE + IVA, PANTALON, PANTALON + IVA, AMERICANA y AMERICANA + IVA. Puede haber filas de
          título encima. Si vuelves a importar, se actualizan los rangos que ya existen.
        </p>
        <input
          ref={inputArchivo}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => importar(e.target.files?.[0])}
        />
        <button
          onClick={() => inputArchivo.current?.click()}
          disabled={importando}
          className="flex items-center gap-2 text-white text-sm font-medium rounded-lg px-4 py-2.5 disabled:opacity-60"
          style={{ backgroundColor: ACENTO_SASTRERIA }}
        >
          <Upload size={16} /> {importando ? 'Importando…' : 'Elegir archivo Excel'}
        </button>
        {resumen && (
          <div className="mt-3 text-xs text-tinta/65 space-y-0.5">
            {resumen.importadas.map((r) => (
              <p key={r.hoja}>
                {r.proveedor}: {r.n.toLocaleString('es-ES')} rangos
              </p>
            ))}
            {resumen.importadas.length === 0 && <p>No se ha importado ninguna hoja.</p>}
            {resumen.conProblemas.map((p) => (
              <p key={p} className="text-red-600">{p}</p>
            ))}
            {resumen.ignoradas.length > 0 && (
              <p className="text-tinta/45">
                Hojas ignoradas (el nombre no coincide con un proveedor): {resumen.ignoradas.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Añadir a mano */}
      <div className="bg-white rounded-card border border-bronce-100 p-4 mb-4">
        <p className="text-sm font-medium text-tinta mb-2">Añadir o actualizar un rango</p>
        <div className="grid grid-cols-2 gap-2">
          <select value={nuevo.proveedor} onChange={(e) => setNuevo({ ...nuevo, proveedor: e.target.value })} className={caja}>
            {PROVEEDORES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input value={nuevo.libro} onChange={(e) => setNuevo({ ...nuevo, libro: e.target.value })} placeholder="Libro" className={caja} />
          <input value={nuevo.desde} onChange={(e) => setNuevo({ ...nuevo, desde: e.target.value })} placeholder="Referencia desde" className={caja} />
          <input value={nuevo.hasta} onChange={(e) => setNuevo({ ...nuevo, hasta: e.target.value })} placeholder="Referencia hasta (vacío = una sola)" className={caja} />
          <input type="number" inputMode="decimal" step="any" value={nuevo.metro} onChange={(e) => setNuevo({ ...nuevo, metro: e.target.value })} placeholder="€ / metro" className={caja} />
          <input type="number" inputMode="decimal" step="any" value={nuevo.traje} onChange={(e) => setNuevo({ ...nuevo, traje: e.target.value })} placeholder="Traje (sin IVA)" className={caja} />
          <input type="number" inputMode="decimal" step="any" value={nuevo.pantalon} onChange={(e) => setNuevo({ ...nuevo, pantalon: e.target.value })} placeholder="Pantalón (sin IVA)" className={caja} />
          <input type="number" inputMode="decimal" step="any" value={nuevo.americana} onChange={(e) => setNuevo({ ...nuevo, americana: e.target.value })} placeholder="Americana (sin IVA)" className={caja} />
        </div>
        <button onClick={añadir} className="mt-2 flex items-center gap-1.5 text-sm font-medium" style={{ color: ACENTO_SASTRERIA }}>
          <Plus size={15} /> Guardar en el catálogo
        </button>
        <p className="text-[11px] text-tinta/40 mt-1">El precio con IVA se calcula solo (× 1,21).</p>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {/* Buscar */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tinta/35" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar referencia o libro…"
            className="w-full bg-white border border-bronce-100 rounded-full pl-9 pr-3 py-2 text-sm outline-none focus:border-bronce-300"
          />
        </div>
        <select
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
          className="shrink-0 bg-white border border-bronce-100 rounded-full px-3 py-2 text-sm text-tinta/70 outline-none"
        >
          <option value="">Todos</option>
          {PROVEEDORES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-tinta/45 mb-2">
        {total.toLocaleString('es-ES')} rangos{total > 50 ? ' · se muestran los 50 primeros, afina la búsqueda' : ''}
      </p>

      {cargando && <p className="text-center text-tinta/40 text-sm py-6">Cargando…</p>}

      <div className="space-y-2">
        {filas.map((f) => (
          <div key={f.id} className="bg-white rounded-lg border border-bronce-100 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-tinta truncate">
                  {f.proveedor} · {f.libro || 'Sin libro'}
                </p>
                <p className="text-xs text-tinta/50">
                  Ref. {f.ref_desde}
                  {f.ref_hasta !== f.ref_desde ? ` – ${f.ref_hasta}` : ''}
                </p>
              </div>
              <button onClick={() => borrar(f.id)} className="shrink-0 text-tinta/30 hover:text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                ['precio_metro', '€/metro'],
                ['traje', 'Traje'],
                ['pantalon', 'Pantalón'],
                ['americana', 'Americana'],
              ].map(([campo, etiqueta]) => (
                <div key={campo}>
                  <label className="text-[10px] text-tinta/45">{etiqueta}</label>
                  <input
                    key={`${f.id}-${campo}-${f[campo]}`}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    defaultValue={f[campo] ?? ''}
                    onBlur={(e) => guardarPrecio(f, campo, e.target.value)}
                    className={`w-full ${caja}`}
                  />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-tinta/45 mt-1.5">
              Con IVA: Traje {eur0(f.traje_iva)} · Pantalón {eur0(f.pantalon_iva)} · Americana {eur0(f.americana_iva)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
