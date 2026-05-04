import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const paymentImg = `${import.meta.env.BASE_URL}images/payment_sketch.png`;

export function ScenePayment() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 4500),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(circle at 60% 50%, rgba(14,165,233,0.08) 0%, var(--color-bg-dark) 70%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-[1.1vw] uppercase tracking-[0.3em] text-[var(--color-accent)] mb-3"
        initial={{ opacity: 0 }} animate={{ opacity: phase >= 1 ? 1 : 0 }}
      >
        Subscription & Payment
      </motion.div>
      <motion.h2
        className="text-[3.2vw] font-bold mb-10 text-center text-white/90"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -10 }}
      >
        Frictionless Razorpay Checkout
      </motion.h2>

      <div className="flex items-center justify-center gap-[6vw] relative w-full px-[10vw]">
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: -40, rotate: -5 }}
          animate={{ opacity: phase >= 1 ? 1 : 0, x: phase >= 1 ? 0 : -40, rotate: phase >= 1 ? -2 : -5 }}
          transition={{ type: 'spring', damping: 15, delay: 0.2 }}
        >
          <img src={paymentImg} className="w-[30vw] object-contain sketch-border sketch-shadow p-3" alt="Payment Sketch" />
        </motion.div>

        <motion.div
          className="w-[34vw] bg-[var(--color-bg-muted)] rounded-2xl shadow-2xl border border-white/15 p-8 flex flex-col items-center relative overflow-hidden"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: phase >= 2 ? 1 : 0, x: phase >= 2 ? 0 : 40 }}
          transition={{ type: 'spring', damping: 18 }}
        >
          <div className="text-xl font-bold text-white/95 mb-2">Professional Plan</div>
          <div className="text-4xl font-black text-white/95 mb-6">₹7,999<span className="text-lg text-white/50 font-normal">/mo</span></div>

          <motion.div
            className="w-full bg-[#0ea5e9] text-white py-3 rounded-lg font-bold text-center relative overflow-hidden shadow-lg"
            animate={phase >= 3 ? { backgroundColor: '#10b981', scale: 1.05 } : {}}
            transition={{ duration: 0.4 }}
          >
            {phase >= 3 ? "Payment Successful" : "Pay with Razorpay"}
            {phase >= 3 && (
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 0.8 }}
              />
            )}
          </motion.div>
          
          <div className="mt-6 w-full space-y-3">
             <div className="h-2 w-full bg-white/10 rounded" />
             <div className="h-2 w-5/6 bg-white/10 rounded" />
             <div className="h-2 w-4/6 bg-white/10 rounded" />
          </div>
        </motion.div>
      </div>
      
      {phase >= 3 && (
        <motion.div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 2, delay: 1 }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 bg-emerald-400 rounded-full"
              initial={{ x: 0, y: 0, scale: 0 }}
              animate={{ 
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400 - 100,
                scale: [0, 1.5, 0] 
              }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
