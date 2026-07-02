import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Sparkles, ArrowRight, Command } from 'lucide-react'
import { aiApi } from '../../lib/api'

const QUICK_ACTIONS = [
  { label: 'Create campaign for Pest Control', prompt: 'create campaign' },
  { label: 'Create follow-up workflow', prompt: 'follow up workflow' },
  { label: 'Show hot leads', prompt: 'hot leads' },
  { label: 'Open team inbox', prompt: 'inbox' },
]

export function AICommandBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', click)
    return () => document.removeEventListener('mousedown', click)
  }, [])

  const execute = async (text: string) => {
    const q = text.toLowerCase()
    setLoading(true)
    setResult(null)
    try {
      if (q.includes('campaign') || q.includes('broadcast')) {
        navigate('/whatsapp-crm/campaigns?wizard=1')
        setResult('Opening campaign builder...')
      } else if (q.includes('follow') || q.includes('workflow') || q.includes('automation')) {
        await aiApi.generateWorkflow(text)
        navigate('/whatsapp-crm/campaigns')
        setResult('Workflow created — open Campaigns to continue')
      } else if (q.includes('hot lead') || q.includes('lead') || q.includes('crm')) {
        navigate('/whatsapp-crm/contacts?filter=hot')
        setResult('Showing hot leads')
      } else if (q.includes('inbox') || q.includes('chat')) {
        navigate('/whatsapp-crm/inbox')
        setResult('Opening inbox')
      } else if (q.includes('analytic') || q.includes('insight')) {
        navigate('/whatsapp-crm/dashboard')
        setResult('Opening dashboard')
      } else {
        const res = await aiApi.chat(text)
        setResult(res.data?.data?.reply ?? res.data?.reply ?? 'Done.')
      }
    } catch {
      setResult('Something went wrong')
    } finally {
      setLoading(false)
      setTimeout(() => { setOpen(false); setQuery(''); setResult(null) }, 1400)
    }
  }

  return (
    <div ref={ref} className="relative mx-4 hidden flex-1 max-w-xl md:block">
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-full items-center gap-2 rounded-[50px] border px-4 text-xs transition-all hover:shadow-sm"
        style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        <Sparkles className="h-4 w-4 shrink-0 text-brand-600" />
        <span className="flex-1 text-left">Ask AI anything...</span>
        <kbd className="hidden items-center gap-0.5 rounded-[50px] border px-2 py-0.5 text-[10px] font-medium lg:inline-flex"
          style={{ borderColor: 'var(--border)' }}>
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[20px] border shadow-2xl"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
            <Search className="h-4 w-4 text-brand-600" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && query.trim() && execute(query)}
              placeholder="Create campaign, show hot leads, build workflow..."
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--text-primary)' }} />
            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600/30 border-t-brand-600" />}
          </div>
          {result && <div className="border-b px-4 py-3 text-sm text-brand-600" style={{ borderColor: 'var(--border)' }}>{result}</div>}
          <div className="p-2">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Quick actions</p>
            {QUICK_ACTIONS.map((a) => (
              <button key={a.label} onClick={() => execute(a.prompt)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-[var(--hover)]"
                style={{ color: 'var(--text-primary)' }}>
                {a.label}<ArrowRight className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
