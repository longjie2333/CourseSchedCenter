import { useCallback, useEffect, useRef, useState } from 'react'
import { adminApi, ApiError, type FeedbackDetail, type FeedbackListResponse } from '../../admin-api.ts'
import { ColumnGrid } from '../column.tsx'
import { FeedbackDetailPanel } from './feedback-detail.tsx'
import { FeedbackList } from './feedback-list.tsx'
import { FeedbackReport } from './feedback-report.tsx'
import type { StatusFilter } from './feedback-status.ts'
import { notify } from '../notify.ts'

export function FeedbackView({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [list, setList] = useState<FeedbackListResponse | null>(null)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [loadingList, setLoadingList] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [detail, setDetail] = useState<FeedbackDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  /** Only the newest list request may write state; older ones are dropped. */
  const requestSeq = useRef(0)

  const fetchList = useCallback(
    async (statusArg: StatusFilter, pageArg: number) => {
      const seq = ++requestSeq.current
      await Promise.resolve()
      setLoadingList(true)
      setListError(null)
      try {
        const response = await adminApi.listFeedback(statusArg, pageArg)
        if (seq !== requestSeq.current) return
        setList(response)
      } catch (cause) {
        if (cause instanceof ApiError && cause.status === 401) {
          onUnauthorized()
          return
        }
        if (seq !== requestSeq.current) return
        setListError(cause instanceof Error ? cause.message : '反馈列表加载失败')
      } finally {
        if (seq === requestSeq.current) setLoadingList(false)
      }
    },
    [onUnauthorized],
  )

  const fetchDetail = useCallback(
    async (id: number) => {
      await Promise.resolve()
      setLoadingDetail(true)
      try {
        setDetail(await adminApi.getFeedback(id))
      } catch (cause) {
        if (cause instanceof ApiError && cause.status === 401) {
          onUnauthorized()
          return
        }
        if (cause instanceof ApiError && cause.status === 404) {
          setDetail(null)
          return
        }
        notify(cause instanceof Error ? cause.message : '详情加载失败', 'error')
      } finally {
        setLoadingDetail(false)
      }
    },
    [onUnauthorized],
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await Promise.resolve()
      if (cancelled) return
      await fetchList(status, page)
    })()
    return () => {
      cancelled = true
    }
  }, [fetchList, page, status])

  // Keep a row selected: clear when the page is empty, otherwise fall back to the first row.
  useEffect(() => {
    if (!list) return
    let cancelled = false
    void (async () => {
      await Promise.resolve()
      if (cancelled) return
      const first = list.items[0]
      if (!first) {
        setDetail(null)
        return
      }
      const currentId = detail?.id ?? null
      const stillPresent = currentId !== null && list.items.some((item) => item.id === currentId)
      if (!stillPresent) await fetchDetail(first.id)
    })()
    return () => {
      cancelled = true
    }
  }, [detail, fetchDetail, list])

  function changeStatus(next: StatusFilter) {
    if (next === status) return
    setStatus(next)
    setPage(1)
  }

  function handleDetailUpdated(updated: FeedbackDetail) {
    setDetail(updated)
    void fetchList(status, page)
  }

  return (
    <ColumnGrid>
      <FeedbackList
        error={listError}
        list={list}
        loading={loadingList}
        onPageChange={setPage}
        onRefresh={() => void fetchList(status, page)}
        onSelect={(id) => void fetchDetail(id)}
        onStatusChange={changeStatus}
        page={page}
        selectedId={detail?.id ?? null}
        status={status}
      />

      <FeedbackReport detail={detail} loading={loadingDetail} />

      <FeedbackDetailPanel
        detail={detail}
        key={detail?.id ?? 'empty'}
        loading={loadingDetail}
        onRefresh={() => {
          if (detail) void fetchDetail(detail.id)
        }}
        onUnauthorized={onUnauthorized}
        onUpdated={handleDetailUpdated}
      />
    </ColumnGrid>
  )
}
