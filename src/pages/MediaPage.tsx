import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Image, Upload, Video } from 'lucide-react'
import { campaignApi } from '../lib/api'
import { PageHeader, DataTable } from '../components/ui/PageLayout'
import { Button } from '../components/ui/Button'
import { formatDate } from '../lib/utils'

interface MediaAsset {
  id: string
  name: string
  asset_type: 'image' | 'video' | 'document' | 'pdf'
  file_url: string
  mime_type: string
  file_size: number
  meta_media_id: string
  created_at: string
}

const assetIcons = {
  image: Image,
  video: Video,
  document: FileText,
  pdf: FileText,
}

function formatBytes(value: number) {
  if (!value) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unit]}`
}

export function MediaPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [assetType, setAssetType] = useState<MediaAsset['asset_type']>('image')
  const [file, setFile] = useState<File | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['media-assets'],
    queryFn: () => campaignApi.media().then((r) => r.data.results ?? r.data.data ?? r.data),
  })

  const media = useMemo(() => ((data as MediaAsset[]) ?? []).filter((asset) => {
    const haystack = `${asset.name} ${asset.asset_type} ${asset.mime_type}`.toLowerCase()
    return !search || haystack.includes(search.toLowerCase())
  }), [data, search])

  const upload = useMutation({
    mutationFn: () => {
      const payload = new FormData()
      payload.append('name', name || file?.name || 'WhatsApp media')
      payload.append('asset_type', assetType)
      if (file) payload.append('file', file)
      return campaignApi.uploadMedia(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] })
      setName('')
      setFile(null)
    },
  })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Media Library"
        subtitle="Upload images, videos, PDFs, and documents for WhatsApp templates and campaigns"
      />

      <div className="surface-card mb-4 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Upload className="h-4 w-4 text-brand-600" />
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Upload media</h3>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_1.4fr_auto]">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Display name"
            className="h-11 rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <select
            value={assetType}
            onChange={(event) => setAssetType(event.target.value as MediaAsset['asset_type'])}
            className="h-11 rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="document">Document</option>
          </select>
          <input
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="h-11 rounded-lg border px-3 py-2 text-sm focus:border-[#1876f2] focus:outline-none"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <Button onClick={() => file && upload.mutate()} loading={upload.isPending} disabled={!file}>
            Upload
          </Button>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'File', render: (asset) => {
            const Icon = assetIcons[asset.asset_type] ?? FileText
            return (
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-medium">{asset.name}</span>
              </div>
            )
          } },
          { key: 'asset_type', label: 'Type', render: (asset) => <span className="capitalize">{asset.asset_type}</span> },
          { key: 'file_size', label: 'Size', render: (asset) => formatBytes(asset.file_size) },
          { key: 'meta_media_id', label: 'Meta Media ID', render: (asset) => asset.meta_media_id || 'Upload to Meta on send' },
          { key: 'created_at', label: 'Uploaded', render: (asset) => formatDate(asset.created_at) },
        ]}
        data={media}
        search={search}
        onSearch={setSearch}
        loading={isLoading}
        actions={(asset) => asset.file_url ? (
          <Button size="sm" variant="secondary" onClick={() => window.open(asset.file_url, '_blank')}>
            Open
          </Button>
        ) : null}
      />
    </div>
  )
}
