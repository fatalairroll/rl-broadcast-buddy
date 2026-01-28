import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Layout, Check } from 'lucide-react';
import { OVERLAY_TEMPLATES, type OverlayTemplate } from '@/config/overlayTemplates';
import type { OverlayConfig } from '@/types/broadcast';

interface TemplateGalleryProps {
  onSelectTemplate: (config: OverlayConfig) => void;
  currentTemplateId?: string;
}

export function TemplateGallery({ onSelectTemplate, currentTemplateId }: TemplateGalleryProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<OverlayTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate.config);
      setDialogOpen(false);
    }
  };

  // Mini preview component for template
  const TemplatePreview = ({ template }: { template: OverlayTemplate }) => {
    const isSelected = currentTemplateId === template.id;
    const config = template.config;
    
    return (
      <div 
        className={`relative w-40 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-md overflow-hidden border-2 transition-all cursor-pointer group ${
          selectedTemplate?.id === template.id 
            ? 'border-primary ring-2 ring-primary/20' 
            : 'border-transparent hover:border-primary/50'
        }`}
        onClick={() => setSelectedTemplate(template)}
      >
        {/* Mini scoreboard */}
        <div 
          className="absolute flex items-center justify-center"
          style={{
            left: '50%',
            top: '8%',
            transform: 'translateX(-50%)',
            backgroundColor: config.scoreboard.backgroundColor,
            borderRadius: config.scoreboard.shape === 'pill' ? 9999 : 
                          config.scoreboard.shape === 'rounded' ? 3 : 0,
            padding: '2px 4px',
            width: config.scoreboard.width * 0.15,
          }}
        >
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-blue-500 opacity-60" />
            <div className="w-2 h-2 rounded bg-slate-700" />
            <div className="w-2 h-2 rounded-sm bg-orange-500 opacity-60" />
          </div>
        </div>

        {/* Mini boost bars left */}
        <div 
          className="absolute left-1"
          style={{ top: `${config.boostBars.verticalPosition}%`, transform: 'translateY(-50%)' }}
        >
          {[1, 2, 3].map(i => (
            <div 
              key={i}
              className="w-8 h-1.5 bg-slate-700 mb-0.5"
              style={{ 
                borderRadius: config.boostBars.shape === 'rounded' ? 2 : 
                              config.boostBars.shape === 'pill' ? 999 : 0 
              }}
            >
              <div 
                className="h-full bg-blue-500/70"
                style={{ 
                  width: `${30 + i * 20}%`,
                  borderRadius: 'inherit'
                }}
              />
            </div>
          ))}
        </div>

        {/* Mini boost bars right */}
        <div 
          className="absolute right-1"
          style={{ top: `${config.boostBars.verticalPosition}%`, transform: 'translateY(-50%)' }}
        >
          {[1, 2, 3].map(i => (
            <div 
              key={i}
              className="w-8 h-1.5 bg-slate-700 mb-0.5"
              style={{ 
                borderRadius: config.boostBars.shape === 'rounded' ? 2 : 
                              config.boostBars.shape === 'pill' ? 999 : 0 
              }}
            >
              <div 
                className="h-full bg-orange-500/70 ml-auto"
                style={{ 
                  width: `${20 + i * 25}%`,
                  borderRadius: 'inherit'
                }}
              />
            </div>
          ))}
        </div>

        {/* Selection checkmark */}
        {selectedTemplate?.id === template.id && (
          <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-primary-foreground" />
          </div>
        )}
        
        {/* Template name overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
          <p className="text-[9px] font-medium text-white truncate">{template.name}</p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Layout className="h-4 w-4" />
          Szablony
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Wybierz szablon startowy</DialogTitle>
          <DialogDescription>
            Wybierz jeden z predefiniowanych szablonów jako punkt wyjścia dla swojego overlay.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {OVERLAY_TEMPLATES.map((template) => (
                <div key={template.id} className="flex flex-col gap-2">
                  <TemplatePreview template={template} />
                  <p className="text-xs text-muted-foreground text-center max-w-40 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Anuluj
          </Button>
          <Button 
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate}
          >
            Zastosuj szablon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
