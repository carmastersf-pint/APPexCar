import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Plus, 
  Search,
  Menu,
  X,
  Car,
  Image as ImageIcon,
  Calendar,
  DollarSign,
  PieChart,
  FileText,
  TrendingUp,
  TrendingDown,
  Printer
} from 'lucide-react';
import axios from "axios";
import { toast } from 'sonner';

// Configurar API
const API_URL = import.meta.env.VITE_API_URL || "";
const api = axios.create({
  baseURL: API_URL,
});

// Add interceptor to include token in all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Estados de datos
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [costos, setCostos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados de Modales
  const [isModalOpen, setIsModalOpen] = useState(false); // Cliente
  const [isOrdenModalOpen, setIsOrdenModalOpen] = useState(false); // Orden
  const [selectedOrden, setSelectedOrden] = useState(null); // Orden Seleccionada
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false); // Detalle Orden
  const [isQuote, setIsQuote] = useState(false); // Si es cotización

  // Estados de Formularios
  const [newClient, setNewClient] = useState({ nombre: '', telefono: '', correo: '' });
  const [newOrden, setNewOrden] = useState({
    cliente_id: '',
    vehiculo_id: '',
    descripcion: '',
    total: '',
    imagenes: [],
    status: 'pendiente'
  });

  // Verificar Auth
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Cargar datos según tab activo
  useEffect(() => {
    if (activeTab === 'clientes') {
      cargarClientes();
    } else if (activeTab === 'ordenes' || activeTab === 'cotizaciones') {
      cargarClientes();
      cargarVehiculos();
      cargarOrdenes();
    } else if (activeTab === 'dashboard') {
      cargarClientes();
      cargarOrdenes();
    } else if (activeTab === 'finanzas') {
      cargarOrdenes();
      cargarCostos();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/clientes");
      setClientes(res.data);
    } catch (error) {
      console.error("Error cargando clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarVehiculos = async () => {
    try {
      const res = await api.get("/vehiculos");
      setVehiculos(res.data);
    } catch (error) {
      console.error("Error cargando vehículos:", error);
    }
  };

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/ordenes");
      setOrdenes(res.data);
    } catch (error) {
      console.error("Error cargando órdenes:", error);
    } finally {
      setLoading(false);
    }
  };

  const [ordenCostos, setOrdenCostos] = useState([]);
  const [newCosto, setNewCosto] = useState({ concepto: '', costo: '', tipo: 'material' });

  const cargarOrdenCostos = async (ordenId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/ordenes/${ordenId}/costos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrdenCostos(res.data);
    } catch (error) {
      console.error("Error loading orden costos:", error);
    }
  };

  const handleSaveCosto = async (e) => {
    e.preventDefault();
    if (!newCosto.concepto || !newCosto.costo) return;
    
    try {
      const token = localStorage.getItem('token');
      await api.post(`/ordenes/${selectedOrden.id}/costos`, newCosto, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewCosto({ concepto: '', costo: '', tipo: 'material' });
      cargarOrdenCostos(selectedOrden.id);
      cargarCostos(); // Actualizar costos globales
      toast.success("Costo registrado");
    } catch (error) {
      console.error(error);
      toast.error("Error al registrar costo");
    }
  };

  const handleConvertToOrder = async (orden) => {
    if (!confirm('¿Convertir esta cotización en Orden de Servicio?')) return;
    toast.promise(
      async () => {
        const token = localStorage.getItem('token');
        await api.put(`/ordenes/${orden.id}`, 
          { status: 'pendiente' }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        cargarOrdenes();
      },
      {
        loading: 'Convirtiendo cotización...',
        success: 'Cotización convertida a Orden de Servicio',
        error: 'Error al convertir cotización',
      }
    );
  };

  useEffect(() => {
    if (selectedOrden && isDetailModalOpen) {
      cargarOrdenCostos(selectedOrden.id);
    }
  }, [selectedOrden, isDetailModalOpen]);

  const cargarCostos = async () => {
    try {
      const res = await api.get("/costos");
      setCostos(res.data);
    } catch (error) {
      console.error("Error cargando costos:", error);
    }
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!newClient.nombre) return;
    try {
      setSaving(true);
      await api.post("/clientes", newClient);
      setNewClient({ nombre: '', telefono: '', correo: '' });
      setIsModalOpen(false);
      cargarClientes();
      toast.success("Cliente registrado exitosamente");
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error("Error al guardar cliente");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrden = async (e) => {
    e.preventDefault();
    if (!newOrden.cliente_id || !newOrden.vehiculo_id) {
      toast.warning("Por favor seleccione cliente y vehículo");
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('cliente_id', newOrden.cliente_id);
      formData.append('vehiculo_id', newOrden.vehiculo_id);
      formData.append('descripcion', newOrden.descripcion);
      formData.append('total', newOrden.total || 0);
      formData.append('status', newOrden.status || 'pendiente');
      
      // Adjuntar imágenes
      if (newOrden.imagenes && newOrden.imagenes.length > 0) {
        Array.from(newOrden.imagenes).forEach(file => {
          formData.append('imagenes', file);
        });
      }

      const token = localStorage.getItem('token');
      const config = {
        headers: { 
          'Content-Type': 'multipart/form-data',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      };

      await api.post("/ordenes", formData, config);
      
      setNewOrden({
        cliente_id: '',
        vehiculo_id: '',
        descripcion: '',
        total: '',
        imagenes: [],
        status: 'pendiente'
      });
      setIsOrdenModalOpen(false);
      cargarOrdenes();
      toast.success(isQuote ? "Cotización creada exitosamente" : "Orden creada exitosamente");
    } catch (error) {
      console.error("Error saving orden:", error);
      toast.error("Error al crear registro");
    } finally {
      setSaving(false);
    }
  };

  const handleViewOrden = (orden) => {
    setSelectedOrden(orden);
    setIsDetailModalOpen(true);
  };

  const handleUpdateOrdenStatus = async (newStatus) => {
    if (!selectedOrden) return;
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await api.put(`/ordenes/${selectedOrden.id}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Actualizar localmente
      setOrdenes(ordenes.map(o => o.id === selectedOrden.id ? { ...o, status: newStatus } : o));
      setSelectedOrden({ ...selectedOrden, status: newStatus });
      
    } catch (error) {
      console.error("Error updating orden:", error);
      toast.error("Error al actualizar estado");
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cotizaciones', label: 'Cotizaciones', icon: FileText },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'ordenes', label: 'Órdenes de Servicio', icon: ClipboardList },
    { id: 'finanzas', label: 'Finanzas', icon: PieChart },
    { id: 'config', label: 'Configuración', icon: Settings },
  ];

  // Filtrar vehículos por cliente seleccionado en el modal de orden
  const vehiculosFiltrados = newOrden.cliente_id 
    ? vehiculos.filter(v => v.cliente_id == newOrden.cliente_id)
    : [];

  // Calcular ventas del mes (suma de totales de órdenes completadas/entregadas)
  const ventasMes = ordenes
    .filter(o => o.status === 'completado' || o.status === 'entregado')
    .reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
  
  // Calcular finanzas
  const ingresosTotales = ventasMes; // Simplificado por ahora
  const egresosTotales = costos.reduce((acc, curr) => acc + (parseFloat(curr.costo) || 0), 0);
  const balance = ingresosTotales - egresosTotales;

  const handlePrint = (orden) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error('Por favor habilite las ventanas emergentes');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orden #${orden.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #dc2626; padding-bottom: 20px; margin-bottom: 40px; }
          .logo { font-size: 28px; font-weight: 900; color: #dc2626; letter-spacing: -1px; }
          .info { text-align: right; font-size: 14px; color: #666; }
          .title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 40px; text-transform: uppercase; letter-spacing: 2px; color: #111; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .section h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #999; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
          .section p { font-size: 15px; font-weight: 500; color: #111; margin: 0; }
          .description { background: #f4f4f5; padding: 20px; border-radius: 8px; margin-bottom: 40px; }
          .description h3 { margin-top: 0; color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 10px; }
          .description p { line-height: 1.6; white-space: pre-wrap; }
          .financials { text-align: right; border-top: 1px solid #eee; padding-top: 20px; }
          .row { display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 5px; font-size: 14px; }
          .row.total { font-size: 20px; font-weight: 900; color: #dc2626; margin-top: 10px; }
          .footer { margin-top: 80px; font-size: 11px; text-align: center; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">SALVADOR GARAGE</div>
          <div class="info">
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Folio:</strong> #${orden.id.toString().padStart(4, '0')}</p>
          </div>
        </div>

        <div class="title">
          ${orden.status === 'cotizacion' ? 'Cotización de Servicio' : 'Orden de Servicio'}
        </div>

        <div class="grid">
          <div class="section">
            <h3>Cliente</h3>
            <p>${orden.cliente}</p>
          </div>
          <div class="section">
            <h3>Vehículo</h3>
            <p>${orden.vehiculo}</p>
          </div>
        </div>

        <div class="description">
          <h3>Descripción del Servicio</h3>
          <p>${orden.descripcion}</p>
        </div>

        <div class="financials">
          <div class="row"><span>Subtotal:</span> <span>$${(orden.total / 1.16).toFixed(2)}</span></div>
          <div class="row"><span>IVA (16%):</span> <span>$${(orden.total - (orden.total / 1.16)).toFixed(2)}</span></div>
          <div class="row total"><span>Total:</span> <span>$${parseFloat(orden.total).toFixed(2)}</span></div>
          ${orden.anticipo > 0 ? `<div class="row" style="color: #16a34a; font-weight: bold;"><span>Anticipo:</span> <span>-$${parseFloat(orden.anticipo).toFixed(2)}</span></div>` : ''}
          ${orden.anticipo > 0 ? `<div class="row" style="margin-top: 10px; font-weight: bold;"><span>Saldo Pendiente:</span> <span>$${(orden.total - orden.anticipo).toFixed(2)}</span></div>` : ''}
        </div>

        <div class="footer">
          <p>Gracias por su preferencia. Este documento es un comprobante oficial de Salvador Garage.</p>
          <p>Salvador Garage | Tel: 314-101-2929</p>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex font-sans text-zinc-100 selection:bg-red-500/30">
      
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800/50 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/50 backdrop-blur-sm">
            <div>
              <img src="/logo.png" alt="Apex Car" className="h-12 w-auto object-contain mb-2" />
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                 <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">System v1.0</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-zinc-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  activeTab === item.id 
                    ? "bg-red-600 text-white shadow-lg shadow-red-900/20" 
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === item.id ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/30">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-red-400 transition-colors text-sm font-medium hover:bg-red-500/5 rounded-xl"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        {/* Top Header */}
        <header className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800/50 h-16 flex items-center justify-between px-6 lg:px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-zinc-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-white tracking-tight capitalize flex items-center gap-2">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-8 w-[1px] bg-zinc-800 mx-2"></div>
            <div className="flex items-center gap-3 bg-zinc-800/50 rounded-full pl-1 pr-4 py-1 border border-zinc-700/50">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                AD
              </div>
              <span className="text-xs font-bold text-zinc-300 hidden sm:block tracking-wide">ADMINISTRADOR</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8 z-10 relative scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-900/50 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-zinc-800/50 group hover:border-zinc-700 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Ventas del Mes</h3>
                  <span className="p-2 bg-green-500/10 text-green-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="w-5 h-5" />
                  </span>
                </div>
                <p className="text-4xl font-black text-white tracking-tight">${ventasMes.toFixed(2)}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-green-500 bg-green-500/5 w-fit px-2 py-1 rounded">
                   <span>+12.5%</span>
                   <span className="text-zinc-500">vs mes anterior</span>
                </div>
              </div>

              <div className="bg-zinc-900/50 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-zinc-800/50 group hover:border-zinc-700 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Clientes Activos</h3>
                  <span className="p-2 bg-blue-500/10 text-blue-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-5 h-5" />
                  </span>
                </div>
                <p className="text-4xl font-black text-white tracking-tight">{clientes.length}</p>
                <p className="text-xs text-zinc-500 mt-2 font-medium">Base de datos de clientes</p>
              </div>

              <div className="bg-zinc-900/50 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-zinc-800/50 group hover:border-zinc-700 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Órdenes Abiertas</h3>
                  <span className="p-2 bg-orange-500/10 text-orange-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <Settings className="w-5 h-5" />
                  </span>
                </div>
                <p className="text-4xl font-black text-white tracking-tight">{ordenes.filter(o => o.status !== 'entregado').length}</p>
                <p className="text-xs text-zinc-500 mt-2 font-medium">Vehículos en taller</p>
              </div>
            </div>
          )}

          {activeTab === 'clientes' && (
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-zinc-800/50 overflow-hidden flex flex-col h-full max-h-[calc(100vh-140px)]">
              <div className="p-6 border-b border-zinc-800/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-900/80">
                <div className="relative w-full sm:w-72 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Buscar cliente..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all placeholder-zinc-600"
                  />
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-all text-sm font-bold shadow-lg shadow-red-900/20 hover:shadow-red-900/40 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> REGISTRAR CLIENTE
                </button>
              </div>
              
              <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-900/90 text-zinc-500 font-bold text-xs uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 border-b border-zinc-800">Nombre</th>
                      <th className="px-6 py-4 border-b border-zinc-800">Teléfono</th>
                      <th className="px-6 py-4 border-b border-zinc-800">Correo</th>
                      <th className="px-6 py-4 border-b border-zinc-800">Estado</th>
                      <th className="px-6 py-4 border-b border-zinc-800 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {loading ? (
                      <tr><td colSpan="5" className="px-6 py-8 text-center text-zinc-500 animate-pulse">Cargando base de datos...</td></tr>
                    ) : clientes.length === 0 ? (
                      <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-500">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-8 h-8 opacity-20" />
                          <p>No hay clientes registrados</p>
                        </div>
                      </td></tr>
                    ) : (
                      clientes.map((cliente) => (
                        <tr key={cliente.id} className="hover:bg-zinc-800/30 transition-colors group">
                          <td className="px-6 py-4 font-medium text-zinc-200 group-hover:text-white">{cliente.nombre}</td>
                          <td className="px-6 py-4 text-zinc-400">{cliente.telefono}</td>
                          <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{cliente.correo || '-'}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                              ACTIVO
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-zinc-500 hover:text-red-400 font-medium transition-colors text-xs uppercase tracking-wide">Editar</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'ordenes' && (
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-zinc-800/50 overflow-hidden flex flex-col h-full max-h-[calc(100vh-140px)]">
              <div className="p-6 border-b border-zinc-800/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-900/80">
                 <div className="relative w-full sm:w-72 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Buscar orden por folio, cliente..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all placeholder-zinc-600"
                  />
                </div>
                <button 
                  onClick={() => { setIsQuote(false); setIsOrdenModalOpen(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-all text-sm font-bold shadow-lg shadow-red-900/20 hover:shadow-red-900/40 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> NUEVA ORDEN
                </button>
              </div>

              <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-900/90 text-zinc-500 font-bold text-xs uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 border-b border-zinc-800">Folio</th>
                      <th className="px-6 py-4 border-b border-zinc-800">Cliente</th>
                      <th className="px-6 py-4 border-b border-zinc-800">Vehículo</th>
                      <th className="px-6 py-4 border-b border-zinc-800">Descripción</th>
                      <th className="px-6 py-4 border-b border-zinc-800">Estado</th>
                      <th className="px-6 py-4 border-b border-zinc-800">Total</th>
                      <th className="px-6 py-4 border-b border-zinc-800 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {loading ? (
                      <tr><td colSpan="7" className="px-6 py-8 text-center text-zinc-500 animate-pulse">Cargando órdenes...</td></tr>
                    ) : ordenes.filter(o => o.status !== 'cotizacion').length === 0 ? (
                      <tr><td colSpan="7" className="px-6 py-12 text-center text-zinc-500">
                         <div className="flex flex-col items-center gap-2">
                          <ClipboardList className="w-8 h-8 opacity-20" />
                          <p>No hay órdenes registradas</p>
                        </div>
                      </td></tr>
                    ) : (
                      ordenes.filter(o => o.status !== 'cotizacion').map((orden) => (
                        <tr key={orden.id} className="hover:bg-zinc-800/30 transition-colors group">
                          <td className="px-6 py-4 font-mono text-zinc-500 group-hover:text-zinc-300">#{orden.id.toString().padStart(4, '0')}</td>
                          <td className="px-6 py-4 font-medium text-zinc-200 group-hover:text-white">{orden.cliente}</td>
                          <td className="px-6 py-4 text-zinc-400 text-xs uppercase tracking-wide">{orden.vehiculo}</td>
                          <td className="px-6 py-4 text-zinc-500 truncate max-w-xs">{orden.descripcion}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                              orden.status === 'completado' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                              orden.status === 'pendiente' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                              'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}>
                              {orden.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-zinc-200">${orden.total}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleViewOrden(orden)} className="text-red-500 hover:text-red-400 font-bold text-xs uppercase tracking-wide hover:underline decoration-2 underline-offset-4">Ver Detalle</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'cotizaciones' && (
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-zinc-800/50 overflow-hidden flex flex-col h-full max-h-[calc(100vh-140px)]">
              <div className="p-6 border-b border-zinc-800/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-900/80">
                 <div className="relative w-full sm:w-72 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Buscar cotización..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all placeholder-zinc-600"
                  />
                </div>
                <button 
                  onClick={() => { setIsQuote(true); setIsOrdenModalOpen(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-all text-sm font-bold shadow-lg shadow-red-900/20 hover:shadow-red-900/40 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> NUEVA COTIZACIÓN
                </button>
              </div>

              <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-900/90 text-zinc-500 font-bold text-xs uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 border-b border-zinc-800">Folio</th>
                      <th className="px-6 py-4 border-b border-zinc-800">Cliente</th>
                      <th className="px-6 py-4 border-b border-zinc-800">Vehículo</th>
                      <th className="px-6 py-4 border-b border-zinc-800">Descripción</th>
                      <th className="px-6 py-4 border-b border-zinc-800">Total Est.</th>
                      <th className="px-6 py-4 border-b border-zinc-800 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {loading ? (
                      <tr><td colSpan="6" className="px-6 py-8 text-center text-zinc-500 animate-pulse">Cargando cotizaciones...</td></tr>
                    ) : ordenes.filter(o => o.status === 'cotizacion').length === 0 ? (
                      <tr><td colSpan="6" className="px-6 py-12 text-center text-zinc-500">
                         <div className="flex flex-col items-center gap-2">
                          <FileText className="w-8 h-8 opacity-20" />
                          <p>No hay cotizaciones registradas</p>
                        </div>
                      </td></tr>
                    ) : (
                      ordenes.filter(o => o.status === 'cotizacion').map((orden) => (
                        <tr key={orden.id} className="hover:bg-zinc-800/30 transition-colors group">
                          <td className="px-6 py-4 font-mono text-zinc-500 group-hover:text-zinc-300">#{orden.id.toString().padStart(4, '0')}</td>
                          <td className="px-6 py-4 font-medium text-zinc-200 group-hover:text-white">{orden.cliente}</td>
                          <td className="px-6 py-4 text-zinc-400 text-xs uppercase tracking-wide">{orden.vehiculo}</td>
                          <td className="px-6 py-4 text-zinc-500 truncate max-w-xs">{orden.descripcion}</td>
                          <td className="px-6 py-4 font-mono text-zinc-200">${orden.total}</td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <button onClick={() => handleViewOrden(orden)} className="text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wide">Ver</button>
                            <button onClick={() => handleConvertToOrder(orden)} className="text-green-500 hover:text-green-400 font-bold text-xs uppercase tracking-wide border border-green-500/20 bg-green-500/5 px-2 py-1 rounded hover:bg-green-500/10 transition-colors">Convertir a Orden</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'finanzas' && (
            <div className="space-y-6">
              {/* Finanzas Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900/50 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-zinc-800/50 group hover:border-zinc-700 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Ingresos Totales</h3>
                    <span className="p-2 bg-green-500/10 text-green-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-5 h-5" />
                    </span>
                  </div>
                  <p className="text-4xl font-black text-white tracking-tight">${ingresosTotales.toFixed(2)}</p>
                  <p className="text-xs text-zinc-500 mt-2 font-medium">Basado en órdenes completadas</p>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-zinc-800/50 group hover:border-zinc-700 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Egresos Totales</h3>
                    <span className="p-2 bg-red-500/10 text-red-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <TrendingDown className="w-5 h-5" />
                    </span>
                  </div>
                  <p className="text-4xl font-black text-white tracking-tight">${egresosTotales.toFixed(2)}</p>
                  <p className="text-xs text-zinc-500 mt-2 font-medium">Costos registrados en órdenes</p>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-zinc-800/50 group hover:border-zinc-700 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Balance Neto</h3>
                    <span className="p-2 bg-blue-500/10 text-blue-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <PieChart className="w-5 h-5" />
                    </span>
                  </div>
                  <p className={`text-4xl font-black tracking-tight ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {balance >= 0 ? '+' : ''}${balance.toFixed(2)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2 font-medium">Utilidad neta calculada</p>
                </div>
              </div>

              {/* Lista de Costos */}
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-zinc-800/50 overflow-hidden flex flex-col h-full max-h-[600px]">
                <div className="p-6 border-b border-zinc-800/50 bg-zinc-900/80">
                  <h3 className="font-bold text-white tracking-wide">REGISTRO DE COSTOS / EGRESOS</h3>
                </div>
                <div className="overflow-auto flex-1">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-900/90 text-zinc-500 font-bold text-xs uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                      <tr>
                        <th className="px-6 py-4 border-b border-zinc-800">Fecha</th>
                        <th className="px-6 py-4 border-b border-zinc-800">Concepto</th>
                        <th className="px-6 py-4 border-b border-zinc-800">Tipo</th>
                        <th className="px-6 py-4 border-b border-zinc-800">Orden Asoc.</th>
                        <th className="px-6 py-4 border-b border-zinc-800 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {costos.length === 0 ? (
                        <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-500">No hay costos registrados</td></tr>
                      ) : (
                        costos.map((costo) => (
                          <tr key={costo.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{new Date(costo.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-zinc-200 font-medium">{costo.concepto}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs border border-zinc-700 capitalize">{costo.tipo}</span>
                            </td>
                            <td className="px-6 py-4 text-zinc-500 text-xs">#{costo.orden_id}</td>
                            <td className="px-6 py-4 text-right text-red-400 font-mono">-${parseFloat(costo.costo).toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="flex flex-col items-center justify-center h-96 text-center bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
              <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6 text-zinc-600 animate-spin-slow">
                <Settings className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Módulo en Desarrollo</h3>
              <p className="text-zinc-500 max-w-md">Estamos trabajando en las configuraciones avanzadas del sistema. Pronto podrás personalizar impuestos, usuarios y más.</p>
            </div>
          )}
        </main>
      </div>

      {/* Modal Nuevo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-white/10">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h3 className="font-bold text-white tracking-wide">REGISTRAR NUEVO CLIENTE</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveClient} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Nombre Completo *</label>
                <input 
                  type="text" 
                  required
                  value={newClient.nombre}
                  onChange={e => setNewClient({...newClient, nombre: e.target.value})}
                  className="w-full px-4 py-3 bg-black/40 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-zinc-700"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Teléfono</label>
                <input 
                  type="tel" 
                  value={newClient.telefono}
                  onChange={e => setNewClient({...newClient, telefono: e.target.value})}
                  className="w-full px-4 py-3 bg-black/40 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-zinc-700"
                  placeholder="Ej. 55 1234 5678"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={newClient.correo}
                  onChange={e => setNewClient({...newClient, correo: e.target.value})}
                  className="w-full px-4 py-3 bg-black/40 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-zinc-700"
                  placeholder="cliente@ejemplo.com"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800 font-bold text-sm transition-colors"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-500 font-bold text-sm transition-colors disabled:opacity-50 shadow-lg shadow-red-900/20"
                >
                  {saving ? 'GUARDANDO...' : 'GUARDAR CLIENTE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Orden / Cotización */}
      {isOrdenModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto ring-1 ring-white/10 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/95 sticky top-0 z-10 backdrop-blur-md">
              <h3 className="font-bold text-white tracking-wide">{isQuote ? 'NUEVA COTIZACIÓN' : 'NUEVA ORDEN DE SERVICIO'}</h3>
              <button onClick={() => setIsOrdenModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveOrden} className="p-6 space-y-5">
              {/* Selección de Cliente */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Cliente *</label>
                <select 
                  required
                  value={newOrden.cliente_id}
                  onChange={e => setNewOrden({...newOrden, cliente_id: e.target.value, vehiculo_id: ''})}
                  className="w-full px-4 py-3 bg-black/40 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all appearance-none"
                >
                  <option value="" className="bg-zinc-900 text-zinc-500">Seleccionar Cliente</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id} className="bg-zinc-900 text-white">{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Selección de Vehículo */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Vehículo *</label>
                <div className="flex gap-2">
                  <select 
                    required
                    disabled={!newOrden.cliente_id}
                    value={newOrden.vehiculo_id}
                    onChange={e => setNewOrden({...newOrden, vehiculo_id: e.target.value})}
                    className="w-full px-4 py-3 bg-black/40 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all disabled:opacity-50 appearance-none"
                  >
                    <option value="" className="bg-zinc-900 text-zinc-500">Seleccionar Vehículo</option>
                    {vehiculosFiltrados.length > 0 ? (
                      vehiculosFiltrados.map(v => (
                        <option key={v.id} value={v.id} className="bg-zinc-900 text-white">{v.marca} {v.modelo} - {v.placas}</option>
                      ))
                    ) : (
                      <option value="" disabled className="bg-zinc-900 text-zinc-500">No hay vehículos registrados para este cliente</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Descripción del Problema/Servicio *</label>
                <textarea 
                  required
                  rows="3"
                  value={newOrden.descripcion}
                  onChange={e => setNewOrden({...newOrden, descripcion: e.target.value})}
                  className="w-full px-4 py-3 bg-black/40 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-zinc-700"
                  placeholder="Detalle el servicio a realizar..."
                />
              </div>

              {/* Costo Estimado */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Costo Estimado ($)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={newOrden.total}
                  onChange={e => setNewOrden({...newOrden, total: e.target.value})}
                  className="w-full px-4 py-3 bg-black/40 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-zinc-700"
                  placeholder="0.00"
                />
              </div>

              {/* Imágenes */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Evidencia / Imágenes</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-800 border-dashed rounded-xl hover:bg-zinc-800/50 transition-colors cursor-pointer relative group">
                  <div className="space-y-1 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-zinc-600 group-hover:text-red-500 transition-colors" />
                    <div className="flex text-sm text-zinc-400">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-bold text-red-500 hover:text-red-400 focus-within:outline-none">
                        <span>Subir archivos</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" 
                          onChange={e => setNewOrden({...newOrden, imagenes: e.target.files})}
                        />
                      </label>
                      <p className="pl-1">o arrastrar y soltar</p>
                    </div>
                    <p className="text-xs text-zinc-600">PNG, JPG, GIF hasta 10MB</p>
                    {newOrden.imagenes && newOrden.imagenes.length > 0 && (
                      <p className="text-xs text-green-500 font-bold mt-2">{newOrden.imagenes.length} archivos seleccionados</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsOrdenModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800 font-bold text-sm transition-colors"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-500 font-bold text-sm transition-colors disabled:opacity-50 shadow-lg shadow-red-900/20"
                >
                  {saving ? 'CREANDO...' : 'CREAR ORDEN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle Orden */}
      {isDetailModalOpen && selectedOrden && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto ring-1 ring-white/10 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/95 sticky top-0 z-10 backdrop-blur-md">
              <div>
                <h3 className="font-bold text-white tracking-wide">ORDEN #{selectedOrden.id.toString().padStart(4, '0')}</h3>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">{selectedOrden.cliente} - {selectedOrden.vehiculo}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handlePrint(selectedOrden)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                  title="Imprimir Orden/Cotización"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Status Bar */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Estado de la Orden</label>
                <div className="flex flex-wrap gap-2">
                  {['pendiente', 'en_proceso', 'completado', 'entregado', 'cancelado'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleUpdateOrdenStatus(status)}
                      disabled={saving}
                      className={`px-4 py-2 rounded-lg text-xs font-bold capitalize border transition-all ${
                        selectedOrden.status === status
                          ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-900/20'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Detalles del Servicio</h4>
                  <p className="text-sm text-zinc-300 bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 leading-relaxed">
                    {selectedOrden.descripcion}
                  </p>
                </div>
                <div>
                   <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Información Financiera</h4>
                   <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Total Estimado:</span>
                        <span className="font-bold text-white">${selectedOrden.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Anticipo:</span>
                        <span className="font-bold text-green-500">-${selectedOrden.anticipo || 0}</span>
                      </div>
                      <div className="pt-3 border-t border-zinc-700/50 flex justify-between text-sm font-bold">
                         <span className="text-white">Saldo Pendiente:</span>
                         <span className="text-red-500">${(selectedOrden.total || 0) - (selectedOrden.anticipo || 0)}</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Costos / Egresos */}
              <div>
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Registro de Costos (Egresos)</h4>
                <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
                  {/* Lista */}
                  {ordenCostos.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {ordenCostos.map(costo => (
                        <div key={costo.id} className="flex justify-between items-center text-sm p-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                           <span className="text-zinc-300">{costo.concepto} <span className="text-xs text-zinc-500 ml-2">({costo.tipo})</span></span>
                           <span className="font-mono text-red-400">-${parseFloat(costo.costo).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 border-t border-zinc-700">
                         <span className="font-bold text-zinc-400 text-xs uppercase">Total Costos</span>
                         <span className="font-bold text-red-500 text-sm">-${ordenCostos.reduce((acc, c) => acc + parseFloat(c.costo), 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 italic mb-4">No hay costos registrados.</p>
                  )}

                  {/* Formulario */}
                  <form onSubmit={handleSaveCosto} className="flex flex-col sm:flex-row gap-2 items-end">
                     <div className="flex-1 w-full">
                        <input 
                          type="text" 
                          placeholder="Concepto (ej. Refacción, Mano de obra)" 
                          value={newCosto.concepto}
                          onChange={e => setNewCosto({...newCosto, concepto: e.target.value})}
                          className="w-full px-3 py-2 bg-black/40 border border-zinc-700 rounded-lg text-sm text-white focus:border-red-500 focus:outline-none"
                        />
                     </div>
                     <div className="w-full sm:w-32">
                        <input 
                          type="number" 
                          placeholder="Monto" 
                          value={newCosto.costo}
                          onChange={e => setNewCosto({...newCosto, costo: e.target.value})}
                          className="w-full px-3 py-2 bg-black/40 border border-zinc-700 rounded-lg text-sm text-white focus:border-red-500 focus:outline-none"
                        />
                     </div>
                     <div className="w-full sm:w-36">
                       <select 
                          value={newCosto.tipo}
                          onChange={e => setNewCosto({...newCosto, tipo: e.target.value})}
                          className="w-full px-3 py-2 bg-black/40 border border-zinc-700 rounded-lg text-sm text-white focus:border-red-500 focus:outline-none appearance-none"
                       >
                         <option value="material">Material</option>
                         <option value="mano_obra">Mano Obra</option>
                         <option value="externo">Externo</option>
                       </select>
                     </div>
                     <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex justify-center items-center">
                       <TrendingDown className="w-5 h-5" />
                     </button>
                  </form>
                </div>
              </div>

              {/* Imágenes */}
              <div>
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Evidencia Fotográfica</h4>
                {selectedOrden.imagenes && selectedOrden.imagenes.length > 0 ? (
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     {selectedOrden.imagenes.map((img, idx) => (
                       <a key={idx} href={`${API_URL}${img}`} target="_blank" rel="noreferrer" className="block aspect-square rounded-xl overflow-hidden border border-zinc-800 hover:border-red-500/50 transition-all group relative">
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-10"></div>
                         <img src={`${API_URL}${img}`} alt={`Evidencia ${idx}`} className="w-full h-full object-cover" />
                       </a>
                     ))}
                   </div>
                ) : (
                  <div className="p-8 border border-dashed border-zinc-800 rounded-xl text-center">
                    <ImageIcon className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500 italic">No hay imágenes adjuntas</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-4 border-t border-zinc-800">
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-6 py-2.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 font-bold text-sm transition-colors"
                >
                  CERRAR
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );

}
