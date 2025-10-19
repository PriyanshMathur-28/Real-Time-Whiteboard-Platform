import { useState, useEffect } from 'react';
import { Pencil, Users, Zap, Palette, Layers, Clock, ArrowRight, Check, Star, Sparkles } from 'lucide-react';

function App() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => { 
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-rose-500 rounded-xl flex items-center justify-center rotate-6">
              <Pencil className="w-5 h-5 text-white -rotate-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">Whiteboard</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Features</a>
            <a href="#how" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">How It Works</a>
            <a href="#cases" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Use Cases</a>
            <button className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-all hover:shadow-lg">
              <a href="https://real-time-whiteboard-platform-priyansh.vercel.app/">Get Started</a>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Parallax */}
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
Unlock real-time collaboration—no latency, no login, no credit card needed.            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="group px-8 py-4 bg-gray-900 text-white rounded-full font-medium text-lg hover:bg-gray-800 transition-all hover:shadow-2xl hover:shadow-gray-900/20 flex items-center gap-2">
                Start Creating Free 
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                
              </button>
              {/* <button className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 rounded-full font-medium text-lg hover:border-gray-300 transition-all hover:shadow-xl">
                Watch Demo
              </button> */}
              
              <br></br>
              
            </div>
          </div>

          {/* Hero Visual */}
          <div
            className="relative max-w-5xl mx-auto"
            style={{ transform: `translateY(${scrollY * -0.15}px)` }}
          >
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-2 shadow-2xl border border-gray-200">
              <div className="bg-white rounded-2xl p-8 shadow-inner">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 font-medium">3 people collaborating</span>
                  </div>
                </div>

                <div className="aspect-video bg-gradient-to-br from-orange-50 to-rose-50 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

                  {/* Animated drawing elements */}
                  <div className="absolute top-20 left-20 w-32 h-32 border-4 border-orange-400 rounded-2xl transform rotate-12 animate-float"></div>
                  <div className="absolute bottom-24 right-32 w-40 h-2 bg-rose-400 rounded-full animate-draw"></div>
                  <div className="absolute top-32 right-24 w-24 h-24 border-4 border-amber-400 rounded-full animate-float-delayed"></div>

                  <div className="relative z-10 text-center p-8">
                    <Pencil className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-bounce-slow" />
                    <p className="text-gray-600 font-medium">Your canvas awaits</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '0ms', label: 'Latency', icon: <Zap className="w-6 h-6" /> },
              { value: '50+', label: 'Users/Room', icon: <Users className="w-6 h-6" /> },
              { value: '100%', label: 'Free', icon: <Star className="w-6 h-6" /> },
              { value: '24/7', label: 'Available', icon: <Clock className="w-6 h-6" /> }
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-100 to-rose-100 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <div className="text-orange-600">{stat.icon}</div>
                </div>
                <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative">
        <div
          className="absolute right-0 top-1/4 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-30"
          style={{ transform: `translateX(${scrollY * 0.1}px)` }}
        ></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 font-light">Powerful features for seamless collaboration</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-7 h-7" />,
                title: 'Instant Sync',
                description: 'Real-time collaboration with zero lag. See changes as they happen.',
                gradient: 'from-orange-500 to-amber-500'
              },
              {
                icon: <Users className="w-7 h-7" />,
                title: 'Unlimited Users',
                description: 'Collaborate with 50+ people simultaneously. Perfect for teams.',
                gradient: 'from-rose-500 to-pink-500'
              },
              {
                icon: <Palette className="w-7 h-7" />,
                title: 'Rich Tools',
                description: 'Pencil, lines, shapes, and 16 million colors at your fingertips.',
                gradient: 'from-amber-500 to-yellow-500'
              },
              {
                icon: <Layers className="w-7 h-7" />,
                title: 'Private Drawing',
                description: 'Perfect your strokes privately before sharing with the team.',
                gradient: 'from-pink-500 to-rose-500'
              },
              {
                icon: <Sparkles className="w-7 h-7" />,
                title: 'Beautiful UI',
                description: 'Hand-drawn style with smooth animations. Delightful experience.',
                gradient: 'from-orange-500 to-rose-500'
              },
              {
                icon: <Clock className="w-7 h-7" />,
                title: 'No Setup',
                description: 'Start instantly. No installation, no login, no credit card.',
                gradient: 'from-amber-500 to-orange-500'
              }
            ].map((feature, index) => (
              <div
                key={index}
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
        <div
          className="absolute left-0 top-1/3 w-96 h-96 bg-rose-100 rounded-full blur-3xl opacity-30"
          style={{ transform: `translateX(${scrollY * -0.1}px)` }}
        ></div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Simple as 1, 2, 3
            </h2>
            <p className="text-xl text-gray-600 font-light">Get started in seconds</p>
          </div>

          <div className="space-y-24">
            {[
              {
                step: '01',
                title: 'Create or Join Room',
                description: 'Generate a unique room ID or join an existing session. Share the code with your team.',
                color: 'orange'
              },
              {
                step: '02',
                title: 'Choose Your Tools',
                description: 'Pick from pencil, line, or rectangle tools. Select your favorite color and start drawing.',
                color: 'rose'
              },
              {
                step: '03',
                title: 'Collaborate Live',
                description: 'Watch as everyone\'s creations appear instantly. Undo, redo, and clear together seamlessly.',
                color: 'amber'
              }
            ].map((item, index) => (
              <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12`}>
                <div className="flex-1">
                  <div className={`text-8xl font-bold text-${item.color}-200 mb-4`}>{item.step}</div>
                  <h3 className="text-4xl font-bold mb-4">{item.title}</h3>
                  <p className="text-xl text-gray-600 leading-relaxed">{item.description}</p>
                </div>
                <div className="flex-1">
                  <div className={`bg-gradient-to-br from-${item.color}-50 to-${item.color}-100 rounded-3xl p-12 shadow-xl border border-${item.color}-200`}>
                    <div className="aspect-square bg-white rounded-2xl shadow-inner flex items-center justify-center">
                      <div className={`text-${item.color}-400 text-6xl font-bold opacity-20`}>{item.step}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                description: 'Interactive lessons, live diagrams, and collaborative learning experiences.',
                emoji: '📚',
                color: 'orange'
              },
              {
                title: 'Design Teams',
                description: 'Wireframing, brainstorming, and client presentations made simple.',
                emoji: '🎨',
                color: 'rose'
              },
              {
                title: 'Business Teams',
                description: 'Flowcharts, strategy sessions, and visual planning in real-time.',
                emoji: '💼',
                color: 'amber'
              },
              {
                title: 'Creative Groups',
                description: 'Collaborative art, fun projects, and creative expression together.',
                emoji: '✨',
                color: 'pink'
              }
            ].map((useCase, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-gray-50 to-white rounded-3xl p-10 border-2 border-gray-100 hover:border-gray-200 transition-all hover:shadow-2xl"
              >
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform inline-block">{useCase.emoji}</div>
                <h3 className="text-3xl font-bold mb-4">{useCase.title}</h3>
                <p className="text-lg text-gray-600 leading-relaxed">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
            <a href="https://real-time-whiteboard-platform-priyansh.vercel.app/">Start Drawing Now</a>
          </button>
          <p className="text-white/80 mt-8 font-light">No credit card/Login required. Free forever.</p>
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
