const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getMaterials = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = projectId ? { projectId } : {};
    const materials = await prisma.material.findMany({ 
        where: filter,
        orderBy: { updatedAt: 'desc' }
    });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMaterialById = async (req, res) => {
  try {
    const material = await prisma.material.findUnique({
      where: { id: req.params.id },
      include: { attachments: true, history: { orderBy: { createdAt: 'desc' } } }
    });
    if (!material) return res.status(404).json({ error: "Not found" });
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createMaterial = async (req, res) => {
  try {
    const data = req.body;
    
    // Duplicate Check
    const existing = await prisma.material.findFirst({
      where: {
        name: data.name,
        projectId: data.projectId,
        supplier: data.supplier,
        brand: data.brand
      }
    });
    
    if (existing) {
      return res.status(400).json({ error: "Potential duplicate material detected based on Name, Supplier, and Brand." });
    }

    // Auto-code generation
    const count = await prisma.material.count();
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    data.code = `MAT-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    // Auto calculate stock
    data.availableStock = (Number(data.currentStock) || 0) - (Number(data.reservedStock) || 0);

    const material = await prisma.material.create({ data });
    
    // Log history
    await prisma.materialHistory.create({
      data: {
        materialId: material.id,
        action: 'CREATED',
        description: 'Material created in system.'
      }
    });

    res.status(201).json(material);
  } catch (error) {
    console.error("Material creation error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // Avoid overriding fields that aren't supplied unless explicitly passed
    // Remove attachments and history fields from data if they exist to prevent Prisma relations error
    delete data.attachments;
    delete data.history;
    delete data.id;

    // Auto calculate stock
    if (data.currentStock !== undefined || data.reservedStock !== undefined) {
       const existing = await prisma.material.findUnique({ where: { id } });
       const current = data.currentStock !== undefined ? Number(data.currentStock) : existing.currentStock;
       const reserved = data.reservedStock !== undefined ? Number(data.reservedStock) : existing.reservedStock;
       data.availableStock = current - reserved;
    }

    const material = await prisma.material.update({
      where: { id },
      data
    });
    
    await prisma.materialHistory.create({
      data: {
        materialId: id,
        action: 'UPDATED',
        description: 'Material specifications updated.'
      }
    });

    res.json(material);
  } catch (error) {
    console.error("Material update error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    await prisma.material.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMaterialHistory = async (req, res) => {
  try {
    const history = await prisma.materialHistory.findMany({
      where: { materialId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
