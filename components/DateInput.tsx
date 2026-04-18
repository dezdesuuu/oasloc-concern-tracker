'use client'

import { useState, useEffect } from 'react'

interface DateInputProps {
  value: string // YYYY-MM-DD or ''
  onChange: (value: string) => void // emits YYYY-MM-DD or ''
  id?: string
  name?: string
  required?: boolean
  className?: string
  placeholder?: string
}

export function DateInput({
  value,
  onChange,
  id,
  name,
  required,
  className = '',
  placeholder = 'mm/dd/yyyy',
}: DateInputProps) {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    if (!value) {
      setDisplay('')
      return
    }
    const [y, m, d] = value.split('-')
    if (y && m && d) setDisplay(`${m}/${d}/${y}`)
    else setDisplay('')
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setDisplay(raw)

    if (!raw) {
      onChange('')
      return
    }

    const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (match) {
      const [, m, d, y] = match
      const candidate = `${y}-${m}-${d}`
      const date = new Date(candidate)
      if (!isNaN(date.getTime())) {
        onChange(candidate)
      }
    }
  }

  return (
    <input
      type="text"
      id={id}
      name={name}
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    />
  )
}
