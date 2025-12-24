import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  DollarSign
} from 'lucide-react';
import axios from "axios";

// Configurar API
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const api = axios.create({
  baseURL: API_URL,
});

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Estados de datos
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados de Modales
  const [isModalOpen, setIsModalOpen] = useState(false); // Cliente
  const [isOrdenModalOpen, setIsOrdenModalOpen] = useState(false); // Orden

  // Estados de Formularios
  const [newClient, setNewClient] = useState({ nombre: '', telefono: '', correo: '' });
  const [newOrden, setNewOrden] = useState({
    cliente_id: '',
    vehiculo_id: '',
    descripcion: '',
    total: '',
    imagenes: []
  });

  // Cargar datos según tab activo
  useEffect(() => {
    if (activeTab === 'clientes') {
      cargarClientes();
    } else if (activeTab === 'ordenes') {
      cargarClientes();
      cargarVehiculos();
      cargarOrdenes();
    } else if (activeTab === 'dashboard') {
      cargarClientes();
      cargarOrdenes();
    }
  }, [activeTab]);

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

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!newClient.nombre) return;
    try {
      setSaving(true);
      await api.post("/clientes", newClient);
      setNewClient({ nombre: '', telefono: '', correo: '' });
      setIsModalOpen(false);
      cargarClientes();
    } catch (error) {
      console.error("Error saving client:", error);
      alert("Error al guardar cliente");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrden = async (e) => {
    e.preventDefault();
    if (!newOrden.cliente_id || !newOrden.vehiculo_id) {
      alert("Por favor seleccione cliente y vehículo");
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('cliente_id', newOrden.cliente_id);
      formData.append('vehiculo_id', newOrden.vehiculo_id);
      formData.append('descripcion', newOrden.descripcion);
      formData.append('total', newOrden.total || 0);
      
      // Adjuntar imágenes
      if (newOrden.imagenes && newOrden.imagenes.length > 0) {
        Array.from(newOrden.imagenes).forEach(file => {
          formData.append('imagenes', file);
        });
      }

      // Necesitamos el token si la ruta está protegida
      // Asumimos que por ahora la API permite o tenemos token en localStorage (si implementamos auth)
      // Como vi 'authenticateToken' en index.js, necesitamos auth headers.
      // Pero este frontend no parece tener login aún. 
      // NOTA: Para que funcione sin login real, el usuario probablemente necesite 
      // comentar 'authenticateToken' en el backend o implementar login.
      // Voy a asumir que el usuario tiene un token o que el backend lo permite temporalmente.
      // O mejor, enviamos un token dummy si es necesario, pero el backend verificará.
      // En el estado actual, si no hay token, fallará (401).
      // Solución rápida: Agregar un token dummy o manejar el error.
      // Voy a intentar obtenerlo de localStorage por si acaso.
      
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
        imagenes: []
      });
      setIsOrdenModalOpen(false);
      cargarOrdenes();
    } catch (error) {
      console.error("Error saving orden:", error);
      alert("Error al crear orden (Posible error de autenticación o servidor)");
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'ordenes', label: 'Órdenes de Servicio', icon: ClipboardList },
    { id: 'config', label: 'Configuración', icon: Settings },
  ];

  // Filtrar vehículos por cliente seleccionado en el modal de orden
  const vehiculosFiltrados = newOrden.cliente_id 
    ? vehiculos.filter(v => v.cliente_id == newOrden.cliente_id)
    : [];

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans text-slate-800">
      
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#09090b] text-white transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-wider text-white">CAR MASTERS</h1>
              <p className="text-xs text-gray-500 tracking-widest uppercase">POS System</p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id 
                    ? "bg-[#00F0FF]/10 text-[#00F0FF]" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <Link 
              to="/" 
              className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              <LogOut className="w-5 h-5" />
              Salir al Sitio Web
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 capitalize">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
              AD
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">Admin</span>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Ventas del Mes</h3>
                  <span className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <ClipboardList className="w-5 h-5" />
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">$0.00</p>
                <p className="text-xs text-gray-400 mt-2">+0% vs mes anterior</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Clientes Activos</h3>
                  <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Users className="w-5 h-5" />
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{clientes.length}</p>
                <p className="text-xs text-gray-400 mt-2">Total registrados</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Órdenes Abiertas</h3>
                  <span className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                    <Settings className="w-5 h-5" />
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{ordenes.filter(o => o.status !== 'entregado').length}</p>
                <p className="text-xs text-gray-400 mt-2">En proceso</p>
              </div>
            </div>
          )}

          {activeTab === 'clientes' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar cliente..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> Nuevo Cliente
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-6 py-4">Nombre</th>
                      <th className="px-6 py-4">Teléfono</th>
                      <th className="px-6 py-4">Correo</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">Cargando...</td></tr>
                    ) : clientes.length === 0 ? (
                      <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No hay clientes registrados</td></tr>
                    ) : (
                      clientes.map((cliente) => (
                        <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{cliente.nombre}</td>
                          <td className="px-6 py-4 text-gray-600">{cliente.telefono}</td>
                          <td className="px-6 py-4 text-gray-600">{cliente.correo || '-'}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Activo
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-indigo-600 hover:text-indigo-900 font-medium">Editar</button>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar orden..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button 
                  onClick={() => setIsOrdenModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> Nueva Orden
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-6 py-4">Folio</th>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Vehículo</th>
                      <th className="px-6 py-4">Descripción</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">Cargando...</td></tr>
                    ) : ordenes.length === 0 ? (
                      <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">No hay órdenes registradas</td></tr>
                    ) : (
                      ordenes.map((orden) => (
                        <tr key={orden.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-gray-500">#{orden.id.toString().padStart(4, '0')}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{orden.cliente}</td>
                          <td className="px-6 py-4 text-gray-600">{orden.vehiculo}</td>
                          <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{orden.descripcion}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              orden.status === 'completado' ? 'bg-green-100 text-green-800' :
                              orden.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {orden.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">${orden.total}</td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-indigo-600 hover:text-indigo-900 font-medium">Ver</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <Settings className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">En desarrollo</h3>
              <p className="text-gray-500 max-w-sm mt-2">Esta sección del sistema POS estará disponible en la próxima actualización.</p>
            </div>
          )}
        </main>
      </div>

      {/* Modal Nuevo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800">Registrar Nuevo Cliente</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveClient} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                <input 
                  type="text" 
                  required
                  value={newClient.nombre}
                  onChange={e => setNewClient({...newClient, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input 
                  type="tel" 
                  value={newClient.telefono}
                  onChange={e => setNewClient({...newClient, telefono: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej. 55 1234 5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={newClient.correo}
                  onChange={e => setNewClient({...newClient, correo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="cliente@ejemplo.com"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Orden */}
      {isOrdenModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-gray-800">Nueva Orden de Servicio</h3>
              <button onClick={() => setIsOrdenModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveOrden} className="p-6 space-y-4">
              {/* Selección de Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                <select 
                  required
                  value={newOrden.cliente_id}
                  onChange={e => setNewOrden({...newOrden, cliente_id: e.target.value, vehiculo_id: ''})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Seleccionar Cliente</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Selección de Vehículo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo *</label>
                <div className="flex gap-2">
                  <select 
                    required
                    disabled={!newOrden.cliente_id}
                    value={newOrden.vehiculo_id}
                    onChange={e => setNewOrden({...newOrden, vehiculo_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100"
                  >
                    <option value="">Seleccionar Vehículo</option>
                    {vehiculosFiltrados.length > 0 ? (
                      vehiculosFiltrados.map(v => (
                        <option key={v.id} value={v.id}>{v.marca} {v.modelo} - {v.placas}</option>
                      ))
                    ) : (
                      <option value="" disabled>No hay vehículos registrados para este cliente</option>
                    )}
                  </select>
                  {/* Aquí podríamos agregar un botón rápido para agregar vehículo si no existe, pero por simplicidad lo omito por ahora */}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Problema/Servicio *</label>
                <textarea 
                  required
                  rows="3"
                  value={newOrden.descripcion}
                  onChange={e => setNewOrden({...newOrden, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Detalle el servicio a realizar..."
                />
              </div>

              {/* Costo Estimado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo Estimado ($)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={newOrden.total}
                  onChange={e => setNewOrden({...newOrden, total: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>

              {/* Imágenes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evidencia / Imágenes</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <div className="space-y-1 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                        <span>Subir archivos</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" 
                          onChange={e => setNewOrden({...newOrden, imagenes: e.target.files})}
                        />
                      </label>
                      <p className="pl-1">o arrastrar y soltar</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                    {newOrden.imagenes && newOrden.imagenes.length > 0 && (
                      <p className="text-xs text-green-600 font-medium mt-2">{newOrden.imagenes.length} archivos seleccionados</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsOrdenModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                >
                  {saving ? 'Creando Orden...' : 'Crear Orden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
