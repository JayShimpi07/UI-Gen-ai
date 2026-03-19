const Babel = require("@babel/standalone");

function test() {
  const code = `import { Card } from '@/components/ui';
export default function App() { return <Card /> }`;

  const imports = new Set();
  const requestedNamedExports = new Map();

  const result = Babel.transform(code, {
    filename: 'test.tsx',
    presets: [
      ["react", { runtime: "automatic" }],
      "typescript",
    ],
    plugins: [
      function importTracker() {
        return {
          visitor: {
            ImportDeclaration(path) {
              const source = path.node.source.value;
              imports.add(source);
              if (!requestedNamedExports.has(source)) {
                requestedNamedExports.set(source, new Set());
              }
              const names = requestedNamedExports.get(source);
              
              path.node.specifiers.forEach((specifier) => {
                if (specifier.type === 'ImportSpecifier') {
                  names.add(specifier.imported.name);
                }
              });
            }
          }
        };
      }
    ],
  });

  console.log("Imports:", imports);
  console.log("Named Exports:");
  requestedNamedExports.forEach((v, k) => {
    console.log(k, Array.from(v));
  });
}

test();
