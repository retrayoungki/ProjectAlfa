const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany();
  console.log('Total projects in DB:', projects.length);
  projects.forEach(p => {
    console.log(`- ID: ${p.id}, Code: ${p.projectCode}, Name: ${p.projectName}, Status: ${p.status}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
