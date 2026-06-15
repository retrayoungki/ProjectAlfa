// Utility: format angka ke currency (IDR)
export const formatIDR = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

export const formatRp = (amount) => `Rp. ${Number(amount).toLocaleString('id-ID')}`

export const formatCompact = (amount) =>
  amount >= 1000 ? `Rp. ${(amount / 1000).toFixed(0)}K` : `Rp. ${amount}`

// Utility: format tanggal
export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

// Utility: hitung persentase
export const calcPercent = (value, total) =>
  total === 0 ? 0 : Math.round((value / total) * 100)

// Utility: truncate teks
export const truncate = (str, n = 40) =>
  str.length > n ? str.slice(0, n) + '…' : str

// Utility: cek apakah tanggal sudah lewat
export const isOverdue = (dueDateStr) =>
  new Date(dueDateStr) < new Date()
