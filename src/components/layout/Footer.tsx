import { BookOpen } from 'lucide-react'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/5 bg-[#0f0f13]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-300">
              Simi<span className="text-indigo-400">Hub</span>
            </span>
          </div>

          <p className="text-xs text-gray-600">
            &copy; {year} Simi Learning Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
