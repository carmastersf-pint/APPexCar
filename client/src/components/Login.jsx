import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, User, ArrowRight, AlertCircle, Wrench, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', nombre: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const { data } = await axios.post(`${API_URL}${endpoint}`, formData);

      if (isLogin) {
        localStorage.setItem('token', data.token);
        navigate('/admin');
      } else {
        // Auto login after register
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
          username: formData.username,
          password: formData.password
        });
        localStorage.setItem('token', loginRes.data.token);
        navigate('/admin');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error de conexión o credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-zinc-950 font-sans selection:bg-red-500/30">
      {/* Background Decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-zinc-950 to-zinc-950"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[2px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "outCirc" }}
        className="max-w-md w-full bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl shadow-black/50 z-10 relative overflow-hidden"
      >
        {/* Decorative top highlight */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>

        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex justify-center mb-6"
          >
             <img src="/logo.png" alt="Apex Car" className="h-40 w-auto object-contain drop-shadow-[0_0_25px_rgba(220,38,38,0.3)]" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              <ShieldCheck className="w-3 h-3 text-red-500" />
              {isLogin ? 'Acceso Seguro' : 'Alta Administrativa'}
            </p>
          </motion.div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 ml-1 tracking-wider uppercase">Nombre Completo</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all text-sm font-medium"
                  placeholder="Ej. Admin Principal"
                />
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 ml-1 tracking-wider uppercase">Usuario</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-red-500 transition-colors" />
              <input
                type="text"
                required
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all text-sm font-medium"
                placeholder="admin"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 ml-1 tracking-wider uppercase">Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-red-500 transition-colors" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all text-sm font-medium"
                placeholder="••••••••"
              />
            </div>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8 shadow-lg shadow-red-900/30 text-sm tracking-wide"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                VERIFICANDO...
              </span>
            ) : (
              <>
                {isLogin ? 'ACCEDER AL SISTEMA' : 'CREAR CUENTA'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-zinc-500 hover:text-white text-xs font-semibold transition-colors uppercase tracking-wide"
          >
            {isLogin ? '¿No tienes cuenta? Solicita acceso' : '¿Ya tienes cuenta? Inicia Sesión'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
