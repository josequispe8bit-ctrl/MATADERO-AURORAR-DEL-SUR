import { useState, useRef } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  Users, ClipboardList, Coins, BarChart3, Package, Plus,
  Pencil, Trash2, Search, X, FileText, Download, Beef,
  AlertTriangle, CheckCircle, LogOut
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const CHART_COLORS = ["#c47a3a", "#d99a5e", "#5a9e5a", "#5a8e9e", "#c4a03a", "#8b5a2b"];

const TABS = [
  { key: "clients", label: "Clients", icon: Users },
  { key: "faenas", label: "Faenas", icon: ClipboardList },
  { key: "cobros", label: "Cobros", icon: Coins },
  { key: "inventory", label: "Inventory", icon: Package },
  { key: "resumen", label: "Resumen", icon: BarChart3 },
];

export default function Home() {
  const { user, logout } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState("clients");
  const [monthFilter, setMonthFilter] = useState(format(new Date(), "yyyy-MM"));
  const [logo, setLogo] = useState<string | null>(localStorage.getItem("aurora_logo"));
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Client form state
  const [clientModal, setClientModal] = useState(false);
  const [clientForm, setClientForm] = useState({ id: 0, name: "", price: "", frequency: "Semanal" });
  const [clientSearch, setClientSearch] = useState("");

  // Faena form state
  const [faenaModal, setFaenaModal] = useState(false);
  const [faenaForm, setFaenaForm] = useState({ id: 0, clientId: "", date: format(new Date(), "yyyy-MM-dd"), quantity: "", unitPrice: "" });
  const [faenaFilter, setFaenaFilter] = useState({ from: "", to: "", clientId: "" });

  // Cobro form state
  const [cobroModal, setCobroModal] = useState(false);
  const [cobroForm, setCobroForm] = useState({ id: 0, clientId: "", date: format(new Date(), "yyyy-MM-dd"), amount: "", description: "" });
  const [cobroFilter, setCobroFilter] = useState({ from: "", to: "", clientId: "" });

  // Inventory form state
  const [invModal, setInvModal] = useState(false);
  const [invForm, setInvForm] = useState({ id: 0, name: "", category: "general", quantity: "", unit: "unidad", minStock: "" });
  const [movementModal, setMovementModal] = useState(false);
  const [movementForm, setMovementForm] = useState({ inventoryId: "", type: "entry" as "entry" | "exit", quantity: "", reason: "", date: format(new Date(), "yyyy-MM-dd") });

  // tRPC queries
  const utils = trpc.useUtils();
  const clientsQuery = trpc.clients.list.useQuery({ search: clientSearch || undefined });
  const faenasQuery = trpc.faena.list.useQuery({
    from: faenaFilter.from || undefined,
    to: faenaFilter.to || undefined,
    clientId: faenaFilter.clientId ? parseInt(faenaFilter.clientId) : undefined,
  });
  const cobrosQuery = trpc.payment.list.useQuery({
    from: cobroFilter.from || undefined,
    to: cobroFilter.to || undefined,
    clientId: cobroFilter.clientId ? parseInt(cobroFilter.clientId) : undefined,
  });
  const inventoryQuery = trpc.inventory.list.useQuery();
  const summaryQuery = trpc.summary.monthly.useQuery({ month: monthFilter });
  const historicalQuery = trpc.summary.historical.useQuery();
  const dashboardQuery = trpc.summary.dashboard.useQuery();

  // tRPC mutations
  const createClient = trpc.clients.create.useMutation({
    onSuccess: () => { utils.clients.list.invalidate(); addToast("Client created successfully", "success"); setClientModal(false); },
    onError: (e) => addToast(e.message, "error"),
  });
  const updateClient = trpc.clients.update.useMutation({
    onSuccess: () => { utils.clients.list.invalidate(); addToast("Client updated successfully", "success"); setClientModal(false); },
    onError: (e) => addToast(e.message, "error"),
  });
  const deleteClient = trpc.clients.delete.useMutation({
    onSuccess: () => { utils.clients.list.invalidate(); addToast("Client deleted", "success"); },
    onError: (e) => addToast(e.message, "error"),
  });

  const createFaena = trpc.faena.create.useMutation({
    onSuccess: () => { utils.faena.list.invalidate(); utils.summary.dashboard.invalidate(); addToast("Faena registered successfully", "success"); setFaenaModal(false); },
    onError: (e) => addToast(e.message, "error"),
  });
  const updateFaena = trpc.faena.update.useMutation({
    onSuccess: () => { utils.faena.list.invalidate(); utils.summary.dashboard.invalidate(); addToast("Faena updated successfully", "success"); setFaenaModal(false); },
    onError: (e) => addToast(e.message, "error"),
  });
  const deleteFaena = trpc.faena.delete.useMutation({
    onSuccess: () => { utils.faena.list.invalidate(); utils.summary.dashboard.invalidate(); addToast("Faena deleted", "success"); },
    onError: (e) => addToast(e.message, "error"),
  });

  const createCobro = trpc.payment.create.useMutation({
    onSuccess: () => { utils.payment.list.invalidate(); utils.summary.dashboard.invalidate(); addToast("Payment recorded successfully", "success"); setCobroModal(false); },
    onError: (e) => addToast(e.message, "error"),
  });
  const deleteCobro = trpc.payment.delete.useMutation({
    onSuccess: () => { utils.payment.list.invalidate(); utils.summary.dashboard.invalidate(); addToast("Payment deleted", "success"); },
    onError: (e) => addToast(e.message, "error"),
  });

  const createInv = trpc.inventory.create.useMutation({
    onSuccess: () => { utils.inventory.list.invalidate(); addToast("Inventory item created", "success"); setInvModal(false); },
    onError: (e) => addToast(e.message, "error"),
  });
  const updateInv = trpc.inventory.update.useMutation({
    onSuccess: () => { utils.inventory.list.invalidate(); addToast("Inventory item updated", "success"); setInvModal(false); },
    onError: (e) => addToast(e.message, "error"),
  });
  const deleteInv = trpc.inventory.delete.useMutation({
    onSuccess: () => { utils.inventory.list.invalidate(); addToast("Inventory item deleted", "success"); },
    onError: (e) => addToast(e.message, "error"),
  });
  const movementInv = trpc.inventory.movement.useMutation({
    onSuccess: () => { utils.inventory.list.invalidate(); addToast("Stock movement recorded", "success"); setMovementModal(false); },
    onError: (e) => addToast(e.message, "error"),
  });

  // Logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      localStorage.setItem("aurora_logo", base64);
      setLogo(base64);
    };
    reader.readAsDataURL(file);
  };

  // Helpers
  const formatBs = (n: number) => `Bs ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  const resetClientForm = () => setClientForm({ id: 0, name: "", price: "", frequency: "Semanal" });
  const resetFaenaForm = () => setFaenaForm({ id: 0, clientId: "", date: format(new Date(), "yyyy-MM-dd"), quantity: "", unitPrice: "" });
  const resetCobroForm = () => setCobroForm({ id: 0, clientId: "", date: format(new Date(), "yyyy-MM-dd"), amount: "", description: "" });
  const resetInvForm = () => setInvForm({ id: 0, name: "", category: "general", quantity: "", unit: "unidad", minStock: "" });

  const openClientModal = (c?: typeof clientForm) => {
    if (c) setClientForm(c);
    else resetClientForm();
    setClientModal(true);
  };

  const openFaenaModal = (f?: typeof faenaForm) => {
    if (f) setFaenaForm(f);
    else resetFaenaForm();
    setFaenaModal(true);
  };

  const openCobroModal = (c?: typeof cobroForm) => {
    if (c) setCobroForm(c);
    else resetCobroForm();
    setCobroModal(true);
  };

  const openInvModal = (i?: typeof invForm) => {
    if (i) setInvForm(i);
    else resetInvForm();
    setInvModal(true);
  };

  // Calculate client balance
  const getClientBalance = (clientId: number) => {
    if (!faenasQuery.data || !cobrosQuery.data) return 0;
    const ventas = faenasQuery.data
      .filter((f) => f.clientId === clientId)
      .reduce((s, f) => s + f.quantity * f.unitPrice, 0);
    const cobrosTotal = cobrosQuery.data
      .filter((c) => c.clientId === clientId)
      .reduce((s, c) => s + c.amount, 0);
    return ventas - cobrosTotal;
  };

  // Auto-fill price when client selected in faena form
  const handleFaenaClientChange = (clientId: string) => {
    const client = clientsQuery.data?.find((c) => c.id === parseInt(clientId));
    setFaenaForm((prev) => ({
      ...prev,
      clientId,
      unitPrice: client ? String(client.price) : prev.unitPrice,
    }));
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Frigorifico Aurora del Sur - Resumen", 14, 20);
    doc.setFontSize(10);
    doc.text(`Mes: ${monthFilter}`, 14, 28);

    if (summaryQuery.data) {
      const tableData = summaryQuery.data.map((s) => [
        s.clientName,
        String(s.cantidadFaenada),
        formatBs(s.ventasMes),
        formatBs(s.cobrosMes),
        formatBs(s.saldoMes),
      ]);
      autoTable(doc, {
        head: [["Cliente", "Cant. Faenada", "Ventas", "Cobros", "Saldo"]],
        body: tableData,
        startY: 35,
      });
    }

    if (historicalQuery.data) {
      const histData = historicalQuery.data.map((s) => [
        s.clientName,
        String(s.totalCantidad),
        formatBs(s.totalVentas),
        formatBs(s.totalCobros),
        formatBs(s.deudaPendiente),
      ]);
      autoTable(doc, {
        head: [["Cliente", "Total Faenado", "Ventas Totales", "Cobros Totales", "Deuda"]],
        body: histData,
        startY: (doc as any).lastAutoTable?.finalY + 10 || 100,
      });
    }

    doc.save(`resumen-${monthFilter}.pdf`);
    addToast("PDF exported successfully", "success");
  };

  // Export Excel
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    if (summaryQuery.data) {
      const ws1 = XLSX.utils.json_to_sheet(
        summaryQuery.data.map((s) => ({
          Cliente: s.clientName,
          "Cant. Faenada": s.cantidadFaenada,
          "Ventas del mes": s.ventasMes,
          "Cobros del mes": s.cobrosMes,
          "Saldo del mes": s.saldoMes,
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws1, "Mensual");
    }

    if (historicalQuery.data) {
      const ws2 = XLSX.utils.json_to_sheet(
        historicalQuery.data.map((s) => ({
          Cliente: s.clientName,
          "Total Faenado": s.totalCantidad,
          "Ventas totales": s.totalVentas,
          "Cobros totales": s.totalCobros,
          "Deuda pendiente": s.deudaPendiente,
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws2, "Historico");
    }

    XLSX.writeFile(wb, `resumen-${monthFilter}.xlsx`);
    addToast("Excel exported successfully", "success");
  };

  return (
    <div className="min-h-screen wood-bg">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-enter flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${
              t.type === "success" ? "bg-[#5a9e5a]" :
              t.type === "error" ? "bg-[#c44a4a]" :
              t.type === "warning" ? "bg-[#c4a03a]" : "bg-[#5a8e9e]"
            }`}
          >
            {t.type === "success" && <CheckCircle size={16} />}
            {t.type === "error" && <AlertTriangle size={16} />}
            {t.message}
            <button onClick={() => removeToast(t.id)} className="ml-2 opacity-70 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Navbar */}
      <nav className="leather-navbar sticky top-0 z-50 h-16">
        <div className="max-w-[1600px] mx-auto h-full flex items-center justify-between px-4 lg:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg border-2 border-dashed border-white/30 flex items-center justify-center cursor-pointer hover:border-white/60 hover:scale-105 transition-all overflow-hidden bg-white/10"
              onClick={() => logoInputRef.current?.click()}
              title="Click to change logo"
            >
              {logo ? (
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Beef size={20} className="text-white" />
              )}
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <div>
              <span className="text-white font-bold text-base tracking-tight">Frigorifico Aurora del Sur</span>
              <div className="text-white/50 text-[10px]">click logo</div>
            </div>
          </div>

          {/* Tab Pills */}
          <div className="hidden md:flex items-center bg-white/[0.12] backdrop-blur-md rounded-full p-1 border border-white/[0.08]">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all ${
                    isActive
                      ? "bg-white text-[#3d2b1f] shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
                      : "text-white/60 hover:text-white/85 hover:bg-white/[0.06]"
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right: Month filter + User */}
          <div className="flex items-center gap-3">
            {activeTab === "resumen" && (
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="bg-white/10 border border-white/15 rounded-lg text-white text-[13px] px-3 py-2 outline-none focus:border-white/40"
              />
            )}
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-white/80 text-[13px] hidden sm:inline">{user.name || "User"}</span>
                <button
                  onClick={logout}
                  className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Tabs */}
      <div className="md:hidden flex overflow-x-auto bg-[#faf8f3] border-b border-[#e8e4dc] px-2 py-2 gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#c47a3a] text-white"
                  : "text-[#5e5e5e] hover:bg-[#f0ece4]"
              }`}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-4 lg:p-6">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = TABS.find((t) => t.key === activeTab)?.icon || Users;
              return <Icon size={20} className="text-[#c47a3a]" />;
            })()}
            <h1 className="text-xl font-bold text-[#2c2c2c]">
              {TABS.find((t) => t.key === activeTab)?.label} Management
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search / Filters per tab */}
            {activeTab === "clients" && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8c8c]" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 bg-[#ede9e0] border border-[#d4d0c8] rounded-full text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15 w-52"
                />
              </div>
            )}

            {activeTab === "faenas" && (
              <>
                <input
                  type="date"
                  value={faenaFilter.from}
                  onChange={(e) => setFaenaFilter((p) => ({ ...p, from: e.target.value }))}
                  className="px-3 py-2 bg-[#ede9e0] border border-[#d4d0c8] rounded-lg text-[13px] outline-none focus:border-[#c47a3a]"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={faenaFilter.to}
                  onChange={(e) => setFaenaFilter((p) => ({ ...p, to: e.target.value }))}
                  className="px-3 py-2 bg-[#ede9e0] border border-[#d4d0c8] rounded-lg text-[13px] outline-none focus:border-[#c47a3a]"
                  placeholder="To"
                />
                <select
                  value={faenaFilter.clientId}
                  onChange={(e) => setFaenaFilter((p) => ({ ...p, clientId: e.target.value }))}
                  className="px-3 py-2 bg-[#ede9e0] border border-[#d4d0c8] rounded-lg text-[13px] outline-none focus:border-[#c47a3a]"
                >
                  <option value="">All clients</option>
                  {clientsQuery.data?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setFaenaFilter({ from: "", to: "", clientId: "" })}
                  className="px-3 py-2 border border-[#d4d0c8] text-[#5e5e5e] rounded-full text-[13px] hover:bg-[#f0ece4] transition-colors"
                >
                  Clear
                </button>
              </>
            )}

            {activeTab === "cobros" && (
              <>
                <input
                  type="date"
                  value={cobroFilter.from}
                  onChange={(e) => setCobroFilter((p) => ({ ...p, from: e.target.value }))}
                  className="px-3 py-2 bg-[#ede9e0] border border-[#d4d0c8] rounded-lg text-[13px] outline-none focus:border-[#c47a3a]"
                />
                <input
                  type="date"
                  value={cobroFilter.to}
                  onChange={(e) => setCobroFilter((p) => ({ ...p, to: e.target.value }))}
                  className="px-3 py-2 bg-[#ede9e0] border border-[#d4d0c8] rounded-lg text-[13px] outline-none focus:border-[#c47a3a]"
                />
                <select
                  value={cobroFilter.clientId}
                  onChange={(e) => setCobroFilter((p) => ({ ...p, clientId: e.target.value }))}
                  className="px-3 py-2 bg-[#ede9e0] border border-[#d4d0c8] rounded-lg text-[13px] outline-none focus:border-[#c47a3a]"
                >
                  <option value="">All clients</option>
                  {clientsQuery.data?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setCobroFilter({ from: "", to: "", clientId: "" })}
                  className="px-3 py-2 border border-[#d4d0c8] text-[#5e5e5e] rounded-full text-[13px] hover:bg-[#f0ece4] transition-colors"
                >
                  Clear
                </button>
              </>
            )}

            {activeTab === "resumen" && (
              <div className="flex gap-2">
                <button
                  onClick={exportPDF}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#c47a3a] text-white rounded-full text-[13px] font-semibold hover:bg-[#b06a2e] transition-colors"
                >
                  <FileText size={14} /> Export PDF
                </button>
                <button
                  onClick={exportExcel}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#5a9e5a] text-white rounded-full text-[13px] font-semibold hover:bg-[#4a8e4a] transition-colors"
                >
                  <Download size={14} /> Export Excel
                </button>
              </div>
            )}

            {/* Add button */}
            {activeTab !== "resumen" && (
              <button
                onClick={() => {
                  if (activeTab === "clients") openClientModal();
                  if (activeTab === "faenas") openFaenaModal();
                  if (activeTab === "cobros") openCobroModal();
                  if (activeTab === "inventory") openInvModal();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#c47a3a] text-white rounded-full text-[13px] font-semibold hover:bg-[#b06a2e] transition-colors shadow-sm"
              >
                <Plus size={15} /> New
              </button>
            )}
          </div>
        </div>

        {/* Clients Tab */}
        {activeTab === "clients" && (
          <div className="bg-[#faf8f3] rounded-xl border border-[#e8e4dc] shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#f0ece4] border-b-2 border-[#c47a3a]">
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Price (Bs)</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Frequency</th>
                    <th className="text-right px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Total Ventas</th>
                    <th className="text-right px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Total Cobros</th>
                    <th className="text-right px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Saldo</th>
                    <th className="text-center px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientsQuery.data?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-[#8c8c8c]">
                        <Package size={48} className="mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-medium">No clients found</p>
                        <p className="text-xs mt-1">Add your first client using the + button</p>
                      </td>
                    </tr>
                  )}
                  {clientsQuery.data?.map((client) => {
                    const balance = getClientBalance(client.id);
                    const clientFaenas = faenasQuery.data?.filter((f) => f.clientId === client.id) || [];
                    const clientCobros = cobrosQuery.data?.filter((c) => c.clientId === client.id) || [];
                    const ventas = clientFaenas.reduce((s, f) => s + f.quantity * f.unitPrice, 0);
                    const cobrosTotal = clientCobros.reduce((s, c) => s + c.amount, 0);
                    return (
                      <tr key={client.id} className="table-row-hover border-b border-[#e8e4dc] transition-all" style={{ height: 56 }}>
                        <td className="px-4 py-3 text-[13px] font-semibold text-[#2c2c2c]">{client.name}</td>
                        <td className="px-4 py-3 text-[13px] text-[#2c2c2c]">{formatBs(client.price)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-[#f0ece4] rounded-full text-[11px] font-medium text-[#5e5e5e]">
                            {client.frequency}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-right tabular-nums text-[#2c2c2c]">{formatBs(ventas)}</td>
                        <td className="px-4 py-3 text-[13px] text-right tabular-nums text-[#2c2c2c]">{formatBs(cobrosTotal)}</td>
                        <td className={`px-4 py-3 text-[13px] text-right tabular-nums font-semibold ${balance > 0.005 ? "text-[#c44a4a]" : "text-[#5a9e5a]"}`}>
                          {formatBs(balance)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openClientModal({ id: client.id, name: client.name, price: String(client.price), frequency: client.frequency })}
                              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#f0ece4] transition-colors text-[#5e5e5e]"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete "${client.name}" and all related records?`)) {
                                  deleteClient.mutate({ id: client.id });
                                }
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-50 transition-colors text-[#c44a4a]"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Faenas Tab */}
        {activeTab === "faenas" && (
          <div className="bg-[#faf8f3] rounded-xl border border-[#e8e4dc] shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#f0ece4] border-b-2 border-[#c47a3a]">
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Client</th>
                    <th className="text-right px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Qty</th>
                    <th className="text-right px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Unit Price</th>
                    <th className="text-right px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Total</th>
                    <th className="text-center px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faenasQuery.data?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-[#8c8c8c]">
                        <ClipboardList size={48} className="mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-medium">No faena records found</p>
                        <p className="text-xs mt-1">Add your first record using the + button</p>
                      </td>
                    </tr>
                  )}
                  {faenasQuery.data?.map((f) => (
                    <tr key={f.id} className="table-row-hover border-b border-[#e8e4dc] transition-all" style={{ height: 56 }}>
                      <td className="px-4 py-3 text-[13px] text-[#2c2c2c]">{f.date}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-[#2c2c2c]">{f.clientName}</td>
                      <td className="px-4 py-3 text-[13px] text-right tabular-nums text-[#2c2c2c]">{f.quantity}</td>
                      <td className="px-4 py-3 text-[13px] text-right tabular-nums text-[#2c2c2c]">{formatBs(f.unitPrice)}</td>
                      <td className="px-4 py-3 text-[13px] text-right tabular-nums font-semibold text-[#2c2c2c]">{formatBs(f.total)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openFaenaModal({ id: f.id, clientId: String(f.clientId), date: f.date, quantity: String(f.quantity), unitPrice: String(f.unitPrice) })}
                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#f0ece4] transition-colors text-[#5e5e5e]"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Delete this faena record?")) {
                                deleteFaena.mutate({ id: f.id });
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-50 transition-colors text-[#c44a4a]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cobros Tab */}
        {activeTab === "cobros" && (
          <div className="bg-[#faf8f3] rounded-xl border border-[#e8e4dc] shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#f0ece4] border-b-2 border-[#c47a3a]">
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Client</th>
                    <th className="text-right px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Amount (Bs)</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Description</th>
                    <th className="text-center px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cobrosQuery.data?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-[#8c8c8c]">
                        <Coins size={48} className="mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-medium">No payment records found</p>
                        <p className="text-xs mt-1">Add your first payment using the + button</p>
                      </td>
                    </tr>
                  )}
                  {cobrosQuery.data?.map((c) => (
                    <tr key={c.id} className="table-row-hover border-b border-[#e8e4dc] transition-all" style={{ height: 56 }}>
                      <td className="px-4 py-3 text-[13px] text-[#2c2c2c]">{c.date}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-[#2c2c2c]">{c.clientName}</td>
                      <td className="px-4 py-3 text-[13px] text-right tabular-nums font-semibold text-[#5a9e5a]">{formatBs(c.amount)}</td>
                      <td className="px-4 py-3 text-[13px] text-[#2c2c2c]">{c.description || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => {
                              if (confirm("Delete this payment?")) {
                                deleteCobro.mutate({ id: c.id });
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-50 transition-colors text-[#c44a4a]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div className="bg-[#faf8f3] rounded-xl border border-[#e8e4dc] shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#f0ece4] border-b-2 border-[#c47a3a]">
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Category</th>
                    <th className="text-right px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Quantity</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Unit</th>
                    <th className="text-right px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Min Stock</th>
                    <th className="text-center px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">Status</th>
                    <th className="text-center px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryQuery.data?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-[#8c8c8c]">
                        <Package size={48} className="mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-medium">No inventory items found</p>
                        <p className="text-xs mt-1">Add your first item using the + button</p>
                      </td>
                    </tr>
                  )}
                  {inventoryQuery.data?.map((item) => {
                    const isLow = item.minStock > 0 && item.quantity <= item.minStock;
                    return (
                      <tr key={item.id} className="table-row-hover border-b border-[#e8e4dc] transition-all" style={{ height: 56 }}>
                        <td className="px-4 py-3 text-[13px] font-semibold text-[#2c2c2c]">{item.name}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-[#f0ece4] rounded-full text-[11px] font-medium text-[#5e5e5e] capitalize">
                            {item.category}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-[13px] text-right tabular-nums font-semibold ${isLow ? "text-[#c44a4a]" : "text-[#2c2c2c]"}`}>
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#5e5e5e]">{item.unit}</td>
                        <td className="px-4 py-3 text-[13px] text-right tabular-nums text-[#5e5e5e]">{item.minStock}</td>
                        <td className="px-4 py-3 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-[#c44a4a] rounded-full text-[11px] font-semibold">
                              <AlertTriangle size={11} /> Low
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-[#5a9e5a] rounded-full text-[11px] font-semibold">
                              <CheckCircle size={11} /> OK
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setMovementForm({ inventoryId: String(item.id), type: "entry", quantity: "", reason: "", date: format(new Date(), "yyyy-MM-dd") });
                                setMovementModal(true);
                              }}
                              className="px-2 py-1 text-[11px] font-medium bg-[#5a9e5a] text-white rounded-md hover:bg-[#4a8e4a] transition-colors"
                              title="Add stock"
                            >
                              +
                            </button>
                            <button
                              onClick={() => {
                                setMovementForm({ inventoryId: String(item.id), type: "exit", quantity: "", reason: "", date: format(new Date(), "yyyy-MM-dd") });
                                setMovementModal(true);
                              }}
                              className="px-2 py-1 text-[11px] font-medium bg-[#c44a4a] text-white rounded-md hover:bg-[#b43a3a] transition-colors"
                              title="Remove stock"
                            >
                              -
                            </button>
                            <button
                              onClick={() => openInvModal({ id: item.id, name: item.name, category: item.category, quantity: String(item.quantity), unit: item.unit, minStock: String(item.minStock) })}
                              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#f0ece4] transition-colors text-[#5e5e5e]"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete "${item.name}"?`)) {
                                  deleteInv.mutate({ id: item.id });
                                }
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-50 transition-colors text-[#c44a4a]"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resumen Tab */}
        {activeTab === "resumen" && (
          <div className="space-y-6">
            {/* Dashboard Cards */}
            {dashboardQuery.data && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Clients", value: dashboardQuery.data.totalClients, color: "#c47a3a" },
                  { label: "Total Ventas", value: formatBs(dashboardQuery.data.totalVentas), color: "#5a9e5a" },
                  { label: "Total Cobros", value: formatBs(dashboardQuery.data.totalCobros), color: "#5a8e9e" },
                  { label: "Total Deuda", value: formatBs(dashboardQuery.data.totalDeuda), color: "#c44a4a" },
                  { label: "Animales Faenados", value: dashboardQuery.data.totalAnimales, color: "#8b5a2b" },
                  { label: "Low Stock", value: dashboardQuery.data.lowStockCount, color: "#c4a03a" },
                ].map((card) => (
                  <div key={card.label} className="bg-[#faf8f3] rounded-xl border border-[#e8e4dc] p-4 shadow-sm">
                    <p className="text-[11px] font-semibold text-[#8c8c8c] uppercase tracking-wider">{card.label}</p>
                    <p className="text-lg font-bold mt-1" style={{ color: card.color }}>{card.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Low Stock Alerts */}
            {dashboardQuery.data && dashboardQuery.data.lowStockItems.length > 0 && (
              <div className="bg-[#fff8e6] border border-[#c4a03a]/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle size={20} className="text-[#c4a03a] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#8b6a1f]">Low Stock Alert</p>
                  <p className="text-xs text-[#8b6a1f]/80 mt-1">
                    {dashboardQuery.data.lowStockItems.map((i) => `${i.name} (${i.quantity}/${i.minStock})`).join(", ")}
                  </p>
                </div>
              </div>
            )}

            {/* Debt Alerts */}
            {dashboardQuery.data && dashboardQuery.data.totalDeuda > 0 && (
              <div className="bg-[#fff0f0] border border-[#c44a4a]/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle size={20} className="text-[#c44a4a] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#c44a4a]">Pending Debt</p>
                  <p className="text-xs text-[#c44a4a]/80 mt-1">
                    Total outstanding debt: {formatBs(dashboardQuery.data.totalDeuda)}
                  </p>
                </div>
              </div>
            )}

            {/* Monthly Detail Table */}
            <div className="bg-[#faf8f3] rounded-xl border border-[#e8e4dc] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e8e4dc]">
                <h3 className="text-sm font-bold text-[#2c2c2c]">Monthly Detail - {monthFilter}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f0ece4] border-b border-[#e8e4dc]">
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase">Cliente</th>
                      <th className="text-right px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase">Cant. Faenada</th>
                      <th className="text-right px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase">Ventas del mes</th>
                      <th className="text-right px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase">Cobros del mes</th>
                      <th className="text-right px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase">Saldo del mes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryQuery.data?.map((s) => (
                      <tr key={s.clientId} className="border-b border-[#e8e4dc] hover:bg-[#f5f2ec] transition-colors">
                        <td className="px-4 py-3 text-[13px] font-semibold text-[#2c2c2c]">{s.clientName}</td>
                        <td className="px-4 py-3 text-[13px] text-right tabular-nums">{s.cantidadFaenada}</td>
                        <td className="px-4 py-3 text-[13px] text-right tabular-nums">{formatBs(s.ventasMes)}</td>
                        <td className="px-4 py-3 text-[13px] text-right tabular-nums">{formatBs(s.cobrosMes)}</td>
                        <td className={`px-4 py-3 text-[13px] text-right tabular-nums font-semibold ${s.saldoMes > 0.005 ? "text-[#c44a4a]" : "text-[#5a9e5a]"}`}>
                          {formatBs(s.saldoMes)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Pie Chart */}
              <div className="bg-[#faf8f3] rounded-xl border border-[#e8e4dc] p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#5e5e5e] mb-4 flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#c47a3a]" /> Debt Distribution
                </h3>
                {summaryQuery.data && summaryQuery.data.filter((s) => s.saldoMes > 0.005).length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={summaryQuery.data.filter((s) => s.saldoMes > 0.005).map((s) => ({ name: s.clientName, value: s.saldoMes }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {summaryQuery.data
                          .filter((s) => s.saldoMes > 0.005)
                          .map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatBs(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-[#8c8c8c] text-sm">
                    No outstanding debts for this month
                  </div>
                )}
              </div>

              {/* Bar Chart */}
              <div className="bg-[#faf8f3] rounded-xl border border-[#e8e4dc] p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#5e5e5e] mb-4 flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#c47a3a]" /> Sales vs Collections
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={summaryQuery.data?.map((s) => ({ name: s.clientName, Ventas: s.ventasMes, Cobros: s.cobrosMes })) || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#5e5e5e" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#5e5e5e" }} />
                    <Tooltip formatter={(value: number) => formatBs(value)} />
                    <Legend />
                    <Bar dataKey="Ventas" fill="#c47a3a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Cobros" fill="#5a9e5a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Historical Debt Table */}
            <div className="bg-[#faf8f3] rounded-xl border border-[#e8e4dc] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e8e4dc]">
                <h3 className="text-sm font-bold text-[#2c2c2c]">Historical Debt</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f0ece4] border-b border-[#e8e4dc]">
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase">Cliente</th>
                      <th className="text-right px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase">Total Faenado</th>
                      <th className="text-right px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase">Ventas totales</th>
                      <th className="text-right px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase">Cobros totales</th>
                      <th className="text-right px-4 py-3 text-[11px] font-bold text-[#5e5e5e] uppercase">Deuda pendiente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalQuery.data?.map((h) => (
                      <tr key={h.clientId} className="border-b border-[#e8e4dc] hover:bg-[#f5f2ec] transition-colors">
                        <td className="px-4 py-3 text-[13px] font-semibold text-[#2c2c2c]">{h.clientName}</td>
                        <td className="px-4 py-3 text-[13px] text-right tabular-nums">{h.totalCantidad}</td>
                        <td className="px-4 py-3 text-[13px] text-right tabular-nums">{formatBs(h.totalVentas)}</td>
                        <td className="px-4 py-3 text-[13px] text-right tabular-nums">{formatBs(h.totalCobros)}</td>
                        <td className={`px-4 py-3 text-[13px] text-right tabular-nums font-semibold ${h.deudaPendiente > 0.005 ? "text-[#c44a4a]" : "text-[#5a9e5a]"}`}>
                          {formatBs(h.deudaPendiente)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================== MODALS ==================== */}

      {/* Client Modal */}
      {clientModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setClientModal(false)}>
          <div className="absolute inset-0 bg-[#1a1714]/60" />
          <div className="relative bg-[#faf8f3] rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.15)] w-full max-w-md p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#2c2c2c]">{clientForm.id ? "Edit" : "Add"} Client</h2>
              <button onClick={() => setClientModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0ece4] transition-colors">
                <X size={18} className="text-[#5e5e5e]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Name *</label>
                <input
                  type="text"
                  value={clientForm.name}
                  onChange={(e) => setClientForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                  placeholder="Client name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Price (Bs) *</label>
                <input
                  type="number"
                  value={clientForm.price}
                  onChange={(e) => setClientForm((p) => ({ ...p, price: e.target.value }))}
                  className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Frequency</label>
                <select
                  value={clientForm.frequency}
                  onChange={(e) => setClientForm((p) => ({ ...p, frequency: e.target.value }))}
                  className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                >
                  <option>Diario</option>
                  <option>Semanal</option>
                  <option>Quincenal</option>
                  <option>Mensual</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setClientModal(false)} className="flex-1 py-2.5 border border-[#d4d0c8] text-[#5e5e5e] rounded-full text-[13px] font-semibold hover:bg-[#f0ece4] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!clientForm.name.trim() || !clientForm.price) {
                      addToast("Name and price are required", "error");
                      return;
                    }
                    if (clientForm.id) {
                      updateClient.mutate({ id: clientForm.id, name: clientForm.name, price: parseFloat(clientForm.price), frequency: clientForm.frequency as any });
                    } else {
                      createClient.mutate({ name: clientForm.name, price: parseFloat(clientForm.price), frequency: clientForm.frequency as any });
                    }
                  }}
                  className="flex-1 py-2.5 bg-[#c47a3a] text-white rounded-full text-[13px] font-semibold hover:bg-[#b06a2e] transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faena Modal */}
      {faenaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setFaenaModal(false)}>
          <div className="absolute inset-0 bg-[#1a1714]/60" />
          <div className="relative bg-[#faf8f3] rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.15)] w-full max-w-md p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#2c2c2c]">{faenaForm.id ? "Edit" : "Register"} Faena</h2>
              <button onClick={() => setFaenaModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0ece4] transition-colors">
                <X size={18} className="text-[#5e5e5e]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Date *</label>
                <input
                  type="date"
                  value={faenaForm.date}
                  onChange={(e) => setFaenaForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Client *</label>
                <select
                  value={faenaForm.clientId}
                  onChange={(e) => handleFaenaClientChange(e.target.value)}
                  className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                >
                  <option value="">Select client...</option>
                  {clientsQuery.data?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Quantity *</label>
                <input
                  type="number"
                  value={faenaForm.quantity}
                  onChange={(e) => setFaenaForm((p) => ({ ...p, quantity: e.target.value }))}
                  className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                  placeholder="0"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Unit Price (Bs) *</label>
                <input
                  type="number"
                  value={faenaForm.unitPrice}
                  onChange={(e) => setFaenaForm((p) => ({ ...p, unitPrice: e.target.value }))}
                  className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setFaenaModal(false)} className="flex-1 py-2.5 border border-[#d4d0c8] text-[#5e5e5e] rounded-full text-[13px] font-semibold hover:bg-[#f0ece4] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!faenaForm.date || !faenaForm.clientId || !faenaForm.quantity) {
                      addToast("Date, client and quantity are required", "error");
                      return;
                    }
                    const data = {
                      clientId: parseInt(faenaForm.clientId),
                      date: faenaForm.date,
                      quantity: parseInt(faenaForm.quantity),
                      unitPrice: parseFloat(faenaForm.unitPrice) || 0,
                    };
                    if (faenaForm.id) {
                      updateFaena.mutate({ id: faenaForm.id, ...data });
                    } else {
                      createFaena.mutate(data);
                    }
                  }}
                  className="flex-1 py-2.5 bg-[#c47a3a] text-white rounded-full text-[13px] font-semibold hover:bg-[#b06a2e] transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cobro Modal */}
      {cobroModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setCobroModal(false)}>
          <div className="absolute inset-0 bg-[#1a1714]/60" />
          <div className="relative bg-[#faf8f3] rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.15)] w-full max-w-md p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#2c2c2c]">Record Payment</h2>
              <button onClick={() => setCobroModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0ece4] transition-colors">
                <X size={18} className="text-[#5e5e5e]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Date *</label>
                <input
                  type="date"
                  value={cobroForm.date}
                  onChange={(e) => setCobroForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Client *</label>
                <select
                  value={cobroForm.clientId}
                  onChange={(e) => setCobroForm((p) => ({ ...p, clientId: e.target.value }))}
                  className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                >
                  <option value="">Select client...</option>
                  {clientsQuery.data?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} (Balance: {formatBs(getClientBalance(c.id))})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Amount (Bs) *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={cobroForm.amount}
                    onChange={(e) => setCobroForm((p) => ({ ...p, amount: e.target.value }))}
                    className="flex-1 bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                  />
                  <button
                    onClick={() => {
                      if (cobroForm.clientId) {
                        const balance = getClientBalance(parseInt(cobroForm.clientId));
                        if (balance > 0) setCobroForm((p) => ({ ...p, amount: balance.toFixed(2) }));
                      }
                    }}
                    disabled={!cobroForm.clientId}
                    className="px-3 py-2.5 border border-[#c47a3a] text-[#c47a3a] rounded-lg text-[12px] font-semibold hover:bg-[#c47a3a]/5 transition-colors disabled:opacity-40"
                  >
                    Pay All
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Description</label>
                <input
                  type="text"
                  value={cobroForm.description}
                  onChange={(e) => setCobroForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                  placeholder="e.g., weekly payment"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setCobroModal(false)} className="flex-1 py-2.5 border border-[#d4d0c8] text-[#5e5e5e] rounded-full text-[13px] font-semibold hover:bg-[#f0ece4] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!cobroForm.date || !cobroForm.clientId || !cobroForm.amount) {
                      addToast("Date, client and amount are required", "error");
                      return;
                    }
                    createCobro.mutate({
                      clientId: parseInt(cobroForm.clientId),
                      date: cobroForm.date,
                      amount: parseFloat(cobroForm.amount),
                      description: cobroForm.description,
                    });
                  }}
                  className="flex-1 py-2.5 bg-[#c47a3a] text-white rounded-full text-[13px] font-semibold hover:bg-[#b06a2e] transition-colors"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {invModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setInvModal(false)}>
          <div className="absolute inset-0 bg-[#1a1714]/60" />
          <div className="relative bg-[#faf8f3] rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.15)] w-full max-w-md p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#2c2c2c]">{invForm.id ? "Edit" : "Add"} Inventory Item</h2>
              <button onClick={() => setInvModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0ece4] transition-colors">
                <X size={18} className="text-[#5e5e5e]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Name *</label>
                <input
                  type="text"
                  value={invForm.name}
                  onChange={(e) => setInvForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                  placeholder="Item name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Category</label>
                  <select
                    value={invForm.category}
                    onChange={(e) => setInvForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                  >
                    <option value="general">General</option>
                    <option value="ganado">Ganado</option>
                    <option value="carne">Carne</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Unit</label>
                  <select
                    value={invForm.unit}
                    onChange={(e) => setInvForm((p) => ({ ...p, unit: e.target.value }))}
                    className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                  >
                    <option value="unidad">Unidad</option>
                    <option value="kg">Kg</option>
                    <option value="cabezas">Cabezas</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Initial Quantity</label>
                  <input
                    type="number"
                    value={invForm.quantity}
                    onChange={(e) => setInvForm((p) => ({ ...p, quantity: e.target.value }))}
                    className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    value={invForm.minStock}
                    onChange={(e) => setInvForm((p) => ({ ...p, minStock: e.target.value }))}
                    className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setInvModal(false)} className="flex-1 py-2.5 border border-[#d4d0c8] text-[#5e5e5e] rounded-full text-[13px] font-semibold hover:bg-[#f0ece4] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!invForm.name.trim()) {
                      addToast("Name is required", "error");
                      return;
                    }
                    if (invForm.id) {
                      updateInv.mutate({ id: invForm.id, name: invForm.name, category: invForm.category as any, minStock: parseInt(invForm.minStock) || 0 });
                    } else {
                      createInv.mutate({
                        name: invForm.name,
                        category: invForm.category as any,
                        quantity: parseInt(invForm.quantity) || 0,
                        unit: invForm.unit as any,
                        minStock: parseInt(invForm.minStock) || 0,
                      });
                    }
                  }}
                  className="flex-1 py-2.5 bg-[#c47a3a] text-white rounded-full text-[13px] font-semibold hover:bg-[#b06a2e] transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {movementModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setMovementModal(false)}>
          <div className="absolute inset-0 bg-[#1a1714]/60" />
          <div className="relative bg-[#faf8f3] rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.15)] w-full max-w-md p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#2c2c2c]">Stock Movement</h2>
              <button onClick={() => setMovementModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0ece4] transition-colors">
                <X size={18} className="text-[#5e5e5e]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMovementForm((p) => ({ ...p, type: "entry" }))}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                      movementForm.type === "entry" ? "bg-[#5a9e5a] text-white" : "bg-[#ede9e0] text-[#5e5e5e] border border-[#d4d0c8]"
                    }`}
                  >
                    Entry (+)
                  </button>
                  <button
                    onClick={() => setMovementForm((p) => ({ ...p, type: "exit" }))}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                      movementForm.type === "exit" ? "bg-[#c44a4a] text-white" : "bg-[#ede9e0] text-[#5e5e5e] border border-[#d4d0c8]"
                    }`}
                  >
                    Exit (-)
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Quantity *</label>
                <input
                  type="number"
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm((p) => ({ ...p, quantity: e.target.value }))}
                  className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                  placeholder="0"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Reason</label>
                <input
                  type="text"
                  value={movementForm.reason}
                  onChange={(e) => setMovementForm((p) => ({ ...p, reason: e.target.value }))}
                  className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                  placeholder="Reason for movement"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5e5e5e] mb-1">Date</label>
                <input
                  type="date"
                  value={movementForm.date}
                  onChange={(e) => setMovementForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full bg-[#ede9e0] border border-[#d4d0c8] rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-[#c47a3a] focus:ring-2 focus:ring-[#c47a3a]/15"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setMovementModal(false)} className="flex-1 py-2.5 border border-[#d4d0c8] text-[#5e5e5e] rounded-full text-[13px] font-semibold hover:bg-[#f0ece4] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!movementForm.quantity || parseInt(movementForm.quantity) <= 0) {
                      addToast("Quantity must be greater than 0", "error");
                      return;
                    }
                    movementInv.mutate({
                      inventoryId: parseInt(movementForm.inventoryId),
                      type: movementForm.type,
                      quantity: parseInt(movementForm.quantity),
                      reason: movementForm.reason,
                      date: movementForm.date,
                    });
                  }}
                  className="flex-1 py-2.5 bg-[#c47a3a] text-white rounded-full text-[13px] font-semibold hover:bg-[#b06a2e] transition-colors"
                >
                  Record Movement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
