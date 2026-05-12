const INV_KEY = 'alfa_invoices'

export const getAllInvoices = () => {
  try {
    return JSON.parse(localStorage.getItem(INV_KEY) || '[]')
  } catch {
    return []
  }
}

export const saveInvoices = (invs) => {
  localStorage.setItem(INV_KEY, JSON.stringify(invs))
}

/**
 * Get the next available invoice stage for a project.
 * Returns 30 if none exist, 50 if 30 exists, etc.
 * If 100 already exists, returns null (complete).
 */
export const getNextInvoiceStage = (projectName) => {
  const invs = getAllInvoices().filter(i => i.project === projectName)
  const stages = invs.map(i => i.stage)
  
  if (!stages.includes(30)) return 30
  if (!stages.includes(50)) return 50
  if (!stages.includes(75)) return 75
  if (!stages.includes(100)) return 100
  return null
}

export const submitInvoice = (invData) => {
  const invs = getAllInvoices()
  const newInv = {
    ...invData,
    id: `INV-${Date.now()}`,
    createdAt: new Date().toISOString()
  }
  invs.push(newInv)
  saveInvoices(invs)
  return newInv
}
