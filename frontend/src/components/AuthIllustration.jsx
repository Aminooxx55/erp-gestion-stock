import { motion } from 'framer-motion';
import { FiTrendingUp, FiPackage, FiAlertCircle, FiActivity, FiBox } from 'react-icons/fi';

export default function AuthIllustration() {
  return (
    <div 
      className="relative w-full h-[360px] max-w-[380px] mx-auto flex items-center justify-center" 
      style={{ perspective: '1200px' }}
    >
      
      {/* Background Glows */}
      <motion.div 
        animate={{ scale: [1, 1.04, 1], opacity: [0.18, 0.26, 0.18] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[80px]"
        style={{ background: 'linear-gradient(135deg, var(--blue), var(--indigo))' }}
      />

      {/* Main Glass Dashboard Component */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 10, rotateY: -10 }}
        animate={{ opacity: 1, y: 0, rotateX: [10, 12, 10], rotateY: [-10, -8, -10] }}
        transition={{ 
          opacity: { duration: 0.8 },
          y: { duration: 0.8, type: 'spring' },
          rotateX: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
          rotateY: { duration: 7, repeat: Infinity, ease: 'easeInOut' }
        }}
        className="absolute z-10 w-[280px] rounded-2xl p-5"
        style={{ 
          background: 'linear-gradient(135deg, rgba(21, 30, 46, 0.65), rgba(17, 24, 38, 0.78))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(163, 177, 194, 0.10)',
          boxShadow: '0 24px 46px -14px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.06)',
          transformStyle: 'preserve-3d'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--blue-alpha-15)', border: '1px solid var(--blue-alpha-12)' }}>
               <FiActivity size={16} style={{ color: 'var(--blue)' }} />
            </div>
            <div>
              <div className="h-2.5 w-16 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.08)' }}></div>
              <div className="h-1.5 w-10 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}></div>
            </div>
          </div>
          <div className="h-5 w-5 rounded-full flex items-center justify-center" style={{ background: 'var(--success-alpha-12)', border: '1px solid var(--success-alpha-15)' }}>
            <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--success)' }}></div>
          </div>
        </div>

        {/* Small graph simulation */}
        <div className="flex items-end gap-1.5 h-16 mb-4">
          {[40, 70, 45, 90, 65, 85, 55, 100].map((h, i) => (
             <motion.div 
               key={i}
               initial={{ height: 0 }}
               animate={{ height: `${h}%` }}
               transition={{ duration: 1, delay: 0.5 + i * 0.1, type: 'spring' }}
               className="flex-1 rounded-t-sm"
               style={{ background: `linear-gradient(to top, var(--blue) 0%, var(--indigo) 100%)`, opacity: 0.8 }}
             />
          ))}
        </div>

        <div className="space-y-2">
            <div className="p-2.5 rounded-lg flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'var(--indigo-alpha-12)' }}>
                <FiPackage size={12} style={{ color: 'var(--indigo)' }} />
              </div>
              <div className="flex-1">
               <div className="h-2 w-14 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.08)' }}></div>
               <div className="h-1 w-8 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}></div>
              </div>
              <div className="h-2 w-6 rounded-full" style={{ background: 'var(--blue-alpha-15)' }}></div>
           </div>
           
           <div className="p-2.5 rounded-lg flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'var(--warning-alpha-12)' }}>
                 <FiBox size={12} style={{ color: 'var(--warning)' }} />
              </div>
              <div className="flex-1">
               <div className="h-2 w-20 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.08)' }}></div>
               <div className="h-1 w-12 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}></div>
              </div>
              <div className="h-2 w-6 rounded-full" style={{ background: 'var(--warning-alpha-15)' }}></div>
           </div>
        </div>
      </motion.div>

      {/* Floating Alert Card */}
      <motion.div
        initial={{ opacity: 0, x: 60, y: 30 }}
        animate={{ opacity: 1, x: 60, y: [30, 20, 30] }}
        transition={{ 
          opacity: { duration: 0.6, delay: 0.6 },
          y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
        }}
        className="absolute z-20 top-12 right-2 w-[160px] rounded-xl p-3"
        style={{ 
          background: 'linear-gradient(135deg, rgba(21, 30, 46, 0.78), rgba(17, 24, 38, 0.92))',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--danger-alpha-12)',
          boxShadow: '0 14px 28px -12px rgba(0, 0, 0, 0.55), 0 0 16px var(--danger-alpha-8)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--danger-alpha-12)', border: '1px solid var(--danger-alpha-12)' }}>
            <FiAlertCircle size={12} style={{ color: 'var(--danger-light)' }} />
          </div>
          <span className="text-[9px] font-bold tracking-wider" style={{ color: 'var(--danger-light)' }}>NOUVELLE ALERTE</span>
        </div>
        <div className="h-1.5 w-20 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.12)' }}></div>
        <div className="h-1 w-12 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}></div>
      </motion.div>

      {/* Floating Success Card */}
      <motion.div
        initial={{ opacity: 0, x: -70, y: -30 }}
        animate={{ opacity: 1, x: -70, y: [-30, -20, -30] }}
        transition={{ 
          opacity: { duration: 0.6, delay: 0.8 },
          y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 },
        }}
        className="absolute z-0 bottom-16 left-2 w-[140px] rounded-xl p-3"
        style={{ 
          background: 'linear-gradient(135deg, rgba(21, 30, 46, 0.78), rgba(17, 24, 38, 0.92))',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--success-alpha-12)',
          boxShadow: '0 14px 28px -12px rgba(0, 0, 0, 0.55)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--success-alpha-12)', border: '1px solid var(--success-alpha-12)' }}>
            <FiTrendingUp size={12} style={{ color: 'var(--success-light)' }} />
          </div>
          <span className="text-[9px] font-bold tracking-wider" style={{ color: 'var(--success-light)' }}>PERFORMANCE</span>
        </div>
        <div className="flex items-end gap-1 mt-2">
            <span className="text-lg font-bold leading-none" style={{ color: 'var(--text-primary)' }}>+24%</span>
            <span className="text-[9px] mb-0.5" style={{ color: 'var(--success-light)' }}>ce mois</span>
        </div>
      </motion.div>

    </div>
  );
}
