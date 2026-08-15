import { Outlet, Link } from 'react-router-dom'
import { Zap, Sparkles, Play, TrendingUp, Award } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AuthLayout() {
  return (
    <div className="bg-canvas flex min-h-screen">
      <div className="relative hidden overflow-hidden lg:flex lg:w-[55%] xl:w-[58%]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, var(--tf-primary) 0%, var(--tf-primary-hover) 50%, var(--tf-primary-deep) 100%)',
          }}
        />

        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(at 15% 20%, rgba(251, 100, 27, 0.4) 0px, transparent 50%),
              radial-gradient(at 85% 80%, rgba(255, 159, 0, 0.3) 0px, transparent 50%),
              radial-gradient(at 50% 50%, rgba(56, 142, 60, 0.2) 0px, transparent 50%)
            `,
          }}
        />

        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
          <Link to="/" className="group flex w-fit items-center gap-3">
            <div className="bg-surface/15 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
              <Zap className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              TalishFlow
            </span>
          </Link>

          <div className="flex max-w-[560px] flex-col gap-10">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="bg-surface/15 mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1.5 backdrop-blur-md">
                <Sparkles className="text-warning h-3.5 w-3.5" fill="var(--tf-warning)" />
                <span className="text-xs font-semibold tracking-wide text-white/95">
                  AI-POWERED VIDEO SHORTS
                </span>
              </div>

              <h1
                className="mb-6 leading-[1.05] font-black tracking-[-0.04em] text-balance text-white"
                style={{ fontSize: 'clamp(40px, 5vw, 60px)' }}
              >
                Turn Long Videos
                <br />
                Into{' '}
                <span
                  className="relative inline-block"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--tf-warning) 0%, var(--tf-accent) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Viral Shorts
                </span>
              </h1>

              <p className="max-w-lg text-lg leading-relaxed font-medium text-white/75">
                Automatically detect engaging moments, generate perfect vertical clips,
                and publish to YouTube & Instagram — all from one dashboard.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-2 gap-3"
            >
              {[
                { icon: Play, label: 'Auto clip detection', color: 'var(--tf-warning)' },
                {
                  icon: TrendingUp,
                  label: 'Viral optimization',
                  color: 'var(--tf-accent)',
                },
                { icon: Sparkles, label: 'AI captions & titles', color: '#FFB800' },
                { icon: Award, label: 'One-click publish', color: '#FF6B00' },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="bg-surface/10 hover:bg-surface/15 flex items-center gap-3 rounded-xl border border-white/20 p-3.5 backdrop-blur-md transition-colors"
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${feature.color}30` }}
                  >
                    <feature.icon className="h-4 w-4" style={{ color: feature.color }} />
                  </div>
                  <span className="text-sm font-semibold text-white/90">
                    {feature.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center gap-4"
          >
            <div className="flex -space-x-3">
              {['A', 'S', 'K', 'M', 'R'].map((letter, i) => (
                <div
                  key={i}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/40 text-sm font-bold text-white shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${['var(--tf-warning)', 'var(--tf-accent)', '#FFB800', '#FF6B00', '#F57C00'][i]}, ${['#F57C00', 'var(--tf-accent-hover)', '#FF9800', '#E64A00', '#EF6C00'][i]})`,
                    zIndex: 5 - i,
                  }}
                >
                  {letter}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-bold text-white">10,000+ creators</p>
              <div className="mt-0.5 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="h-3.5 w-3.5"
                    fill="var(--tf-warning)"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-1 text-xs font-medium text-white/70">
                  4.9/5 rating
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="bg-surface flex flex-1 flex-col">
        <div className="border-border flex items-center gap-3 border-b p-6 lg:hidden">
          <div className="gradient-primary flex h-9 w-9 items-center justify-center rounded-xl shadow-lg">
            <Zap className="h-4 w-4 text-white" fill="white" />
          </div>
          <span className="text-foreground text-xl font-extrabold">TalishFlow</span>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-[440px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
