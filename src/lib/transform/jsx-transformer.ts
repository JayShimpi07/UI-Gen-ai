import * as Babel from "@babel/standalone";

export interface TransformResult {
  code: string;
  error?: string;
  missingImports?: Set<string>;
  cssImports?: Set<string>;
  requestedNamedExports?: Map<string, Set<string>>;
}

function createPlaceholderModule(componentName: string, requiredExports: Set<string> = new Set()): string {
  // Sanitize component name to ensure it's a valid variable name
  const safeName = componentName.replace(/[^a-zA-Z0-9_$]/g, '_').replace(/^([0-9])/, '_$1');
  
  let exportsCode = `export default proxy;\nexport { proxy as ${safeName} };\n`;
  requiredExports.forEach((exp) => {
    if (exp !== 'default' && exp !== safeName) {
      exportsCode += `export { proxy as ${exp} };\n`;
    }
  });

  return `
import React from 'react';
const ${safeName} = function() {
  return React.createElement('div', { 
    style: { padding: '1rem', border: '1px dashed #ccc', margin: '0.5rem', borderRadius: '4px' }
  }, 'Placeholder: ' + '${safeName}');
}

// Support both default and named exports safely using a Proxy with a function target
const proxy = new Proxy(function() { return ${safeName}.apply(this, arguments); }, {
  get: function(target, prop) {
    if (prop === 'default') return ${safeName};
    if (prop === '__esModule') return true;
    // Special React component properties to avoid crashing
    if (prop === '$$typeof') return undefined; 
    return ${safeName};
  }
});

${exportsCode}
`;
}

export function transformJSX(
  code: string,
  filename: string,
  existingFiles: Set<string>
): TransformResult {
  try {
    const isTypeScript = filename.endsWith(".ts") || filename.endsWith(".tsx");

    const imports = new Set<string>();
    const cssImports = new Set<string>();
    const requestedNamedExports = new Map<string, Set<string>>();

    // Remove CSS imports from code pre-transform to avoid parsing issues, but Babel usually handles them fine if preserving modules.
    let processedCode = code;
    const cssImportRegex = /import\s+['"]([^'"]+\.css)['"]/g;
    let cssMatch;
    while ((cssMatch = cssImportRegex.exec(code)) !== null) {
      cssImports.add(cssMatch[1]);
    }
    processedCode = processedCode.replace(cssImportRegex, '');

    const result = Babel.transform(processedCode, {
      filename,
      presets: [
        ["react", { runtime: "automatic" }],
        ...(isTypeScript ? ["typescript"] : []),
      ],
      plugins: [
        function importTracker() {
          return {
            visitor: {
              ImportDeclaration(path: any) {
                const source = path.node.source.value;
                if (source.endsWith('.css')) {
                  cssImports.add(source);
                } else {
                  imports.add(source);
                  if (!requestedNamedExports.has(source)) {
                    requestedNamedExports.set(source, new Set());
                  }
                  const names = requestedNamedExports.get(source)!;
                  
                  path.node.specifiers.forEach((specifier: any) => {
                    if (specifier.type === 'ImportSpecifier') {
                      names.add(specifier.imported.name);
                    }
                  });
                }
              }
            }
          };
        },
        function transformNamedToNamespace({ types: t }: any) {
          return {
            visitor: {
              ImportDeclaration(path: any) {
                const source = path.node.source.value;
                // Only transform local files where missing exports are likely during incremental AI generation
                if (source.startsWith('react') || source.startsWith('lucide') || source.startsWith('http')) {
                  return;
                }
                
                const hasNamed = path.node.specifiers.some((s: any) => s.type === 'ImportSpecifier');
                if (!hasNamed) return;

                // Create a unique namespace identifier for the module
                const uid = path.scope.generateUidIdentifier('module');
                
                // Track all specifiers
                const defaultSpecifier = path.node.specifiers.find((s: any) => s.type === 'ImportDefaultSpecifier');
                const namespaceSpecifier = path.node.specifiers.find((s: any) => s.type === 'ImportNamespaceSpecifier');
                const namedSpecifiers = path.node.specifiers.filter((s: any) => s.type === 'ImportSpecifier');

                // Build new specifiers: default, namespace
                const newSpecifiers = [];
                if (defaultSpecifier) newSpecifiers.push(defaultSpecifier);
                if (namespaceSpecifier) newSpecifiers.push(namespaceSpecifier);
                
                // Add the new namespace import for the named exports
                newSpecifiers.push(t.importNamespaceSpecifier(uid));

                // Replace the import declaration
                path.node.specifiers = newSpecifiers;

                // Create constant property accesses for the named exports
                // e.g. const { Card } = _module;
                const declarations = namedSpecifiers.map((spec: any) => {
                  return t.variableDeclarator(
                     // Add fallback using a Proxy to prevent runtime crashes when React mounts undefined components
                     t.identifier(spec.local.name),
                     t.logicalExpression(
                       '||',
                       t.memberExpression(uid, t.identifier(spec.imported.name)),
                       // Provide an inline mock if undefined so React doesn't crash visually
                       // We return a simple string because `React` might not be in scope (due to automatic JSX runtime)
                       t.arrowFunctionExpression(
                         [], 
                         t.stringLiteral('[Missing Local Export: ' + spec.imported.name + ']')
                       )
                     )
                  );
                });

                if (declarations.length > 0) {
                  path.insertAfter(t.variableDeclaration('const', declarations));
                }
              }
            }
          };
        },
        function autoPolyfillMissingComponents({ types: t }: any) {
          const injected = new Set();
          return {
            visitor: {
              Program(path: any) {
                injected.clear();
              },
              JSXOpeningElement(path: any) {
                let identifierName = null;
                
                if (t.isJSXIdentifier(path.node.name)) {
                  identifierName = path.node.name.name;
                } else if (t.isJSXMemberExpression(path.node.name)) {
                  let obj = path.node.name.object;
                  while (t.isJSXMemberExpression(obj)) {
                    obj = obj.object;
                  }
                  if (t.isJSXIdentifier(obj)) {
                    identifierName = obj.name;
                  }
                }

                if (identifierName && /^[A-Z]/.test(identifierName)) {
                  if (!path.scope.hasBinding(identifierName) && !injected.has(identifierName)) {
                    injected.add(identifierName);
                    
                    const programPath = path.findParent((p: any) => p.isProgram());
                    if (programPath) {
                      // Inject: const ComponentName = new Proxy(() => "[Missing: ComponentName]", { get: (t, p) => p === '$$typeof' ? undefined : () => "[Missing: ComponentName.*]" });
                      const fallbackNode = t.variableDeclaration('const', [
                        t.variableDeclarator(
                          t.identifier(identifierName),
                          t.newExpression(t.identifier('Proxy'), [
                            t.arrowFunctionExpression([], t.stringLiteral(`[Missing Import: ${identifierName}]`)),
                            t.objectExpression([
                              t.objectProperty(
                                t.identifier('get'),
                                t.arrowFunctionExpression(
                                  [t.identifier('target'), t.identifier('prop')],
                                  t.blockStatement([
                                    t.ifStatement(
                                      t.binaryExpression('===', t.identifier('prop'), t.stringLiteral('$$typeof')),
                                      t.returnStatement(t.identifier('undefined'))
                                    ),
                                    t.returnStatement(
                                      t.arrowFunctionExpression([], t.stringLiteral(`[Missing Import: ${identifierName}.*]`))
                                    )
                                  ])
                                )
                              )
                            ])
                          ])
                        )
                      ]);
                      
                      programPath.unshiftContainer('body', fallbackNode);
                    }
                  }
                }
              }
            }
          };
        }
      ],
    });

    return {
      code: result.code || "",
      missingImports: imports,
      cssImports: cssImports,
      requestedNamedExports: requestedNamedExports,
    };
  } catch (error) {
    return {
      code: "",
      error: error instanceof Error ? error.message : "Unknown transform error",
    };
  }
}

export function createBlobURL(
  code: string,
  mimeType: string = "application/javascript"
): string {
  const blob = new Blob([code], { type: mimeType });
  return URL.createObjectURL(blob);
}

export interface ImportMapResult {
  importMap: string;
  styles: string;
  errors: Array<{ path: string; error: string }>;
}

export function createImportMap(files: Map<string, string>): ImportMapResult {
  // Check if App exists
  let hasApp = false;
  for (const path of files.keys()) {
    if (path.toLowerCase().endsWith('app.jsx') || path.toLowerCase().endsWith('app.tsx') || path.toLowerCase().endsWith('app.js') || path.toLowerCase().endsWith('app.ts')) {
      hasApp = true;
      break;
    }
  }

  const filesToProcess = new Map(files);

  // If no App component, create a placeholder that imports whatever component was generated
  if (!hasApp && filesToProcess.size > 0) {
    let firstComponentPath = "";
    let firstComponentName = "";
    
    for (const path of filesToProcess.keys()) {
      if (path.endsWith(".jsx") || path.endsWith(".tsx")) {
        firstComponentPath = path;
        const match = path.match(/\/([^\/]+)\.(jsx|tsx)$/);
        if (match) {
          firstComponentName = match[1];
        }
        break;
      }
    }

    if (firstComponentPath && firstComponentName) {
      filesToProcess.set('/App.jsx', `
import React from 'react';
import * as ComponentModule from '${firstComponentPath.replace(/\.(jsx|tsx)$/, '')}';

const DynamicComponent = ComponentModule.default || 
  Object.values(ComponentModule).find(exp => typeof exp === 'function' && exp.name && exp.name[0] === exp.name[0].toUpperCase()) || 
  (({ children }) => <div className="p-4 border border-red-500 bg-red-50 text-red-700 rounded-md">No valid React component exported from ${firstComponentName}</div>);

export default function App() {
  return (
    <div className="p-8 flex items-center justify-center min-h-screen bg-gray-50">
      <DynamicComponent />
    </div>
  );
}
      `);
    } else {
      filesToProcess.set('/App.jsx', `
import React from 'react';
export default function App() {
  return <div className="p-8 text-center text-gray-500">Generating components...</div>;
}
      `);
    }
  }

  const imports: Record<string, string> = {
    react: "https://esm.sh/react@19",
    "react-dom": "https://esm.sh/react-dom@19",
    "react-dom/client": "https://esm.sh/react-dom@19/client",
    "react/jsx-runtime": "https://esm.sh/react@19/jsx-runtime",
    "react/jsx-dev-runtime": "https://esm.sh/react@19/jsx-dev-runtime",
  };

  // Transform each file and create blob URLs
  const transformedFiles = new Map<string, string>();
  const existingFiles = new Set(filesToProcess.keys());
  const allImports = new Set<string>();
  const allCssImports = new Set<{ from: string; cssPath: string }>();
  const allRequestedNamedExports = new Map<string, Set<string>>();
  let collectedStyles = "";
  const errors: Array<{ path: string; error: string }> = [];

  // First pass: transform all files and collect imports
  for (const [path, content] of filesToProcess) {
    if (
      path.endsWith(".js") ||
      path.endsWith(".jsx") ||
      path.endsWith(".ts") ||
      path.endsWith(".tsx")
    ) {
      const { code, error, missingImports, cssImports, requestedNamedExports } = transformJSX(
        content,
        path,
        existingFiles
      );
      
      if (error) {
        // Track error for this file
        errors.push({ path, error });
        // Skip processing this file entirely
        continue;
      }
      
      // Normal successful transform
      const blobUrl = createBlobURL(code);
      transformedFiles.set(path, blobUrl);

      // Collect requested named exports
      if (requestedNamedExports) {
        requestedNamedExports.forEach((names, imp) => {
          if (!allRequestedNamedExports.has(imp)) {
            allRequestedNamedExports.set(imp, new Set());
          }
          const allNames = allRequestedNamedExports.get(imp)!;
          names.forEach(name => allNames.add(name));
        });
      }

      // Collect all imports
      if (missingImports) {
        missingImports.forEach((imp) => {
          // Check if this is a third-party package
          const isPackage = !imp.startsWith(".") && 
                            !imp.startsWith("/") && 
                            !imp.startsWith("@/");
          
          if (isPackage) {
            // Add third-party packages directly to import map ONLY IF they aren't predefined mapped (like React)
            if (!imports[imp]) {
              const separator = imp.includes('?') ? '&' : '?';
              imports[imp] = `https://esm.sh/${imp}${separator}external=react,react-dom`;
            }
          } else {
            // Add local imports to be processed later
            allImports.add(imp);
          }
        });
      }

      // Collect CSS imports
      if (cssImports) {
        cssImports.forEach((cssImport) => {
          allCssImports.add({ from: path, cssPath: cssImport });
        });
      }

      // Add to import map with absolute path
      imports[path] = blobUrl;

      // Also add without leading slash
      if (path.startsWith("/")) {
        imports[path.substring(1)] = blobUrl;
      }

      // Add @/ alias support - maps @/ to root directory
      if (path.startsWith("/")) {
        imports["@" + path] = blobUrl;
        imports["@/" + path.substring(1)] = blobUrl;
      }

      // Add entries without file extensions for all variations
      const pathWithoutExt = path.replace(/\.(jsx?|tsx?)$/, "");
      imports[pathWithoutExt] = blobUrl;

      if (path.startsWith("/")) {
        imports[pathWithoutExt.substring(1)] = blobUrl;
        imports["@" + pathWithoutExt] = blobUrl;
        imports["@/" + pathWithoutExt.substring(1)] = blobUrl;
      }
    } else if (path.endsWith(".css")) {
      // Collect CSS file content
      collectedStyles += `/* ${path} */\n${content}\n\n`;
    }
  }

  // Process CSS imports
  for (const { from, cssPath } of allCssImports) {
    // Resolve CSS path relative to the importing file
    let resolvedPath = cssPath;
    
    if (cssPath.startsWith("@/")) {
      // @/ alias points to root
      resolvedPath = cssPath.replace("@/", "/");
    } else if (cssPath.startsWith("./") || cssPath.startsWith("../")) {
      // Relative path
      const fromDir = from.substring(0, from.lastIndexOf("/"));
      resolvedPath = resolveRelativePath(fromDir, cssPath);
    }

    // Check if CSS file exists
    if (files.has(resolvedPath)) {
      // Already processed in the loop above
    } else {
      // CSS file not found
      collectedStyles += `/* ${cssPath} not found */\n`;
    }
  }

  // Second pass: create placeholder modules for missing imports
  for (const importPath of allImports) {
    // Skip if it's a known module or already exists
    if (imports[importPath] || importPath.startsWith("react")) {
      continue;
    }

    // Check if this is a third-party package (no relative path indicators)
    const isPackage = !importPath.startsWith(".") && 
                      !importPath.startsWith("/") && 
                      !importPath.startsWith("@/");

    if (isPackage) {
      // Handle third-party packages from esm.sh
      // Add ?external=react,react-dom to ensure they share the same React instance
      const separator = importPath.includes('?') ? '&' : '?';
      const packageUrl = "https://esm.sh/" + importPath + separator + "external=react,react-dom";
      imports[importPath] = packageUrl;
      continue;
    }

    // Check if the import exists in any form (local files)
    let found = false;
    const variations = [
      importPath,
      importPath + ".jsx",
      importPath + ".tsx",
      importPath + ".js",
      importPath + ".ts",
      importPath + "/index.jsx",
      importPath + "/index.js",
      importPath + "/index.tsx",
      importPath + "/index.ts",
      importPath.replace("@/", "/"),
      importPath.replace("@/", "/") + ".jsx",
      importPath.replace("@/", "/") + ".tsx",
      importPath.replace("@/", "/") + "/index.jsx",
      importPath.replace("@/", "/") + "/index.js",
    ];

    for (const variant of variations) {
      if (imports[variant] || files.has(variant)) {
        found = true;
        break;
      }
    }

    if (!found) {
      // Extract component name from path
      const match = importPath.match(/\/([^\/]+)$/);
      const componentName = match
        ? match[1]
        : importPath.replace(/[^a-zA-Z0-9]/g, "");

      // Create placeholder module
      const requiredExports = allRequestedNamedExports.get(importPath) || new Set<string>();
      const placeholderCode = createPlaceholderModule(componentName, requiredExports);
      const placeholderUrl = createBlobURL(placeholderCode);

      // Add all possible import variations
      imports[importPath] = placeholderUrl;
      if (importPath.startsWith("@/")) {
        imports[importPath.replace("@/", "/")] = placeholderUrl;
        imports[importPath.replace("@/", "")] = placeholderUrl;
      }
    }
  }

  return {
    importMap: JSON.stringify({ imports }, null, 2),
    styles: collectedStyles,
    errors
  };
}

// Helper function to resolve relative paths
function resolveRelativePath(fromDir: string, relativePath: string): string {
  const parts = fromDir.split("/").filter(Boolean);
  const relParts = relativePath.split("/");
  
  for (const part of relParts) {
    if (part === "..") {
      parts.pop();
    } else if (part !== ".") {
      parts.push(part);
    }
  }
  
  return "/" + parts.join("/");
}

export function createPreviewHTML(
  entryPoint: string,
  importMap: string,
  styles: string = "",
  errors: Array<{ path: string; error: string }> = []
): string {
  // Parse the import map to get the blob URL for the entry point
  let entryPointUrl = entryPoint;
  try {
    const importMapObj = JSON.parse(importMap);
    if (importMapObj.imports && importMapObj.imports[entryPoint]) {
      entryPointUrl = importMapObj.imports[entryPoint];
    }
  } catch (e) {
    console.error("Failed to parse import map:", e);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #root {
      width: 100vw;
      height: 100vh;
    }
    .error-boundary {
      color: red;
      padding: 1rem;
      border: 2px solid red;
      margin: 1rem;
      border-radius: 4px;
      background: #fee;
    }
    .syntax-errors {
      background: #fef5f5;
      border: 2px solid #ff6b6b;
      border-radius: 12px;
      padding: 32px;
      margin: 24px;
      font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .syntax-errors h3 {
      color: #dc2626;
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .syntax-errors .error-item {
      margin: 16px 0;
      padding: 16px;
      background: #fff;
      border-radius: 8px;
      border-left: 4px solid #ff6b6b;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .syntax-errors .error-path {
      font-weight: 600;
      color: #991b1b;
      font-size: 15px;
      margin-bottom: 8px;
    }
    .syntax-errors .error-message {
      color: #7c2d12;
      margin-top: 8px;
      white-space: pre-wrap;
      line-height: 1.5;
      font-size: 13px;
    }
    .syntax-errors .error-location {
      display: inline-block;
      background: #fee0e0;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      margin-left: 8px;
      color: #991b1b;
    }
  </style>
  ${styles ? `<style>\n${styles}</style>` : ''}
  <script type="importmap">
    ${importMap}
  </script>
</head>
<body>
  ${errors.length > 0 ? `
    <div class="syntax-errors">
      <h3>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex-shrink: 0;">
          <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15h-2v-2h2v2zm0-4h-2V5h2v6z" fill="#dc2626"/>
        </svg>
        Syntax Error${errors.length > 1 ? 's' : ''} (${errors.length})
      </h3>
      ${errors.map(e => {
        const locationMatch = e.error.match(/\((\d+:\d+)\)/);
        const location = locationMatch ? locationMatch[1] : '';
        const cleanError = e.error.replace(/\(\d+:\d+\)/, '').trim();
        
        return `
        <div class="error-item">
          <div class="error-path">
            ${e.path}
            ${location ? `<span class="error-location">${location}</span>` : ''}
          </div>
          <div class="error-message">${cleanError.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      `;
      }).join('')}
    </div>
  ` : ''}
  <div id="root"></div>
  ${errors.length === 0 ? `<script type="module">
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }

      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }

      componentDidCatch(error, errorInfo) {
        const errorStack = error instanceof Error ? (error.stack || error.message) : String(error);
        console.error('Error caught by boundary:', errorStack, errorInfo);
      }

      render() {
        if (this.state.hasError) {
          const errorMessage = this.state.error instanceof Error ? (this.state.error.stack || this.state.error.message) : String(this.state.error);
          return React.createElement('div', { className: 'error-boundary' },
            React.createElement('h2', null, 'Something went wrong'),
            React.createElement('pre', null, errorMessage)
          );
        }

        return this.props.children;
      }
    }

    async function loadApp() {
      try {
        const module = await import('${entryPointUrl}');
        
        let App = module.default || module.App;
        
        if (!App) {
          // Fallback: Llama sometimes exports components with other names, find any function that looks like a component
          const exports = Object.values(module);
          const component = exports.find(exp => typeof exp === 'function' && exp.name && exp.name[0] === exp.name[0].toUpperCase());
          if (component) {
            App = component;
          }
        }

        if (!App) {
          throw new Error('No default export or App export found in ' + '${entryPoint}' + '. Are you sure you exported a React component?');
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(
          React.createElement(ErrorBoundary, null,
            React.createElement(App)
          )
        );
      } catch (error) {
        console.error('Failed to load app:', error);
        console.error('Import map:', ${JSON.stringify(importMap)});
        document.getElementById('root').innerHTML = '<div class="error-boundary"><h2>Failed to load app</h2><pre>' + error.toString() + '</pre></div>';
      }
    }

    loadApp();
  </script>` : ''}
</body>
</html>`;
}
