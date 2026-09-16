import Link from 'next/link'
import { BookOpen, Upload, FolderOpen, Globe, Zap, ArrowRight, FileText, Video, Youtube, Instagram } from 'lucide-react'
import { Footer } from '@/components/layout/Footer'

const features = [
  {
    icon: Upload,
    title: 'Upload Anything',
    description: 'PDF notes, videos, YouTube links, Instagram reels — all in one place.',
    color: '#6366f1',
  },
  {
    icon: FolderOpen,
    title: 'Organised by Subject',
    description: 'Content neatly sorted into subjects so students find what they need instantly.',
    color: '#10b981',
  },
  {
    icon: Globe,
    title: 'Access Anywhere',
    description: 'Learn on any device — mobile, tablet, or desktop. No app needed.',
    color: '#f59e0b',
  },
  {
    icon: Zap,
    title: 'Learn at Your Pace',
    description: 'Watch, rewatch, and download. Your learning journey, your schedule.',
    color: '#8b5cf6',
  },
]

const sampleSubjects = [
  { name: 'Mathematics', description: 'Algebra, Calculus, Probability', color: '#6366f1', lessons: 4 },
  { name: 'Physics', description: 'Mechanics, Optics, Thermodynamics', color: '#8b5cf6', lessons: 4 },
  { name: 'Computer Science', description: 'Data Structures, Algorithms, Web Dev', color: '#ef4444', lessons: 4 },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f0f13]">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-[#0f0f13]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Simi<span className="text-indigo-400">Hub</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all duration-150 shadow-lg shadow-indigo-500/20"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Gradient bg effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-medium text-indigo-400 mb-6">
            <Zap className="w-3 h-3" />
            Free access for all students
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
            Learn Smarter with{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Simi
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Your one-stop learning hub. Access curated notes, video lectures, YouTube tutorials,
            and more — all organised by subject, available on any device.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all duration-150 shadow-xl shadow-indigo-500/25"
            >
              Sign Up Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all duration-150"
            >
              View Subjects
            </Link>
          </div>

          {/* Content type icons */}
          <div className="flex items-center justify-center gap-6 mt-12">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <FileText className="w-4 h-4 text-blue-400" /> Notes
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Video className="w-4 h-4 text-purple-400" /> Videos
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Youtube className="w-4 h-4 text-red-400" /> YouTube
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Instagram className="w-4 h-4 text-pink-400" /> Instagram
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Everything you need to learn
          </h2>
          <p className="text-sm text-gray-500 mt-2">A platform built for focused, distraction-free learning</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="bg-[#1a1a24] rounded-xl border border-white/[0.06] p-6 hover:border-white/15 transition-all duration-200 group"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: feature.color }} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Subject preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 border-t border-white/5">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Explore subjects
          </h2>
          <p className="text-sm text-gray-500 mt-2">Here&apos;s a preview of what&apos;s waiting for you</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {sampleSubjects.map((subject) => (
            <div
              key={subject.name}
              className="bg-[#1a1a24] rounded-xl border border-white/[0.06] p-6 text-center hover:border-white/15 transition-all duration-200"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${subject.color}20` }}
              >
                <BookOpen className="w-6 h-6" style={{ color: subject.color }} />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">{subject.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{subject.description}</p>
              <p className="text-xs font-medium text-indigo-400">{subject.lessons} Lessons</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Sign up to access all subjects
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
