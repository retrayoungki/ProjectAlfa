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
export const updateInvoiceStatus = (invId, newStatus) => {
  const invs = getAllInvoices()
  const idx = invs.findIndex(i => i.id === invId)
  if (idx !== -1) {
    invs[idx].status = newStatus
    saveInvoices(invs)
    return true
  }
  return false
}
export const getProjectFinancialStatus = (projectName) => {
  const invs = getAllInvoices().filter(i => i.project === projectName)
  
  let totalReceived = 0
  const allowedScopes = new Set()

  invs.forEach(inv => {
    let multiplier = 0
    if (inv.status === '30% Paid') multiplier = 0.3
    else if (inv.status === '50% Paid') multiplier = 0.5
    else if (inv.status === '75% Paid') multiplier = 0.75
    else if (inv.status === 'Lunas') multiplier = 1.0

    if (multiplier > 0) {
      totalReceived += (inv.amount * multiplier)
      // Add scopes from items if they exist, otherwise use legacy scopeOfWork
      if (inv.items && inv.items.length > 0) {
        inv.items.forEach(item => {
          if (item.scope) allowedScopes.add(item.scope)
        })
      } else if (inv.scopeOfWork) {
        allowedScopes.add(inv.scopeOfWork)
      }
    }
  })

  return {
    totalReceived,
    allowedScopes: Array.from(allowedScopes),
    hasPayments: totalReceived > 0
  }
}

export const deleteInvoice = (invId) => {
  const invs = getAllInvoices()
  const filtered = invs.filter(i => i.id !== invId)
  if (invs.length !== filtered.length) {
    saveInvoices(filtered)
    return true
  }
  return false
}

