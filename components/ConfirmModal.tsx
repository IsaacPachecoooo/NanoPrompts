import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  const [password, setPassword] = useState('');
  const isValid = password === 'borrar';

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  const handleConfirm = () => {
    if (!isValid) return;
    setPassword('');
    onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                <AlertTriangle size={24} />
              </div>
              <button onClick={handleClose} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-2">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">{message}</p>
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                Escribe <span className="text-red-400">borrar</span> para confirmar
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                placeholder="borrar"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                autoComplete="off"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isValid}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20"
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
