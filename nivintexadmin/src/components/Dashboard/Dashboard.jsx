// src/components/Dashboard/Dashboard.jsx
// Materio-inspired redesign — purple sidebar accent, white cards, dual-axis charts, donut, progress bars
import { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';

const API = process.env.REACT_APP_API_URL;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fmtINR(n) {
  if (n == null || n === '-') return '—';
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
function fmtNum(n) {
  if (n == null || n === '-') return '—';
  return Number(n).toLocaleString('en-IN');
}
function stockColor(s) {
  if (s === 0)   return '#EA5455';
  if (s <= 50)   return '#FF9F43';
  if (s <= 200)  return '#00CFE8';
  return '#28C76F';
}
function stockLabel(s) {
  if (s === 0)  return 'Out of Stock';
  if (s <= 50)  return 'Low Stock';
  if (s <= 200) return 'Medium';
  return 'In Stock';
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DONUT_COLORS = ['#0f5447','#28C76F','#FF9F43','#EA5455','#00CFE8','#9B59B6'];
const STATUS_CONFIG = [
  { key:'processing',       label:'Processing',        color:'#FF9F43' },
  { key:'confirmed',        label:'Confirmed',         color:'#00CFE8' },
  { key:'shipped',          label:'Shipped',           color:'#0f5447' },
  { key:'out_for_delivery', label:'Out for Delivery',  color:'#4BC0C0' },
  { key:'delivered',        label:'Delivered',         color:'#28C76F' },
  { key:'cancelled',        label:'Cancelled',         color:'#EA5455' },
  { key:'refunded',         label:'Refunded',          color:'#B8B8B8' },
];

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const T = {
  bg:       '#F0F4F2',
  surface:  '#FFFFFF',
  border:   '#EAEAEC',
  primary:  '#0f5447',
  primaryBg:'#e8f5f0',
  green:    '#28C76F',
  greenBg:  '#E8F8F0',
  orange:   '#FF9F43',
  orangeBg: '#FFF2E5',
  blue:     '#2E8FDD',
  blueBg:   '#E5F0FF',
  red:      '#EA5455',
  redBg:    '#FFEAEA',
  text:     '#2E263D',
  muted:    '#A0A3B1',
};

/* ─── Shared card style ──────────────────────────────────────────────────── */
const card = {
  background: 'linear-gradient(145deg, #ffffff 0%, #fcfdfe 100%)',
  borderRadius: 16,
  border: '1px solid #e8f0ed',
  padding: '24px',
  boxShadow: '0 8px 24px rgba(15, 84, 71, 0.03)',
};

/* ─── Chip / Pill ────────────────────────────────────────────────────────── */
function Pill({ label, bg, color }) {
  return (
    <span style={{ display:'inline-block', fontSize:11, fontWeight:600, padding:'2px 9px',
      borderRadius:20, background:bg, color }}>
      {label}
    </span>
  );
}

/* ─── Growth badge ───────────────────────────────────────────────────────── */
function Badge({ up, children }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:11, fontWeight:700,
      padding:'2px 8px', borderRadius:20,
      background: up ? T.greenBg : T.redBg,
      color: up ? T.green : T.red }}>
      {up ? '▲' : '▼'} {children}
    </span>
  );
}

/* ─── Icon box ───────────────────────────────────────────────────────────── */
function IconBox({ icon, bg, size = 44 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:10, background:bg,
      display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
      {icon}
    </div>
  );
}

/* ─── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, badge, badgeUp, icon, iconBg, loading }) {
  return (
    <div style={{
      ...card,
      display:'flex',
      justifyContent:'space-between',
      alignItems:'flex-start',
      position: 'relative',
      overflow: 'hidden',
      borderLeft: `4px solid ${iconBg === T.primaryBg ? T.primary : iconBg === T.greenBg ? T.green : iconBg === T.orangeBg ? T.orange : T.blue}`,
      transition: 'all 0.3s ease'
    }}>
      <div>
        <div style={{ fontSize:11, color:T.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.7px', marginBottom:6 }}>{label}</div>
        <div style={{ fontSize:26, fontWeight:800, color:T.text, lineHeight:1.1, marginBottom:6 }}>
          {loading ? '—' : value}
        </div>
        {badge && !loading && <Badge up={badgeUp}>{badge}</Badge>}
        {sub && !loading && <div style={{ fontSize:11, color:T.muted, marginTop:6, fontWeight:500 }}>{sub}</div>}
      </div>
      <IconBox icon={icon} bg={iconBg} />
    </div>
  );
}

/* ─── Section header ─────────────────────────────────────────────────────── */
function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{title}</div>
        {sub && <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{sub}</div>}
      </div>
      {action && (
        <button style={{ fontSize:12, fontWeight:600, color:T.primary, background:T.primaryBg,
          border:'none', padding:'5px 13px', borderRadius:8, cursor:'pointer' }}>
          {action}
        </button>
      )}
    </div>
  );
}

/* ─── Custom chart tooltip ───────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8,
      padding:'8px 14px', boxShadow:'0 4px 16px rgba(0,0,0,0.08)', fontSize:12 }}>
      <div style={{ fontWeight:700, color:T.text, marginBottom:4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color:p.color, fontWeight:600 }}>
          {p.name}: {p.name === 'Revenue' ? fmtINR(p.value) : fmtNum(p.value)}
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════════════ */
export default function Dashboard({ showToast }) {
  const STORAGE_KEY = 'kalpana_low_stock_threshold';
  const [threshold,        setThreshold]        = useState(parseInt(localStorage.getItem(STORAGE_KEY)) || 10);
  const [recentProducts,   setRecentProducts]   = useState([]);
  const [allProducts,      setAllProducts]      = useState([]);
  const [allOrders,        setAllOrders]        = useState([]);
  const [allCustomers,     setAllCustomers]     = useState([]);
  const [productsLoading,  setProductsLoading]  = useState(true);
  const [ordersLoading,    setOrdersLoading]    = useState(true);
  const [customersLoading, setCustomersLoading] = useState(true);

  useEffect(() => {
    const onS = e => { if (e.key === STORAGE_KEY) setThreshold(parseInt(e.newValue) || 10); };
    const onC = e => setThreshold(e.detail);
    window.addEventListener('storage', onS);
    window.addEventListener('kalpana_threshold_change', onC);
    return () => {
      window.removeEventListener('storage', onS);
      window.removeEventListener('kalpana_threshold_change', onC);
    };
  }, []);

  useEffect(() => {
    fetch(`${API}/products`)
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : [];
        setAllProducts(list);
        setRecentProducts([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10));
      })
      .catch(() => showToast?.('Failed to load products'))
      .finally(() => setProductsLoading(false));
  }, [showToast]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    fetch(`${API}/orders/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setAllOrders(Array.isArray(d.orders) ? d.orders : []))
      .catch(() => showToast?.('Failed to load orders'))
      .finally(() => setOrdersLoading(false));
  }, [showToast]);

  // ── Fetch both registered customers AND derive unique customers from orders ──
  useEffect(() => {
    const token = localStorage.getItem('adminToken');

   const fetchRegistered = fetch(`${API}/user`, {
  headers: { Authorization: `Bearer ${token}` },
})
  .then(r => r.json())
  .then(d => (Array.isArray(d) ? d : d.users || []))
  .catch(() => []);
    fetchRegistered.then(registered => {
      setAllCustomers(registered);
      setCustomersLoading(false);
    });
  }, [showToast]);

  /* ── Derived: unique customers across registered + orders ────────────── */
  const uniqueCustomerCount = useMemo(() => {
    // Collect all unique identifiers from registered customers
    const emails  = new Set();
    const phones  = new Set();
    const ids     = new Set();

    allCustomers.forEach(c => {
      if (c.id)    ids.add(String(c.id));
      if (c.email) emails.add(c.email.toLowerCase().trim());
      if (c.phone) phones.add(c.phone.trim());
    });

    // Walk through orders and count customers not already in the registered set
    let extraFromOrders = 0;
    allOrders.forEach(o => {
      const orderEmail = (o.email || o.customerEmail || o.Customer?.email || '').toLowerCase().trim();
      const orderPhone = (o.phone || o.customerPhone || o.Customer?.phone || '').trim();
      const customerId = o.customerId || o.customer_id || o.Customer?.id;

      const alreadyKnown =
        (customerId && ids.has(String(customerId))) ||
        (orderEmail && emails.has(orderEmail))      ||
        (orderPhone && phones.has(orderPhone));

      if (!alreadyKnown) {
        // New unique customer found only in orders
        extraFromOrders++;
        if (orderEmail) emails.add(orderEmail);
        if (orderPhone) phones.add(orderPhone);
        if (customerId) ids.add(String(customerId));
      }
    });

    return allCustomers.length + extraFromOrders;
  }, [allCustomers, allOrders]);

  /* ── Derived: new customers this month (from orders) ────────────────── */
  const newCustomersThisMonth = useMemo(() => {
    const now    = new Date();
    const thisM  = now.getMonth();
    const thisY  = now.getFullYear();
    const seen   = new Set();

    allOrders.forEach(o => {
      const d = new Date(o.createdAt);
      if (d.getMonth() === thisM && d.getFullYear() === thisY) {
        const key =
          o.customerId ||
          o.customer_id ||
          o.Customer?.id ||
          (o.email || o.customerEmail || '').toLowerCase().trim() ||
          (o.phone || o.customerPhone || '').trim();
        if (key) seen.add(String(key));
      }
    });

    // Also count registered customers created this month
    allCustomers.forEach(c => {
      const d = new Date(c.createdAt);
      if (d.getMonth() === thisM && d.getFullYear() === thisY) {
        seen.add(String(c.id));
      }
    });

    return seen.size;
  }, [allCustomers, allOrders]);

  /* ── Derived: sales ──────────────────────────────────────────────────── */
  const sales = useMemo(() => {
    const delivered = allOrders.filter(o => o.status === 'delivered');
    const cancelled = allOrders.filter(o => o.status === 'cancelled');
    const refunded  = allOrders.filter(o => o.status === 'refunded');
    const totalRevenue = delivered.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const aov = delivered.length ? totalRevenue / delivered.length : 0;

    const now = new Date(), thisM = now.getMonth(), thisY = now.getFullYear();
    const revOfMonth = (m, y) =>
      delivered
        .filter(o => { const d = new Date(o.createdAt); return d.getMonth() === m && d.getFullYear() === y; })
        .reduce((s, o) => s + (Number(o.total) || 0), 0);

    const lastM = (thisM + 11) % 12, lastY = thisM === 0 ? thisY - 1 : thisY;
    const growth = revOfMonth(lastM, lastY)
      ? ((revOfMonth(thisM, thisY) - revOfMonth(lastM, lastY)) / revOfMonth(lastM, lastY) * 100).toFixed(1)
      : 0;

    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const m = (thisM - i + 12) % 12, y = thisM - i < 0 ? thisY - 1 : thisY;
      monthlyData.push({
        month: MONTH_NAMES[m],
        revenue: revOfMonth(m, y),
        orders: allOrders.filter(o => {
          const d = new Date(o.createdAt);
          return d.getMonth() === m && d.getFullYear() === y;
        }).length,
      });
    }

    const statusCounts = {};
    allOrders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

    return {
      totalRevenue, aov,
      ordersCount: allOrders.length,
      deliveredCount: delivered.length,
      growth: Number(growth),
      cancellations: cancelled.length,
      refunds: refunded.length,
      monthlyData,
      statusCounts,
    };
  }, [allOrders]);

  /* ── Derived: products ───────────────────────────────────────────────── */
  const products = useMemo(() => {
    const nameToId = {};
    allProducts.forEach(p => { if (p.productName) nameToId[p.productName.toLowerCase().trim()] = p.id; });

    const salesByProduct = {}, salesByName = {};
    allOrders.filter(o => o.status === 'delivered').forEach(o => {
      const items = o.OrderItems || o.orderItems || o.order_items || o.items || [];
      items.forEach(item => {
        const qty  = Number(item.quantity) || 1;
        const pid  = item.product_id || item.productId || item.ProductId || null;
        const key  = (item.name || item.productName || '').toLowerCase().trim();
        if (pid) salesByProduct[String(pid)] = (salesByProduct[String(pid)] || 0) + qty;
        if (key) {
          salesByName[key] = (salesByName[key] || 0) + qty;
          if (!pid && nameToId[key]) salesByProduct[String(nameToId[key])] = (salesByProduct[String(nameToId[key])] || 0) + qty;
        }
      });
    });

    const enriched = allProducts.map(p => {
      const stock = Number(p.stock) || 0;
      const nameKey = p.productName?.toLowerCase().trim() || '';
      const s = salesByProduct[String(p.id)] || salesByName[nameKey] || Number(p.salesCount ?? p.totalSales ?? 0);
      return { id: p.id, name: p.productName, category: p.Category?.name || '—', stock, sales: s, price: Number(p.salesPrice) || 0, mrp: Number(p.mrp) ?? 0 };
    });

    const lowStock = [], outOfStock = [];
    allProducts.forEach(p => {
      const entry = { productId: p.id, productName: p.productName, category: p.Category?.name || '—', stock: Number(p.stock) || 0, salesPrice: Number(p.salesPrice) || 0, mrp: Number(p.mrp) || 0 };
      if (entry.stock === 0) outOfStock.push(entry);
      else if (entry.stock <= threshold) lowStock.push(entry);
    });
    lowStock.sort((a, b) => a.stock - b.stock);

    const byCategory = {};
    enriched.forEach(p => {
      if (!byCategory[p.category]) byCategory[p.category] = { name: p.category, products: 0, stock: 0, sales: 0 };
      byCategory[p.category].products++;
      byCategory[p.category].stock += p.stock;
      byCategory[p.category].sales += p.sales;
    });

    return {
      enriched, lowStock, outOfStock,
      bestSelling: [...enriched].sort((a, b) => b.sales - a.sales).slice(0, 5),
      topPerformers: [...enriched].sort((a, b) => b.sales - a.sales).slice(0, 6),
      categoryData: Object.values(byCategory).sort((a, b) => b.products - a.products).slice(0, 6),
      totalStock: enriched.reduce((s, p) => s + p.stock, 0),
      highStock: enriched.filter(p => p.stock > 200).length,
    };
  }, [allProducts, allOrders, threshold]);

  const isCustomersLoading = customersLoading || ordersLoading;
  const badgeStyles = {
    success: "bg-emerald-50 text-emerald-700",
    danger: "bg-red-50 text-red-700",
    neutral: "bg-slate-100 text-slate-600",
  };

  const MetricCard = ({ icon, iconBg, iconColor, label, value, badge, badgeType, loading }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-3"
        style={{ background: iconBg }}
      >
        <i className={`${icon} text-[18px]`} style={{ color: iconColor }} />
      </div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-[22px] font-medium mb-1.5">{loading ? "—" : value}</p>
      {!loading && (
        <span className={`text-[11px] px-1.5 py-0.5 rounded ${badgeStyles[badgeType]}`}>
          {badge}
        </span>
      )}
    </div>
  );

  const StatusPill = ({ status }) => {
    const map = {
      Processing: "bg-amber-50 text-amber-700",
      Confirmed: "bg-blue-50 text-blue-700",
      Shipped: "bg-purple-50 text-purple-700",
      Delivered: "bg-emerald-50 text-emerald-700",
      Cancelled: "bg-red-50 text-red-700",
      Refunded: "bg-slate-100 text-slate-600",
    };
    const key = status ? status.charAt(0).toUpperCase() + status.slice(1) : "";
    return (
      <span className={`text-[11px] px-2 py-1 rounded-md ${map[key] || "bg-slate-100 text-slate-600"}`}>
        {key || status}
      </span>
    );
  };

  const metrics = [
    {
      icon: "ti ti-currency-rupee",
      iconBg: "#ECFDF5",
      iconColor: "#059669",
      label: "Total revenue",
      value: fmtINR(sales.totalRevenue),
      badge: `${sales.growth > 0 ? '▲' : '▼'} ${Math.abs(sales.growth)}% this month`,
      badgeType: sales.growth >= 0 ? "success" : "danger",
      loading: ordersLoading
    },
    {
      icon: "ti ti-shopping-cart",
      iconBg: "#EFF6FF",
      iconColor: "#2563EB",
      label: "Total orders",
      value: fmtNum(sales.ordersCount),
      badge: `${sales.cancellations} cancelled`,
      badgeType: sales.cancellations > 0 ? "danger" : "neutral",
      loading: ordersLoading
    },
    {
      icon: "ti ti-box",
      iconBg: "#FFFBEB",
      iconColor: "#D97706",
      label: "Total products",
      value: fmtNum(allProducts.length),
      badge: `${products.outOfStock.length} out of stock`,
      badgeType: products.outOfStock.length > 0 ? "danger" : "success",
      loading: productsLoading
    },
    {
      icon: "ti ti-users",
      iconBg: "#F5F3FF",
      iconColor: "#7C3AED",
      label: "Total customers",
      value: fmtNum(uniqueCustomerCount),
      badge: `▲ ${newCustomersThisMonth} this month`,
      badgeType: "success",
      loading: isCustomersLoading
    },
  ];

  const recentOrders = allOrders.slice(0, 5).map(o => ({
    id: o.id || o.orderId || `#${o.id}`,
    status: o.status
  }));

  return (
    <div className="p-6 bg-slate-50 min-h-screen" style={{ fontFamily: '"Public Sans","Inter",sans-serif' }}>
      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Chart + category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[15px] font-medium text-slate-900">Revenue and orders</p>
              <p className="text-xs text-slate-400">Last 6 months performance</p>
            </div>
            <div className="flex gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Revenue
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Orders
              </span>
            </div>
          </div>
          {ordersLoading ? (
            <div className="w-full h-40 flex items-center justify-center text-sm text-slate-400">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={sales.monthlyData} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#059669" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#F0F0F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="rev" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue"
                  stroke="#059669" strokeWidth={2.5} fill="url(#gRev)" dot={false} />
                <Line yAxisId="ord" type="monotone" dataKey="orders" name="Orders"
                  stroke="#2563EB" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-[15px] font-medium text-slate-900">Sales overview</p>
          <p className="text-xs text-slate-400 mb-4">Category distribution</p>
          {productsLoading ? (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : products.categoryData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm flex-col gap-2">
              <i className="ti ti-chart-pie text-[28px]" />
              No category data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={128}>
              <PieChart>
                <Pie data={products.categoryData} dataKey="products" nameKey="name"
                  cx="50%" cy="50%" outerRadius={50} innerRadius={30} paddingAngle={2}
                  labelLine={false}>
                  {products.categoryData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, _, p) => [`${v} products`, p.payload.name]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Orders + inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-[15px] font-medium text-slate-900">Recent orders</p>
          <p className="text-xs text-slate-400 mb-3">{ordersLoading ? 'Loading…' : `${allOrders.length} total orders`}</p>
          <table className="w-full text-sm">
            <tbody>
              {recentOrders.map((o, i) => (
                <tr
                  key={o.id}
                  className={i !== recentOrders.length - 1 ? "border-b border-slate-100" : ""}
                >
                  <td className="py-2 text-slate-500 font-mono">{o.id}</td>
                  <td className="py-2 text-right">
                    <StatusPill status={o.status} />
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && !ordersLoading && (
                <tr><td className="py-2 text-slate-500">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-[15px] font-medium text-slate-900">Inventory alerts</p>
          <p className="text-xs text-slate-400 mb-3">Low and out of stock</p>
          {productsLoading ? (
            <div className="text-sm text-slate-400">Loading…</div>
          ) : (products.outOfStock.length === 0 && products.lowStock.length === 0) ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2.5 rounded-lg">
              <i className="ti ti-check text-base" />
              All products in stock
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {[...products.outOfStock, ...products.lowStock].slice(0, 5).map(v => (
                <div key={v.productId} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                  <span className="truncate max-w-[140px] text-slate-600">{v.productName}</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${v.stock === 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                    {v.stock === 0 ? 'Out' : `${v.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}