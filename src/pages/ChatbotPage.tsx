import { Bot, GitBranch, MessageSquare, FormInput } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

const builderBlocks = [
  { icon: MessageSquare, label: 'Send Message', desc: 'Text, media, or template' },
  { icon: FormInput, label: 'Collect Input', desc: 'Forms & questionnaires' },
  { icon: GitBranch, label: 'Condition', desc: 'Branch on user response' },
  { icon: Bot, label: 'AI Response', desc: 'GPT-powered replies' },
]

export function ChatbotPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Chatbot Builder</h1>
          <p className="mt-1 text-slate-400">
            Drag-and-drop flows with AI, forms, and appointment booking
          </p>
        </div>
        <Button>New Flow</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Flow Canvas">
            <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/30">
              <div className="text-center">
                <Bot className="mx-auto h-12 w-12 text-slate-600" />
                <p className="mt-4 text-slate-400">Visual flow builder coming in Phase 1</p>
                <p className="mt-1 text-sm text-slate-500">
                  Drag blocks from the palette to design conversation flows
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card title="Blocks">
            <div className="space-y-2">
              {builderBlocks.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex cursor-grab items-center gap-3 rounded-lg border border-slate-800 bg-slate-800/30 p-3 hover:border-brand-500/30 transition-colors"
                >
                  <div className="rounded-lg bg-brand-500/10 p-2">
                    <Icon className="h-4 w-4 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
