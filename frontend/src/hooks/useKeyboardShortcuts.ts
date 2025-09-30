import { useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  callback: () => void
  description: string
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return

    const handleKeyPress = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey
        const altMatch = shortcut.altKey === undefined || shortcut.altKey === event.altKey
        const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase()

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault()
          shortcut.callback()
          break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [shortcuts, enabled])
}

export const showKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const formatShortcut = (shortcut: KeyboardShortcut): string => {
    const parts = []
    if (shortcut.ctrlKey) parts.push('Ctrl')
    if (shortcut.shiftKey) parts.push('Shift')
    if (shortcut.altKey) parts.push('Alt')
    parts.push(shortcut.key.toUpperCase())
    return parts.join(' + ')
  }

  const shortcutList = shortcuts
    .map(s => `${formatShortcut(s)}: ${s.description}`)
    .join('\n')

  alert(`Keyboard Shortcuts:\n\n${shortcutList}`)
}