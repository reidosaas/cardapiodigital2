'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Store, ShoppingCart, MessageSquare, BarChart3, ArrowRight, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function LandingPage() {
  const [sysConfig, setSysConfig] = useState<any>(null);

  useEffect(() => {
    api.get('/api/config-sistema').then((res) => setSysConfig(res.data)).catch(() => {});
  }, []);
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              {sysConfig?.logoUrl && <img src={sysConfig.logoUrl} alt="Logo" className="h-8 w-8 rounded-lg object-contain" />}
              <span className="text-xl font-bold text-gradient">{sysConfig?.nomeSistema || 'My Love Delivery'}</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#recursos" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">Recursos</Link>
              <Link href="#planos" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">Planos</Link>
              <Link href="/auth/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary">Entrar</Link>
              <Link href="/auth/register">
                <Button size="sm">Comecar Gratis</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Seu Catalogo Digital
            <span className="text-gradient block">com Vendas Automaticas</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8"
          >
            Crie seu cardápio online em minutos. Receba pedidos, automatize atendimento via WhatsApp com IA e aumente suas vendas.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link href="/auth/register">
              <Button size="lg" variant="gradient">
                Comecar Gratuitamente <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline">Ja tenho conta</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section id="recursos" className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Tudo que voce precisa para vender mais
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Store, title: 'Catalogo Digital', desc: 'Cardapio online responsivo com fotos, categorias e busca' },
              { icon: ShoppingCart, title: 'Pedidos Online', desc: 'Receba pedidos diretamente pelo catalogo ou WhatsApp' },
              { icon: MessageSquare, title: 'WhatsApp + IA', desc: 'Chatbot inteligente que atende e vende por voce' },
              { icon: BarChart3, title: 'Dashboard', desc: 'Relatorios e metricas de vendas em tempo real' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <div className="h-12 w-12 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Planos para todos os negocios
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Gratuito', price: 'R$ 0', features: ['10 produtos', 'Catalogo basico', 'WhatsApp'], popular: false },
              { name: 'Basico', price: 'R$ 29,90', features: ['50 produtos', 'Catalogo premium', 'WhatsApp + Chatbot', 'PIX'], popular: true },
              { name: 'Profissional', price: 'R$ 79,90', features: ['Produtos ilimitados', 'Dominio propio', 'IA de atendimento', 'Tudo liberado'], popular: false },
            ].map((plano, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-xl p-6 border-2 ${plano.popular ? 'border-primary bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}
              >
                {plano.popular && (
                  <span className="text-xs font-semibold text-primary bg-primary-100 dark:bg-primary-900/40 px-3 py-1 rounded-full">Mais popular</span>
                )}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">{plano.name}</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{plano.price}<span className="text-sm font-normal text-gray-500">/mes</span></p>
                <ul className="mt-6 space-y-3">
                  {plano.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="h-4 w-4 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className="block mt-6">
                  <Button className="w-full" variant={plano.popular ? 'default' : 'outline'}>
                    Comecar Agora
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>2024 My Love Delivery. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
