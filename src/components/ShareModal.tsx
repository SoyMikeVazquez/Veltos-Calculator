"use client"

import { useState } from 'react'
import {
  X,
  Copy,
  Check,
  Printer,
  Mail,
  Share2,
  ExternalLink,
  ShieldCheck,
  FileText
} from 'lucide-react'
import type { RoofEstimateState } from '@/lib/estimateShare'
import { translations, Language } from '@/lib/translations'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  estimate: RoofEstimateState
  shareUrl: string
  lang: Language
}

export default function ShareModal({
  isOpen,
  onClose,
  estimate,
  shareUrl,
  lang
}: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [isPrintView, setIsPrintView] = useState(false)
  const t = translations[lang]

  if (!isOpen) return null

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && shareUrl) {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch (err) {
      console.error('Failed to copy share link:', err)
    }
  }

  const handleWhatsAppShare = () => {
    const text = lang === 'en'
      ? `Roofing Estimate for ${estimate.addressText || 'Property'} by Veltos Home Improvement: Total $${Math.round(estimate.totalEstimate).toLocaleString('en-US')} USD (${estimate.squaresNeeded.toFixed(1)} Squares). View exact 3D roof estimate: ${shareUrl}`
      : `Cotización de Techo para ${estimate.addressText || 'la propiedad'} por Veltos Home Improvement: Total $${Math.round(estimate.totalEstimate).toLocaleString('en-US')} USD (${estimate.squaresNeeded.toFixed(1)} Squares). Ver estimación 3D con puntos exactos: ${shareUrl}`
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank')
  }

  const handleEmailShare = () => {
    const subject = lang === 'en'
      ? `Roofing Estimate Proposal - ${estimate.id} (Veltos Home Improvement)`
      : `Propuesta de Cotización de Techo - ${estimate.id} (Veltos Home Improvement)`
    const body = lang === 'en'
      ? `Hello,\n\nPlease find the detailed roofing estimate below:\n\nEstimate ID: ${estimate.id}\nProperty: ${estimate.addressText || 'Coordinates: ' + estimate.lat.toFixed(5) + ', ' + estimate.lng.toFixed(5)}\nRoof Style: ${estimate.roofType}\nPitch: ${estimate.pitchRise}/12\nTotal Squares: ${estimate.squaresNeeded.toFixed(1)} Squares\nEstimated Total: $${Math.round(estimate.totalEstimate).toLocaleString('en-US')} USD\n\nYou can interact with the exact 3D satellite model and specifications here:\n${shareUrl}\n\nBest regards,\nVeltos Home Improvement\nhttps://veltoshi.com`
      : `Hola,\n\nAdjunto la cotización detallada de techado:\n\nFolio: ${estimate.id}\nPropiedad: ${estimate.addressText || 'Coordenadas: ' + estimate.lat.toFixed(5) + ', ' + estimate.lng.toFixed(5)}\nEstilo de Techo: ${estimate.roofType}\nInclinación: ${estimate.pitchRise}/12\nTotal Squares: ${estimate.squaresNeeded.toFixed(1)} Squares\nInversión Estimada: $${Math.round(estimate.totalEstimate).toLocaleString('en-US')} USD\n\nPuedes interactuar con el modelo satelital 3D y las medidas exactas en el siguiente enlace:\n${shareUrl}\n\nSaludos cordiales,\nVeltos Home Improvement\nhttps://veltoshi.com`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Veltos Roofing Estimate - ${estimate.id}`,
          text: `Exact 3D roofing estimate: $${Math.round(estimate.totalEstimate).toLocaleString('en-US')} USD (${estimate.squaresNeeded.toFixed(1)} Squares).`,
          url: shareUrl
        })
      } catch (err) {
        console.warn('Native share dismissed:', err)
      }
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const unitArea = lang === 'en' ? 'sq ft' : 'pies²'
  const unitLinear = lang === 'en' ? 'linear ft' : 'pies lineales'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Share2 size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                {t.share.shareModalTitle}
              </h3>
              <p className="text-[11px] text-slate-500">
                {estimate.id} &bull; {new Date(estimate.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <p className="text-xs text-slate-600 leading-relaxed">
            {t.share.shareModalSubtitle}
          </p>

          {/* Validated Summary Card (Pure Black #000000 with Blue) */}
          <div className="bg-black text-white p-4 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
                <ShieldCheck size={15} />
                <span>{t.share.verifiedBadge}</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">
                {estimate.id}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                  {t.share.propertyLabel}
                </span>
                <span className="font-semibold text-neutral-200 truncate block">
                  {estimate.addressText || `${estimate.lat.toFixed(4)}, ${estimate.lng.toFixed(4)}`}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                  {t.share.roofModelLabel}
                </span>
                <span className="font-semibold text-neutral-200 capitalize block">
                  {estimate.roofType} ({estimate.pitchRise}/12 pitch)
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                  {t.share.totalSquaresLabel}
                </span>
                <span className="text-base font-black text-white block">
                  {estimate.squaresNeeded.toFixed(1)} <span className="text-xs font-normal text-blue-400">{t.calculator.squaresUnit}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                  {t.share.totalEstimateLabel}
                </span>
                <span className="text-lg font-black text-white block">
                  ${Math.round(estimate.totalEstimate).toLocaleString('en-US')} <span className="text-xs font-normal text-neutral-400">USD</span>
                </span>
              </div>
            </div>
          </div>

          {/* Shareable Link Box */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
              {t.share.copyLinkButton}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 outline-none select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? t.share.copied : t.share.copyLinkButton}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons: WhatsApp, Email, Native, Print */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <ExternalLink size={14} className="text-blue-600" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleEmailShare}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <Mail size={14} className="text-blue-600" />
              <span>Email</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            Veltos Home Improvement &bull; veltoshi.com
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold cursor-pointer transition-colors"
          >
            {t.share.close}
          </button>
        </div>
      </div>
    </div>
  )
}

