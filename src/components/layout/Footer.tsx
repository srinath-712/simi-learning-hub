import { BookOpen } from 'lucide-react'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              Simi<span className="text-indigo-600">Hub</span>
            </span>
          </div>

          <p className="text-xs text-slate-400">
            &copy; {year} Simi Learning Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
