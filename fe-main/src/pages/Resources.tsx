import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { FileText, Download, PlayCircle, BookOpen, FileCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Resources() {
  const resources = [
    {
      category: "Competition Guides",
      items: [
        { title: "Rocket Competition Rulebook v2.1", type: "PDF", size: "2.4 MB", icon: FileText },
        { title: "AI Challenge Technical Specs", type: "PDF", size: "1.8 MB", icon: FileText },
        { title: "Drone Racing Safety Guidelines", type: "PDF", size: "1.2 MB", icon: FileText },
      ]
    },
    {
      category: "Technical Assets",
      items: [
        { title: "Teknofest 2025 Logo Pack", type: "ZIP", size: "15 MB", icon: Download },
        { title: "Sample Dataset for AI Challenge", type: "CSV", size: "450 MB", icon: FileCode },
        { title: "3D Models for Simulation", type: "OBJ", size: "120 MB", icon: FileCode },
      ]
    },
    {
      category: "Tutorials & Media",
      items: [
        { title: "How to Prepare Your Proposal", type: "Video", duration: "15 min", icon: PlayCircle },
        { title: "Past Winners Showcase", type: "Video", duration: "8 min", icon: PlayCircle },
        { title: "Mentor Guidelines", type: "PDF", size: "800 KB", icon: BookOpen },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-grow pt-28 pb-16 container mx-auto px-4">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">Resources</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Everything you need to succeed in Teknofest competitions. Download rulebooks, technical assets, and educational materials.
          </p>
        </div>

        <div className="grid gap-10">
          {resources.map((section) => (
            <div key={section.category}>
              <h2 className="text-2xl font-bold font-display mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-primary rounded-sm inline-block"></span>
                {section.category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.items.map((item, idx) => (
                  <Card key={idx} className="group hover:border-primary/50 transition-all hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                        <Download className="w-4 h-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-lg font-bold mb-2 line-clamp-2">{item.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span className="bg-secondary px-2 py-0.5 rounded text-xs font-mono text-foreground">{item.type}</span>
                        <span>•</span>
                        <span>{item.size || item.duration}</span>
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
