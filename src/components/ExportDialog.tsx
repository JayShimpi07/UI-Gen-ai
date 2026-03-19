"use client";

import { useState } from "react";
import JSZip from "jszip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Package, Zap } from "lucide-react";
import { useFileSystem } from "@/lib/contexts/file-system-context";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Framework = "vite" | "nextjs";

const frameworks: { id: Framework; name: string; description: string; icon: React.ReactNode }[] = [
  {
    id: "vite",
    name: "React (Vite)",
    description: "Fast, lightweight React project with Vite bundler",
    icon: <Zap className="h-5 w-5 text-purple-400" />,
  },
  {
    id: "nextjs",
    name: "Next.js",
    description: "Full-stack React framework with App Router",
    icon: <Package className="h-5 w-5 text-white/80" />,
  },
];

function getVitePackageJson(projectName: string) {
  return JSON.stringify(
    {
      name: projectName,
      private: true,
      version: "0.1.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview",
      },
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
      },
      devDependencies: {
        "@vitejs/plugin-react": "^4.3.0",
        autoprefixer: "^10.4.19",
        postcss: "^8.4.38",
        tailwindcss: "^4",
        "@tailwindcss/postcss": "^4",
        vite: "^6.0.0",
      },
    },
    null,
    2
  );
}

function getNextPackageJson(projectName: string) {
  return JSON.stringify(
    {
      name: projectName,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
      },
      dependencies: {
        next: "^15.0.0",
        react: "^19.0.0",
        "react-dom": "^19.0.0",
      },
      devDependencies: {
        tailwindcss: "^4",
        "@tailwindcss/postcss": "^4",
      },
    },
    null,
    2
  );
}

function getViteConfig() {
  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
`;
}

function getPostcssConfig() {
  return `export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
`;
}

function getViteIndexHtml() {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
}

function getViteMain() {
  return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`;
}

function getViteIndexCss() {
  return `@import "tailwindcss";\n`;
}

function getNextLayout() {
  return `import './globals.css'

export const metadata = {
  title: 'My App',
  description: 'Generated with UIGen',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`;
}

function getNextPage(hasApp: boolean) {
  if (hasApp) {
    return `'use client'

import App from '@/components/App'

export default function Page() {
  return <App />
}
`;
  }
  return `export default function Page() {
  return <div className="p-8"><h1>Hello World</h1></div>
}
`;
}

function getNextGlobalsCss() {
  return `@import "tailwindcss";\n`;
}

function getNextConfig() {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig
`;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [selectedFramework, setSelectedFramework] = useState<Framework>("vite");
  const [isExporting, setIsExporting] = useState(false);
  const { getAllFiles } = useFileSystem();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const files = getAllFiles();
      const projectName = "uigen-project";

      if (selectedFramework === "vite") {
        // Root config files
        zip.file("package.json", getVitePackageJson(projectName));
        zip.file("vite.config.js", getViteConfig());
        zip.file("postcss.config.js", getPostcssConfig());
        zip.file("index.html", getViteIndexHtml());
        zip.file("src/main.jsx", getViteMain());
        zip.file("src/index.css", getViteIndexCss());

        // Map virtual FS files → src/
        files.forEach((content, path) => {
          const cleanPath = path.startsWith("/") ? path.slice(1) : path;
          zip.file(`src/${cleanPath}`, content);
        });
      } else {
        // Next.js
        zip.file("package.json", getNextPackageJson(projectName));
        zip.file("postcss.config.js", getPostcssConfig());
        zip.file("next.config.js", getNextConfig());
        zip.file("src/app/layout.jsx", getNextLayout());
        zip.file("src/app/globals.css", getNextGlobalsCss());

        const hasApp = files.has("/App.jsx") || files.has("/App.tsx");
        zip.file("src/app/page.jsx", getNextPage(hasApp));

        // Map virtual FS files → src/components/
        files.forEach((content, path) => {
          const cleanPath = path.startsWith("/") ? path.slice(1) : path;
          // Rewrite @/ imports to relative for Next.js
          const fixedContent = content.replace(
            /from\s+['"]@\//g,
            "from '@/components/"
          );
          zip.file(`src/components/${cleanPath}`, fixedContent);
        });
      }

      // Add README
      zip.file(
        "README.md",
        `# ${projectName}\n\nGenerated with [UIGen](https://github.com/uigen)\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`
      );

      // Generate and download
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName}-${selectedFramework}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onOpenChange(false);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] glass border-white/[0.08] bg-[#12122a]/95 backdrop-blur-2xl shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle className="text-white/90 text-lg flex items-center gap-2">
            <Download className="h-5 w-5 text-indigo-400" />
            Export Project
          </DialogTitle>
          <DialogDescription className="text-white/40">
            Download your project as a ready-to-run application
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {frameworks.map((fw) => (
            <button
              key={fw.id}
              onClick={() => setSelectedFramework(fw.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                selectedFramework === fw.id
                  ? "border-indigo-500/40 bg-indigo-500/[0.08]"
                  : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <div className={`p-2.5 rounded-lg ${
                selectedFramework === fw.id ? "bg-indigo-500/15" : "bg-white/[0.04]"
              }`}>
                {fw.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-white/90">{fw.name}</p>
                <p className="text-xs text-white/40 mt-0.5">{fw.description}</p>
              </div>
              {selectedFramework === fw.id && (
                <div className="ml-auto w-2 h-2 rounded-full bg-indigo-400" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="outline"
            className="h-9 text-white/60 border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="h-9 gradient-primary text-white border-0 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 gap-2"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="h-3.5 w-3.5" />
            {isExporting ? "Exporting..." : "Download ZIP"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
