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
  const CONFIRM_WORD = 'borrar';
  const isValid = password === CONFIRM_WORD;

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
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-red-500/20 shadow-2xl p-8"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-black text-white text-sm uppercase tracking-widest">{title}</h3>
                <p className="text-xs text-slate-400 mt-1">{message}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                Type the confirmation word to proceed
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                placeholder="••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                autoComplete="off"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 text-xs uppercase tracking-widest transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isValid}
                className="flex-1 py-3 bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 hover:bg-red-400 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
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
