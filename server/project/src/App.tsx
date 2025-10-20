import { useState, useEffect } from 'react';
import {
  Pencil,
  Users,
  Zap,
  Palette,
  Layers,
  Clock,
  ArrowRight,
  Star,
  Sparkles,
} from 'lucide-react';

function App() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ Helper to safely assign Tailwind classes (no purge errors)
  const getColorClasses = (color) => {
    switch (color) {
      case 'orange':
        return {
          text: 'text-orange-200',
          from: 'from-orange-50',
          to: 'to-orange-100',
          border: 'border-orange-200',
          textColor: 'text-orange-400',
        };
      case 'rose':
        return {
          text: 'text-rose-200',
          from: 'from-rose-50',
          to: 'to-rose-100',
          border: 'border-rose-200',
          textColor: 'text-rose-400',
        };
      case 'amber':
        return {
          text: 'text-amber-200',
          from: 'from-amber-50',
          to: 'to-amber-100',
          border: 'border-amber-200',
          textColor: 'text-amber-400',
        };
      case 'pink':
        return {
          text: 'text-pink-200',
          from: 'from-pink-50',
          to: 'to-pink-100',
          border: 'border-pink-200',
          textColor: 'text-pink-400',
        };
      default:
        return {};
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-rose-500 rounded-xl flex items-center justify-center rotate-6">
              <Pencil className="w-5 h-5 text-white -rotate-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">Whiteboard</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
              Features
            </a>
            <a href="#how" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
              How It Works
            </a>
            <a href="#cases" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
              Use Cases
            </a>
            <button className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-all hover:shadow-lg">
              <a href="https://real-time-whiteboard-platform-priyansh.vercel.app/">Get Started</a>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        >
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-rose-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-amber-200 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div
              className="inline-block mb-8"
              style={{ transform: `translateY(${scrollY * -0.1}px)` }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-rose-50 border border-orange-200 rounded-full text-sm font-medium text-orange-800">
                <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                Real-time Collaboration
              </span>
            </div>

            <h1 className="text-7xl md:text-8xl font-bold mb-8 leading-none tracking-tight">
              <span className="block">Draw Together.</span>
              <span className="block bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                Create Magic.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
              The most elegant whiteboard platform for teams, educators, and creators.
              Unlock real-time collaboration—no latency, no login, no credit card needed.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="group px-8 py-4 bg-gray-900 text-white rounded-full font-medium text-lg hover:bg-gray-800 transition-all hover:shadow-2xl hover:shadow-gray-900/20 flex items-center gap-2">
                Start Creating Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">Everything You Need</h2>
            <p className="text-xl text-gray-600 font-light">Powerful features for seamless collaboration</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-7 h-7" />,
                title: 'Instant Sync',
                description: 'Real-time collaboration with zero lag. See changes as they happen.',
                gradient: 'from-orange-500 to-amber-500',
              },
              {
                icon: <Users className="w-7 h-7" />,
                title: 'Unlimited Users',
                description: 'Collaborate with 50+ people simultaneously. Perfect for teams.',
                gradient: 'from-rose-500 to-pink-500',
              },
              {
                icon: <Palette className="w-7 h-7" />,
                title: 'Rich Tools',
                description: 'Pencil, lines, shapes, and 16 million colors at your fingertips.',
                gradient: 'from-amber-500 to-yellow-500',
              },
              {
                icon: <Layers className="w-7 h-7" />,
                title: 'Private Drawing',
                description: 'Perfect your strokes privately before sharing with the team.',
                gradient: 'from-pink-500 to-rose-500',
              },
              {
                icon: <Sparkles className="w-7 h-7" />,
                title: 'Beautiful UI',
                description: 'Hand-drawn style with smooth animations. Delightful experience.',
                gradient: 'from-orange-500 to-rose-500',
              },
              {
                icon: <Clock className="w-7 h-7" />,
                title: 'No Setup',
                description: 'Start instantly. No installation, no login, no credit card.',
                gradient: 'from-amber-500 to-orange-500',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-gray-200 transition-all hover:shadow-2xl hover:-translate-y-2 duration-300"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl mb-6 text-white group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-32 px-6 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">Simple as 1, 2, 3</h2>
            <p className="text-xl text-gray-600 font-light">Get started in seconds</p>
          </div>

          <div className="space-y-24">
            {[
              {
                step: '01',
                title: 'Create or Join Room',
                description:
                  'Generate a unique room ID or join an existing session. Share the code with your team.',
                color: 'orange',
              },
              {
                step: '02',
                title: 'Choose Your Tools',
                description:
                  'Pick from pencil, line, or rectangle tools. Select your favorite color and start drawing.',
                color: 'rose',
              },
              {
                step: '03',
                title: 'Collaborate Live',
                description:
                  "Watch as everyone's creations appear instantly. Undo, redo, and clear together seamlessly.",
                color: 'amber',
              },
            ].map((item, index) => {
              const c = getColorClasses(item.color);
              return (
                <div
                  key={index}
                  className={`flex flex-col ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  } items-center gap-12`}
                >
                  <div className="flex-1">
                    <div className={`text-8xl font-bold ${c.text} mb-4`}>{item.step}</div>
                    <h3 className="text-4xl font-bold mb-4">{item.title}</h3>
                    <p className="text-xl text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                  <div className="flex-1">
                    <div
                      className={`bg-gradient-to-br ${c.from} ${c.to} rounded-3xl p-12 shadow-xl border ${c.border}`}
                    >
                      <div className="aspect-square bg-white rounded-2xl shadow-inner flex items-center justify-center">
                        <div className={`${c.textColor} text-6xl font-bold opacity-20`}>
                          {item.step}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="cases" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Built For Everyone
            </h2>
            <p className="text-xl text-gray-600 font-light">From classrooms to boardrooms</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Teachers & Students',
                description:
                  'Interactive lessons, live diagrams, and collaborative learning experiences.',
                emoji: '📚',
              },
              {
                title: 'Design Teams',
                description: 'Wireframing, brainstorming, and client presentations made simple.',
                emoji: '🎨',
              },
              {
                title: 'Business Teams',
                description: 'Flowcharts, strategy sessions, and visual planning in real-time.',
                emoji: '💼',
              },
              {
                title: 'Creative Groups',
                description: 'Collaborative art, fun projects, and creative expression together.',
                emoji: '✨',
              },
            ].map((useCase, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-gray-50 to-white rounded-3xl p-10 border-2 border-gray-100 hover:border-gray-200 transition-all hover:shadow-2xl"
              >
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform inline-block">
                  {useCase.emoji}
                </div>
                <h3 className="text-3xl font-bold mb-4">{useCase.title}</h3>
                <p className="text-lg text-gray-600 leading-relaxed">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Ready to Create Together?
          </h2>
          <p className="text-xl text-white/90 mb-12 font-light">
            Join thousands of teams collaborating in real-time
          </p>
          <button className="px-12 py-5 bg-white text-gray-900 rounded-full font-bold text-xl hover:shadow-2xl hover:scale-105 transition-all">
            <a href="https://real-time-whiteboard-platform-priyansh.vercel.app/">
              Start Drawing Now
            </a>
          </button>
          <p className="text-white/80 mt-8 font-light">
            No credit card/Login required. Free forever.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-rose-500 rounded-xl flex items-center justify-center rotate-6">
              <Pencil className="w-5 h-5 text-white -rotate-6" />
            </div>
            <span className="text-xl font-bold">Whiteboard</span>
          </div>
          <div className="text-gray-600 text-sm font-light">
            Made with passion by Priyansh Mathur. Free forever.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
