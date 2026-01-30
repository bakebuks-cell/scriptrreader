import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileCode, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2,
  Key,
  Bot,
  ArrowRight,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserOnboardingProps {
  onComplete: (choice: 'preinstalled' | 'custom') => void;
  hasApiKeys: boolean;
  onAddApiKeys: () => void;
}

export default function UserOnboarding({ 
  onComplete, 
  hasApiKeys, 
  onAddApiKeys 
}: UserOnboardingProps) {
  const [step, setStep] = useState<'exchange' | 'script'>(!hasApiKeys ? 'exchange' : 'script');
  const [selectedChoice, setSelectedChoice] = useState<'preinstalled' | 'custom' | null>(null);

  const handleContinue = () => {
    if (step === 'exchange' && hasApiKeys) {
      setStep('script');
    } else if (step === 'script' && selectedChoice) {
      onComplete(selectedChoice);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
          step === 'exchange' || hasApiKeys 
            ? "bg-primary/10 text-primary" 
            : "bg-muted text-muted-foreground"
        )}>
          {hasApiKeys ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <Key className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">Connect Exchange</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
          step === 'script' 
            ? "bg-primary/10 text-primary" 
            : "bg-muted text-muted-foreground"
        )}>
          <FileCode className="h-5 w-5" />
          <span className="text-sm font-medium">Choose Strategy</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
          "bg-muted text-muted-foreground"
        )}>
          <Bot className="h-5 w-5" />
          <span className="text-sm font-medium">Start Trading</span>
        </div>
      </div>

      {/* Step Content */}
      {step === 'exchange' && !hasApiKeys && (
        <Card className="border-2 border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
              <Key className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Connect Your Exchange</CardTitle>
            <CardDescription className="text-base">
              To start automated trading, you need to connect your Binance account first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium">Step 1</p>
                <p className="text-sm text-muted-foreground">Select your exchange (Binance or Binance US)</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium">Step 2</p>
                <p className="text-sm text-muted-foreground">Whitelist the IP address (optional but recommended)</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium">Step 3</p>
                <p className="text-sm text-muted-foreground">Enter your API Key and Secret</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button onClick={onAddApiKeys} size="lg" className="gap-2">
                <Key className="h-4 w-4" />
                Add Exchange API Keys
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(step === 'script' || hasApiKeys) && (
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
              <Layers className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Choose Your Trading Strategy</CardTitle>
            <CardDescription className="text-base">
              How would you like to set up your trading strategy?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pre-installed Scripts Option */}
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  selectedChoice === 'preinstalled' && "border-primary border-2 bg-primary/5"
                )}
                onClick={() => setSelectedChoice('preinstalled')}
              >
                <CardContent className="p-6 text-center">
                  <div className={cn(
                    "mx-auto mb-4 p-3 rounded-full w-fit",
                    selectedChoice === 'preinstalled' ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Sparkles className={cn(
                      "h-6 w-6",
                      selectedChoice === 'preinstalled' ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Use Pre-installed Scripts</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get started quickly with battle-tested strategies created by our trading experts.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="secondary">Easy Setup</Badge>
                    <Badge variant="secondary">Beginner Friendly</Badge>
                  </div>
                  {selectedChoice === 'preinstalled' && (
                    <div className="mt-4 flex justify-center">
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Custom Script Option */}
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  selectedChoice === 'custom' && "border-primary border-2 bg-primary/5"
                )}
                onClick={() => setSelectedChoice('custom')}
              >
                <CardContent className="p-6 text-center">
                  <div className={cn(
                    "mx-auto mb-4 p-3 rounded-full w-fit",
                    selectedChoice === 'custom' ? "bg-primary/20" : "bg-muted"
                  )}>
                    <FileCode className={cn(
                      "h-6 w-6",
                      selectedChoice === 'custom' ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Create Custom Script</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Build your own trading strategy using Pine Script for complete control.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="secondary">Full Control</Badge>
                    <Badge variant="secondary">Advanced Users</Badge>
                  </div>
                  {selectedChoice === 'custom' && (
                    <div className="mt-4 flex justify-center">
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={handleContinue} 
                size="lg" 
                className="gap-2"
                disabled={!selectedChoice}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
