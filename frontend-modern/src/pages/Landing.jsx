import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Brain, MapPin, Mic, Shield, Heart } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-white via-medical-soft-white to-blue-50">
      {/* Header */}
      <header className="border-b border-medical-gray-200 bg-medical-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-medical-blue-light to-medical-blue-dark shadow-md">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-medical-gray-900">ArogyaSakhi AI</span>
          </div>
          <div className="flex gap-3">
            <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-medical-gray-700 hover:text-medical-blue-dark transition">
              Sign in
            </Link>
            <Link to="/signup" className="rounded-lg bg-medical-blue-light px-4 py-2 text-sm font-semibold text-white hover:bg-medical-blue-dark transition shadow-md">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 text-center md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold leading-tight text-medical-gray-900">
            AI-Powered Intelligent
            <span className="block bg-gradient-to-r from-medical-blue-light to-medical-blue-dark bg-clip-text text-transparent">
              Rural Healthcare
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-medical-gray-600 leading-relaxed">
            Enterprise telemedicine platform for ASHA workers, doctors, patients, and administrators — with real ML risk prediction, SOS alerts, and multilingual voice assistance.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-12 flex flex-wrap justify-center gap-4"
        >
          <Link 
            to="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-medical-blue-light to-medical-blue-dark px-8 py-3 font-semibold text-white hover:shadow-lg transition shadow-md"
          >
            Start Free Trial
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-medical-blue-light px-8 py-3 font-semibold text-medical-blue-dark hover:bg-medical-blue-light/5 transition"
          >
            Demo Login
          </Link>
        </motion.div>

        {/* Demo Credentials Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 rounded-lg border border-medical-green/30 bg-medical-green/5 inline-block p-4"
        >
          <p className="text-sm text-medical-gray-600">Try with demo credentials: <span className="font-mono font-semibold text-medical-gray-900">admin / admin123</span></p>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-medical-gray-900">Comprehensive Healthcare Solutions</h2>
          <p className="mt-4 text-medical-gray-600">Everything you need for modern rural healthcare delivery</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { 
              icon: Brain, 
              title: 'AI Symptom Checker', 
              desc: 'Real risk scoring with Green/Yellow/Red triage',
              color: 'blue'
            },
            { 
              icon: Mic, 
              title: 'Voice Assistant', 
              desc: 'Hindi, English, Marathi voice navigation',
              color: 'green'
            },
            { 
              icon: MapPin, 
              title: 'Hospital Finder', 
              desc: 'GPS routing and ambulance recommendations',
              color: 'amber'
            },
            { 
              icon: Shield, 
              title: 'Emergency SOS', 
              desc: 'Live WebSocket alerts to doctors and admins',
              color: 'red'
            }
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`rounded-lg border p-6 backdrop-blur-sm transition hover:shadow-lg ${
                f.color === 'blue' ? 'border-medical-blue-light/20 bg-medical-blue-light/5' :
                f.color === 'green' ? 'border-medical-green/20 bg-medical-green/5' :
                f.color === 'amber' ? 'border-medical-amber/20 bg-medical-amber/5' :
                'border-medical-red/20 bg-medical-red/5'
              }`}
            >
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center mb-4 ${
                f.color === 'blue' ? 'bg-medical-blue-light/10' :
                f.color === 'green' ? 'bg-medical-green/10' :
                f.color === 'amber' ? 'bg-medical-amber/10' :
                'bg-medical-red/10'
              }`}>
                <f.icon className={`h-6 w-6 ${
                  f.color === 'blue' ? 'text-medical-blue-light' :
                  f.color === 'green' ? 'text-medical-green' :
                  f.color === 'amber' ? 'text-medical-amber' :
                  'text-medical-red'
                }`} />
              </div>
              <h3 className="text-lg font-semibold text-medical-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm text-medical-gray-600">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="rounded-lg bg-gradient-to-r from-medical-blue-light/10 to-medical-blue-dark/10 border border-medical-blue-light/30 p-12 text-center"
        >
          <h2 className="text-3xl font-bold text-medical-gray-900">Ready to transform healthcare delivery?</h2>
          <p className="mt-4 text-medical-gray-600">Join healthcare workers across India using ArogyaSakhi AI</p>
          <Link
            to="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-medical-blue-light px-8 py-3 font-semibold text-white hover:bg-medical-blue-dark transition shadow-lg"
          >
            Start Your Free Trial
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-medical-gray-200 bg-medical-white py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-medical-gray-600">
          <p>© 2024 ArogyaSakhi AI. Transforming rural healthcare with artificial intelligence.</p>
        </div>
      </footer>
    </div>
  );
}
