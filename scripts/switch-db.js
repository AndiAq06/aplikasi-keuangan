const fs = require('fs');
const path = require('path');

const targetProvider = process.argv[2];
if (!targetProvider || (targetProvider !== 'sqlite' && targetProvider !== 'postgresql')) {
  console.error('Please specify target provider: sqlite or postgresql');
  process.exit(1);
}

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
if (!fs.existsSync(schemaPath)) {
  console.error('schema.prisma not found at ' + schemaPath);
  process.exit(1);
}

let content = fs.readFileSync(schemaPath, 'utf8');

// Match the provider inside datasource db block
const updatedContent = content.replace(
  /(datasource\s+db\s*{[\s\S]*?provider\s*=\s*")[^"]+("[^}]*})/g,
  `$1${targetProvider}$2`
);

fs.writeFileSync(schemaPath, updatedContent, 'utf8');
console.log(`Successfully switched database provider in schema.prisma to: ${targetProvider}`);
