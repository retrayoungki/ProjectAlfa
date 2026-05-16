import { loadEstimation } from './src/services/costEstimationService.js'
import { getProjects } from './src/utils/projectService.js'

async function debug() {
  const projects = getProjects()
  const p = projects.find(x => x.name.includes('Demak'))
  if (!p) {
    console.log('Project not found')
    return
  }
  console.log('Project:', p.name, 'ID:', p.id)
  const data = await loadEstimation(p.id)
  console.log('Sections:')
  data.sections.forEach(s => {
    const items = data.items.filter(i => i.sectionId === s.id)
    const base = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unitPrice)), 0)
    console.log(`- ${s.category}: Rp ${base.toLocaleString()}`)
  })
}
debug()
