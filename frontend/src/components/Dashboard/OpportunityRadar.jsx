import { useState } from 'react';
import { UserMinus, TrendingUp, Gift, MessageCircle, ChevronRight, AlertTriangle } from 'lucide-react';

export function OpportunityRadar() {
  const [activeTab, setActiveTab] = useState('churn'); // 'churn', 'renew', 'birthday'

  // --- DATOS SIMULADOS (En el futuro vendrán del backend) ---
  const opportunities = {
    churn: [ // Clientes ausentes
      { id: 1, name: 'Pedro Pascal', daysAbsent: 12, plan: 'Mensual', phone: '56912345678' },
      { id: 2, name: 'Ana de Armas', daysAbsent: 15, plan: 'Anual', phone: '56987654321' },
      { id: 3, name: 'Keanu Reeves', daysAbsent: 10, plan: 'Trimestral', phone: '56911223344' },
    ],
    renew: [ // Por vencer
      { id: 4, name: 'Scarlett J.', daysLeft: 1, plan: 'Mensual', amount: 35000 },
      { id: 5, name: 'Chris Evans', daysLeft: 2, plan: 'Semestral', amount: 180000 },
    ],
    birthday: [ // Cumpleaños
      { id: 6, name: 'Robert Downey', age: 45 },
    ]
  };

  // Configuración visual de cada tab
  const tabs = {
    churn: { label: 'Riesgo Fuga', icon: <UserMinus size={14}/>, color: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-500/10' },
    renew: { label: 'Por Vencer', icon: <TrendingUp size={14}/>, color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10' },
    birthday: { label: 'Cumpleaños', icon: <Gift size={14}/>, color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10' }
  };

  const currentTab = tabs[activeTab];
  const data = opportunities[activeTab];

  // Acción rápida: Abrir WhatsApp Web
  const handleWhatsApp = (phone, name, type) => {
      let msg = "";
      if(type === 'churn') msg = `Hola ${name}, te extrañamos en el gym! Todo bien?`;
      if(type === 'renew') msg = `Hola ${name}, tu plan vence pronto. Renueva hoy con descuento!`;
      
      // Simulación de apertura
      alert(`Abriendo WhatsApp para: ${name}\nMensaje: "${msg}"`);
      // window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="bg-gym-card p-0 rounded-2xl border border-white/5 h-full flex flex-col overflow-hidden shadow-lg min-h-[350px]">
      
      {/* HEADER: Título + Tabs */}
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </div>
            Radar de Oportunidades
        </h3>
        
        {/* Selector de Pestañas */}
        <div className="flex p-1 bg-black/20 rounded-lg gap-1">
            {Object.entries(tabs).map(([key, config]) => (
                <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all
                        ${activeTab === key 
                            ? `${config.bg} ${config.color} shadow-sm border border-white/5` 
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                        }
                    `}
                >
                    {config.icon} {config.label}
                </button>
            ))}
        </div>
      </div>

      {/* CONTENIDO LISTA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {data.length > 0 ? (
              data.map((item) => (
                  <div key={item.id} className="group flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                      
                      {/* Info Izquierda */}
                      <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${currentTab.bg} ${currentTab.color}`}>
                              {item.name.charAt(0)}
                          </div>
                          <div>
                              <p className="text-sm font-bold text-white leading-none">{item.name}</p>
                              <p className="text-[10px] text-zinc-400 mt-1">
                                  {activeTab === 'churn' && <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={10}/> Ausente {item.daysAbsent} días</span>}
                                  {activeTab === 'renew' && <span>Vence en <b className="text-white">{item.daysLeft} días</b> ({item.plan})</span>}
                                  {activeTab === 'birthday' && <span>Cumple {item.age} años</span>}
                              </p>
                          </div>
                      </div>

                      {/* Botón Acción (WhatsApp) */}
                      <button 
                        onClick={() => handleWhatsApp(item.phone, item.name, activeTab)}
                        className="p-2 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-black transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                        title="Enviar Mensaje"
                      >
                          <MessageCircle size={16} />
                      </button>
                  </div>
              ))
          ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2 opacity-60">
                  <div className="p-3 rounded-full bg-white/5 grayscale">
                      {currentTab.icon}
                  </div>
                  <p className="text-xs">Sin novedades aquí</p>
              </div>
          )}
      </div>

      {/* Footer / CTA */}
      <button className="p-3 text-xs text-center text-zinc-500 hover:text-white border-t border-white/5 hover:bg-white/5 transition-colors flex items-center justify-center gap-1">
          Ver reporte completo <ChevronRight size={12}/>
      </button>
    </div>
  );
}