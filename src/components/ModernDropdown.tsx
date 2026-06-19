"use client"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"

interface DropdownOption {
  value: string
  label: string
  badge?: string
  color?: "neon" | "teal" | "amber" | "coral"
}

interface ModernDropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  disabled?: boolean
  variant?: "default" | "status"
  statusColors?: { [key: string]: string }
}

export default function ModernDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
  disabled = false,
  variant = "default",
  statusColors = {}
}: ModernDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)
  const displayLabel = selectedOption?.label || placeholder

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const baseStyles = "w-full flex items-center justify-between bg-black/40 border border-edge rounded-xl px-4 py-3 text-sm text-txt-primary transition-all focus:outline-none focus:border-neon focus:bg-neon/[0.05] focus:ring-2 focus:ring-neon/15 hover:border-white/15 hover:bg-black/60"
  
  const statusColorClass = variant === "status" && statusColors[value] ? statusColors[value] : ""
  const buttonStyle = variant === "status" 
    ? `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${statusColorClass || statusColors[selectedOption?.value || ""] || "bg-white/5 text-txt-muted border-white/10"}`
    : baseStyles

  return (
    <div className={`relative ${isOpen ? "z-50" : ""}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-txt-secondary mb-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`${buttonStyle} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-2 truncate text-left">
          <span>{displayLabel}</span>
          {selectedOption?.badge && (
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-txt-muted uppercase font-semibold tracking-wider">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-txt-muted flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-2 w-full rounded-xl border border-edge bg-surface backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {options.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between
                  ${value === option.value
                    ? "bg-neon/15 text-neon font-medium"
                    : "text-txt-primary hover:bg-white/10 hover:text-white"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span>{option.label}</span>
                  {option.badge && (
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-txt-muted uppercase font-semibold tracking-wider">
                      {option.badge}
                    </span>
                  )}
                </div>
                {value === option.value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Invisible backdrop to catch outside clicks */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}
