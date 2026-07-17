import { useCallback, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ReactFlow, Background, Controls, MiniMap, addEdge,
  useNodesState, useEdgesState, type Connection, type Node, type Edge,
  Handle, Position,
} from '@xyflow/react'
import { ArrowLeft, Save, Plus, MessageSquare, Image, MousePointer } from 'lucide-react'
import { automationApi } from '../lib/api'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { orgQueryKey } from '../lib/queryKeys'
import { useToast } from '../components/common'
import type { BotFlow } from '../types/bot'

function StartNode({ data }: { data: { trigger?: string } }) {
  return (
    <div className="min-w-[140px] rounded-lg border-2 border-brand-500 bg-white shadow-md">
      <Handle type="source" position={Position.Right} className="!bg-brand-600" />
      <div className="rounded-t-md bg-brand-600 px-3 py-1.5 text-xs font-bold text-white">Start</div>
      <div className="px-3 py-2 text-sm text-slate-600">Trigger: <strong>{data.trigger || 'hi'}</strong></div>
    </div>
  )
}

function ReplyNode({
  data,
}: {
  data: {
    title?: string
    content?: string
    mediaUrl?: string
    mediaType?: string
    options?: string[]
    replyType?: 'simple' | 'media' | 'interactive'
  }
}) {
  const replyType = data.replyType || 'simple'
  const options = data.options || []
  const headerClass = replyType === 'media'
    ? 'bg-blue-600'
    : replyType === 'interactive'
      ? 'bg-purple-600'
      : 'bg-slate-700'
  return (
    <div className="min-w-[180px] rounded-lg border border-slate-200 bg-white shadow-md">
      <Handle type="target" position={Position.Left} className="!bg-brand-600" />
      <div className={`flex items-center justify-between rounded-t-md px-2 py-1.5 ${headerClass}`}>
        <span className="text-xs font-semibold text-white">{data.title || 'Options'}</span>
        <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] uppercase text-white">
          {replyType}
        </span>
      </div>
      <div className="space-y-1 p-2">
        {replyType === 'media' && (
          <div className="rounded bg-blue-50 px-2 py-2 text-[10px] text-blue-700">
            {data.mediaType || 'image'} · {data.mediaUrl ? 'Media attached' : 'Add media URL'}
          </div>
        )}
        {data.content && <p className="max-w-[220px] whitespace-pre-wrap text-xs text-slate-600">{data.content}</p>}
        {replyType === 'interactive' && options.map((option, index) => (
          <div key={`${option}-${index}`} className="relative rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
            {option}
            <Handle
              id={`option-${index}`}
              type="source"
              position={Position.Right}
              className="!-right-3 !h-2.5 !w-2.5 !bg-purple-600"
              style={{ top: '50%' }}
            />
          </div>
        ))}
      </div>
      {replyType !== 'interactive' && (
        <Handle type="source" position={Position.Right} className="!bg-brand-600" />
      )}
    </div>
  )
}

function LeadNode({ data }: { data: { title?: string; message?: string } }) {
  return (
    <div className="min-w-[160px] rounded-lg border border-green-300 bg-white shadow-md">
      <Handle type="target" position={Position.Left} className="!bg-brand-600" />
      <div className="rounded-t-md bg-green-600 px-3 py-1.5 text-xs font-bold text-white">{data.title || 'Lead Capture'}</div>
      <div className="px-3 py-2 text-xs text-slate-600">{data.message || 'Lead saved!'}</div>
    </div>
  )
}

const nodeTypes = {
  start: StartNode,
  simple: ReplyNode,
  media: ReplyNode,
  interactive: ReplyNode,
  options: ReplyNode,
  lead: LeadNode,
}

export function FlowBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { organization } = useAuth()
  const orgId = organization?.id
  const toast = useToast()
  const [addMenuOpen, setAddMenuOpen] = useState(false)

  const { data: flowRes, isLoading } = useQuery({
    queryKey: orgQueryKey(orgId, 'bot-flow', id),
    queryFn: () => automationApi.getBotFlow(id!).then((r) => r.data.data ?? r.data),
    enabled: Boolean(id && orgId),
  })

  const flow = flowRes as BotFlow | undefined
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    if (flow?.flow_data) {
      const savedNodes = (flow.flow_data.nodes ?? []) as Node[]
      setNodes(savedNodes.length > 0 ? savedNodes : [{
        id: 'start',
        type: 'start',
        position: { x: 60, y: 180 },
        data: { trigger: flow.start_trigger || 'hi' },
      }])
      setEdges((flow.flow_data.edges ?? []) as Edge[])
    }
  }, [flow, setNodes, setEdges])

  const saveMutation = useMutation({
    mutationFn: () => automationApi.saveFlow(id!, { version: 1, nodes, edges }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKey(orgId, 'bot-flow', id) })
      toast.success('Bot flow saved')
    },
    onError: () => toast.error('Could not save bot flow'),
  })

  const toggleMutation = useMutation({
    mutationFn: () => automationApi.toggleBotFlow(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKey(orgId, 'bot-flow', id) })
      queryClient.invalidateQueries({ queryKey: orgQueryKey(orgId, 'bot-flows') })
    },
    onError: () => toast.error('Could not change flow status'),
  })

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } }, eds)),
    [setEdges],
  )

  const addNode = (type: 'simple' | 'media' | 'interactive' | 'lead') => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      position: { x: 200 + nodes.length * 50, y: 150 + nodes.length * 30 },
      data: type === 'interactive'
        ? {
          title: 'New Interactive Reply',
          content: 'Please select an option',
          options: ['Option 1', 'Option 2'],
          replyType: 'interactive',
        }
        : type === 'media'
          ? {
            title: 'New Media Reply',
            content: 'Media caption',
            mediaType: 'image',
            mediaUrl: '',
            replyType: 'media',
          }
          : type === 'lead'
          ? { title: 'Lead Confirmation', message: 'Thank you! We will contact you soon.' }
          : {
            title: 'New Simple Reply',
            content: 'Enter your reply message',
            replyType: 'simple',
          },
    }
    setNodes((nds) => [...nds, newNode])
    setAddMenuOpen(false)
  }

  if (isLoading) return <div className="flex h-64 items-center justify-center text-slate-400">Loading flow...</div>

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => navigate('/whatsapp-crm/bot-flows')}>
            <ArrowLeft className="h-4 w-4" /> Back to Bot Flows
          </Button>
          <div>
            <h2 className="font-bold text-brand-700">Bot Flow Builder</h2>
            <p className="text-sm text-slate-500">{flow?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-600">Status</span>
            <button
              onClick={() => toggleMutation.mutate()}
              className={`relative h-6 w-11 rounded-full transition-colors ${flow?.is_active ? 'bg-brand-600' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${flow?.is_active ? 'left-5' : 'left-0.5'}`} />
            </button>
          </label>
          <div className="relative">
            <Button onClick={() => setAddMenuOpen(!addMenuOpen)}>
              <Plus className="h-4 w-4" /> Add New Bot Reply ▾
            </Button>
            {addMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                <button onClick={() => addNode('simple')} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50">
                  <MessageSquare className="h-4 w-4 text-brand-600" /> Simple Bot Reply
                </button>
                <button onClick={() => addNode('media')} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50">
                  <Image className="h-4 w-4 text-blue-600" /> Media Bot Reply
                </button>
                <button onClick={() => addNode('interactive')} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50">
                  <MousePointer className="h-4 w-4 text-purple-600" /> Advanced Interactive Bot Reply
                </button>
              </div>
            )}
          </div>
          <Button variant="secondary" className="!bg-orange-500 !text-white hover:!bg-orange-600" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      <div className="flex-1 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-slate-50"
        >
          <Background gap={20} size={1} color="#e2e8f0" />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  )
}
