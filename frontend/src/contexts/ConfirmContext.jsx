import { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, Info, Trash2, X, CheckCircle, LogOut } from 'lucide-react';

const ConfirmContext = createContext();

export function ConfirmProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState({});
    const [promiseResolver, setPromiseResolver] = useState(null);

    // Esta es la función que llamaremos desde cualquier componente
    const confirm = useCallback((config) => {
        return new Promise((resolve) => {
            setOptions({
                title: config.title || '¿Estás seguro?',
                description: config.description || 'Esta acción no se puede deshacer.',
                confirmText: config.confirmText || 'Confirmar',
                cancelText: config.cancelText || 'Cancelar',
                type: config.type || 'warning', // 'danger', 'warning', 'success', 'info'
            });
            setIsOpen(true);
            setPromiseResolver(() => resolve);
        });
    }, []);

    const handleConfirm = () => {
        if (promiseResolver) promiseResolver(true);
        setIsOpen(false);
    };

    const handleCancel = () => {
        if (promiseResolver) promiseResolver(false);
        setIsOpen(false);
    };

    // Configuraciones visuales según el contexto (Tipo de acción)
    const theme = {
        danger: {
            icon: <Trash2 size={24} className="text-red-500" />,
            bgIcon: 'bg-red-500/10',
            btnConfirm: 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]',
        },
        warning: {
            icon: <AlertTriangle size={24} className="text-yellow-500" />,
            bgIcon: 'bg-yellow-500/10',
            btnConfirm: 'bg-yellow-500 hover:bg-yellow-600 text-black font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)]',
        },
        success: {
            icon: <CheckCircle size={24} className="text-green-500" />,
            bgIcon: 'bg-green-500/10',
            btnConfirm: 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]',
        },
        info: {
            icon: <Info size={24} className="text-blue-500" />,
            bgIcon: 'bg-blue-500/10',
            btnConfirm: 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]',
        },
        logout: {
            icon: <LogOut size={24} className="text-red-500" />,
            bgIcon: 'bg-red-500/10',
            btnConfirm: 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]',
        }
    };

    const currentTheme = theme[options.type] || theme.warning;

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}

            {/* EL MODAL GLOBAL */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
                    {/* Backdrop con Blur */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={handleCancel}
                    ></div>

                    {/* Tarjeta del Modal */}
                    <div className="relative bg-gym-card border border-white/10 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200">

                        <div className="p-6 pt-8 flex flex-col items-center text-center relative">
                            {/* Botón Cerrar (X) superior */}
                            <button onClick={handleCancel} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full">
                                <X size={18} />
                            </button>

                            {/* Icono con brillo */}
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${currentTheme.bgIcon}`}>
                                {currentTheme.icon}
                            </div>

                            {/* Textos */}
                            <h3 className="text-xl font-bold text-white tracking-tight mb-2">{options.title}</h3>
                            <p className="text-sm text-zinc-400 leading-relaxed px-4">{options.description}</p>
                        </div>

                        {/* Botones de Acción */}
                        <div className="p-4 bg-white/5 flex gap-3 border-t border-white/5">
                            <button
                                onClick={handleCancel}
                                className="flex-1 py-3 text-sm font-bold text-zinc-300 hover:text-white bg-black/20 hover:bg-black/40 rounded-xl transition-all border border-white/5 hover:border-white/10"
                            >
                                {options.cancelText}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${currentTheme.btnConfirm}`}
                            >
                                {options.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

// Hook para usarlo fácilmente
export const useConfirm = () => useContext(ConfirmContext);