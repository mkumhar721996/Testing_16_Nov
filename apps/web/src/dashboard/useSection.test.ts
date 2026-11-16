import { act, renderHook, waitFor } from '@testing-library/react'
import { useSection } from './useSection'
import type { SectionSource } from './types'

const source = (load: SectionSource<string[]>['load']): SectionSource<string[]> => ({
  load,
  isEmpty: (d) => d.length === 0,
})

describe('useSection', () => {
  it('starts loading, then errors on a rejected load (AC4)', async () => {
    const load = vi.fn().mockRejectedValue(new Error('x'))
    const { result } = renderHook(() => useSection(source(load)))
    expect(result.current.state.status).toBe('loading')
    await waitFor(() => expect(result.current.state.status).toBe('error'))
  })

  it('reports empty and loaded', async () => {
    const empty = renderHook(() => useSection(source(vi.fn().mockResolvedValue([]))))
    await waitFor(() => expect(empty.result.current.state.status).toBe('empty'))
    const full = renderHook(() => useSection(source(vi.fn().mockResolvedValue(['a']))))
    await waitFor(() => expect(full.result.current.state.status).toBe('loaded'))
  })

  it('retry shows loading synchronously (AC15)', async () => {
    const load = vi.fn().mockRejectedValue(new Error('x'))
    const { result } = renderHook(() => useSection(source(load)))
    await waitFor(() => expect(result.current.state.status).toBe('error'))
    act(() => result.current.retry())
    expect(result.current.state.status).toBe('loading')
    await waitFor(() => expect(result.current.state.status).toBe('error'))
  })

  it('retry that succeeds shows loaded (AC5)', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue(['a'])
    const { result } = renderHook(() => useSection(source(load)))
    await waitFor(() => expect(result.current.state.status).toBe('error'))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.state.status).toBe('loaded'))
  })

  it('retry that fails keeps error (AC6)', async () => {
    const load = vi.fn().mockRejectedValue(new Error('x'))
    const { result } = renderHook(() => useSection(source(load)))
    await waitFor(() => expect(result.current.state.status).toBe('error'))
    await act(async () => result.current.retry())
    expect(result.current.state.status).toBe('error')
  })

  it('stays unlimited after 10 failed retries (AC7)', async () => {
    const load = vi.fn().mockRejectedValue(new Error('x'))
    const { result } = renderHook(() => useSection(source(load)))
    await waitFor(() => expect(result.current.state.status).toBe('error'))
    for (let i = 0; i < 10; i++) {
      await act(async () => result.current.retry())
    }
    expect(result.current.state.status).toBe('error')
    act(() => result.current.retry())
    expect(result.current.state.status).toBe('loading')
    expect(load).toHaveBeenCalledTimes(12)
  })

  it('ignores a stale response that resolves after a newer one', async () => {
    let resolveOld: (v: string[]) => void = () => {}
    const load = vi
      .fn()
      .mockImplementationOnce(() => new Promise<string[]>((r) => (resolveOld = r)))
      .mockResolvedValueOnce(['new'])
    const { result } = renderHook(() => useSection(source(load)))
    act(() => result.current.reload())
    await waitFor(() => expect(result.current.state).toEqual({ status: 'loaded', data: ['new'] }))
    await act(async () => resolveOld(['old']))
    expect(result.current.state).toEqual({ status: 'loaded', data: ['new'] })
  })
})
